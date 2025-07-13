import { Request, Response } from 'express';
import { PayrollEmployee, PayrollHistory } from '../models/Payroll';
import Payroll from '../models/Payroll';

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

    if (existingHistory) {
      // Update existing history record
      await PayrollHistory.findByIdAndUpdate(existingHistory._id, {
        ...updateData,
        year: now.getFullYear()
      });
    } else {
      // Create new history record
      const historyData = {
        employeeId: id,
        month: currentMonth,
        year: now.getFullYear(),
        ...updateData
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
    const history = await PayrollHistory.find().populate('employeeId', 'fullName employeeCode');
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
    const payroll = new Payroll(req.body);
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