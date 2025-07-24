import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';

// List unreconciled transactions (stub)
export const getUnreconciled = async (req: Request, res: Response) => {
  try {
    // In real use, filter for unreconciled expenses/invoices
    const unreconciled = await Expense.find({ reconciled: { $ne: true } }).limit(20);
    res.json(unreconciled);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get unreconciled transactions', error: err });
  }
};

// List reconciled transactions (stub)
export const getReconciled = async (req: Request, res: Response) => {
  try {
    const reconciled = await Expense.find({ reconciled: true }).limit(20);
    res.json(reconciled);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get reconciled transactions', error: err });
  }
};

// Mark transaction as reconciled (stub)
export const markReconciled = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await Expense.findByIdAndUpdate(id, { reconciled: true });
    res.json({ message: 'Transaction marked as reconciled' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as reconciled', error: err });
  }
};

// Upload bank statement (stub)
export const uploadBankStatement = async (req: Request, res: Response) => {
  try {
    // In real use, parse uploaded file and match transactions
    res.json({ message: 'Bank statement uploaded (stub)' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload bank statement', error: err });
  }
}; 