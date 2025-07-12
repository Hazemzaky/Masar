import { Router } from 'express';
import * as depreciationController from '../controllers/depreciationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, depreciationController.createDepreciation);
router.get('/', authenticate, depreciationController.getDepreciations);
router.get('/:id', authenticate, depreciationController.getDepreciation);
router.put('/:id', authenticate, depreciationController.updateDepreciation);
router.delete('/:id', authenticate, depreciationController.deleteDepreciation);

export default router; 
