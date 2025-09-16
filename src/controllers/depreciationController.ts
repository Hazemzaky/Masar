import { Request, Response } from 'express';
import Depreciation from '../models/Depreciation';

// Calculate depreciation schedule with accurate monthly calculations
const calculateDepreciationSchedule = (assetCost: number, usefulLifeYears: number, startDate: Date) => {
  const totalUsefulDays = usefulLifeYears * 365; // Ignore leap years for total calculation
  const dailyDepreciation = assetCost / totalUsefulDays;
  
  const schedule = [];
  let currentDate = new Date(startDate);
  let accumulatedDepreciation = 0;
  let bookValue = assetCost;
  
  // Helper function to get days in a month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  // Helper function to check if a year is a leap year
  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };
  
  // Calculate for each month until book value reaches 0 or we've covered the useful life
  for (let year = 0; year < usefulLifeYears; year++) {
    for (let month = 0; month < 12; month++) {
      if (bookValue <= 0) break;
      
      const daysInMonth = getDaysInMonth(currentDate);
      // Adjust February for leap years
      const actualDaysInMonth = (currentDate.getMonth() === 1 && isLeapYear(currentDate.getFullYear())) 
        ? 29 
        : daysInMonth;
      
      const monthDepreciation = dailyDepreciation * actualDaysInMonth;
      accumulatedDepreciation += monthDepreciation;
      bookValue = Math.max(0, assetCost - accumulatedDepreciation);
      
      schedule.push({
        month: currentDate.getMonth() + 1, // 1-based month
        year: currentDate.getFullYear(),
        days: actualDaysInMonth,
        monthDepreciation: Math.round(monthDepreciation * 100) / 100, // Round to 2 decimal places
        accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
        bookValue: Math.round(bookValue * 100) / 100
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    if (bookValue <= 0) break;
  }
  
  return schedule;
};

export const createDepreciation = async (req: Request, res: Response) => {
  try {
    const depreciation = new Depreciation(req.body);
    await depreciation.save();
    res.status(201).json(depreciation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getDepreciations = async (req: Request, res: Response) => {
  try {
    const depreciations = await Depreciation.find().populate('asset');
    res.json(depreciations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getDepreciation = async (req: Request, res: Response) => {
  try {
    const depreciation = await Depreciation.findById(req.params.id).populate('asset');
    if (!depreciation) {
      res.status(404).json({ message: 'Depreciation not found' });
      return;
    }
    res.json(depreciation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateDepreciation = async (req: Request, res: Response) => {
  try {
    const depreciation = await Depreciation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!depreciation) {
      res.status(404).json({ message: 'Depreciation not found' });
      return;
    }
    res.json(depreciation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteDepreciation = async (req: Request, res: Response) => {
  try {
    const depreciation = await Depreciation.findByIdAndDelete(req.params.id);
    if (!depreciation) {
      res.status(404).json({ message: 'Depreciation not found' });
      return;
    }
    res.json({ message: 'Depreciation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getDepreciationSchedule = async (req: Request, res: Response) => {
  try {
    const { cost, usefulLifeYears, startDate } = req.query;
    
    // Validate required parameters
    if (!cost || !usefulLifeYears || !startDate) {
      return res.status(400).json({ 
        message: 'Missing required parameters: cost, usefulLifeYears, startDate' 
      });
    }
    
    const assetCost = Number(cost);
    const usefulLife = Number(usefulLifeYears);
    const start = new Date(startDate as string);
    
    // Validate parameters
    if (isNaN(assetCost) || assetCost <= 0) {
      return res.status(400).json({ message: 'Cost must be a positive number' });
    }
    if (isNaN(usefulLife) || usefulLife <= 0) {
      return res.status(400).json({ message: 'Useful life must be a positive number' });
    }
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start date' });
    }
    
    const schedule = calculateDepreciationSchedule(assetCost, usefulLife, start);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 