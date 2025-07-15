import mongoose, { Document, Schema } from 'mongoose';

export interface ITripAllowance extends Document {
  employee?: mongoose.Types.ObjectId;
  month: number; // 0=Jan, 1=Feb, ...
  year: number;
  srJobTitle: string;
  name: string;
  nationality: string;
  residencyNo: string;
  allowance: number;
  remark: string;
}

const TripAllowanceSchema = new Schema<ITripAllowance>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  srJobTitle: { type: String, required: true },
  name: { type: String, required: true },
  nationality: { type: String, required: true },
  residencyNo: { type: String, required: true },
  allowance: { type: Number, required: true },
  remark: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ITripAllowance>('TripAllowance', TripAllowanceSchema); 