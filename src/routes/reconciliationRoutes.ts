import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboard,
  createSession,
  uploadStatement,
  getSessionDetails,
  performAutoMatch,
  manualMatch,
  createAdjustingEntry,
  completeReconciliation,
  upload
} from '../controllers/reconciliationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard and overview routes
router.get('/dashboard', getDashboard);

// Session management routes
router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSessionDetails);

// Statement upload and processing
router.post('/sessions/:sessionId/upload', upload.single('statement'), uploadStatement);

// Matching operations
router.post('/sessions/:sessionId/auto-match', performAutoMatch);
router.post('/sessions/:sessionId/manual-match', manualMatch);

// Adjustment and completion
router.post('/sessions/:sessionId/adjustments', createAdjustingEntry);
router.post('/sessions/:sessionId/complete', completeReconciliation);

export default router;