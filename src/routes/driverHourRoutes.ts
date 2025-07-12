import { Router } from 'express';
import * as driverHourController from '../controllers/driverHourController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, driverHourController.createDriverHour);
router.get('/', authenticate, driverHourController.getDriverHours);
router.get('/:id', authenticate, driverHourController.getDriverHour);
router.put('/:id', authenticate, driverHourController.updateDriverHour);
router.delete('/:id', authenticate, driverHourController.deleteDriverHour);

export default router; 
