import mongoose, { Document, Schema } from 'mongoose';

export interface IVisaRequirement {
  required: boolean;
  type: string;
  processingTime: number; // in days
  estimatedCost: number;
  documentsRequired: string[];
  notes: string;
  status: 'not_required' | 'pending' | 'in_progress' | 'approved' | 'rejected';
  applicationDate?: Date;
  approvalDate?: Date;
  rejectionReason?: string;
}

export interface IWorkPermit {
  required: boolean;
  type: string;
  processingTime: number; // in days
  estimatedCost: number;
  documentsRequired: string[];
  notes: string;
  status: 'not_required' | 'pending' | 'in_progress' | 'approved' | 'rejected';
  applicationDate?: Date;
  approvalDate?: Date;
  rejectionReason?: string;
}

export interface IBudgetApproval {
  department: string;
  budgetCode: string;
  allocatedAmount: number;
  requestedAmount: number;
  availableAmount: number;
  approvedAmount: number;
  approvedBy: mongoose.Types.ObjectId;
  approvedAt: Date;
  comments: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface IPolicyAcknowledgment {
  policyVersion: string;
  acknowledgedAt: Date;
  acknowledgedBy: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
}

export interface ITravelAuthorization extends Document {
  travelRequest: mongoose.Types.ObjectId;
  authorizationNumber: string;
  employee: mongoose.Types.ObjectId;
  destination: {
    country: string;
    city: string;
  };
  travelDates: {
    departure: Date;
    return: Date;
  };
  purpose: string;
  
  // Budget Approvals
  budgetApprovals: IBudgetApproval[];
  totalBudgetApproved: number;
  budgetStatus: 'pending' | 'approved' | 'rejected';
  
  // Visa Requirements
  visaRequirements: IVisaRequirement;
  
  // Work Permit Requirements
  workPermit: IWorkPermit;
  
  // Policy Acknowledgment
  policyAcknowledgment: IPolicyAcknowledgment;
  
  // Travel Class and Booking
  approvedTravelClass: 'economy' | 'business' | 'first';
  bookingChannels: string[];
  specialRequirements: string[];
  
  // Safety and Compliance
  safetyBriefing: {
    required: boolean;
    completed: boolean;
    completedAt?: Date;
    conductedBy?: mongoose.Types.ObjectId;
    notes: string;
  };
  
  insurance: {
    required: boolean;
    type: string;
    coverage: string;
    cost: number;
    status: 'pending' | 'arranged' | 'confirmed';
  };
  
  // Status and Workflow
  status: 'draft' | 'pending_budget' | 'pending_visa' | 'pending_policy' | 'authorized' | 'rejected' | 'cancelled';
  authorizedAt?: Date;
  authorizedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  
  // Documents
  documents: {
    authorizationLetter: string;
    visaDocuments: string[];
    insuranceDocuments: string[];
    otherDocuments: string[];
  };
  
  serial?: string; // Document serial number
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VisaRequirementSchema = new Schema<IVisaRequirement>({
  required: { type: Boolean, default: false },
  type: { type: String },
  processingTime: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: 0 },
  documentsRequired: [{ type: String }],
  notes: { type: String },
  status: { type: String, enum: ['not_required', 'pending', 'in_progress', 'approved', 'rejected'], default: 'not_required' },
  applicationDate: { type: Date },
  approvalDate: { type: Date },
  rejectionReason: { type: String },
}, { _id: false });

const WorkPermitSchema = new Schema<IWorkPermit>({
  required: { type: Boolean, default: false },
  type: { type: String },
  processingTime: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: 0 },
  documentsRequired: [{ type: String }],
  notes: { type: String },
  status: { type: String, enum: ['not_required', 'pending', 'in_progress', 'approved', 'rejected'], default: 'not_required' },
  applicationDate: { type: Date },
  approvalDate: { type: Date },
  rejectionReason: { type: String },
}, { _id: false });

const BudgetApprovalSchema = new Schema<IBudgetApproval>({
  department: { type: String, required: true },
  budgetCode: { type: String, required: true },
  allocatedAmount: { type: Number, required: true },
  requestedAmount: { type: Number, required: true },
  availableAmount: { type: Number, required: true },
  approvedAmount: { type: Number, required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedAt: { type: Date, required: true },
  comments: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { _id: false });

const PolicyAcknowledgmentSchema = new Schema<IPolicyAcknowledgment>({
  policyVersion: { type: String, required: true },
  acknowledgedAt: { type: Date, required: true },
  acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
}, { _id: false });

const TravelAuthorizationSchema = new Schema<ITravelAuthorization>({
  travelRequest: { type: Schema.Types.ObjectId, ref: 'TravelRequest', required: true },
  authorizationNumber: { type: String, unique: true, sparse: true }, // Remove required, add sparse for unique constraint
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  destination: {
    country: { type: String, required: true },
    city: { type: String, required: true },
  },
  travelDates: {
    departure: { type: Date, required: true },
    return: { type: Date, required: true },
  },
  purpose: { type: String, required: true },
  
  // Budget Approvals
  budgetApprovals: [BudgetApprovalSchema],
  totalBudgetApproved: { type: Number, default: 0 },
  budgetStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  
  // Visa Requirements
  visaRequirements: { type: VisaRequirementSchema, default: () => ({}) },
  
  // Work Permit Requirements
  workPermit: { type: WorkPermitSchema, default: () => ({}) },
  
  // Policy Acknowledgment
  policyAcknowledgment: { type: PolicyAcknowledgmentSchema },
  
  // Travel Class and Booking
  approvedTravelClass: { type: String, enum: ['economy', 'business', 'first'], default: 'economy' },
  bookingChannels: [{ type: String }],
  specialRequirements: [{ type: String }],
  
  // Safety and Compliance
  safetyBriefing: {
    required: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    conductedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  
  insurance: {
    required: { type: Boolean, default: true },
    type: { type: String },
    coverage: { type: String },
    cost: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'arranged', 'confirmed'], default: 'pending' },
  },
  
  // Status and Workflow
  status: { type: String, enum: ['draft', 'pending_budget', 'pending_visa', 'pending_policy', 'authorized', 'rejected', 'cancelled'], default: 'draft' },
  authorizedAt: { type: Date },
  authorizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  
  // Documents
  documents: {
    authorizationLetter: { type: String },
    visaDocuments: [{ type: String }],
    insuranceDocuments: [{ type: String }],
    otherDocuments: [{ type: String }],
  },
  
  serial: { type: String, unique: true, sparse: true }, // Document serial number
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Generate authorization number - always generate for new documents
TravelAuthorizationSchema.pre('save', async function(next) {
  if (this.isNew && !this.authorizationNumber) {
    let authorizationNumber: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const count = await mongoose.model('TravelAuthorization').countDocuments();
      authorizationNumber = `TA-${new Date().getFullYear()}-${(count + 1 + attempts).toString().padStart(4, '0')}`;
      
      // Check if this authorization number already exists
      const existing = await mongoose.model('TravelAuthorization').findOne({ authorizationNumber });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (isUnique && authorizationNumber) {
      this.authorizationNumber = authorizationNumber;
    } else {
      return next(new Error('Unable to generate unique authorization number'));
    }
  }
  next();
});

// Validate that authorizationNumber is present after save
TravelAuthorizationSchema.post('save', function(doc, next) {
  if (!doc.authorizationNumber) {
    return next(new Error('Authorization number is required'));
  }
  next();
});

export default mongoose.model<ITravelAuthorization>('TravelAuthorization', TravelAuthorizationSchema); 