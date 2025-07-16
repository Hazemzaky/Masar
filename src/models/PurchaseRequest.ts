import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalHistory {
  approver: mongoose.Types.ObjectId;
  action: 'pending' | 'approved' | 'rejected' | 'sent_to_procurement';
  date: Date;
  comment?: string;
}

export interface IPurchaseRequest extends Document {
  itemDescription: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requester: mongoose.Types.ObjectId;
  department: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'sent_to_procurement';
  approvalHistory: IApprovalHistory[];
  serial?: string; // Document serial number
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalHistorySchema = new Schema<IApprovalHistory>({
  approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['pending', 'approved', 'rejected', 'sent_to_procurement'], required: true },
  date: { type: Date, default: Date.now },
  comment: { type: String },
});

const PurchaseRequestSchema = new Schema<IPurchaseRequest>({
  itemDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], required: true },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  attachments: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'sent_to_procurement'], default: 'pending' },
  approvalHistory: [ApprovalHistorySchema],
  serial: { type: String, unique: true, sparse: true }, // Document serial number
}, { timestamps: true });

export default mongoose.model<IPurchaseRequest>('PurchaseRequest', PurchaseRequestSchema); 