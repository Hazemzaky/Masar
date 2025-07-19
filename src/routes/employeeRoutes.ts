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

// ==================== ATTENDANCE ENDPOINTS ====================
router.post('/:id/attendance/check-in', employeeController.checkIn);
router.post('/:id/attendance/check-out', employeeController.checkOut);
router.post('/:id/attendance/mark-leave', employeeController.markLeave);
router.get('/:id/attendance/history', employeeController.getAttendanceHistory);
router.get('/:id/attendance/stats', employeeController.getAttendanceStats);

export default router;