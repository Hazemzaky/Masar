import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import Asset from '../models/Asset';
import Expense from '../models/Expense';
import Payroll from '../models/Payroll';
import FuelLog from '../models/FuelLog';
import DriverHour from '../models/DriverHour';
import { PayrollEmployee } from '../models/Payroll';

// New function to check employee availability for project assignment
export const checkEmployeeAvailability = async (req: Request, res: Response) => {
  try {
    const { employeeIds } = req.body;
    
    if (!employeeIds || !Array.isArray(employeeIds)) {
      res.status(400).json({ message: 'Employee IDs array is required' });
      return;
    }

    const availabilityResults = [];

    for (const employeeId of employeeIds) {
      const employee = await PayrollEmployee.findById(employeeId)
        .select('fullName employeeCode position department currentProject')
        .populate('currentProject', 'customer description status');

      if (!employee) {
        availabilityResults.push({
          employeeId,
          available: false,
          reason: 'Employee not found'
        });
        continue;
      }

      if (employee.currentProject) {
        availabilityResults.push({
          employeeId,
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          available: false,
          reason: 'Already assigned to project',
          currentProject: employee.currentProject
        });
      } else {
        availabilityResults.push({
          employeeId,
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          available: true
        });
      }
    }

    res.json(availabilityResults);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { customer, equipmentDescription, rentTime, rentType, timing, operatorDriver, startTime, endTime, description, revenue, notes, assignedEmployees } = req.body;

    // Validate required fields
    if (!customer || !equipmentDescription || !rentTime || !rentType || !timing || !operatorDriver) {
      return res.status(400).json({
        message: 'Missing required fields: customer, equipmentDescription, rentTime, rentType, timing, operatorDriver'
      });
    }

    // If assignedEmployees is provided, check their availability
    if (assignedEmployees && Array.isArray(assignedEmployees) && assignedEmployees.length > 0) {
      const availabilityCheck = await Promise.all(
        assignedEmployees.map(async (employeeId: string) => {
          const employee = await PayrollEmployee.findById(employeeId);
          return {
            employeeId,
            available: !employee?.currentProject,
            employee: employee
          };
        })
      );

      const unavailableEmployees = availabilityCheck.filter(check => !check.available);
      
      if (unavailableEmployees.length > 0) {
        return res.status(400).json({
          message: 'Some employees are not available for assignment',
          unavailableEmployees: unavailableEmployees.map(u => ({
            employeeId: u.employeeId,
            employeeName: u.employee?.fullName,
            currentProject: u.employee?.currentProject
          }))
        });
      }
    }

    // Create the project
    const projectData = {
      customer,
      equipmentDescription,
      rentTime,
      rentType,
      timing,
      operatorDriver,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      status: 'active',
      description,
      revenue: revenue ? Number(revenue) : undefined,
      notes
    };

    const project = new Project(projectData);
    await project.save();

    // If employees are assigned, update their project assignment
    if (assignedEmployees && Array.isArray(assignedEmployees) && assignedEmployees.length > 0) {
      await Promise.all(
        assignedEmployees.map(async (employeeId: string) => {
          await PayrollEmployee.findByIdAndUpdate(employeeId, {
            currentProject: project._id,
            projectAssignmentDate: new Date()
          });
        })
      );
    }

    res.status(201).json(project);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const { id } = req.params;
    
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Update project status to completed
    project.status = 'completed';
    project.endTime = new Date();
    await project.save();

    // Unassign all employees from this project
    await PayrollEmployee.updateMany(
      { currentProject: id },
      {
        currentProject: null,
        projectAssignmentDate: null
      }
    );

    // Also unassign any assets from this project
    await Asset.updateMany(
      { currentProject: id },
      {
        availability: 'available',
        currentProject: null
      }
    );

    res.json({ message: 'Project completed successfully', project });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 