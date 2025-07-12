import { Router } from 'express';
import { createBudget, getBudgets, updateBudget, getVariance, updateForecast, scenarioModeling, recalculateActual } from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createBudget);
router.get('/', authenticate, getBudgets);
router.put('/:id', authenticate, updateBudget);
router.get('/:id/variance', authenticate, getVariance);
router.post('/:id/forecast', authenticate, updateForecast);
router.get('/scenario-modeling', authenticate, scenarioModeling);
router.post('/:id/recalculate-actual', authenticate, recalculateActual);

export default router; 