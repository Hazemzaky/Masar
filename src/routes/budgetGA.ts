import { Router } from 'express';
import * as ctrl from '../controllers/budgetGAController';
const router = Router();
router.get('/', ctrl.get);
router.post('/', ctrl.save);
router.post('/bulk', ctrl.bulkSave);
export default router;
