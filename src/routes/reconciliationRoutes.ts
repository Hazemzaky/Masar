import { Router } from 'express';
import { getUnreconciled, getReconciled, markReconciled, uploadBankStatement } from '../controllers/reconciliationController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/unreconciled', authenticate, getUnreconciled);
router.get('/reconciled', authenticate, getReconciled);
router.post('/mark-reconciled', authenticate, markReconciled);
router.post('/upload', authenticate, uploadBankStatement);
export default router; 