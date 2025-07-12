import { Router } from 'express';
import { closePeriod, getPeriods, getClosedPeriods, openPeriod } from '../controllers/periodController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/close', authenticate, closePeriod);
router.get('/', authenticate, getPeriods);
router.get('/closed', authenticate, getClosedPeriods);
router.put('/:period/open', authenticate, openPeriod);

export default router; 