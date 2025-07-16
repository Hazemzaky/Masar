import { Router } from 'express';
import * as waterLogController from '../controllers/waterLogController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, waterLogController.getWaterLogs);
router.get('/summary', authenticate, waterLogController.getWaterLogSummary);
router.get('/prepaid-cards', authenticate, waterLogController.getPrepaidCards);
router.post('/prepaid-cards/recharge', authenticate, waterLogController.rechargePrepaidCard);
router.post('/prepaid-cards/block-activate', authenticate, waterLogController.blockActivatePrepaidCard);
router.get('/station-activity', authenticate, waterLogController.getStationActivity);
router.get('/alerts', authenticate, waterLogController.getAlerts);
router.get('/:id', authenticate, waterLogController.getWaterLog);
router.post('/', authenticate, waterLogController.createWaterLog);
router.put('/:id', authenticate, waterLogController.updateWaterLog);
router.delete('/:id', authenticate, waterLogController.deleteWaterLog);

export default router; 