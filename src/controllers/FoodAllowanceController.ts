import { Request, Response } from 'express';
import FoodAllowance from '../models/FoodAllowance';
import Employee from '../models/Employee';
import Project from '../models/Project';
import { generateSerial } from '../utils/serialUtils';

export const createFoodAllowance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rentType, companyName, driver, project, value } = req.body;
    if (!rentType || !companyName || !driver || !project || value === undefined) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const serial = await generateSerial('FA', 'HR', FoodAllowance); // Use correct docCode and model
    const foodAllowance = new FoodAllowance({ rentType, companyName, driver, project, value: Number(value), serial });
    await foodAllowance.save();
    res.status(201).json(foodAllowance);
  } catch (error) {
    console.error('Error in createFoodAllowance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getFoodAllowances = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodAllowances = await FoodAllowance.find().populate('driver').populate('project');
    res.json(foodAllowances);
  } catch (error) {
    console.error('Error in getFoodAllowances:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getFoodAllowance = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodAllowance = await FoodAllowance.findById(req.params.id).populate('driver').populate('project');
    if (!foodAllowance) {
      res.status(404).json({ message: 'Food allowance not found' });
      return;
    }
    res.json(foodAllowance);
  } catch (error) {
    console.error('Error in getFoodAllowance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateFoodAllowance = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure value is a number if present
    const updateData = { ...req.body };
    if (updateData.value !== undefined) {
      updateData.value = Number(updateData.value);
    }
    const foodAllowance = await FoodAllowance.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('driver').populate('project');
    if (!foodAllowance) {
      res.status(404).json({ message: 'Food allowance not found' });
      return;
    }
    res.json(foodAllowance);
  } catch (error) {
    console.error('Error in updateFoodAllowance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteFoodAllowance = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodAllowance = await FoodAllowance.findByIdAndDelete(req.params.id);
    if (!foodAllowance) {
      res.status(404).json({ message: 'Food allowance not found' });
      return;
    }
    res.json({ message: 'Food allowance deleted' });
  } catch (error) {
    console.error('Error in deleteFoodAllowance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 