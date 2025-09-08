import { Router } from 'express';
import { getAllPendingRequests } from '../controllers/pendingRequestsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllPendingRequests);

export default router;
