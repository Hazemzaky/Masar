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
exports.getEmployeeProjectAssignment = exports.getEmployeesByProject = exports.unassignEmployeeFromProject = exports.assignEmployeeToProject = exports.getAvailableEmployees = exports.processPayroll = exports.updatePayroll = exports.getPayroll = exports.getPayrolls = exports.createPayroll = exports.updateMonthlyPayroll = exports.getEmployeePayrollHistory = exports.getPayrollHistory = exports.deletePayrollEmployee = exports.updatePayrollPayment = exports.updatePayrollEmployee = exports.getPayrollEmployee = exports.getPayrollEmployees = exports.createPayrollEmployee = void 0;
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
        // Only save fields that exist in PayrollHistory schema
        const historyFields = [
            'totalSalary', 'days', 'basicSalary', 'fixedAllowance', 'temporaryAllowance',
            'overtime', 'leave', 'leaveDays', 'grossSalary', 'absent', 'absentDays',
            'sickLeave', 'sickLeaveDays', 'loan', 'fixedDeduction', 'temporaryDeduction',
            'grossNetSalary', 'sponsor', 'remark'
        ];
        const historyData = {};
        historyFields.forEach(field => {
            if (updateData[field] !== undefined) {
                historyData[field] = updateData[field];
            }
        });
        if (existingHistory) {
            // Update existing history record
            yield Payroll_1.PayrollHistory.findByIdAndUpdate(existingHistory._id, Object.assign(Object.assign({}, historyData), { year: now.getFullYear() }));
        }
        else {
            // Create new history record
            const newHistoryData = Object.assign({ employeeId: id, month: currentMonth, year: now.getFullYear() }, historyData);
            yield Payroll_1.PayrollHistory.create(newHistoryData);
        }
        res.json(updatedEmployee);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updatePayrollEmployee = updatePayrollEmployee;
// New function to update only payment-related fields
const updatePayrollPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Only allow payment-related fields to be updated
        const allowedFields = [
            'totalSalary', 'days', 'basicSalary', 'fixedAllowance', 'temporaryAllowance',
            'overtime', 'leave', 'leaveDays', 'grossSalary', 'absent', 'absentDays',
            'sickLeave', 'sickLeaveDays', 'loan', 'fixedDeduction', 'temporaryDeduction',
            'grossNetSalary', 'remark'
        ];
        // Filter out non-payment fields
        const paymentUpdateData = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                paymentUpdateData[field] = updateData[field];
            }
        });
        // Get current employee data
        const currentEmployee = yield Payroll_1.PayrollEmployee.findById(id);
        if (!currentEmployee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        // Update employee with only payment fields
        const updatedEmployee = yield Payroll_1.PayrollEmployee.findByIdAndUpdate(id, paymentUpdateData, { new: true });
        // Create history record for the current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        // Check if history record already exists for this month
        const existingHistory = yield Payroll_1.PayrollHistory.findOne({
            employeeId: id,
            month: currentMonth
        });
        if (existingHistory) {
            // Update existing history record with payment data
            yield Payroll_1.PayrollHistory.findByIdAndUpdate(existingHistory._id, Object.assign(Object.assign({}, paymentUpdateData), { year: now.getFullYear() }));
        }
        else {
            // Create new history record with payment data only
            const historyData = Object.assign({ employeeId: id, month: currentMonth, year: now.getFullYear(), sponsor: currentEmployee.sponsor }, paymentUpdateData);
            yield Payroll_1.PayrollHistory.create(historyData);
        }
        res.json(updatedEmployee);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updatePayrollPayment = updatePayrollPayment;
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
        const history = yield Payroll_1.PayrollHistory.find().populate('employeeId', 'fullName employeeCode').sort({ month: -1 });
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
// New function to get available employees (not assigned to any project)
const getAvailableEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const availableEmployees = yield Payroll_1.PayrollEmployee.find({
            $or: [
                { currentProject: { $exists: false } },
                { currentProject: null }
            ]
        }).select('fullName employeeCode position department');
        res.json(availableEmployees);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAvailableEmployees = getAvailableEmployees;
// New function to assign employee to project
const assignEmployeeToProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId, projectId } = req.body;
        if (!employeeId || !projectId) {
            res.status(400).json({ message: 'Employee ID and Project ID are required' });
            return;
        }
        // Check if employee exists
        const employee = yield Payroll_1.PayrollEmployee.findById(employeeId);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        // Check if employee is already assigned to a project
        if (employee.currentProject) {
            res.status(400).json({
                message: 'Employee is already assigned to a project. Please unassign them first.'
            });
            return;
        }
        // Assign employee to project
        const updatedEmployee = yield Payroll_1.PayrollEmployee.findByIdAndUpdate(employeeId, {
            currentProject: projectId,
            projectAssignmentDate: new Date()
        }, { new: true });
        res.json(updatedEmployee);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.assignEmployeeToProject = assignEmployeeToProject;
// New function to unassign employee from project
const unassignEmployeeFromProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        // Check if employee exists and is assigned to a project
        const employee = yield Payroll_1.PayrollEmployee.findById(employeeId);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        if (!employee.currentProject) {
            res.status(400).json({ message: 'Employee is not assigned to any project' });
            return;
        }
        // Unassign employee from project
        const updatedEmployee = yield Payroll_1.PayrollEmployee.findByIdAndUpdate(employeeId, {
            currentProject: null,
            projectAssignmentDate: null
        }, { new: true });
        res.json(updatedEmployee);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.unassignEmployeeFromProject = unassignEmployeeFromProject;
// New function to get employees assigned to a specific project
const getEmployeesByProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const employees = yield Payroll_1.PayrollEmployee.find({ currentProject: projectId })
            .select('fullName employeeCode position department projectAssignmentDate')
            .populate('currentProject', 'customer description status');
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getEmployeesByProject = getEmployeesByProject;
// New function to get employee's current project assignment
const getEmployeeProjectAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        const employee = yield Payroll_1.PayrollEmployee.findById(employeeId)
            .select('currentProject projectAssignmentDate')
            .populate('currentProject', 'customer description status startTime endTime');
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
exports.getEmployeeProjectAssignment = getEmployeeProjectAssignment;
