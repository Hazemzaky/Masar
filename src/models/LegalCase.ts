import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalCase extends Document {
  caseNumber: string;
  title: string;
  description: string;
  caseType: 'labour_dispute' | 'traffic_fine' | 'contract_dispute' | 'regulatory_violation' | 'other';
  ministry: string; // replaces court
  caseReviewLocation: string; // replaces courtLocation
  filingDate: Date;
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'appealed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  actualCost: number;
  paidStatus: 'Paid' | 'Not Paid'; // new
  legalRepType: 'Internal' | 'External'; // new
  coId?: string; // new, for Internal
  legalRepresentative: {
    name: string;
    firm?: string; // required for External
    phone: string;
    email: string;
    contractAmount: number;
  };
  courtDates: {
    date: Date;
    type: 'hearing' | 'filing' | 'settlement' | 'judgment' | 'other';
    description: string;
    outcome?: string;
    nextAction?: string;
  }[];
  documents: {
    caseFile: string;
    courtOrders: string[];
    legalCorrespondence: string[];
    evidence: string[];
    otherDocuments: string[];
  };
  parties: {
    name: string;
    type: 'plaintiff' | 'defendant' | 'third_party';
    contactInfo: string;
  }[];
  timeline: {
    date: Date;
    action: string;
    description: string;
    performedBy: mongoose.Types.ObjectId;
  }[];
  notes: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  serial?: string; // Document serial number
}

const legalCaseSchema = new Schema<ILegalCase>({
  caseNumber: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  caseType: {
    type: String,
    enum: ['labour_dispute', 'traffic_fine', 'contract_dispute', 'regulatory_violation', 'other'],
    required: true
  },
  ministry: { type: String, required: true }, // replaces court
  caseReviewLocation: { type: String, required: true }, // replaces courtLocation
  filingDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['open', 'pending', 'in_progress', 'resolved', 'closed', 'appealed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedCost: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  paidStatus: { type: String, enum: ['Paid', 'Not Paid'], required: true }, // new
  legalRepType: { type: String, enum: ['Internal', 'External'], required: true }, // new
  coId: { type: String }, // new
  legalRepresentative: {
    name: { type: String, required: true },
    firm: { type: String }, // required for External
    phone: { type: String, required: true },
    email: { type: String, required: true },
    contractAmount: { type: Number, required: true }
  },
  courtDates: [{
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['hearing', 'filing', 'settlement', 'judgment', 'other'],
      required: true
    },
    description: { type: String, required: true },
    outcome: { type: String },
    nextAction: { type: String }
  }],
  documents: {
    caseFile: { type: String },
    courtOrders: [{ type: String }],
    legalCorrespondence: [{ type: String }],
    evidence: [{ type: String }],
    otherDocuments: [{ type: String }]
  },
  parties: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['plaintiff', 'defendant', 'third_party'],
      required: true
    },
    contactInfo: { type: String, required: true }
  }],
  timeline: [{
    date: { type: Date, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  notes: { type: String },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  serial: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

export default mongoose.model<ILegalCase>('LegalCase', legalCaseSchema); 