import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAccountHierarchy,
  getAccountsByIFRSCategory,
  bulkCreateAccounts,
  getAccountStatistics
} from '../controllers/chartOfAccountsController';

const router = express.Router();

// Apply authentication middleware to all Chart of Accounts routes
router.use(authenticate);

// Account CRUD operations
router.post('/', createAccount);
router.get('/', getAccounts);
router.get('/hierarchy', getAccountHierarchy);
router.get('/ifrs-category', getAccountsByIFRSCategory);
router.get('/statistics', getAccountStatistics);
router.get('/:id', getAccountById);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

// Bulk operations
router.post('/bulk', bulkCreateAccounts);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Chart of Accounts API is running',
    timestamp: new Date().toISOString()
  });
});

export default router; 