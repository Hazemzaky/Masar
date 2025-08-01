import { Request, Response } from 'express';
import WaterLog from '../models/WaterLog';
import Client from '../models/Client';
import PrepaidCard from '../models/PrepaidCard';
import Employee from '../models/Employee';
import moment from 'moment';

// 1. List water logs with filters
export async function getWaterLogs(req: Request, res: Response) {
  try {
    const { from, to, client, station, status, search, prepaidCard, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (from || to) filter.dateTime = {};
    if (from) filter.dateTime.$gte = new Date(from as string);
    if (to) filter.dateTime.$lte = new Date(to as string);
    if (client) filter.client = client;
    if (station) filter.station = station;
    if (status) filter.status = status;
    if (prepaidCard) filter.prepaidCard = prepaidCard;
    if (search) {
      filter.$or = [
        { cardId: { $regex: search, $options: 'i' } },
        { tankerPlateNo: { $regex: search, $options: 'i' } },
      ];
    }
    const logs = await WaterLog.find(filter)
      .populate('client')
      .populate('filledBy')
      .sort({ dateTime: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await WaterLog.countDocuments(filter);
    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 2. Get single log
export async function getWaterLog(req: Request, res: Response) {
  try {
    const log = await WaterLog.findById(req.params.id).populate('client').populate('filledBy');
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 3. Create log
export async function createWaterLog(req: Request, res: Response) {
  try {
    const { prepaidCard, totalCost } = req.body;
    let cardDoc = null;
    if (prepaidCard) {
      cardDoc = await PrepaidCard.findById(prepaidCard);
      if (!cardDoc) return res.status(400).json({ message: 'Prepaid card not found' });
      if (cardDoc.status !== 'Active') return res.status(400).json({ message: 'Card is blocked' });
      if (cardDoc.balance < totalCost) {
        cardDoc.status = 'Blocked';
        await cardDoc.save();
        return res.status(400).json({ message: 'Insufficient balance. Card blocked.' });
      }
      cardDoc.balance -= totalCost;
      cardDoc.lastUsed = new Date();
      await cardDoc.save();
    }
    const log = new WaterLog({ ...req.body, prepaidCard: prepaidCard || undefined });
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 4. Update log
export async function updateWaterLog(req: Request, res: Response) {
  try {
    const log = await WaterLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 5. Delete log
export async function deleteWaterLog(req: Request, res: Response) {
  try {
    const log = await WaterLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 6. Summary dashboard
export async function getWaterLogSummary(req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    // Total dispensed today
    const todayAgg = await WaterLog.aggregate([
      { $match: { dateTime: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$volume' }, tankers: { $addToSet: '$tankerPlateNo' } } }
    ]);
    // Total dispensed this month
    const monthAgg = await WaterLog.aggregate([
      { $match: { dateTime: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$volume' }, tankers: { $addToSet: '$tankerPlateNo' } } }
    ]);
    // Top 5 clients by volume
    const topClients = await WaterLog.aggregate([
      { $group: { _id: '$client', total: { $sum: '$volume' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
      { $unwind: '$client' }
    ]);
    // Top stations by usage
    const topStations = await WaterLog.aggregate([
      { $group: { _id: '$station', total: { $sum: '$volume' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);
    // Prepaid balance alerts (real)
    const prepaidAlerts = await PrepaidCard.find({ balance: { $lt: 200 }, status: 'Active' }).populate('client');
    res.json({
      todayDispensed: todayAgg[0]?.total || 0,
      todayTankers: todayAgg[0]?.tankers?.length || 0,
      monthDispensed: monthAgg[0]?.total || 0,
      monthTankers: monthAgg[0]?.tankers?.length || 0,
      topClients,
      topStations,
      prepaidAlerts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 7. Prepaid card management (dummy)
export async function getPrepaidCards(req: Request, res: Response) {
  try {
    const cards = await PrepaidCard.find().populate('client');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

export async function createPrepaidCard(req: Request, res: Response) {
  try {
    const { cardId, client, balance } = req.body;
    
    // Validate required fields
    if (!cardId || !client || balance === undefined) {
      return res.status(400).json({ message: 'Card ID, client, and balance are required' });
    }
    
    // Check if card already exists
    const existingCard = await PrepaidCard.findOne({ cardId });
    if (existingCard) {
      return res.status(400).json({ message: 'Card with this ID already exists' });
    }
    
    // Find or create client
    let clientDoc = await Client.findOne({ name: client });
    if (!clientDoc) {
      // Create new client if it doesn't exist
      clientDoc = new Client({
        name: client,
        type: 'contract' // Default type
      });
      await clientDoc.save();
    }
    
    // Create new card with client ObjectId
    const card = new PrepaidCard({
      cardId,
      client: clientDoc._id, // Use the client ObjectId
      balance: Number(balance),
      status: 'Active',
      lastUsed: new Date()
    });
    
    await card.save();
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}
export async function rechargePrepaidCard(req: Request, res: Response) {
  try {
    const { cardId, amount } = req.body;
    const card = await PrepaidCard.findOne({ cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    card.balance += Number(amount);
    card.status = 'Active';
    await card.save();
    res.json({ message: 'Recharged', card });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}
export async function blockActivatePrepaidCard(req: Request, res: Response) {
  try {
    const { cardId, action } = req.body; // action: 'block' or 'activate'
    const card = await PrepaidCard.findOne({ cardId });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    card.status = action === 'block' ? 'Blocked' : 'Active';
    await card.save();
    res.json({ message: 'Status updated', card });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 8. Station activity tracker (dummy)
export async function getStationActivity(req: Request, res: Response) {
  try {
    // Dummy data
    res.json([
      { station: 'Station A', status: 'Online', lastDispense: '2024-07-15T10:00:00Z', operator: 'John Doe' },
      { station: 'Station B', status: 'Offline', lastDispense: '2024-07-15T08:30:00Z', operator: 'Jane Smith' },
    ]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// 9. Alerts & exceptions (dummy)
export async function getAlerts(req: Request, res: Response) {
  try {
    // Failed cards: last 10 failed logs
    const failedCards = await WaterLog.find({ status: 'failed' }).sort({ dateTime: -1 }).limit(10).populate('client');
    // Manual fills: last 10 manual logs
    const manualFills = await WaterLog.find({ status: 'manual' }).sort({ dateTime: -1 }).limit(10).populate('client');
    // Suspicious logs: volume > 20000
    const suspiciousLogs = await WaterLog.find({ volume: { $gt: 20000 } }).sort({ dateTime: -1 }).limit(10).populate('client');
    // Tamper alerts
    const tamperAlerts = await WaterLog.find({ status: 'tamper' }).sort({ dateTime: -1 }).limit(10).populate('client');
    res.json({ failedCards, manualFills, suspiciousLogs, tamperAlerts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

export async function getClientWaterUsageChart(req: Request, res: Response) {
  try {
    // Get last 8 weeks
    const startDate = moment().subtract(7, 'weeks').startOf('isoWeek').toDate();
    const usage = await WaterLog.aggregate([
      { $match: { dateTime: { $gte: startDate } } },
      {
        $group: {
          _id: {
            client: '$client',
            week: { $isoWeek: '$dateTime' },
            year: { $isoWeekYear: '$dateTime' }
          },
          total: { $sum: '$volume' }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id.client',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $project: {
          client: '$client.name',
          week: '$_id.week',
          year: '$_id.year',
          total: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, client: 1 } }
    ]);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

export async function getCardUsageLimits(req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // ISO week start (Monday)
    // Aggregate dispenses today
    const dispensesToday = await WaterLog.aggregate([
      { $match: { dateTime: { $gte: today } } },
      { $group: { _id: '$cardId', count: { $sum: 1 } } }
    ]);
    // Aggregate volume this week
    const volumeThisWeek = await WaterLog.aggregate([
      { $match: { dateTime: { $gte: weekStart } } },
      { $group: { _id: '$cardId', total: { $sum: '$volume' } } }
    ]);
    // Get all cards
    const cards = await PrepaidCard.find().populate('client');
    // Build result
    const result = cards.map(card => {
      const todayObj = dispensesToday.find(d => d._id === card.cardId);
      const weekObj = volumeThisWeek.find(d => d._id === card.cardId);
      return {
        cardId: card.cardId,
        client: typeof card.client === 'object' && card.client !== null && 'name' in card.client ? (card.client as any).name : '-',
        dispensesToday: todayObj ? todayObj.count : 0,
        volumeThisWeek: weekObj ? weekObj.total : 0,
        status: card.status,
      };
    }).filter(row => row.dispensesToday > 3 || row.volumeThisWeek > 20000);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
} 