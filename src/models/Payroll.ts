import mongoose, { Document, Schema } from 'mongoose';

export interface IPayrollEmployee extends Document {
  company: string;
  employeeCode: string;
  fullName: string;
  position: string;
  department: string;
  totalSalary: number;
  days: number;
  basicSalary: number;
  fixedAllowance: number;
  temporaryAllowance: number;
  overtime: number;
  leave: number;
  leaveDays: number;
  grossSalary: number;
  absent: number;
  absentDays: number;
  sickLeave: number;
  sickLeaveDays: number;
  loan: number;
  fixedDeduction: number;
  temporaryDeduction: number;
  grossNetSalary: number;
  sponsor: string;
  remark: string;
  currentProject?: mongoose.Types.ObjectId; // Currently assigned project
  projectAssignmentDate?: Date; // When they were assigned to current project
}

export interface IPayrollHistory extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: string; // Format: "2024-01", "2024-02", etc.
  year: number;
  totalSalary?: number;
  days?: number;
  basicSalary?: number;
  fixedAllowance?: number;
  temporaryAllowance?: number;
  overtime?: number;
  leave?: number;
  leaveDays?: number;
  grossSalary?: number;
  absent?: number;
  absentDays?: number;
  sickLeave?: number;
  sickLeaveDays?: number;
  loan?: number;
  fixedDeduction?: number;
  temporaryDeduction?: number;
  grossNetSalary?: number;
  sponsor?: string;
  remark?: string;
}

const PayrollEmployeeSchema = new Schema<IPayrollEmployee>({
  company: { type: String, required: true },
  employeeCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  totalSalary: { type: Number, required: true },
  days: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  fixedAllowance: { type: Number, required: true },
  temporaryAllowance: { type: Number, required: true },
  overtime: { type: Number, required: true },
  leave: { type: Number, required: true },
  leaveDays: { type: Number, required: true },
  grossSalary: { type: Number, required: true },
  absent: { type: Number, required: true },
  absentDays: { type: Number, required: true },
  sickLeave: { type: Number, required: true },
  sickLeaveDays: { type: Number, required: true },
  loan: { type: Number, required: true },
  fixedDeduction: { type: Number, required: true },
  temporaryDeduction: { type: Number, required: true },
  grossNetSalary: { type: Number, required: true },
  sponsor: { type: String, required: true },
  remark: { type: String },
  currentProject: { type: Schema.Types.ObjectId, ref: 'Project' },
  projectAssignmentDate: { type: Date }
}, {
  timestamps: true
});

const PayrollHistorySchema = new Schema<IPayrollHistory>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'PayrollEmployee', required: true },
  month: { type: String, required: true }, // Format: "2024-01", "2024-02", etc.
  year: { type: Number, required: true },
  totalSalary: { type: Number, default: 0 },
  days: { type: Number, default: 0 },
  basicSalary: { type: Number, default: 0 },
  fixedAllowance: { type: Number, default: 0 },
  temporaryAllowance: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  leave: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  absent: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  sickLeave: { type: Number, default: 0 },
  sickLeaveDays: { type: Number, default: 0 },
  loan: { type: Number, default: 0 },
  fixedDeduction: { type: Number, default: 0 },
  temporaryDeduction: { type: Number, default: 0 },
  grossNetSalary: { type: Number, default: 0 },
  sponsor: { type: String, default: '' },
  remark: { type: String, default: '' }
}, {
  timestamps: true
});

// Create compound index for employeeId and month to ensure unique monthly records
PayrollHistorySchema.index({ employeeId: 1, month: 1 }, { unique: true });

export const PayrollEmployee = mongoose.model<IPayrollEmployee>('PayrollEmployee', PayrollEmployeeSchema);
export const PayrollHistory = mongoose.model<IPayrollHistory>('PayrollHistory', PayrollHistorySchema);

// Keep the old Payroll model for backward compatibility
export interface IPayroll extends Document {
  employee: mongoose.Types.ObjectId;
  period: string;
  baseSalary: number;
  benefits: number;
  leaveCost: number;
  reimbursements: number;
  deductions: number;
  netPay: number;
  status: 'pending' | 'processed' | 'paid';
  runDate: Date;
  project?: mongoose.Types.ObjectId;
}

const PayrollSchema = new Schema<IPayroll>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  period: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  benefits: { type: Number, default: 0 },
  leaveCost: { type: Number, default: 0 },
  reimbursements: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processed', 'paid'], default: 'pending' },
  runDate: { type: Date, default: Date.now },
  project: { type: Schema.Types.ObjectId, ref: 'Project' }
}, {
  timestamps: true
});

export default mongoose.model<IPayroll>('Payroll', PayrollSchema); 