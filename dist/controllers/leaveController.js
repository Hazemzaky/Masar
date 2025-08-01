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
exports.rejectLeave = exports.approveLeave = exports.updateLeave = exports.getLeave = exports.getLeaves = exports.createLeave = void 0;
const Leave_1 = __importDefault(require("../models/Leave"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Period_1 = require("../models/Period");
const serialUtils_1 = require("../utils/serialUtils");
// Helper: Check for overlapping leaves
function hasOverlappingLeave(employeeId, startDate, endDate, excludeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const filter = {
            employee: employeeId,
            status: { $ne: 'rejected' },
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
                { startDate: { $gte: startDate, $lte: endDate } },
                { endDate: { $gte: startDate, $lte: endDate } }
            ]
        };
        if (excludeId)
            filter._id = { $ne: excludeId };
        const overlap = yield Leave_1.default.findOne(filter);
        return !!overlap;
    });
}
const createLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employee, type, startDate, endDate, days, cost, department } = req.body;
        if (!employee || !type || !startDate || !endDate || !days) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const period = startDate ? new Date(startDate).toISOString().slice(0, 7) : undefined;
        if (period && (yield (0, Period_1.isPeriodClosed)(period))) {
            res.status(403).json({ message: 'This period is locked and cannot be edited.' });
            return;
        }
        // Check for overlapping leaves
        if (yield hasOverlappingLeave(employee, new Date(startDate), new Date(endDate))) {
            res.status(400).json({ message: 'Overlapping leave request exists for this employee.' });
            return;
        }
        // Check leave balance
        const emp = yield Employee_1.default.findById(employee);
        if (emp && emp.leaveBalance < days) {
            res.status(400).json({ message: 'Insufficient leave balance.' });
            return;
        }
        // Serial number generation
        const docCode = 'LV';
        const dept = department || 'HR';
        const serial = yield (0, serialUtils_1.generateSerial)(docCode, dept, Leave_1.default);
        const leave = new Leave_1.default({ employee, type, startDate, endDate, days, cost, serial });
        yield leave.save();
        res.status(201).json(leave);
    }
    catch (error) {
        console.error('Error in createLeave:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createLeave = createLeave;
const getLeaves = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Filtering support
        const { employee, status, department } = req.query;
        const filter = {};
        if (employee)
            filter.employee = employee;
        if (status)
            filter.status = status;
        if (department)
            filter.department = department;
        const leaves = yield Leave_1.default.find(filter).populate('employee');
        res.json(leaves);
    }
    catch (error) {
        console.error('Error in getLeaves:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getLeaves = getLeaves;
const getLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leave = yield Leave_1.default.findById(req.params.id).populate('employee');
        if (!leave) {
            res.status(404).json({ message: 'Leave not found' });
            return;
        }
        res.json(leave);
    }
    catch (error) {
        console.error('Error in getLeave:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getLeave = getLeave;
const updateLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, employee, endDate } = req.body;
        if (startDate && employee && endDate) {
            const period = new Date(startDate).toISOString().slice(0, 7);
            if (yield (0, Period_1.isPeriodClosed)(period)) {
                res.status(403).json({ message: 'This period is locked and cannot be edited.' });
                return;
            }
            // Check for overlapping leaves (exclude current leave)
            if (yield hasOverlappingLeave(employee, new Date(startDate), new Date(endDate), req.params.id)) {
                res.status(400).json({ message: 'Overlapping leave request exists for this employee.' });
                return;
            }
        }
        const leave = yield Leave_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!leave) {
            res.status(404).json({ message: 'Leave not found' });
            return;
        }
        res.json(leave);
    }
    catch (error) {
        console.error('Error in updateLeave:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateLeave = updateLeave;
const approveLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leave = yield Leave_1.default.findById(req.params.id);
        if (!leave) {
            res.status(404).json({ message: 'Leave not found' });
            return;
        }
        leave.status = 'approved';
        yield leave.save();
        // Decrement employee leave balance
        const emp = yield Employee_1.default.findById(leave.employee);
        if (emp) {
            emp.leaveBalance = (emp.leaveBalance || 0) - leave.days;
            yield emp.save();
        }
        res.json(leave);
    }
    catch (error) {
        console.error('Error in approveLeave:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.approveLeave = approveLeave;
const rejectLeave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leave = yield Leave_1.default.findById(req.params.id);
        if (!leave) {
            res.status(404).json({ message: 'Leave not found' });
            return;
        }
        leave.status = 'rejected';
        yield leave.save();
        res.json(leave);
    }
    catch (error) {
        console.error('Error in rejectLeave:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.rejectLeave = rejectLeave;
