import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  customer: string;
  equipmentDescription: string;
  totalBasicHours: number;
  totalOvertimeHours: number;
  overallHours: number;
  overtimeHoursCost: number;
  overtimeHours: number;
  overtimePrice: number;
  rentType: 'monthly' | 'call_out';
  department: string;
  priceListDescription: string;
  startTime?: Date;
  endTime?: Date;
  status?: 'active' | 'completed' | 'cancelled';
  description?: string;
  revenue?: number;
  notes?: string;
  assignedAssets?: mongoose.Types.ObjectId[]; // Array of assigned asset IDs
  serial?: string; // Document serial number
}

const ProjectSchema = new Schema<IProject>({
  customer: { type: String, required: true },
  equipmentDescription: { type: String, required: true },
  totalBasicHours: { type: Number, required: true, default: 0 },
  totalOvertimeHours: { type: Number, required: true, default: 0 },
  overallHours: { type: Number, required: true, default: 0 },
  overtimeHoursCost: { type: Number, required: true, default: 0 },
  overtimeHours: { type: Number, required: true, default: 0 },
  overtimePrice: { type: Number, required: true, default: 0 },
  rentType: { type: String, enum: ['monthly', 'call_out'], required: true },
  department: { type: String, required: true },
  priceListDescription: { type: String, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  description: { type: String },
  revenue: { type: Number },
  notes: { type: String },
  assignedAssets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }], // Array of assigned asset IDs
  serial: { type: String, unique: true, sparse: true }, // Document serial number
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema); 