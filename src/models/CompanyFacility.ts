import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanyFacility extends Document {
  facilityName: string;
  facilityType: 'office' | 'warehouse' | 'workshop' | 'showroom' | 'residential' | 'other';
  address: string;
  area: number;
  rentAgreement: {
    agreementNumber: string;
    landlordName: string;
    landlordContact: string;
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    securityDeposit: number;
    renewalTerms: string;
    status: 'active' | 'expired' | 'pending_renewal' | 'terminated';
  };
  municipalityApproval: {
    approvalNumber: string;
    approvalDate: Date;
    expiryDate: Date;
    approvalType: string;
    status: 'active' | 'expired' | 'pending_renewal';
    renewalProcess: string;
  };
  fireDepartmentApproval: {
    approvalNumber: string;
    approvalDate: Date;
    expiryDate: Date;
    inspectionDate: Date;
    status: 'active' | 'expired' | 'pending_renewal';
    findings: string;
    correctiveActions: string[];
  };
  mocApproval?: {
    approvalNumber: string;
    approvalDate: Date;
    expiryDate: Date;
    approvalType: string;
    status: 'active' | 'expired' | 'pending_renewal';
  };
  otherApprovals: {
    authority: string;
    approvalNumber: string;
    approvalDate: Date;
    expiryDate: Date;
    status: 'active' | 'expired' | 'pending_renewal';
    notes: string;
  }[];
  documents: {
    rentAgreement: string;
    municipalityApproval: string;
    fireDepartmentApproval: string;
    mocApproval?: string;
    otherDocuments: string[];
  };
  maintenanceHistory: {
    date: Date;
    type: string;
    description: string;
    cost: number;
    performedBy: string;
  }[];
  status: 'active' | 'inactive' | 'under_renovation' | 'closed';
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companyFacilitySchema = new Schema<ICompanyFacility>({
  facilityName: { type: String, required: true },
  facilityType: { 
    type: String, 
    enum: ['office', 'warehouse', 'workshop', 'showroom', 'residential', 'other'], 
    required: true 
  },
  address: { type: String, required: true },
  area: { type: Number, required: true },
  rentAgreement: {
    agreementNumber: { type: String, required: true },
    landlordName: { type: String, required: true },
    landlordContact: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    renewalTerms: { type: String },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'pending_renewal', 'terminated'], 
      default: 'active' 
    }
  },
  municipalityApproval: {
    approvalNumber: { type: String, required: true },
    approvalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    approvalType: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'pending_renewal'], 
      default: 'active' 
    },
    renewalProcess: { type: String }
  },
  fireDepartmentApproval: {
    approvalNumber: { type: String, required: true },
    approvalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    inspectionDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'pending_renewal'], 
      default: 'active' 
    },
    findings: { type: String },
    correctiveActions: [{ type: String }]
  },
  mocApproval: {
    approvalNumber: { type: String },
    approvalDate: { type: Date },
    expiryDate: { type: Date },
    approvalType: { type: String },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'pending_renewal'], 
      default: 'active' 
    }
  },
  otherApprovals: [{
    authority: { type: String, required: true },
    approvalNumber: { type: String, required: true },
    approvalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'pending_renewal'], 
      default: 'active' 
    },
    notes: { type: String }
  }],
  documents: {
    rentAgreement: { type: String },
    municipalityApproval: { type: String },
    fireDepartmentApproval: { type: String },
    mocApproval: { type: String },
    otherDocuments: [{ type: String }]
  },
  maintenanceHistory: [{
    date: { type: Date, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true },
    performedBy: { type: String, required: true }
  }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'under_renovation', 'closed'], 
    default: 'active' 
  },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<ICompanyFacility>('CompanyFacility', companyFacilitySchema); 