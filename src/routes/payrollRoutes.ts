import express from 'express';
import {
  createPayroll,
  getPayrolls,
  getPayroll,
  updatePayroll,
  processPayroll,
  deleteAllPayrolls,
  populatePayrollEmployees,
  // New payroll employee management
  createPayrollEmployee,
  getPayrollEmployees,
  getPayrollEmployee,
  updatePayrollEmployee,
  updatePayrollPayment,
  deletePayrollEmployee,
  // Payroll history management
  getPayrollHistory,
  getEmployeePayrollHistory,
  updateMonthlyPayroll,
  // Employee project assignment management
  getAvailableEmployees,
  assignEmployeeToProject,
  unassignEmployeeFromProject,
  getEmployeesByProject,
  getEmployeeProjectAssignment
} from '../controllers/payrollController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Employee Project Assignment Routes (must come before /employees/:id routes)
router.get('/employees/available', getAvailableEmployees);
router.post('/employees/assign', assignEmployeeToProject);
router.get('/employees/project/:projectId', getEmployeesByProject);
router.get('/employees/:employeeId/project', getEmployeeProjectAssignment);
router.put('/employees/:employeeId/unassign', unassignEmployeeFromProject);

// New Payroll Employee Management Routes
router.post('/employees', createPayrollEmployee);
router.get('/employees', getPayrollEmployees);
router.get('/employees/:id', getPayrollEmployee);
router.put('/employees/:id', updatePayrollEmployee);
router.put('/employees/:id/payment', updatePayrollPayment);
router.delete('/employees/:id', deletePayrollEmployee);

// Payroll History Routes
router.get('/history', getPayrollHistory);
router.get('/history/:employeeId', getEmployeePayrollHistory);

// Monthly Payroll Update Route
router.post('/update-monthly', updateMonthlyPayroll);

// Populate payroll employees from regular employees
router.post('/populate-employees', populatePayrollEmployees);

// Legacy Payroll Routes (for backward compatibility)
router.post('/', createPayroll);
router.get('/', getPayrolls);
router.get('/:id', getPayroll);
router.put('/:id', updatePayroll);
router.post('/:id/process', processPayroll);
router.delete('/all', deleteAllPayrolls);

export default router; 