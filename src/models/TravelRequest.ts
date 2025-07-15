import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalStep {
  approver: mongoose.Types.ObjectId;
  role: 'supervisor' | 'hr' | 'finance' | 'travel_desk';
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: Date;
  required: boolean;
}

export interface ITravelRequest extends Document {
  employee: mongoose.Types.ObjectId;
  requestNumber: string;
  travelType: 'domestic' | 'international';
  purpose: string;
  destination: {
    country: string;
    city: string;
    venue?: string;
  };
  travelDates: {
    departure: Date;
    return: Date;
    flexibility?: string;
  };
  duration: number; // in days
  localContact?: {
    name: string;
    organization: string;
    phone: string;
    email: string;
  };
  plannedItinerary?: string;
  estimatedCost: {
    transport: number;
    accommodation: number;
    dailyAllowance: number;
    miscellaneous: number;
    total: number;
  };
  budgetCode?: string;
  projectCode?: string;
  department: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  approvalWorkflow: IApprovalStep[];
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  attachments: string[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  serial?: string; // Document serial number
}

const ApprovalStepSchema = new Schema<IApprovalStep>({
  approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['supervisor', 'hr', 'finance', 'travel_desk'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comment: { type: String },
  approvedAt: { type: Date },
  required: { type: Boolean, default: true },
}, { _id: false });

const TravelRequestSchema = new Schema<ITravelRequest>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  requestNumber: { type: String, unique: true, sparse: true }, // Remove required, add sparse for unique constraint
  travelType: { type: String, enum: ['domestic', 'international'], required: true },
  purpose: { type: String, required: true },
  destination: {
    country: { type: String, required: true },
    city: { type: String, required: true },
    venue: { type: String },
  },
  travelDates: {
    departure: { type: Date, required: true },
    return: { type: Date, required: true },
    flexibility: { type: String },
  },
  duration: { type: Number, required: true },
  localContact: {
    name: { type: String },
    organization: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  plannedItinerary: { type: String },
  estimatedCost: {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    dailyAllowance: { type: Number, default: 0 },
    miscellaneous: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  budgetCode: { type: String },
  projectCode: { type: String },
  department: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  approvalWorkflow: [ApprovalStepSchema],
  status: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'], default: 'draft' },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  attachments: [{ type: String }],
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  serial: { type: String, unique: true, sparse: true }, // Document serial number
}, { timestamps: true });

// Generate request number - always generate for new documents
TravelRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestNumber) {
    let requestNumber: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const count = await mongoose.model('TravelRequest').countDocuments();
      requestNumber = `TR-${new Date().getFullYear()}-${(count + 1 + attempts).toString().padStart(4, '0')}`;
      
      // Check if this request number already exists
      const existing = await mongoose.model('TravelRequest').findOne({ requestNumber });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (isUnique && requestNumber) {
      this.requestNumber = requestNumber;
    } else {
      return next(new Error('Unable to generate unique request number'));
    }
  }
  next();
});

// Validate that requestNumber is present after save
TravelRequestSchema.post('save', function(doc, next) {
  if (!doc.requestNumber) {
    return next(new Error('Request number is required'));
  }
  next();
});

export default mongoose.model<ITravelRequest>('TravelRequest', TravelRequestSchema); 