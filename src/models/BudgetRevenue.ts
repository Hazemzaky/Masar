import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetRevenue extends Document {
  year: number;
  businessLine: string;
  units: number[];
  price: number[];
}

const BudgetRevenueSchema = new Schema<IBudgetRevenue>({
  year: { type: Number, required: true },
  businessLine: { type: String, required: true },
  units: [{ type: Number }],
  price: [{ type: Number }],
});
BudgetRevenueSchema.index({ year: 1, businessLine: 1 }, { unique: true });

export default mongoose.model<IBudgetRevenue>('BudgetRevenue', BudgetRevenueSchema); 