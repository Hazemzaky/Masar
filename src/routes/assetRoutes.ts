import { Router } from 'express';
import * as assetController from '../controllers/assetController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Debug route to test if requests reach the asset routes (using a more specific path)
router.get('/debug-test', (req, res) => {
  console.log('Asset test route hit');
  res.json({ message: 'Asset routes are working' });
});

router.post('/', authenticate, assetController.createAsset);
router.get('/', authenticate, assetController.getAssets);
router.get('/available', authenticate, assetController.getAvailableAssets);
router.get('/:id', authenticate, assetController.getAsset);
router.put('/:id', authenticate, assetController.updateAsset);
router.delete('/:id', authenticate, assetController.deleteAsset);
router.patch('/:id/status', authenticate, assetController.changeAssetStatus);
router.post('/:id/calculate-depreciation', authenticate, assetController.calculateDepreciation);

export default router; 
