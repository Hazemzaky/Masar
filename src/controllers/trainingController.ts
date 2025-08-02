import { Request, Response } from 'express';
import Training from '../models/Training';
import { generateSerial } from '../utils/serialUtils';

export const createTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employee,
      trainingType,
      title,
      description,
      startDate,
      endDate,
      duration,
      provider,
      location,
      status,
      amortisation,
      notes,
    } = req.body;

    // Validate required fields
    if (!employee || !trainingType || !title || !description || !startDate || !endDate || !duration || !provider || !location || !amortisation) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Generate serial number
    const serialNumber = await generateSerial('TRAINING');

    const training = new Training({
      employee,
      trainingType,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration: Number(duration),
      provider,
      location,
      status: status || 'scheduled',
      amortisation: Number(amortisation),
      notes,
      serial: serialNumber,
    });

    await training.save();
    res.status(201).json(training);
  } catch (error: any) {
    console.error('Error creating training:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
      return;
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({
        message: 'Training with this serial number already exists'
      });
      return;
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getTrainings = async (req: Request, res: Response): Promise<void> => {
  try {
    const trainings = await Training.find()
      .populate('employee', 'name email')
      .sort({ createdAt: -1 });

    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('employee', 'name email');
    
    if (!training) {
      res.status(404).json({ message: 'Training not found' });
      return;
    }
    
    res.json(training);
  } catch (error) {
    console.error('Error fetching training:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employee,
      trainingType,
      title,
      description,
      startDate,
      endDate,
      duration,
      provider,
      location,
      status,
      amortisation,
      notes,
    } = req.body;

    const updateData: any = {
      employee,
      trainingType,
      title,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      duration: duration ? Number(duration) : undefined,
      provider,
      location,
      status,
      amortisation: amortisation ? Number(amortisation) : undefined,
      notes,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const training = await Training.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee', 'name email');

    if (!training) {
      res.status(404).json({ message: 'Training not found' });
      return;
    }

    res.json(training);
  } catch (error: any) {
    console.error('Error updating training:', error);

    // Handle validation errors
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

export const deleteTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training not found' });
      return;
    }
    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 