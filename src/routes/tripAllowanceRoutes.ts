import { Router } from 'express';
import * as tripAllowanceController from '../controllers/tripAllowanceController';
import { authenticate } from '../middleware/auth';
import { updateTripAllowanceAmount } from '../controllers/tripAllowanceController';

const router = Router();

router.post('/', authenticate, tripAllowanceController.createTripAllowance);
router.get('/', authenticate, tripAllowanceController.getTripAllowances);
router.get('/:id', authenticate, tripAllowanceController.getTripAllowance);
router.put('/:id', authenticate, tripAllowanceController.updateTripAllowance);
router.delete('/:id', authenticate, tripAllowanceController.deleteTripAllowance);
router.patch('/:id/allowance', authenticate, updateTripAllowanceAmount);

export default router; 