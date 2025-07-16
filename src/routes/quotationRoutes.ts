import { Router } from 'express';
import * as quotationController from '../controllers/quotationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, quotationController.createQuotation);
router.get('/', authenticate, quotationController.getQuotations);
router.get('/:id', authenticate, quotationController.getQuotationById);
router.put('/:id', authenticate, quotationController.updateQuotation);
router.delete('/:id', authenticate, quotationController.deleteQuotation);

export default router; 