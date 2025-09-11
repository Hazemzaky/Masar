import { Request, Response } from 'express';
import BudgetOpexDatabase from '../models/BudgetOpexDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    
    const opexBudgets = await BudgetOpexDatabase.find(query).sort({ sr: 1 });
    res.json(opexBudgets);
  } catch (error) {
    console.error('Error fetching OPEX budgets:', error);
    res.status(500).json({ message: 'Failed to fetch OPEX budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, opexBudgets } = req.body;
    
    if (!year || !Array.isArray(opexBudgets)) {
      return res.status(400).json({ message: 'Year and OPEX budgets array are required' });
    }

    // Delete existing OPEX budgets for the year
    await BudgetOpexDatabase.deleteMany({ year });

    // Insert new OPEX budgets
    const opexBudgetsWithYear = opexBudgets.map((opex: any) => ({
      ...opex,
      year
    }));

    const savedBudgets = await BudgetOpexDatabase.insertMany(opexBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving OPEX budgets:', error);
    res.status(500).json({ message: 'Failed to save OPEX budgets' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, opexBudgets } = req.body;
    
    if (!year || !Array.isArray(opexBudgets)) {
      return res.status(400).json({ message: 'Year and OPEX budgets array are required' });
    }

    // Delete existing OPEX budgets for the year
    await BudgetOpexDatabase.deleteMany({ year });

    // Insert new OPEX budgets
    const opexBudgetsWithYear = opexBudgets.map((opex: any) => ({
      ...opex,
      year
    }));

    const savedBudgets = await BudgetOpexDatabase.insertMany(opexBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error bulk saving OPEX budgets:', error);
    res.status(500).json({ message: 'Failed to bulk save OPEX budgets' });
  }
}; 