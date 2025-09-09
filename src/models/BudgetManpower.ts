import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetManpower extends Document {
  year: number;
  coId: string;
  employeeName: string;
  position: string;
  hiringDate: string;
  department: string;
  section: string;
  totalExperience: string;
  sponsor: string;
  basicSalary: number;
  allowance: number;
  proposedIncrementPercent: number;
  proposedIncrementAmount: number;
  totalSalary: number;
  indemnity: number;
  residenceFee: number;
  workmenComp: number;
  privateMedicalInsurance: number;
  socialSecurity: number;
  housing: number;
  carTransfer: number;
  petrolCard: number;
  mobileLine: number;
  ticket: number;
  totalMonthlyCost: number;
  lastIncrementAmount: number;
  lastIncrementDate: string;
  previousProposedIncrementPercent: number;
  previousProposedIncrementAmount: number;
  lastYearBonus: number;
  proposedBonus: number;
  required: string;
  start: string;
  end: string;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sept: number;
  oct: number;
  nov: number;
  dec: number;
  jan: number;
  feb: number;
  mar: number;
  totalYearCost: number;
}

const BudgetManpowerSchema = new Schema<IBudgetManpower>({
  year: { type: Number, required: true },
  coId: { type: String, required: true },
  employeeName: { type: String, required: true },
  position: { type: String },
  hiringDate: { type: String },
  department: { type: String },
  section: { type: String },
  totalExperience: { type: String },
  sponsor: { type: String },
  basicSalary: { type: Number, default: 0 },
  allowance: { type: Number, default: 0 },
  proposedIncrementPercent: { type: Number, default: 0 },
  proposedIncrementAmount: { type: Number, default: 0 },
  totalSalary: { type: Number, default: 0 },
  indemnity: { type: Number, default: 0 },
  residenceFee: { type: Number, default: 0 },
  workmenComp: { type: Number, default: 0 },
  privateMedicalInsurance: { type: Number, default: 0 },
  socialSecurity: { type: Number, default: 0 },
  housing: { type: Number, default: 0 },
  carTransfer: { type: Number, default: 0 },
  petrolCard: { type: Number, default: 0 },
  mobileLine: { type: Number, default: 0 },
  ticket: { type: Number, default: 0 },
  totalMonthlyCost: { type: Number, default: 0 },
  lastIncrementAmount: { type: Number, default: 0 },
  lastIncrementDate: { type: String },
  previousProposedIncrementPercent: { type: Number, default: 0 },
  previousProposedIncrementAmount: { type: Number, default: 0 },
  lastYearBonus: { type: Number, default: 0 },
  proposedBonus: { type: Number, default: 0 },
  required: { type: String },
  start: { type: String },
  end: { type: String },
  apr: { type: Number, default: 0 },
  may: { type: Number, default: 0 },
  jun: { type: Number, default: 0 },
  jul: { type: Number, default: 0 },
  aug: { type: Number, default: 0 },
  sept: { type: Number, default: 0 },
  oct: { type: Number, default: 0 },
  nov: { type: Number, default: 0 },
  dec: { type: Number, default: 0 },
  jan: { type: Number, default: 0 },
  feb: { type: Number, default: 0 },
  mar: { type: Number, default: 0 },
  totalYearCost: { type: Number, default: 0 }
});

BudgetManpowerSchema.index({ year: 1, coId: 1 }, { unique: true });

export default mongoose.model<IBudgetManpower>('BudgetManpower', BudgetManpowerSchema);
