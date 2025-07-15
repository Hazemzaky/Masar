import mongoose, { Document, Schema } from 'mongoose';

export interface IIncident extends Document {
  title: string;
  description: string;
  type: 'injury' | 'accident' | 'near_miss' | 'property_damage' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'closed';
  location: string;
  date: Date;
  reportedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  involvedPersons: string[];
  witnesses: string[];
  immediateActions: string;
  rootCause?: string;
  correctiveActions?: string;
  attachments: string[];
  estimatedCost?: number;
  actualCost?: number;
  investigationDate?: Date;
  closedDate?: Date;
  closedBy?: mongoose.Types.ObjectId;
  tags: string[];
  serial?: string; // Document serial number
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['injury', 'accident', 'near_miss', 'property_damage', 'environmental'] 
  },
  severity: { 
    type: String, 
    required: true, 
    enum: ['low', 'medium', 'high', 'critical'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['open', 'investigating', 'closed'],
    default: 'open'
  },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  involvedPersons: [{ type: String }],
  witnesses: [{ type: String }],
  immediateActions: { type: String, required: true },
  rootCause: { type: String },
  correctiveActions: { type: String },
  attachments: [{ type: String }],
  estimatedCost: { type: Number },
  actualCost: { type: Number },
  investigationDate: { type: Date },
  closedDate: { type: Date },
  closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
  serial: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

export default mongoose.model<IIncident>('Incident', incidentSchema); 