import { Request, Response } from 'express';
import Tariff from '../models/Tariff';

export const createTariff = async (req: Request, res: Response): Promise<void> => {
  try {
    const tariff = new Tariff(req.body);
    await tariff.save();
    res.status(201).json(tariff);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTariffs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetType, mainCategory, subCategory, pricingType } = req.query;
    const filter: any = { isActive: true };
    
    if (assetType) filter.assetType = assetType;
    if (mainCategory) filter.mainCategory = mainCategory;
    if (subCategory) filter.subCategory = subCategory;
    if (pricingType) filter.pricingType = pricingType;
    
    const tariffs = await Tariff.find(filter).sort({ effectiveDate: -1 });
    res.json(tariffs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTariff = async (req: Request, res: Response): Promise<void> => {
  try {
    const tariff = await Tariff.findById(req.params.id);
    if (!tariff) {
      res.status(404).json({ message: 'Tariff not found' });
      return;
    }
    res.json(tariff);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTariff = async (req: Request, res: Response): Promise<void> => {
  try {
    const tariff = await Tariff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tariff) {
      res.status(404).json({ message: 'Tariff not found' });
      return;
    }
    res.json(tariff);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTariff = async (req: Request, res: Response): Promise<void> => {
  try {
    const tariff = await Tariff.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!tariff) {
      res.status(404).json({ message: 'Tariff not found' });
      return;
    }
    res.json({ message: 'Tariff deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const calculateRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetType, mainCategory, subCategory, pricingType, startTime, endTime } = req.body;
    
    if (!assetType || !mainCategory || !subCategory || !pricingType || !startTime || !endTime) {
      res.status(400).json({ message: 'Missing required fields for revenue calculation' });
      return;
    }

    // Find applicable tariff
    const tariff = await Tariff.findOne({
      assetType,
      mainCategory,
      subCategory,
      pricingType,
      isActive: true,
      effectiveDate: { $lte: new Date() },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    });

    if (!tariff) {
      res.status(404).json({ message: 'No applicable tariff found' });
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationMs = endDate.getTime() - startDate.getTime();

    let duration: number;
    let revenue: number;

    switch (pricingType) {
      case 'per_hour':
        duration = durationMs / (1000 * 60 * 60); // Convert to hours
        revenue = duration * tariff.rate;
        break;
      case 'per_day':
        duration = durationMs / (1000 * 60 * 60 * 24); // Convert to days
        revenue = duration * tariff.rate;
        break;
      case 'per_month':
        duration = durationMs / (1000 * 60 * 60 * 24 * 30); // Convert to months (approximate)
        revenue = duration * tariff.rate;
        break;
      default:
        res.status(400).json({ message: 'Invalid pricing type' });
        return;
    }

    res.json({
      tariff: {
        rate: tariff.rate,
        currency: tariff.currency,
        pricingType: tariff.pricingType,
        description: tariff.description
      },
      duration,
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
      calculationDetails: {
        startTime: startDate,
        endTime: endDate,
        durationMs,
        durationUnit: pricingType === 'per_hour' ? 'hours' : pricingType === 'per_day' ? 'days' : 'months'
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApplicableTariffs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetType, mainCategory, subCategory } = req.query;
    
    const filter: any = { isActive: true };
    if (assetType) filter.assetType = assetType;
    if (mainCategory) filter.mainCategory = mainCategory;
    if (subCategory) filter.subCategory = subCategory;
    
    const tariffs = await Tariff.find(filter)
      .sort({ effectiveDate: -1 })
      .select('pricingType rate currency description');
    
    res.json(tariffs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 