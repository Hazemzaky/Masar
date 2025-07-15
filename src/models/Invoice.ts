import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  fileUrl?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadDate: Date;
  expense?: mongoose.Types.ObjectId;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  recipient: {
    name: string;
    email: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  history: Array<{
    status: string;
    date: Date;
  }>;
  serial?: string; // Document serial number
}

const InvoiceSchema: Schema = new Schema({
  fileUrl: { type: String, required: false },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate: { type: Date, default: Date.now },
  expense: { type: Schema.Types.ObjectId, ref: 'Expense' },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  dueDate: { type: Date, required: true },
  recipient: {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  lineItems: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  history: [
    {
      status: { type: String, required: true },
      date: { type: Date, required: true },
    }
  ],
  serial: { type: String, unique: true, sparse: true }, // Document serial number
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema); 