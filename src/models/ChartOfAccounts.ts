import mongoose, { Document, Schema } from 'mongoose';

export interface IChartOfAccounts extends Document {
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  ifrsCategory: string;
  ifrsSubcategory?: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  parentAccount?: mongoose.Types.ObjectId;
  level: number;
  sortOrder: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChartOfAccountsSchema = new Schema<IChartOfAccounts>({
  accountCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  ifrsCategory: {
    type: String,
    required: true,
    enum: [
      // Assets
      'current_assets', 'non_current_assets', 'property_plant_equipment', 'intangible_assets',
      // Liabilities
      'current_liabilities', 'non_current_liabilities', 'provisions', 'deferred_tax',
      // Equity
      'share_capital', 'retained_earnings', 'other_equity',
      // Revenue
      'revenue', 'other_income',
      // Expenses
      'cost_of_sales', 'operating_expenses', 'finance_costs', 'income_tax_expense'
    ],
    index: true
  },
  ifrsSubcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  parentAccount: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccounts'
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  sortOrder: {
    type: Number,
    default: 0
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

// Virtual for full account name
ChartOfAccountsSchema.virtual('fullAccountName').get(function() {
  if (this.subcategory) {
    return `${this.category} > ${this.subcategory} > ${this.accountName}`;
  }
  return `${this.category} > ${this.accountName}`;
});

// Virtual for IFRS display name
ChartOfAccountsSchema.virtual('ifrsDisplayName').get(function() {
  return `${this.ifrsCategory}${this.ifrsSubcategory ? ` > ${this.ifrsSubcategory}` : ''} > ${this.accountName}`;
});

// Indexes for efficient querying
ChartOfAccountsSchema.index({ accountCode: 1 });
ChartOfAccountsSchema.index({ accountType: 1, category: 1 });
ChartOfAccountsSchema.index({ ifrsCategory: 1, ifrsSubcategory: 1 });
ChartOfAccountsSchema.index({ isActive: 1, sortOrder: 1 });
ChartOfAccountsSchema.index({ parentAccount: 1, level: 1 });

// Pre-save middleware to ensure account code format
ChartOfAccountsSchema.pre('save', function(next) {
  if (this.isModified('accountCode')) {
    this.accountCode = this.accountCode.toUpperCase().replace(/\s+/g, '');
  }
  next();
});

export default mongoose.model<IChartOfAccounts>('ChartOfAccounts', ChartOfAccountsSchema); 