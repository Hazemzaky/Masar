import { Request, Response } from 'express';
import EmployeeResidency from '../models/EmployeeResidency';
import GovernmentDocument from '../models/GovernmentDocument';
import VehicleRegistration from '../models/VehicleRegistration';
import GovernmentCorrespondence from '../models/GovernmentCorrespondence';
import LegalCase from '../models/LegalCase';
import CompanyFacility from '../models/CompanyFacility';
import Employee from '../models/Employee';
import Asset from '../models/Asset';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Employee Residency & Visa Tracking
export const createEmployeeResidency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let data = { ...req.body, createdBy: req.user?.userId, updatedBy: req.user?.userId };
    if (data.employeeType === 'citizen') {
      data.residencyNumber = undefined;
      data.residencyExpiry = undefined;
    } else if (data.employeeType === 'foreigner') {
      data.civilId = undefined;
      data.civilIdExpiry = undefined;
    }
    const residency = new EmployeeResidency(data);
    await residency.save();
    res.status(201).json(residency);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEmployeeResidencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const residencies = await EmployeeResidency.find().populate('employee', 'name email');
    res.json(residencies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployeeResidency = async (req: Request, res: Response): Promise<void> => {
  try {
    let data = { ...req.body, updatedAt: new Date() };
    if (data.employeeType === 'citizen') {
      data.residencyNumber = undefined;
      data.residencyExpiry = undefined;
    } else if (data.employeeType === 'foreigner') {
      data.civilId = undefined;
      data.civilIdExpiry = undefined;
    }
    const residency = await EmployeeResidency.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );
    if (!residency) {
      res.status(404).json({ message: 'Employee residency not found' });
      return;
    }
    res.json(residency);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmployeeResidency = async (req: Request, res: Response): Promise<void> => {
  try {
    const residency = await EmployeeResidency.findByIdAndDelete(req.params.id);
    if (!residency) {
      res.status(404).json({ message: 'Employee residency not found' });
      return;
    }
    res.json({ message: 'Employee residency deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Government Document Management
export const createGovernmentDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = new GovernmentDocument({
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });
    await document.save();
    res.status(201).json(document);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getGovernmentDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await GovernmentDocument.find();
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGovernmentDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const document = await GovernmentDocument.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!document) {
      res.status(404).json({ message: 'Government document not found' });
      return;
    }
    res.json(document);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGovernmentDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const document = await GovernmentDocument.findByIdAndDelete(req.params.id);
    if (!document) {
      res.status(404).json({ message: 'Government document not found' });
      return;
    }
    res.json({ message: 'Government document deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Vehicle Registration & Clearance
export const createVehicleRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Destructure and map new fields for clarity
    const {
      vehicle,
      plateNumber,
      chassisNumber,
      engineNumber,
      registrationNumber,
      registrationExpiry,
      insuranceCompany,
      insurancePolicyNumber,
      insuranceExpiry,
      insuranceCost,
      insurancePaymentSystem,
      insuranceInstallmentPeriod,
      customsClearance,
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes
    } = req.body;

    const registration = new VehicleRegistration({
      vehicle,
      plateNumber,
      chassisNumber,
      engineNumber,
      registrationNumber,
      registrationExpiry,
      insuranceCompany,
      insurancePolicyNumber,
      insuranceExpiry,
      insuranceCost,
      insurancePaymentSystem,
      insuranceInstallmentPeriod,
      customsClearance,
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });
    await registration.save();
    res.status(201).json(registration);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getVehicleRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const registrations = await VehicleRegistration.find().populate('vehicle', 'description plateNumber');
    res.json(registrations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicleRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    // Destructure and map new fields for clarity
    const {
      vehicle,
      plateNumber,
      chassisNumber,
      engineNumber,
      registrationNumber,
      registrationExpiry,
      insuranceCompany,
      insurancePolicyNumber,
      insuranceExpiry,
      insuranceCost,
      insurancePaymentSystem,
      insuranceInstallmentPeriod,
      customsClearance,
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes
    } = req.body;

    const updateData = {
      vehicle,
      plateNumber,
      chassisNumber,
      engineNumber,
      registrationNumber,
      registrationExpiry,
      insuranceCompany,
      insurancePolicyNumber,
      insuranceExpiry,
      insuranceCost,
      insurancePaymentSystem,
      insuranceInstallmentPeriod,
      customsClearance,
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes,
      updatedAt: new Date()
    };

    const registration = await VehicleRegistration.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!registration) {
      res.status(404).json({ message: 'Vehicle registration not found' });
      return;
    }
    res.json(registration);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicleRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const registration = await VehicleRegistration.findByIdAndDelete(req.params.id);
    if (!registration) {
      res.status(404).json({ message: 'Vehicle registration not found' });
      return;
    }
    res.json({ message: 'Vehicle registration deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Government Correspondence Log
export const createGovernmentCorrespondence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const correspondence = new GovernmentCorrespondence({
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });
    await correspondence.save();
    res.status(201).json(correspondence);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getGovernmentCorrespondences = async (req: Request, res: Response): Promise<void> => {
  try {
    const correspondences = await GovernmentCorrespondence.find().populate('assignedTo', 'name email');
    res.json(correspondences);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGovernmentCorrespondence = async (req: Request, res: Response): Promise<void> => {
  try {
    const correspondence = await GovernmentCorrespondence.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!correspondence) {
      res.status(404).json({ message: 'Government correspondence not found' });
      return;
    }
    res.json(correspondence);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGovernmentCorrespondence = async (req: Request, res: Response): Promise<void> => {
  try {
    const correspondence = await GovernmentCorrespondence.findByIdAndDelete(req.params.id);
    if (!correspondence) {
      res.status(404).json({ message: 'Government correspondence not found' });
      return;
    }
    res.json({ message: 'Government correspondence deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Legal Case Management
export const createLegalCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const legalCase = new LegalCase({
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });
    await legalCase.save();
    res.status(201).json(legalCase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLegalCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const cases = await LegalCase.find().populate('assignedTo', 'name email');
    res.json(cases);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLegalCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const legalCase = await LegalCase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!legalCase) {
      res.status(404).json({ message: 'Legal case not found' });
      return;
    }
    res.json(legalCase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLegalCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const legalCase = await LegalCase.findByIdAndDelete(req.params.id);
    if (!legalCase) {
      res.status(404).json({ message: 'Legal case not found' });
      return;
    }
    res.json({ message: 'Legal case deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Company Facility Documents
export const createCompanyFacility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const facility = new CompanyFacility({
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });
    await facility.save();
    res.status(201).json(facility);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCompanyFacilities = async (req: Request, res: Response): Promise<void> => {
  try {
    const facilities = await CompanyFacility.find();
    res.json(facilities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompanyFacility = async (req: Request, res: Response): Promise<void> => {
  try {
    const facility = await CompanyFacility.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!facility) {
      res.status(404).json({ message: 'Company facility not found' });
      return;
    }
    res.json(facility);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCompanyFacility = async (req: Request, res: Response): Promise<void> => {
  try {
    const facility = await CompanyFacility.findByIdAndDelete(req.params.id);
    if (!facility) {
      res.status(404).json({ message: 'Company facility not found' });
      return;
    }
    res.json({ message: 'Company facility deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Dashboard
export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Expiring residencies
    const expiringResidencies = await EmployeeResidency.find({
      $or: [
        { residencyExpiry: { $lte: thirtyDaysFromNow, $gte: today } },
        { passportExpiry: { $lte: thirtyDaysFromNow, $gte: today } },
        { civilIdExpiry: { $lte: thirtyDaysFromNow, $gte: today } },
        { visaExpiry: { $lte: thirtyDaysFromNow, $gte: today } }
      ]
    }).populate('employee', 'name');

    // Expiring government documents
    const expiringDocuments = await GovernmentDocument.find({
      expiryDate: { $lte: sixtyDaysFromNow, $gte: today }
    });

    // Expiring vehicle registrations
    const expiringVehicles = await VehicleRegistration.find({
      $or: [
        { registrationExpiry: { $lte: thirtyDaysFromNow, $gte: today } },
        { insuranceExpiry: { $lte: thirtyDaysFromNow, $gte: today } }
      ]
    }).populate('vehicle', 'description plateNumber');

    // Pending correspondence
    const pendingCorrespondence = await GovernmentCorrespondence.find({
      status: { $in: ['submitted', 'under_review', 'pending_documents'] }
    });

    // Active legal cases
    const activeLegalCases = await LegalCase.find({
      status: { $in: ['open', 'pending', 'in_progress'] }
    });

    // Summary statistics
    const totalResidencies = await EmployeeResidency.countDocuments();
    const totalDocuments = await GovernmentDocument.countDocuments();
    const totalVehicles = await VehicleRegistration.countDocuments();
    const totalCorrespondence = await GovernmentCorrespondence.countDocuments();
    const totalLegalCases = await LegalCase.countDocuments();
    const totalFacilities = await CompanyFacility.countDocuments();

    res.json({
      expiringResidencies,
      expiringDocuments,
      expiringVehicles,
      pendingCorrespondence,
      activeLegalCases,
      summary: {
        totalResidencies,
        totalDocuments,
        totalVehicles,
        totalCorrespondence,
        totalLegalCases,
        totalFacilities
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 