import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest
} from '../controllers/purchaseRequestController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.get('/', getPurchaseRequests);
router.get('/:id', getPurchaseRequestById);
router.post('/', upload.array('attachments'), createPurchaseRequest);
router.put('/:id', updatePurchaseRequest);
router.delete('/:id', deletePurchaseRequest);

export default router; 