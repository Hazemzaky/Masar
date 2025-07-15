import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  createEmployeePass,
  getEmployeePasses,
  getEmployeePassById,
  updateEmployeePass,
  deleteEmployeePass
} from '../controllers/employeePassController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', authenticate, upload.single('certificate'), createEmployeePass);
router.get('/', authenticate, getEmployeePasses);
router.get('/:id', authenticate, getEmployeePassById);
router.put('/:id', authenticate, upload.single('certificate'), updateEmployeePass);
router.delete('/:id', authenticate, deleteEmployeePass);

export default router; 