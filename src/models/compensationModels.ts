import mongoose, { Schema, Document } from 'mongoose';

// Compensation Structure Schema
export interface ICompensationStructure extends Document {
  name: string;
  description: string;
  type: 'salary' | 'hourly' | 'commission' | 'mixed';
  status: 'active' | 'inactive' | 'draft';
  gradeLevels: IGradeLevel[];
  effectiveDate: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGradeLevel {
  level: number;
  name: string;
  minSalary: number;
  maxSalary: number;
  midPoint: number;
  description?: string;
}

const GradeLevelSchema = new Schema({
  level: { type: Number, required: true },
  name: { type: String, required: true },
  minSalary: { type: Number, required: true },
  maxSalary: { type: Number, required: true },
  midPoint: { type: Number, required: true },
  description: String
});

const CompensationStructureSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  type: { type: String, enum: ['salary', 'hourly', 'commission', 'mixed'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  gradeLevels: [GradeLevelSchema],
  effectiveDate: { type: Date, required: true },
  endDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const CompensationStructure = mongoose.model<ICompensationStructure>('CompensationStructure', CompensationStructureSchema);

// Employee Compensation Schema
export interface IEmployeeCompensation extends Document {
  employee: mongoose.Types.ObjectId;
  structure: mongoose.Types.ObjectId;
  baseSalary: number;
  hourlyRate?: number;
  annualTarget?: number;
  grade: number;
  level: string;
  department: string;
  position: string;
  effectiveDate: Date;
  endDate?: Date;
  status: 'active' | 'inactive' | 'pending' | 'approved';
  variablePay: mongoose.Types.ObjectId[];
  totalCompensation: number;
  currency: string;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeCompensationSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  structure: { type: Schema.Types.ObjectId, ref: 'CompensationStructure', required: true },
  baseSalary: { type: Number, required: true },
  hourlyRate: Number,
  annualTarget: Number,
  grade: { type: Number, required: true },
  level: { type: String, required: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  endDate: Date,
  status: { type: String, enum: ['active', 'inactive', 'pending', 'approved'], default: 'pending' },
  variablePay: [{ type: Schema.Types.ObjectId, ref: 'VariablePay' }],
  totalCompensation: { type: Number, required: true },
  currency: { type: String, default: 'KWD' },
  notes: String,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const EmployeeCompensation = mongoose.model<IEmployeeCompensation>('EmployeeCompensation', EmployeeCompensationSchema);

// Salary Progression Schema
export interface ISalaryProgression extends Document {
  structure: mongoose.Types.ObjectId;
  fromGrade: number;
  toGrade: number;
  progressionType: 'merit' | 'promotion' | 'adjustment' | 'market';
  percentageIncrease: number;
  fixedIncrease?: number;
  minTimeInGrade: number; // months
  requirements: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryProgressionSchema = new Schema({
  structure: { type: Schema.Types.ObjectId, ref: 'CompensationStructure', required: true },
  fromGrade: { type: Number, required: true },
  toGrade: { type: Number, required: true },
  progressionType: { type: String, enum: ['merit', 'promotion', 'adjustment', 'market'], required: true },
  percentageIncrease: { type: Number, required: true },
  fixedIncrease: Number,
  minTimeInGrade: { type: Number, default: 12 }, // months
  requirements: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const SalaryProgression = mongoose.model<ISalaryProgression>('SalaryProgression', SalaryProgressionSchema);

// Variable Pay Schema
export interface IVariablePay extends Document {
  employee: mongoose.Types.ObjectId;
  type: 'bonus' | 'commission' | 'incentive' | 'overtime' | 'allowance' | 'other';
  name: string;
  description?: string;
  amount: number;
  percentage?: number;
  target?: number;
  actual?: number;
  period: string; // e.g., "2024-Q1", "2024-01"
  year: number;
  month?: number;
  quarter?: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paymentDate?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VariablePaySchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: ['bonus', 'commission', 'incentive', 'overtime', 'allowance', 'other'], required: true },
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  percentage: Number,
  target: Number,
  actual: Number,
  period: { type: String, required: true },
  year: { type: Number, required: true },
  month: Number,
  quarter: Number,
  status: { type: String, enum: ['pending', 'approved', 'paid', 'cancelled'], default: 'pending' },
  paymentDate: Date,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const VariablePay = mongoose.model<IVariablePay>('VariablePay', VariablePaySchema);

// Market Analysis Schema
export interface IMarketAnalysis extends Document {
  position: string;
  location: string;
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  dataSource: string;
  surveyDate: Date;
  sampleSize: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number; // median
    p75: number;
    p90: number;
  };
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
  currency: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketAnalysisSchema = new Schema({
  position: { type: String, required: true },
  location: { type: String, required: true },
  industry: { type: String, required: true },
  companySize: { type: String, enum: ['startup', 'small', 'medium', 'large', 'enterprise'], required: true },
  dataSource: { type: String, required: true },
  surveyDate: { type: Date, required: true },
  sampleSize: { type: Number, required: true },
  percentiles: {
    p10: { type: Number, required: true },
    p25: { type: Number, required: true },
    p50: { type: Number, required: true },
    p75: { type: Number, required: true },
    p90: { type: Number, required: true }
  },
  averageSalary: { type: Number, required: true },
  minSalary: { type: Number, required: true },
  maxSalary: { type: Number, required: true },
  currency: { type: String, default: 'KWD' },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const MarketAnalysis = mongoose.model<IMarketAnalysis>('MarketAnalysis', MarketAnalysisSchema);

// Compensation Review Schema
export interface ICompensationReview extends Document {
  employee: mongoose.Types.ObjectId;
  reviewPeriod: string;
  currentSalary: number;
  proposedSalary: number;
  increaseAmount: number;
  increasePercentage: number;
  reviewType: 'annual' | 'merit' | 'promotion' | 'adjustment' | 'market';
  justification: string;
  managerComments?: string;
  hrComments?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  effectiveDate: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompensationReviewSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewPeriod: { type: String, required: true },
  currentSalary: { type: Number, required: true },
  proposedSalary: { type: Number, required: true },
  increaseAmount: { type: Number, required: true },
  increasePercentage: { type: Number, required: true },
  reviewType: { type: String, enum: ['annual', 'merit', 'promotion', 'adjustment', 'market'], required: true },
  justification: { type: String, required: true },
  managerComments: String,
  hrComments: String,
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  effectiveDate: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const CompensationReview = mongoose.model<ICompensationReview>('CompensationReview', CompensationReviewSchema);
