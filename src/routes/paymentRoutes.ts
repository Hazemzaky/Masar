import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  recordPayment,
  getInvoicePayments,
  getPayments,
  updatePaymentStatus,
  reconcilePayments,
  getPaymentAnalytics,
  deletePayment
} from '../controllers/paymentController';

const router = Router();

// Payment routes
router.post('/', authenticate, recordPayment);
router.get('/invoice/:invoiceId', authenticate, getInvoicePayments);
router.get('/', authenticate, getPayments);
router.put('/:id/status', authenticate, updatePaymentStatus);
router.post('/reconcile', authenticate, reconcilePayments);
router.get('/analytics', authenticate, getPaymentAnalytics);
router.delete('/:id', authenticate, deletePayment);

export default router;
