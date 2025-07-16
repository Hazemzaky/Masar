import { Request, Response } from 'express';
import Quotation from '../models/Quotation';

// Create a new quotation
export const createQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = new Quotation(req.body);
    await quotation.save();
    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all quotations
export const getQuotations = async (req: Request, res: Response) => {
  try {
    const quotations = await Quotation.find();
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a single quotation by ID
export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a quotation
export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a quotation
export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ message: 'Quotation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 