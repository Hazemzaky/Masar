import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalHistory {
  approver: mongoose.Types.ObjectId | string;
  action: string;
  date: Date;
  comment?: string;
}

export interface IPurchaseRequest extends Document {
  itemDescription: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent_to_procurement';
  requester: mongoose.Types.ObjectId | string;
  attachments?: string[];
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

const PurchaseRequestSchema = new Schema<IPurchaseRequest>({
  itemDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  department: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'sent_to_procurement'], default: 'pending' },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  attachments: [{ type: String }],
  approvalHistory: { type: [ApprovalHistorySchema], default: [] },
}, { timestamps: true });

export default mongoose.model<IPurchaseRequest>('PurchaseRequest', PurchaseRequestSchema); 