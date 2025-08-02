import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createNearMiss,
  getNearMisses,
  getNearMiss,
  updateNearMiss,
  deleteNearMiss
} from '../controllers/nearMissController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all near misses
router.get('/', getNearMisses);

// GET single near miss
router.get('/:id', getNearMiss);

// POST create new near miss
router.post('/', createNearMiss);

// PUT update near miss
router.put('/:id', updateNearMiss);

// DELETE near miss
router.delete('/:id', deleteNearMiss);

export default router; 