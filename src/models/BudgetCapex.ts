import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetCapex extends Document {
  year: number;
  name: string;
  category: string;
  amount: number;
  purchaseMonth: number;
  depreciation: string;
  duration: number;
  notes: string;
}

const BudgetCapexSchema = new Schema<IBudgetCapex>({
  year: { type: Number, required: true },
  name: { type: String, required: true },
  category: String,
  amount: Number,
  purchaseMonth: Number,
  depreciation: String,
  duration: Number,
  notes: String,
});
BudgetCapexSchema.index({ year: 1, name: 1 }, { unique: true });

export default mongoose.model<IBudgetCapex>('BudgetCapex', BudgetCapexSchema); 