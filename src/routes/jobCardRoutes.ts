import { Router } from 'express';
import * as jobCardController from '../controllers/jobCardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Job card CRUD operations
router.post('/', jobCardController.createJobCard);
router.get('/', jobCardController.getJobCards);
router.get('/:id', jobCardController.getJobCard);
router.put('/:id', jobCardController.editJobCard);
router.delete('/:id', jobCardController.deleteJobCard);

// Job card status operations
router.post('/:id/cancel', jobCardController.cancelJobCard);
router.post('/:id/complete', jobCardController.completeJobCard);

export default router;
