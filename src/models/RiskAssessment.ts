import mongoose, { Document, Schema } from 'mongoose';

export interface IHazard {
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
  impact: 'minor' | 'moderate' | 'major' | 'severe';
  controlMeasures: string[];
  responsiblePerson: string;
  targetDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface IRiskAssessment extends Document {
  title: string;
  location: string;
  department: string;
  assessmentDate: Date;
  nextReviewDate: Date;
  assessor: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'expired';
  hazards: IHazard[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendations: string[];
  attachments: string[];
  reviewHistory: {
    reviewedBy: mongoose.Types.ObjectId;
    reviewDate: Date;
    comments: string;
    status: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const hazardSchema = new Schema<IHazard>({
  description: { type: String, required: true },
  riskLevel: { 
    type: String, 
    required: true, 
    enum: ['low', 'medium', 'high', 'critical'] 
  },
  probability: { 
    type: String, 
    required: true, 
    enum: ['rare', 'unlikely', 'possible', 'likely', 'certain'] 
  },
  impact: { 
    type: String, 
    required: true, 
    enum: ['minor', 'moderate', 'major', 'severe'] 
  },
  controlMeasures: [{ type: String }],
  responsiblePerson: { type: String, required: true },
  targetDate: { type: Date, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending'
  }
});

const reviewHistorySchema = new Schema({
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewDate: { type: Date, required: true },
  comments: { type: String, required: true },
  status: { type: String, required: true }
});

const riskAssessmentSchema = new Schema<IRiskAssessment>({
  title: { type: String, required: true },
  location: { type: String, required: true },
  department: { type: String, required: true },
  assessmentDate: { type: Date, required: true },
  nextReviewDate: { type: Date, required: true },
  assessor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvalDate: { type: Date },
  status: { 
    type: String, 
    required: true, 
    enum: ['draft', 'pending_approval', 'approved', 'expired'],
    default: 'draft'
  },
  hazards: [hazardSchema],
  overallRiskLevel: { 
    type: String, 
    required: true, 
    enum: ['low', 'medium', 'high', 'critical'] 
  },
  summary: { type: String, required: true },
  recommendations: [{ type: String }],
  attachments: [{ type: String }],
  reviewHistory: [reviewHistorySchema]
}, {
  timestamps: true
});

export default mongoose.model<IRiskAssessment>('RiskAssessment', riskAssessmentSchema); 