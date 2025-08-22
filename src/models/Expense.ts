import mongoose, { Document, Schema } from 'mongoose';

// IFRS-compliant expense categories
export const EXPENSE_CATEGORIES = {
  // Cost of Sales (Direct Costs)
  DIRECT_COSTS: 'direct_costs',
  LOGISTICS: 'logistics',
  DEPRECIATION: 'depreciation',
  AMORTIZATION: 'amortization',
  
  // Operating Expenses
  DISTRIBUTION: 'distribution',
  ADMIN: 'admin',
  STAFF: 'staff',
  MARKETING: 'marketing',
  UTILITIES: 'utilities',
  MAINTENANCE: 'maintenance',
  INSURANCE: 'insurance',
  LEGAL: 'legal',
  CONSULTING: 'consulting',
  
  // Finance Costs
  INTEREST: 'interest',
  BANK_CHARGES: 'bank_charges',
  LOAN_FEES: 'loan_fees',
  
  // Other Income/Expenses
  OTHER_INCOME: 'other_income',
  OTHER_EXPENSE: 'other_expense',
  EXCHANGE_GAIN: 'exchange_gain',
  EXCHANGE_LOSS: 'exchange_loss'
} as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES];

// IFRS-compliant expense interface
export interface IExpense extends Document {
  // Basic information
  description: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  amountInBaseCurrency: number;
  
  // Categorization
  category: ExpenseCategory;
  subcategory?: string;
  department?: string;
  costCenter?: string;
  project?: string;
  
  // Dates
  date: Date;
  dueDate?: Date;
  paymentDate?: Date;
  
  // Amortization (if applicable)
  isAmortized: boolean;
  amortizationPeriod?: number; // in months
  amortizationStartDate?: Date;
  amortizationEndDate?: Date;
  monthlyAmortizationAmount?: number;
  
  // Vendor/Supplier information
  vendor?: mongoose.Types.ObjectId;
  vendorName?: string;
  invoiceNumber?: string;
  purchaseOrder?: string;
  
  // Payment information
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentReference?: string;
  
  // Approval workflow
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
  submittedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  rejectionReason?: string;
  
  // Attachments
  receipts?: string[];
  supportingDocuments?: string[];
  
  // IFRS compliance
  ifrsCategory: string;
  ifrsTreatment: 'expense' | 'capitalize' | 'amortize';
  ifrsNotes?: string;
  
  // Audit trail
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  // Basic information
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'KWD' },
  exchangeRate: { type: Number, min: 0 },
  amountInBaseCurrency: { type: Number, required: true, min: 0 },
  
  // Categorization
  category: { 
    type: String, 
    required: true, 
    enum: Object.values(EXPENSE_CATEGORIES)
  },
  subcategory: { type: String, trim: true },
  department: { type: String, trim: true },
  costCenter: { type: String, trim: true },
  project: { type: String, trim: true },
  
  // Dates
  date: { type: Date, required: true },
  dueDate: { type: Date },
  paymentDate: { type: Date },
  
  // Amortization
  isAmortized: { type: Boolean, default: false },
  amortizationPeriod: { type: Number, min: 1, max: 120 }, // 1-120 months
  amortizationStartDate: { type: Date },
  amortizationEndDate: { type: Date },
  monthlyAmortizationAmount: { type: Number, min: 0 },
  
  // Vendor/Supplier information
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName: { type: String, trim: true },
  invoiceNumber: { type: String, trim: true },
  purchaseOrder: { type: String, trim: true },
  
  // Payment information
  paymentMethod: { type: String, trim: true },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paymentReference: { type: String, trim: true },
  
  // Approval workflow
  status: { 
    type: String, 
    required: true, 
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'cancelled'],
    default: 'draft'
  },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvalDate: { type: Date },
  rejectionReason: { type: String, trim: true },
  
  // Attachments
  receipts: [{ type: String }],
  supportingDocuments: [{ type: String }],
  
  // IFRS compliance
  ifrsCategory: { type: String, required: true, default: 'operating_expense' },
  ifrsTreatment: { 
    type: String, 
    required: true, 
    enum: ['expense', 'capitalize', 'amortize'],
    default: 'expense'
  },
  ifrsNotes: { type: String, trim: true },
  
  // Audit trail
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: Number, required: true, default: 1 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining amortization amount
ExpenseSchema.virtual('remainingAmortizationAmount').get(function() {
  if (!this.isAmortized || !this.monthlyAmortizationAmount || !this.amortizationStartDate) {
    return 0;
  }
  
  const now = new Date();
  const startDate = new Date(this.amortizationStartDate);
  const endDate = this.amortizationEndDate ? new Date(this.amortizationEndDate) : 
    new Date(startDate.getTime() + (this.amortizationPeriod! * 30 * 24 * 60 * 60 * 1000));
  
  if (now <= startDate) {
    return this.amount;
  }
  
  if (now >= endDate) {
    return 0;
  }
  
  const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
  const totalAmortized = this.monthlyAmortizationAmount * monthsElapsed;
  
  return Math.max(0, this.amount - totalAmortized);
});

// Virtual for current period amortization
ExpenseSchema.virtual('currentPeriodAmortization').get(function() {
  if (!this.isAmortized || !this.monthlyAmortizationAmount) {
    return 0;
  }
  
  return this.monthlyAmortizationAmount;
});

// Pre-save middleware to calculate derived fields
ExpenseSchema.pre('save', function(next) {
  // Calculate amount in base currency if exchange rate is provided
  if (this.exchangeRate && this.currency !== 'KWD') {
    this.amountInBaseCurrency = this.amount * this.exchangeRate;
  } else {
    this.amountInBaseCurrency = this.amount;
  }
  
  // Calculate monthly amortization amount if amortization is enabled
  if (this.isAmortized && this.amortizationPeriod && this.amount) {
    this.monthlyAmortizationAmount = this.amount / this.amortizationPeriod;
  }
  
  // Set amortization end date if not provided
  if (this.isAmortized && this.amortizationStartDate && this.amortizationPeriod && !this.amortizationEndDate) {
    this.amortizationEndDate = new Date(
      this.amortizationStartDate.getTime() + (this.amortizationPeriod * 30 * 24 * 60 * 60 * 1000)
    );
  }
  
  next();
});

// Indexes for efficient querying
ExpenseSchema.index({ category: 1, date: 1 });
ExpenseSchema.index({ department: 1, date: 1 });
ExpenseSchema.index({ isAmortized: 1, amortizationStartDate: 1 });
ExpenseSchema.index({ status: 1, date: 1 });
ExpenseSchema.index({ vendor: 1, date: 1 });
ExpenseSchema.index({ paymentStatus: 1, dueDate: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema); 