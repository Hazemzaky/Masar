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
    
    console.log('Trip Allowance Query - Filter:', filter);
    console.log('Trip Allowance Query - Month:', req.query.month, 'Year:', req.query.year);
    
    // Debug: Get all trip allowances to see what's in the database
    const allTripAllowances = await TripAllowance.find({}).populate('employee');
    console.log('All Trip Allowances in DB:', allTripAllowances.map(ta => ({ month: ta.month, year: ta.year, name: ta.name })));
    
    // Debug: Show unique month/year combinations
    const uniqueMonths = [...new Set(allTripAllowances.map(ta => `${ta.month}/${ta.year}`))];
    console.log('Unique month/year combinations in DB:', uniqueMonths);
    
    const tripAllowances = await TripAllowance.find(filter).populate('employee');
    console.log('Trip Allowance Results Count:', tripAllowances.length);
    console.log('Filtered results:', tripAllowances.map(ta => ({ month: ta.month, year: ta.year, name: ta.name })));
    
    res.json(tripAllowances);
  } catch (error) {
    console.error('Error in getTripAllowances:', error);
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

export const updateTripAllowanceAmount = async (req: Request, res: Response) => {
  try {
    const { allowance } = req.body;
    if (typeof allowance !== 'number') {
      return res.status(400).json({ message: 'Allowance must be a number' });
    }
    const tripAllowance = await TripAllowance.findByIdAndUpdate(
      req.params.id,
      { $set: { allowance } },
      { new: true }
    );
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