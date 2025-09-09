import { Request, Response } from 'express';
import BudgetManpower from '../models/BudgetManpower';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    
    const manpower = await BudgetManpower.find(query).sort({ coId: 1 });
    res.json(manpower);
  } catch (error) {
    console.error('Error fetching manpower data:', error);
    res.status(500).json({ message: 'Failed to fetch manpower data' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { manpowerData } = req.body;
    
    if (!manpowerData || !Array.isArray(manpowerData)) {
      return res.status(400).json({ message: 'Invalid manpower data format' });
    }

    // Delete existing data for the year
    if (manpowerData.length > 0) {
      await BudgetManpower.deleteMany({ year: manpowerData[0].year });
    }

    // Insert new data
    const savedManpower = await BudgetManpower.insertMany(manpowerData);
    res.json({ message: 'Manpower data saved successfully', data: savedManpower });
  } catch (error) {
    console.error('Error saving manpower data:', error);
    res.status(500).json({ message: 'Failed to save manpower data' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, manpower } = req.body;
    
    if (!year || !manpower || !Array.isArray(manpower)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Delete existing data for the year
    await BudgetManpower.deleteMany({ year });

    // Insert new data
    const manpowerWithYear = manpower.map((item: any) => ({ ...item, year }));
    const savedManpower = await BudgetManpower.insertMany(manpowerWithYear);
    
    res.json({ message: 'Manpower data saved successfully', data: savedManpower });
  } catch (error) {
    console.error('Error saving manpower data:', error);
    res.status(500).json({ message: 'Failed to save manpower data' });
  }
};
