import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetOpex extends Document {
  year: number;
  sr: string;
  serviceAnnualAgreement: string;
  vendor: string;
  agreementDescription: string;
  paymentType: string;
  typeOfCost: string;
  annual: number;
  quarter: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetOpexSchema = new Schema<IBudgetOpex>({
  year: { type: Number, required: true },
  sr: { type: String, required: true },
  serviceAnnualAgreement: { type: String, required: true },
  vendor: { type: String, required: true },
  agreementDescription: { type: String, required: true },
  paymentType: { type: String, required: true },
  typeOfCost: { type: String, required: true },
  annual: { type: Number, default: 0 },
  quarter: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
BudgetOpexSchema.index({ year: 1, sr: 1 }, { unique: true });

export default mongoose.model<IBudgetOpex>('BudgetOpex', BudgetOpexSchema); 