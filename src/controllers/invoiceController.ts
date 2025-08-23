import { Request, Response } from 'express';
import Invoice, { IInvoice } from '../models/Invoice';
import mongoose from 'mongoose';

export const uploadInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    const { expenseId } = req.body;
    const invoice = new Invoice({
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: userId,
      expense: expenseId,
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error in uploadInvoice:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.find().populate('uploadedBy').populate('expense');
    res.json(invoices);
  } catch (error) {
    console.error('Error in getInvoices:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create a new invoice with line items, recipient, due date, etc.
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    const { recipient, dueDate, lineItems, fileUrl, serial } = req.body;
    if (!recipient || !dueDate || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const invoice = new Invoice({
      fileUrl,
      uploadedBy: userId,
      dueDate,
      recipient,
      lineItems,
      totalAmount,
      status: 'draft',
      serial,
      submittedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error in createInvoice:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update invoice status (sent, paid, overdue)
export const updateInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }
    invoice.status = status;
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    console.error('Error in updateInvoiceStatus:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Aging report: group invoices by overdue periods
export const getAgingReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const invoices = await Invoice.find({ status: { $in: ['sent', 'overdue'] } });
    const buckets = {
      '0-30': [],
      '31-60': [],
      '61-90': [],
      '90+': [],
    } as Record<string, IInvoice[]>;
    invoices.forEach((inv: any) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 30) buckets['0-30'].push(inv);
      else if (daysOverdue <= 60) buckets['31-60'].push(inv);
      else if (daysOverdue <= 90) buckets['61-90'].push(inv);
      else buckets['90+'].push(inv);
    });
    res.json(buckets);
  } catch (error) {
    console.error('Error in getAgingReport:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 