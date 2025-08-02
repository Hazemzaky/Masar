import mongoose, { Document, Schema } from 'mongoose';

// Rental Item interface
export interface IRentalItem {
  description: string;
  rentType: 'Callout' | 'Monthly' | 'Trip';
  workingHours: '8' | '12' | '16' | '24';
  unitPrice: number;
  remarks?: string;
}

export interface IQuotation extends Document {
  quotationDate: Date;
  validUntil: Date;
  status: string;
  clientName: string;
  attn?: string;
  email: string;
  contactNo?: string;
  subject?: string;
  refCode?: string;
  currency?: string;
  project?: string;
  rateType: string;
  rate: number;
  grandTotal: number;
  responses?: any[];
  justification?: string;
  approvalStatus?: string;
  purchaseRequest?: mongoose.Types.ObjectId | string;
  vendors?: (mongoose.Types.ObjectId | string)[];
  selectedVendor?: mongoose.Types.ObjectId | string;
  serialNumber: string;
  clientPOBox?: string;
  clientFax?: string;
  clientEmail?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonExtension?: string;
  termsAndConditions?: string;
  additionalDetails?: string;
  rentalItems?: IRentalItem[];
}

const QuotationSchema = new Schema<IQuotation>({
  quotationDate: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  status: { type: String, default: 'Draft' },
  clientName: { type: String, required: true },
  attn: String,
  email: String,
  contactNo: String,
  subject: String,
  refCode: String,
  currency: String,
  project: String,
  rateType: String,
  rate: Number,
  grandTotal: Number,
  responses: { type: Array, default: [] },
  justification: { type: String },
  approvalStatus: { type: String },
  purchaseRequest: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest' },
  vendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
  selectedVendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  serialNumber: { type: String, required: true, unique: true },
  clientPOBox: String,
  clientFax: String,
  clientEmail: String,
  contactPersonPhone: String,
  contactPersonEmail: String,
  contactPersonExtension: String,
  termsAndConditions: String,
  additionalDetails: String,
  rentalItems: [{
    description: { type: String, required: true },
    rentType: { type: String, enum: ['Callout', 'Monthly', 'Trip'], required: true },
    workingHours: { type: String, enum: ['8', '12', '16', '24'], required: true },
    unitPrice: { type: Number, required: true },
    remarks: String,
  }],
}, { timestamps: true });

export default mongoose.model<IQuotation>('Quotation', QuotationSchema); 