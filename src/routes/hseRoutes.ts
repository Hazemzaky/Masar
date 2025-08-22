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
  
  // HSE Document Library Management
  createHSEDocumentFolder,
  getHSEDocumentFolders,
  updateHSEDocumentFolder,
  deleteHSEDocumentFolder,
  createHSEDocument,
  getHSEDocuments,
  getHSEDocumentById,
  updateHSEDocument,
  deleteHSEDocument,
  approveHSEDocument,
  getHSEDocumentStats,
  
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

// HSE Document Library - Folder Management Routes
router.post('/document-folders', createHSEDocumentFolder);
router.get('/document-folders', getHSEDocumentFolders);
router.put('/document-folders/:id', updateHSEDocumentFolder);
router.delete('/document-folders/:id', deleteHSEDocumentFolder);

// HSE Document Library - Document Management Routes
router.post('/documents', upload.single('file'), createHSEDocument);
router.get('/documents', getHSEDocuments);
router.get('/documents/:id', getHSEDocumentById);
router.put('/documents/:id', upload.single('file'), updateHSEDocument);
router.delete('/documents/:id', deleteHSEDocument);

// HSE Document Library - Approval Routes
router.post('/documents/:id/approve', approveHSEDocument);

// HSE Document Library - Statistics Routes
router.get('/document-stats', getHSEDocumentStats);

export default router; 