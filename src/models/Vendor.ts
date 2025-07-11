import mongoose, { Document, Schema } from 'mongoose';

export interface IContactInfo {
  phone: string;
  email: string;
  address: string;
}

export interface IDocuments {
  tradeLicense?: string;
  bankInfo?: string;
  vatCertificate?: string;
}

export interface IApprovalHistory {
  approver: mongoose.Types.ObjectId;
  action: 'pending' | 'approved' | 'rejected';
  date: Date;
  comment?: string;
}

export interface IVendor extends Document {
  name: string;
  contactInfo: IContactInfo;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rating?: number;
  documents: IDocuments;
  status: 'active' | 'blacklisted' | 'inactive';
  approvalHistory: IApprovalHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactInfoSchema = new Schema<IContactInfo>({
  phone: { type: String },
  email: { type: String },
  address: { type: String },
});

const DocumentsSchema = new Schema<IDocuments>({
  tradeLicense: { type: String },
  bankInfo: { type: String },
  vatCertificate: { type: String },
});

const ApprovalHistorySchema = new Schema<IApprovalHistory>({
  approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
  date: { type: Date, default: Date.now },
  comment: { type: String },
});

const VendorSchema = new Schema<IVendor>({
  name: { type: String, required: true },
  contactInfo: { type: ContactInfoSchema, required: true },
  registrationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rating: { type: Number },
  documents: { type: DocumentsSchema, default: {} },
  status: { type: String, enum: ['active', 'blacklisted', 'inactive'], default: 'active' },
  approvalHistory: [ApprovalHistorySchema],
}, { timestamps: true });

export default mongoose.model<IVendor>('Vendor', VendorSchema); 