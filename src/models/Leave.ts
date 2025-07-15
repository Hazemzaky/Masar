import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  employee: mongoose.Types.ObjectId;
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  cost: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  requestedAt: Date;
  approvedAt?: Date;
  serial?: string; // Document serial number
}

const LeaveSchema: Schema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  serial: { type: String, unique: true, sparse: true }, // Document serial number
});

export default mongoose.model<ILeave>('Leave', LeaveSchema); 
