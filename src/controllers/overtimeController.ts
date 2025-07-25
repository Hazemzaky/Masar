import { Request, Response } from 'express';
import Overtime from '../models/Overtime';
import { OvertimeAttendance } from '../models/Overtime';

export const createOvertime = async (req: Request, res: Response) => {
  try {
    const overtime = new Overtime(req.body);
    await overtime.save();
    res.status(201).json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getOvertimes = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.month !== undefined) filter.month = Number(req.query.month);
    if (req.query.year !== undefined) filter.year = Number(req.query.year);
    if (req.query.employee) filter.employee = req.query.employee;
    const overtimes = await Overtime.find(filter).populate('employee');
    res.json(overtimes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getOvertime = async (req: Request, res: Response) => {
  try {
    const overtime = await Overtime.findById(req.params.id).populate('employee');
    if (!overtime) return res.status(404).json({ message: 'Overtime record not found' });
    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateOvertime = async (req: Request, res: Response) => {
  try {
    const overtime = await Overtime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!overtime) return res.status(404).json({ message: 'Overtime record not found' });
    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteOvertime = async (req: Request, res: Response) => {
  try {
    const overtime = await Overtime.findByIdAndDelete(req.params.id);
    if (!overtime) return res.status(404).json({ message: 'Overtime record not found' });
    res.json({ message: 'Overtime record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Overtime Attendance CRUD
export const createOvertimeAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = new OvertimeAttendance(req.body);
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getOvertimeAttendances = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.month !== undefined) filter['date'] = { $gte: new Date(Number(req.query.year), Number(req.query.month), 1), $lt: new Date(Number(req.query.year), Number(req.query.month) + 1, 1) };
    const attendances = await OvertimeAttendance.find(filter);
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateOvertimeAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await OvertimeAttendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!attendance) return res.status(404).json({ message: 'Overtime attendance record not found' });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteOvertimeAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await OvertimeAttendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Overtime attendance record not found' });
    res.json({ message: 'Overtime attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 