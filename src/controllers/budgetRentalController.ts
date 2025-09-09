import { Request, Response } from 'express';
import BudgetRental from '../models/BudgetRental';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};

    const rentalBudgets = await BudgetRental.find(query).sort({ no: 1 });
    res.json(rentalBudgets);
  } catch (error) {
    console.error('Error fetching rental budgets:', error);
    res.status(500).json({ message: 'Failed to fetch rental budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, rentalBudgets } = req.body;

    if (!year || !Array.isArray(rentalBudgets)) {
      return res.status(400).json({ message: 'Year and rental budgets array are required' });
    }

    // Delete existing rental budgets for the year
    await BudgetRental.deleteMany({ year });

    // Insert new rental budgets
    const rentalBudgetsWithYear = rentalBudgets.map((rental: any) => ({
      ...rental,
      year
    }));

    const savedBudgets = await BudgetRental.insertMany(rentalBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving rental budgets:', error);
    res.status(500).json({ message: 'Failed to save rental budgets' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedRental = await BudgetRental.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedRental) {
      return res.status(404).json({ message: 'Rental budget not found' });
    }
    res.json(updatedRental);
  } catch (error) {
    console.error('Error updating rental budget:', error);
    res.status(500).json({ message: 'Failed to update rental budget' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedRental = await BudgetRental.findByIdAndDelete(id);
    if (!deletedRental) {
      return res.status(404).json({ message: 'Rental budget not found' });
    }
    res.json({ message: 'Rental budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting rental budget:', error);
    res.status(500).json({ message: 'Failed to delete rental budget' });
  }
};
