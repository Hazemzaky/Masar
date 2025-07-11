import mongoose, { Document, Schema } from 'mongoose';

export interface IInspectionItem {
  category: string;
  item: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'not_applicable';
  findings?: string;
  correctiveAction?: string;
  responsiblePerson?: string;
  targetDate?: Date;
  completionDate?: Date;
  actionStatus: 'open' | 'in_progress' | 'completed' | 'overdue';
}

export interface ISafetyInspection extends Document {
  title: string;
  location: string;
  inspector: mongoose.Types.ObjectId;
  inspectionDate: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  items: IInspectionItem[];
  overallScore: number;
  findings: string;
  recommendations: string[];
  attachments: string[];
  nextInspectionDate: Date;
  completedBy?: mongoose.Types.ObjectId;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inspectionItemSchema = new Schema<IInspectionItem>({
  category: { type: String, required: true },
  item: { type: String, required: true },
  complianceStatus: { 
    type: String, 
    required: true, 
    enum: ['compliant', 'non_compliant', 'not_applicable'] 
  },
  findings: { type: String },
  correctiveAction: { type: String },
  responsiblePerson: { type: String },
  targetDate: { type: Date },
  completionDate: { type: Date },
  actionStatus: { 
    type: String, 
    required: true, 
    enum: ['open', 'in_progress', 'completed', 'overdue'],
    default: 'open'
  }
});

const safetyInspectionSchema = new Schema<ISafetyInspection>({
  title: { type: String, required: true },
  location: { type: String, required: true },
  inspector: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  inspectionDate: { type: Date, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['daily', 'weekly', 'monthly', 'special'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['scheduled', 'in_progress', 'completed', 'overdue'],
    default: 'scheduled'
  },
  items: [inspectionItemSchema],
  overallScore: { type: Number, required: true },
  findings: { type: String, required: true },
  recommendations: [{ type: String }],
  attachments: [{ type: String }],
  nextInspectionDate: { type: Date, required: true },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedDate: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<ISafetyInspection>('SafetyInspection', safetyInspectionSchema); 