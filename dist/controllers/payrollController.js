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
exports.processPayroll = exports.updatePayroll = exports.getPayroll = exports.getPayrolls = exports.createPayroll = exports.updateMonthlyPayroll = exports.getEmployeePayrollHistory = exports.getPayrollHistory = exports.deletePayrollEmployee = exports.updatePayrollEmployee = exports.getPayrollEmployee = exports.getPayrollEmployees = exports.createPayrollEmployee = void 0;
const Payroll_1 = require("../models/Payroll");
const Payroll_2 = __importDefault(require("../models/Payroll"));
// New Payroll Employee Management
const createPayrollEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employee = new Payroll_1.PayrollEmployee(req.body);
        yield employee.save();
        res.status(201).json(employee);
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Employee code already exists' });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
});
exports.createPayrollEmployee = createPayrollEmployee;
const getPayrollEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employees = yield Payroll_1.PayrollEmployee.find().sort({ fullName: 1 });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPayrollEmployees = getPayrollEmployees;
const getPayrollEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employee = yield Payroll_1.PayrollEmployee.findById(req.params.id);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPayrollEmployee = getPayrollEmployee;
const updatePayrollEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Get current employee data
        const currentEmployee = yield Payroll_1.PayrollEmployee.findById(id);
        if (!currentEmployee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        // Update employee
        const updatedEmployee = yield Payroll_1.PayrollEmployee.findByIdAndUpdate(id, updateData, { new: true });
        // Create history record for the current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        // Check if history record already exists for this month
        const existingHistory = yield Payroll_1.PayrollHistory.findOne({
            employeeId: id,
            month: currentMonth
        });
        if (existingHistory) {
            // Update existing history record
            yield Payroll_1.PayrollHistory.findByIdAndUpdate(existingHistory._id, Object.assign(Object.assign({}, updateData), { year: now.getFullYear() }));
        }
        else {
            // Create new history record
            const historyData = Object.assign({ employeeId: id, month: currentMonth, year: now.getFullYear() }, updateData);
            yield Payroll_1.PayrollHistory.create(historyData);
        }
        res.json(updatedEmployee);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updatePayrollEmployee = updatePayrollEmployee;
const deletePayrollEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employee = yield Payroll_1.PayrollEmployee.findByIdAndDelete(req.params.id);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        // Delete associated history records
        yield Payroll_1.PayrollHistory.deleteMany({ employeeId: req.params.id });
        res.json({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deletePayrollEmployee = deletePayrollEmployee;
// Payroll History Management
const getPayrollHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield Payroll_1.PayrollHistory.find().populate('employeeId', 'fullName employeeCode');
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPayrollHistory = getPayrollHistory;
const getEmployeePayrollHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        const history = yield Payroll_1.PayrollHistory.find({ employeeId }).sort({ month: -1 });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getEmployeePayrollHistory = getEmployeePayrollHistory;
// Monthly Payroll Update (to be run on 24th of each month)
const updateMonthlyPayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        // Get all employees
        const employees = yield Payroll_1.PayrollEmployee.find();
        for (const employee of employees) {
            // Check if history record already exists for this month
            const existingHistory = yield Payroll_1.PayrollHistory.findOne({
                employeeId: employee._id,
                month: currentMonth
            });
            if (!existingHistory) {
                // Create new history record with current employee data
                const historyData = {
                    employeeId: employee._id,
                    month: currentMonth,
                    year: now.getFullYear(),
                    totalSalary: employee.totalSalary,
                    days: employee.days,
                    basicSalary: employee.basicSalary,
                    fixedAllowance: employee.fixedAllowance,
                    temporaryAllowance: employee.temporaryAllowance,
                    overtime: employee.overtime,
                    leave: employee.leave,
                    leaveDays: employee.leaveDays,
                    grossSalary: employee.grossSalary,
                    absent: employee.absent,
                    absentDays: employee.absentDays,
                    sickLeave: employee.sickLeave,
                    sickLeaveDays: employee.sickLeaveDays,
                    loan: employee.loan,
                    fixedDeduction: employee.fixedDeduction,
                    temporaryDeduction: employee.temporaryDeduction,
                    grossNetSalary: employee.grossNetSalary,
                    sponsor: employee.sponsor,
                    remark: employee.remark
                };
                yield Payroll_1.PayrollHistory.create(historyData);
            }
        }
        res.json({ message: 'Monthly payroll update completed successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateMonthlyPayroll = updateMonthlyPayroll;
// Legacy Payroll Functions (for backward compatibility)
const createPayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payroll = new Payroll_2.default(req.body);
        yield payroll.save();
        res.status(201).json(payroll);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createPayroll = createPayroll;
const getPayrolls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payrolls = yield Payroll_2.default.find().populate('employee', 'name');
        res.json(payrolls);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPayrolls = getPayrolls;
const getPayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payroll = yield Payroll_2.default.findById(req.params.id).populate('employee', 'name');
        if (!payroll) {
            res.status(404).json({ message: 'Payroll not found' });
            return;
        }
        res.json(payroll);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPayroll = getPayroll;
const updatePayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payroll = yield Payroll_2.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!payroll) {
            res.status(404).json({ message: 'Payroll not found' });
            return;
        }
        res.json(payroll);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updatePayroll = updatePayroll;
const processPayroll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period } = req.body;
        // Process payroll logic here
        res.json({ message: 'Payroll processed successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.processPayroll = processPayroll;
