import { Request, Response } from 'express';
import Incident from '../models/Incident';
import RiskAssessment from '../models/RiskAssessment';
import PPE from '../models/PPE';
import SafetyInspection from '../models/SafetyInspection';
import Training from '../models/Training';
import Environmental from '../models/Environmental';

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
    const incident = new Incident({
      ...req.body,
      reportedBy: req.user?.userId
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
    const ppe = new PPE({
      ...req.body,
      issuedBy: req.user?.userId
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
    const safetyInspection = new SafetyInspection({
      ...req.body,
      inspector: req.user?.userId
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
    const safetyInspection = await SafetyInspection.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    const training = new Training(req.body);
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
    const environmental = new Environmental({
      ...req.body,
      reportedBy: req.user?.userId
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

// HSE Dashboard Statistics
export const getHSEDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalIncidents,
      openIncidents,
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
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'open' }),
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
      incidents: { total: totalIncidents, open: openIncidents },
      riskAssessments: { total: totalRiskAssessments, pending: pendingRiskAssessments },
      ppe: { total: totalPPE, expiring: expiringPPE },
      inspections: { total: totalInspections, pending: pendingInspections },
      training: { total: totalTraining, expiring: expiringCertifications },
      environmental: { total: totalEnvironmental, active: activeEnvironmental }
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