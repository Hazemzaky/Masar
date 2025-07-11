import mongoose, { Document, Schema } from 'mongoose';

export interface IGRNItem {
  description: string;
  quantity: number;
  damaged?: number;
  delayNotes?: string;
}

export interface IGoodsReceipt extends Document {
  purchaseOrder: mongoose.Types.ObjectId;
  receivedBy: mongoose.Types.ObjectId;
  receivedDate: Date;
  items: IGRNItem[];
  documents: string[];
  status: 'received' | 'partial' | 'damaged' | 'delayed';
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
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receivedDate: { type: Date, required: true },
  items: [GRNItemSchema],
  documents: [{ type: String }],
  status: { type: String, enum: ['received', 'partial', 'damaged', 'delayed'], default: 'received' },
}, { timestamps: true });

export default mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema); 