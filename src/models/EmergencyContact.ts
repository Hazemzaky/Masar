import mongoose, { Document, Schema } from 'mongoose';

export interface IEmergencyContact extends Document {
  name: string;
  role: string;
  phone: string;
  email?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  location: { type: String },
  notes: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IEmergencyContact>('EmergencyContact', EmergencyContactSchema); 