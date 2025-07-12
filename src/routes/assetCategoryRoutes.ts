import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCategoryTree,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/assetCategoryController';

const router = Router();

// All routes: authenticate + admin check (add real admin check in production)
router.use(authenticate);
// TODO: Add admin check middleware here

router.get('/tree', getCategoryTree);
router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router; 