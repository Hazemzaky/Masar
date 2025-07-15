import { Router } from 'express';
import * as tripAllowanceController from '../controllers/tripAllowanceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, tripAllowanceController.createTripAllowance);
router.get('/', authenticate, tripAllowanceController.getTripAllowances);
router.get('/:id', authenticate, tripAllowanceController.getTripAllowance);
router.put('/:id', authenticate, tripAllowanceController.updateTripAllowance);
router.delete('/:id', authenticate, tripAllowanceController.deleteTripAllowance);

export default router; 