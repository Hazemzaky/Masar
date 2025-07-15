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
exports.rejectReimbursement = exports.approveReimbursement = exports.updateReimbursement = exports.getReimbursement = exports.getReimbursements = exports.createReimbursement = void 0;
const Reimbursement_1 = __importDefault(require("../models/Reimbursement"));
const Period_1 = require("../models/Period");
const serialUtils_1 = require("../utils/serialUtils");
const createReimbursement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employee, amount, description, date, department } = req.body;
        if (!employee || !amount || !description || !date) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const period = date ? new Date(date).toISOString().slice(0, 7) : undefined;
        if (period && (yield (0, Period_1.isPeriodClosed)(period))) {
            res.status(403).json({ message: 'This period is locked and cannot be edited.' });
            return;
        }
        // Serial number generation
        const docCode = 'RB';
        const dept = department || 'HR';
        const serial = yield (0, serialUtils_1.generateSerial)(docCode, dept, Reimbursement_1.default);
        const reimbursement = new Reimbursement_1.default({ employee, amount, description, date, serial });
        yield reimbursement.save();
        res.status(201).json(reimbursement);
    }
    catch (error) {
        console.error('Error in createReimbursement:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createReimbursement = createReimbursement;
const getReimbursements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reimbursements = yield Reimbursement_1.default.find().populate('employee');
        res.json(reimbursements);
    }
    catch (error) {
        console.error('Error in getReimbursements:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getReimbursements = getReimbursements;
const getReimbursement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reimbursement = yield Reimbursement_1.default.findById(req.params.id).populate('employee');
        if (!reimbursement) {
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }
        res.json(reimbursement);
    }
    catch (error) {
        console.error('Error in getReimbursement:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getReimbursement = getReimbursement;
const updateReimbursement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.body;
        if (date) {
            const period = new Date(date).toISOString().slice(0, 7);
            if (yield (0, Period_1.isPeriodClosed)(period)) {
                res.status(403).json({ message: 'This period is locked and cannot be edited.' });
                return;
            }
        }
        const reimbursement = yield Reimbursement_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!reimbursement) {
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }
        res.json(reimbursement);
    }
    catch (error) {
        console.error('Error in updateReimbursement:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateReimbursement = updateReimbursement;
const approveReimbursement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reimbursement = yield Reimbursement_1.default.findById(req.params.id);
        if (!reimbursement) {
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }
        reimbursement.status = 'approved';
        yield reimbursement.save();
        res.json(reimbursement);
    }
    catch (error) {
        console.error('Error in approveReimbursement:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.approveReimbursement = approveReimbursement;
const rejectReimbursement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reimbursement = yield Reimbursement_1.default.findById(req.params.id);
        if (!reimbursement) {
            res.status(404).json({ message: 'Reimbursement not found' });
            return;
        }
        reimbursement.status = 'rejected';
        yield reimbursement.save();
        res.json(reimbursement);
    }
    catch (error) {
        console.error('Error in rejectReimbursement:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.rejectReimbursement = rejectReimbursement;
