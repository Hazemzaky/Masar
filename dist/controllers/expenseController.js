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
exports.getIncome = exports.createIncome = exports.deleteExpense = exports.updateExpense = exports.getExpense = exports.getExpenses = exports.createExpense = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const Period_1 = require("../models/Period");
const Income_1 = __importDefault(require("../models/Income"));
const serialUtils_1 = require("../utils/serialUtils");
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, description, date, category, invoice, currency, depreciationStart, depreciationEnd, managementDepartment, customType } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        if (!amount || !description || !date || !category) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const period = date ? new Date(date).toISOString().slice(0, 7) : undefined;
        if (period && (yield (0, Period_1.isPeriodClosed)(period))) {
            res.status(403).json({ message: 'This period is locked and cannot be edited.' });
            return;
        }
        const proofUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        const serial = yield (0, serialUtils_1.generateSerial)('EX', managementDepartment, Expense_1.default);
        const expense = new Expense_1.default({
            amount,
            description,
            date,
            category: category === 'other' ? customType : category,
            user: userId,
            invoice,
            currency,
            depreciationStart,
            depreciationEnd,
            managementDepartment,
            proofUrl,
            customType: category === 'other' ? customType : undefined,
            serial,
        });
        yield expense.save();
        res.status(201).json(expense);
    }
    catch (error) {
        console.error('Error in createExpense:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createExpense = createExpense;
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let expenses = yield Expense_1.default.find().populate('submittedBy').populate('vendor');
        expenses = expenses.filter(e => e.submittedBy);
        res.json(expenses);
    }
    catch (error) {
        console.error('Error in getExpenses:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getExpenses = getExpenses;
const getExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expense = yield Expense_1.default.findById(req.params.id).populate('submittedBy').populate('vendor');
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        res.json(expense);
    }
    catch (error) {
        console.error('Error in getExpense:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getExpense = getExpense;
const updateExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { date } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const period = date ? new Date(date).toISOString().slice(0, 7) : undefined;
        if (period && (yield (0, Period_1.isPeriodClosed)(period))) {
            res.status(403).json({ message: 'This period is locked and cannot be edited.' });
            return;
        }
        const updateData = Object.assign(Object.assign({}, req.body), { updatedBy: userId });
        const expense = yield Expense_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        res.json(expense);
    }
    catch (error) {
        console.error('Error in updateExpense:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateExpense = updateExpense;
const deleteExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expense = yield Expense_1.default.findByIdAndDelete(req.params.id);
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        res.json({ message: 'Expense deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteExpense = deleteExpense;
const createIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, description, date, currency, managementDepartment } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        if (!amount || !description || !date) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const serial = yield (0, serialUtils_1.generateSerial)('IN', managementDepartment, Income_1.default);
        const income = new Income_1.default({
            amount,
            description,
            date,
            currency,
            managementDepartment,
            submittedBy: userId,
            createdBy: userId,
            updatedBy: userId,
            serial,
        });
        yield income.save();
        res.status(201).json(income);
    }
    catch (error) {
        console.error('Error in createIncome:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createIncome = createIncome;
const getIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const income = yield Income_1.default.find().populate('submittedBy');
        res.json(income);
    }
    catch (error) {
        console.error('Error in getIncome:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getIncome = getIncome;
