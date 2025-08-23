import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createGLTransaction,
  getGLEntries,
  getGLSummary,
  getTrialBalance,
  reverseGLTransaction,
  approveGLEntries,
  getGLEntriesByAccount,
  exportGLData
} from '../controllers/glController';

const router = express.Router();

// Apply authentication middleware to all GL routes
router.use(authenticate);

// GL Transaction Management
router.post('/transactions', createGLTransaction);
router.get('/entries', getGLEntries);
router.get('/summary', getGLSummary);
router.get('/trial-balance', getTrialBalance);
router.post('/transactions/reverse', reverseGLTransaction);

// GL Entry Management
router.post('/entries/approve', approveGLEntries);
router.get('/accounts/:accountId/entries', getGLEntriesByAccount);

// Export functionality
router.get('/export', exportGLData);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'General Ledger API is running',
    timestamp: new Date().toISOString()
  });
});

export default router; 