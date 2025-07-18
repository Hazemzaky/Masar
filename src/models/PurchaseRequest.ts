import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseRequest extends Document {
  itemDescription: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent_to_procurement';
  requester: mongoose.Types.ObjectId | string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequestSchema = new Schema<IPurchaseRequest>({
  itemDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  department: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'sent_to_procurement'], default: 'pending' },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  attachments: [{ type: String }],
}, { timestamps: true });

export default mongoose.model<IPurchaseRequest>('PurchaseRequest', PurchaseRequestSchema); 