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
const Employee_1 = __importDefault(require("../models/Employee"));
const Asset_1 = __importDefault(require("../models/Asset"));
const AssetPass_1 = __importDefault(require("../models/AssetPass"));
const Project_1 = __importDefault(require("../models/Project"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const PurchaseRequest_1 = __importDefault(require("../models/PurchaseRequest"));
const PurchaseOrder_1 = __importDefault(require("../models/PurchaseOrder"));
const ProcurementInvoice_1 = __importDefault(require("../models/ProcurementInvoice"));
const Vendor_1 = __importDefault(require("../models/Vendor"));
const Client_1 = __importDefault(require("../models/Client"));
const Quotation_1 = __importDefault(require("../models/Quotation"));
const BusinessTrip_1 = __importDefault(require("../models/BusinessTrip"));
const Training_1 = __importDefault(require("../models/Training"));
const Accident_1 = __importDefault(require("../models/Accident"));
const NearMiss_1 = __importDefault(require("../models/NearMiss"));
const SafetyInspection_1 = __importDefault(require("../models/SafetyInspection"));
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
function getHREmployeeStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get total headcount
            const totalHeadcount = yield Employee_1.default.countDocuments();
            // Get active employees
            const activeEmployees = yield Employee_1.default.countDocuments({
                active: true,
                status: 'active'
            });
            // Get employees on leave
            const onLeaveEmployees = yield Employee_1.default.countDocuments({
                status: 'on-leave'
            });
            // Note: Attrition rate calculation removed as requested
            return {
                headcount: totalHeadcount,
                activeEmployees,
                onLeaveEmployees
            };
        }
        catch (error) {
            console.log('HR employee stats fetch failed:', error);
            return {
                headcount: 0,
                activeEmployees: 0,
                onLeaveEmployees: 0
            };
        }
    });
}
function getAssetStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get total number of assets
            const totalAssets = yield Asset_1.default.countDocuments();
            // Calculate total book value as of current date
            const assets = yield Asset_1.default.find({ status: 'active' });
            const currentDate = new Date();
            let totalBookValue = 0;
            for (const asset of assets) {
                // Calculate book value for current date
                const purchaseDate = new Date(asset.purchaseDate);
                const usefulLifeMonths = asset.usefulLifeMonths;
                const purchaseValue = asset.purchaseValue;
                const salvageValue = asset.salvageValue;
                // Calculate months since purchase
                const monthsSincePurchase = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
                    (currentDate.getMonth() - purchaseDate.getMonth());
                // Calculate depreciation
                const totalDepreciation = Math.min(monthsSincePurchase, usefulLifeMonths) *
                    (purchaseValue - salvageValue) / usefulLifeMonths;
                const bookValue = Math.max(purchaseValue - totalDepreciation, salvageValue);
                totalBookValue += bookValue;
            }
            // Get renewals required from AssetPass model (expiring within 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const renewalsRequired = yield AssetPass_1.default.countDocuments({
                expiryDate: {
                    $gte: currentDate,
                    $lte: thirtyDaysFromNow
                }
            });
            return {
                totalAssets,
                totalBookValue,
                renewalsRequired
            };
        }
        catch (error) {
            console.log('Asset stats fetch failed:', error);
            return {
                totalAssets: 0,
                totalBookValue: 0,
                renewalsRequired: 0
            };
        }
    });
}
function getOperationsStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get total callouts (projects with rentType: 'call_out')
            const totalCallouts = yield Project_1.default.countDocuments({
                rentType: 'call_out'
            });
            // Get total orders (all projects)
            const totalOrders = yield Project_1.default.countDocuments();
            // Get cancelled orders (projects with status: 'cancelled')
            const cancelledOrders = yield Project_1.default.countDocuments({
                status: 'cancelled'
            });
            console.log('Operations stats:', { totalCallouts, totalOrders, cancelledOrders });
            return {
                totalCallouts,
                totalOrders,
                cancelledOrders
            };
        }
        catch (error) {
            console.log('Operations stats fetch failed:', error);
            return {
                totalCallouts: 0,
                totalOrders: 0,
                cancelledOrders: 0
            };
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
function getTotalMaintenanceHours() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Calculate total maintenance hours from all maintenance records (not just completed)
            // Include scheduled, in_progress, and completed statuses
            const maintenanceHoursData = yield Maintenance_1.default.aggregate([
                {
                    $match: {
                        status: { $in: ['scheduled', 'in_progress', 'completed'] },
                        totalMaintenanceTime: { $gt: 0 } // Only include records with actual time
                    }
                },
                { $group: { _id: null, totalHours: { $sum: '$totalMaintenanceTime' } } }
            ]);
            const totalHours = ((_a = maintenanceHoursData[0]) === null || _a === void 0 ? void 0 : _a.totalHours) || 0;
            // Debug: Get breakdown by status
            const statusBreakdown = yield Maintenance_1.default.aggregate([
                {
                    $match: {
                        status: { $in: ['scheduled', 'in_progress', 'completed'] },
                        totalMaintenanceTime: { $gt: 0 }
                    }
                },
                { $group: { _id: '$status', totalHours: { $sum: '$totalMaintenanceTime' }, count: { $sum: 1 } } }
            ]);
            console.log('Maintenance hours calculation:', {
                totalHours,
                statusBreakdown,
                totalRecords: statusBreakdown.reduce((sum, item) => sum + item.count, 0)
            });
            return totalHours;
        }
        catch (error) {
            console.log('Total maintenance hours fetch failed:', error);
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
function getActiveDocumentsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count active government documents
            const activeDocuments = yield GovernmentDocument_1.default.countDocuments({
                status: { $in: ['active', 'valid', 'current'] }
            });
            return activeDocuments;
        }
        catch (error) {
            console.log('Active documents count fetch failed:', error);
            return 0;
        }
    });
}
function getOpenLegalCasesCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count open legal cases
            const openLegalCases = yield LegalCase_1.default.countDocuments({
                status: { $in: ['open', 'pending', 'in_progress'] }
            });
            return openLegalCases;
        }
        catch (error) {
            console.log('Open legal cases count fetch failed:', error);
            return 0;
        }
    });
}
function getExpiryDocumentsNext30Days() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentDate = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            // Count government documents expiring in next 30 days
            const expiringDocuments = yield GovernmentDocument_1.default.countDocuments({
                expiryDate: {
                    $gte: currentDate,
                    $lte: thirtyDaysFromNow
                },
                status: { $in: ['active', 'valid', 'current'] }
            });
            return expiringDocuments;
        }
        catch (error) {
            console.log('Expiry documents count fetch failed:', error);
            return 0;
        }
    });
}
function getTotalIncidentsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count total incidents from Accident model
            const totalIncidents = yield Accident_1.default.countDocuments();
            return totalIncidents || 0;
        }
        catch (error) {
            console.log('Total incidents count fetch failed:', error);
            return 0;
        }
    });
}
function getOverdueInspectionsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count overdue inspections using same logic as HSE page
            const currentDate = new Date();
            const inspections = yield SafetyInspection_1.default.find({});
            // Filter inspections that are overdue (same logic as HSE page)
            const overdueInspections = inspections.filter(i => i.status === 'overdue' ||
                (i.nextInspectionDate && new Date(i.nextInspectionDate) < currentDate)).length;
            console.log('Overdue inspections calculation:', {
                totalInspections: inspections.length,
                overdueCount: overdueInspections,
                currentDate: currentDate.toISOString()
            });
            return overdueInspections || 0;
        }
        catch (error) {
            console.log('Overdue inspections count fetch failed:', error);
            return 0;
        }
    });
}
function getNearMissLogCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count near miss logs from NearMiss model
            const nearMissCount = yield NearMiss_1.default.countDocuments();
            return nearMissCount || 0;
        }
        catch (error) {
            console.log('Near miss log count fetch failed:', error);
            return 0;
        }
    });
}
function getTotalPurchaseRequestsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count total purchase requests
            const totalPurchaseRequests = yield PurchaseRequest_1.default.countDocuments();
            return totalPurchaseRequests || 0;
        }
        catch (error) {
            console.log('Total purchase requests count fetch failed:', error);
            return 0;
        }
    });
}
function getTotalPurchaseOrdersCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count total purchase orders
            const totalPurchaseOrders = yield PurchaseOrder_1.default.countDocuments();
            return totalPurchaseOrders || 0;
        }
        catch (error) {
            console.log('Total purchase orders count fetch failed:', error);
            return 0;
        }
    });
}
function getTotalVendorsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count total vendors
            const totalVendors = yield Vendor_1.default.countDocuments();
            return totalVendors || 0;
        }
        catch (error) {
            console.log('Total vendors count fetch failed:', error);
            return 0;
        }
    });
}
function getTotalQuotationsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count total quotations
            const totalQuotations = yield Quotation_1.default.countDocuments();
            return totalQuotations || 0;
        }
        catch (error) {
            console.log('Total quotations count fetch failed:', error);
            return 0;
        }
    });
}
function getPendingQuotationsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count pending quotations - using more common status values
            const pendingQuotations = yield Quotation_1.default.countDocuments({
                $or: [
                    { status: { $in: ['Draft', 'draft', 'Pending', 'pending', 'Sent', 'sent'] } },
                    { approvalStatus: { $in: ['pending', 'Pending', 'draft', 'Draft'] } }
                ]
            });
            return pendingQuotations || 0;
        }
        catch (error) {
            console.log('Pending quotations count fetch failed:', error);
            return 0;
        }
    });
}
function getTotalClientsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Count total clients
            const totalClients = yield Client_1.default.countDocuments();
            return totalClients || 0;
        }
        catch (error) {
            console.log('Total clients count fetch failed:', error);
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
        var _a;
        try {
            console.log('🎯 Dashboard: Fetching data from individual services...', { startDate, endDate });
            // Fetch data from each service in parallel
            const [salesRevenue, totalExpenses, rentalRevenue, payrollExpense, operationsExpense, maintenanceExpense, procurementExpense, adminExpense, subCompaniesRevenue, hrStats, assetStats, operationsStats, activeDocuments, openLegalCases, expiryDocuments, totalIncidents, overdueInspections, nearMissLog, totalPurchaseRequests, totalPurchaseOrders, totalVendors, totalQuotations, pendingQuotations, totalClients, totalMaintenanceHours] = yield Promise.all([
                getRevenueData(startDate, endDate),
                getExpenseData(startDate, endDate),
                getAssetRentalRevenue(startDate, endDate),
                getPayrollExpense(startDate, endDate),
                getOperationsExpense(startDate, endDate),
                getMaintenanceExpense(startDate, endDate),
                getProcurementExpense(startDate, endDate),
                getAdminExpense(startDate, endDate),
                getSubCompaniesRevenue(startDate, endDate),
                getHREmployeeStats(),
                getAssetStats(),
                getOperationsStats(),
                getActiveDocumentsCount(),
                getOpenLegalCasesCount(),
                getExpiryDocumentsNext30Days(),
                getTotalIncidentsCount(),
                getOverdueInspectionsCount(),
                getNearMissLogCount(),
                getTotalPurchaseRequestsCount(),
                getTotalPurchaseOrdersCount(),
                getTotalVendorsCount(),
                getTotalQuotationsCount(),
                getPendingQuotationsCount(),
                getTotalClientsCount(),
                getTotalMaintenanceHours()
            ]);
            console.log('Dashboard operations stats received:', operationsStats);
            // Calculate final totals
            const totalRevenue = salesRevenue + rentalRevenue + subCompaniesRevenue;
            const totalOperationalExpenses = payrollExpense + operationsExpense + maintenanceExpense +
                procurementExpense + adminExpense;
            const finalExpenses = totalExpenses + totalOperationalExpenses;
            // Calculate depreciation for the period
            const depreciationData = yield Asset_1.default.aggregate([
                {
                    $match: {
                        purchaseDate: { $lte: endDate }
                    }
                },
                {
                    $project: {
                        monthlyDepreciation: { $divide: ['$purchaseValue', { $multiply: ['$usefulLifeMonths', 1] }] },
                        monthsInPeriod: {
                            $cond: {
                                if: { $gte: ['$purchaseDate', startDate] },
                                then: { $divide: [{ $subtract: [endDate, '$purchaseDate'] }, 1000 * 60 * 60 * 24 * 30] },
                                else: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24 * 30] }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        depreciation: { $sum: { $multiply: ['$monthlyDepreciation', '$monthsInPeriod'] } }
                    }
                }
            ]);
            const depreciation = ((_a = depreciationData[0]) === null || _a === void 0 ? void 0 : _a.depreciation) || 0;
            const ebitda = totalRevenue - finalExpenses;
            const netProfit = ebitda - depreciation;
            const pnlData = {
                revenue: { total: totalRevenue },
                expenses: { total: finalExpenses },
                ebitda: { total: ebitda },
                netProfit: { total: netProfit },
                depreciation: { total: depreciation },
                subCompaniesRevenue: subCompaniesRevenue,
                hr: {
                    payroll: payrollExpense,
                    headcount: hrStats.headcount,
                    activeEmployees: hrStats.activeEmployees,
                    onLeaveEmployees: hrStats.onLeaveEmployees
                },
                assets: {
                    bookValue: assetStats.totalBookValue,
                    totalAssets: assetStats.totalAssets,
                    renewalsRequired: assetStats.renewalsRequired
                },
                operations: {
                    deliveries: operationsStats.totalCallouts,
                    onTimePercentage: operationsStats.totalOrders,
                    deliveryCost: operationsExpense,
                    fleetUtilization: operationsStats.cancelledOrders
                },
                maintenance: { cost: maintenanceExpense, totalMaintenanceHours: totalMaintenanceHours },
                procurement: {
                    totalPurchaseRequests: totalPurchaseRequests,
                    totalPurchaseOrders: totalPurchaseOrders,
                    totalVendors: totalVendors
                },
                sales: {
                    totalQuotations: totalQuotations,
                    pendingQuotations: pendingQuotations,
                    totalClients: totalClients
                },
                admin: {
                    activeDocuments: activeDocuments,
                    openLegalCases: openLegalCases,
                    expiryDocuments: expiryDocuments
                },
                hse: {
                    totalIncidents: totalIncidents,
                    overdueInspections: overdueInspections,
                    nearMissLog: nearMissLog
                }
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
                netProfit: { total: 0 },
                depreciation: { total: 0 },
                subCompaniesRevenue: 0,
                hr: {
                    payroll: 0,
                    headcount: 0,
                    activeEmployees: 0,
                    onLeaveEmployees: 0
                },
                assets: {
                    bookValue: 0,
                    totalAssets: 0,
                    renewalsRequired: 0
                },
                operations: {
                    deliveries: 0,
                    onTimePercentage: 0,
                    deliveryCost: 0,
                    fleetUtilization: 0
                },
                maintenance: { cost: 0, totalMaintenanceHours: 0 },
                procurement: { totalPurchaseRequests: 0, totalPurchaseOrders: 0, totalVendors: 0 },
                sales: { totalQuotations: 0, pendingQuotations: 0, totalClients: 0 },
                admin: { activeDocuments: 0, openLegalCases: 0, expiryDocuments: 0 },
                hse: { totalIncidents: 0, overdueInspections: 0, nearMissLog: 0 }
            };
        }
    });
}
// Enhanced Dashboard Summary with all module KPIs
const getDashboardSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { startDate, endDate } = getDateRange(req);
        // Financial KPIs - Get data from PnL Vertical Table
        const pnlData = yield getVerticalPnLDataForDashboard(startDate, endDate);
        const revenue = ((_a = pnlData.revenue) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const expenses = ((_b = pnlData.expenses) === null || _b === void 0 ? void 0 : _b.total) || 0;
        const ebitda = ((_c = pnlData.ebitda) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const netProfit = ((_d = pnlData.netProfit) === null || _d === void 0 ? void 0 : _d.total) || 0;
        const depreciation = ((_e = pnlData.depreciation) === null || _e === void 0 ? void 0 : _e.total) || 0;
        const subCompaniesRevenue = pnlData.subCompaniesRevenue || 0;
        console.log('Dashboard - Financial values from vertical P&L table:', { revenue, expenses, ebitda, subCompaniesRevenue });
        // Extract module data from PnL vertical table
        const hrData = pnlData.hr || {
            payroll: 0,
            headcount: 0,
            activeEmployees: 0,
            onLeaveEmployees: 0
        };
        const assetData = pnlData.assets || {
            bookValue: 0,
            totalAssets: 0,
            renewalsRequired: 0
        };
        const operationsData = pnlData.operations || {
            deliveries: 0,
            onTimePercentage: 0,
            deliveryCost: 0,
            fleetUtilization: 0
        };
        const maintenanceData = pnlData.maintenance || { cost: 0, totalMaintenanceHours: 0 };
        const procurementData = pnlData.procurement || { totalPurchaseRequests: 0, totalPurchaseOrders: 0, totalVendors: 0 };
        const salesData = pnlData.sales || { totalQuotations: 0, pendingQuotations: 0, totalClients: 0 };
        const adminData = pnlData.admin || { activeDocuments: 0, openLegalCases: 0, expiryDocuments: 0 };
        const hseData = pnlData.hse || { totalIncidents: 0, overdueInspections: 0, nearMissLog: 0 };
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
                netProfit: netProfit,
                depreciation: depreciation,
                subCompaniesRevenue: subCompaniesRevenue,
                margin: revenue ? ((revenue - expenses) / revenue * 100) : 0
            },
            hr: {
                headcount: hrData.headcount || 0,
                payroll: hrData.payroll || 0,
                activeEmployees: hrData.activeEmployees || 0,
                onLeaveEmployees: hrData.onLeaveEmployees || 0
            },
            assets: {
                bookValue: assetData.bookValue || 0,
                totalAssets: assetData.totalAssets || 0,
                renewalsRequired: assetData.renewalsRequired || 0
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
                totalMaintenanceHours: maintenanceData.totalMaintenanceHours || 0
            },
            procurement: {
                totalPurchaseRequests: procurementData.totalPurchaseRequests || 0,
                totalPurchaseOrders: procurementData.totalPurchaseOrders || 0,
                totalVendors: procurementData.totalVendors || 0
            },
            sales: {
                totalQuotations: salesData.totalQuotations || 0,
                pendingQuotations: salesData.pendingQuotations || 0,
                totalClients: salesData.totalClients || 0
            },
            admin: {
                activeDocuments: adminData.activeDocuments || 0,
                openLegalCases: adminData.openLegalCases || 0,
                expiryDocuments: adminData.expiryDocuments || 0
            },
            hse: {
                totalIncidents: hseData.totalIncidents || 0,
                overdueInspections: hseData.overdueInspections || 0,
                nearMissLog: hseData.nearMissLog || 0
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
