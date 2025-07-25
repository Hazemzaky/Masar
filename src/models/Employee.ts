import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas for complex nested objects
const DriverLicenseSchema = new Schema({
  number: { type: String },
  expiryDate: { type: String },
  type: { type: String }
});

const VehicleAssignmentSchema = new Schema({
  vehicleId: { type: String },
  vehicleType: { type: String },
  assignedDate: { type: String }
});

const WorkShiftSchema = new Schema({
  id: { type: String },
  name: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  days: [{ type: String }]
});

const CertificationSchema = new Schema({
  id: { type: String },
  name: { type: String },
  type: { type: String, enum: ['forklift', 'hse', 'hazmat', 'other'] },
  issueDate: { type: String },
  expiryDate: { type: String },
  status: { type: String, enum: ['valid', 'expired', 'expiring-soon'] }
});

const CompensationHistorySchema = new Schema({
  date: { type: String },
  amount: { type: Number },
  type: { type: String },
  reason: { type: String }
});

const BonusRecordSchema = new Schema({
  date: { type: String },
  amount: { type: Number },
  type: { type: String },
  description: { type: String }
});

const AllowancesSchema = new Schema({
  transport: { type: Number, default: 0 },
  housing: { type: Number, default: 0 },
  meal: { type: Number, default: 0 },
  other: { type: Number, default: 0 }
});

const BankInfoSchema = new Schema({
  bankName: { type: String },
  accountNumber: { type: String },
  iban: { type: String }
});

const LeaveBalanceDetailsSchema = new Schema({
  vacation: { type: Number, default: 0 },
  sick: { type: Number, default: 0 },
  personal: { type: Number, default: 0 },
  other: { type: Number, default: 0 }
});

const UpcomingLeaveSchema = new Schema({
  startDate: { type: String },
  endDate: { type: String },
  type: { type: String },
  status: { type: String }
});

const AttendanceLogSchema = new Schema({
  date: { type: String },
  checkIn: { type: String },
  checkOut: { type: String },
  hours: { type: Number },
  status: { type: String, enum: ['present', 'absent', 'late', 'on-leave'] }
});

const PerformanceGoalSchema = new Schema({
  id: { type: String },
  title: { type: String },
  description: { type: String },
  progress: { type: Number },
  dueDate: { type: String },
  status: { type: String }
});

const PerformanceFeedbackSchema = new Schema({
  date: { type: String },
  reviewer: { type: String },
  rating: { type: Number },
  comments: { type: String },
  tags: [{ type: String }]
});

const PerformanceKPIsSchema = new Schema({
  deliveryTimeliness: { type: Number },
  customerComplaints: { type: Number },
  vehicleUtilization: { type: Number },
  delayPercentage: { type: Number }
});

const PerformanceSchema = new Schema({
  lastReviewDate: { type: String },
  rating: { type: Number },
  goals: [PerformanceGoalSchema],
  feedback: [PerformanceFeedbackSchema],
  kpis: PerformanceKPIsSchema
});

const DocumentSchema = new Schema({
  id: { type: String },
  name: { type: String },
  type: { type: String },
  uploadDate: { type: String },
  expiryDate: { type: String },
  status: { type: String, enum: ['valid', 'expired', 'expiring-soon'] },
  category: { type: String, enum: ['id', 'contract', 'medical', 'training', 'license', 'other'] }
});

const ComplianceSchema = new Schema({
  visaExpiry: { type: String },
  workPermitExpiry: { type: String },
  medicalCheckExpiry: { type: String },
  insuranceStatus: { type: String, enum: ['active', 'expired', 'pending'] }
});

const TimelineEventSchema = new Schema({
  id: { type: String },
  date: { type: String },
  event: { type: String },
  description: { type: String },
  type: { type: String, enum: ['join', 'promotion', 'leave', 'warning', 'training', 'contract-renewal'] }
});

const HRActionSchema = new Schema({
  id: { type: String },
  date: { type: String },
  action: { type: String },
  performedBy: { type: String },
  notes: { type: String }
});

const RecognitionSchema = new Schema({
  id: { type: String },
  type: { type: String, enum: ['employee-of-month', 'safety-milestone', 'performance-award', 'peer-compliment'] },
  title: { type: String },
  date: { type: String },
  description: { type: String }
});

const EquipmentSchema = new Schema({
  id: { type: String },
  type: { type: String, enum: ['laptop', 'phone', 'uniform', 'rfid-badge', 'vehicle', 'other'] },
  name: { type: String },
  assignedDate: { type: String },
  returnDate: { type: String },
  status: { type: String, enum: ['assigned', 'returned', 'lost'] }
});

const HRNoteSchema = new Schema({
  id: { type: String },
  date: { type: String },
  note: { type: String },
  hrPersonnel: { type: String },
  followUpDate: { type: String }
});

const OrgChartSchema = new Schema({
  manager: { type: String },
  directReports: [{ type: String }],
  peers: [{ type: String }]
});

const SkillTagSchema = new Schema({
  name: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  endorsedBy: [{ type: String }]
});

const EmergencyContactSchema = new Schema({
  name: { type: String },
  relationship: { type: String },
  phone: { type: String },
  email: { type: String }
});

const ReadinessTrackerSchema = new Schema({
  licenseValid: { type: Boolean, default: false },
  safetyTraining: { type: Boolean, default: false },
  medicallyFit: { type: Boolean, default: false },
  vehicleAssigned: { type: Boolean, default: false },
  readyForField: { type: Boolean, default: false }
});

const OvertimeSchema = new Schema({
  weeklyHours: { type: Number, default: 0 },
  monthlyHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 }
});

export interface IEmployee extends Document {
  // Basic Information
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
  phone?: string;
  address?: string;
  emergencyContact?: string;
  performanceRating?: number;
  lastReviewDate?: string;
  skills?: string[];
  manager?: string;
  location?: string;

  // Enhanced comprehensive fields
  employeeId?: string;
  personalEmail?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  civilId?: string;
  // Add employeeType and citizenType
  employeeType: 'Citizen' | 'Foreigner';
  citizenType?: 'Kuwaiti' | 'Bedoun';
  gender?: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  employmentType?: 'full-time' | 'part-time' | 'contractor' | 'daily';
  jobLevel?: string;
  hourlyRate?: number;
  site?: string;
  status?: 'active' | 'on-leave' | 'resigned' | 'suspended';
  
  // Logistics-specific fields
  driverLicense?: {
    number: string;
    expiryDate: string;
    type: string;
  };
  vehicleAssignment?: {
    vehicleId: string;
    vehicleType: string;
    assignedDate: string;
  };
  workShifts?: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    days: string[];
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    type: 'forklift' | 'hse' | 'hazmat' | 'other';
    issueDate: string;
    expiryDate: string;
    status: 'valid' | 'expired' | 'expiring-soon';
  }>;
  
  // Compensation & Benefits
  compensationHistory?: Array<{
    date: string;
    amount: number;
    type: string;
    reason: string;
  }>;
  bonusRecords?: Array<{
    date: string;
    amount: number;
    type: string;
    description: string;
  }>;
  allowances?: {
    transport: number;
    housing: number;
    meal: number;
    other: number;
  };
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    iban: string;
  };
  payrollIncluded: boolean;
  bonusEligible: boolean;
  
  // Leave & Attendance
  leaveBalanceDetails?: {
    vacation: number;
    sick: number;
    personal: number;
    other: number;
  };
  upcomingLeaves?: Array<{
    startDate: string;
    endDate: string;
    type: string;
    status: string;
  }>;
  attendanceLog?: Array<{
    date: string;
    checkIn: string;
    checkOut: string;
    hours: number;
    status: 'present' | 'absent' | 'late' | 'on-leave';
  }>;
  attendancePercentage: number;
  absenceFrequency: number;
  
  // Performance & Development
  performance?: {
    lastReviewDate: string;
    rating: number;
    goals: Array<{
      id: string;
      title: string;
      description: string;
      progress: number;
      dueDate: string;
      status: string;
    }>;
    feedback: Array<{
      date: string;
      reviewer: string;
      rating: number;
      comments: string;
      tags: string[];
    }>;
    kpis?: {
      deliveryTimeliness: number;
      customerComplaints: number;
      vehicleUtilization: number;
      delayPercentage: number;
    };
  };
  
  // Documents & Compliance
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    uploadDate: string;
    expiryDate?: string;
    status: 'valid' | 'expired' | 'expiring-soon';
    category: 'id' | 'contract' | 'medical' | 'training' | 'license' | 'other';
  }>;
  compliance?: {
    visaExpiry?: string;
    workPermitExpiry?: string;
    medicalCheckExpiry?: string;
    insuranceStatus: 'active' | 'expired' | 'pending';
  };
  
  // Timeline & History
  timeline?: Array<{
    id: string;
    date: string;
    event: string;
    description: string;
    type: 'join' | 'promotion' | 'leave' | 'warning' | 'training' | 'contract-renewal';
  }>;
  hrActions?: Array<{
    id: string;
    date: string;
    action: string;
    performedBy: string;
    notes: string;
  }>;
  
  // Recognition & Awards
  recognition?: Array<{
    id: string;
    type: 'employee-of-month' | 'safety-milestone' | 'performance-award' | 'peer-compliment';
    title: string;
    date: string;
    description: string;
  }>;
  
  // Equipment & Assets
  equipment?: Array<{
    id: string;
    type: 'laptop' | 'phone' | 'uniform' | 'rfid-badge' | 'vehicle' | 'other';
    name: string;
    assignedDate: string;
    returnDate?: string;
    status: 'assigned' | 'returned' | 'lost';
  }>;
  
  // Private HR Notes
  privateNotes?: string;
  hrNotes?: Array<{
    id: string;
    date: string;
    note: string;
    hrPersonnel: string;
    followUpDate?: string;
  }>;
  
  // Organizational
  orgChart?: {
    manager?: string;
    directReports?: string[];
    peers?: string[];
  };
  skillTags?: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    endorsedBy: string[];
  }>;
  customTags?: string[];
  attritionRisk?: 'low' | 'medium' | 'high';
  officeLocation?: string;
  workMode?: 'office' | 'remote' | 'hybrid';
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  
  // Readiness Tracker (for drivers/operators)
  readinessTracker?: {
    licenseValid: boolean;
    safetyTraining: boolean;
    medicallyFit: boolean;
    vehicleAssigned: boolean;
    readyForField: boolean;
  };
  
  // Overtime & Hours
  overtime?: {
    weeklyHours: number;
    monthlyHours: number;
    overtimeHours: number;
    overtimePay: number;
  };
}

const EmployeeSchema: Schema = new Schema({
  // Basic Information
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
  phone: { type: String },
  address: { type: String },
  emergencyContact: { type: String },
  performanceRating: { type: Number },
  lastReviewDate: { type: String },
  skills: [{ type: String }],
  manager: { type: String },
  location: { type: String },

  // Enhanced comprehensive fields
  employeeId: { type: String },
  personalEmail: { type: String },
  dateOfBirth: { type: String },
  nationality: { type: String },
  passportNumber: { type: String },
  civilId: { type: String },
  // Add employeeType and citizenType
  employeeType: { type: String, enum: ['Citizen', 'Foreigner'], required: true },
  citizenType: { type: String, enum: ['Kuwaiti', 'Bedoun'] },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contractor', 'daily'], default: 'full-time' },
  jobLevel: { type: String },
  hourlyRate: { type: Number },
  site: { type: String },
  status: { type: String, enum: ['active', 'on-leave', 'resigned', 'suspended'], default: 'active' },
  
  // Logistics-specific fields
  driverLicense: DriverLicenseSchema,
  vehicleAssignment: VehicleAssignmentSchema,
  workShifts: [WorkShiftSchema],
  certifications: [CertificationSchema],
  
  // Compensation & Benefits
  compensationHistory: [CompensationHistorySchema],
  bonusRecords: [BonusRecordSchema],
  allowances: AllowancesSchema,
  bankInfo: BankInfoSchema,
  payrollIncluded: { type: Boolean, default: true },
  bonusEligible: { type: Boolean, default: true },
  
  // Leave & Attendance
  leaveBalanceDetails: LeaveBalanceDetailsSchema,
  upcomingLeaves: [UpcomingLeaveSchema],
  attendanceLog: [AttendanceLogSchema],
  attendancePercentage: { type: Number, default: 0 },
  absenceFrequency: { type: Number, default: 0 },
  
  // Performance & Development
  performance: PerformanceSchema,
  
  // Documents & Compliance
  documents: [DocumentSchema],
  compliance: ComplianceSchema,
  
  // Timeline & History
  timeline: [TimelineEventSchema],
  hrActions: [HRActionSchema],
  
  // Recognition & Awards
  recognition: [RecognitionSchema],
  
  // Equipment & Assets
  equipment: [EquipmentSchema],
  
  // Private HR Notes
  privateNotes: { type: String },
  hrNotes: [HRNoteSchema],
  
  // Organizational
  orgChart: OrgChartSchema,
  skillTags: [SkillTagSchema],
  customTags: [{ type: String }],
  attritionRisk: { type: String, enum: ['low', 'medium', 'high'] },
  officeLocation: { type: String },
  workMode: { type: String, enum: ['office', 'remote', 'hybrid'] },
  emergencyContacts: [EmergencyContactSchema],
  
  // Readiness Tracker (for drivers/operators)
  readinessTracker: ReadinessTrackerSchema,
  
  // Overtime & Hours
  overtime: OvertimeSchema,
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema); 