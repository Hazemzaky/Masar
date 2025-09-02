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
exports.getCashFlowStatement = exports.getBalanceSheet = exports.getIncomeStatement = exports.getKPIs = exports.getSummary = exports.getDashboardSummary = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const User_1 = __importDefault(require("../models/User"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Asset_1 = __importDefault(require("../models/Asset"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const PurchaseRequest_1 = __importDefault(require("../models/PurchaseRequest"));
const PurchaseOrder_1 = __importDefault(require("../models/PurchaseOrder"));
const ProcurementInvoice_1 = __importDefault(require("../models/ProcurementInvoice"));
const BusinessTrip_1 = __importDefault(require("../models/BusinessTrip"));
const Incident_1 = __importDefault(require("../models/Incident"));
const Training_1 = __importDefault(require("../models/Training"));
const Payroll_1 = __importDefault(require("../models/Payroll"));
const FuelLog_1 = __importDefault(require("../models/FuelLog"));
const GeneralLedgerEntry_1 = __importDefault(require("../models/GeneralLedgerEntry"));
const Contract_1 = __importDefault(require("../models/Contract"));
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
// Enhanced Dashboard Summary with all module KPIs
const getDashboardSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    try {
        const { startDate, endDate } = getDateRange(req);
        // Financial KPIs
        const [revenue, expenses, grossProfit, netProfit] = yield Promise.all([
            Expense_1.default.aggregate([
                { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense_1.default.aggregate([
                { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense_1.default.aggregate([
                { $match: { category: { $in: ['income', 'expenses'] }, date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } }
            ]),
            Expense_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$category', 'income'] }, '$amount', { $multiply: ['$amount', -1] }] } } } }
            ])
        ]);
        // HR KPIs
        const [headcount, payroll, attrition] = yield Promise.all([
            Employee_1.default.countDocuments({ status: 'active' }),
            Payroll_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Employee_1.default.countDocuments({ status: 'terminated' })
        ]);
        // Assets KPIs
        const [bookValue, utilization, depreciation, renewals] = yield Promise.all([
            Asset_1.default.aggregate([
                { $group: { _id: null, total: { $sum: '$bookValue' } } }
            ]),
            Asset_1.default.aggregate([
                { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
            ]),
            Asset_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$depreciationAmount' } } }
            ]),
            Asset_1.default.countDocuments({ status: 'renewal_required' })
        ]);
        // Operations KPIs
        const [deliveries, onTimePercentage, deliveryCost, fleetUtilization] = yield Promise.all([
            BusinessTrip_1.default.countDocuments({ status: 'Completed', date: { $gte: startDate, $lte: endDate } }),
            BusinessTrip_1.default.aggregate([
                { $match: { status: 'Completed', date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, onTime: { $sum: { $cond: [{ $lte: ['$actualReturnDate', '$returnDate'] }, 1, 0] } }, total: { $sum: 1 } } }
            ]),
            FuelLog_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]),
            Asset_1.default.aggregate([
                { $match: { type: 'vehicle' } },
                { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
            ])
        ]);
        // Maintenance KPIs
        const [maintenanceCost, preventiveVsCorrective, downtime] = yield Promise.all([
            Maintenance_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]),
            Maintenance_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Maintenance_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$downtimeHours' } } }
            ])
        ]);
        // Procurement KPIs
        const [totalSpend, topVendors, openPOs, cycleTime] = yield Promise.all([
            ProcurementInvoice_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            ProcurementInvoice_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$vendor', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } },
                { $limit: 5 }
            ]),
            PurchaseOrder_1.default.countDocuments({ status: 'open' }),
            PurchaseRequest_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, avgCycleTime: { $avg: { $subtract: ['$approvedDate', '$date'] } } } }
            ])
        ]);
        // Sales KPIs
        const [totalSales, pipeline, topCustomers, salesMargin] = yield Promise.all([
            Invoice_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Invoice_1.default.countDocuments({ status: 'pending' }),
            Invoice_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$client', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } },
                { $limit: 5 }
            ]),
            Invoice_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, avgMargin: { $avg: '$margin' } } }
            ])
        ]);
        // Admin KPIs
        const [adminCosts, overheadPercentage, pendingApprovals] = yield Promise.all([
            Expense_1.default.aggregate([
                { $match: { category: 'admin', date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            PurchaseRequest_1.default.countDocuments({ status: 'pending' })
        ]);
        // HSE KPIs
        const [incidents, trainingCompliance, openActions] = yield Promise.all([
            Incident_1.default.countDocuments({ date: { $gte: startDate, $lte: endDate } }),
            Training_1.default.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, compliance: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
            ]),
            Incident_1.default.countDocuments({ status: 'open' })
        ]);
        // Action Center Alerts
        const [overdueInvoices, unapprovedPOs, pendingReconciliations, expiringContracts, pendingRequests] = yield Promise.all([
            Invoice_1.default.countDocuments({ dueDate: { $lt: new Date() }, status: 'pending' }),
            PurchaseOrder_1.default.countDocuments({ status: 'pending_approval' }),
            GeneralLedgerEntry_1.default.countDocuments({ status: 'pending_reconciliation' }),
            Contract_1.default.countDocuments({ expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
            PurchaseRequest_1.default.countDocuments({ status: 'pending' })
        ]);
        res.json({
            financial: {
                revenue: ((_a = revenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                expenses: ((_b = expenses[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
                grossProfit: ((_c = grossProfit[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
                netProfit: ((_d = netProfit[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
                margin: ((_e = revenue[0]) === null || _e === void 0 ? void 0 : _e.total) ? ((((_f = netProfit[0]) === null || _f === void 0 ? void 0 : _f.total) || 0) / ((_g = revenue[0]) === null || _g === void 0 ? void 0 : _g.total) * 100) : 0
            },
            hr: {
                headcount: headcount || 0,
                payroll: ((_h = payroll[0]) === null || _h === void 0 ? void 0 : _h.total) || 0,
                attrition: attrition || 0,
                attritionRate: headcount ? (attrition / headcount * 100) : 0
            },
            assets: {
                bookValue: ((_j = bookValue[0]) === null || _j === void 0 ? void 0 : _j.total) || 0,
                utilization: ((_k = utilization[0]) === null || _k === void 0 ? void 0 : _k.avgUtilization) || 0,
                depreciation: ((_l = depreciation[0]) === null || _l === void 0 ? void 0 : _l.total) || 0,
                renewals: renewals || 0
            },
            operations: {
                deliveries: deliveries || 0,
                onTimePercentage: ((_m = onTimePercentage[0]) === null || _m === void 0 ? void 0 : _m.total) ? (onTimePercentage[0].onTime / onTimePercentage[0].total * 100) : 0,
                deliveryCost: ((_o = deliveryCost[0]) === null || _o === void 0 ? void 0 : _o.total) || 0,
                fleetUtilization: ((_p = fleetUtilization[0]) === null || _p === void 0 ? void 0 : _p.avgUtilization) || 0
            },
            maintenance: {
                cost: ((_q = maintenanceCost[0]) === null || _q === void 0 ? void 0 : _q.total) || 0,
                preventiveVsCorrective: preventiveVsCorrective || [],
                downtime: ((_r = downtime[0]) === null || _r === void 0 ? void 0 : _r.total) || 0
            },
            procurement: {
                totalSpend: ((_s = totalSpend[0]) === null || _s === void 0 ? void 0 : _s.total) || 0,
                topVendors: topVendors || [],
                openPOs: openPOs || 0,
                cycleTime: ((_t = cycleTime[0]) === null || _t === void 0 ? void 0 : _t.avgCycleTime) || 0
            },
            sales: {
                totalSales: ((_u = totalSales[0]) === null || _u === void 0 ? void 0 : _u.total) || 0,
                pipeline: pipeline || 0,
                topCustomers: topCustomers || [],
                salesMargin: ((_v = salesMargin[0]) === null || _v === void 0 ? void 0 : _v.avgMargin) || 0
            },
            admin: {
                costs: ((_w = adminCosts[0]) === null || _w === void 0 ? void 0 : _w.total) || 0,
                overheadPercentage: ((_x = adminCosts[0]) === null || _x === void 0 ? void 0 : _x.total) && ((_y = expenses[0]) === null || _y === void 0 ? void 0 : _y.total) ? (adminCosts[0].total / expenses[0].total * 100) : 0,
                pendingApprovals: pendingApprovals || 0
            },
            hse: {
                incidents: incidents || 0,
                trainingCompliance: ((_z = trainingCompliance[0]) === null || _z === void 0 ? void 0 : _z.compliance) || 0,
                openActions: openActions || 0
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
