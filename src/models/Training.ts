import mongoose, { Document, Schema } from 'mongoose';

export interface ICertification {
  type: string;
  name: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  certificateNumber: string;
  status: 'active' | 'expired' | 'pending_renewal';
  attachments: string[];
}

export interface ITraining extends Document {
  employee: mongoose.Types.ObjectId;
  trainingType: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in hours
  provider: string;
  location: string;
  instructor: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: number;
  result: 'pass' | 'fail' | 'not_applicable';
  certificates: ICertification[];
  attendance: {
    date: Date;
    present: boolean;
    notes?: string;
  }[];
  cost: number;
  notes?: string;
  attachments: string[];
  serial?: string; // Document serial number
  createdAt: Date;
  updatedAt: Date;
}

const certificationSchema = new Schema<ICertification>({
  type: { type: String, required: true },
  name: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  issuingAuthority: { type: String, required: true },
  certificateNumber: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'expired', 'pending_renewal'],
    default: 'active'
  },
  attachments: [{ type: String }]
});

const attendanceSchema = new Schema({
  date: { type: Date, required: true },
  present: { type: Boolean, required: true },
  notes: { type: String }
});

const trainingSchema = new Schema<ITraining>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  trainingType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  provider: { type: String, required: true },
  location: { type: String, required: true },
  instructor: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  score: { type: Number },
  result: { 
    type: String, 
    required: true, 
    enum: ['pass', 'fail', 'not_applicable'],
    default: 'not_applicable'
  },
  certificates: [certificationSchema],
  attendance: [attendanceSchema],
  cost: { type: Number, required: true },
  notes: { type: String },
  attachments: [{ type: String }],
  serial: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

export default mongoose.model<ITraining>('Training', trainingSchema); 