import mongoose, { Document, Schema } from 'mongoose';

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
  insuranceAmount: number;
  customsClearance: {
    clearanceNumber: string;
    clearanceDate: Date;
    customsOffice: string;
    importDuty: number;
    clearanceStatus: 'pending' | 'completed' | 'delayed' | 'rejected';
    clearanceNotes: string;
  };
  mubarakAlKabeer: {
    registrationNumber: string;
    registrationDate: Date;
    expiryDate: Date;
    status: 'active' | 'expired' | 'pending_renewal';
    notes: string;
  };
  documents: {
    registrationCard: string;
    insurancePolicy: string;
    customsClearance: string;
    mubarakAlKabeer: string;
    otherDocuments: string[];
  };
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
  insuranceAmount: { type: Number, required: true },
  customsClearance: {
    clearanceNumber: { type: String },
    clearanceDate: { type: Date },
    customsOffice: { type: String },
    importDuty: { type: Number },
    clearanceStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'delayed', 'rejected'], 
      default: 'pending' 
    },
    clearanceNotes: { type: String }
  },
  mubarakAlKabeer: {
    registrationNumber: { type: String },
    registrationDate: { type: Date },
    expiryDate: { type: Date },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'pending_renewal'], 
      default: 'active' 
    },
    notes: { type: String }
  },
  documents: {
    registrationCard: { type: String },
    insurancePolicy: { type: String },
    customsClearance: { type: String },
    mubarakAlKabeer: { type: String },
    otherDocuments: [{ type: String }]
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'suspended', 'cancelled'], 
    default: 'active' 
  },
  renewalReminders: {
    enabled: { type: Boolean, default: true },
    reminderDays: [{ type: Number, default: [30, 15, 7, 1] }],
    lastReminderSent: { type: Date }
  },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IVehicleRegistration>('VehicleRegistration', vehicleRegistrationSchema); 