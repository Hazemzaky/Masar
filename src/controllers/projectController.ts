import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import Asset from '../models/Asset';
import Expense from '../models/Expense';
import Payroll from '../models/Payroll';
import FuelLog from '../models/FuelLog';
import DriverHour from '../models/DriverHour';
import { generateSerial } from '../utils/serialUtils';

export const createProject = async (req: Request, res: Response) => {
  try {
    const { assignedAssets, ...projectData } = req.body;
    // Serial number generation
    const docCode = 'PJ';
    const dept = projectData.department || 'PJ';
    const serial = await generateSerial(docCode, dept, Project);
    // Create the project first
    const project = new Project({ ...projectData, serial });
    await project.save();

    // If assets are assigned, update their availability
    if (assignedAssets && assignedAssets.length > 0) {
      // Verify all assets are available
      const assets = await Asset.find({ 
        _id: { $in: assignedAssets },
        availability: 'available',
        status: 'active'
      });

      if (assets.length !== assignedAssets.length) {
        return res.status(400).json({ 
          message: 'Some assets are not available for assignment' 
        });
      }

      // Update project with assigned assets
      project.assignedAssets = assignedAssets;
      await project.save();

      // Update assets to show they're assigned
      await Asset.updateMany(
        { _id: { $in: assignedAssets } },
        { 
          availability: 'assigned',
          currentProject: project._id
        }
      );
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().populate('assignedAssets');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).populate('assignedAssets');
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { assignedAssets, ...updateData } = req.body;
    const projectId = req.params.id;

    // Get current project to check existing asset assignments
    const currentProject = await Project.findById(projectId);
    if (!currentProject) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Handle asset assignment changes
    if (assignedAssets !== undefined) {
      const oldAssets = currentProject.assignedAssets || [];
      const newAssets = assignedAssets || [];

      // Release old assets
      if (oldAssets.length > 0) {
        await Asset.updateMany(
          { _id: { $in: oldAssets } },
          { 
            availability: 'available',
            currentProject: null
          }
        );
      }

      // Assign new assets
      if (newAssets.length > 0) {
        // Verify all new assets are available
        const availableAssets = await Asset.find({ 
          _id: { $in: newAssets },
          availability: 'available',
          status: 'active'
        });

        if (availableAssets.length !== newAssets.length) {
          return res.status(400).json({ 
            message: 'Some assets are not available for assignment' 
          });
        }

        // Update assets to show they're assigned
        await Asset.updateMany(
          { _id: { $in: newAssets } },
          { 
            availability: 'assigned',
            currentProject: projectId
          }
        );
      }

      updateData.assignedAssets = newAssets;
    }

    const project = await Project.findByIdAndUpdate(projectId, updateData, { new: true }).populate('assignedAssets');
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Release assigned assets before deleting project
    if (project.assignedAssets && project.assignedAssets.length > 0) {
      await Asset.updateMany(
        { _id: { $in: project.assignedAssets } },
        { 
          availability: 'available',
          currentProject: null
        }
      );
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProjectProfitability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Revenue: sum of all income (category: 'income') assigned to this project
    const revenueAgg = await Expense.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(id), category: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    // Costs: sum of all expenses, payroll, fuel logs, driver hours assigned to this project
    const expenseAgg = await Expense.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(id), category: { $ne: 'income' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenses = expenseAgg[0]?.total || 0;
    const payrollAgg = await Payroll.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: '$netPay' } } }
    ]);
    const payroll = payrollAgg[0]?.total || 0;
    const fuelAgg = await FuelLog.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);
    const fuel = fuelAgg[0]?.total || 0;
    const driverHourAgg = await DriverHour.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);
    const driverHours = driverHourAgg[0]?.total || 0;
    const totalCost = expenses + payroll + fuel + driverHours;
    const profit = revenue - totalCost;
    res.json({ revenue, expenses, payroll, fuel, driverHours, totalCost, profit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// New function to get available assets
export const getAvailableAssets = async (req: Request, res: Response) => {
  try {
    const availableAssets = await Asset.find({
      availability: 'available',
      status: 'active'
    }).select('description type brand plateNumber serialNumber fleetNumber');
    
    res.json(availableAssets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// New function to complete a project and release assets
export const completeProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Release assigned assets
    if (project.assignedAssets && project.assignedAssets.length > 0) {
      await Asset.updateMany(
        { _id: { $in: project.assignedAssets } },
        { 
          availability: 'available',
          currentProject: null
        }
      );
    }

    // Update project status to completed
    project.status = 'completed';
    project.endTime = new Date();
    await project.save();

    res.json({ message: 'Project completed and assets released', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 