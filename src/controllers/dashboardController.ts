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

// Enhanced Dashboard Summary with all module KPIs
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Financial KPIs
    const [revenue, expenses, grossProfit, netProfit] = await Promise.all([
      Expense.aggregate([
        { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { category: { $in: ['income', 'expenses'] }, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$category', 'income'] }, '$amount', { $multiply: ['$amount', -1] }] } } } }
      ])
    ]);

    // HR KPIs
    const [headcount, payroll, attrition] = await Promise.all([
      Employee.countDocuments({ status: 'active' }),
      Payroll.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Employee.countDocuments({ status: 'terminated' })
    ]);

    // Assets KPIs
    const [bookValue, utilization, depreciation, renewals] = await Promise.all([
      Asset.aggregate([
        { $group: { _id: null, total: { $sum: '$bookValue' } } }
      ]),
      Asset.aggregate([
        { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
      ]),
      Asset.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$depreciationAmount' } } }
      ]),
      Asset.countDocuments({ status: 'renewal_required' })
    ]);

    // Operations KPIs
    const [deliveries, onTimePercentage, deliveryCost, fleetUtilization] = await Promise.all([
      BusinessTrip.countDocuments({ status: 'Completed', date: { $gte: startDate, $lte: endDate } }),
      BusinessTrip.aggregate([
        { $match: { status: 'Completed', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, onTime: { $sum: { $cond: [{ $lte: ['$actualReturnDate', '$returnDate'] }, 1, 0] } }, total: { $sum: 1 } } }
      ]),
      FuelLog.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ]),
      Asset.aggregate([
        { $match: { type: 'vehicle' } },
        { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
      ])
    ]);

    // Maintenance KPIs
    const [maintenanceCost, preventiveVsCorrective, downtime] = await Promise.all([
      Maintenance.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ]),
      Maintenance.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Maintenance.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$downtimeHours' } } }
      ])
    ]);

    // Procurement KPIs
    const [totalSpend, topVendors, openPOs, cycleTime] = await Promise.all([
      ProcurementInvoice.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ProcurementInvoice.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$vendor', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ]),
      PurchaseOrder.countDocuments({ status: 'open' }),
      PurchaseRequest.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avgCycleTime: { $avg: { $subtract: ['$approvedDate', '$date'] } } } }
      ])
    ]);

    // Sales KPIs
    const [totalSales, pipeline, topCustomers, salesMargin] = await Promise.all([
      Invoice.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Invoice.countDocuments({ status: 'pending' }),
      Invoice.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$client', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ]),
      Invoice.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avgMargin: { $avg: '$margin' } } }
      ])
    ]);

    // Admin KPIs
    const [adminCosts, overheadPercentage, pendingApprovals] = await Promise.all([
      Expense.aggregate([
        { $match: { category: 'admin', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      PurchaseRequest.countDocuments({ status: 'pending' })
    ]);

    // HSE KPIs
    const [incidents, trainingCompliance, openActions] = await Promise.all([
      Incident.countDocuments({ date: { $gte: startDate, $lte: endDate } }),
      Training.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, compliance: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
      ]),
      Incident.countDocuments({ status: 'open' })
    ]);

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
      // Expiring Contracts: Check Client contractData endDate within 30 days
      Client.countDocuments({ 
        type: 'contract',
        'contractData.endDate': { 
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gte: new Date()
        },
        'contractData.status': { $in: ['active', 'pending'] } // Only active or pending contracts
      }),
      // Pending Requests: Check PurchaseRequest with status='pending'
      PurchaseRequest.countDocuments({ status: 'pending' })
    ]);

    // Debug: Log expiring contracts query for troubleshooting
    const debugExpiringContracts = await Client.find({ 
      type: 'contract',
      'contractData.endDate': { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        $gte: new Date()
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
        revenue: revenue[0]?.total || 0,
        expenses: expenses[0]?.total || 0,
        grossProfit: grossProfit[0]?.total || 0,
        netProfit: netProfit[0]?.total || 0,
        margin: revenue[0]?.total ? ((netProfit[0]?.total || 0) / revenue[0]?.total * 100) : 0
      },
      hr: {
        headcount: headcount || 0,
        payroll: payroll[0]?.total || 0,
        attrition: attrition || 0,
        attritionRate: headcount ? (attrition / headcount * 100) : 0
      },
      assets: {
        bookValue: bookValue[0]?.total || 0,
        utilization: utilization[0]?.avgUtilization || 0,
        depreciation: depreciation[0]?.total || 0,
        renewals: renewals || 0
      },
      operations: {
        deliveries: deliveries || 0,
        onTimePercentage: onTimePercentage[0]?.total ? (onTimePercentage[0].onTime / onTimePercentage[0].total * 100) : 0,
        deliveryCost: deliveryCost[0]?.total || 0,
        fleetUtilization: fleetUtilization[0]?.avgUtilization || 0
      },
      maintenance: {
        cost: maintenanceCost[0]?.total || 0,
        preventiveVsCorrective: preventiveVsCorrective || [],
        downtime: downtime[0]?.total || 0
      },
      procurement: {
        totalSpend: totalSpend[0]?.total || 0,
        topVendors: topVendors || [],
        openPOs: openPOs || 0,
        cycleTime: cycleTime[0]?.avgCycleTime || 0
      },
      sales: {
        totalSales: totalSales[0]?.total || 0,
        pipeline: pipeline || 0,
        topCustomers: topCustomers || [],
        salesMargin: salesMargin[0]?.avgMargin || 0
      },
      admin: {
        costs: adminCosts[0]?.total || 0,
        overheadPercentage: adminCosts[0]?.total && expenses[0]?.total ? (adminCosts[0].total / expenses[0].total * 100) : 0,
        pendingApprovals: pendingApprovals || 0
      },
      hse: {
        incidents: incidents || 0,
        trainingCompliance: trainingCompliance[0]?.compliance || 0,
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
    
    // Get expiring contracts
    const expiringContracts = await Client.find({ 
      type: 'contract',
      'contractData.endDate': { 
        $lte: thirtyDaysFromNow,
        $gte: now
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