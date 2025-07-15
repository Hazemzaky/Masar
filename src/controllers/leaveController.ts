import { Request, Response } from 'express';
import Leave from '../models/Leave';
import Employee from '../models/Employee';
import { isPeriodClosed } from '../models/Period';
import { generateSerial } from '../utils/serialUtils';

export const createLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee, type, startDate, endDate, days, cost, department } = req.body;
    if (!employee || !type || !startDate || !endDate || !days) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const period = startDate ? new Date(startDate).toISOString().slice(0, 7) : undefined;
    if (period && await isPeriodClosed(period)) {
      res.status(403).json({ message: 'This period is locked and cannot be edited.' });
      return;
    }
    // Serial number generation
    const docCode = 'LV';
    const dept = department || 'HR';
    const serial = await generateSerial(docCode, dept, Leave);
    const leave = new Leave({ employee, type, startDate, endDate, days, cost, serial });
    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    console.error('Error in createLeave:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const leaves = await Leave.find().populate('employee');
    res.json(leaves);
  } catch (error) {
    console.error('Error in getLeaves:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json(leave);
  } catch (error) {
    console.error('Error in getLeave:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate } = req.body;
    if (startDate) {
      const period = new Date(startDate).toISOString().slice(0, 7);
      if (await isPeriodClosed(period)) {
        res.status(403).json({ message: 'This period is locked and cannot be edited.' });
        return;
      }
    }
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json(leave);
  } catch (error) {
    console.error('Error in updateLeave:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    leave.status = 'approved';
    await leave.save();
    res.json(leave);
  } catch (error) {
    console.error('Error in approveLeave:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const rejectLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    leave.status = 'rejected';
    await leave.save();
    res.json(leave);
  } catch (error) {
    console.error('Error in rejectLeave:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 