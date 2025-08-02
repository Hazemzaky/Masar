import { Request, Response } from 'express';
import Accident from '../models/Accident';
import { generateSerial } from '../utils/serialUtils';

export const createAccident = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      serialNumber,
      date,
      description,
      driver,
      abbreviation,
      incidentSeverity,
      driverAtFault,
      damageDescription,
      directOrRootCause,
      actionTaken
    } = req.body;

    // Validate required fields
    if (!serialNumber || !date || !description || !driver || !abbreviation || !incidentSeverity || !driverAtFault) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Generate serial number if not provided
    const finalSerialNumber = serialNumber || await generateSerial('AC', 'HSE', Accident);

    const accident = new Accident({
      serialNumber: finalSerialNumber,
      date: new Date(date),
      description,
      driver,
      abbreviation,
      incidentSeverity,
      driverAtFault,
      damageDescription,
      directOrRootCause,
      actionTaken
    });

    await accident.save();
    res.status(201).json(accident);
  } catch (error: any) {
    console.error('Error creating accident:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
      return;
    }

    if (error.code === 11000) {
      res.status(400).json({
        message: 'Accident with this serial number already exists'
      });
      return;
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAccidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const accidents = await Accident.find()
      .populate('driver', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(accidents);
  } catch (error) {
    console.error('Error fetching accidents:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAccident = async (req: Request, res: Response): Promise<void> => {
  try {
    const accident = await Accident.findById(req.params.id).populate('driver', 'name employeeId');
    if (!accident) {
      res.status(404).json({ message: 'Accident not found' });
      return;
    }
    res.json(accident);
  } catch (error) {
    console.error('Error fetching accident:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateAccident = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      serialNumber,
      date,
      description,
      driver,
      abbreviation,
      incidentSeverity,
      driverAtFault,
      damageDescription,
      directOrRootCause,
      actionTaken
    } = req.body;

    const updateData: any = {};
    if (serialNumber) updateData.serialNumber = serialNumber;
    if (date) updateData.date = new Date(date);
    if (description) updateData.description = description;
    if (driver) updateData.driver = driver;
    if (abbreviation) updateData.abbreviation = abbreviation;
    if (incidentSeverity) updateData.incidentSeverity = incidentSeverity;
    if (driverAtFault) updateData.driverAtFault = driverAtFault;
    if (damageDescription !== undefined) updateData.damageDescription = damageDescription;
    if (directOrRootCause !== undefined) updateData.directOrRootCause = directOrRootCause;
    if (actionTaken !== undefined) updateData.actionTaken = actionTaken;

    const accident = await Accident.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('driver', 'name employeeId');

    if (!accident) {
      res.status(404).json({ message: 'Accident not found' });
      return;
    }

    res.json(accident);
  } catch (error: any) {
    console.error('Error updating accident:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
      return;
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteAccident = async (req: Request, res: Response): Promise<void> => {
  try {
    const accident = await Accident.findByIdAndDelete(req.params.id);
    if (!accident) {
      res.status(404).json({ message: 'Accident not found' });
      return;
    }
    res.json({ message: 'Accident deleted successfully' });
  } catch (error) {
    console.error('Error deleting accident:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 