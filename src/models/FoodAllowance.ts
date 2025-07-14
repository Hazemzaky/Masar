import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodAllowance extends Document {
  rentType: 'callout' | 'monthly_12h' | 'monthly_24h';
  companyName: string;
  driver: mongoose.Types.ObjectId; // Reference to Employee
  project: mongoose.Types.ObjectId; // Reference to Project
  value: number; // Add value field
  createdAt: Date;
  updatedAt: Date;
}

const FoodAllowanceSchema: Schema = new Schema({
  rentType: { type: String, enum: ['callout', 'monthly_12h', 'monthly_24h'], required: true },
  companyName: { type: String, required: true },
  driver: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  value: { type: Number, required: true }, // Add value field
}, { timestamps: true });

export default mongoose.model<IFoodAllowance>('FoodAllowance', FoodAllowanceSchema); 