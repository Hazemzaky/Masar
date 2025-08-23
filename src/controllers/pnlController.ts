import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';
import AccountMapping from '../models/AccountMapping';
import Employee from '../models/Employee';
import Asset from '../models/Asset';
import FuelLog from '../models/FuelLog';
import Maintenance from '../models/Maintenance';
import ProcurementInvoice from '../models/ProcurementInvoice';
import BusinessTrip from '../models/BusinessTrip';
import Training from '../models/Training';
import HSE from '../models/Environmental';

// IFRS P&L Structure as per IAS 1
const PNL_STRUCTURE = {
  REVENUE: 'revenue',
  COST_OF_SALES: 'cost_of_sales',
  GROSS_PROFIT: 'gross_profit',
  OPERATING_EXPENSES: 'operating_expenses',
  OPERATING_PROFIT: 'operating_profit',
  FINANCE_COSTS: 'finance_costs',
  OTHER_INCOME_EXPENSES: 'other_income_expenses',
  PROFIT_BEFORE_TAX: 'profit_before_tax',
  INCOME_TAX_EXPENSE: 'income_tax_expense',
  PROFIT_FOR_PERIOD: 'profit_for_period'
};

// Period calculation functions
function getPeriodDates(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // Calculate based on period
    switch (period) {
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'half_yearly':
        const half = Math.floor(now.getMonth() / 6);
        start = new Date(now.getFullYear(), half * 6, 1);
        end = new Date(now.getFullYear(), (half + 1) * 6, 0);
        break;
      case 'yearly':
      default:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }
  }

  return { start, end };
}

// Amortization calculation utility
function calculateAmortizedAmount(totalAmount: number, startDate: Date, endDate: Date, periodStart: Date, periodEnd: Date, amortizationPeriod: number): number {
  if (!startDate || !endDate || !amortizationPeriod) return totalAmount;

  const assetStart = new Date(startDate);
  const assetEnd = new Date(endDate);
  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);

  // Calculate overlap between asset period and reporting period
  const overlapStart = new Date(Math.max(assetStart.getTime(), periodStartDate.getTime()));
  const overlapEnd = new Date(Math.min(assetEnd.getTime(), periodEndDate.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  // Calculate months of overlap
  const monthsOverlap = (overlapEnd.getFullYear() - overlapStart.getFullYear()) * 12 + 
                       (overlapEnd.getMonth() - overlapStart.getMonth()) + 1;

  // Calculate monthly amortization amount
  const monthlyAmount = totalAmount / amortizationPeriod;

  // Return amortized amount for this period
  return monthlyAmount * monthsOverlap;
}

// Get filters from request
function getFilters(req: Request) {
  const { 
    period = 'yearly', 
    start, 
    end, 
    department, 
    site, 
    branch, 
    operationType, 
    vsBudget, 
    vsLastYear 
  } = req.query;

  const { start: startDate, end: endDate } = getPeriodDates(period as string, start as string, end as string);

  return {
    period: period as string,
    startDate,
    endDate,
    department: department as string,
    site: site as string,
    branch: branch as string,
    operationType: operationType as string,
    vsBudget: vsBudget === 'true',
    vsLastYear: vsLastYear === 'true'
  };
}

// Calculate period breakdown for amortization
function calculatePeriodBreakdown(startDate: Date, endDate: Date, period: string) {
  const periods: Array<{ start: Date; end: Date; label: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  switch (period) {
    case 'monthly':
      let current = new Date(start);
      while (current <= end) {
        const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        periods.push({
          start: new Date(current),
          end: periodEnd,
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      break;
    case 'quarterly':
      let quarterStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
      while (quarterStart <= end) {
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        periods.push({
          start: new Date(quarterStart),
          end: quarterEnd,
          label: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`
        });
        quarterStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1);
      }
      break;
    case 'half_yearly':
      let halfStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 6) * 6, 1);
      while (halfStart <= end) {
        const halfEnd = new Date(halfStart.getFullYear(), halfStart.getMonth() + 6, 0);
        periods.push({
          start: new Date(halfStart),
          end: halfEnd,
          label: `H${Math.floor(halfStart.getMonth() / 6) + 1} ${halfStart.getFullYear()}`
        });
        halfStart = new Date(halfStart.getFullYear(), halfStart.getMonth() + 6, 1);
      }
      break;
    default:
      periods.push({
        start: new Date(start),
        end: new Date(end),
        label: `${start.getFullYear()}`
      });
  }

  return periods;
}

// Main P&L Summary endpoint
export const getPnLSummary = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    // Get account mappings for categorization
    const accountMappings = await AccountMapping.find({ isActive: true });

    // 1. REVENUE - From Sales/Invoice module
    const revenueData = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: startDate, $lte: endDate },
          status: { $in: ['approved', 'sent', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // 2. COST OF SALES - Direct costs from Operations, Procurement, Assets
    const costOfSalesData = await Promise.all([
      // Fuel costs (Operations)
      FuelLog.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalFuelCost: { $sum: '$totalCost' }
          }
        }
      ]),
      // Procurement costs
      ProcurementInvoice.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['approved', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalProcurementCost: { $sum: '$amount' }
          }
        }
      ]),
      // Asset depreciation tied to operations
      Asset.aggregate([
        {
          $match: {
            purchaseDate: { $lte: endDate },
            isOperational: true
          }
        },
        {
          $project: {
            monthlyDepreciation: { $divide: ['$purchasePrice', { $multiply: ['$usefulLife', 12] }] },
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
            totalDepreciation: { $sum: { $multiply: ['$monthlyDepreciation', '$monthsInPeriod'] } }
          }
        }
      ])
    ]);

    const totalFuelCost = costOfSalesData[0][0]?.totalFuelCost || 0;
    const totalProcurementCost = costOfSalesData[1][0]?.totalProcurementCost || 0;
    const totalDepreciation = costOfSalesData[2][0]?.totalDepreciation || 0;
    const totalCostOfSales = totalFuelCost + totalProcurementCost + totalDepreciation;

    // 3. OPERATING EXPENSES - HR, Admin, Maintenance, HSE
    const operatingExpensesData = await Promise.all([
      // Staff costs (HR)
      Employee.aggregate([
        {
          $match: {
            hireDate: { $lte: endDate }
          }
        },
        {
          $project: {
            monthlySalary: { $divide: ['$salary', 12] },
            monthsInPeriod: {
              $cond: {
                if: { $gte: ['$hireDate', startDate] },
                then: { $divide: [{ $subtract: [endDate, '$hireDate'] }, 1000 * 60 * 60 * 24 * 30] },
                else: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24 * 30] }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalStaffCost: { $sum: { $multiply: ['$monthlySalary', '$monthsInPeriod'] } }
          }
        }
      ]),
      // Maintenance costs
      Maintenance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalMaintenanceCost: { $sum: '$cost' }
          }
        }
      ]),
      // HSE costs
      HSE.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalHSECost: { $sum: '$cost' }
          }
        }
      ]),
      // Training costs
      Training.aggregate([
        {
          $match: {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTrainingCost: { $sum: '$cost' }
          }
        }
      ])
    ]);

    const totalStaffCost = operatingExpensesData[0][0]?.totalStaffCost || 0;
    const totalMaintenanceCost = operatingExpensesData[1][0]?.totalMaintenanceCost || 0;
    const totalHSECost = operatingExpensesData[2][0]?.totalHSECost || 0;
    const totalTrainingCost = operatingExpensesData[3][0]?.totalTrainingCost || 0;
    const totalOperatingExpenses = totalStaffCost + totalMaintenanceCost + totalHSECost + totalTrainingCost;

    // 4. Calculate key metrics
    const grossProfit = totalRevenue - totalCostOfSales;
    const operatingProfit = grossProfit - totalOperatingExpenses;
    const profitBeforeTax = operatingProfit; // No finance costs or other items for now
    const incomeTaxExpense = profitBeforeTax * 0.15; // 15% corporate tax rate (placeholder)
    const profitForPeriod = profitBeforeTax - incomeTaxExpense;

    // 5. Calculate margins
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (profitForPeriod / totalRevenue) * 100 : 0;

    // 6. Period breakdown for charts
    const periods = calculatePeriodBreakdown(startDate, endDate, period);

    res.json({
      summary: {
        revenue: totalRevenue,
        costOfSales: totalCostOfSales,
        grossProfit,
        operatingExpenses: totalOperatingExpenses,
        operatingProfit,
        financeCosts: 0,
        otherIncomeExpenses: 0,
        profitBeforeTax,
        incomeTaxExpense,
        profitForPeriod,
        grossMargin: `${grossMargin.toFixed(1)}%`,
        operatingMargin: `${operatingMargin.toFixed(1)}%`,
        netMargin: `${netMargin.toFixed(1)}%`
      },
      breakdown: {
        costOfSales: {
          fuel: totalFuelCost,
          procurement: totalProcurementCost,
          depreciation: totalDepreciation
        },
        operatingExpenses: {
          staff: totalStaffCost,
          maintenance: totalMaintenanceCost,
          hse: totalHSECost,
          training: totalTrainingCost
        }
      },
      periods,
      filters
    });

  } catch (error: any) {
    console.error('Error in getPnLSummary:', error);
    res.status(500).json({ message: 'Failed to generate P&L summary', error: error.message });
  }
};

// P&L Table with detailed line items
export const getPnLTable = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate } = filters;

    // Get account mappings
    const accountMappings = await AccountMapping.find({ isActive: true });

    // Build P&L table structure
    const pnlTable = [
      // Revenue Section
      {
        id: 'revenue',
        category: 'Revenue',
        items: [
          {
            id: 'sales_revenue',
            description: 'Sales Revenue',
            amount: 0,
            module: 'sales',
            trend: 'up',
            expandable: false
          }
        ],
        subtotal: 0,
        type: 'revenue'
      },
      // Cost of Sales Section
      {
        id: 'cost_of_sales',
        category: 'Cost of Sales',
        items: [
          {
            id: 'fuel_costs',
            description: 'Fuel & Vehicle Costs',
            amount: 0,
            module: 'operations',
            trend: 'down',
            expandable: true
          },
          {
            id: 'procurement_costs',
            description: 'Materials & Supplies',
            amount: 0,
            module: 'procurement',
            trend: 'down',
            expandable: true
          },
          {
            id: 'operational_depreciation',
            description: 'Operational Asset Depreciation',
            amount: 0,
            module: 'assets',
            trend: 'down',
            expandable: true
          }
        ],
        subtotal: 0,
        type: 'expense'
      },
      // Operating Expenses Section
      {
        id: 'operating_expenses',
        category: 'Operating Expenses',
        items: [
          {
            id: 'staff_costs',
            description: 'Staff Salaries & Benefits',
            amount: 0,
            module: 'hr',
            trend: 'down',
            expandable: true
          },
          {
            id: 'maintenance_costs',
            description: 'Maintenance & Repairs',
            amount: 0,
            module: 'maintenance',
            trend: 'down',
            expandable: true
          },
          {
            id: 'hse_costs',
            description: 'Health, Safety & Environment',
            amount: 0,
            module: 'hse',
            trend: 'down',
            expandable: true
          },
          {
            id: 'admin_costs',
            description: 'Administrative Expenses',
            amount: 0,
            module: 'admin',
            trend: 'down',
            expandable: true
          },
          {
            id: 'training_costs',
            description: 'Training & Development',
            amount: 0,
            module: 'hr',
            trend: 'down',
            expandable: true
          }
        ],
        subtotal: 0,
        type: 'expense'
      }
    ];

    // Populate with actual data
    const [revenueData, fuelData, procurementData, depreciationData, staffData, maintenanceData, hseData, trainingData] = await Promise.all([
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, status: { $in: ['approved', 'sent', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      FuelLog.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      ProcurementInvoice.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Asset.aggregate([
        { $match: { purchaseDate: { $lte: endDate }, isOperational: true } },
        { $project: { monthlyDepreciation: { $divide: ['$purchasePrice', { $multiply: ['$usefulLife', 12] }] } } },
        { $group: { _id: null, total: { $sum: '$monthlyDepreciation' } } }
      ]),
      Employee.aggregate([
        { $match: { hireDate: { $lte: endDate } } },
        { $project: { monthlySalary: { $divide: ['$salary', 12] } } },
        { $group: { _id: null, total: { $sum: '$monthlySalary' } } }
      ]),
      Maintenance.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ]),
      HSE.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ]),
      Training.aggregate([
        { $match: { startDate: { $lte: endDate }, endDate: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ])
    ]);

    // Update table with actual amounts
    const revenue = revenueData[0]?.total || 0;
    const fuel = fuelData[0]?.total || 0;
    const procurement = procurementData[0]?.total || 0;
    const depreciation = depreciationData[0]?.total || 0;
    const staff = staffData[0]?.total || 0;
    const maintenance = maintenanceData[0]?.total || 0;
    const hse = hseData[0]?.total || 0;
    const training = trainingData[0]?.total || 0;

    // Update revenue section
    pnlTable[0].items[0].amount = revenue;
    pnlTable[0].subtotal = revenue;

    // Update cost of sales section
    pnlTable[1].items[0].amount = fuel;
    pnlTable[1].items[1].amount = procurement;
    pnlTable[1].items[2].amount = depreciation;
    pnlTable[1].subtotal = fuel + procurement + depreciation;

    // Update operating expenses section
    pnlTable[2].items[0].amount = staff;
    pnlTable[2].items[1].amount = maintenance;
    pnlTable[2].items[2].amount = hse;
    pnlTable[2].items[3].amount = 0; // Admin costs placeholder
    pnlTable[2].items[4].amount = training;
    pnlTable[2].subtotal = staff + maintenance + hse + training;

    // Calculate totals
    const grossProfit = revenue - pnlTable[1].subtotal;
    const operatingProfit = grossProfit - pnlTable[2].subtotal;
    const profitBeforeTax = operatingProfit;
    const incomeTax = profitBeforeTax * 0.15;
    const profitForPeriod = profitBeforeTax - incomeTax;

    // Add summary rows
    pnlTable.push({
      id: 'gross_profit',
      category: 'Gross Profit',
      items: [],
      subtotal: grossProfit,
      type: 'summary'
    });

    pnlTable.push({
      id: 'operating_profit',
      category: 'Operating Profit',
      items: [],
      subtotal: operatingProfit,
      type: 'summary'
    });

    pnlTable.push({
      id: 'profit_before_tax',
      category: 'Profit Before Tax',
      items: [],
      subtotal: profitBeforeTax,
      type: 'summary'
    });

    pnlTable.push({
      id: 'income_tax',
      category: 'Income Tax Expense',
      items: [],
      subtotal: incomeTax,
      type: 'expense'
    });

    pnlTable.push({
      id: 'profit_for_period',
      category: 'Profit for the Period',
      items: [],
      subtotal: profitForPeriod,
      type: 'summary'
    });

    res.json(pnlTable);

  } catch (error: any) {
    console.error('Error in getPnLTable:', error);
    res.status(500).json({ message: 'Failed to generate P&L table', error: error.message });
  }
};

// P&L Charts data
export const getPnLCharts = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    const periods = calculatePeriodBreakdown(startDate, endDate, period);

    // Generate chart data for each period
    const chartData = await Promise.all(periods.map(async (period) => {
      const periodStart = period.start;
      const periodEnd = period.end;

      const [revenue, expenses] = await Promise.all([
        Invoice.aggregate([
          { $match: { invoiceDate: { $gte: periodStart, $lte: periodEnd }, status: { $in: ['approved', 'sent', 'paid'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Expense.aggregate([
          { $match: { date: { $gte: periodStart, $lte: periodEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      return {
        period: period.label,
        revenue: revenue[0]?.total || 0,
        expenses: expenses[0]?.total || 0,
        netProfit: (revenue[0]?.total || 0) - (expenses[0]?.total || 0)
      };
    }));

    // Revenue vs Expense vs Net Profit chart
    const revenueVsExpenseData = chartData.map(item => ({
      period: item.period,
      revenue: item.revenue,
      expenses: item.expenses,
      netProfit: item.netProfit
    }));

    // Margin trend chart
    const marginTrendData = chartData.map(item => ({
      period: item.period,
      grossMargin: item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue) * 100 : 0,
      netMargin: item.revenue > 0 ? (item.netProfit / item.revenue) * 100 : 0
    }));

    res.json({
      netProfitOverTime: chartData,
      revenueVsExpense: revenueVsExpenseData,
      marginTrend: marginTrendData
    });

  } catch (error: any) {
    console.error('Error in getPnLCharts:', error);
    res.status(500).json({ message: 'Failed to generate P&L charts', error: error.message });
  }
};

// P&L Analysis with insights
export const getPnLAnalysis = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate } = filters;

    // Generate analysis insights
    const analysis: {
      alerts: Array<{ type: string; message: string; severity: string }>;
      trends: Array<{ description: string }>;
      recommendations: string[];
    } = {
      alerts: [],
      trends: [],
      recommendations: []
    };

    // Cost center analysis
    const costCenterData = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Identify rising cost centers
    costCenterData.slice(0, 3).forEach((item, index) => {
      if (index === 0) {
        analysis.alerts.push({
          type: 'warning',
          message: `Highest cost center: ${item._id} (KD ${item.total.toLocaleString()})`,
          severity: 'medium'
        });
      }
    });

    // Margin analysis
    const [revenue, expenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, status: { $in: ['approved', 'sent', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;
    const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    if (margin < 20) {
      analysis.alerts.push({
        type: 'error',
        message: `Low profit margin: ${margin.toFixed(1)}%. Consider cost optimization.`,
        severity: 'high'
      });
    }

    // Add recommendations
    analysis.recommendations = [
      'Review high-cost procurement items for bulk purchasing opportunities',
      'Analyze fuel consumption patterns for route optimization',
      'Consider preventive maintenance to reduce repair costs',
      'Evaluate staff training ROI and optimize training programs'
    ];

    res.json(analysis);

  } catch (error: any) {
    console.error('Error in getPnLAnalysis:', error);
    res.status(500).json({ message: 'Failed to generate P&L analysis', error: error.message });
  }
}; 