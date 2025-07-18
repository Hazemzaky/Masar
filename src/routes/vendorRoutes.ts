import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} from '../controllers/vendorController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.get('/', getVendors);
router.get('/:id', getVendorById);
router.post('/', upload.single('tradeLicense'), createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router; 