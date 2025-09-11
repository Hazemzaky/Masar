"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgingReport = exports.emailInvoice = exports.generateInvoicePDF = exports.updateInvoiceStatus = exports.createInvoice = exports.getInvoices = exports.uploadInvoice = void 0;
const Invoice_1 = __importDefault(require("../models/Invoice"));
const mongoose_1 = __importDefault(require("mongoose"));
const pdfService_1 = __importDefault(require("../services/pdfService"));
const uploadInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { expenseId } = req.body;
        const invoice = new Invoice_1.default({
            fileUrl: `/uploads/${req.file.filename}`,
            uploadedBy: userId,
            expense: expenseId,
        });
        yield invoice.save();
        res.status(201).json(invoice);
    }
    catch (error) {
        console.error('Error in uploadInvoice:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.uploadInvoice = uploadInvoice;
const getInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoices = yield Invoice_1.default.find()
            .populate('submittedBy', 'name email')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('customer', 'name email')
            .sort({ createdAt: -1 });
        // Transform the data to match the frontend expectations
        const transformedInvoices = invoices.map(invoice => ({
            _id: invoice._id,
            recipient: {
                name: invoice.customerName || 'Unknown Customer',
                email: invoice.customerReference || 'no-email@example.com'
            },
            dueDate: invoice.dueDate,
            status: invoice.paymentStatus, // Map paymentStatus to status for frontend compatibility
            totalAmount: invoice.amount,
            lineItems: invoice.lineItems || [],
            uploadedBy: invoice.uploadedBy,
            fileUrl: invoice.fileUrl,
            serial: invoice.serial || invoice.invoiceNumber,
            // Include additional fields from the new model
            invoiceNumber: invoice.invoiceNumber,
            description: invoice.description,
            currency: invoice.currency,
            taxAmount: invoice.taxAmount,
            netAmount: invoice.netAmount,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt
        }));
        res.json(transformedInvoices);
    }
    catch (error) {
        console.error('Error in getInvoices:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.getInvoices = getInvoices;
// Create a new invoice with line items, recipient, due date, etc.
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { recipient, dueDate, lineItems, fileUrl, serial } = req.body;
        if (!recipient || !dueDate || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxRate = 0; // Default to 0% tax - can be made configurable
        const taxAmount = totalAmount * taxRate;
        const netAmount = totalAmount - taxAmount;
        // Generate invoice number if not provided
        const invoiceNumber = serial || `INV-${Date.now()}`;
        const invoice = new Invoice_1.default({
            // Basic information
            invoiceNumber,
            description: lineItems.map(item => item.description).join(', '),
            amount: totalAmount,
            currency: 'KWD',
            amountInBaseCurrency: totalAmount,
            // Revenue categorization
            category: 'other_income', // Default category
            subcategory: 'invoice',
            // IFRS revenue recognition
            ifrsCategory: 'operating_revenue',
            ifrsTreatment: 'revenue',
            revenueRecognitionMethod: 'point_in_time',
            // Dates
            invoiceDate: new Date(),
            dueDate: new Date(dueDate),
            revenueRecognitionDate: new Date(),
            // Customer information - create a temporary customer reference
            customer: new mongoose_1.default.Types.ObjectId(), // This should be replaced with actual customer ID
            customerName: recipient.name,
            customerReference: recipient.email,
            // Payment information
            paymentStatus: 'pending',
            // Tax information
            taxAmount,
            taxRate,
            taxType: 'VAT',
            netAmount,
            // Approval workflow
            status: 'draft',
            submittedBy: userId,
            createdBy: userId,
            updatedBy: userId,
            // IFRS compliance
            ifrsDisclosureRequired: false,
            // Additional fields for compatibility (these might not be in the schema but won't cause errors)
            fileUrl,
            uploadedBy: userId,
            lineItems,
            totalAmount,
            serial: invoiceNumber,
        });
        yield invoice.save();
        res.status(201).json(invoice);
    }
    catch (error) {
        console.error('Error in createInvoice:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.createInvoice = createInvoice;
// Update invoice status (sent, paid, overdue)
const updateInvoiceStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const invoice = yield Invoice_1.default.findById(id);
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        // Map frontend status to paymentStatus
        const statusMapping = {
            'draft': 'pending',
            'sent': 'pending',
            'paid': 'paid',
            'overdue': 'overdue',
            'cancelled': 'cancelled',
            'disputed': 'disputed'
        };
        invoice.paymentStatus = statusMapping[status] || status;
        invoice.updatedBy = userId;
        // If marking as paid, set payment date
        if (status === 'paid') {
            invoice.paymentDate = new Date();
        }
        yield invoice.save();
        // Return transformed data for frontend compatibility
        const transformedInvoice = {
            _id: invoice._id,
            recipient: {
                name: invoice.customerName || 'Unknown Customer',
                email: invoice.customerReference || 'no-email@example.com'
            },
            dueDate: invoice.dueDate,
            status: invoice.paymentStatus,
            totalAmount: invoice.amount,
            lineItems: invoice.lineItems || [],
            serial: invoice.serial || invoice.invoiceNumber,
            invoiceNumber: invoice.invoiceNumber,
            description: invoice.description,
            currency: invoice.currency,
            taxAmount: invoice.taxAmount,
            netAmount: invoice.netAmount,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt
        };
        res.json(transformedInvoice);
    }
    catch (error) {
        console.error('Error in updateInvoiceStatus:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.updateInvoiceStatus = updateInvoiceStatus;
// Generate PDF for invoice
const generateInvoicePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { template = 'standard' } = req.query;
        console.log(`Generating PDF for invoice ${id} with template ${template}`);
        const invoice = yield Invoice_1.default.findById(id);
        if (!invoice) {
            console.log(`Invoice ${id} not found`);
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        console.log('Invoice found:', {
            id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            customerName: invoice.customerName,
            lineItems: ((_a = invoice.lineItems) === null || _a === void 0 ? void 0 : _a.length) || 0
        });
        const pdfService = pdfService_1.default.getInstance();
        const pdfBuffer = yield pdfService.generateInvoicePDF(invoice, {
            template: template,
            includeLogo: true,
            companyInfo: {
                name: 'Your Company Name',
                address: '123 Business Street, Kuwait City, Kuwait',
                phone: '+965 1234-5678',
                email: 'billing@company.com',
                website: 'www.company.com',
                taxId: 'TAX-123456789'
            }
        });
        console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error in generateInvoicePDF:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : undefined
        });
    }
});
exports.generateInvoicePDF = generateInvoicePDF;
// Email invoice
const emailInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { recipientEmail, template = 'standard' } = req.body;
        if (!recipientEmail) {
            res.status(400).json({ message: 'Recipient email is required' });
            return;
        }
        const invoice = yield Invoice_1.default.findById(id);
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        const pdfService = pdfService_1.default.getInstance();
        const pdfBuffer = yield pdfService.generateInvoicePDF(invoice, {
            template: template,
            includeLogo: true,
            companyInfo: {
                name: 'Your Company Name',
                address: '123 Business Street, Kuwait City, Kuwait',
                phone: '+965 1234-5678',
                email: 'billing@company.com',
                website: 'www.company.com',
                taxId: 'TAX-123456789'
            }
        });
        yield pdfService.emailInvoice(id, recipientEmail, pdfBuffer);
        res.json({ message: 'Invoice sent successfully', recipientEmail });
    }
    catch (error) {
        console.error('Error in emailInvoice:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.emailInvoice = emailInvoice;
// Aging report: group invoices by overdue periods
const getAgingReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const invoices = yield Invoice_1.default.find({ status: { $in: ['sent', 'overdue'] } });
        const buckets = {
            '0-30': [],
            '31-60': [],
            '61-90': [],
            '90+': [],
        };
        invoices.forEach((inv) => {
            const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysOverdue <= 30)
                buckets['0-30'].push(inv);
            else if (daysOverdue <= 60)
                buckets['31-60'].push(inv);
            else if (daysOverdue <= 90)
                buckets['61-90'].push(inv);
            else
                buckets['90+'].push(inv);
        });
        res.json(buckets);
    }
    catch (error) {
        console.error('Error in getAgingReport:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAgingReport = getAgingReport;
