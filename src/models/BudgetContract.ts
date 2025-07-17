import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetContract extends Document {
  year: number;
  name: string;
  client: string;
  value: number;
  probability: number;
  expectedClose: number;
  status: string;
  notes: string;
}

const BudgetContractSchema = new Schema<IBudgetContract>({
  year: { type: Number, required: true },
  name: { type: String, required: true },
  client: String,
  value: Number,
  probability: Number,
  expectedClose: Number,
  status: String,
  notes: String,
});
BudgetContractSchema.index({ year: 1, name: 1 }, { unique: true });

export default mongoose.model<IBudgetContract>('BudgetContract', BudgetContractSchema); 