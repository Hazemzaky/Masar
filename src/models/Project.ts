import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  customer: string;
  equipmentDescription: string;
  rentTime: string;
  rentType: 'monthly' | 'call_out';
  timing: '8_hours' | '12_hours' | '24_hours';
  operatorDriver: '1' | '2';
  startTime?: Date;
  endTime?: Date;
  status?: 'active' | 'completed' | 'cancelled';
  description?: string;
  revenue?: number;
  notes?: string;
  assignedAssets?: mongoose.Types.ObjectId[]; // Array of assigned asset IDs
}

const ProjectSchema = new Schema<IProject>({
  customer: { type: String, required: true },
  equipmentDescription: { type: String, required: true },
  rentTime: { type: String, required: true },
  rentType: { type: String, enum: ['monthly', 'call_out'], required: true },
  timing: { type: String, enum: ['8_hours', '12_hours', '24_hours'], required: true },
  operatorDriver: { type: String, enum: ['1', '2'], required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  description: { type: String },
  revenue: { type: Number },
  notes: { type: String },
  assignedAssets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }], // Array of assigned asset IDs
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema); 