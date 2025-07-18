import mongoose, { Document, Schema } from 'mongoose';

export interface IGRNItem {
  description: string;
  quantity: number;
  damaged?: number;
  delayNotes?: string;
}

export interface IGoodsReceipt extends Document {
  purchaseOrder: mongoose.Types.ObjectId | string;
  receivedBy: mongoose.Types.ObjectId | string;
  receivedDate: Date;
  items: IGRNItem[];
  documents?: string[];
  status: 'received' | 'pending' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  damaged: { type: Number },
  delayNotes: { type: String },
});

const GoodsReceiptSchema = new Schema<IGoodsReceipt>({
  purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  receivedDate: { type: Date, required: true },
  items: [GRNItemSchema],
  documents: [{ type: String }],
  status: { type: String, enum: ['received', 'pending', 'rejected'], default: 'received' },
}, { timestamps: true });

export default mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema); 