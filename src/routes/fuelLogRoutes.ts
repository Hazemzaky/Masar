import { Router } from 'express';
import * as fuelLogController from '../controllers/fuelLogController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, fuelLogController.createFuelLog);
router.get('/', authenticate, fuelLogController.getFuelLogs);
router.get('/:id', authenticate, fuelLogController.getFuelLog);
router.put('/:id', authenticate, fuelLogController.updateFuelLog);
router.delete('/:id', authenticate, fuelLogController.deleteFuelLog);

export default router; 
