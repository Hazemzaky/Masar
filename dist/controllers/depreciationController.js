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
exports.getDepreciationSchedule = exports.deleteDepreciation = exports.updateDepreciation = exports.getDepreciation = exports.getDepreciations = exports.createDepreciation = void 0;
const Depreciation_1 = __importDefault(require("../models/Depreciation"));
// Calculate depreciation schedule with accurate monthly calculations
const calculateDepreciationSchedule = (assetCost, usefulLifeYears, startDate) => {
    const totalUsefulDays = usefulLifeYears * 365; // Ignore leap years for total calculation
    const dailyDepreciation = assetCost / totalUsefulDays;
    const schedule = [];
    let currentDate = new Date(startDate);
    let accumulatedDepreciation = 0;
    let bookValue = assetCost;
    // Helper function to get days in a month
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    // Helper function to check if a year is a leap year
    const isLeapYear = (year) => {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };
    // Calculate for each month until book value reaches 0 or we've covered the useful life
    for (let year = 0; year < usefulLifeYears; year++) {
        for (let month = 0; month < 12; month++) {
            if (bookValue <= 0)
                break;
            const daysInMonth = getDaysInMonth(currentDate);
            // Adjust February for leap years
            const actualDaysInMonth = (currentDate.getMonth() === 1 && isLeapYear(currentDate.getFullYear()))
                ? 29
                : daysInMonth;
            const monthDepreciation = dailyDepreciation * actualDaysInMonth;
            accumulatedDepreciation += monthDepreciation;
            bookValue = Math.max(0, assetCost - accumulatedDepreciation);
            schedule.push({
                month: currentDate.getMonth() + 1, // 1-based month
                year: currentDate.getFullYear(),
                days: actualDaysInMonth,
                monthDepreciation: Math.round(monthDepreciation * 100) / 100, // Round to 2 decimal places
                accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
                bookValue: Math.round(bookValue * 100) / 100
            });
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        if (bookValue <= 0)
            break;
    }
    return schedule;
};
const createDepreciation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const depreciation = new Depreciation_1.default(req.body);
        yield depreciation.save();
        res.status(201).json(depreciation);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createDepreciation = createDepreciation;
const getDepreciations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const depreciations = yield Depreciation_1.default.find().populate('asset');
        res.json(depreciations);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getDepreciations = getDepreciations;
const getDepreciation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const depreciation = yield Depreciation_1.default.findById(req.params.id).populate('asset');
        if (!depreciation) {
            res.status(404).json({ message: 'Depreciation not found' });
            return;
        }
        res.json(depreciation);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getDepreciation = getDepreciation;
const updateDepreciation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const depreciation = yield Depreciation_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!depreciation) {
            res.status(404).json({ message: 'Depreciation not found' });
            return;
        }
        res.json(depreciation);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateDepreciation = updateDepreciation;
const deleteDepreciation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const depreciation = yield Depreciation_1.default.findByIdAndDelete(req.params.id);
        if (!depreciation) {
            res.status(404).json({ message: 'Depreciation not found' });
            return;
        }
        res.json({ message: 'Depreciation deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteDepreciation = deleteDepreciation;
const getDepreciationSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cost, usefulLifeYears, startDate } = req.query;
        // Validate required parameters
        if (!cost || !usefulLifeYears || !startDate) {
            return res.status(400).json({
                message: 'Missing required parameters: cost, usefulLifeYears, startDate'
            });
        }
        const assetCost = Number(cost);
        const usefulLife = Number(usefulLifeYears);
        const start = new Date(startDate);
        // Validate parameters
        if (isNaN(assetCost) || assetCost <= 0) {
            return res.status(400).json({ message: 'Cost must be a positive number' });
        }
        if (isNaN(usefulLife) || usefulLife <= 0) {
            return res.status(400).json({ message: 'Useful life must be a positive number' });
        }
        if (isNaN(start.getTime())) {
            return res.status(400).json({ message: 'Invalid start date' });
        }
        const schedule = calculateDepreciationSchedule(assetCost, usefulLife, start);
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getDepreciationSchedule = getDepreciationSchedule;
