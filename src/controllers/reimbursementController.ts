import { Request, Response } from 'express';
import Reimbursement from '../models/Reimbursement';
import Employee from '../models/Employee';
import { isPeriodClosed } from '../models/Period';
import { generateSerial } from '../utils/serialUtils';

export const createReimbursement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee, amount, description, date, department } = req.body;
    if (!employee || !amount || !description || !date) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const period = date ? new Date(date).toISOString().slice(0, 7) : undefined;
    if (period && await isPeriodClosed(period)) {
      res.status(403).json({ message: 'This period is locked and cannot be edited.' });
      return;
    }
    // Serial number generation
    const docCode = 'RB';
    const dept = department || 'HR';
    const serial = await generateSerial(docCode, dept, Reimbursement);
    const reimbursement = new Reimbursement({ employee, amount, description, date, serial });
    await reimbursement.save();
    res.status(201).json(reimbursement);
  } catch (error) {
    console.error('Error in createReimbursement:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getReimbursements = async (req: Request, res: Response): Promise<void> => {
  try {
    const reimbursements = await Reimbursement.find().populate('employee');
    res.json(reimbursements);
  } catch (error) {
    console.error('Error in getReimbursements:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getReimbursement = async (req: Request, res: Response): Promise<void> => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id).populate('employee');
    if (!reimbursement) {
      res.status(404).json({ message: 'Reimbursement not found' });
      return;
    }
    res.json(reimbursement);
  } catch (error) {
    console.error('Error in getReimbursement:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateReimbursement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.body;
    if (date) {
      const period = new Date(date).toISOString().slice(0, 7);
      if (await isPeriodClosed(period)) {
        res.status(403).json({ message: 'This period is locked and cannot be edited.' });
        return;
      }
    }
    const reimbursement = await Reimbursement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reimbursement) {
      res.status(404).json({ message: 'Reimbursement not found' });
      return;
    }
    res.json(reimbursement);
  } catch (error) {
    console.error('Error in updateReimbursement:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const approveReimbursement = async (req: Request, res: Response): Promise<void> => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      res.status(404).json({ message: 'Reimbursement not found' });
      return;
    }
    reimbursement.status = 'approved';
    await reimbursement.save();
    res.json(reimbursement);
  } catch (error) {
    console.error('Error in approveReimbursement:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const rejectReimbursement = async (req: Request, res: Response): Promise<void> => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      res.status(404).json({ message: 'Reimbursement not found' });
      return;
    }
    reimbursement.status = 'rejected';
    await reimbursement.save();
    res.json(reimbursement);
  } catch (error) {
    console.error('Error in rejectReimbursement:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 