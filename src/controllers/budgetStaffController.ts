import { Request, Response } from 'express';
import BudgetStaffDatabase from '../models/BudgetStaffDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    
    const staffBudgets = await BudgetStaffDatabase.find(query).sort({ no: 1 });
    res.json(staffBudgets);
  } catch (error) {
    console.error('Error fetching Staff budgets:', error);
    res.status(500).json({ message: 'Failed to fetch Staff budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, staffBudgets } = req.body;
    
    if (!year || !Array.isArray(staffBudgets)) {
      return res.status(400).json({ message: 'Year and Staff budgets array are required' });
    }

    // Delete existing Staff budgets for the year
    await BudgetStaffDatabase.deleteMany({ year });

    // Insert new Staff budgets
    const staffBudgetsWithYear = staffBudgets.map((staff: any) => ({
      ...staff,
      year
    }));

    const savedBudgets = await BudgetStaffDatabase.insertMany(staffBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving Staff budgets:', error);
    res.status(500).json({ message: 'Failed to save Staff budgets' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, staffBudgets } = req.body;
    
    if (!year || !Array.isArray(staffBudgets)) {
      return res.status(400).json({ message: 'Year and Staff budgets array are required' });
    }

    // Delete existing Staff budgets for the year
    await BudgetStaffDatabase.deleteMany({ year });

    // Insert new Staff budgets
    const staffBudgetsWithYear = staffBudgets.map((staff: any) => ({
      ...staff,
      year
    }));

    const savedBudgets = await BudgetStaffDatabase.insertMany(staffBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error bulk saving Staff budgets:', error);
    res.status(500).json({ message: 'Failed to bulk save Staff budgets' });
  }
};
