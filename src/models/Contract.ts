import mongoose, { Document, Schema } from 'mongoose';

export interface IContract extends Document {
  client: mongoose.Types.ObjectId;
  contractName: string;
  startDate: Date;
  endDate: Date;
  lineItems: Array<{
    description: string;
    unitPrice: number;
    worktime: string;
    quantity: number;
    total: number;
  }>;
  paymentTerms: string;
  paymentMethod: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  contractName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  lineItems: [
    {
      description: { type: String, required: true },
      unitPrice: { type: Number, required: true },
      worktime: { type: String, required: true },
      quantity: { type: Number, required: true },
      total: { type: Number, required: true },
    }
  ],
  paymentTerms: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IContract>('Contract', ContractSchema); 