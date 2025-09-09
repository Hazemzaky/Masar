import { Request, Response } from 'express';
import BudgetITOpex from '../models/BudgetITOpex';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    
    const itOpexBudgets = await BudgetITOpex.find(query).sort({ sr: 1 });
    res.json(itOpexBudgets);
  } catch (error) {
    console.error('Error fetching IT OPEX budgets:', error);
    res.status(500).json({ message: 'Failed to fetch IT OPEX budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, itOpexBudgets } = req.body;
    
    if (!year || !Array.isArray(itOpexBudgets)) {
      return res.status(400).json({ message: 'Year and IT OPEX budgets array are required' });
    }

    // Delete existing IT OPEX budgets for the year
    await BudgetITOpex.deleteMany({ year });

    // Insert new IT OPEX budgets
    const itOpexBudgetsWithYear = itOpexBudgets.map((itOpex: any) => ({
      ...itOpex,
      year
    }));

    const savedBudgets = await BudgetITOpex.insertMany(itOpexBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving IT OPEX budgets:', error);
    res.status(500).json({ message: 'Failed to save IT OPEX budgets' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, itOpexBudgets } = req.body;
    
    if (!year || !Array.isArray(itOpexBudgets)) {
      return res.status(400).json({ message: 'Year and IT OPEX budgets array are required' });
    }

    // Delete existing IT OPEX budgets for the year
    await BudgetITOpex.deleteMany({ year });

    // Insert new IT OPEX budgets
    const itOpexBudgetsWithYear = itOpexBudgets.map((itOpex: any) => ({
      ...itOpex,
      year
    }));

    const savedBudgets = await BudgetITOpex.insertMany(itOpexBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error bulk saving IT OPEX budgets:', error);
    res.status(500).json({ message: 'Failed to bulk save IT OPEX budgets' });
  }
};
