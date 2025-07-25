import { Request, Response } from 'express';
import Tracker from '../models/Tracker';
import { PayrollEmployee } from '../models/Payroll';

// Create a new tracker entry
export const createTracker = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Validate required fields
    const requiredFields = [
      'month', 'year', 'SR', 'departureMonth', 'date', 'TMR', 'from', 'to', 'departmentRequester',
      'invoicedDate', 'field', 'OTM_PO', 'VPN', 'trailerNumber', 'trailerType', 'waterCardNo',
      'gallons', 'EMP', 'name', 'nationality', 'passport', 'residencyNumber', 'contact',
      'dateLoaded', 'timeLoaded', 'returnedDate', 'returnedTime', 'durationTripTime',
      'daysInMission', 'kmAtOrigin', 'kmOnceReturned', 'totalKmPerTrip', 'tripAllowanceInKWD'
    ];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    // Optionally validate EMP exists in PayrollEmployee
    const emp = await PayrollEmployee.findById(data.EMP);
    if (!emp) {
      return res.status(400).json({ message: 'EMP (Payroll Employee) not found' });
    }
    const tracker = new Tracker(data);
    await tracker.save();
    res.status(201).json(tracker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tracker entries, with optional month/year filter
export const getTrackers = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const filter: any = {};
    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    const trackers = await Tracker.find(filter).populate('EMP', 'fullName employeeCode');
    res.json(trackers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single tracker entry by ID
export const getTrackerById = async (req: Request, res: Response) => {
  try {
    const tracker = await Tracker.findById(req.params.id).populate('EMP', 'fullName employeeCode');
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker entry not found' });
    }
    res.json(tracker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a tracker entry
export const updateTracker = async (req: Request, res: Response) => {
  try {
    const tracker = await Tracker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker entry not found' });
    }
    res.json(tracker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a tracker entry
export const deleteTracker = async (req: Request, res: Response) => {
  try {
    const tracker = await Tracker.findByIdAndDelete(req.params.id);
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker entry not found' });
    }
    res.json({ message: 'Tracker entry deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all water trips (isWaterTrip === 'yes')
export const getWaterTrips = async (req: Request, res: Response) => {
  try {
    const waterTrips = await Tracker.find({ isWaterTrip: 'yes' })
      .select('waterCardNo gallons date TMR from to departmentRequester VPN trailerNumber name contact dateLoaded returnedDate')
      .sort({ date: -1 });
    res.json(waterTrips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 