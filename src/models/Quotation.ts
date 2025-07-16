import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotation extends Document {
  quotationDate: Date;
  validUntil: Date;
  status: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  billingAddress: string;
  clientCategory: string;
  equipmentType: string;
  quantity: number;
  rentalStart: Date;
  rentalEnd: Date;
  usageType: string;
  projectLocation: string;
  rateType: string;
  rate: number;
  operatorCharges: number;
  fuelCharges: number;
  mobilizationFee: number;
  standbyCharges: number;
  securityDeposit: number;
  discounts: number;
  taxes: number;
  addOns: string;
  paymentTerms: string;
  paymentMethods: string;
  penalty: string;
  withOperator: string;
  fuelProvidedBy: string;
  insurance: string;
  maintenance: string;
  availability: string;
  breakdownPolicy: string;
  standbyConditions: string;
  grandTotal: number;
}

const QuotationSchema = new Schema<IQuotation>({
  quotationDate: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  status: { type: String, default: 'Draft' },
  clientName: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  billingAddress: String,
  clientCategory: String,
  equipmentType: String,
  quantity: Number,
  rentalStart: Date,
  rentalEnd: Date,
  usageType: String,
  projectLocation: String,
  rateType: String,
  rate: Number,
  operatorCharges: Number,
  fuelCharges: Number,
  mobilizationFee: Number,
  standbyCharges: Number,
  securityDeposit: Number,
  discounts: Number,
  taxes: Number,
  addOns: String,
  paymentTerms: String,
  paymentMethods: String,
  penalty: String,
  withOperator: String,
  fuelProvidedBy: String,
  insurance: String,
  maintenance: String,
  availability: String,
  breakdownPolicy: String,
  standbyConditions: String,
  grandTotal: Number,
}, { timestamps: true });

export default mongoose.model<IQuotation>('Quotation', QuotationSchema); 