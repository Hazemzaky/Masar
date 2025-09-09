import express from 'express';
import {
  initializeDefaultEntries,
  getAllManualEntries,
  getManualEntry,
  createManualEntry,
  updateManualEntry,
  deleteManualEntry,
  bulkUpdateEntries,
  getManualEntriesSummary,
  resetToDefaults,
  healthCheck
} from '../controllers/manualEntriesController';

const router = express.Router();

// Health check
router.get('/health', healthCheck);

// Initialize default entries (admin only)
router.post('/initialize', initializeDefaultEntries);

// Get all manual entries
router.get('/', getAllManualEntries);

// Get manual entries summary for P&L integration
router.get('/summary', getManualEntriesSummary);

// Get single manual entry
router.get('/:itemId', getManualEntry);

// Create new manual entry
router.post('/', createManualEntry);

// Update manual entry
router.put('/:itemId', updateManualEntry);

// Bulk update multiple entries
router.put('/bulk/update', bulkUpdateEntries);

// Delete manual entry (soft delete)
router.delete('/:itemId', deleteManualEntry);

// Reset all entries to defaults (admin only)
router.post('/reset', resetToDefaults);

export default router;
