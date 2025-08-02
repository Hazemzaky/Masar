import { Request, Response } from 'express';
import NearMiss from '../models/NearMiss';
import { generateSerial } from '../utils/serialUtils';

export const createNearMiss = async (req: Request, res: Response): Promise<void> => {
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
    const finalSerialNumber = serialNumber || await generateSerial('NM', 'HSE', NearMiss);

    const nearMiss = new NearMiss({
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

    await nearMiss.save();
    res.status(201).json(nearMiss);
  } catch (error: any) {
    console.error('Error creating near miss:', error);

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
        message: 'Near miss with this serial number already exists'
      });
      return;
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getNearMisses = async (req: Request, res: Response): Promise<void> => {
  try {
    const nearMisses = await NearMiss.find()
      .populate('driver', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(nearMisses);
  } catch (error) {
    console.error('Error fetching near misses:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getNearMiss = async (req: Request, res: Response): Promise<void> => {
  try {
    const nearMiss = await NearMiss.findById(req.params.id).populate('driver', 'name employeeId');
    if (!nearMiss) {
      res.status(404).json({ message: 'Near miss not found' });
      return;
    }
    res.json(nearMiss);
  } catch (error) {
    console.error('Error fetching near miss:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateNearMiss = async (req: Request, res: Response): Promise<void> => {
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

    const nearMiss = await NearMiss.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('driver', 'name employeeId');

    if (!nearMiss) {
      res.status(404).json({ message: 'Near miss not found' });
      return;
    }

    res.json(nearMiss);
  } catch (error: any) {
    console.error('Error updating near miss:', error);

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

export const deleteNearMiss = async (req: Request, res: Response): Promise<void> => {
  try {
    const nearMiss = await NearMiss.findByIdAndDelete(req.params.id);
    if (!nearMiss) {
      res.status(404).json({ message: 'Near miss not found' });
      return;
    }
    res.json({ message: 'Near miss deleted successfully' });
  } catch (error) {
    console.error('Error deleting near miss:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 