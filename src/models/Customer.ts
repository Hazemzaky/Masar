import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  website?: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Business Information
  businessType: 'individual' | 'company' | 'government' | 'non_profit';
  taxId?: string;
  registrationNumber?: string;
  
  // Financial Information
  creditLimit: number;
  paymentTerms: number; // days
  discountRate: number; // percentage
  currency: string;
  
  // Contact Information
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    position?: string;
  };
  
  additionalContacts?: Array<{
    name: string;
    email: string;
    phone: string;
    position?: string;
    isPrimary: boolean;
  }>;
  
  // Status and Notes
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  notes?: string;
  tags?: string[];
  
  // Payment History
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  averagePaymentTime: number; // days
  lastPaymentDate?: Date;
  lastInvoiceDate?: Date;
  
  // Audit Trail
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  
  // Address Information
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'Kuwait' }
  },
  
  // Business Information
  businessType: {
    type: String,
    required: true,
    enum: ['individual', 'company', 'government', 'non_profit'],
    default: 'company'
  },
  taxId: { type: String, trim: true },
  registrationNumber: { type: String, trim: true },
  
  // Financial Information
  creditLimit: { type: Number, required: true, min: 0, default: 0 },
  paymentTerms: { type: Number, required: true, min: 0, default: 30 },
  discountRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
  currency: { type: String, required: true, default: 'KWD' },
  
  // Contact Information
  primaryContact: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, trim: true }
  },
  
  additionalContacts: [{
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Status and Notes
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active'
  },
  notes: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  
  // Payment History
  totalInvoiced: { type: Number, required: true, min: 0, default: 0 },
  totalPaid: { type: Number, required: true, min: 0, default: 0 },
  outstandingBalance: { type: Number, required: true, min: 0, default: 0 },
  averagePaymentTime: { type: Number, required: true, min: 0, default: 0 },
  lastPaymentDate: { type: Date },
  lastInvoiceDate: { type: Date },
  
  // Audit Trail
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ businessType: 1 });
CustomerSchema.index({ 'address.city': 1 });
CustomerSchema.index({ tags: 1 });
CustomerSchema.index({ createdAt: -1 });

// Virtual for full address
CustomerSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for payment status
CustomerSchema.virtual('paymentStatus').get(function() {
  if (this.outstandingBalance === 0) return 'current';
  if (this.outstandingBalance <= this.creditLimit * 0.5) return 'good';
  if (this.outstandingBalance <= this.creditLimit) return 'warning';
  return 'over_limit';
});

// Pre-save middleware to calculate derived fields
CustomerSchema.pre('save', async function(next) {
  if (this.isModified('totalInvoiced') || this.isModified('totalPaid')) {
    this.outstandingBalance = this.totalInvoiced - this.totalPaid;
  }
  next();
});

// Static method to update customer payment statistics
CustomerSchema.statics.updatePaymentStats = async function(customerId: string) {
  const Invoice = mongoose.model('Invoice');
  const Payment = mongoose.model('Payment');
  
  const invoices = await Invoice.find({ customer: customerId });
  const payments = await Payment.find({ 
    invoice: { $in: invoices.map(inv => inv._id) },
    status: { $ne: 'rejected' }
  });
  
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingBalance = totalInvoiced - totalPaid;
  
  // Calculate average payment time
  let totalPaymentTime = 0;
  let paymentCount = 0;
  
  for (const payment of payments) {
    const invoice = invoices.find(inv => inv._id.equals(payment.invoice));
    if (invoice) {
      const paymentTime = (payment.paymentDate.getTime() - invoice.invoiceDate.getTime()) / (1000 * 60 * 60 * 24);
      totalPaymentTime += paymentTime;
      paymentCount++;
    }
  }
  
  const averagePaymentTime = paymentCount > 0 ? totalPaymentTime / paymentCount : 0;
  
  await this.findByIdAndUpdate(customerId, {
    totalInvoiced,
    totalPaid,
    outstandingBalance,
    averagePaymentTime,
    lastPaymentDate: payments.length > 0 ? Math.max(...payments.map(p => p.paymentDate.getTime())) : undefined,
    lastInvoiceDate: invoices.length > 0 ? Math.max(...invoices.map(i => i.invoiceDate.getTime())) : undefined
  });
};

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
