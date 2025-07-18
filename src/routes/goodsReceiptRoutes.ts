import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  getGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  updateGoodsReceipt,
  deleteGoodsReceipt
} from '../controllers/goodsReceiptController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.get('/', getGoodsReceipts);
router.get('/:id', getGoodsReceiptById);
router.post('/', upload.array('documents'), createGoodsReceipt);
router.put('/:id', updateGoodsReceipt);
router.delete('/:id', deleteGoodsReceipt);

export default router; 