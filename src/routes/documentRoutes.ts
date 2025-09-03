import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  getDocumentDetails,
  updateDocument,
  deleteDocument,
  getDocumentAuditTrail,
  getDocumentStats,
  bulkDownload,
  upload
} from '../controllers/documentController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Document management routes
router.get('/', getDocuments);
router.post('/upload', upload.array('files', 10), uploadDocument);
router.get('/stats', getDocumentStats);
router.post('/bulk-download', bulkDownload);

// Individual document routes
router.get('/:documentId', getDocumentDetails);
router.get('/:documentId/download', downloadDocument);
router.put('/:documentId', updateDocument);
router.delete('/:documentId', deleteDocument);
router.get('/:documentId/audit', getDocumentAuditTrail);

export default router;
