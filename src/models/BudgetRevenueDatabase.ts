import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetRevenueDatabase extends Document {
  no: string;
  revenues: string;
  forecastedYearEnded: string;
  budget1stQuarter: string;
  budget2ndQuarter: string;
  budget3rdQuarter: string;
  budgetTotal: string;
  year?: number;
}

const BudgetRevenueDatabaseSchema = new Schema<IBudgetRevenueDatabase>({
  no: { type: String, required: true },
  revenues: { type: String, required: true },
  forecastedYearEnded: { type: String, default: '' },
  budget1stQuarter: { type: String, default: '' },
  budget2ndQuarter: { type: String, default: '' },
  budget3rdQuarter: { type: String, default: '' },
  budgetTotal: { type: String, default: '' },
  year: { type: Number, default: new Date().getFullYear() },
}, {
  timestamps: true
});

export default mongoose.model<IBudgetRevenueDatabase>('BudgetRevenueDatabase', BudgetRevenueDatabaseSchema); 