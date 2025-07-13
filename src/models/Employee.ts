import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  benefits: { type: string; value: number }[];
  leaveBalance: number;
  active: boolean;
  hireDate: Date;
  terminationDate?: Date;
  // Additional fields for comprehensive employee management
  photo?: string;
  location?: string;
  supervisor?: string;
  status?: string;
  employmentType?: string;
  dateOfHire?: string;
  contractExpiryDate?: string;
  shiftSchedule?: string;
  workSchedule?: string;
  employeeGrade?: string;
  licenseType?: string;
  licenseExpiryDate?: string;
  assignedVehicle?: string;
  routeHistory?: string;
  gpsTrackingStatus?: boolean;
  certifiedEquipment?: string;
  currentShiftZone?: string;
  pickRate?: string;
  errorRate?: string;
  directReports?: string;
  currentProjects?: string;
  departmentalKPIs?: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelationship?: string;
  languageSkills?: string;
  logisticsSoftwareKnowledge?: string;
  equipmentCertifications?: string;
  firstAidTraining?: string;
  firstAidExpiryDate?: string;
  customsComplianceCert?: string;
  cvResume?: string;
  employmentContract?: string;
  idPassportCopy?: string;
  workPermit?: string;
  drivingLicense?: string;
  healthClearance?: string;
  certificates?: string;
  performanceRating?: string;
  attendanceRecord?: string;
  disciplinaryActions?: string;
  warningsIssued?: string;
  lastEvaluationDate?: string;
  nextEvaluationDate?: string;
  goalsKPIs?: string;
  salaryBand?: string;
  bankAccount?: string;
  allowances?: string;
  bonuses?: string;
  deductions?: string;
  uniformIssued?: boolean;
  uniformSize?: string;
  uniformIssueDate?: string;
  ppeIssued?: boolean;
  ppeDetails?: string;
  itEquipment?: string;
  vehicleAssigned?: string;
  systemAccounts?: string;
  accessLevels?: string;
  biometricId?: string;
  accessCardId?: string;
  lastLogin?: string;
}

const EmployeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  salary: { type: Number, required: true },
  benefits: [{
    type: { type: String, required: true },
    value: { type: Number, required: true }
  }],
  leaveBalance: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  hireDate: { type: Date, required: true },
  terminationDate: { type: Date },
  // Additional fields for comprehensive employee management
  photo: { type: String },
  location: { type: String },
  supervisor: { type: String },
  status: { type: String, default: 'Active' },
  employmentType: { type: String, default: 'Full-time' },
  dateOfHire: { type: String },
  contractExpiryDate: { type: String },
  shiftSchedule: { type: String, default: 'Day' },
  workSchedule: { type: String },
  employeeGrade: { type: String },
  licenseType: { type: String },
  licenseExpiryDate: { type: String },
  assignedVehicle: { type: String },
  routeHistory: { type: String },
  gpsTrackingStatus: { type: Boolean, default: false },
  certifiedEquipment: { type: String },
  currentShiftZone: { type: String },
  pickRate: { type: String },
  errorRate: { type: String },
  directReports: { type: String },
  currentProjects: { type: String },
  departmentalKPIs: { type: String },
  phoneNumber: { type: String },
  emergencyContactName: { type: String },
  emergencyContactNumber: { type: String },
  emergencyContactRelationship: { type: String },
  languageSkills: { type: String },
  logisticsSoftwareKnowledge: { type: String },
  equipmentCertifications: { type: String },
  firstAidTraining: { type: String },
  firstAidExpiryDate: { type: String },
  customsComplianceCert: { type: String },
  cvResume: { type: String },
  employmentContract: { type: String },
  idPassportCopy: { type: String },
  workPermit: { type: String },
  drivingLicense: { type: String },
  healthClearance: { type: String },
  certificates: { type: String },
  performanceRating: { type: String },
  attendanceRecord: { type: String },
  disciplinaryActions: { type: String },
  warningsIssued: { type: String },
  lastEvaluationDate: { type: String },
  nextEvaluationDate: { type: String },
  goalsKPIs: { type: String },
  salaryBand: { type: String },
  bankAccount: { type: String },
  allowances: { type: String },
  bonuses: { type: String },
  deductions: { type: String },
  uniformIssued: { type: Boolean, default: false },
  uniformSize: { type: String },
  uniformIssueDate: { type: String },
  ppeIssued: { type: Boolean, default: false },
  ppeDetails: { type: String },
  itEquipment: { type: String },
  vehicleAssigned: { type: String },
  systemAccounts: { type: String },
  accessLevels: { type: String },
  biometricId: { type: String },
  accessCardId: { type: String },
  lastLogin: { type: String },
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema); 