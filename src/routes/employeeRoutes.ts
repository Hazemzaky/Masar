import { Router } from 'express';
import * as employeeController from '../controllers/employeeController';

const router = Router();

// Basic CRUD operations
router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Employee management operations
router.put('/:id/deactivate', employeeController.deactivateEmployee);

// Bulk operations
router.put('/bulk/update', employeeController.bulkUpdateEmployees);

// Statistics and analytics
router.get('/stats/overview', employeeController.getEmployeeStats);

export default router;