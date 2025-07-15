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
exports.PayrollHistory = exports.PayrollEmployee = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PayrollEmployeeSchema = new mongoose_1.Schema({
    company: { type: String, required: true },
    employeeCode: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    position: { type: String, required: true },
    department: { type: String, required: true },
    totalSalary: { type: Number, required: true },
    days: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    fixedAllowance: { type: Number, required: true },
    temporaryAllowance: { type: Number, required: true },
    overtime: { type: Number, required: true },
    leave: { type: Number, required: true },
    leaveDays: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    absent: { type: Number, required: true },
    absentDays: { type: Number, required: true },
    sickLeave: { type: Number, required: true },
    sickLeaveDays: { type: Number, required: true },
    loan: { type: Number, required: true },
    fixedDeduction: { type: Number, required: true },
    temporaryDeduction: { type: Number, required: true },
    grossNetSalary: { type: Number, required: true },
    sponsor: { type: String, required: true },
    remark: { type: String },
    currentProject: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    projectAssignmentDate: { type: Date }
}, {
    timestamps: true
});
const PayrollHistorySchema = new mongoose_1.Schema({
    employeeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PayrollEmployee', required: true },
    month: { type: String, required: true }, // Format: "2024-01", "2024-02", etc.
    year: { type: Number, required: true },
    totalSalary: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
    basicSalary: { type: Number, default: 0 },
    fixedAllowance: { type: Number, default: 0 },
    temporaryAllowance: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    leave: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    sickLeave: { type: Number, default: 0 },
    sickLeaveDays: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    fixedDeduction: { type: Number, default: 0 },
    temporaryDeduction: { type: Number, default: 0 },
    grossNetSalary: { type: Number, default: 0 },
    sponsor: { type: String, default: '' },
    remark: { type: String, default: '' }
}, {
    timestamps: true
});
// Create compound index for employeeId and month to ensure unique monthly records
PayrollHistorySchema.index({ employeeId: 1, month: 1 }, { unique: true });
exports.PayrollEmployee = mongoose_1.default.model('PayrollEmployee', PayrollEmployeeSchema);
exports.PayrollHistory = mongoose_1.default.model('PayrollHistory', PayrollHistorySchema);
const PayrollSchema = new mongoose_1.Schema({
    employee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee', required: true },
    period: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    benefits: { type: Number, default: 0 },
    leaveCost: { type: Number, default: 0 },
    reimbursements: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processed', 'paid'], default: 'pending' },
    runDate: { type: Date, default: Date.now },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    serial: { type: String, unique: true, sparse: true } // Document serial number
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Payroll', PayrollSchema);
