import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';
import User from '../models/User';
import Employee from '../models/Employee';
import Asset from '../models/Asset';
import AssetPass from '../models/AssetPass';
import Project from '../models/Project';
import Maintenance from '../models/Maintenance';
import PurchaseRequest from '../models/PurchaseRequest';
import PurchaseOrder from '../models/PurchaseOrder';
import ProcurementInvoice from '../models/ProcurementInvoice';
import Vendor from '../models/Vendor';
import Client from '../models/Client';
import Quotation from '../models/Quotation';
import BusinessTrip from '../models/BusinessTrip';
import Incident from '../models/Incident';
import Training from '../models/Training';
import Accident from '../models/Accident';
import NearMiss from '../models/NearMiss';
import SafetyInspection from '../models/SafetyInspection';
import Payroll from '../models/Payroll';
import FuelLog from '../models/FuelLog';
import GeneralLedgerEntry from '../models/GeneralLedgerEntry';
import ChartOfAccounts from '../models/ChartOfAccounts';
import Contract from '../models/Contract';
import ReconciliationSession from '../models/ReconciliationSession';
import Leave from '../models/Leave';
import Reimbursement from '../models/Reimbursement';
import RiskAssessment from '../models/RiskAssessment';
import TravelAuthorization from '../models/TravelAuthorization';
import GovernmentDocument from '../models/GovernmentDocument';
import LegalCase from '../models/LegalCase';
import GoodsReceipt from '../models/GoodsReceipt';

// Helper to get date range from query or default to current financial year
function getDateRange(req: Request) {
  let { start, end } = req.query;
  let startDate: Date, endDate: Date;
  if (start && end) {
    startDate = new Date(start as string);
    endDate = new Date(end as string);
  } else {
    // Default: current financial year (Apr 1 - Mar 31)
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    startDate = new Date(`${year}-04-01T00:00:00.000Z`);
    endDate = new Date(`${year + 1}-03-31T23:59:59.999Z`);
  }
  return { startDate, endDate };
}

// Type definitions for module data
interface HRData {
  payroll: number;
  headcount: number;
  activeEmployees: number;
  onLeaveEmployees: number;
}

interface AssetsData {
  bookValue: number;
  utilization: number;
  depreciation: number;
  renewals: number;
}

interface OperationsData {
  deliveries: number;
  onTimePercentage: number;
  deliveryCost: number;
  fleetUtilization: number;
}

interface MaintenanceData {
  cost: number;
  totalMaintenanceHours: number;
}

interface ProcurementData {
  totalPurchaseRequests: number;
  totalPurchaseOrders: number;
  totalVendors: number;
}

interface SalesData {
  totalQuotations: number;
  pendingQuotations: number;
  totalClients: number;
}

interface AdminData {
  activeDocuments: number;
  openLegalCases: number;
  expiryDocuments: number;
}

interface HSEData {
  totalIncidents: number;
  overdueInspections: number;
  nearMissLog: number;
}

// Individual Data Source Services - Clean Architecture Approach
// Each service handles one specific data source for better maintainability

async function getRevenueData(startDate: Date, endDate: Date) {
  try {
    const invoiceData = await Invoice.aggregate([
      { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return invoiceData[0]?.total || 0;
  } catch (error) {
    console.log('Revenue data fetch failed:', error);
    return 0;
  }
}

async function getExpenseData(startDate: Date, endDate: Date) {
  try {
    const expenseData = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return expenseData[0]?.total || 0;
  } catch (error) {
    console.log('Expense data fetch failed:', error);
    return 0;
  }
}

async function getAssetRentalRevenue(startDate: Date, endDate: Date) {
  try {
    const assetData = await Asset.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, bookValue: { $sum: '$bookValue' } } }
    ]);
    // Calculate rental revenue as 2% of book value
    const bookValue = assetData[0]?.bookValue || 0;
    return bookValue * 0.02;
  } catch (error) {
    console.log('Asset rental revenue fetch failed:', error);
    return 0;
  }
}

async function getPayrollExpense(startDate: Date, endDate: Date) {
  try {
    const payrollData = await Payroll.aggregate([
      { $match: { runDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$netPay' } } }
    ]);
    return payrollData[0]?.total || 0;
  } catch (error) {
    console.log('Payroll expense fetch failed:', error);
    return 0;
  }
}

async function getHREmployeeStats() {
  try {
    // Get total headcount
    const totalHeadcount = await Employee.countDocuments();
    
    // Get active employees
    const activeEmployees = await Employee.countDocuments({ 
      active: true, 
      status: 'active' 
    });
    
    // Get employees on leave
    const onLeaveEmployees = await Employee.countDocuments({ 
      status: 'on-leave' 
    });
    
    // Note: Attrition rate calculation removed as requested
    
    return {
      headcount: totalHeadcount,
      activeEmployees,
      onLeaveEmployees
    };
  } catch (error) {
    console.log('HR employee stats fetch failed:', error);
    return {
      headcount: 0,
      activeEmployees: 0,
      onLeaveEmployees: 0
    };
  }
}

async function getAssetStats() {
  try {
    // Get total number of assets
    const totalAssets = await Asset.countDocuments();
    
    // Calculate total book value as of current date
    const assets = await Asset.find({ status: 'active' });
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
    
    const renewalsRequired = await AssetPass.countDocuments({
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
  } catch (error) {
    console.log('Asset stats fetch failed:', error);
    return {
      totalAssets: 0,
      totalBookValue: 0,
      renewalsRequired: 0
    };
  }
}

async function getOperationsStats() {
  try {
    // Get total callouts (projects with rentType: 'call_out')
    const totalCallouts = await Project.countDocuments({
      rentType: 'call_out'
    });
    
    // Get total orders (all projects)
    const totalOrders = await Project.countDocuments();
    
    // Get cancelled orders (projects with status: 'cancelled')
    const cancelledOrders = await Project.countDocuments({
      status: 'cancelled'
    });
    
    console.log('Operations stats:', { totalCallouts, totalOrders, cancelledOrders });
    
    return {
      totalCallouts,
      totalOrders,
      cancelledOrders
    };
  } catch (error) {
    console.log('Operations stats fetch failed:', error);
    return {
      totalCallouts: 0,
      totalOrders: 0,
      cancelledOrders: 0
    };
  }
}

async function getOperationsExpense(startDate: Date, endDate: Date) {
  try {
    const fuelLogs = await FuelLog.aggregate([
      { $match: { dateTime: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    return fuelLogs[0]?.total || 0;
  } catch (error) {
    console.log('Operations expense fetch failed:', error);
    return 0;
  }
}

async function getMaintenanceExpense(startDate: Date, endDate: Date) {
  try {
    const maintenanceData = await Maintenance.aggregate([
      { $match: { scheduledDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    return maintenanceData[0]?.total || 0;
  } catch (error) {
    console.log('Maintenance expense fetch failed:', error);
    return 0;
  }
}

async function getTotalMaintenanceHours() {
  try {
    // Calculate total maintenance hours from all maintenance records (not just completed)
    // Include scheduled, in_progress, and completed statuses
    const maintenanceHoursData = await Maintenance.aggregate([
      { 
        $match: { 
          status: { $in: ['scheduled', 'in_progress', 'completed'] },
          totalMaintenanceTime: { $gt: 0 } // Only include records with actual time
        } 
      },
      { $group: { _id: null, totalHours: { $sum: '$totalMaintenanceTime' } } }
    ]);
    
    const totalHours = maintenanceHoursData[0]?.totalHours || 0;
    
    // Debug: Get breakdown by status
    const statusBreakdown = await Maintenance.aggregate([
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
  } catch (error) {
    console.log('Total maintenance hours fetch failed:', error);
    return 0;
  }
}

async function getProcurementExpense(startDate: Date, endDate: Date) {
  try {
    const procurementData = await ProcurementInvoice.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return procurementData[0]?.total || 0;
  } catch (error) {
    console.log('Procurement expense fetch failed:', error);
    return 0;
  }
}

async function getAdminExpense(startDate: Date, endDate: Date) {
  try {
    const expenseData = await Expense.aggregate([
      { $match: {
        category: { $in: ['admin', 'overhead', 'general'] },
        date: { $gte: startDate, $lte: endDate }
      }},
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return expenseData[0]?.total || 0;
  } catch (error) {
    console.log('Admin expense fetch failed:', error);
    return 0;
  }
}

async function getActiveDocumentsCount() {
  try {
    // Count active government documents
    const activeDocuments = await GovernmentDocument.countDocuments({ 
      status: { $in: ['active', 'valid', 'current'] } 
    });
    return activeDocuments;
  } catch (error) {
    console.log('Active documents count fetch failed:', error);
    return 0;
  }
}

async function getOpenLegalCasesCount() {
  try {
    // Count open legal cases
    const openLegalCases = await LegalCase.countDocuments({ 
      status: { $in: ['open', 'pending', 'in_progress'] } 
    });
    return openLegalCases;
  } catch (error) {
    console.log('Open legal cases count fetch failed:', error);
    return 0;
  }
}

async function getExpiryDocumentsNext30Days() {
  try {
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Count government documents expiring in next 30 days
    const expiringDocuments = await GovernmentDocument.countDocuments({
      expiryDate: { 
        $gte: currentDate, 
        $lte: thirtyDaysFromNow 
      },
      status: { $in: ['active', 'valid', 'current'] }
    });
    
    return expiringDocuments;
  } catch (error) {
    console.log('Expiry documents count fetch failed:', error);
    return 0;
  }
}

async function getTotalIncidentsCount() {
  try {
    // Count total incidents from Accident model
    const totalIncidents = await Accident.countDocuments();
    return totalIncidents || 0;
  } catch (error) {
    console.log('Total incidents count fetch failed:', error);
    return 0;
  }
}

async function getOverdueInspectionsCount() {
  try {
    // Count overdue inspections using same logic as HSE page
    const currentDate = new Date();
    const inspections = await SafetyInspection.find({});
    
    // Filter inspections that are overdue (same logic as HSE page)
    const overdueInspections = inspections.filter(i => 
      i.status === 'overdue' || 
      (i.nextInspectionDate && new Date(i.nextInspectionDate) < currentDate)
    ).length;
    
    console.log('Overdue inspections calculation:', {
      totalInspections: inspections.length,
      overdueCount: overdueInspections,
      currentDate: currentDate.toISOString()
    });
    
    return overdueInspections || 0;
  } catch (error) {
    console.log('Overdue inspections count fetch failed:', error);
    return 0;
  }
}

async function getNearMissLogCount() {
  try {
    // Count near miss logs from NearMiss model
    const nearMissCount = await NearMiss.countDocuments();
    return nearMissCount || 0;
  } catch (error) {
    console.log('Near miss log count fetch failed:', error);
    return 0;
  }
}

async function getTotalPurchaseRequestsCount() {
  try {
    // Count total purchase requests
    const totalPurchaseRequests = await PurchaseRequest.countDocuments();
    return totalPurchaseRequests || 0;
  } catch (error) {
    console.log('Total purchase requests count fetch failed:', error);
    return 0;
  }
}

async function getTotalPurchaseOrdersCount() {
  try {
    // Count total purchase orders
    const totalPurchaseOrders = await PurchaseOrder.countDocuments();
    return totalPurchaseOrders || 0;
  } catch (error) {
    console.log('Total purchase orders count fetch failed:', error);
    return 0;
  }
}

async function getTotalVendorsCount() {
  try {
    // Count total vendors
    const totalVendors = await Vendor.countDocuments();
    return totalVendors || 0;
  } catch (error) {
    console.log('Total vendors count fetch failed:', error);
    return 0;
  }
}

async function getTotalQuotationsCount() {
  try {
    // Count total quotations
    const totalQuotations = await Quotation.countDocuments();
    return totalQuotations || 0;
  } catch (error) {
    console.log('Total quotations count fetch failed:', error);
    return 0;
  }
}

async function getPendingQuotationsCount() {
  try {
    // Count pending quotations - using more common status values
    const pendingQuotations = await Quotation.countDocuments({
      $or: [
        { status: { $in: ['Draft', 'draft', 'Pending', 'pending', 'Sent', 'sent'] } },
        { approvalStatus: { $in: ['pending', 'Pending', 'draft', 'Draft'] } }
      ]
    });
    return pendingQuotations || 0;
  } catch (error) {
    console.log('Pending quotations count fetch failed:', error);
    return 0;
  }
}

async function getTotalClientsCount() {
  try {
    // Count total clients
    const totalClients = await Client.countDocuments();
    return totalClients || 0;
  } catch (error) {
    console.log('Total clients count fetch failed:', error);
    return 0;
  }
}

async function getSubCompaniesRevenue(startDate: Date, endDate: Date) {
  try {
    const { getManualPnLEntries } = await import('./pnlController');
    const mockReq = { query: {} } as any;
    let manualEntries: any[] = [];
    const mockRes = {
      json: (data: any) => { manualEntries = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    await getManualPnLEntries(mockReq, mockRes);
    const subCompaniesEntry = manualEntries.find((entry: any) => entry.itemId === 'sub_companies_revenue');
    return subCompaniesEntry?.amount || 0;
  } catch (error) {
    console.log('Sub companies revenue fetch failed:', error);
    return 0;
  }
}

// Main aggregation function using individual data services
async function getVerticalPnLDataForDashboard(startDate: Date, endDate: Date) {
  try {
    console.log('🎯 Dashboard: Fetching data from individual services...', { startDate, endDate });

    // Fetch data from each service in parallel
    const [
      salesRevenue,
      totalExpenses,
      rentalRevenue,
      payrollExpense,
      operationsExpense,
      maintenanceExpense,
      procurementExpense,
      adminExpense,
      subCompaniesRevenue,
      hrStats,
      assetStats,
      operationsStats,
      activeDocuments,
      openLegalCases,
      expiryDocuments,
      totalIncidents,
      overdueInspections,
      nearMissLog,
      totalPurchaseRequests,
      totalPurchaseOrders,
      totalVendors,
      totalQuotations,
      pendingQuotations,
      totalClients,
      totalMaintenanceHours
    ] = await Promise.all([
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
    const depreciationData = await Asset.aggregate([
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

    const depreciation = depreciationData[0]?.depreciation || 0;
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

  } catch (error) {
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
}

// Enhanced Dashboard Summary with all module KPIs
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Financial KPIs - Get data from PnL Vertical Table
    const pnlData = await getVerticalPnLDataForDashboard(startDate, endDate);

    const revenue = pnlData.revenue?.total || 0;
    const expenses = pnlData.expenses?.total || 0;
    const ebitda = pnlData.ebitda?.total || 0;
    const netProfit = (pnlData as any).netProfit?.total || 0;
    const depreciation = (pnlData as any).depreciation?.total || 0;
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
    const [overdueInvoices, unapprovedPOs, pendingReconciliations, expiringContracts, pendingRequests] = await Promise.all([
      // Overdue Invoices: Check for invoices with paymentStatus='overdue' or dueDate < now and status='pending'
      Invoice.countDocuments({ 
        $or: [
          { paymentStatus: 'overdue' },
          { dueDate: { $lt: new Date() }, status: 'pending' }
        ]
      }),
      // Unapproved POs: Check PurchaseRequest with status='pending' or 'sent_to_procurement'
      PurchaseRequest.countDocuments({ 
        status: { $in: ['pending', 'sent_to_procurement'] }
      }),
      // Pending Reconciliations: Check ReconciliationSession with status='draft' or 'in-progress'
      ReconciliationSession.countDocuments({ 
        status: { $in: ['draft', 'in-progress'] }
      }),
      // Expiring Contracts: Check Client contractData endDate within 30 days (including past due)
      Client.countDocuments({ 
        type: 'contract',
        'contractData.endDate': { 
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          // Removed $gte: new Date() to include contracts that are already past due
        },
        'contractData.status': { $in: ['active', 'pending'] } // Only active or pending contracts
      }),
      // Pending Requests: Count all pending requests from all modules (same as pending requests page)
      (async () => {
        const [
          purchaseRequests,
          businessTrips,
          leaveRequests,
          reimbursements,
          payrollPending,
          assetPending,
          maintenancePending,
          trainingPending,
          riskPending,
          travelAuthPending,
          govDocPending,
          legalPending,
          salesPending,
          invoicePending,
          expensePending,
          procInvoicePending,
          grnPending
        ] = await Promise.all([
          PurchaseRequest.countDocuments({ status: { $in: ['pending', 'sent_to_procurement'] } }),
          BusinessTrip.countDocuments({ status: { $in: ['Under Review', 'Pending'] } }),
          Leave.countDocuments({ status: 'pending' }),
          Reimbursement.countDocuments({ status: 'pending' }),
          Payroll.countDocuments({ status: 'pending' }),
          Asset.countDocuments({ status: 'pending' }),
          Maintenance.countDocuments({ status: { $in: ['pending', 'scheduled'] } }),
          Training.countDocuments({ 'certificates.status': 'pending_renewal' }),
          RiskAssessment.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
          TravelAuthorization.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
          GovernmentDocument.countDocuments({ status: 'pending_renewal' }),
          LegalCase.countDocuments({ status: { $in: ['open', 'pending'] } }),
          Client.countDocuments({ type: 'quotation', 'quotationData.approvalStatus': 'pending' }),
          Invoice.countDocuments({ status: 'pending_approval' }),
          Expense.countDocuments({ status: 'pending_approval' }),
          ProcurementInvoice.countDocuments({ status: 'pending' }),
          GoodsReceipt.countDocuments({ status: 'pending' })
        ]);
        
        return purchaseRequests + businessTrips + leaveRequests + reimbursements + 
               payrollPending + assetPending + maintenancePending + trainingPending + 
               riskPending + travelAuthPending + govDocPending + legalPending + 
               salesPending + invoicePending + expensePending + procInvoicePending + grnPending;
      })()
    ]);

    // Debug: Log expiring contracts query for troubleshooting
    const debugExpiringContracts = await Client.find({ 
      type: 'contract',
      'contractData.endDate': { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        // Removed $gte: new Date() to include contracts that are already past due
      },
      'contractData.status': { $in: ['active', 'pending'] }
    }).select('name contractData.endDate contractData.status');
    
    console.log('Debug - Expiring contracts query result:', {
      count: expiringContracts,
      contracts: debugExpiringContracts.map(c => ({
        name: c.name,
        endDate: c.contractData?.endDate,
        status: c.contractData?.status
      }))
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
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Legacy functions for backward compatibility
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const byCategory = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    const invoiceCount = await Invoice.countDocuments();
    const userCount = await User.countDocuments();
    const recentExpenses = await Expense.find().sort({ date: -1 }).limit(3).select('description amount category date');
    const recentInvoices = await Invoice.find().sort({ uploadDate: -1 }).limit(2).select('fileUrl uploadDate');
    res.json({
      total: totalExpenses[0]?.total || 0,
      byCategory,
      invoiceCount,
      userCount,
      recentActivity: [
        ...recentExpenses.map((e: any) => `Expense: ${e.description} (${e.category}) - $${e.amount}`),
        ...recentInvoices.map((i: any) => `Invoice uploaded: ${i.fileUrl}`)
      ]
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = getDateRange(req);
    // Revenue: category === 'income'
    const revenueAgg = await Expense.aggregate([
      { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    // Expenses: category === 'expenses'
    const expensesAgg = await Expense.aggregate([
      { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenses = expensesAgg[0]?.total || 0;
    // Penalties
    const penaltyAgg = await Expense.aggregate([
      { $match: { category: 'penalty', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const penalties = penaltyAgg[0]?.total || 0;
    // Depreciation
    const depreciationAgg = await Expense.aggregate([
      { $match: { category: 'depreciation', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const depreciation = depreciationAgg[0]?.total || 0;
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
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getIncomeStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const revenueAgg = await Expense.aggregate([
      { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    const expensesAgg = await Expense.aggregate([
      { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenses = expensesAgg[0]?.total || 0;
    const penaltyAgg = await Expense.aggregate([
      { $match: { category: 'penalty', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const penalties = penaltyAgg[0]?.total || 0;
    const depreciationAgg = await Expense.aggregate([
      { $match: { category: 'depreciation', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const depreciation = depreciationAgg[0]?.total || 0;
    const netProfit = revenue - expenses - penalties - depreciation;
    res.json({
      revenue,
      expenses,
      penalties,
      depreciation,
      netProfit
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBalanceSheet = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get assets from Asset model
    const assets = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: '$bookValue' } } }
    ]);
    
    // Get cash from GL entries
    const cash = await GeneralLedgerEntry.aggregate([
      { $match: { accountCode: { $regex: /^1000/ } } }, // Cash accounts
      { $group: { _id: null, total: { $sum: { $subtract: ['$debit', '$credit'] } } } }
    ]);
    
    // Get receivables from GL entries
    const receivables = await GeneralLedgerEntry.aggregate([
      { $match: { accountCode: { $regex: /^1100/ } } }, // Receivable accounts
      { $group: { _id: null, total: { $sum: { $subtract: ['$debit', '$credit'] } } } }
    ]);
    
    // Get payables from GL entries
    const payables = await GeneralLedgerEntry.aggregate([
      { $match: { accountCode: { $regex: /^2000/ } } }, // Payable accounts
      { $group: { _id: null, total: { $sum: { $subtract: ['$credit', '$debit'] } } } }
    ]);
    
    const totalAssets = assets[0]?.total || 0;
    const totalLiabilities = payables[0]?.total || 0;
    const workingCapital = (cash[0]?.total || 0) + (receivables[0]?.total || 0) - (payables[0]?.total || 0);
    const equity = totalAssets - totalLiabilities;
    
    res.json({
      assets: {
        total: totalAssets,
        cash: cash[0]?.total || 0,
        receivables: receivables[0]?.total || 0,
        fixedAssets: totalAssets - (cash[0]?.total || 0) - (receivables[0]?.total || 0)
      },
      liabilities: {
        total: totalLiabilities,
        payables: payables[0]?.total || 0
      },
      equity: equity,
      workingCapital: workingCapital
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getCashFlowStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = getDateRange(req);
    // Inflows: income
    const inflowAgg = await Expense.aggregate([
      { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const inflows = inflowAgg[0]?.total || 0;
    // Outflows: expenses + penalty + depreciation
    const outflowAgg = await Expense.aggregate([
      { $match: { category: { $in: ['expenses', 'penalty', 'depreciation'] }, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const outflows = outflowAgg[0]?.total || 0;
    const netCashFlow = inflows - outflows;
    
    // Get opening balance from previous period
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    const openingBalance = await GeneralLedgerEntry.aggregate([
      { $match: { transactionDate: { $lte: previousPeriodEnd } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$debit', '$credit'] } } } }
    ]);
    
    const closingBalance = (openingBalance[0]?.total || 0) + netCashFlow;
    
    res.json({
      openingBalance: openingBalance[0]?.total || 0,
      inflows,
      outflows,
      netCashFlow,
      closingBalance
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Debug endpoint to check expiring contracts
export const debugExpiringContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    console.log('Debug - Date range:', {
      now: now.toISOString(),
      thirtyDaysFromNow: thirtyDaysFromNow.toISOString()
    });

    // Get all contract clients
    const allContractClients = await Client.find({ type: 'contract' }).select('name contractData');
    
    // Get expiring contracts (including past due contracts within 30 days)
    const expiringContracts = await Client.find({ 
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
        allContractClients: allContractClients.map(c => ({
          name: c.name,
          endDate: c.contractData?.endDate,
          status: c.contractData?.status
        })),
        expiringContracts: expiringContracts.map(c => ({
          name: c.name,
          endDate: c.contractData?.endDate,
          status: c.contractData?.status
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};   