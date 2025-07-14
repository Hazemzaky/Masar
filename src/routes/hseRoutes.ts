import express from 'express';
import multer from 'multer';
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
  
  // Emergency Contacts Management
  createEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  
  // Emergency Plans Management
  createEmergencyPlan,
  getEmergencyPlans,
  updateEmergencyPlan,
  deleteEmergencyPlan,
  
  // Dashboard
  getHSEDashboard
} from '../controllers/hseController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication middleware to all routes
router.use(authenticate);

// Emergency Contacts CRUD
router.post('/emergency-contacts', createEmergencyContact);
router.get('/emergency-contacts', getEmergencyContacts);
router.put('/emergency-contacts/:id', updateEmergencyContact);
router.delete('/emergency-contacts/:id', deleteEmergencyContact);

// Emergency Plans CRUD
router.post('/emergency-plans', upload.single('file'), createEmergencyPlan);
router.get('/emergency-plans', getEmergencyPlans);
router.put('/emergency-plans/:id', upload.single('file'), updateEmergencyPlan);
router.delete('/emergency-plans/:id', deleteEmergencyPlan);

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
router.post('/safety-inspections', upload.array('attachments'), createSafetyInspection);
router.get('/safety-inspections', getSafetyInspections);
router.put('/safety-inspections/:id', upload.array('attachments'), updateSafetyInspection);
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