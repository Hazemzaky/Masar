import { Router } from 'express';
import { getSummary, getKPIs, getIncomeStatement, getBalanceSheet, getCashFlowStatement, getDashboardSummary, debugExpiringContracts } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/summary', authenticate, getSummary);
router.get('/kpis', authenticate, getKPIs);
router.get('/income-statement', authenticate, getIncomeStatement);
router.get('/balance-sheet', authenticate, getBalanceSheet);
router.get('/cash-flow-statement', authenticate, getCashFlowStatement);
router.get('/dashboard-summary', authenticate, getDashboardSummary);
router.get('/debug-expiring-contracts', authenticate, debugExpiringContracts);
export default router;    
