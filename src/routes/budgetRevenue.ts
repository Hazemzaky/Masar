import { Router } from 'express';
import * as ctrl from '../controllers/budgetRevenueController';
const router = Router();

// GET /api/budget/revenue - Get all budget revenue records
router.get('/', ctrl.get);

// POST /api/budget/revenue - Create or update a single budget revenue record
router.post('/', ctrl.save);

// PUT /api/budget/revenue/:id - Update a specific budget revenue record
router.put('/:id', ctrl.update);

// DELETE /api/budget/revenue/:id - Delete a specific budget revenue record
router.delete('/:id', ctrl.remove);

// POST /api/budget/revenue/bulk - Bulk save budget revenue records
router.post('/bulk', ctrl.bulkSave);

export default router; 