import { Router } from 'express';
import { getPnLSummary, getPnLTable, getPnLCharts, getPnLAnalysis } from '../controllers/pnlController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/summary', authenticate, getPnLSummary);
router.get('/table', authenticate, getPnLTable);
router.get('/charts', authenticate, getPnLCharts);
router.get('/analysis', authenticate, getPnLAnalysis);
export default router; 