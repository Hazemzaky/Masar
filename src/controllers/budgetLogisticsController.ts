import { Request, Response } from 'express';
import BudgetLogisticsDatabase from '../models/BudgetLogisticsDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};

    const logisticsBudgets = await BudgetLogisticsDatabase.find(query).sort({ no: 1 });
    res.json(logisticsBudgets);
  } catch (error) {
    console.error('Error fetching logistics budgets:', error);
    res.status(500).json({ message: 'Failed to fetch logistics budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, logisticsBudgets } = req.body;

    if (!year || !Array.isArray(logisticsBudgets)) {
      return res.status(400).json({ message: 'Year and logistics budgets array are required' });
    }

    // Delete existing logistics budgets for the year
    await BudgetLogisticsDatabase.deleteMany({ year });

    // Insert new logistics budgets
    const logisticsBudgetsWithYear = logisticsBudgets.map((logistics: any) => ({
      ...logistics,
      year
    }));

    const savedBudgets = await BudgetLogisticsDatabase.insertMany(logisticsBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving logistics budgets:', error);
    res.status(500).json({ message: 'Failed to save logistics budgets' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedLogistics = await BudgetLogisticsDatabase.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedLogistics) {
      return res.status(404).json({ message: 'Logistics budget not found' });
    }
    res.json(updatedLogistics);
  } catch (error) {
    console.error('Error updating logistics budget:', error);
    res.status(500).json({ message: 'Failed to update logistics budget' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedLogistics = await BudgetLogisticsDatabase.findByIdAndDelete(id);
    if (!deletedLogistics) {
      return res.status(404).json({ message: 'Logistics budget not found' });
    }
    res.json({ message: 'Logistics budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting logistics budget:', error);
    res.status(500).json({ message: 'Failed to delete logistics budget' });
  }
};
