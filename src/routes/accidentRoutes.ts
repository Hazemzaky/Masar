import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAccident,
  getAccidents,
  getAccident,
  updateAccident,
  deleteAccident
} from '../controllers/accidentController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all accidents
router.get('/', getAccidents);

// GET single accident
router.get('/:id', getAccident);

// POST create new accident
router.post('/', createAccident);

// PUT update accident
router.put('/:id', updateAccident);

// DELETE accident
router.delete('/:id', deleteAccident);

export default router; 