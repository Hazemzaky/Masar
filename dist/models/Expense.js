"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPENSE_CATEGORIES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// IFRS-compliant expense categories
exports.EXPENSE_CATEGORIES = {
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
};
const ExpenseSchema = new mongoose_1.Schema({
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
        enum: Object.values(exports.EXPENSE_CATEGORIES)
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
    vendor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Vendor' },
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
    submittedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true, default: 1 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual for remaining amortization amount
ExpenseSchema.virtual('remainingAmortizationAmount').get(function () {
    if (!this.isAmortized || !this.monthlyAmortizationAmount || !this.amortizationStartDate) {
        return 0;
    }
    const now = new Date();
    const startDate = new Date(this.amortizationStartDate);
    const endDate = this.amortizationEndDate ? new Date(this.amortizationEndDate) :
        new Date(startDate.getTime() + (this.amortizationPeriod * 30 * 24 * 60 * 60 * 1000));
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
ExpenseSchema.virtual('currentPeriodAmortization').get(function () {
    if (!this.isAmortized || !this.monthlyAmortizationAmount) {
        return 0;
    }
    return this.monthlyAmortizationAmount;
});
// Pre-save middleware to calculate derived fields
ExpenseSchema.pre('save', function (next) {
    // Calculate amount in base currency if exchange rate is provided
    if (this.exchangeRate && this.currency !== 'KWD') {
        this.amountInBaseCurrency = this.amount * this.exchangeRate;
    }
    else {
        this.amountInBaseCurrency = this.amount;
    }
    // Calculate monthly amortization amount if amortization is enabled
    if (this.isAmortized && this.amortizationPeriod && this.amount) {
        this.monthlyAmortizationAmount = this.amount / this.amortizationPeriod;
    }
    // Set amortization end date if not provided
    if (this.isAmortized && this.amortizationStartDate && this.amortizationPeriod && !this.amortizationEndDate) {
        this.amortizationEndDate = new Date(this.amortizationStartDate.getTime() + (this.amortizationPeriod * 30 * 24 * 60 * 60 * 1000));
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
exports.default = mongoose_1.default.model('Expense', ExpenseSchema);
