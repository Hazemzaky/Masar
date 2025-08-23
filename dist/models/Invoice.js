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
exports.REVENUE_CATEGORIES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// IFRS-compliant revenue categories
exports.REVENUE_CATEGORIES = {
    // Core business revenue
    TRANSPORT_SERVICES: 'transport_services',
    LOGISTICS_SERVICES: 'logistics_services',
    STORAGE_SERVICES: 'storage_services',
    CONSULTING_SERVICES: 'consulting_services',
    // Other income
    EQUIPMENT_RENTAL: 'equipment_rental',
    TRAINING_SERVICES: 'training_services',
    MAINTENANCE_SERVICES: 'maintenance_services',
    // Financial income
    INTEREST_INCOME: 'interest_income',
    DIVIDEND_INCOME: 'dividend_income',
    EXCHANGE_GAIN: 'exchange_gain',
    // Other revenue
    SUBSIDIES: 'subsidies',
    GRANTS: 'grants',
    OTHER_INCOME: 'other_income'
};
const InvoiceSchema = new mongoose_1.Schema({
    // Basic information
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'KWD' },
    exchangeRate: { type: Number, min: 0 },
    amountInBaseCurrency: { type: Number, required: true, min: 0 },
    // Revenue categorization
    category: {
        type: String,
        required: true,
        enum: Object.values(exports.REVENUE_CATEGORIES)
    },
    subcategory: { type: String, trim: true },
    department: { type: String, trim: true },
    costCenter: { type: String, trim: true },
    project: { type: String, trim: true },
    // IFRS revenue recognition
    ifrsCategory: { type: String, required: true, default: 'operating_revenue' },
    ifrsTreatment: {
        type: String,
        required: true,
        enum: ['revenue', 'other_income', 'financial_income'],
        default: 'revenue'
    },
    revenueRecognitionMethod: {
        type: String,
        required: true,
        enum: ['point_in_time', 'over_time'],
        default: 'point_in_time'
    },
    performanceObligations: [{
            description: { type: String, required: true },
            completionPercentage: { type: Number, required: true, min: 0, max: 100 },
            amount: { type: Number, required: true, min: 0 }
        }],
    // Dates
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paymentDate: { type: Date },
    revenueRecognitionDate: { type: Date },
    // Customer information
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, trim: true },
    customerReference: { type: String, trim: true },
    // Contract information
    contractNumber: { type: String, trim: true },
    contractType: { type: String, trim: true },
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    // Payment information
    paymentMethod: { type: String, trim: true },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'overdue', 'cancelled', 'disputed'],
        default: 'pending'
    },
    paymentReference: { type: String, trim: true },
    partialPayments: [{
            date: { type: Date, required: true },
            amount: { type: Number, required: true, min: 0 },
            reference: { type: String, required: true }
        }],
    // Tax information
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, default: 0 },
    taxType: { type: String, required: true, default: 'VAT' },
    netAmount: { type: Number, required: true, min: 0 },
    // Approval workflow
    status: {
        type: String,
        required: true,
        enum: ['draft', 'pending_approval', 'approved', 'sent', 'cancelled'],
        default: 'draft'
    },
    submittedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date },
    rejectionReason: { type: String, trim: true },
    // Attachments
    supportingDocuments: [{ type: String }],
    // IFRS compliance
    ifrsNotes: { type: String, trim: true },
    ifrsDisclosureRequired: { type: Boolean, default: false },
    // Audit trail
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true, default: 1 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual for total amount including tax
InvoiceSchema.virtual('totalAmount').get(function () {
    return this.netAmount + this.taxAmount;
});
// Virtual for days overdue
InvoiceSchema.virtual('daysOverdue').get(function () {
    if (this.paymentStatus === 'paid' || this.paymentStatus === 'cancelled') {
        return 0;
    }
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
});
// Virtual for revenue recognition status
InvoiceSchema.virtual('revenueRecognitionStatus').get(function () {
    if (this.revenueRecognitionMethod === 'point_in_time') {
        return this.paymentStatus === 'paid' ? 'recognized' : 'pending';
    }
    else {
        // For over-time recognition, check performance obligations
        if (!this.performanceObligations || this.performanceObligations.length === 0) {
            return 'pending';
        }
        const totalCompletion = this.performanceObligations.reduce((sum, po) => sum + po.completionPercentage, 0);
        const averageCompletion = totalCompletion / this.performanceObligations.length;
        if (averageCompletion >= 100) {
            return 'fully_recognized';
        }
        else if (averageCompletion > 0) {
            return 'partially_recognized';
        }
        else {
            return 'pending';
        }
    }
});
// Pre-save middleware to calculate derived fields
InvoiceSchema.pre('save', function (next) {
    // Calculate amount in base currency if exchange rate is provided
    if (this.exchangeRate && this.currency !== 'KWD') {
        this.amountInBaseCurrency = this.amount * this.exchangeRate;
    }
    else {
        this.amountInBaseCurrency = this.amount;
    }
    // Calculate net amount (amount - tax)
    this.netAmount = this.amount - this.taxAmount;
    // Set revenue recognition date if not provided
    if (!this.revenueRecognitionDate) {
        if (this.revenueRecognitionMethod === 'point_in_time') {
            this.revenueRecognitionDate = this.paymentDate || this.invoiceDate;
        }
        else {
            this.revenueRecognitionDate = this.invoiceDate;
        }
    }
    next();
});
// Indexes for efficient querying
InvoiceSchema.index({ category: 1, invoiceDate: 1 });
InvoiceSchema.index({ customer: 1, invoiceDate: 1 });
InvoiceSchema.index({ paymentStatus: 1, dueDate: 1 });
InvoiceSchema.index({ status: 1, invoiceDate: 1 });
InvoiceSchema.index({ revenueRecognitionMethod: 1, revenueRecognitionDate: 1 });
InvoiceSchema.index({ ifrsTreatment: 1, invoiceDate: 1 });
exports.default = mongoose_1.default.model('Invoice', InvoiceSchema);
