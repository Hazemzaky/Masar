import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTraining,
  getTrainings,
  getTraining,
  updateTraining,
  deleteTraining,
} from '../controllers/trainingController';

const router = express.Router();

// All routes are protected by authentication
router.use(authenticate);

// GET all trainings
router.get('/', getTrainings);

// GET single training
router.get('/:id', getTraining);

// POST create new training
router.post('/', createTraining);

// PUT update training
router.put('/:id', updateTraining);

// DELETE training
router.delete('/:id', deleteTraining);

export default router; 