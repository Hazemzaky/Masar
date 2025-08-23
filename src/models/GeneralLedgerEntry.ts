import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneralLedgerEntry extends Document {
  transactionId: string;
  transactionDate: Date;
  moduleSource: string;
  referenceType: string;
  referenceId: mongoose.Types.ObjectId;
  accountCode: string;
  account: mongoose.Types.ObjectId;
  debit: number;
  credit: number;
  description: string;
  narration?: string;
  currency: string;
  exchangeRate?: number;
  period: string;
  fiscalYear: number;
  isReversed: boolean;
  reversedBy?: mongoose.Types.ObjectId;
  reversalDate?: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const GeneralLedgerEntrySchema = new Schema<IGeneralLedgerEntry>({
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  moduleSource: {
    type: String,
    required: true,
    enum: [
      'hr', 'assets', 'operations', 'maintenance', 'procurement', 
      'sales', 'admin', 'hse', 'finance', 'general', 'adjustment'
    ],
    index: true
  },
  referenceType: {
    type: String,
    required: true,
    enum: [
      'purchase_request', 'purchase_order', 'invoice', 'expense', 
      'payroll', 'depreciation', 'amortization', 'revenue', 
      'adjustment', 'reversal', 'opening_balance'
    ],
    index: true
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  accountCode: {
    type: String,
    required: true,
    index: true
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    required: true,
    index: true
  },
  debit: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  narration: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    default: 'KWD',
    uppercase: true
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
    index: true
  },
  fiscalYear: {
    type: Number,
    required: true,
    index: true
  },
  isReversed: {
    type: Boolean,
    default: false,
    index: true
  },
  reversedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GeneralLedgerEntry'
  },
  reversalDate: {
    type: Date
  },
  approvalStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected'],
    index: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  versionKey: false
});

// Virtual for net amount (debit - credit)
GeneralLedgerEntrySchema.virtual('netAmount').get(function() {
  return this.debit - this.credit;
});

// Virtual for absolute amount
GeneralLedgerEntrySchema.virtual('absoluteAmount').get(function() {
  return Math.abs(this.debit - this.credit);
});

// Virtual for entry type
GeneralLedgerEntrySchema.virtual('entryType').get(function() {
  if (this.debit > 0 && this.credit === 0) return 'debit';
  if (this.credit > 0 && this.debit === 0) return 'credit';
  return 'mixed';
});

// Indexes for efficient querying
GeneralLedgerEntrySchema.index({ transactionDate: 1, accountCode: 1 });
GeneralLedgerEntrySchema.index({ moduleSource: 1, referenceType: 1, referenceId: 1 });
GeneralLedgerEntrySchema.index({ period: 1, fiscalYear: 1 });
GeneralLedgerEntrySchema.index({ approvalStatus: 1, transactionDate: 1 });
GeneralLedgerEntrySchema.index({ account: 1, transactionDate: 1 });

// Pre-save middleware for validation
GeneralLedgerEntrySchema.pre('save', function(next) {
  // Ensure at least one of debit or credit is greater than 0
  if (this.debit === 0 && this.credit === 0) {
    return next(new Error('At least one of debit or credit must be greater than 0'));
  }
  
  // Ensure both debit and credit are not greater than 0 (double-entry principle)
  if (this.debit > 0 && this.credit > 0) {
    return next(new Error('Double-entry principle: debit and credit cannot both be greater than 0'));
  }
  
  // Set fiscal year based on transaction date
  if (this.transactionDate) {
    this.fiscalYear = this.transactionDate.getFullYear();
  }
  
  next();
});

// Static method to validate double-entry balance
GeneralLedgerEntrySchema.statics.validateDoubleEntry = async function(transactionId: string) {
  const entries = await this.find({ transactionId });
  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  
  return {
    isValid: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for rounding differences
    totalDebits,
    totalCredits,
    difference: totalDebits - totalCredits
  };
};

export default mongoose.model<IGeneralLedgerEntry>('GeneralLedgerEntry', GeneralLedgerEntrySchema); 