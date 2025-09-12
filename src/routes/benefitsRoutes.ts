import { Router } from 'express';
import * as benefitsController from '../controllers/benefitsController';

const router = Router();

// Benefits Plans Routes
router.post('/plans', benefitsController.createBenefitsPlan);
router.get('/plans', benefitsController.getBenefitsPlans);
router.get('/plans/:id', benefitsController.getBenefitsPlan);
router.put('/plans/:id', benefitsController.updateBenefitsPlan);
router.delete('/plans/:id', benefitsController.deleteBenefitsPlan);

// Employee Benefits Enrollment Routes
router.post('/enrollments', benefitsController.createBenefitsEnrollment);
router.get('/enrollments', benefitsController.getBenefitsEnrollments);
router.get('/enrollments/:id', benefitsController.getBenefitsEnrollment);
router.put('/enrollments/:id', benefitsController.updateBenefitsEnrollment);
router.delete('/enrollments/:id', benefitsController.deleteBenefitsEnrollment);

// Benefits Categories Routes
router.post('/categories', benefitsController.createBenefitsCategory);
router.get('/categories', benefitsController.getBenefitsCategories);
router.put('/categories/:id', benefitsController.updateBenefitsCategory);
router.delete('/categories/:id', benefitsController.deleteBenefitsCategory);

// Benefits Cost Management Routes
router.post('/costs', benefitsController.createBenefitsCost);
router.get('/costs', benefitsController.getBenefitsCosts);
router.put('/costs/:id', benefitsController.updateBenefitsCost);
router.delete('/costs/:id', benefitsController.deleteBenefitsCost);

// Benefits Administration Routes
router.post('/admin/approve', benefitsController.approveBenefitsChange);
router.post('/admin/reject', benefitsController.rejectBenefitsChange);
router.get('/admin/pending', benefitsController.getPendingApprovals);

// Benefits Reports Routes
router.get('/reports/summary', benefitsController.getBenefitsSummary);
router.get('/reports/cost-analysis', benefitsController.getBenefitsCostAnalysis);
router.get('/reports/enrollment', benefitsController.getEnrollmentReport);
router.get('/reports/utilization', benefitsController.getUtilizationReport);

// Employee Self-Service Routes
router.get('/employee/:employeeId/benefits', benefitsController.getEmployeeBenefits);
router.post('/employee/:employeeId/enroll', benefitsController.enrollInBenefits);
router.put('/employee/:employeeId/update', benefitsController.updateEmployeeBenefits);
router.get('/employee/:employeeId/statements', benefitsController.getBenefitsStatements);

// Open Enrollment Routes
router.post('/open-enrollment', benefitsController.createOpenEnrollment);
router.get('/open-enrollment', benefitsController.getOpenEnrollment);
router.put('/open-enrollment/:id', benefitsController.updateOpenEnrollment);
router.post('/open-enrollment/:id/start', benefitsController.startOpenEnrollment);
router.post('/open-enrollment/:id/end', benefitsController.endOpenEnrollment);

// Benefits Communication Routes
router.post('/communications', benefitsController.createBenefitsCommunication);
router.get('/communications', benefitsController.getBenefitsCommunications);
router.put('/communications/:id', benefitsController.updateBenefitsCommunication);

export default router;
