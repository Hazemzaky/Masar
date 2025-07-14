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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const journalEntryRoutes_1 = __importDefault(require("./routes/journalEntryRoutes"));
const periodRoutes_1 = __importDefault(require("./routes/periodRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const fuelLogRoutes_1 = __importDefault(require("./routes/fuelLogRoutes"));
const driverHourRoutes_1 = __importDefault(require("./routes/driverHourRoutes"));
const assetRoutes_1 = __importDefault(require("./routes/assetRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const depreciationRoutes_1 = __importDefault(require("./routes/depreciationRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const payrollRoutes_1 = __importDefault(require("./routes/payrollRoutes"));
const reimbursementRoutes_1 = __importDefault(require("./routes/reimbursementRoutes"));
const leaveRoutes_1 = __importDefault(require("./routes/leaveRoutes"));
const hseRoutes_1 = __importDefault(require("./routes/hseRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const procurementRoutes_1 = __importDefault(require("./routes/procurementRoutes"));
const travelRoutes_1 = __importDefault(require("./routes/travelRoutes"));
const travelRequestRoutes_1 = __importDefault(require("./routes/travelRequestRoutes"));
const travelAuthorizationRoutes_1 = __importDefault(require("./routes/travelAuthorizationRoutes"));
const assetCategoryRoutes_1 = __importDefault(require("./routes/assetCategoryRoutes"));
const foodAllowanceRoutes_1 = __importDefault(require("./routes/foodAllowanceRoutes"));
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/financedb';
// Connect to MongoDB
mongoose_1.default.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
});
// CORS configuration
app.use((0, cors_1.default)({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
app.get('/', (req, res) => {
    res.send('Financial Management API is running');
});
// Debug route to test if the server is working
app.get('/debug', (req, res) => {
    res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        routes: [
            '/api/auth',
            '/api/expenses',
            '/api/dashboard',
            '/api/budgets',
            '/api/accounts',
            '/api/projects',
            '/api/employees',
            '/api/assets',
            '/api/inventory',
            '/api/payroll',
            '/api/leave',
            '/api/reimbursements'
        ]
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/expenses', expenseRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/budgets', budgetRoutes_1.default);
app.use('/api/accounts', accountRoutes_1.default);
app.use('/api/journal-entries', journalEntryRoutes_1.default);
app.use('/api/periods', periodRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/fuel-logs', fuelLogRoutes_1.default);
app.use('/api/driver-hours', driverHourRoutes_1.default);
app.use('/api/assets', assetRoutes_1.default);
app.use('/api/maintenance', maintenanceRoutes_1.default);
app.use('/api/depreciation', depreciationRoutes_1.default);
app.use('/api/inventory', inventoryRoutes_1.default);
app.use('/api/employees', employeeRoutes_1.default);
app.use('/api/payroll', payrollRoutes_1.default);
app.use('/api/reimbursements', reimbursementRoutes_1.default);
app.use('/api/leave', leaveRoutes_1.default);
app.use('/api/hse', hseRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/procurement', procurementRoutes_1.default);
app.use('/api/travel', travelRoutes_1.default);
app.use('/api/travel-requests', travelRequestRoutes_1.default);
app.use('/api/travel-authorizations', travelAuthorizationRoutes_1.default);
app.use('/api/asset-categories', assetCategoryRoutes_1.default);
app.use('/api/food-allowance', foodAllowanceRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
