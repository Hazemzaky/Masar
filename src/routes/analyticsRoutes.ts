import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getInvoiceAnalytics,
  getPaymentAnalytics,
  getCustomerAnalytics,
  getDashboardData
} from '../controllers/analyticsController';

const router = Router();

// Analytics routes
router.get('/invoices', authenticate, getInvoiceAnalytics);
router.get('/payments', authenticate, getPaymentAnalytics);
router.get('/customers', authenticate, getCustomerAnalytics);
router.get('/dashboard', authenticate, getDashboardData);

export default router;
