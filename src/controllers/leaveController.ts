import { Request, Response } from 'express';
import Leave from '../models/Leave';
import Employee from '../models/Employee';
import { isPeriodClosed } from '../models/Period';
import { generateSerial } from '../utils/serialUtils';
import mongoose from 'mongoose';

// Helper: Check for overlapping leaves
async function hasOverlappingLeave(employeeId: mongoose.Types.ObjectId, startDate: Date, endDate: Date, excludeId?: string) {
  const filter: any = {
    employee: employeeId,
    status: { $ne: 'rejected' },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } }
    ]
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const overlap = await Leave.findOne(filter);
  return !!overlap;
}

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
    // Check for overlapping leaves
    if (await hasOverlappingLeave(employee, new Date(startDate), new Date(endDate))) {
      res.status(400).json({ message: 'Overlapping leave request exists for this employee.' });
      return;
    }
    // Check leave balance
    const emp = await Employee.findById(employee);
    if (emp && emp.leaveBalance < days) {
      res.status(400).json({ message: 'Insufficient leave balance.' });
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
    // Filtering support
    const { employee, status, department } = req.query;
    const filter: any = {};
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    if (department) filter.department = department;
    const leaves = await Leave.find(filter).populate('employee');
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
    const { startDate, employee, endDate } = req.body;
    if (startDate && employee && endDate) {
      const period = new Date(startDate).toISOString().slice(0, 7);
      if (await isPeriodClosed(period)) {
        res.status(403).json({ message: 'This period is locked and cannot be edited.' });
        return;
      }
      // Check for overlapping leaves (exclude current leave)
      if (await hasOverlappingLeave(employee, new Date(startDate), new Date(endDate), req.params.id)) {
        res.status(400).json({ message: 'Overlapping leave request exists for this employee.' });
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
    // Decrement employee leave balance
    const emp = await Employee.findById(leave.employee);
    if (emp) {
      emp.leaveBalance = (emp.leaveBalance || 0) - leave.days;
      await emp.save();
    }
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