import mongoose, { Document, Schema } from 'mongoose';

export interface IGovernmentCorrespondence extends Document {
  referenceNumber: string;
  subject: string;
  description: string;
  ministry: string;
  department: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  submissionDate: Date;
  submissionMethod: 'in_person' | 'online' | 'mail' | 'courier';
  requestType: 'application' | 'inquiry' | 'complaint' | 'renewal' | 'other';
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'pending_documents' | 'completed';
  expectedResponseDate?: Date;
  actualResponseDate?: Date;
  responseReceived: boolean;
  responseDetails?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  documents: {
    originalSubmission: string;
    supportingDocuments: string[];
    responseDocuments: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const governmentCorrespondenceSchema = new Schema<IGovernmentCorrespondence>({
  referenceNumber: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  ministry: { type: String, required: true },
  department: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  submissionDate: { type: Date, required: true },
  submissionMethod: { 
    type: String, 
    enum: ['in_person', 'online', 'mail', 'courier'], 
    required: true 
  },
  requestType: { 
    type: String, 
    enum: ['application', 'inquiry', 'complaint', 'renewal', 'other'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'pending_documents', 'completed'], 
    default: 'submitted' 
  },
  expectedResponseDate: { type: Date },
  actualResponseDate: { type: Date },
  responseReceived: { type: Boolean, default: false },
  responseDetails: { type: String },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpNotes: { type: String },
  documents: {
    originalSubmission: { type: String },
    supportingDocuments: [{ type: String }],
    responseDocuments: [{ type: String }]
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IGovernmentCorrespondence>('GovernmentCorrespondence', governmentCorrespondenceSchema); 