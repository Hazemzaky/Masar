import mongoose, { Document, Schema } from 'mongoose';

export interface IQuoteResponse {
  vendor: mongoose.Types.ObjectId;
  quoteFile: string;
  price: number;
  notes?: string;
  status: 'pending' | 'submitted' | 'selected' | 'rejected';
}

export interface IQuotation extends Document {
  purchaseRequest: mongoose.Types.ObjectId;
  vendors: mongoose.Types.ObjectId[];
  responses: IQuoteResponse[];
  selectedVendor?: mongoose.Types.ObjectId;
  justification?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const QuoteResponseSchema = new Schema<IQuoteResponse>({
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  quoteFile: { type: String, required: true },
  price: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'submitted', 'selected', 'rejected'], default: 'pending' },
});

const QuotationSchema = new Schema<IQuotation>({
  purchaseRequest: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest', required: true },
  vendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
  responses: [QuoteResponseSchema],
  selectedVendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  justification: { type: String },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IQuotation>('Quotation', QuotationSchema); 