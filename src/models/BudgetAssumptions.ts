import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetAssumptions extends Document {
  year: number;
  inflation: number;
  costMultiplier: number;
  exchangeRate: number;
  salesGrowth: number;
}

const BudgetAssumptionsSchema = new Schema<IBudgetAssumptions>({
  year: { type: Number, required: true, unique: true },
  inflation: Number,
  costMultiplier: Number,
  exchangeRate: Number,
  salesGrowth: Number,
});

export default mongoose.model<IBudgetAssumptions>('BudgetAssumptions', BudgetAssumptionsSchema); 