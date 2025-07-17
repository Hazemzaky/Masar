import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetOpex extends Document {
  year: number;
  category: string;
  costs: number[];
}

const BudgetOpexSchema = new Schema<IBudgetOpex>({
  year: { type: Number, required: true },
  category: { type: String, required: true },
  costs: [{ type: Number }],
});
BudgetOpexSchema.index({ year: 1, category: 1 }, { unique: true });

export default mongoose.model<IBudgetOpex>('BudgetOpex', BudgetOpexSchema); 