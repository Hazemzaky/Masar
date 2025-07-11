import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTravelRequest,
  getTravelRequests,
  getTravelRequestById,
  updateTravelRequest,
  deleteTravelRequest,
  submitTravelRequest,
  approveTravelRequest,
  getTravelRequestsByEmployee,
  getPendingApprovals
} from '../controllers/travelRequestController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Travel Request CRUD operations
router.post('/', createTravelRequest);
router.get('/', getTravelRequests);
router.get('/pending-approvals', getPendingApprovals);
router.get('/employee/:employeeId', getTravelRequestsByEmployee);
router.get('/:id', getTravelRequestById);
router.put('/:id', updateTravelRequest);
router.delete('/:id', deleteTravelRequest);

// Travel Request workflow
router.post('/:id/submit', submitTravelRequest);
router.post('/:id/approve/:stepIndex', approveTravelRequest);

export default router; 