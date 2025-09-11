import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  invoice: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'credit_card' | 'online' | 'other';
  paymentReference: string;
  paymentDate: Date;
  receivedDate: Date;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    transactionId: string;
    routingNumber?: string;
  };
  checkDetails?: {
    checkNumber: string;
    bankName: string;
    accountHolder: string;
  };
  creditCardDetails?: {
    lastFourDigits: string;
    cardType: string;
    transactionId: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'reconciled';
  notes?: string;
  attachments?: string[]; // Receipts, bank statements, etc.
  reconciledBy?: mongoose.Types.ObjectId;
  reconciledAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'KWD' },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'check', 'cash', 'credit_card', 'online', 'other'],
    default: 'bank_transfer'
  },
  paymentReference: { type: String, required: true, trim: true },
  paymentDate: { type: Date, required: true },
  receivedDate: { type: Date, required: true },
  bankDetails: {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    routingNumber: { type: String, trim: true }
  },
  checkDetails: {
    checkNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountHolder: { type: String, trim: true }
  },
  creditCardDetails: {
    lastFourDigits: { type: String, trim: true },
    cardType: { type: String, trim: true },
    transactionId: { type: String, trim: true }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'rejected', 'reconciled'],
    default: 'pending'
  },
  notes: { type: String, trim: true },
  attachments: [{ type: String }],
  reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reconciledAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
PaymentSchema.index({ invoice: 1, paymentDate: 1 });
PaymentSchema.index({ paymentMethod: 1, status: 1 });
PaymentSchema.index({ paymentReference: 1 });
PaymentSchema.index({ status: 1, receivedDate: 1 });

// Virtual for payment age
PaymentSchema.virtual('paymentAge').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.receivedDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.receivedDate = new Date();
  }
  next();
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
