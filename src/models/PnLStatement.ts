import mongoose, { Document, Schema } from 'mongoose';

// IFRS P&L Statement Interface
export interface IPnLStatement extends Document {
  // Statement identification
  statementId: string;
  reportingPeriod: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  startDate: Date;
  endDate: Date;
  reportingDate: Date;
  
  // Revenue section
  revenue: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
    }>;
  };
  
  // Cost of Sales section
  costOfSales: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
      isAmortized: boolean;
      amortizationPeriod?: number;
    }>;
  };
  
  // Gross Profit (calculated)
  grossProfit: number;
  grossMargin: number; // percentage
  
  // Operating Expenses section
  operatingExpenses: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
      isAmortized: boolean;
      amortizationPeriod?: number;
    }>;
  };
  
  // Operating Profit (calculated)
  operatingProfit: number;
  operatingMargin: number; // percentage
  
  // Finance section
  financeCosts: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
    }>;
  };
  
  // Other income/expenses
  otherIncomeExpense: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
      type: 'income' | 'expense';
    }>;
  };
  
  // Profit Before Tax (calculated)
  profitBeforeTax: number;
  
  // Tax section
  incomeTaxExpense: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
    }>;
  };
  
  // Profit for the Period (calculated)
  profitForPeriod: number;
  netMargin: number; // percentage
  
  // Metadata
  currency: string;
  exchangeRate?: number;
  preparedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: 'draft' | 'reviewed' | 'approved' | 'final';
  
  // Audit trail
  version: number;
  previousVersion?: mongoose.Types.ObjectId;
  changeLog: Array<{
    date: Date;
    user: mongoose.Types.ObjectId;
    changes: string;
    reason?: string;
  }>;
  
  // IFRS compliance flags
  ifrsCompliant: boolean;
  ifrsVersion: string;
  notes: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PnLStatementSchema = new Schema<IPnLStatement>({
  statementId: { type: String, required: true, unique: true },
  reportingPeriod: { 
    type: String, 
    required: true, 
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'] 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reportingDate: { type: Date, required: true, default: Date.now },
  
  // Revenue section
  revenue: {
    total: { type: Number, required: true, min: 0 },
    breakdown: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      description: String
    }]
  },
  
  // Cost of Sales section
  costOfSales: {
    total: { type: Number, required: true, min: 0 },
    breakdown: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      description: String,
      isAmortized: { type: Boolean, default: false },
      amortizationPeriod: Number
    }]
  },
  
  // Gross Profit (calculated)
  grossProfit: { type: Number, required: true },
  grossMargin: { type: Number, required: true, min: 0, max: 100 },
  
  // Operating Expenses section
  operatingExpenses: {
    total: { type: Number, required: true, min: 0 },
    breakdown: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      description: String,
      isAmortized: { type: Boolean, default: false },
      amortizationPeriod: Number
    }]
  },
  
  // Operating Profit (calculated)
  operatingProfit: { type: Number, required: true },
  operatingMargin: { type: Number, required: true },
  
  // Finance section
  financeCosts: {
    total: { type: Number, required: true, min: 0, default: 0 },
    breakdown: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      description: String
    }]
  },
  
  // Other income/expenses
  otherIncomeExpense: {
    total: { type: Number, required: true, default: 0 },
    breakdown: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true },
      description: String,
      type: { type: String, required: true, enum: ['income', 'expense'] }
    }]
  },
  
  // Profit Before Tax (calculated)
  profitBeforeTax: { type: Number, required: true },
  
  // Tax section
  incomeTaxExpense: {
    total: { type: Number, required: true, min: 0, default: 0 },
    breakdown: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      description: String
    }]
  },
  
  // Profit for the Period (calculated)
  profitForPeriod: { type: Number, required: true },
  netMargin: { type: Number, required: true },
  
  // Metadata
  currency: { type: String, required: true, default: 'KWD' },
  exchangeRate: Number,
  preparedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    required: true, 
    enum: ['draft', 'reviewed', 'approved', 'final'],
    default: 'draft'
  },
  
  // Audit trail
  version: { type: Number, required: true, default: 1 },
  previousVersion: { type: Schema.Types.ObjectId, ref: 'PnLStatement' },
  changeLog: [{
    date: { type: Date, required: true, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changes: { type: String, required: true },
    reason: String
  }],
  
  // IFRS compliance flags
  ifrsCompliant: { type: Boolean, required: true, default: true },
  ifrsVersion: { type: String, required: true, default: 'IFRS 2024' },
  notes: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total assets (if needed for balance sheet integration)
PnLStatementSchema.virtual('totalAssets').get(function() {
  // This would be calculated from balance sheet data
  return 0;
});

// Pre-save middleware to calculate derived fields
PnLStatementSchema.pre('save', function(next) {
  // Calculate gross profit
  this.grossProfit = this.revenue.total - this.costOfSales.total;
  
  // Calculate gross margin
  this.grossMargin = this.revenue.total > 0 ? (this.grossProfit / this.revenue.total) * 100 : 0;
  
  // Calculate operating profit
  this.operatingProfit = this.grossProfit - this.operatingExpenses.total;
  
  // Calculate operating margin
  this.operatingMargin = this.revenue.total > 0 ? (this.operatingProfit / this.revenue.total) * 100 : 0;
  
  // Calculate profit before tax
  this.profitBeforeTax = this.operatingProfit - this.financeCosts.total + this.otherIncomeExpense.total;
  
  // Calculate profit for the period
  this.profitForPeriod = this.profitBeforeTax - this.incomeTaxExpense.total;
  
  // Calculate net margin
  this.netMargin = this.revenue.total > 0 ? (this.profitForPeriod / this.revenue.total) * 100 : 0;
  
  next();
});

// Index for efficient querying
PnLStatementSchema.index({ reportingPeriod: 1, startDate: 1, endDate: 1 });
PnLStatementSchema.index({ status: 1, reportingDate: 1 });
PnLStatementSchema.index({ preparedBy: 1, reportingDate: 1 });

export default mongoose.model<IPnLStatement>('PnLStatement', PnLStatementSchema); 