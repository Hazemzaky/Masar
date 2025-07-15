import { Request, Response } from 'express';
import TripAllowance from '../models/TripAllowance';

export const createTripAllowance = async (req: Request, res: Response) => {
  try {
    const tripAllowance = new TripAllowance(req.body);
    await tripAllowance.save();
    res.status(201).json(tripAllowance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getTripAllowances = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.month !== undefined) filter.month = Number(req.query.month);
    if (req.query.year !== undefined) filter.year = Number(req.query.year);
    if (req.query.employee) filter.employee = req.query.employee;
    const tripAllowances = await TripAllowance.find(filter).populate('employee');
    res.json(tripAllowances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getTripAllowance = async (req: Request, res: Response) => {
  try {
    const tripAllowance = await TripAllowance.findById(req.params.id).populate('employee');
    if (!tripAllowance) return res.status(404).json({ message: 'Trip allowance record not found' });
    res.json(tripAllowance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateTripAllowance = async (req: Request, res: Response) => {
  try {
    const tripAllowance = await TripAllowance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tripAllowance) return res.status(404).json({ message: 'Trip allowance record not found' });
    res.json(tripAllowance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteTripAllowance = async (req: Request, res: Response) => {
  try {
    const tripAllowance = await TripAllowance.findByIdAndDelete(req.params.id);
    if (!tripAllowance) return res.status(404).json({ message: 'Trip allowance record not found' });
    res.json({ message: 'Trip allowance record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 