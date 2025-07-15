import { Request, Response } from 'express';
import { PayrollEmployee, PayrollHistory } from '../models/Payroll';
import Payroll from '../models/Payroll';
import { generateSerial } from '../utils/serialUtils';

// New Payroll Employee Management
export const createPayrollEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = new PayrollEmployee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Employee code already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

export const getPayrollEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const employees = await PayrollEmployee.find().sort({ fullName: 1 });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayrollEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await PayrollEmployee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayrollEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get current employee data
    const currentEmployee = await PayrollEmployee.findById(id);
    if (!currentEmployee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Update employee
    const updatedEmployee = await PayrollEmployee.findByIdAndUpdate(id, updateData, { new: true });
    
    // Create history record for the current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Check if history record already exists for this month
    const existingHistory = await PayrollHistory.findOne({
      employeeId: id,
      month: currentMonth
    });

    // Only save fields that exist in PayrollHistory schema
    const historyFields = [
      'totalSalary', 'days', 'basicSalary', 'fixedAllowance', 'temporaryAllowance',
      'overtime', 'leave', 'leaveDays', 'grossSalary', 'absent', 'absentDays',
      'sickLeave', 'sickLeaveDays', 'loan', 'fixedDeduction', 'temporaryDeduction',
      'grossNetSalary', 'sponsor', 'remark'
    ];

    const historyData: any = {};
    historyFields.forEach(field => {
      if (updateData[field] !== undefined) {
        historyData[field] = updateData[field];
      }
    });

    if (existingHistory) {
      // Update existing history record
      await PayrollHistory.findByIdAndUpdate(existingHistory._id, {
        ...historyData,
        year: now.getFullYear()
      });
    } else {
      // Create new history record
      const newHistoryData = {
        employeeId: id,
        month: currentMonth,
        year: now.getFullYear(),
        ...historyData
      };
      await PayrollHistory.create(newHistoryData);
    }

    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// New function to update only payment-related fields
export const updatePayrollPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Only allow payment-related fields to be updated
    const allowedFields = [
      'totalSalary', 'days', 'basicSalary', 'fixedAllowance', 'temporaryAllowance',
      'overtime', 'leave', 'leaveDays', 'grossSalary', 'absent', 'absentDays',
      'sickLeave', 'sickLeaveDays', 'loan', 'fixedDeduction', 'temporaryDeduction',
      'grossNetSalary', 'remark'
    ];
    
    // Filter out non-payment fields
    const paymentUpdateData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        paymentUpdateData[field] = updateData[field];
      }
    });
    
    // Get current employee data
    const currentEmployee = await PayrollEmployee.findById(id);
    if (!currentEmployee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Update employee with only payment fields
    const updatedEmployee = await PayrollEmployee.findByIdAndUpdate(id, paymentUpdateData, { new: true });
    
    // Create history record for the current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Check if history record already exists for this month
    const existingHistory = await PayrollHistory.findOne({
      employeeId: id,
      month: currentMonth
    });

    if (existingHistory) {
      // Update existing history record with payment data
      await PayrollHistory.findByIdAndUpdate(existingHistory._id, {
        ...paymentUpdateData,
        year: now.getFullYear()
      });
    } else {
      // Create new history record with payment data only
      const historyData = {
        employeeId: id,
        month: currentMonth,
        year: now.getFullYear(),
        sponsor: currentEmployee.sponsor, // Include sponsor from current employee
        ...paymentUpdateData
      };
      await PayrollHistory.create(historyData);
    }

    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePayrollEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await PayrollEmployee.findByIdAndDelete(req.params.id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    // Delete associated history records
    await PayrollHistory.deleteMany({ employeeId: req.params.id });
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Payroll History Management
export const getPayrollHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await PayrollHistory.find().populate('employeeId', 'fullName employeeCode').sort({ month: -1 });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeePayrollHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const history = await PayrollHistory.find({ employeeId }).sort({ month: -1 });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Monthly Payroll Update (to be run on 24th of each month)
export const updateMonthlyPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all employees
    const employees = await PayrollEmployee.find();
    
    for (const employee of employees) {
      // Check if history record already exists for this month
      const existingHistory = await PayrollHistory.findOne({
        employeeId: employee._id,
        month: currentMonth
      });

      if (!existingHistory) {
        // Create new history record with current employee data
        const historyData = {
          employeeId: employee._id,
          month: currentMonth,
          year: now.getFullYear(),
          totalSalary: employee.totalSalary,
          days: employee.days,
          basicSalary: employee.basicSalary,
          fixedAllowance: employee.fixedAllowance,
          temporaryAllowance: employee.temporaryAllowance,
          overtime: employee.overtime,
          leave: employee.leave,
          leaveDays: employee.leaveDays,
          grossSalary: employee.grossSalary,
          absent: employee.absent,
          absentDays: employee.absentDays,
          sickLeave: employee.sickLeave,
          sickLeaveDays: employee.sickLeaveDays,
          loan: employee.loan,
          fixedDeduction: employee.fixedDeduction,
          temporaryDeduction: employee.temporaryDeduction,
          grossNetSalary: employee.grossNetSalary,
          sponsor: employee.sponsor,
          remark: employee.remark
        };
        await PayrollHistory.create(historyData);
      }
    }
    
    res.json({ message: 'Monthly payroll update completed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy Payroll Functions (for backward compatibility)
export const createPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee, period, baseSalary, benefits, leaveCost, reimbursements, deductions, netPay, status, runDate, project, department } = req.body;
    // Serial number generation
    const docCode = 'PY';
    const dept = department || 'PY';
    const serial = await generateSerial(docCode, dept, Payroll);
    const payroll = new Payroll({
      employee,
      period,
      baseSalary,
      benefits,
      leaveCost,
      reimbursements,
      deductions,
      netPay,
      status,
      runDate,
      project,
      serial
    });
    await payroll.save();
    res.status(201).json(payroll);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPayrolls = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrolls = await Payroll.find().populate('employee', 'name');
    res.json(payrolls);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employee', 'name');
    if (!payroll) {
      res.status(404).json({ message: 'Payroll not found' });
      return;
    }
    res.json(payroll);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payroll) {
      res.status(404).json({ message: 'Payroll not found' });
      return;
    }
    res.json(payroll);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const processPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.body;
    // Process payroll logic here
    res.json({ message: 'Payroll processed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 

// New function to get available employees (not assigned to any project)
export const getAvailableEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only return employees who are not assigned to any project
    const availableEmployees = await PayrollEmployee.find({
      currentProject: { $exists: false }
    })
      .select('fullName employeeCode position department currentProject')
      .sort({ fullName: 1 });
    
    console.log('Available employees found:', availableEmployees.length);
    
    res.json(availableEmployees);
  } catch (error: any) {
    console.error('Error in getAvailableEmployees:', error);
    res.status(500).json({ message: error.message });
  }
};

// New function to assign employee to project
export const assignEmployeeToProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, projectId } = req.body;
    
    if (!employeeId || !projectId) {
      res.status(400).json({ message: 'Employee ID and Project ID are required' });
      return;
    }

    // Check if employee exists
    const employee = await PayrollEmployee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Check if employee is already assigned to a project
    if (employee.currentProject) {
      res.status(400).json({ 
        message: 'Employee is already assigned to a project. Please unassign them first.' 
      });
      return;
    }

    // Assign employee to project
    const updatedEmployee = await PayrollEmployee.findByIdAndUpdate(
      employeeId,
      {
        currentProject: projectId,
        projectAssignmentDate: new Date()
      },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// New function to unassign employee from project
export const unassignEmployeeFromProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    
    // Check if employee exists and is assigned to a project
    const employee = await PayrollEmployee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (!employee.currentProject) {
      res.status(400).json({ message: 'Employee is not assigned to any project' });
      return;
    }

    // Unassign employee from project
    const updatedEmployee = await PayrollEmployee.findByIdAndUpdate(
      employeeId,
      {
        currentProject: null,
        projectAssignmentDate: null
      },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// New function to get employees assigned to a specific project
export const getEmployeesByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    const employees = await PayrollEmployee.find({ currentProject: projectId })
      .select('fullName employeeCode position department projectAssignmentDate')
      .populate('currentProject', 'customer description status');
    
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// New function to get employee's current project assignment
export const getEmployeeProjectAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    
    const employee = await PayrollEmployee.findById(employeeId)
      .select('currentProject projectAssignmentDate')
      .populate('currentProject', 'customer description status startTime endTime');
    
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 