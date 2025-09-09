import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetRental extends Document {
  year: number;
  no: string;
  description: string;
  forecastedYearEnded: number;
  budget1stQuarter: number;
  budget2ndQuarter: number;
  budget3rdQuarter: number;
  budgetTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetRentalSchema = new Schema<IBudgetRental>({
  year: { type: Number, required: true },
  no: { type: String, required: true },
  description: { type: String, required: true },
  forecastedYearEnded: { type: Number, default: 0 },
  budget1stQuarter: { type: Number, default: 0 },
  budget2ndQuarter: { type: Number, default: 0 },
  budget3rdQuarter: { type: Number, default: 0 },
  budgetTotal: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BudgetRentalSchema.index({ year: 1, no: 1 }, { unique: true });

export default mongoose.model<IBudgetRental>('BudgetRental', BudgetRentalSchema);
