import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTracker,
  getTrackers,
  getTrackerById,
  updateTracker,
  deleteTracker
} from '../controllers/trackerController';

const router = Router();

router.post('/', authenticate, createTracker);
router.get('/', authenticate, getTrackers);
router.get('/:id', authenticate, getTrackerById);
router.put('/:id', authenticate, updateTracker);
router.delete('/:id', authenticate, deleteTracker);

export default router; 