import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTravelAuthorization,
  getTravelAuthorizations,
  getTravelAuthorizationById,
  updateTravelAuthorization,
  deleteTravelAuthorization,
  approveBudget,
  updateVisaRequirements,
  acknowledgePolicy,
  completeSafetyBriefing,
  updateInsuranceStatus,
  getTravelAuthorizationsByEmployee
} from '../controllers/travelAuthorizationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Travel Authorization CRUD operations
router.post('/', createTravelAuthorization);
router.get('/', getTravelAuthorizations);
router.get('/employee/:employeeId', getTravelAuthorizationsByEmployee);
router.get('/:id', getTravelAuthorizationById);
router.put('/:id', updateTravelAuthorization);
router.delete('/:id', deleteTravelAuthorization);

// Travel Authorization workflow
router.post('/:id/budget-approval', approveBudget);
router.put('/:id/visa-requirements', updateVisaRequirements);
router.post('/:id/acknowledge-policy', acknowledgePolicy);
router.post('/:id/safety-briefing', completeSafetyBriefing);
router.put('/:id/insurance', updateInsuranceStatus);

export default router; 