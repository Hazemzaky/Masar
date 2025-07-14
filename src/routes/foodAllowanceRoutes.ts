import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createFoodAllowance,
  getFoodAllowances,
  getFoodAllowance,
  updateFoodAllowance,
  deleteFoodAllowance
} from '../controllers/FoodAllowanceController';

const router = Router();

router.post('/', authenticate, createFoodAllowance);
router.get('/', authenticate, getFoodAllowances);
router.get('/:id', authenticate, getFoodAllowance);
router.put('/:id', authenticate, updateFoodAllowance);
router.delete('/:id', authenticate, deleteFoodAllowance);

export default router; 