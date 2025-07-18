import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  getProcurementInvoices,
  getProcurementInvoiceById,
  createProcurementInvoice,
  updateProcurementInvoice,
  deleteProcurementInvoice
} from '../controllers/procurementInvoiceController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.get('/', getProcurementInvoices);
router.get('/:id', getProcurementInvoiceById);
router.post('/', upload.single('invoiceFile'), createProcurementInvoice);
router.put('/:id', updateProcurementInvoice);
router.delete('/:id', deleteProcurementInvoice);

export default router; 