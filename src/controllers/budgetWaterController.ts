import { Request, Response } from 'express';
import BudgetWaterDatabase from '../models/BudgetWaterDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};

    const waterBudgets = await BudgetWaterDatabase.find(query).sort({ no: 1 });
    res.json(waterBudgets);
  } catch (error) {
    console.error('Error fetching water budgets:', error);
    res.status(500).json({ message: 'Failed to fetch water budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, waterBudgets } = req.body;

    if (!year || !Array.isArray(waterBudgets)) {
      return res.status(400).json({ message: 'Year and water budgets array are required' });
    }

    // Delete existing water budgets for the year
    await BudgetWaterDatabase.deleteMany({ year });

    // Insert new water budgets
    const waterBudgetsWithYear = waterBudgets.map((water: any) => ({
      ...water,
      year
    }));

    const savedBudgets = await BudgetWaterDatabase.insertMany(waterBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving water budgets:', error);
    res.status(500).json({ message: 'Failed to save water budgets' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedWater = await BudgetWaterDatabase.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedWater) {
      return res.status(404).json({ message: 'Water budget not found' });
    }
    res.json(updatedWater);
  } catch (error) {
    console.error('Error updating water budget:', error);
    res.status(500).json({ message: 'Failed to update water budget' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedWater = await BudgetWaterDatabase.findByIdAndDelete(id);
    if (!deletedWater) {
      return res.status(404).json({ message: 'Water budget not found' });
    }
    res.json({ message: 'Water budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting water budget:', error);
    res.status(500).json({ message: 'Failed to delete water budget' });
  }
};
