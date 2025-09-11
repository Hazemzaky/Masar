import { Request, Response } from 'express';
import BudgetOthersDatabase from '../models/BudgetOthersDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};

    const othersBudgets = await BudgetOthersDatabase.find(query).sort({ no: 1 });
    res.json(othersBudgets);
  } catch (error) {
    console.error('Error fetching others budgets:', error);
    res.status(500).json({ message: 'Failed to fetch others budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, othersBudgets } = req.body;

    if (!year || !Array.isArray(othersBudgets)) {
      return res.status(400).json({ message: 'Year and others budgets array are required' });
    }

    // Delete existing others budgets for the year
    await BudgetOthersDatabase.deleteMany({ year });

    // Insert new others budgets
    const othersBudgetsWithYear = othersBudgets.map((others: any) => ({
      ...others,
      year
    }));

    const savedBudgets = await BudgetOthersDatabase.insertMany(othersBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving others budgets:', error);
    res.status(500).json({ message: 'Failed to save others budgets' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedOthers = await BudgetOthersDatabase.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedOthers) {
      return res.status(404).json({ message: 'Others budget not found' });
    }
    res.json(updatedOthers);
  } catch (error) {
    console.error('Error updating others budget:', error);
    res.status(500).json({ message: 'Failed to update others budget' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedOthers = await BudgetOthersDatabase.findByIdAndDelete(id);
    if (!deletedOthers) {
      return res.status(404).json({ message: 'Others budget not found' });
    }
    res.json({ message: 'Others budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting others budget:', error);
    res.status(500).json({ message: 'Failed to delete others budget' });
  }
};
