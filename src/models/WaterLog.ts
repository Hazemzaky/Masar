import mongoose, { Document, Schema } from 'mongoose';

export interface IWaterLog extends Document {
  dateTime: Date;
  cardId: string;
  client: mongoose.Types.ObjectId;
  tankerPlateNo: string;
  station: string;
  volume: number;
  unitPrice: number;
  totalCost: number;
  filledBy?: mongoose.Types.ObjectId;
  status: 'success' | 'failed' | 'manual' | 'tamper';
  prepaidCard?: mongoose.Types.ObjectId;
  remarks?: string;
}

const WaterLogSchema = new Schema<IWaterLog>({
  dateTime: { type: Date, required: true, index: true },
  cardId: { type: String, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  tankerPlateNo: { type: String, required: true },
  station: { type: String, required: true, index: true },
  volume: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  filledBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, enum: ['success', 'failed', 'manual', 'tamper'], default: 'success' },
  prepaidCard: { type: Schema.Types.ObjectId, ref: 'PrepaidCard' },
  remarks: { type: String },
}, { timestamps: true });

export default mongoose.model<IWaterLog>('WaterLog', WaterLogSchema); 