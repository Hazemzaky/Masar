import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetITOpex extends Document {
  year: number;
  sr: string;
  itService: string;
  vendor: string;
  serviceDesk: string;
  renewMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetITOpexSchema = new Schema<IBudgetITOpex>({
  year: { type: Number, required: true },
  sr: { type: String, required: true },
  itService: { type: String, required: true },
  vendor: { type: String, required: true },
  serviceDesk: { type: String, required: true },
  renewMonth: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
BudgetITOpexSchema.index({ year: 1, sr: 1 }, { unique: true });

export default mongoose.model<IBudgetITOpex>('BudgetITOpex', BudgetITOpexSchema);
