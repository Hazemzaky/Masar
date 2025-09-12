import { Router } from 'express';
import * as compensationController from '../controllers/compensationController';

const router = Router();

// Compensation Structure Routes
router.post('/structures', compensationController.createCompensationStructure);
router.get('/structures', compensationController.getCompensationStructures);
router.get('/structures/:id', compensationController.getCompensationStructure);
router.put('/structures/:id', compensationController.updateCompensationStructure);
router.delete('/structures/:id', compensationController.deleteCompensationStructure);

// Employee Compensation Routes
router.post('/employees', compensationController.createEmployeeCompensation);
router.get('/employees', compensationController.getEmployeeCompensations);
router.get('/employees/:id', compensationController.getEmployeeCompensation);
router.put('/employees/:id', compensationController.updateEmployeeCompensation);
router.delete('/employees/:id', compensationController.deleteEmployeeCompensation);

// Salary Progression Routes
router.post('/progressions', compensationController.createSalaryProgression);
router.get('/progressions', compensationController.getSalaryProgressions);
router.put('/progressions/:id', compensationController.updateSalaryProgression);
router.delete('/progressions/:id', compensationController.deleteSalaryProgression);

// Variable Pay Routes
router.post('/variable-pay', compensationController.createVariablePay);
router.get('/variable-pay', compensationController.getVariablePay);
router.put('/variable-pay/:id', compensationController.updateVariablePay);
router.delete('/variable-pay/:id', compensationController.deleteVariablePay);

// Market Analysis Routes
router.post('/market-analysis', compensationController.createMarketAnalysis);
router.get('/market-analysis', compensationController.getMarketAnalysis);
router.put('/market-analysis/:id', compensationController.updateMarketAnalysis);

// Compensation Reports Routes
router.get('/reports/summary', compensationController.getCompensationSummary);
router.get('/reports/equity', compensationController.getPayEquityReport);
router.get('/reports/cost-analysis', compensationController.getCostAnalysis);
router.get('/reports/benchmarking', compensationController.getBenchmarkingReport);

// Bulk Operations
router.post('/bulk-update', compensationController.bulkUpdateCompensation);
router.post('/bulk-import', compensationController.bulkImportCompensation);

export default router;
