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
exports.getAgingReport = exports.updateInvoiceStatus = exports.createInvoice = exports.getInvoices = exports.uploadInvoice = void 0;
const Invoice_1 = __importDefault(require("../models/Invoice"));
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
        const invoices = yield Invoice_1.default.find().populate('uploadedBy').populate('expense');
        res.json(invoices);
    }
    catch (error) {
        console.error('Error in getInvoices:', error);
        res.status(500).json({ message: 'Server error', error });
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
        const invoice = new Invoice_1.default({
            fileUrl,
            uploadedBy: userId,
            dueDate,
            recipient,
            lineItems,
            totalAmount,
            status: 'draft',
            history: [{ status: 'draft', date: new Date() }],
            serial,
        });
        yield invoice.save();
        res.status(201).json(invoice);
    }
    catch (error) {
        console.error('Error in createInvoice:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createInvoice = createInvoice;
// Update invoice status (sent, paid, overdue)
const updateInvoiceStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const invoice = yield Invoice_1.default.findById(id);
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        invoice.status = status;
        invoice.history.push({ status, date: new Date() });
        yield invoice.save();
        res.json(invoice);
    }
    catch (error) {
        console.error('Error in updateInvoiceStatus:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateInvoiceStatus = updateInvoiceStatus;
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
