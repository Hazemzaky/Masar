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
    hasSecurityDeposit?: 'Yes' | 'No';
    securityDepositAmount?: number;
    securityDepositPaymentType?: 'Cash' | 'Cheque';
    securityDepositChequeType?: 'Liquidated' | 'Guarantee';
    securityDepositAmortization?: string;
  };
  municipalityApproval: {
    approvalDate: Date;
    expiryDate: Date;
    status: 'active' | 'expired' | 'pending_renewal';
    renewalPlace?: string;
  };
  fireDepartmentApproval: {
    approvalDate: Date;
    expiryDate: Date;
    inspectionDate: Date;
    status: 'active' | 'expired' | 'pending_renewal';
    findings: string;
    correctiveActions: string[];
  };
  ministryApproval?: {
    approvalDate: Date;
    expiryDate: Date;
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
    ministryApproval?: string;
    ministriesDocuments?: string;
    otherDocuments: string[];
  };
  facilityDocs?: {
    rentAgreement?: string;
    municipality?: string;
    fireDept?: string;
    ministries?: string;
    other?: string;
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
    },
    hasSecurityDeposit: { type: String, enum: ['Yes', 'No'] },
    securityDepositAmount: { type: Number },
    securityDepositPaymentType: { type: String, enum: ['Cash', 'Cheque'] },
    securityDepositChequeType: { type: String, enum: ['Liquidated', 'Guarantee'] },
    securityDepositAmortization: { type: String },
  },
  municipalityApproval: {
    approvalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'pending_renewal'],
      default: 'active'
    },
    renewalPlace: { type: String },
  },
  fireDepartmentApproval: {
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
  ministryApproval: {
    approvalDate: { type: Date },
    expiryDate: { type: Date },
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
    ministryApproval: { type: String },
    ministriesDocuments: { type: String },
    otherDocuments: [{ type: String }]
  },
  facilityDocs: {
    rentAgreement: { type: String },
    municipality: { type: String },
    fireDept: { type: String },
    ministries: { type: String },
    other: { type: String },
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