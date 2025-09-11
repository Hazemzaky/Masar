import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetCapex extends Document {
  year: number;
  no: string;
  assetType: string;
  qty: number;
  details: string;
  expectedCostKWD: number;
  annualDepreciation: number;
  quarterlyDepreciation: number;
  expectedDateOfPurchase: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetCapexSchema = new Schema<IBudgetCapex>({
  year: { type: Number, required: true },
  no: { type: String, required: true },
  assetType: { type: String, required: true },
  qty: { type: Number, required: true },
  details: { type: String, required: true },
  expectedCostKWD: { type: Number, required: true },
  annualDepreciation: { type: Number, required: true },
  quarterlyDepreciation: { type: Number, required: true },
  expectedDateOfPurchase: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
BudgetCapexSchema.index({ year: 1, no: 1 }, { unique: true });

export default mongoose.model<IBudgetCapex>('BudgetCapex', BudgetCapexSchema); 