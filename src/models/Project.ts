import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  customer: string;
  equipmentDescription: string;
  rentTime: string;
  rentType: 'monthly' | 'call_out';
  timing: '8_hours' | '12_hours' | '24_hours';
  operatorDriver: '1' | '2';
  startTime?: Date;
  startTimeHour?: number; // Hour component (0-23)
  startTimeMinute?: number; // Minute component (0-59)
  endTime?: Date;
  endTimeHour?: number; // Hour component (0-23)
  endTimeMinute?: number; // Minute component (0-59)
  status?: 'active' | 'completed' | 'cancelled';
  description?: string;
  revenue?: number;
  tariffRate?: number; // Stored tariff rate for reference
  tariffType?: 'per_hour' | 'per_day' | 'per_month'; // Stored tariff type for reference
  notes?: string;
  assignedAssets?: mongoose.Types.ObjectId[]; // Array of assigned asset IDs
  assignedDrivers?: mongoose.Types.ObjectId[]; // Array of assigned driver IDs
}

const ProjectSchema = new Schema<IProject>({
  customer: { type: String, required: true },
  equipmentDescription: { type: String, required: true },
  rentTime: { type: String, required: true },
  rentType: { type: String, enum: ['monthly', 'call_out'], required: true },
  timing: { type: String, enum: ['8_hours', '12_hours', '24_hours'], required: true },
  operatorDriver: { type: String, enum: ['1', '2'], required: true },
  startTime: { type: Date },
  startTimeHour: { type: Number, min: 0, max: 23 },
  startTimeMinute: { type: Number, min: 0, max: 59 },
  endTime: { type: Date },
  endTimeHour: { type: Number, min: 0, max: 23 },
  endTimeMinute: { type: Number, min: 0, max: 59 },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  description: { type: String },
  revenue: { type: Number },
  tariffRate: { type: Number },
  tariffType: { type: String, enum: ['per_hour', 'per_day', 'per_month'] },
  notes: { type: String },
  assignedAssets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }], // Array of assigned asset IDs
  assignedDrivers: [{ type: Schema.Types.ObjectId, ref: 'PayrollEmployee' }], // Array of assigned driver IDs
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema); 