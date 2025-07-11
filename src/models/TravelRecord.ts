import mongoose, { Document, Schema } from 'mongoose';

export interface ITravelDocument {
  type: 'visa' | 'invitation' | 'passport' | 'flight' | 'hotel' | 'receipt' | 'other';
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface ITravelExpense {
  category: 'flight' | 'hotel' | 'food' | 'transport' | 'other';
  amount: number;
  currency: string;
  receiptUrl?: string;
}

export interface IEmergencyContact {
  type: 'employee' | 'embassy' | 'insurance' | 'other';
  name: string;
  phone: string;
  email?: string;
  country?: string;
  notes?: string;
}

export interface ITravelRecord extends Document {
  employee: mongoose.Types.ObjectId;
  destinationCountry: string;
  destinationCity: string;
  purpose: string;
  startDate: Date;
  endDate: Date;
  flightDetails: string;
  accommodationInfo: string;
  contactAbroad: string;
  travelStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  documents: ITravelDocument[];
  expenses: ITravelExpense[];
  budgetedAmount?: number;
  actualAmount?: number;
  tags: string[];
  notes?: string;
  emergencyContacts: IEmergencyContact[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TravelDocumentSchema = new Schema<ITravelDocument>({
  type: { type: String, enum: ['visa', 'invitation', 'passport', 'flight', 'hotel', 'receipt', 'other'], required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });

const TravelExpenseSchema = new Schema<ITravelExpense>({
  category: { type: String, enum: ['flight', 'hotel', 'food', 'transport', 'other'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  receiptUrl: { type: String },
}, { _id: false });

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  type: { type: String, enum: ['employee', 'embassy', 'insurance', 'other'], required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  country: { type: String },
  notes: { type: String },
}, { _id: false });

const TravelRecordSchema = new Schema<ITravelRecord>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  destinationCountry: { type: String, required: true },
  destinationCity: { type: String, required: true },
  purpose: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  flightDetails: { type: String },
  accommodationInfo: { type: String },
  contactAbroad: { type: String },
  travelStatus: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  documents: [TravelDocumentSchema],
  expenses: [TravelExpenseSchema],
  budgetedAmount: { type: Number },
  actualAmount: { type: Number },
  tags: [{ type: String }],
  notes: { type: String },
  emergencyContacts: [EmergencyContactSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<ITravelRecord>('TravelRecord', TravelRecordSchema); 