import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetStaffing extends Document {
  year: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  benefits: number;
  start: number;
  end: number;
}

const BudgetStaffingSchema = new Schema<IBudgetStaffing>({
  year: { type: Number, required: true },
  name: { type: String, required: true },
  department: String,
  position: String,
  salary: Number,
  benefits: Number,
  start: Number,
  end: Number,
});
BudgetStaffingSchema.index({ year: 1, name: 1, department: 1 }, { unique: true });

export default mongoose.model<IBudgetStaffing>('BudgetStaffing', BudgetStaffingSchema); 