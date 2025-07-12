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
exports.openPeriod = exports.getClosedPeriods = exports.getPeriods = exports.closePeriod = void 0;
const Period_1 = __importDefault(require("../models/Period"));
const closePeriod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period, closedBy } = req.body;
        let p = yield Period_1.default.findOne({ period });
        if (!p) {
            p = new Period_1.default({ period });
        }
        p.closed = true;
        p.closedAt = new Date();
        p.closedBy = closedBy || 'system';
        yield p.save();
        res.json(p);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.closePeriod = closePeriod;
const getPeriods = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const periods = yield Period_1.default.find();
        res.json(periods);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getPeriods = getPeriods;
const getClosedPeriods = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const closedPeriods = yield Period_1.default.find({ closed: true });
        res.json(closedPeriods);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getClosedPeriods = getClosedPeriods;
const openPeriod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period } = req.params;
        const p = yield Period_1.default.findOne({ period });
        if (!p) {
            res.status(404).json({ message: 'Period not found' });
            return;
        }
        p.closed = false;
        p.closedAt = undefined;
        p.closedBy = undefined;
        yield p.save();
        res.json(p);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.openPeriod = openPeriod;
