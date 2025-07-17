import { Router } from 'express';
import * as ctrl from '../controllers/budgetAssumptionsController';
const router = Router();
router.get('/', ctrl.get);
router.post('/', ctrl.save);
export default router; 