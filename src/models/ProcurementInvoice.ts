import mongoose, { Document, Schema } from 'mongoose';

export interface IProcurementInvoice extends Document {
  purchaseOrder: mongoose.Types.ObjectId | string;
  invoiceFile?: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  paymentDate?: Date;
  matchedGRN?: string;
  serial?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProcurementInvoiceSchema = new Schema<IProcurementInvoice>({
  purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  invoiceFile: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  paymentDate: { type: Date },
  matchedGRN: { type: String },
  serial: { type: String },
}, { timestamps: true });

export default mongoose.model<IProcurementInvoice>('ProcurementInvoice', ProcurementInvoiceSchema); 