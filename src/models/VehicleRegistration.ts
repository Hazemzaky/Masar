import mongoose, { Document, Schema } from 'mongoose';

export interface IPass {
  passType: 'KOC' | 'KNPC' | 'GO' | 'RATQA' | 'ABDALI' | 'WANEET';
  issuanceDate: Date;
  expiryDate: Date;
  sponsor: string;
}

export interface IVehicleRegistration extends Document {
  vehicle: mongoose.Types.ObjectId;
  plateNumber: string;
  chassisNumber: string;
  engineNumber: string;
  registrationNumber: string;
  registrationExpiry: Date;
  insuranceCompany: string;
  insurancePolicyNumber: string;
  insuranceExpiry: Date;
  insuranceCost: number;
  insurancePaymentSystem: 'cash' | 'installments';
  insuranceInstallmentPeriod?: number; // in months, if installments
  hasPasses: boolean;
  passes: IPass[];
  documents: {
    registrationCard: string;
    insurancePolicy: string;
    otherDocuments: string[];
  };
  // Add registration card fields
  registrationCardCountry?: string;
  registrationCardBrand?: string;
  registrationCardCapacity?: string;
  registrationCardShape?: string;
  registrationCardColour?: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  renewalReminders: {
    enabled: boolean;
    reminderDays: number[];
    lastReminderSent: Date;
  };
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const passSchema = new Schema<IPass>({
  passType: { type: String, enum: ['KOC', 'KNPC', 'GO', 'RATQA', 'ABDALI', 'WANEET'], required: true },
  issuanceDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  sponsor: { type: String, required: true },
});

const vehicleRegistrationSchema = new Schema<IVehicleRegistration>({
  vehicle: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  plateNumber: { type: String, required: true },
  chassisNumber: { type: String, required: true },
  engineNumber: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  registrationExpiry: { type: Date, required: true },
  insuranceCompany: { type: String, required: true },
  insurancePolicyNumber: { type: String, required: true },
  insuranceExpiry: { type: Date, required: true },
  insuranceCost: { type: Number, required: true },
  insurancePaymentSystem: { type: String, enum: ['cash', 'installments'], required: true },
  insuranceInstallmentPeriod: { type: Number },
  hasPasses: { type: Boolean, default: false },
  passes: [passSchema],
  documents: {
    registrationCard: { type: String },
    insurancePolicy: { type: String },
    otherDocuments: [{ type: String }],
  },
  // Add registration card fields
  registrationCardCountry: { type: String },
  registrationCardBrand: { type: String },
  registrationCardCapacity: { type: String },
  registrationCardShape: { type: String },
  registrationCardColour: { type: String },
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'cancelled'],
    default: 'active',
  },
  renewalReminders: {
    enabled: { type: Boolean, default: true },
    reminderDays: [{ type: Number, default: [30, 15, 7, 1] }],
    lastReminderSent: { type: Date },
  },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export default mongoose.model<IVehicleRegistration>('VehicleRegistration', vehicleRegistrationSchema); 