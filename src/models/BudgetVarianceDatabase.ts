import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetVariance extends Document {
  year: number;
  module: string;
  item: string;
  budget: number[];
  actual: number[];
}

const BudgetVarianceSchema = new Schema<IBudgetVariance>({
  year: { type: Number, required: true },
  module: { type: String, required: true },
  item: { type: String, required: true },
  budget: [{ type: Number }],
  actual: [{ type: Number }],
});
BudgetVarianceSchema.index({ year: 1, module: 1, item: 1 }, { unique: true });

export default mongoose.model<IBudgetVariance>('BudgetVariance', BudgetVarianceSchema); 