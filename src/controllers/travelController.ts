import { Request, Response } from 'express';
import TravelRecord from '../models/TravelRecord';
import mongoose from 'mongoose';
import path from 'path';
import CountryGuideline from '../models/CountryGuideline';

export const createTravelRecord = async (req: any, res: Response) => {
  try {
    const record = new TravelRecord({ ...req.body, createdBy: req.user?.userId, updatedBy: req.user?.userId });
    await record.save();
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTravelRecords = async (req: Request, res: Response) => {
  try {
    const records = await TravelRecord.find().populate('employee', 'name').sort({ startDate: -1 });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTravelRecord = async (req: Request, res: Response) => {
  try {
    const record = await TravelRecord.findById(req.params.id).populate('employee', 'name');
    if (!record) return res.status(404).json({ message: 'Travel record not found' });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTravelRecord = async (req: any, res: Response) => {
  try {
    const record = await TravelRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.userId },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Travel record not found' });
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTravelRecord = async (req: Request, res: Response) => {
  try {
    const record = await TravelRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Travel record not found' });
    res.json({ message: 'Travel record deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Document upload (assume file upload middleware is used)
export const uploadTravelDocument = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const fileUrl = req.file?.path;
    if (!fileUrl) return res.status(400).json({ message: 'No file uploaded' });
    const record = await TravelRecord.findById(id);
    if (!record) return res.status(404).json({ message: 'Travel record not found' });
    record.documents.push({
      type,
      fileUrl,
      uploadedAt: new Date(),
      uploadedBy: req.user?.userId,
    });
    await record.save();
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Analytics endpoint (basic example)
export const getTravelAnalytics = async (req: Request, res: Response) => {
  try {
    const records = await TravelRecord.find();
    // Example: count by country, frequent travelers, avg cost, etc.
    const countryCount: Record<string, number> = {};
    const travelerCount: Record<string, number> = {};
    let totalCost = 0;
    let tripCount = 0;
    for (const r of records) {
      countryCount[r.destinationCountry] = (countryCount[r.destinationCountry] || 0) + 1;
      const employeeId = r.employee?.toString?.() || String(r.employee);
      travelerCount[employeeId] = (travelerCount[employeeId] || 0) + 1;
      if (r.actualAmount) {
        totalCost += r.actualAmount;
        tripCount++;
      }
    }
    res.json({
      countryCount,
      travelerCount,
      avgCost: tripCount ? totalCost / tripCount : 0,
      totalTrips: records.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Notification/reminder endpoint (stub)
export const getTravelNotifications = async (req: Request, res: Response) => {
  try {
    // Example: find trips starting in next 2 days, visa expiry, etc.
    const now = new Date();
    const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const upcomingTrips = await TravelRecord.find({ startDate: { $gte: now, $lte: soon } }).populate('employee', 'name');
    res.json({ upcomingTrips });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Add an expense to a travel record
export const addTravelExpense = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { category, amount, currency } = req.body;
    let receiptUrl = undefined;
    if (req.file) {
      receiptUrl = req.file.path;
    }
    const expense = {
      _id: new mongoose.Types.ObjectId(),
      category,
      amount,
      currency,
      receiptUrl,
    };
    const record = await TravelRecord.findByIdAndUpdate(
      id,
      { $push: { expenses: expense } },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Travel record not found' });
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Edit an expense for a travel record
export const updateTravelExpense = async (req: any, res: Response) => {
  try {
    const { id, expenseId } = req.params;
    const { category, amount, currency } = req.body;
    let receiptUrl = req.body.receiptUrl;
    if (req.file) {
      receiptUrl = req.file.path;
    }
    const record = await TravelRecord.findOneAndUpdate(
      { _id: id, 'expenses._id': expenseId },
      {
        $set: {
          'expenses.$.category': category,
          'expenses.$.amount': amount,
          'expenses.$.currency': currency,
          ...(receiptUrl ? { 'expenses.$.receiptUrl': receiptUrl } : {}),
        },
      },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Travel record or expense not found' });
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an expense for a travel record
export const deleteTravelExpense = async (req: Request, res: Response) => {
  try {
    const { id, expenseId } = req.params;
    const record = await TravelRecord.findByIdAndUpdate(
      id,
      { $pull: { expenses: { _id: expenseId } } },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Travel record or expense not found' });
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Upload a receipt for a specific expense
export const uploadExpenseReceipt = async (req: any, res: Response) => {
  try {
    const { id, expenseId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const receiptUrl = req.file.path;
    const record = await TravelRecord.findOneAndUpdate(
      { _id: id, 'expenses._id': expenseId },
      { $set: { 'expenses.$.receiptUrl': receiptUrl } },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Travel record or expense not found' });
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Country Guidelines CRUD
export const createCountryGuideline = async (req: Request, res: Response) => {
  try {
    const guideline = new CountryGuideline(req.body);
    await guideline.save();
    res.status(201).json(guideline);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCountryGuidelines = async (req: Request, res: Response) => {
  try {
    const guidelines = await CountryGuideline.find();
    res.json(guidelines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCountryGuideline = async (req: Request, res: Response) => {
  try {
    const guideline = await CountryGuideline.findById(req.params.id);
    if (!guideline) return res.status(404).json({ message: 'Guideline not found' });
    res.json(guideline);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCountryGuideline = async (req: Request, res: Response) => {
  try {
    const guideline = await CountryGuideline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!guideline) return res.status(404).json({ message: 'Guideline not found' });
    res.json(guideline);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCountryGuideline = async (req: Request, res: Response) => {
  try {
    const guideline = await CountryGuideline.findByIdAndDelete(req.params.id);
    if (!guideline) return res.status(404).json({ message: 'Guideline not found' });
    res.json({ message: 'Guideline deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 