import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, projectController.createProject);
router.get('/', authenticate, projectController.getProjects);
router.get('/:id', authenticate, projectController.getProject);
router.put('/:id', authenticate, projectController.updateProject);
router.delete('/:id', authenticate, projectController.deleteProject);
router.get('/:id/profitability', authenticate, projectController.getProjectProfitability);
router.get('/assets/available', authenticate, projectController.getAvailableAssets);
router.put('/:id/complete', authenticate, projectController.completeProject);

export default router; 