import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotationData {
  lines: Array<{
    description: string;
    unitPrice: number;
    worktime: string;
    quantity: number;
    total: number;
  }>;
  paymentTerms: string;
  paymentMethod: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  quotationFile?: string; // File path/URL for uploaded quotation
  quotationFileName?: string; // Original filename
}

export interface IContractData {
  startDate: Date;
  endDate: Date;
  paymentTerms: string;
  status: 'active' | 'inactive' | 'expired' | 'terminated' | 'pending';
  priceList: Array<{
    description: string;
    rentType: 'monthly' | 'call_out';
    workHours: '8Hrs' | '12Hrs' | '24Hrs';
    driversOperators: 1 | 2;
    unitPrice: number;
    overtime: number;
  }>;
  contractFile?: string; // File path/URL for uploaded contract
  contractFileName?: string; // Original filename
}

export interface IClient extends Document {
  name: string;
  type: 'quotation' | 'contract';
  rfqDate?: Date;
  quotations: mongoose.Types.ObjectId[];
  contracts: mongoose.Types.ObjectId[];
  quotationData?: IQuotationData;
  contractData?: IContractData;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationLineSchema = new Schema({
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  worktime: { type: String, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
});

const QuotationDataSchema = new Schema({
  lines: [QuotationLineSchema],
  paymentTerms: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  quotationFile: { type: String }, // File path/URL for uploaded quotation
  quotationFileName: { type: String }, // Original filename
});

const PriceListItemSchema = new Schema({
  description: { type: String, required: true },
  rentType: { type: String, enum: ['monthly', 'call_out'], required: true },
  workHours: { type: String, enum: ['8Hrs', '12Hrs', '24Hrs'], required: true },
  driversOperators: { type: Number, enum: [1, 2], required: true },
  unitPrice: { type: Number, required: true },
  overtime: { type: Number, required: true },
});

const ContractDataSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  paymentTerms: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'expired', 'terminated', 'pending'], default: 'pending' },
  priceList: [PriceListItemSchema],
  contractFile: { type: String }, // File path/URL for uploaded contract
  contractFileName: { type: String }, // Original filename
});

const ClientSchema = new Schema<IClient>({
  name: { type: String, required: true },
  type: { type: String, enum: ['quotation', 'contract'], required: true },
  rfqDate: { type: Date },
  quotations: [{ type: Schema.Types.ObjectId, ref: 'Quotation' }],
  contracts: [{ type: Schema.Types.ObjectId, ref: 'Contract' }],
  quotationData: QuotationDataSchema,
  contractData: ContractDataSchema,
}, { timestamps: true });

export default mongoose.model<IClient>('Client', ClientSchema); 