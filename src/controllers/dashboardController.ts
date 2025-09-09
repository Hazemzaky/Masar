import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';
import User from '../models/User';
import Employee from '../models/Employee';
import Asset from '../models/Asset';
import Maintenance from '../models/Maintenance';
import PurchaseRequest from '../models/PurchaseRequest';
import PurchaseOrder from '../models/PurchaseOrder';
import ProcurementInvoice from '../models/ProcurementInvoice';
import Client from '../models/Client';
import BusinessTrip from '../models/BusinessTrip';
import Incident from '../models/Incident';
import Training from '../models/Training';
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
  attrition: number;
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
  downtime: number;
}

interface ProcurementData {
  totalSpend: number;
  openPOs: number;
  cycleTime: number;
}

interface SalesData {
  totalSales: number;
  pipeline: number;
  salesMargin: number;
}

interface AdminData {
  costs: number;
  overheadPercentage: number;
  pendingApprovals: number;
}

interface HSEData {
  incidents: number;
  trainingCompliance: number;
  openActions: number;
}

// Creative Solution: Aggregate module data directly for dashboard
// This mirrors the approach used by the PnL page's verticalPnLMappingService
async function getVerticalPnLDataForDashboard(startDate: Date, endDate: Date) {
  try {
    console.log('🔄 Dashboard: Starting direct module data aggregation...', { startDate, endDate });

    // Aggregate data from all modules using the same logic as verticalPnLMappingService
    const moduleData = await Promise.allSettled([
      // HR Module Data
      (async (): Promise<HRData> => {
        try {
          const payrollData = await Payroll.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]);
          const employeeCount = await Employee.countDocuments();
          const leaveData = await Leave.countDocuments({
            startDate: { $gte: startDate, $lte: endDate },
            status: 'approved'
          });

          return {
            payroll: payrollData[0]?.total || 0,
            headcount: employeeCount,
            attrition: leaveData
          };
        } catch (err) {
          console.log('HR data aggregation failed:', err);
          return { payroll: 0, headcount: 0, attrition: 0 };
        }
      })(),

      // Assets Module Data
      (async (): Promise<AssetsData> => {
        try {
          const assetData = await Asset.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
              $group: {
                _id: null,
                bookValue: { $sum: '$bookValue' },
                count: { $sum: 1 }
              }
            }
          ]);
          const depreciationData = await Asset.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, depreciation: { $sum: '$depreciation' } } }
          ]);

          return {
            bookValue: assetData[0]?.bookValue || 0,
            utilization: assetData[0]?.count ? 85 : 0, // Mock utilization
            depreciation: depreciationData[0]?.depreciation || 0,
            renewals: assetData[0]?.count || 0
          };
        } catch (err) {
          console.log('Assets data aggregation failed:', err);
          return { bookValue: 0, utilization: 0, depreciation: 0, renewals: 0 };
        }
      })(),

      // Operations Module Data
      (async (): Promise<OperationsData> => {
        try {
          const fuelLogs = await FuelLog.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
          ]);

          return {
            deliveries: fuelLogs[0]?.count || 0,
            onTimePercentage: 92, // Mock on-time percentage
            deliveryCost: fuelLogs[0]?.totalCost || 0,
            fleetUtilization: 78 // Mock fleet utilization
          };
        } catch (err) {
          console.log('Operations data aggregation failed:', err);
          return { deliveries: 0, onTimePercentage: 0, deliveryCost: 0, fleetUtilization: 0 };
        }
      })(),

      // Maintenance Module Data
      (async (): Promise<MaintenanceData> => {
        try {
          const maintenanceData = await Maintenance.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalCost: { $sum: '$cost' }, count: { $sum: 1 } } }
          ]);

          return {
            cost: maintenanceData[0]?.totalCost || 0,
            downtime: maintenanceData[0]?.count * 2 || 0 // Mock downtime hours
          };
        } catch (err) {
          console.log('Maintenance data aggregation failed:', err);
          return { cost: 0, downtime: 0 };
        }
      })(),

      // Procurement Module Data
      (async (): Promise<ProcurementData> => {
        try {
          const procurementData = await ProcurementInvoice.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalSpend: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]);

          const openPOs = await PurchaseOrder.countDocuments({
            status: { $in: ['pending', 'approved'] }
          });

          return {
            totalSpend: procurementData[0]?.totalSpend || 0,
            openPOs: openPOs,
            cycleTime: 14 // Mock cycle time in days
          };
        } catch (err) {
          console.log('Procurement data aggregation failed:', err);
          return { totalSpend: 0, openPOs: 0, cycleTime: 0 };
        }
      })(),

      // Sales/Revenue Module Data
      (async (): Promise<SalesData> => {
        try {
          const invoiceData = await Invoice.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate }, status: 'paid' } },
            { $group: { _id: null, totalSales: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]);

          return {
            totalSales: invoiceData[0]?.totalSales || 0,
            pipeline: invoiceData[0]?.count * 15000 || 0, // Mock pipeline
            salesMargin: 25 // Mock margin percentage
          };
        } catch (err) {
          console.log('Sales data aggregation failed:', err);
          return { totalSales: 0, pipeline: 0, salesMargin: 0 };
        }
      })(),

      // Admin Module Data
      (async (): Promise<AdminData> => {
        try {
          const expenseData = await Expense.aggregate([
            { $match: {
              category: { $in: ['admin', 'overhead', 'general'] },
              date: { $gte: startDate, $lte: endDate }
            }},
            { $group: { _id: null, totalCosts: { $sum: '$amount' } } }
          ]);

          return {
            costs: expenseData[0]?.totalCosts || 0,
            overheadPercentage: 15, // Mock percentage
            pendingApprovals: 0
          };
        } catch (err) {
          console.log('Admin data aggregation failed:', err);
          return { costs: 0, overheadPercentage: 0, pendingApprovals: 0 };
        }
      })(),

      // HSE Module Data
      (async (): Promise<HSEData> => {
        try {
          const incidentCount = await Incident.countDocuments({
            date: { $gte: startDate, $lte: endDate }
          });

          const trainingCount = await Training.countDocuments({
            completionDate: { $gte: startDate, $lte: endDate }
          });

          return {
            incidents: incidentCount,
            trainingCompliance: trainingCount > 0 ? 95 : 0,
            openActions: Math.floor(incidentCount * 0.3) // Mock open actions
          };
        } catch (err) {
          console.log('HSE data aggregation failed:', err);
          return { incidents: 0, trainingCompliance: 0, openActions: 0 };
        }
      })()
    ]);

    // Extract the results from Promise.allSettled with proper type assertions
    const hrData: HRData = moduleData[0].status === 'fulfilled' ? moduleData[0].value : { payroll: 0, headcount: 0, attrition: 0 };
    const assetsData: AssetsData = moduleData[1].status === 'fulfilled' ? moduleData[1].value : { bookValue: 0, utilization: 0, depreciation: 0, renewals: 0 };
    const operationsData: OperationsData = moduleData[2].status === 'fulfilled' ? moduleData[2].value : { deliveries: 0, onTimePercentage: 0, deliveryCost: 0, fleetUtilization: 0 };
    const maintenanceData: MaintenanceData = moduleData[3].status === 'fulfilled' ? moduleData[3].value : { cost: 0, downtime: 0 };
    const procurementData: ProcurementData = moduleData[4].status === 'fulfilled' ? moduleData[4].value : { totalSpend: 0, openPOs: 0, cycleTime: 0 };
    const salesData: SalesData = moduleData[5].status === 'fulfilled' ? moduleData[5].value : { totalSales: 0, pipeline: 0, salesMargin: 0 };
    const adminData: AdminData = moduleData[6].status === 'fulfilled' ? moduleData[6].value : { costs: 0, overheadPercentage: 0, pendingApprovals: 0 };
    const hseData: HSEData = moduleData[7].status === 'fulfilled' ? moduleData[7].value : { incidents: 0, trainingCompliance: 0, openActions: 0 };

    // Calculate totals for revenue and expenses based on module data
    const totalRevenue = (salesData.totalSales || 0) + (assetsData.bookValue ? assetsData.bookValue * 0.02 : 0); // Mock rental revenue
    const totalExpenses = (hrData.payroll || 0) + (operationsData.deliveryCost || 0) + (maintenanceData.cost || 0) +
                         (procurementData.totalSpend || 0) + (adminData.costs || 0);

    const pnlData = {
      revenue: { total: totalRevenue },
      expenses: { total: totalExpenses },
      ebitda: { total: totalRevenue - totalExpenses },
      subCompaniesRevenue: 0, // Will be set from manual entries below
      hr: hrData,
      assets: assetsData,
      operations: operationsData,
      maintenance: maintenanceData,
      procurement: procurementData,
      sales: salesData,
      admin: adminData,
      hse: hseData
    };

    // Get Sub Companies Revenue from manual entries and update pnlData
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
      pnlData.subCompaniesRevenue = subCompaniesEntry?.amount || 0;
      console.log('✅ Updated pnlData with sub companies revenue:', pnlData.subCompaniesRevenue);
    } catch (error) {
      console.error('Error fetching manual entries for pnlData:', error);
      pnlData.subCompaniesRevenue = 0;
    }

    console.log('✅ Dashboard: Module data aggregation completed:', {
      totalRevenue,
      totalExpenses,
      moduleBreakdown: {
        hr: hrData.payroll,
        assets: assetsData.bookValue,
        operations: operationsData.deliveryCost,
        maintenance: maintenanceData.cost,
        procurement: procurementData.totalSpend,
        sales: salesData.totalSales,
        admin: adminData.costs
      }
    });

    return pnlData;

  } catch (error) {
    console.error('❌ Error in dashboard module aggregation:', error);
    // Return default values if aggregation fails
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