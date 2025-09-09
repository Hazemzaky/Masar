import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPnLSummary,
  getPnLTable,
  getPnLCharts,
  getPnLAnalysis,
  updateManualPnLEntry,
  getManualPnLEntries,
  updatePnLRealTime,
  receiveDashboardData,
  getVerticalPnLData,
  getRevenue,
  getExpenses,
  getEBITDA,
  getSubCompaniesRevenue
} from '../controllers/pnlController';

const router = express.Router();

// Test endpoint to verify P&L routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'P&L routes are working!', 
    timestamp: new Date().toISOString(),
    endpoint: '/api/pnl/test'
  });
});

// Health check endpoint for manual entries
router.get('/health/manual-entries', async (req, res) => {
  try {
    const ManualPnLEntry = require('../models/ManualPnLEntry').default;
    const count = await ManualPnLEntry.countDocuments({ isActive: true });
    const sample = await ManualPnLEntry.findOne({ isActive: true });
    
    res.json({
      status: 'healthy',
      manualEntriesCount: count,
      hasData: count > 0,
      sampleEntry: sample,
      timestamp: new Date().toISOString(),
      message: count > 0 ? 'Manual entries are available' : 'No manual entries found'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      message: 'Manual entries health check failed'
    });
  }
});

// Manual PnL Entry Management (without auth for testing)
router.get('/manual-entries', getManualPnLEntries);
router.put('/manual-entries/:itemId', updateManualPnLEntry);

// Apply authentication middleware to all other P&L routes
router.use(authenticate);

// P&L Summary - Main dashboard view
router.get('/summary', getPnLSummary);

// Vertical P&L Data - For dashboard integration
router.get('/vertical', getVerticalPnLData);

// Individual Financial Metrics Endpoints
router.get('/revenue', getRevenue);
router.get('/expenses', getExpenses);
router.get('/ebitda', getEBITDA);
router.get('/sub-companies-revenue', getSubCompaniesRevenue);

// P&L Table - Detailed breakdown view
router.get('/table', getPnLTable);

// P&L Charts - Visual representation
router.get('/charts', getPnLCharts);

// P&L Analysis - Trend analysis and insights
router.get('/analysis', getPnLAnalysis);


// Real-time P&L Updates
router.post('/update-realtime', updatePnLRealTime);

// Receive dashboard data from Cost Analysis Dashboards
router.post('/dashboard-data', receiveDashboardData);

// Check for P&L updates endpoint
router.get('/check-updates', (req, res) => {
  // Simple implementation - in production, this would check timestamps
  res.json({ 
    hasUpdates: false, 
    lastUpdate: new Date().toISOString(),
    modules: []
  });
});

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