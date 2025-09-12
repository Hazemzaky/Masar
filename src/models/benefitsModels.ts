import mongoose, { Schema, Document } from 'mongoose';

// Benefits Category Schema
export interface IBenefitsCategory extends Document {
  name: string;
  description: string;
  type: 'health' | 'retirement' | 'time_off' | 'insurance' | 'perks' | 'other';
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitsCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  type: { type: String, enum: ['health', 'retirement', 'time_off', 'insurance', 'perks', 'other'], required: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const BenefitsCategory = mongoose.model<IBenefitsCategory>('BenefitsCategory', BenefitsCategorySchema);

// Benefits Plan Schema
export interface IBenefitsPlan extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  type: 'medical' | 'dental' | 'vision' | 'life_insurance' | 'disability' | 'retirement' | 'vacation' | 'sick_leave' | 'other';
  status: 'active' | 'inactive' | 'draft';
  eligibilityCriteria: {
    employeeTypes: string[];
    departments: string[];
    minServiceMonths: number;
    maxAge?: number;
    minAge?: number;
  };
  coverage: {
    employee: number; // percentage or fixed amount
    spouse: number;
    children: number;
    family: number;
  };
  costs: {
    employeeContribution: number;
    employerContribution: number;
    totalCost: number;
    currency: string;
  };
  limits: {
    annualLimit?: number;
    lifetimeLimit?: number;
    deductible?: number;
    coPay?: number;
  };
  features: string[];
  provider?: string;
  policyNumber?: string;
  effectiveDate: Date;
  endDate?: Date;
  isVoluntary: boolean;
  requiresEnrollment: boolean;
  openEnrollmentOnly: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EligibilityCriteriaSchema = new Schema({
  employeeTypes: [String],
  departments: [String],
  minServiceMonths: { type: Number, default: 0 },
  maxAge: Number,
  minAge: Number
});

const CoverageSchema = new Schema({
  employee: { type: Number, required: true },
  spouse: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  family: { type: Number, default: 0 }
});

const CostsSchema = new Schema({
  employeeContribution: { type: Number, required: true },
  employerContribution: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  currency: { type: String, default: 'KWD' }
});

const LimitsSchema = new Schema({
  annualLimit: Number,
  lifetimeLimit: Number,
  deductible: Number,
  coPay: Number
});

const BenefitsPlanSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  category: { type: Schema.Types.ObjectId, ref: 'BenefitsCategory', required: true },
  type: { type: String, enum: ['medical', 'dental', 'vision', 'life_insurance', 'disability', 'retirement', 'vacation', 'sick_leave', 'other'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  eligibilityCriteria: EligibilityCriteriaSchema,
  coverage: CoverageSchema,
  costs: CostsSchema,
  limits: LimitsSchema,
  features: [String],
  provider: String,
  policyNumber: String,
  effectiveDate: { type: Date, required: true },
  endDate: Date,
  isVoluntary: { type: Boolean, default: true },
  requiresEnrollment: { type: Boolean, default: true },
  openEnrollmentOnly: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const BenefitsPlan = mongoose.model<IBenefitsPlan>('BenefitsPlan', BenefitsPlanSchema);

// Benefits Enrollment Schema
export interface IBenefitsEnrollment extends Document {
  employee: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  enrollmentType: 'new' | 'renewal' | 'change' | 'termination';
  status: 'pending' | 'active' | 'inactive' | 'cancelled' | 'approved' | 'rejected';
  enrollmentDate: Date;
  effectiveDate: Date;
  endDate?: Date;
  coverageLevel: 'employee' | 'employee_spouse' | 'employee_children' | 'family';
  monthlyCost: number;
  annualCost: number;
  employeeContribution: number;
  employerContribution: number;
  dependents: IDependent[];
  utilization: number; // percentage
  lastUtilized?: Date;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvalComments?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDependent {
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'other';
  dateOfBirth: Date;
  ssn?: string;
  isEligible: boolean;
}

const DependentSchema = new Schema({
  name: { type: String, required: true },
  relationship: { type: String, enum: ['spouse', 'child', 'parent', 'other'], required: true },
  dateOfBirth: { type: Date, required: true },
  ssn: String,
  isEligible: { type: Boolean, default: true }
});

const BenefitsEnrollmentSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'BenefitsPlan', required: true },
  enrollmentType: { type: String, enum: ['new', 'renewal', 'change', 'termination'], required: true },
  status: { type: String, enum: ['pending', 'active', 'inactive', 'cancelled', 'approved', 'rejected'], default: 'pending' },
  enrollmentDate: { type: Date, required: true },
  effectiveDate: { type: Date, required: true },
  endDate: Date,
  coverageLevel: { type: String, enum: ['employee', 'employee_spouse', 'employee_children', 'family'], required: true },
  monthlyCost: { type: Number, required: true },
  annualCost: { type: Number, required: true },
  employeeContribution: { type: Number, required: true },
  employerContribution: { type: Number, required: true },
  dependents: [DependentSchema],
  utilization: { type: Number, default: 0 },
  lastUtilized: Date,
  notes: String,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  approvalComments: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const BenefitsEnrollment = mongoose.model<IBenefitsEnrollment>('BenefitsEnrollment', BenefitsEnrollmentSchema);

// Benefits Cost Schema
export interface IBenefitsCost extends Document {
  plan: mongoose.Types.ObjectId;
  year: number;
  month?: number;
  quarter?: number;
  department?: string;
  costPerEmployee: number;
  totalCost: number;
  employeeCount: number;
  utilizationRate: number;
  currency: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitsCostSchema = new Schema({
  plan: { type: Schema.Types.ObjectId, ref: 'BenefitsPlan', required: true },
  year: { type: Number, required: true },
  month: Number,
  quarter: Number,
  department: String,
  costPerEmployee: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  employeeCount: { type: Number, required: true },
  utilizationRate: { type: Number, default: 0 },
  currency: { type: String, default: 'KWD' },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const BenefitsCost = mongoose.model<IBenefitsCost>('BenefitsCost', BenefitsCostSchema);

// Open Enrollment Schema
export interface IOpenEnrollment extends Document {
  name: string;
  description: string;
  year: number;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'active' | 'closed' | 'cancelled';
  eligiblePlans: mongoose.Types.ObjectId[];
  eligibleEmployees: mongoose.Types.ObjectId[];
  communicationSent: boolean;
  communicationDate?: Date;
  enrollmentCount: number;
  targetCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OpenEnrollmentSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'active', 'closed', 'cancelled'], default: 'scheduled' },
  eligiblePlans: [{ type: Schema.Types.ObjectId, ref: 'BenefitsPlan' }],
  eligibleEmployees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  communicationSent: { type: Boolean, default: false },
  communicationDate: Date,
  enrollmentCount: { type: Number, default: 0 },
  targetCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const OpenEnrollment = mongoose.model<IOpenEnrollment>('OpenEnrollment', OpenEnrollmentSchema);

// Benefits Communication Schema
export interface IBenefitsCommunication extends Document {
  title: string;
  content: string;
  type: 'email' | 'announcement' | 'newsletter' | 'reminder' | 'policy_update';
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  targetAudience: 'all' | 'enrolled' | 'eligible' | 'specific';
  targetEmployees?: mongoose.Types.ObjectId[];
  scheduledDate?: Date;
  sentDate?: Date;
  attachments: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitsCommunicationSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['email', 'announcement', 'newsletter', 'reminder', 'policy_update'], required: true },
  status: { type: String, enum: ['draft', 'scheduled', 'sent', 'cancelled'], default: 'draft' },
  targetAudience: { type: String, enum: ['all', 'enrolled', 'eligible', 'specific'], default: 'all' },
  targetEmployees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  scheduledDate: Date,
  sentDate: Date,
  attachments: [String],
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const BenefitsCommunication = mongoose.model<IBenefitsCommunication>('BenefitsCommunication', BenefitsCommunicationSchema);

// Benefits Utilization Schema
export interface IBenefitsUtilization extends Document {
  enrollment: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  utilizationDate: Date;
  serviceType: string;
  provider?: string;
  amount: number;
  coveredAmount: number;
  employeeResponsibility: number;
  claimNumber?: string;
  status: 'pending' | 'approved' | 'denied' | 'paid';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitsUtilizationSchema = new Schema({
  enrollment: { type: Schema.Types.ObjectId, ref: 'BenefitsEnrollment', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'BenefitsPlan', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  utilizationDate: { type: Date, required: true },
  serviceType: { type: String, required: true },
  provider: String,
  amount: { type: Number, required: true },
  coveredAmount: { type: Number, required: true },
  employeeResponsibility: { type: Number, required: true },
  claimNumber: String,
  status: { type: String, enum: ['pending', 'approved', 'denied', 'paid'], default: 'pending' },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const BenefitsUtilization = mongoose.model<IBenefitsUtilization>('BenefitsUtilization', BenefitsUtilizationSchema);
