import express from 'express';
import {
  createPayroll,
  getPayrolls,
  getPayroll,
  updatePayroll,
  processPayroll,
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

// New Payroll Employee Management Routes
router.post('/employees', createPayrollEmployee);
router.get('/employees', getPayrollEmployees);
router.get('/employees', getPayrollEmployees);
router.get('/employees/:id', getPayrollEmployee);
router.put('/employees/:id', updatePayrollEmployee);
router.put('/employees/:id/payment', updatePayrollPayment);
router.delete('/employees/:id', deletePayrollEmployee);

// Employee Project Assignment Routes
router.get('/employees/available', getAvailableEmployees);
router.post('/employees/assign', assignEmployeeToProject);
router.put('/employees/:employeeId/unassign', unassignEmployeeFromProject);
router.get('/employees/project/:projectId', getEmployeesByProject);
router.get('/employees/:employeeId/project', getEmployeeProjectAssignment);

// Payroll History Routes
router.get('/history', getPayrollHistory);
router.get('/history/:employeeId', getEmployeePayrollHistory);

// Monthly Payroll Update Route
router.post('/update-monthly', updateMonthlyPayroll);

// Legacy Payroll Routes (for backward compatibility)
router.post('/', createPayroll);
router.get('/', getPayrolls);
router.get('/:id', getPayroll);
router.put('/:id', updatePayroll);
router.post('/:id/process', processPayroll);

export default router; 