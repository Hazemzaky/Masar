import { Router } from 'express';
import * as ctrl from '../controllers/budgetRentalController';

const router = Router();

router.get('/', ctrl.get);
router.post('/', ctrl.save);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
