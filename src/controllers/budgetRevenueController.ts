import { Request, Response } from 'express';
import BudgetRevenueDatabase from '../models/BudgetRevenueDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    const docs = await BudgetRevenueDatabase.find(query).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Error fetching budget revenue:', error);
    res.status(500).json({ message: 'Failed to fetch budget revenue data' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { no, revenues, forecastedYearEnded, budget1stQuarter, budget2ndQuarter, budget3rdQuarter, budgetTotal, year } = req.body;
    
    const budgetData = {
      no,
      revenues,
      forecastedYearEnded,
      budget1stQuarter,
      budget2ndQuarter,
      budget3rdQuarter,
      budgetTotal,
      year: year || new Date().getFullYear()
    };

    const doc = await BudgetRevenueDatabase.findOneAndUpdate(
      { no, year: budgetData.year },
      budgetData,
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (error) {
    console.error('Error saving budget revenue:', error);
    res.status(500).json({ message: 'Failed to save budget revenue data' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { no, revenues, forecastedYearEnded, budget1stQuarter, budget2ndQuarter, budget3rdQuarter, budgetTotal, year } = req.body;
    
    const budgetData = {
      no,
      revenues,
      forecastedYearEnded,
      budget1stQuarter,
      budget2ndQuarter,
      budget3rdQuarter,
      budgetTotal,
      year: year || new Date().getFullYear()
    };

    const doc = await BudgetRevenueDatabase.findByIdAndUpdate(id, budgetData, { new: true });
    if (!doc) {
      return res.status(404).json({ message: 'Budget revenue record not found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error updating budget revenue:', error);
    res.status(500).json({ message: 'Failed to update budget revenue data' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await BudgetRevenueDatabase.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ message: 'Budget revenue record not found' });
    }
    res.json({ message: 'Budget revenue record deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget revenue:', error);
    res.status(500).json({ message: 'Failed to delete budget revenue data' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, budgets } = req.body;
    const targetYear = year || new Date().getFullYear();
    
    // Delete existing budgets for the year
    await BudgetRevenueDatabase.deleteMany({ year: targetYear });
    
    // Insert new budgets
    const docs = await BudgetRevenueDatabase.insertMany(
      budgets.map((budget: any) => ({ ...budget, year: targetYear }))
    );
    res.json(docs);
  } catch (error) {
    console.error('Error bulk saving budget revenue:', error);
    res.status(500).json({ message: 'Failed to bulk save budget revenue data' });
  }
}; 