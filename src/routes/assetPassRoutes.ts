import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  createAssetPass,
  getAssetPasses,
  getAssetPassById,
  updateAssetPass,
  deleteAssetPass
} from '../controllers/assetPassController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', authenticate, upload.single('certificate'), createAssetPass);
router.get('/', authenticate, getAssetPasses);
router.get('/:id', authenticate, getAssetPassById);
router.put('/:id', authenticate, upload.single('certificate'), updateAssetPass);
router.delete('/:id', authenticate, deleteAssetPass);

export default router; 