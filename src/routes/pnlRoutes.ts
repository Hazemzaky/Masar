import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPnLSummary,
  getPnLTable,
  getPnLCharts,
  getPnLAnalysis,
  updateManualPnLEntry,
  getManualPnLEntries
} from '../controllers/pnlController';

const router = express.Router();

// Apply authentication middleware to all P&L routes
router.use(authenticate);

// P&L Summary - Main dashboard view
router.get('/summary', getPnLSummary);

// P&L Table - Detailed breakdown view
router.get('/table', getPnLTable);

// P&L Charts - Visual representation
router.get('/charts', getPnLCharts);

// P&L Analysis - Trend analysis and insights
router.get('/analysis', getPnLAnalysis);

// Manual PnL Entry Management
router.get('/manual-entries', getManualPnLEntries);
router.put('/manual-entries/:itemId', updateManualPnLEntry);

// Export routes (to be implemented)
router.get('/export/pdf', (req, res) => {
  // TODO: Implement PDF export
  res.status(501).json({ message: 'PDF export not yet implemented' });
});

router.get('/export/excel', (req, res) => {
  // TODO: Implement Excel export
  res.status(501).json({ message: 'Excel export not yet implemented' });
});

// Health check for P&L system
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    system: 'P&L Statement System',
    version: '1.0.0',
    ifrsCompliant: true,
    features: [
      'IFRS-compliant P&L structure',
      'Multi-period reporting (monthly, quarterly, half-yearly, yearly)',
      'Amortization handling',
      'Revenue recognition tracking',
      'Cost categorization',
      'Margin analysis',
      'Trend analysis',
      'Manual entry management'
    ]
  });
});

export default router; 