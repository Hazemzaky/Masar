import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalCase extends Document {
  caseNumber: string;
  title: string;
  description: string;
  caseType: 'labour_dispute' | 'traffic_fine' | 'contract_dispute' | 'regulatory_violation' | 'other';
  court: string;
  courtLocation: string;
  filingDate: Date;
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'appealed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  actualCost: number;
  legalRepresentative: {
    name: string;
    firm: string;
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
  court: { type: String, required: true },
  courtLocation: { type: String, required: true },
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
  legalRepresentative: {
    name: { type: String, required: true },
    firm: { type: String, required: true },
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
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<ILegalCase>('LegalCase', legalCaseSchema); 