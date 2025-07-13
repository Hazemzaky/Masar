"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const assetRoutes_1 = __importDefault(require("./routes/assetRoutes"));
const assetCategoryRoutes_1 = __importDefault(require("./routes/assetCategoryRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const fuelLogRoutes_1 = __importDefault(require("./routes/fuelLogRoutes"));
const driverHourRoutes_1 = __importDefault(require("./routes/driverHourRoutes"));
const leaveRoutes_1 = __importDefault(require("./routes/leaveRoutes"));
const payrollRoutes_1 = __importDefault(require("./routes/payrollRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const procurementRoutes_1 = __importDefault(require("./routes/procurementRoutes"));
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const journalEntryRoutes_1 = __importDefault(require("./routes/journalEntryRoutes"));
const periodRoutes_1 = __importDefault(require("./routes/periodRoutes"));
const depreciationRoutes_1 = __importDefault(require("./routes/depreciationRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const hseRoutes_1 = __importDefault(require("./routes/hseRoutes"));
const travelRequestRoutes_1 = __importDefault(require("./routes/travelRequestRoutes"));
const travelAuthorizationRoutes_1 = __importDefault(require("./routes/travelAuthorizationRoutes"));
const travelRoutes_1 = __importDefault(require("./routes/travelRoutes"));
const reimbursementRoutes_1 = __importDefault(require("./routes/reimbursementRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
// Import payroll update function
const payrollController_1 = require("./controllers/payrollController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: ((_a = process.env.CORS_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/employees', employeeRoutes_1.default);
app.use('/expenses', expenseRoutes_1.default);
app.use('/assets', assetRoutes_1.default);
app.use('/asset-categories', assetCategoryRoutes_1.default);
app.use('/maintenance', maintenanceRoutes_1.default);
app.use('/fuel-logs', fuelLogRoutes_1.default);
app.use('/driver-hours', driverHourRoutes_1.default);
app.use('/leaves', leaveRoutes_1.default);
app.use('/payroll', payrollRoutes_1.default);
app.use('/projects', projectRoutes_1.default);
app.use('/procurement', procurementRoutes_1.default);
app.use('/budgets', budgetRoutes_1.default);
app.use('/dashboard', dashboardRoutes_1.default);
app.use('/accounts', accountRoutes_1.default);
app.use('/journal-entries', journalEntryRoutes_1.default);
app.use('/periods', periodRoutes_1.default);
app.use('/depreciation', depreciationRoutes_1.default);
app.use('/invoices', invoiceRoutes_1.default);
app.use('/inventory', inventoryRoutes_1.default);
app.use('/hse', hseRoutes_1.default);
app.use('/travel-requests', travelRequestRoutes_1.default);
app.use('/travel-authorizations', travelAuthorizationRoutes_1.default);
app.use('/travel', travelRoutes_1.default);
app.use('/reimbursements', reimbursementRoutes_1.default);
app.use('/admin', adminRoutes_1.default);
// Scheduled task for monthly payroll update (runs on 24th of each month)
const scheduleMonthlyPayrollUpdate = () => {
    const now = new Date();
    const currentDay = now.getDate();
    // Check if it's the 24th of the month
    if (currentDay === 24) {
        console.log('Running scheduled monthly payroll update...');
        // Create a mock request and response for the update function
        const mockReq = {
            body: {}
        };
        const mockRes = {
            json: (data) => {
                console.log('Monthly payroll update result:', data);
            },
            status: (code) => ({
                json: (data) => {
                    console.error('Monthly payroll update error:', data);
                }
            })
        };
        (0, payrollController_1.updateMonthlyPayroll)(mockReq, mockRes);
    }
};
// Run the check every hour
setInterval(scheduleMonthlyPayrollUpdate, 60 * 60 * 1000);
// Also run it once when the server starts to check if it's the 24th
scheduleMonthlyPayrollUpdate();
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
