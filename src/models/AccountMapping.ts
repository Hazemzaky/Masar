import mongoose, { Document, Schema } from 'mongoose';

// IFRS P&L Categories as per IAS 1
export const PNL_CATEGORIES = {
  // Revenue
  REVENUE: 'revenue',
  
  // Cost of Sales (Direct costs)
  COST_OF_SALES: 'cost_of_sales',
  
  // Operating Expenses
  OPERATING_EXPENSES: 'operating_expenses',
  
  // Finance Costs
  FINANCE_COSTS: 'finance_costs',
  
  // Other Income/Expenses
  OTHER_INCOME: 'other_income',
  OTHER_EXPENSES: 'other_expenses',
  
  // Tax
  INCOME_TAX: 'income_tax'
} as const;

export type PnLCategory = typeof PNL_CATEGORIES[keyof typeof PNL_CATEGORIES];

// Operating Expense Subcategories
export const OPERATING_EXPENSE_SUBCATEGORIES = {
  STAFF_COSTS: 'staff_costs',
  ADMIN_EXPENSES: 'admin_expenses',
  MAINTENANCE: 'maintenance',
  HSE_COSTS: 'hse_costs',
  DEPRECIATION: 'depreciation',
  AMORTIZATION: 'amortization',
  UTILITIES: 'utilities',
  INSURANCE: 'insurance',
  LEGAL: 'legal',
  CONSULTING: 'consulting',
  MARKETING: 'marketing',
  OTHER_OPERATING: 'other_operating'
} as const;

export type OperatingExpenseSubcategory = typeof OPERATING_EXPENSE_SUBCATEGORIES[keyof typeof OPERATING_EXPENSE_SUBCATEGORIES];

// Source Modules
export const SOURCE_MODULES = {
  HR: 'hr',
  ASSETS: 'assets',
  OPERATIONS: 'operations',
  MAINTENANCE: 'maintenance',
  PROCUREMENT: 'procurement',
  SALES: 'sales',
  ADMIN: 'admin',
  HSE: 'hse',
  FINANCE: 'finance'
} as const;

export type SourceModule = typeof SOURCE_MODULES[keyof typeof SOURCE_MODULES];

// Account Mapping Interface
export interface IAccountMapping extends Document {
  // Module and account identification
  module: SourceModule;
  accountCode: string;
  accountName: string;
  accountDescription?: string;
  
  // IFRS categorization
  pnlCategory: PnLCategory;
  operatingExpenseSubcategory?: OperatingExpenseSubcategory;
  
  // Cost allocation rules
  isAmortizable: boolean;
  amortizationPeriod?: number; // in months
  allocationMethod: 'direct' | 'proportional' | 'time_based' | 'usage_based';
  
  // Business rules
  isActive: boolean;
  requiresApproval: boolean;
  approvalThreshold?: number; // amount threshold for approval
  
  // Audit trail
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const AccountMappingSchema = new Schema<IAccountMapping>({
  // Module and account identification
  module: {
    type: String,
    required: true,
    enum: Object.values(SOURCE_MODULES)
  },
  accountCode: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountDescription: {
    type: String,
    trim: true
  },
  
  // IFRS categorization
  pnlCategory: {
    type: String,
    required: true,
    enum: Object.values(PNL_CATEGORIES)
  },
  operatingExpenseSubcategory: {
    type: String,
    enum: Object.values(OPERATING_EXPENSE_SUBCATEGORIES)
  },
  
  // Cost allocation rules
  isAmortizable: {
    type: Boolean,
    default: false
  },
  amortizationPeriod: {
    type: Number,
    min: 1,
    max: 120 // 1-120 months
  },
  allocationMethod: {
    type: String,
    required: true,
    enum: ['direct', 'proportional', 'time_based', 'usage_based'],
    default: 'direct'
  },
  
  // Business rules
  isActive: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalThreshold: {
    type: Number,
    min: 0
  },
  
  // Audit trail
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
    required: true,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full account name
AccountMappingSchema.virtual('fullAccountName').get(function() {
  return `${this.module.toUpperCase()}: ${this.accountName}`;
});

// Virtual for IFRS display name
AccountMappingSchema.virtual('ifrsDisplayName').get(function() {
  if (this.pnlCategory === 'operating_expenses' && this.operatingExpenseSubcategory) {
    return `${this.operatingExpenseSubcategory.replace('_', ' ').toUpperCase()}`;
  }
  return this.pnlCategory.replace('_', ' ').toUpperCase();
});

// Indexes for efficient querying
AccountMappingSchema.index({ module: 1, accountCode: 1 });
AccountMappingSchema.index({ pnlCategory: 1, operatingExpenseSubcategory: 1 });
AccountMappingSchema.index({ isActive: 1 });
AccountMappingSchema.index({ isAmortizable: 1 });

export default mongoose.model<IAccountMapping>('AccountMapping', AccountMappingSchema); 