import { Request, Response } from 'express';
import Incident from '../models/Incident';
import RiskAssessment from '../models/RiskAssessment';
import PPE from '../models/PPE';
import SafetyInspection from '../models/SafetyInspection';
import Training from '../models/Training';
import Environmental from '../models/Environmental';
import EmergencyContact from '../models/EmergencyContact';
import EmergencyPlan from '../models/EmergencyPlan';

import User from '../models/User';
import Employee from '../models/Employee';

// Extend Request interface to include user property
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Incident Management
export const createIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Serial number generation
    const docCode = 'IN';
    const department = req.body.department || 'HS'; // Default to HS (HSE)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    // Count existing incidents for this department and date
    const count = await Incident.countDocuments({
      serial: { $regex: `^${docCode}-${department}-${dateStr}-` }
    });
    const seq = String(count + 1).padStart(3, '0');
    const serial = `${docCode}-${department}-${dateStr}-${seq}`;

    const incident = new Incident({
      ...req.body,
      reportedBy: req.user?.userId,
      serial
    });
    await incident.save();
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await Incident.find()
      .populate('reportedBy', 'email')
      .populate('assignedTo', 'email')
      .populate('closedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('reportedBy', 'email')
     .populate('assignedTo', 'email')
     .populate('closedBy', 'email');
    
    if (!incident) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }
    res.json(incident);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Risk Assessment Management
export const createRiskAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const riskAssessment = new RiskAssessment({
      ...req.body,
      assessor: req.user?.userId
    });
    await riskAssessment.save();
    res.status(201).json(riskAssessment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRiskAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const riskAssessments = await RiskAssessment.find()
      .populate('assessor', 'email')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(riskAssessments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRiskAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const riskAssessment = await RiskAssessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assessor', 'email')
     .populate('approvedBy', 'email');
    
    if (!riskAssessment) {
      res.status(404).json({ message: 'Risk assessment not found' });
      return;
    }
    res.json(riskAssessment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// PPE Management
export const createPPE = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Serial number generation
    const docCode = 'PPE';
    const department = req.body.department || 'HS';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    const count = await PPE.countDocuments({
      serial: { $regex: `^${docCode}-${department}-${dateStr}-` }
    });
    const seq = String(count + 1).padStart(3, '0');
    const serial = `${docCode}-${department}-${dateStr}-${seq}`;
    const ppe = new PPE({
      ...req.body,
      issuedBy: req.user?.userId,
      serial
    });
    await ppe.save();
    res.status(201).json(ppe);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPPE = async (req: Request, res: Response): Promise<void> => {
  try {
    const ppe = await PPE.find()
      .populate('employee', 'name email')
      .populate('issuedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(ppe);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePPE = async (req: Request, res: Response): Promise<void> => {
  try {
    const ppe = await PPE.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('employee', 'name email')
     .populate('issuedBy', 'email');
    
    if (!ppe) {
      res.status(404).json({ message: 'PPE record not found' });
      return;
    }
    res.json(ppe);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Safety Inspection Management
export const createSafetyInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let attachments: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      attachments = req.files.map((file: any) => `/uploads/${file.filename}`);
    }
    // Merge with any attachments from req.body (for non-file uploads)
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      attachments = attachments.concat(req.body.attachments);
    }
    // Serial number generation
    const docCode = 'SI';
    const department = req.body.department || 'HS';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    const count = await SafetyInspection.countDocuments({
      serial: { $regex: `^${docCode}-${department}-${dateStr}-` }
    });
    const seq = String(count + 1).padStart(3, '0');
    const serial = `${docCode}-${department}-${dateStr}-${seq}`;
    const safetyInspection = new SafetyInspection({
      ...req.body,
      attachments,
      inspector: req.user?.userId,
      serial
    });
    await safetyInspection.save();
    res.status(201).json(safetyInspection);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSafetyInspections = async (req: Request, res: Response): Promise<void> => {
  try {
    const safetyInspections = await SafetyInspection.find()
      .populate('inspector', 'email')
      .populate('completedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(safetyInspections);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSafetyInspection = async (req: Request, res: Response): Promise<void> => {
  try {
    let attachments: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      attachments = req.files.map((file: any) => `/uploads/${file.filename}`);
    }
    // Merge with any attachments from req.body (for non-file uploads)
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      attachments = attachments.concat(req.body.attachments);
    }
    const updateData = { ...req.body };
    if (attachments.length > 0) {
      updateData.attachments = attachments;
    }
    const safetyInspection = await SafetyInspection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('inspector', 'email')
     .populate('completedBy', 'email');
    
    if (!safetyInspection) {
      res.status(404).json({ message: 'Safety inspection not found' });
      return;
    }
    res.json(safetyInspection);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Training Management
export const createTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    // Serial number generation
    const docCode = 'TR';
    const department = req.body.department || 'HR';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    const count = await Training.countDocuments({
      serial: { $regex: `^${docCode}-${department}-${dateStr}-` }
    });
    const seq = String(count + 1).padStart(3, '0');
    const serial = `${docCode}-${department}-${dateStr}-${seq}`;
    const training = new Training({
      ...req.body,
      serial
    });
    await training.save();
    res.status(201).json(training);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const training = await Training.find()
      .populate('employee', 'name email')
      .sort({ createdAt: -1 });
    res.json(training);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('employee', 'name email');
    
    if (!training) {
      res.status(404).json({ message: 'Training record not found' });
      return;
    }
    res.json(training);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Environmental Management
export const createEnvironmental = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Serial number generation
    const docCode = 'EN';
    const department = req.body.department || 'HS';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    const count = await Environmental.countDocuments({
      serial: { $regex: `^${docCode}-${department}-${dateStr}-` }
    });
    const seq = String(count + 1).padStart(3, '0');
    const serial = `${docCode}-${department}-${dateStr}-${seq}`;
    const environmental = new Environmental({
      ...req.body,
      reportedBy: req.user?.userId,
      serial
    });
    await environmental.save();
    res.status(201).json(environmental);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEnvironmental = async (req: Request, res: Response): Promise<void> => {
  try {
    const environmental = await Environmental.find()
      .populate('reportedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(environmental);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEnvironmental = async (req: Request, res: Response): Promise<void> => {
  try {
    const environmental = await Environmental.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('reportedBy', 'email');
    
    if (!environmental) {
      res.status(404).json({ message: 'Environmental record not found' });
      return;
    }
    res.json(environmental);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Emergency Contacts CRUD
export const createEmergencyContact = async (req: Request, res: Response) => {
  try {
    const contact = new EmergencyContact(req.body);
    await contact.save();
    res.status(201).json(contact);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEmergencyContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await EmergencyContact.find().sort({ name: 1 });
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmergencyContact = async (req: Request, res: Response) => {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contact) {
      res.status(404).json({ message: 'Emergency contact not found' });
      return;
    }
    res.json(contact);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmergencyContact = async (req: Request, res: Response) => {
  try {
    const contact = await EmergencyContact.findByIdAndDelete(req.params.id);
    if (!contact) {
      res.status(404).json({ message: 'Emergency contact not found' });
      return;
    }
    res.json({ message: 'Emergency contact deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Emergency Plans CRUD
export const createEmergencyPlan = async (req: Request, res: Response) => {
  try {
    let fileUrl = req.body.fileUrl;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }
    const plan = new EmergencyPlan({ ...req.body, fileUrl });
    await plan.save();
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEmergencyPlans = async (req: Request, res: Response) => {
  try {
    const plans = await EmergencyPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmergencyPlan = async (req: Request, res: Response) => {
  try {
    let fileUrl = req.body.fileUrl;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }
    const plan = await EmergencyPlan.findByIdAndUpdate(req.params.id, { ...req.body, fileUrl }, { new: true });
    if (!plan) {
      res.status(404).json({ message: 'Emergency plan not found' });
      return;
    }
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmergencyPlan = async (req: Request, res: Response) => {
  try {
    const plan = await EmergencyPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      res.status(404).json({ message: 'Emergency plan not found' });
      return;
    }
    res.json({ message: 'Emergency plan deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// HSE Dashboard Statistics
export const getHSEDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Incidents
    const [
      totalIncidents,
      openIncidents,
      ltiCount,
      nearMissCount,
      vehicleAccidentCount,
      ltiIncidents,
      nearMissIncidents,
      accidentIncidents
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ tags: 'LTI' }),
      Incident.countDocuments({ type: 'near_miss' }),
      Incident.countDocuments({ type: 'accident' }),
      Incident.find({ tags: 'LTI' }),
      Incident.find({ type: 'near_miss' }),
      Incident.find({ type: 'accident' })
    ]);

    // Open Safety Actions: count open correctiveActions in incidents, risk assessments, inspections
    const [
      incidentsWithOpenActions,
      riskAssessmentsWithOpenActions,
      inspectionsWithOpenActions
    ] = await Promise.all([
      Incident.find({ correctiveActions: { $exists: true, $ne: null } }),
      RiskAssessment.find({ 'hazards.status': { $in: ['pending', 'in_progress', 'overdue'] } }),
      SafetyInspection.find({ 'items.actionStatus': { $in: ['open', 'in_progress', 'overdue'] } })
    ]);
    let openSafetyActions = 0;
    incidentsWithOpenActions.forEach(inc => {
      if (Array.isArray(inc.correctiveActions)) openSafetyActions += inc.correctiveActions.length;
      else if (inc.correctiveActions) openSafetyActions += 1;
    });
    riskAssessmentsWithOpenActions.forEach(risk => {
      if (Array.isArray(risk.hazards)) {
        openSafetyActions += risk.hazards.filter(h => ['pending', 'in_progress', 'overdue'].includes(h.status)).length;
      }
    });
    inspectionsWithOpenActions.forEach(ins => {
      if (Array.isArray(ins.items)) {
        openSafetyActions += ins.items.filter(i => ['open', 'in_progress', 'overdue'].includes(i.actionStatus)).length;
      }
    });

    // Audit Score: average of last 5 SafetyInspection overallScore
    const recentInspections = await SafetyInspection.find().sort({ inspectionDate: -1 }).limit(5);
    const auditScore = recentInspections.length > 0 ?
      (recentInspections.reduce((sum, i) => sum + (i.overallScore || 0), 0) / recentInspections.length).toFixed(1) : null;

    // Site Risk Levels: highest overallRiskLevel per location from risk assessments
    const riskAssessments = await RiskAssessment.find();
    const siteRiskLevels: Record<string, string> = {};
    const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    riskAssessments.forEach(risk => {
      if (!risk.location) return;
      const current = siteRiskLevels[risk.location];
      const level = risk.overallRiskLevel as keyof typeof riskOrder;
      const currentLevel = current as keyof typeof riskOrder;
      if (!current || riskOrder[level] > riskOrder[currentLevel]) {
        siteRiskLevels[risk.location] = risk.overallRiskLevel;
      }
    });

    // Existing stats
    const [
      totalRiskAssessments,
      pendingRiskAssessments,
      totalPPE,
      expiringPPE,
      totalInspections,
      pendingInspections,
      totalTraining,
      expiringCertifications,
      totalEnvironmental,
      activeEnvironmental
    ] = await Promise.all([
      RiskAssessment.countDocuments(),
      RiskAssessment.countDocuments({ status: 'pending_approval' }),
      PPE.countDocuments(),
      PPE.countDocuments({ 'ppeItems.expiryDate': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
      SafetyInspection.countDocuments(),
      SafetyInspection.countDocuments({ status: 'scheduled' }),
      Training.countDocuments(),
      Training.countDocuments({ 'certificates.expiryDate': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
      Environmental.countDocuments(),
      Environmental.countDocuments({ status: 'active' })
    ]);

    res.json({
      incidents: { total: totalIncidents, open: openIncidents, lti: ltiCount, nearMiss: nearMissCount, vehicleAccident: vehicleAccidentCount },
      riskAssessments: { total: totalRiskAssessments, pending: pendingRiskAssessments },
      ppe: { total: totalPPE, expiring: expiringPPE },
      inspections: { total: totalInspections, pending: pendingInspections },
      training: { total: totalTraining, expiring: expiringCertifications },
      environmental: { total: totalEnvironmental, active: activeEnvironmental },
      openSafetyActions,
      auditScore,
      siteRiskLevels
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete operations
export const deleteIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }
    res.json({ message: 'Incident deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRiskAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const riskAssessment = await RiskAssessment.findByIdAndDelete(req.params.id);
    if (!riskAssessment) {
      res.status(404).json({ message: 'Risk assessment not found' });
      return;
    }
    res.json({ message: 'Risk assessment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePPE = async (req: Request, res: Response): Promise<void> => {
  try {
    const ppe = await PPE.findByIdAndDelete(req.params.id);
    if (!ppe) {
      res.status(404).json({ message: 'PPE record not found' });
      return;
    }
    res.json({ message: 'PPE record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSafetyInspection = async (req: Request, res: Response): Promise<void> => {
  try {
    const safetyInspection = await SafetyInspection.findByIdAndDelete(req.params.id);
    if (!safetyInspection) {
      res.status(404).json({ message: 'Safety inspection not found' });
      return;
    }
    res.json({ message: 'Safety inspection deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training record not found' });
      return;
    }
    res.json({ message: 'Training record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEnvironmental = async (req: Request, res: Response): Promise<void> => {
  try {
    const environmental = await Environmental.findByIdAndDelete(req.params.id);
    if (!environmental) {
      res.status(404).json({ message: 'Environmental record not found' });
      return;
    }
    res.json({ message: 'Environmental record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 