import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient
} from '../controllers/clientController';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file field name
    if (file.fieldname === 'contractFile') {
      cb(null, 'uploads/contracts/');
    } else {
      cb(null, 'uploads/quotations/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'contractFile' ? 'contract-' : 'quotation-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX, XLS, XLSX files
    const allowedTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX files are allowed'));
    }
  }
});

router.post('/', authenticate, upload.single('quotationFile'), createClient);
router.post('/contract', authenticate, upload.single('contractFile'), createClient);
router.get('/', getClients); // Temporarily removed authentication for testing
router.get('/:id', authenticate, getClientById);
router.put('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

export default router; 