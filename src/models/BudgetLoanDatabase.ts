import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetLoan extends Document {
  year: number;
  name: string;
  amount: number;
  start: number;
  rate: number;
  term: number;
  type: string;
  notes: string;
}

const BudgetLoanSchema = new Schema<IBudgetLoan>({
  year: { type: Number, required: true },
  name: { type: String, required: true },
  amount: Number,
  start: Number,
  rate: Number,
  term: Number,
  type: String,
  notes: String,
});
BudgetLoanSchema.index({ year: 1, name: 1 }, { unique: true });

export default mongoose.model<IBudgetLoan>('BudgetLoan', BudgetLoanSchema); 