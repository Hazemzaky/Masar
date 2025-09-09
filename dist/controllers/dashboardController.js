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
exports.debugExpiringContracts = exports.getCashFlowStatement = exports.getBalanceSheet = exports.getIncomeStatement = exports.getKPIs = exports.getSummary = exports.getDashboardSummary = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const User_1 = __importDefault(require("../models/User"));
const Asset_1 = __importDefault(require("../models/Asset"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const PurchaseRequest_1 = __importDefault(require("../models/PurchaseRequest"));
const ProcurementInvoice_1 = __importDefault(require("../models/ProcurementInvoice"));
const Client_1 = __importDefault(require("../models/Client"));
const BusinessTrip_1 = __importDefault(require("../models/BusinessTrip"));
const Training_1 = __importDefault(require("../models/Training"));
const Payroll_1 = __importDefault(require("../models/Payroll"));
const FuelLog_1 = __importDefault(require("../models/FuelLog"));
const GeneralLedgerEntry_1 = __importDefault(require("../models/GeneralLedgerEntry"));
const ReconciliationSession_1 = __importDefault(require("../models/ReconciliationSession"));
const Leave_1 = __importDefault(require("../models/Leave"));
const Reimbursement_1 = __importDefault(require("../models/Reimbursement"));
const RiskAssessment_1 = __importDefault(require("../models/RiskAssessment"));
const TravelAuthorization_1 = __importDefault(require("../models/TravelAuthorization"));
const GovernmentDocument_1 = __importDefault(require("../models/GovernmentDocument"));
const LegalCase_1 = __importDefault(require("../models/LegalCase"));
const GoodsReceipt_1 = __importDefault(require("../models/GoodsReceipt"));
// Helper to get date range from query or default to current financial year
function getDateRange(req) {
    let { start, end } = req.query;
    let startDate, endDate;
    if (start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
    }
    else {
        // Default: current financial year (Apr 1 - Mar 31)
        const now = new Date();
        const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        startDate = new Date(`${year}-04-01T00:00:00.000Z`);
        endDate = new Date(`${year + 1}-03-31T23:59:59.999Z`);
    }
    return { startDate, endDate };
}
// Individual Data Source Services - Clean Architecture Approach
// Each service handles one specific data source for better maintainability
function getRevenueData(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const invoiceData = yield Invoice_1.default.aggregate([
                { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return ((_a = invoiceData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Revenue data fetch failed:', error);
            return 0;
        }
    });
}
function getExpenseData(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const expenseData = yield Expense_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return ((_a = expenseData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Expense data fetch failed:', error);
            return 0;
        }
    });
}
function getAssetRentalRevenue(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const assetData = yield Asset_1.default.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, bookValue: { $sum: '$bookValue' } } }
            ]);
            // Calculate rental revenue as 2% of book value
            const bookValue = ((_a = assetData[0]) === null || _a === void 0 ? void 0 : _a.bookValue) || 0;
            return bookValue * 0.02;
        }
        catch (error) {
            console.log('Asset rental revenue fetch failed:', error);
            return 0;
        }
    });
}
function getPayrollExpense(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const payrollData = yield Payroll_1.default.aggregate([
                { $match: { runDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$netPay' } } }
            ]);
            return ((_a = payrollData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Payroll expense fetch failed:', error);
            return 0;
        }
    });
}
function getOperationsExpense(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const fuelLogs = yield FuelLog_1.default.aggregate([
                { $match: { dateTime: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$totalCost' } } }
            ]);
            return ((_a = fuelLogs[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Operations expense fetch failed:', error);
            return 0;
        }
    });
}
function getMaintenanceExpense(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const maintenanceData = yield Maintenance_1.default.aggregate([
                { $match: { scheduledDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$totalCost' } } }
            ]);
            return ((_a = maintenanceData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Maintenance expense fetch failed:', error);
            return 0;
        }
    });
}
function getProcurementExpense(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const procurementData = yield ProcurementInvoice_1.default.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return ((_a = procurementData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Procurement expense fetch failed:', error);
            return 0;
        }
    });
}
function getAdminExpense(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const expenseData = yield Expense_1.default.aggregate([
                { $match: {
                        category: { $in: ['admin', 'overhead', 'general'] },
                        date: { $gte: startDate, $lte: endDate }
                    } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return ((_a = expenseData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        }
        catch (error) {
            console.log('Admin expense fetch failed:', error);
            return 0;
        }
    });
}
function getSubCompaniesRevenue(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { getManualPnLEntries } = yield Promise.resolve().then(() => __importStar(require('./pnlController')));
            const mockReq = { query: {} };
            let manualEntries = [];
            const mockRes = {
                json: (data) => { manualEntries = data; },
                status: () => mockRes,
                send: () => { }
            };
            yield getManualPnLEntries(mockReq, mockRes);
            const subCompaniesEntry = manualEntries.find((entry) => entry.itemId === 'sub_companies_revenue');
            return (subCompaniesEntry === null || subCompaniesEntry === void 0 ? void 0 : subCompaniesEntry.amount) || 0;
        }
        catch (error) {
            console.log('Sub companies revenue fetch failed:', error);
            return 0;
        }
    });
}
// Main aggregation function using individual data services
function getVerticalPnLDataForDashboard(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🎯 Dashboard: Fetching data from individual services...', { startDate, endDate });
            // Fetch data from each service in parallel
            const [salesRevenue, totalExpenses, rentalRevenue, payrollExpense, operationsExpense, maintenanceExpense, procurementExpense, adminExpense, subCompaniesRevenue] = yield Promise.all([
                getRevenueData(startDate, endDate),
                getExpenseData(startDate, endDate),
                getAssetRentalRevenue(startDate, endDate),
                getPayrollExpense(startDate, endDate),
                getOperationsExpense(startDate, endDate),
                getMaintenanceExpense(startDate, endDate),
                getProcurementExpense(startDate, endDate),
                getAdminExpense(startDate, endDate),
                getSubCompaniesRevenue(startDate, endDate)
            ]);
            // Calculate final totals
            const totalRevenue = salesRevenue + rentalRevenue + subCompaniesRevenue;
            const totalOperationalExpenses = payrollExpense + operationsExpense + maintenanceExpense +
                procurementExpense + adminExpense;
            const finalExpenses = totalExpenses + totalOperationalExpenses;
            const pnlData = {
                revenue: { total: totalRevenue },
                expenses: { total: finalExpenses },
                ebitda: { total: totalRevenue - finalExpenses },
                subCompaniesRevenue: subCompaniesRevenue,
                hr: { payroll: payrollExpense, headcount: 0, attrition: 0 },
                assets: { bookValue: rentalRevenue / 0.02, utilization: 0, depreciation: 0, renewals: 0 },
                operations: { deliveries: 0, onTimePercentage: 0, deliveryCost: operationsExpense, fleetUtilization: 0 },
                maintenance: { cost: maintenanceExpense, downtime: 0 },
                procurement: { totalSpend: procurementExpense, openPOs: 0, cycleTime: 0 },
                sales: { totalSales: salesRevenue, pipeline: 0, salesMargin: 0 },
                admin: { costs: adminExpense, overheadPercentage: 0, pendingApprovals: 0 },
                hse: { incidents: 0, trainingCompliance: 0, openActions: 0 }
            };
            console.log('✅ Dashboard: Individual services data aggregation completed:', {
                totalRevenue,
                finalExpenses,
                breakdown: {
                    salesRevenue,
                    rentalRevenue,
                    subCompaniesRevenue,
                    payrollExpense,
                    operationsExpense,
                    maintenanceExpense,
                    procurementExpense,
                    adminExpense,
                    totalExpenses
                }
            });
            return pnlData;
        }
        catch (error) {
            console.error('❌ Error in individual services aggregation:', error);
            return {
                revenue: { total: 0 },
                expenses: { total: 0 },
                ebitda: { total: 0 },
                subCompaniesRevenue: 0,
                hr: { payroll: 0, headcount: 0, attrition: 0 },
                assets: { bookValue: 0, utilization: 0, depreciation: 0, renewals: 0 },
                operations: { deliveries: 0, onTimePercentage: 0, deliveryCost: 0, fleetUtilization: 0 },
                maintenance: { cost: 0, downtime: 0 },
                procurement: { totalSpend: 0, openPOs: 0, cycleTime: 0 },
                sales: { totalSales: 0, pipeline: 0, salesMargin: 0 },
                admin: { costs: 0, overheadPercentage: 0, pendingApprovals: 0 },
                hse: { incidents: 0, trainingCompliance: 0, openActions: 0 }
            };
        }
    });
}
// Enhanced Dashboard Summary with all module KPIs
const getDashboardSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { startDate, endDate } = getDateRange(req);
        // Financial KPIs - Get data from PnL Vertical Table
        const pnlData = yield getVerticalPnLDataForDashboard(startDate, endDate);
        const revenue = ((_a = pnlData.revenue) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const expenses = ((_b = pnlData.expenses) === null || _b === void 0 ? void 0 : _b.total) || 0;
        const ebitda = ((_c = pnlData.ebitda) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const subCompaniesRevenue = pnlData.subCompaniesRevenue || 0;
        console.log('Dashboard - Financial values from vertical P&L table:', { revenue, expenses, ebitda, subCompaniesRevenue });
        // Extract module data from PnL vertical table
        const hrData = pnlData.hr || { payroll: 0, headcount: 0, attrition: 0 };
        const assetsData = pnlData.assets || { bookValue: 0, utilization: 0, depreciation: 0, renewals: 0 };
        const operationsData = pnlData.operations || { deliveries: 0, onTimePercentage: 0, deliveryCost: 0, fleetUtilization: 0 };
        const maintenanceData = pnlData.maintenance || { cost: 0, downtime: 0 };
        const procurementData = pnlData.procurement || { totalSpend: 0, openPOs: 0, cycleTime: 0 };
        const salesData = pnlData.sales || { totalSales: 0, pipeline: 0, salesMargin: 0 };
        const adminData = pnlData.admin || { costs: 0, overheadPercentage: 0, pendingApprovals: 0 };
        const hseData = pnlData.hse || { incidents: 0, trainingCompliance: 0, openActions: 0 };
        // Action Center Alerts
        const [overdueInvoices, unapprovedPOs, pendingReconciliations, expiringContracts, pendingRequests] = yield Promise.all([
            // Overdue Invoices: Check for invoices with paymentStatus='overdue' or dueDate < now and status='pending'
            Invoice_1.default.countDocuments({
                $or: [
                    { paymentStatus: 'overdue' },
                    { dueDate: { $lt: new Date() }, status: 'pending' }
                ]
            }),
            // Unapproved POs: Check PurchaseRequest with status='pending' or 'sent_to_procurement'
            PurchaseRequest_1.default.countDocuments({
                status: { $in: ['pending', 'sent_to_procurement'] }
            }),
            // Pending Reconciliations: Check ReconciliationSession with status='draft' or 'in-progress'
            ReconciliationSession_1.default.countDocuments({
                status: { $in: ['draft', 'in-progress'] }
            }),
            // Expiring Contracts: Check Client contractData endDate within 30 days (including past due)
            Client_1.default.countDocuments({
                type: 'contract',
                'contractData.endDate': {
                    $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    // Removed $gte: new Date() to include contracts that are already past due
                },
                'contractData.status': { $in: ['active', 'pending'] } // Only active or pending contracts
            }),
            // Pending Requests: Count all pending requests from all modules (same as pending requests page)
            (() => __awaiter(void 0, void 0, void 0, function* () {
                const [purchaseRequests, businessTrips, leaveRequests, reimbursements, payrollPending, assetPending, maintenancePending, trainingPending, riskPending, travelAuthPending, govDocPending, legalPending, salesPending, invoicePending, expensePending, procInvoicePending, grnPending] = yield Promise.all([
                    PurchaseRequest_1.default.countDocuments({ status: { $in: ['pending', 'sent_to_procurement'] } }),
                    BusinessTrip_1.default.countDocuments({ status: { $in: ['Under Review', 'Pending'] } }),
                    Leave_1.default.countDocuments({ status: 'pending' }),
                    Reimbursement_1.default.countDocuments({ status: 'pending' }),
                    Payroll_1.default.countDocuments({ status: 'pending' }),
                    Asset_1.default.countDocuments({ status: 'pending' }),
                    Maintenance_1.default.countDocuments({ status: { $in: ['pending', 'scheduled'] } }),
                    Training_1.default.countDocuments({ 'certificates.status': 'pending_renewal' }),
                    RiskAssessment_1.default.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
                    TravelAuthorization_1.default.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
                    GovernmentDocument_1.default.countDocuments({ status: 'pending_renewal' }),
                    LegalCase_1.default.countDocuments({ status: { $in: ['open', 'pending'] } }),
                    Client_1.default.countDocuments({ type: 'quotation', 'quotationData.approvalStatus': 'pending' }),
                    Invoice_1.default.countDocuments({ status: 'pending_approval' }),
                    Expense_1.default.countDocuments({ status: 'pending_approval' }),
                    ProcurementInvoice_1.default.countDocuments({ status: 'pending' }),
                    GoodsReceipt_1.default.countDocuments({ status: 'pending' })
                ]);
                return purchaseRequests + businessTrips + leaveRequests + reimbursements +
                    payrollPending + assetPending + maintenancePending + trainingPending +
                    riskPending + travelAuthPending + govDocPending + legalPending +
                    salesPending + invoicePending + expensePending + procInvoicePending + grnPending;
            }))()
        ]);
        // Debug: Log expiring contracts query for troubleshooting
        const debugExpiringContracts = yield Client_1.default.find({
            type: 'contract',
            'contractData.endDate': {
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                // Removed $gte: new Date() to include contracts that are already past due
            },
            'contractData.status': { $in: ['active', 'pending'] }
        }).select('name contractData.endDate contractData.status');
        console.log('Debug - Expiring contracts query result:', {
            count: expiringContracts,
            contracts: debugExpiringContracts.map(c => {
                var _a, _b;
                return ({
                    name: c.name,
                    endDate: (_a = c.contractData) === null || _a === void 0 ? void 0 : _a.endDate,
                    status: (_b = c.contractData) === null || _b === void 0 ? void 0 : _b.status
                });
            })
        });
        res.json({
            financial: {
                revenue: revenue,
                expenses: expenses,
                ebitda: ebitda,
                subCompaniesRevenue: subCompaniesRevenue,
                margin: revenue ? ((revenue - expenses) / revenue * 100) : 0
            },
            hr: {
                headcount: hrData.headcount || 0,
                payroll: hrData.payroll || 0,
                attrition: hrData.attrition || 0,
                attritionRate: hrData.headcount ? (hrData.attrition / hrData.headcount * 100) : 0
            },
            assets: {
                bookValue: assetsData.bookValue || 0,
                utilization: assetsData.utilization || 0,
                depreciation: assetsData.depreciation || 0,
                renewals: assetsData.renewals || 0
            },
            operations: {
                deliveries: operationsData.deliveries || 0,
                onTimePercentage: operationsData.onTimePercentage || 0,
                deliveryCost: operationsData.deliveryCost || 0,
                fleetUtilization: operationsData.fleetUtilization || 0
            },
            maintenance: {
                cost: maintenanceData.cost || 0,
                preventiveVsCorrective: [],
                downtime: maintenanceData.downtime || 0
            },
            procurement: {
                totalSpend: procurementData.totalSpend || 0,
                topVendors: [],
                openPOs: procurementData.openPOs || 0,
                cycleTime: procurementData.cycleTime || 0
            },
            sales: {
                totalSales: salesData.totalSales || 0,
                pipeline: salesData.pipeline || 0,
                topCustomers: [],
                salesMargin: salesData.salesMargin || 0
            },
            admin: {
                costs: adminData.costs || 0,
                overheadPercentage: adminData.overheadPercentage || 0,
                pendingApprovals: adminData.pendingApprovals || 0
            },
            hse: {
                incidents: hseData.incidents || 0,
                trainingCompliance: hseData.trainingCompliance || 0,
                openActions: hseData.openActions || 0
            },
            alerts: {
                overdueInvoices: overdueInvoices || 0,
                unapprovedPOs: unapprovedPOs || 0,
                pendingReconciliations: pendingReconciliations || 0,
                expiringContracts: expiringContracts || 0,
                pendingRequests: pendingRequests || 0
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getDashboardSummary = getDashboardSummary;
// Legacy functions for backward compatibility
const getSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const totalExpenses = yield Expense_1.default.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const byCategory = yield Expense_1.default.aggregate([
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);
        const invoiceCount = yield Invoice_1.default.countDocuments();
        const userCount = yield User_1.default.countDocuments();
        const recentExpenses = yield Expense_1.default.find().sort({ date: -1 }).limit(3).select('description amount category date');
        const recentInvoices = yield Invoice_1.default.find().sort({ uploadDate: -1 }).limit(2).select('fileUrl uploadDate');
        res.json({
            total: ((_a = totalExpenses[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            byCategory,
            invoiceCount,
            userCount,
            recentActivity: [
                ...recentExpenses.map((e) => `Expense: ${e.description} (${e.category}) - $${e.amount}`),
                ...recentInvoices.map((i) => `Invoice uploaded: ${i.fileUrl}`)
            ]
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getSummary = getSummary;
const getKPIs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { startDate, endDate } = getDateRange(req);
        // Revenue: category === 'income'
        const revenueAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenue = ((_a = revenueAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Expenses: category === 'expenses'
        const expensesAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const expenses = ((_b = expensesAgg[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        // Penalties
        const penaltyAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'penalty', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const penalties = ((_c = penaltyAgg[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
        // Depreciation
        const depreciationAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'depreciation', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const depreciation = ((_d = depreciationAgg[0]) === null || _d === void 0 ? void 0 : _d.total) || 0;
        // Cash flow: income - expenses
        const cashFlow = revenue - expenses;
        // Gross profit: revenue - expenses
        const grossProfit = revenue - expenses;
        // Net profit: revenue - expenses - penalties - depreciation
        const netProfit = revenue - expenses - penalties - depreciation;
        res.json({
            revenue,
            expenses,
            penalties,
            depreciation,
            cashFlow,
            grossProfit,
            netProfit
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getKPIs = getKPIs;
const getIncomeStatement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { startDate, endDate } = getDateRange(req);
        const revenueAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenue = ((_a = revenueAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const expensesAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const expenses = ((_b = expensesAgg[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        const penaltyAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'penalty', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const penalties = ((_c = penaltyAgg[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const depreciationAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'depreciation', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const depreciation = ((_d = depreciationAgg[0]) === null || _d === void 0 ? void 0 : _d.total) || 0;
        const netProfit = revenue - expenses - penalties - depreciation;
        res.json({
            revenue,
            expenses,
            penalties,
            depreciation,
            netProfit
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getIncomeStatement = getIncomeStatement;
const getBalanceSheet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        // Get assets from Asset model
        const assets = yield Asset_1.default.aggregate([
            { $group: { _id: null, total: { $sum: '$bookValue' } } }
        ]);
        // Get cash from GL entries
        const cash = yield GeneralLedgerEntry_1.default.aggregate([
            { $match: { accountCode: { $regex: /^1000/ } } }, // Cash accounts
            { $group: { _id: null, total: { $sum: { $subtract: ['$debit', '$credit'] } } } }
        ]);
        // Get receivables from GL entries
        const receivables = yield GeneralLedgerEntry_1.default.aggregate([
            { $match: { accountCode: { $regex: /^1100/ } } }, // Receivable accounts
            { $group: { _id: null, total: { $sum: { $subtract: ['$debit', '$credit'] } } } }
        ]);
        // Get payables from GL entries
        const payables = yield GeneralLedgerEntry_1.default.aggregate([
            { $match: { accountCode: { $regex: /^2000/ } } }, // Payable accounts
            { $group: { _id: null, total: { $sum: { $subtract: ['$credit', '$debit'] } } } }
        ]);
        const totalAssets = ((_a = assets[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const totalLiabilities = ((_b = payables[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        const workingCapital = (((_c = cash[0]) === null || _c === void 0 ? void 0 : _c.total) || 0) + (((_d = receivables[0]) === null || _d === void 0 ? void 0 : _d.total) || 0) - (((_e = payables[0]) === null || _e === void 0 ? void 0 : _e.total) || 0);
        const equity = totalAssets - totalLiabilities;
        res.json({
            assets: {
                total: totalAssets,
                cash: ((_f = cash[0]) === null || _f === void 0 ? void 0 : _f.total) || 0,
                receivables: ((_g = receivables[0]) === null || _g === void 0 ? void 0 : _g.total) || 0,
                fixedAssets: totalAssets - (((_h = cash[0]) === null || _h === void 0 ? void 0 : _h.total) || 0) - (((_j = receivables[0]) === null || _j === void 0 ? void 0 : _j.total) || 0)
            },
            liabilities: {
                total: totalLiabilities,
                payables: ((_k = payables[0]) === null || _k === void 0 ? void 0 : _k.total) || 0
            },
            equity: equity,
            workingCapital: workingCapital
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getBalanceSheet = getBalanceSheet;
const getCashFlowStatement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { startDate, endDate } = getDateRange(req);
        // Inflows: income
        const inflowAgg = yield Expense_1.default.aggregate([
            { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const inflows = ((_a = inflowAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Outflows: expenses + penalty + depreciation
        const outflowAgg = yield Expense_1.default.aggregate([
            { $match: { category: { $in: ['expenses', 'penalty', 'depreciation'] }, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const outflows = ((_b = outflowAgg[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        const netCashFlow = inflows - outflows;
        // Get opening balance from previous period
        const previousPeriodEnd = new Date(startDate);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        const openingBalance = yield GeneralLedgerEntry_1.default.aggregate([
            { $match: { transactionDate: { $lte: previousPeriodEnd } } },
            { $group: { _id: null, total: { $sum: { $subtract: ['$debit', '$credit'] } } } }
        ]);
        const closingBalance = (((_c = openingBalance[0]) === null || _c === void 0 ? void 0 : _c.total) || 0) + netCashFlow;
        res.json({
            openingBalance: ((_d = openingBalance[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
            inflows,
            outflows,
            netCashFlow,
            closingBalance
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getCashFlowStatement = getCashFlowStatement;
// Debug endpoint to check expiring contracts
const debugExpiringContracts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.log('Debug - Date range:', {
            now: now.toISOString(),
            thirtyDaysFromNow: thirtyDaysFromNow.toISOString()
        });
        // Get all contract clients
        const allContractClients = yield Client_1.default.find({ type: 'contract' }).select('name contractData');
        // Get expiring contracts (including past due contracts within 30 days)
        const expiringContracts = yield Client_1.default.find({
            type: 'contract',
            'contractData.endDate': {
                $lte: thirtyDaysFromNow
                // Removed $gte: now to include contracts that are already past due
            },
            'contractData.status': { $in: ['active', 'pending'] }
        }).select('name contractData.endDate contractData.status');
        res.json({
            debug: {
                now: now.toISOString(),
                thirtyDaysFromNow: thirtyDaysFromNow.toISOString(),
                totalContractClients: allContractClients.length,
                allContractClients: allContractClients.map(c => {
                    var _a, _b;
                    return ({
                        name: c.name,
                        endDate: (_a = c.contractData) === null || _a === void 0 ? void 0 : _a.endDate,
                        status: (_b = c.contractData) === null || _b === void 0 ? void 0 : _b.status
                    });
                }),
                expiringContracts: expiringContracts.map(c => {
                    var _a, _b;
                    return ({
                        name: c.name,
                        endDate: (_a = c.contractData) === null || _a === void 0 ? void 0 : _a.endDate,
                        status: (_b = c.contractData) === null || _b === void 0 ? void 0 : _b.status
                    });
                })
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.debugExpiringContracts = debugExpiringContracts;
