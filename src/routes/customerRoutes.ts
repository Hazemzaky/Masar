import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerInvoices,
  getCustomerPayments,
  updateCustomerStats,
  getCustomerAnalytics,
  searchCustomers
} from '../controllers/customerController';

const router = Router();

// Customer routes
router.post('/', authenticate, createCustomer);
router.get('/', authenticate, getCustomers);
router.get('/search', authenticate, searchCustomers);
router.get('/:id', authenticate, getCustomer);
router.put('/:id', authenticate, updateCustomer);
router.delete('/:id', authenticate, deleteCustomer);
router.get('/:id/invoices', authenticate, getCustomerInvoices);
router.get('/:id/payments', authenticate, getCustomerPayments);
router.post('/:id/update-stats', authenticate, updateCustomerStats);
router.get('/:id/analytics', authenticate, getCustomerAnalytics);

export default router;
