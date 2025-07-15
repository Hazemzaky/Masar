import mongoose, { Document, Schema } from 'mongoose';

export interface IWasteLog {
  type: string;
  description: string;
  quantity: number;
  unit: string;
  collectionDate: Date;
  disposalMethod: string;
  disposalLocation: string;
  cost: number;
  contractor?: string;
  complianceDocument?: string;
}

export interface IEnvironmental extends Document {
  title: string;
  type: 'waste_management' | 'emission_tracking' | 'compliance_documentation' | 'environmental_incident';
  location: string;
  date: Date;
  reportedBy: mongoose.Types.ObjectId;
  status: 'active' | 'resolved' | 'pending_review';
  description: string;
  wasteLogs: IWasteLog[];
  emissions: {
    type: string;
    quantity: number;
    unit: string;
    date: Date;
  }[];
  complianceDocuments: {
    title: string;
    type: string;
    issueDate: Date;
    expiryDate: Date;
    status: 'valid' | 'expired' | 'pending_renewal';
    attachment: string;
  }[];
  environmentalImpact: string;
  mitigationMeasures: string[];
  cost: number;
  attachments: string[];
  serial?: string; // Document serial number
  createdAt: Date;
  updatedAt: Date;
}

const wasteLogSchema = new Schema<IWasteLog>({
  type: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  collectionDate: { type: Date, required: true },
  disposalMethod: { type: String, required: true },
  disposalLocation: { type: String, required: true },
  cost: { type: Number, required: true },
  contractor: { type: String },
  complianceDocument: { type: String }
});

const emissionSchema = new Schema({
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  date: { type: Date, required: true }
});

const complianceDocumentSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['valid', 'expired', 'pending_renewal'],
    default: 'valid'
  },
  attachment: { type: String, required: true }
});

const environmentalSchema = new Schema<IEnvironmental>({
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['waste_management', 'emission_tracking', 'compliance_documentation', 'environmental_incident'] 
  },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'resolved', 'pending_review'],
    default: 'active'
  },
  description: { type: String, required: true },
  wasteLogs: [wasteLogSchema],
  emissions: [emissionSchema],
  complianceDocuments: [complianceDocumentSchema],
  environmentalImpact: { type: String, required: true },
  mitigationMeasures: [{ type: String }],
  cost: { type: Number, required: true },
  attachments: [{ type: String }],
  serial: { type: String, unique: true, sparse: true } // Document serial number
}, {
  timestamps: true
});

export default mongoose.model<IEnvironmental>('Environmental', environmentalSchema); 