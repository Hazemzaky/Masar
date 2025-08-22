import mongoose, { Schema, Document } from 'mongoose';

export interface IHSEDocument extends Document {
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  folder: mongoose.Types.ObjectId;
  tags: string[];
  
  // Required fields for HSE documents
  cost: number;
  amortization: number; // in months
  startDate: Date;
  endDate: Date;
  
  // Additional metadata
  documentType: string; // 'policy', 'standard', 'procedure', 'guideline', etc.
  version: string;
  status: 'active' | 'draft' | 'archived' | 'expired';
  expiryDate?: Date;
  
  // Audit fields
  uploadedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const HSEDocumentSchema = new Schema<IHSEDocument>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  folder: {
    type: Schema.Types.ObjectId,
    ref: 'HSEDocumentFolder',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Required HSE fields
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  amortization: {
    type: Number,
    required: true,
    min: 1,
    max: 120 // Maximum 10 years
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IHSEDocument, value: Date) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  // Additional metadata
  documentType: {
    type: String,
    required: true,
    enum: ['policy', 'standard', 'procedure', 'guideline', 'manual', 'form', 'checklist', 'other']
  },
  version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'draft', 'archived', 'expired'],
    default: 'draft'
  },
  expiryDate: {
    type: Date
  },
  
  // Audit fields
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
HSEDocumentSchema.index({ folder: 1, status: 1 });
HSEDocumentSchema.index({ tags: 1 });
HSEDocumentSchema.index({ documentType: 1 });
HSEDocumentSchema.index({ expiryDate: 1 });

// Virtual for calculating remaining amortization
HSEDocumentSchema.virtual('remainingAmortization').get(function() {
  if (this.status === 'expired' || this.endDate < new Date()) {
    return 0;
  }
  
  const now = new Date();
  const totalDays = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (elapsedDays <= 0) return this.amortization;
  if (elapsedDays >= totalDays) return 0;
  
  const remainingRatio = (totalDays - elapsedDays) / totalDays;
  return Math.ceil(this.amortization * remainingRatio);
});

// Virtual for calculating monthly amortization amount
HSEDocumentSchema.virtual('monthlyAmortization').get(function() {
  return this.cost / this.amortization;
});

// Pre-save middleware to check expiry
HSEDocumentSchema.pre('save', function(next) {
  if (this.endDate && this.endDate < new Date()) {
    this.status = 'expired';
  }
  next();
});

export default mongoose.model<IHSEDocument>('HSEDocument', HSEDocumentSchema); 