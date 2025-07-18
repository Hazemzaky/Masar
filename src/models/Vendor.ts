import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalHistory {
  approver: mongoose.Types.ObjectId | string;
  action: string;
  date: Date;
  comment?: string;
}

export interface IVendor extends Document {
  name: string;
  phone: string;
  email: string;
  address: string;
  tradeLicense?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  registrationStatus: 'pending' | 'approved' | 'rejected';
  approvalHistory: IApprovalHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalHistorySchema = new Schema<IApprovalHistory>({
  approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  date: { type: Date, required: true },
  comment: { type: String }
});

const VendorSchema = new Schema<IVendor>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  tradeLicense: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'blacklisted'], default: 'inactive' },
  registrationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvalHistory: { type: [ApprovalHistorySchema], default: [] },
}, { timestamps: true });

export default mongoose.model<IVendor>('Vendor', VendorSchema); 