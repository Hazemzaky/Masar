import mongoose, { Document, Schema } from 'mongoose';

export interface ITracker extends Document {
  month: string; // e.g., 'April', 'May', ...
  year: number;
  SR: string;
  departureMonth: string;
  date: Date;
  TMR: string;
  from: string;
  to: string;
  departmentRequester: string;
  invoicedDate: Date;
  field: string;
  OTM_PO: string;
  VPN: string;
  trailerNumber: string;
  trailerType: string;
  waterCardNo?: string;
  gallons?: number;
  EMP: mongoose.Types.ObjectId | string; // Reference to PayrollEmployee if possible
  name: string;
  nationality: string;
  passport: string;
  residencyNumber: string;
  contact: string;
  dateLoaded: Date;
  timeLoaded: string;
  returnedDate: Date;
  returnedTime: string;
  durationTripTime: string;
  daysInMission: number;
  kmAtOrigin: number;
  kmOnceReturned: number;
  totalKmPerTrip: number;
  tripAllowanceInKWD: number;
  isWaterTrip: 'yes' | 'no';
  createdAt: Date;
  updatedAt: Date;
}

const TrackerSchema = new Schema<ITracker>({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  SR: { type: String, required: true },
  departureMonth: { type: String, required: true },
  date: { type: Date, required: true },
  TMR: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departmentRequester: { type: String, required: true },
  invoicedDate: { type: Date, required: true },
  field: { type: String, required: true },
  OTM_PO: { type: String, required: true },
  VPN: { type: String, required: true },
  trailerNumber: { type: String, required: true },
  trailerType: { type: String, required: true },
  waterCardNo: { type: String },
  gallons: { type: Number },
  EMP: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  name: { type: String, required: true },
  nationality: { type: String, required: true },
  passport: { type: String, required: true },
  residencyNumber: { type: String, required: true },
  contact: { type: String, required: true },
  dateLoaded: { type: Date, required: true },
  timeLoaded: { type: String, required: true },
  returnedDate: { type: Date, required: true },
  returnedTime: { type: String, required: true },
  durationTripTime: { type: String, required: true },
  daysInMission: { type: Number, required: true },
  kmAtOrigin: { type: Number, required: true },
  kmOnceReturned: { type: Number, required: true },
  totalKmPerTrip: { type: Number, required: true },
  tripAllowanceInKWD: { type: Number, required: true },
  isWaterTrip: { type: String, enum: ['yes', 'no'], required: true },
}, { timestamps: true });

export default mongoose.model<ITracker>('Tracker', TrackerSchema); 