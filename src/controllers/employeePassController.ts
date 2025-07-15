import { Request, Response } from 'express';
import EmployeePass from '../models/EmployeePass';
import Employee from '../models/Employee';

// Create Employee Pass
export const createEmployeePass = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { employee, passType, passNumber, issuanceDate, expiryDate } = req.body;
    if (!employee || !passType || !passNumber || !issuanceDate || !expiryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Check employee exists
    const empObj = await Employee.findById(employee);
    if (!empObj) {
      return res.status(400).json({ message: 'Employee not found' });
    }
    const certificate = req.file ? `/uploads/${req.file.filename}` : undefined;
    const employeePass = new EmployeePass({
      employee,
      passType,
      passNumber,
      issuanceDate,
      expiryDate,
      certificate
    });
    await employeePass.save();
    res.status(201).json(employeePass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all Employee Passes (optionally filter by employee or passType)
export const getEmployeePasses = async (req: Request, res: Response) => {
  try {
    const { employee, passType } = req.query;
    const filter: any = {};
    if (employee) filter.employee = employee;
    if (passType) filter.passType = passType;
    const passes = await EmployeePass.find(filter).populate('employee', 'name coId position');
    res.json(passes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Employee Pass by ID
export const getEmployeePassById = async (req: Request, res: Response) => {
  try {
    const pass = await EmployeePass.findById(req.params.id).populate('employee', 'name coId position');
    if (!pass) return res.status(404).json({ message: 'Employee Pass not found' });
    res.json(pass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Employee Pass (optionally update certificate)
export const updateEmployeePass = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.certificate = `/uploads/${req.file.filename}`;
    }
    const pass = await EmployeePass.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!pass) return res.status(404).json({ message: 'Employee Pass not found' });
    res.json(pass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Employee Pass
export const deleteEmployeePass = async (req: Request, res: Response) => {
  try {
    const pass = await EmployeePass.findByIdAndDelete(req.params.id);
    if (!pass) return res.status(404).json({ message: 'Employee Pass not found' });
    res.json({ message: 'Employee Pass deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 