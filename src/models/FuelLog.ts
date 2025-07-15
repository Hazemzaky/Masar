import mongoose, { Document, Schema } from 'mongoose';

export interface IFuelLog extends Document {
  dateTime: Date;
  asset: mongoose.Types.ObjectId;
  currentKm: number;
  lastKm: number;
  distanceTraveled: number;
  client: mongoose.Types.ObjectId;
  type: 'callout' | 'monthly';
  litresConsumed: number;
  pricePerLitre: number;
  totalCost: number;
  driver?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
}

const FuelLogSchema = new Schema<IFuelLog>({
  dateTime: { type: Date, required: true },
  asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  currentKm: { type: Number, required: true },
  lastKm: { type: Number, required: true },
  distanceTraveled: { type: Number, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  type: { type: String, enum: ['callout', 'monthly'], required: true },
  litresConsumed: { type: Number, required: true },
  pricePerLitre: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  driver: { type: Schema.Types.ObjectId, ref: 'Employee' },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
});

export default mongoose.model<IFuelLog>('FuelLog', FuelLogSchema); 