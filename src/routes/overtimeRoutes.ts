import { Router } from 'express';
import * as overtimeController from '../controllers/overtimeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, overtimeController.createOvertime);
router.get('/', authenticate, overtimeController.getOvertimes);
router.get('/:id', authenticate, overtimeController.getOvertime);
router.put('/:id', authenticate, overtimeController.updateOvertime);
router.delete('/:id', authenticate, overtimeController.deleteOvertime);

export default router; 