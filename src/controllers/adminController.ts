import { Request, Response } from 'express';
import EmployeeResidency from '../models/EmployeeResidency';
import GovernmentDocument from '../models/GovernmentDocument';
import VehicleRegistration from '../models/VehicleRegistration';
import GovernmentCorrespondence from '../models/GovernmentCorrespondence';
import LegalCase from '../models/LegalCase';
import CompanyFacility from '../models/CompanyFacility';
import Employee from '../models/Employee';
import Asset from '../models/Asset';
import { generateSerial } from '../utils/serialUtils';
import multer from 'multer';
import path from 'path';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Multer setup for work permit uploads
const residencyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'workPermitCopy') {
      cb(null, path.join(__dirname, '../../uploads/work_permits'));
    } else if (file.fieldname.startsWith('passCopies')) {
      cb(null, path.join(__dirname, '../../uploads/pass_copies'));
    } else {
      cb(null, path.join(__dirname, '../../uploads/other'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
export const uploadResidencyFiles = multer({ storage: residencyStorage }).fields([
  { name: 'workPermitCopy', maxCount: 1 },
  { name: 'passCopies', maxCount: 10 }
]);

// Employee Residency & Visa Tracking
export const createEmployeeResidency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let data = req.body;
    // Handle workPermitCopy
    if (req.files && (req.files as any).workPermitCopy && (req.files as any).workPermitCopy[0]) {
      data.workPermitCopy = `/uploads/work_permits/${(req.files as any).workPermitCopy[0].filename}`;
    }
    // Handle passCopies
    if (req.files && (req.files as any).passCopies) {
      data.passCopies = (req.files as any).passCopies.map((f: any) => `/uploads/pass_copies/${f.filename}`);
    }
    data.createdBy = req.user?.userId;
    data.updatedBy = req.user?.userId;
    // Ensure work permit fields are properly set
    if (data.workPermitStart) data.workPermitStart = new Date(data.workPermitStart);
    if (data.workPermitEnd) data.workPermitEnd = new Date(data.workPermitEnd);
    // (workPermitCopy is a string, no conversion needed)
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

export const updateEmployeeResidency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let data = req.body;
    // Handle workPermitCopy
    if (req.files && (req.files as any).workPermitCopy && (req.files as any).workPermitCopy[0]) {
      data.workPermitCopy = `/uploads/work_permits/${(req.files as any).workPermitCopy[0].filename}`;
    }
    // Handle passCopies
    if (req.files && (req.files as any).passCopies) {
      data.passCopies = (req.files as any).passCopies.map((f: any) => `/uploads/pass_copies/${f.filename}`);
    }
    data.updatedAt = new Date();
    // Ensure work permit fields are properly set
    if (data.workPermitStart) data.workPermitStart = new Date(data.workPermitStart);
    if (data.workPermitEnd) data.workPermitEnd = new Date(data.workPermitEnd);
    // (workPermitCopy is a string, no conversion needed)
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
    // Serial number generation
    const docCode = 'GD';
    const dept = req.body.department || 'AD';
    const serial = await generateSerial(docCode, dept, GovernmentDocument);
    const document = new GovernmentDocument({
      ...req.body,
      serial,
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
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes,
      // New registration card fields
      registrationCardCountry,
      registrationCardBrand,
      registrationCardCapacity,
      registrationCardShape,
      registrationCardColour,
      // New fields for asset registration type and periodic check
      assetRegistrationType,
      periodicCheck
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
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes,
      // New registration card fields
      registrationCardCountry,
      registrationCardBrand,
      registrationCardCapacity,
      registrationCardShape,
      registrationCardColour,
      // New fields for asset registration type and periodic check
      assetRegistrationType,
      periodicCheck,
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
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes,
      // New registration card fields
      registrationCardCountry,
      registrationCardBrand,
      registrationCardCapacity,
      registrationCardShape,
      registrationCardColour,
      // New fields for asset registration type and periodic check
      assetRegistrationType,
      periodicCheck
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
      hasPasses,
      passes,
      documents,
      status,
      renewalReminders,
      notes,
      // New registration card fields
      registrationCardCountry,
      registrationCardBrand,
      registrationCardCapacity,
      registrationCardShape,
      registrationCardColour,
      // New fields for asset registration type and periodic check
      assetRegistrationType,
      periodicCheck,
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
      // Support new fields
      assignedEmployee: req.body.assignedEmployee,
      hasFee: req.body.hasFee,
      amortization: req.body.amortization,
      fee: req.body.fee,
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
      {
        ...req.body,
        // Support new fields
        assignedEmployee: req.body.assignedEmployee,
        hasFee: req.body.hasFee,
        amortization: req.body.amortization,
        fee: req.body.fee,
        updatedAt: new Date()
      },
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
    // Serial number generation
    const docCode = 'LC';
    const dept = req.body.department || 'LG';
    const serial = await generateSerial(docCode, dept, LegalCase);
    let legalRep = req.body.legalRepresentative;
    if (req.body.legalRepType === 'Internal' && req.body.coId) {
      const emp = await Employee.findOne({ employeeId: req.body.coId });
      if (emp) legalRep.name = emp.name;
      legalRep.firm = undefined;
    }
    if (req.body.legalRepType === 'External') {
      legalRep.firm = req.body.legalRepresentative.firm;
    }
    const legalCase = new LegalCase({
      ...req.body,
      legalRepresentative: legalRep,
      serial,
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
    let legalRep = req.body.legalRepresentative;
    if (req.body.legalRepType === 'Internal' && req.body.coId) {
      const emp = await Employee.findOne({ employeeId: req.body.coId });
      if (emp) legalRep.name = emp.name;
      legalRep.firm = undefined;
    }
    if (req.body.legalRepType === 'External') {
      legalRep.firm = req.body.legalRepresentative.firm;
    }
    const legalCase = await LegalCase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, legalRepresentative: legalRep, updatedAt: new Date() },
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