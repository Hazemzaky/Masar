import mongoose, { Document, Schema } from 'mongoose';

export interface IEmergencyPlan extends Document {
  title: string;
  type: string;
  fileUrl?: string;
  description?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyPlanSchema = new Schema<IEmergencyPlan>({
  title: { type: String, required: true },
  type: { type: String, required: true },
  fileUrl: { type: String },
  description: { type: String },
  effectiveDate: { type: Date },
  expiryDate: { type: Date },
  notes: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IEmergencyPlan>('EmergencyPlan', EmergencyPlanSchema); 