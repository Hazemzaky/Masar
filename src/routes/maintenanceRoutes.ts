import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenanceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, maintenanceController.createMaintenance);
router.get('/', authenticate, maintenanceController.getMaintenances);
router.get('/:id', authenticate, maintenanceController.getMaintenance);
router.put('/:id', authenticate, maintenanceController.updateMaintenance);
router.delete('/:id', authenticate, maintenanceController.deleteMaintenance);
router.post('/:id/complete', authenticate, maintenanceController.completeMaintenance);
router.post('/:id/downtime', authenticate, maintenanceController.trackDowntime);
router.patch('/:id/status', authenticate, maintenanceController.completeMaintenance);

export default router; 
