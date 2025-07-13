import express from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectProfitability,
  getAvailableAssets,
  completeProject,
  checkEmployeeAvailability
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Project routes
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/profitability', getProjectProfitability);
router.get('/:id/complete', completeProject);

// Asset availability for projects
router.get('/assets/available', getAvailableAssets);

// Employee availability for projects
router.post('/employees/check-availability', checkEmployeeAvailability);

export default router; 