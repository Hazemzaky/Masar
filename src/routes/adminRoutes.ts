import express from 'express';
import {
  // Employee Residency
  createEmployeeResidency,
  getEmployeeResidencies,
  updateEmployeeResidency,
  deleteEmployeeResidency,
  // Government Documents
  createGovernmentDocument,
  getGovernmentDocuments,
  updateGovernmentDocument,
  deleteGovernmentDocument,
  // Vehicle Registration
  createVehicleRegistration,
  getVehicleRegistrations,
  updateVehicleRegistration,
  deleteVehicleRegistration,
  // Government Correspondence
  createGovernmentCorrespondence,
  getGovernmentCorrespondences,
  updateGovernmentCorrespondence,
  deleteGovernmentCorrespondence,
  // Legal Cases
  createLegalCase,
  getLegalCases,
  updateLegalCase,
  deleteLegalCase,
  // Company Facilities
  createCompanyFacility,
  getCompanyFacilities,
  updateCompanyFacility,
  deleteCompanyFacility,
  // Dashboard
  getAdminDashboard,
  uploadResidencyFiles
} from '../controllers/adminController';
import { getEmployees } from '../controllers/employeeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Dashboard
router.get('/dashboard', authenticate, getAdminDashboard);

// Employee Residency & Visa Tracking
router.post('/employee-residencies', authenticate, uploadResidencyFiles, createEmployeeResidency);
router.get('/employee-residencies', authenticate, getEmployeeResidencies);
router.put('/employee-residencies/:id', authenticate, uploadResidencyFiles, updateEmployeeResidency);
router.delete('/employee-residencies/:id', authenticate, deleteEmployeeResidency);

// Government Document Management
router.post('/government-documents', authenticate, createGovernmentDocument);
router.get('/government-documents', authenticate, getGovernmentDocuments);
router.put('/government-documents/:id', authenticate, updateGovernmentDocument);
router.delete('/government-documents/:id', authenticate, deleteGovernmentDocument);

// Vehicle Registration & Clearance
router.post('/vehicle-registrations', authenticate, createVehicleRegistration);
router.get('/vehicle-registrations', authenticate, getVehicleRegistrations);
router.put('/vehicle-registrations/:id', authenticate, updateVehicleRegistration);
router.delete('/vehicle-registrations/:id', authenticate, deleteVehicleRegistration);

// Government Correspondence Log
router.post('/government-correspondence', authenticate, createGovernmentCorrespondence);
router.get('/government-correspondence', authenticate, getGovernmentCorrespondences);
router.put('/government-correspondence/:id', authenticate, updateGovernmentCorrespondence);
router.delete('/government-correspondence/:id', authenticate, deleteGovernmentCorrespondence);

// Legal Case Management
router.post('/legal-cases', authenticate, createLegalCase);
router.get('/legal-cases', authenticate, getLegalCases);
router.put('/legal-cases/:id', authenticate, updateLegalCase);
router.delete('/legal-cases/:id', authenticate, deleteLegalCase);

// Company Facility Documents
router.post('/company-facilities', authenticate, createCompanyFacility);
router.get('/company-facilities', authenticate, getCompanyFacilities);
router.put('/company-facilities/:id', authenticate, updateCompanyFacility);
router.delete('/company-facilities/:id', authenticate, deleteCompanyFacility);

// Employees
router.get('/employees', authenticate, getEmployees);

export default router; 