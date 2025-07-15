import mongoose, { Document, Schema } from 'mongoose';

export interface IGovernmentDocument extends Document {
  documentType: 'commercial_license' | 'import_license' | 'traffic_license' | 'municipality_license' | 'fire_department_license' | 'other';
  documentNumber: string;
  title: string;
  description: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending_renewal' | 'suspended' | 'cancelled';
  renewalFee?: number;
  renewalProcess: string;
  documents: {
    originalDocument: string;
    renewalApplication?: string;
    supportingDocuments: string[];
  };
  renewalHistory: {
    date: Date;
    action: string;
    notes: string;
    performedBy: mongoose.Types.ObjectId;
  }[];
  reminders: {
    enabled: boolean;
    reminderDays: number[];
    lastReminderSent: Date;
  };
  notes: string;
  serial?: string; // Document serial number
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const governmentDocumentSchema = new Schema<IGovernmentDocument>({
  documentType: { 
    type: String, 
    enum: ['commercial_license', 'import_license', 'traffic_license', 'municipality_license', 'fire_department_license', 'other'], 
    required: true 
  },
  documentNumber: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  issuingAuthority: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'pending_renewal', 'suspended', 'cancelled'], 
    default: 'active' 
  },
  renewalFee: { type: Number },
  renewalProcess: { type: String },
  documents: {
    originalDocument: { type: String },
    renewalApplication: { type: String },
    supportingDocuments: [{ type: String }]
  },
  renewalHistory: [{
    date: { type: Date, required: true },
    action: { type: String, required: true },
    notes: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  reminders: {
    enabled: { type: Boolean, default: true },
    reminderDays: [{ type: Number, default: [60, 30, 15, 7, 1] }],
    lastReminderSent: { type: Date }
  },
  notes: { type: String },
  serial: { type: String, unique: true, sparse: true }, // Document serial number
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IGovernmentDocument>('GovernmentDocument', governmentDocumentSchema); 