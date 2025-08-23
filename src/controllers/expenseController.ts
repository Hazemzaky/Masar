import { Request, Response } from 'express';
import Expense from '../models/Expense';
import { isPeriodClosed } from '../models/Period';
import Income from '../models/Income';
import { generateSerial } from '../utils/serialUtils';

export const createExpense = async (
  req: Request & { file?: Express.Multer.File },
  res: Response
): Promise<void> => {
  try {
    const { amount, description, date, category, invoice, currency, depreciationStart, depreciationEnd, managementDepartment, customType } = req.body;
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (!amount || !description || !date || !category) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const period = date ? new Date(date).toISOString().slice(0, 7) : undefined;
    if (period && await isPeriodClosed(period)) {
      res.status(403).json({ message: 'This period is locked and cannot be edited.' });
      return;
    }
    const proofUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const serial = await generateSerial('EX', managementDepartment, Expense);
    const expense = new Expense({
      amount,
      description,
      date,
      category: category === 'other' ? customType : category,
      user: userId,
      invoice,
      currency,
      depreciationStart,
      depreciationEnd,
      managementDepartment,
      proofUrl,
      customType: category === 'other' ? customType : undefined,
      serial,
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error in createExpense:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    let expenses = await Expense.find().populate('submittedBy').populate('vendor');
    expenses = expenses.filter(e => e.submittedBy);
    res.json(expenses);
  } catch (error) {
    console.error('Error in getExpenses:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findById(req.params.id).populate('submittedBy').populate('vendor');
    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }
    res.json(expense);
  } catch (error) {
    console.error('Error in getExpense:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.body;
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    const period = date ? new Date(date).toISOString().slice(0, 7) : undefined;
    if (period && await isPeriodClosed(period)) {
      res.status(403).json({ message: 'This period is locked and cannot be edited.' });
      return;
    }
    const updateData = { ...req.body, updatedBy: userId };
    const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }
    res.json(expense);
  } catch (error) {
    console.error('Error in updateExpense:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description, date, currency, managementDepartment } = req.body;
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (!amount || !description || !date) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const serial = await generateSerial('IN', managementDepartment, Income);
    const income = new Income({
      amount,
      description,
      date,
      currency,
      managementDepartment,
      submittedBy: userId,
      createdBy: userId,
      updatedBy: userId,
      serial,
    });
    await income.save();
    res.status(201).json(income);
  } catch (error) {
    console.error('Error in createIncome:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const income = await Income.find().populate('submittedBy');
    res.json(income);
  } catch (error) {
    console.error('Error in getIncome:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 
