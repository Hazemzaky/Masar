import { Request, Response } from 'express';
import BudgetGADatabase from '../models/BudgetGADatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    
    const gaBudgets = await BudgetGADatabase.find(query).sort({ no: 1 });
    res.json(gaBudgets);
  } catch (error) {
    console.error('Error fetching GA budgets:', error);
    res.status(500).json({ message: 'Failed to fetch GA budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, gaBudgets } = req.body;
    
    if (!year || !Array.isArray(gaBudgets)) {
      return res.status(400).json({ message: 'Year and GA budgets array are required' });
    }

    // Delete existing GA budgets for the year
    await BudgetGADatabase.deleteMany({ year });

    // Insert new GA budgets
    const gaBudgetsWithYear = gaBudgets.map((ga: any) => ({
      ...ga,
      year,
      budgetTotal: (ga.budget1stQuarter || 0) + (ga.budget2ndQuarter || 0) + (ga.budget3rdQuarter || 0)
    }));

    const savedBudgets = await BudgetGADatabase.insertMany(gaBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving GA budgets:', error);
    res.status(500).json({ message: 'Failed to save GA budgets' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, gaBudgets } = req.body;
    
    if (!year || !Array.isArray(gaBudgets)) {
      return res.status(400).json({ message: 'Year and GA budgets array are required' });
    }

    // Delete existing GA budgets for the year
    await BudgetGADatabase.deleteMany({ year });

    // Insert new GA budgets
    const gaBudgetsWithYear = gaBudgets.map((ga: any) => ({
      ...ga,
      year,
      budgetTotal: (ga.budget1stQuarter || 0) + (ga.budget2ndQuarter || 0) + (ga.budget3rdQuarter || 0)
    }));

    const savedBudgets = await BudgetGADatabase.insertMany(gaBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error bulk saving GA budgets:', error);
    res.status(500).json({ message: 'Failed to bulk save GA budgets' });
  }
};
