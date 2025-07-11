import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  // Incident Management
  createIncident,
  getIncidents,
  updateIncident,
  deleteIncident,
  
  // Risk Assessment Management
  createRiskAssessment,
  getRiskAssessments,
  updateRiskAssessment,
  deleteRiskAssessment,
  
  // PPE Management
  createPPE,
  getPPE,
  updatePPE,
  deletePPE,
  
  // Safety Inspection Management
  createSafetyInspection,
  getSafetyInspections,
  updateSafetyInspection,
  deleteSafetyInspection,
  
  // Training Management
  createTraining,
  getTraining,
  updateTraining,
  deleteTraining,
  
  // Environmental Management
  createEnvironmental,
  getEnvironmental,
  updateEnvironmental,
  deleteEnvironmental,
  
  // Dashboard
  getHSEDashboard
} from '../controllers/hseController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// HSE Dashboard
router.get('/dashboard', getHSEDashboard);

// Incident Management Routes
router.post('/incidents', createIncident);
router.get('/incidents', getIncidents);
router.put('/incidents/:id', updateIncident);
router.delete('/incidents/:id', deleteIncident);

// Risk Assessment Management Routes
router.post('/risk-assessments', createRiskAssessment);
router.get('/risk-assessments', getRiskAssessments);
router.put('/risk-assessments/:id', updateRiskAssessment);
router.delete('/risk-assessments/:id', deleteRiskAssessment);

// PPE Management Routes
router.post('/ppe', createPPE);
router.get('/ppe', getPPE);
router.put('/ppe/:id', updatePPE);
router.delete('/ppe/:id', deletePPE);

// Safety Inspection Management Routes
router.post('/safety-inspections', createSafetyInspection);
router.get('/safety-inspections', getSafetyInspections);
router.put('/safety-inspections/:id', updateSafetyInspection);
router.delete('/safety-inspections/:id', deleteSafetyInspection);

// Training Management Routes
router.post('/training', createTraining);
router.get('/training', getTraining);
router.put('/training/:id', updateTraining);
router.delete('/training/:id', deleteTraining);

// Environmental Management Routes
router.post('/environmental', createEnvironmental);
router.get('/environmental', getEnvironmental);
router.put('/environmental/:id', updateEnvironmental);
router.delete('/environmental/:id', deleteEnvironmental);

export default router; 