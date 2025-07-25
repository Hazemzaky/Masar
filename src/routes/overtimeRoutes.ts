import { Router } from 'express';
import * as overtimeController from '../controllers/overtimeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, overtimeController.createOvertime);
router.get('/', authenticate, overtimeController.getOvertimes);
router.get('/:id', authenticate, overtimeController.getOvertime);
router.put('/:id', authenticate, overtimeController.updateOvertime);
router.delete('/:id', authenticate, overtimeController.deleteOvertime);
router.post('/attendance', authenticate, overtimeController.createOvertimeAttendance);
router.get('/attendance', authenticate, overtimeController.getOvertimeAttendances);
router.put('/attendance/:id', authenticate, overtimeController.updateOvertimeAttendance);
router.delete('/attendance/:id', authenticate, overtimeController.deleteOvertimeAttendance);

export default router; 