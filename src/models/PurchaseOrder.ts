import mongoose, { Document, Schema } from 'mongoose';

export interface IPOItem {
  description: string;
  quantity: number;
  price: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  purchaseRequest: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  items: IPOItem[];
  totalAmount: number;
  deliveryTerms: string;
  paymentTerms: string;
  status: 'open' | 'ordered' | 'delivered' | 'cancelled';
  scannedPO?: string;
  generatedPDF?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  poNumber: { type: String, required: true, unique: true },
  purchaseRequest: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [POItemSchema],
  totalAmount: { type: Number, required: true },
  deliveryTerms: { type: String },
  paymentTerms: { type: String },
  status: { type: String, enum: ['open', 'ordered', 'delivered', 'cancelled'], default: 'open' },
  scannedPO: { type: String },
  generatedPDF: { type: String },
}, { timestamps: true });

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema); 