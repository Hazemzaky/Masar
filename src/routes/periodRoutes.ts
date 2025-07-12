import { Router } from 'express';
import { closePeriod, getPeriods } from '../controllers/periodController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/close', authenticate, closePeriod);
router.get('/', authenticate, getPeriods);

export default router; 