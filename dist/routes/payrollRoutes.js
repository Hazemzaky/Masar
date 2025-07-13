"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payrollController_1 = require("../controllers/payrollController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// New Payroll Employee Management Routes
router.post('/employees', payrollController_1.createPayrollEmployee);
router.get('/employees', payrollController_1.getPayrollEmployees);
router.get('/employees/:id', payrollController_1.getPayrollEmployee);
router.put('/employees/:id', payrollController_1.updatePayrollEmployee);
router.delete('/employees/:id', payrollController_1.deletePayrollEmployee);
// Payroll History Routes
router.get('/history', payrollController_1.getPayrollHistory);
router.get('/history/:employeeId', payrollController_1.getEmployeePayrollHistory);
// Monthly Payroll Update Route
router.post('/update-monthly', payrollController_1.updateMonthlyPayroll);
// Legacy Payroll Routes (for backward compatibility)
router.post('/', payrollController_1.createPayroll);
router.get('/', payrollController_1.getPayrolls);
router.get('/:id', payrollController_1.getPayroll);
router.put('/:id', payrollController_1.updatePayroll);
router.post('/:id/process', payrollController_1.processPayroll);
exports.default = router;
