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
exports.reverseJournalEntry = exports.postJournalEntry = exports.updateJournalEntry = exports.getJournalEntries = exports.createJournalEntry = void 0;
const JournalEntry_1 = __importDefault(require("../models/JournalEntry"));
const Period_1 = require("../models/Period");
const serialUtils_1 = require("../utils/serialUtils");
const createJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, description, lines, createdBy, period, reference, department } = req.body;
        if (period && (yield (0, Period_1.isPeriodClosed)(period))) {
            res.status(403).json({ message: 'This period is locked and cannot be edited.' });
            return;
        }
        // Double-entry validation
        const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
        const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);
        if (totalDebit !== totalCredit) {
            res.status(400).json({ message: 'Debits and credits must be equal (double-entry)' });
            return;
        }
        // Serial number generation
        const docCode = 'JE';
        const dept = department || 'AC';
        const serial = yield (0, serialUtils_1.generateSerial)(docCode, dept, JournalEntry_1.default);
        const entry = new JournalEntry_1.default({ date, description, lines, createdBy, period, reference, serial });
        yield entry.save();
        res.status(201).json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createJournalEntry = createJournalEntry;
const getJournalEntries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period, account, status } = req.query;
        const filter = {};
        if (period)
            filter.period = period;
        if (status)
            filter.status = status;
        if (account)
            filter['lines.account'] = account;
        const entries = yield JournalEntry_1.default.find(filter).populate('lines.account');
        res.json(entries);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getJournalEntries = getJournalEntries;
const updateJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const entry = yield JournalEntry_1.default.findById(id);
        if (!entry) {
            res.status(404).json({ message: 'Journal entry not found' });
            return;
        }
        if (entry.status !== 'draft') {
            res.status(400).json({ message: 'Only draft entries can be updated' });
            return;
        }
        if (entry.period && (yield (0, Period_1.isPeriodClosed)(entry.period))) {
            res.status(403).json({ message: 'This period is locked and cannot be edited.' });
            return;
        }
        Object.assign(entry, req.body);
        yield entry.save();
        res.json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateJournalEntry = updateJournalEntry;
const postJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const entry = yield JournalEntry_1.default.findById(id);
        if (!entry) {
            res.status(404).json({ message: 'Journal entry not found' });
            return;
        }
        if (entry.status !== 'draft') {
            res.status(400).json({ message: 'Only draft entries can be posted' });
            return;
        }
        entry.status = 'posted';
        yield entry.save();
        res.json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.postJournalEntry = postJournalEntry;
const reverseJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const entry = yield JournalEntry_1.default.findById(id);
        if (!entry) {
            res.status(404).json({ message: 'Journal entry not found' });
            return;
        }
        if (entry.status !== 'posted') {
            res.status(400).json({ message: 'Only posted entries can be reversed' });
            return;
        }
        // Create reversal entry
        const reversalLines = entry.lines.map((l) => ({
            account: l.account,
            debit: l.credit,
            credit: l.debit,
            description: `Reversal of: ${l.description || ''}`,
        }));
        const reversal = new JournalEntry_1.default({
            date: new Date(),
            description: `Reversal of entry ${entry._id}`,
            lines: reversalLines,
            createdBy: req.body.createdBy || 'system',
            period: entry.period,
            status: 'posted',
            reference: `Reversal of ${entry._id}`,
        });
        entry.status = 'reversed';
        yield entry.save();
        yield reversal.save();
        res.json({ original: entry, reversal });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.reverseJournalEntry = reverseJournalEntry;
