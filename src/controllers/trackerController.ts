import { Request, Response } from 'express';
import Tracker from '../models/Tracker';
import Employee from '../models/Employee';
import PrepaidCard from '../models/PrepaidCard';

// Create a new tracker entry
export const createTracker = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('Creating tracker with data:', data);
    
    // Validate required fields
    const requiredFields = [
      'month', 'year', 'SR', 'departureMonth', 'date', 'TMR', 'from', 'to', 'departmentRequester',
      'invoicedDate', 'field', 'OTM_PO', 'VPN', 'trailerNumber', 'trailerType', 'EMP', 'name', 
      'nationality', 'passport', 'residencyNumber', 'contact', 'dateLoaded', 'timeLoaded', 
      'returnedDate', 'returnedTime', 'durationTripTime', 'daysInMission', 'kmAtOrigin', 
      'kmOnceReturned', 'totalKmPerTrip', 'tripAllowanceInKWD'
    ];
    
    // Add water-related fields to required fields only if it's a water trip
    if (data.isWaterTrip === 'yes') {
      requiredFields.push('waterCardNo', 'gallons');
    }
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    // Optionally validate EMP exists in Employee
    const emp = await Employee.findById(data.EMP);
    if (!emp) {
      return res.status(400).json({ message: 'EMP (Employee) not found' });
    }
    // Water card balance management
    if (data.isWaterTrip === 'yes') {
      const card = await PrepaidCard.findOne({ cardId: data.waterCardNo });
      if (!card) {
        return res.status(400).json({ message: 'Water Card not found' });
      }
      if (card.status === 'Blocked' || card.balance <= 0) {
        return res.status(400).json({ message: 'This water card is expired or blocked. Please use another card.' });
      }
      if (typeof data.gallons !== 'number' || isNaN(data.gallons) || data.gallons <= 0) {
        return res.status(400).json({ message: 'Gallons must be a positive number.' });
      }
      if (card.balance < data.gallons) {
        card.balance = 0;
        card.status = 'Blocked';
        await card.save();
        return res.status(400).json({ message: 'Not enough balance on this water card. Card is now expired.' });
      }
      card.balance -= data.gallons;
      if (card.balance === 0) {
        card.status = 'Blocked';
      }
      card.lastUsed = new Date();
      await card.save();
    }
    const tracker = new Tracker(data);
    await tracker.save();
    console.log('Saved tracker:', tracker);
    res.status(201).json(tracker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tracker entries, with optional month/year filter
export const getTrackers = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const filter: any = {};
    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    const trackers = await Tracker.find(filter).populate('EMP', 'name employeeId');
    res.json(trackers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single tracker entry by ID
export const getTrackerById = async (req: Request, res: Response) => {
  try {
    const tracker = await Tracker.findById(req.params.id).populate('EMP', 'name employeeId');
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker entry not found' });
    }
    res.json(tracker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a tracker entry
export const updateTracker = async (req: Request, res: Response) => {
  try {
    const tracker = await Tracker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker entry not found' });
    }
    res.json(tracker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a tracker entry
export const deleteTracker = async (req: Request, res: Response) => {
  try {
    const tracker = await Tracker.findByIdAndDelete(req.params.id);
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker entry not found' });
    }
    res.json({ message: 'Tracker entry deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all water trips (isWaterTrip === 'yes')
export const getWaterTrips = async (req: Request, res: Response) => {
  try {
    const waterTrips = await Tracker.find({ isWaterTrip: 'yes' })
      .select('waterCardNo gallons date TMR from to departmentRequester VPN trailerNumber name contact dateLoaded returnedDate')
      .sort({ date: -1 });
    res.json(waterTrips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all tracker trips eligible for trip allowance (totalKmPerTrip >= 40)
export const getEligibleTripAllowanceTrips = async (req: Request, res: Response) => {
  try {
    console.log('Fetching eligible trips...');
    
    // First, let's check all tracker entries to see what field names are being used
    const allTrackers = await Tracker.find({});
    console.log('All tracker entries:', allTrackers.map(t => ({
      id: t._id,
      totalKmPerTrip: t.totalKmPerTrip,
      totalKMPerTrip: (t as any).totalKMPerTrip,
      'TotalKMPerTrip': (t as any).TotalKMPerTrip
    })));
    
    const eligibleTrips = await Tracker.find({ totalKmPerTrip: { $gte: 40 } })
      .select('SR name nationality residencyNumber EMP totalKmPerTrip');
    console.log('Eligible trips:', eligibleTrips);
    res.json(eligibleTrips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 