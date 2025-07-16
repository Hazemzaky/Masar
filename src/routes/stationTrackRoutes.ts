import { Router } from 'express';
import * as stationTrackController from '../controllers/stationTrackController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, stationTrackController.getStationTracks);
router.post('/', authenticate, stationTrackController.createStationTrack);
router.put('/:id', authenticate, stationTrackController.updateStationTrack);
router.delete('/:id', authenticate, stationTrackController.deleteStationTrack);

export default router; 