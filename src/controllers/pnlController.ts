import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';
import { getAmortizedCosts } from '../utils/amortizationUtils';

// IFRS P&L Structure constants
const PNL_STRUCTURE = {
  REVENUE: 'Revenue',
  COST_OF_SALES: 'Cost of Sales',
  GROSS_PROFIT: 'Gross Profit',
  OPERATING_EXPENSES: 'Operating Expenses',
  OPERATING_PROFIT: 'Operating Profit',
  FINANCE_COSTS: 'Finance Costs',
  OTHER_INCOME_EXPENSE: 'Other Income / (Expense)',
  PROFIT_BEFORE_TAX: 'Profit Before Tax',
  INCOME_TAX_EXPENSE: 'Income Tax Expense',
  PROFIT_FOR_PERIOD: 'Profit for the Period'
};

// Helper to get date range and filters from query
function getFilters(req: Request) {
  const { start, end, period, department, site, branch, operationType, vsBudget, vsLastYear } = req.query;
  
  let startDate: Date | undefined, endDate: Date | undefined;
  
  if (start && end) {
    startDate = new Date(start as string);
    endDate = new Date(end as string);
  } else if (period) {
    // Calculate date range based on period
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (period) {
      case 'monthly':
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(currentMonth / 3);
        startDate = new Date(currentYear, quarter * 3, 1);
        endDate = new Date(currentYear, (quarter + 1) * 3, 0);
        break;
      case 'half_yearly':
        const half = Math.floor(currentMonth / 6);
        startDate = new Date(currentYear, half * 6, 1);
        endDate = new Date(currentYear, (half + 1) * 6, 0);
        break;
      case 'yearly':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        break;
      default:
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
    }
  }
  
  return { 
    startDate, 
    endDate, 
    period: period as string || 'yearly',
    department, 
    site, 
    branch, 
    operationType, 
    vsBudget: vsBudget === 'true', 
    vsLastYear: vsLastYear === 'true' 
  };
}

// Helper to calculate period breakdown for amortization
function calculatePeriodBreakdown(startDate: Date, endDate: Date, period: string) {
  const periods: Array<{ start: Date; end: Date; label: string }> = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    let periodEnd: Date;
    let label: string;
    
    switch (period) {
      case 'monthly':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarterly':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 3, 0);
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        label = `Q${quarter} ${current.getFullYear()}`;
        current.setMonth(current.getMonth() + 3);
        break;
      case 'half_yearly':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 6, 0);
        const half = Math.floor(current.getMonth() / 6) + 1;
        label = `H${half} ${current.getFullYear()}`;
        current.setMonth(current.getMonth() + 6);
        break;
      case 'yearly':
        periodEnd = new Date(current.getFullYear(), 11, 31);
        label = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        periodEnd = new Date(current.getFullYear(), 11, 31);
        label = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
    }
    
    periods.push({ start: new Date(current), end: periodEnd, label });
  }
  
  return periods;
}

export const getPnLSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period } = getFilters(req);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    // Get base financial data
    const [revenueData, costData, expenseData, amortizedCosts] = await Promise.all([
      // Revenue
      Invoice.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          status: 'paid',
          type: 'income'
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      // Direct costs (Cost of Sales)
      Expense.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          category: { $in: ['direct_costs', 'logistics', 'depreciation'] }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      // Operating expenses
      Expense.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          category: { $in: ['distribution', 'admin', 'staff', 'marketing', 'utilities'] }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      // Get amortized costs for the period
      getAmortizedCosts(startDate, endDate, period)
    ]);

    const revenue = revenueData[0]?.total || 0;
    const costOfSales = (costData[0]?.total || 0) + (amortizedCosts.directCosts || 0);
    const grossProfit = revenue - costOfSales;
    const operatingExpenses = (expenseData[0]?.total || 0) + (amortizedCosts.operatingCosts || 0);
    const operatingProfit = grossProfit - operatingExpenses;
    
    // Finance costs and other items (placeholder - extend as needed)
    const financeCosts = 0; // Get from finance/loan models
    const otherIncomeExpense = 0; // Get from other income/expense models
    const profitBeforeTax = operatingProfit - financeCosts + otherIncomeExpense;
    
    // Income tax (simplified calculation)
    const incomeTaxExpense = profitBeforeTax * 0.15; // 15% tax rate - adjust as needed
    const profitForPeriod = profitBeforeTax - incomeTaxExpense;
    
    // Calculate margins
    const grossMargin = revenue ? ((grossProfit / revenue) * 100).toFixed(2) : '0.00';
    const operatingMargin = revenue ? ((operatingProfit / revenue) * 100).toFixed(2) : '0.00';
    const netMargin = revenue ? ((profitForPeriod / revenue) * 100).toFixed(2) : '0.00';

    res.json({
      period,
      startDate,
      endDate,
      summary: {
        revenue,
        costOfSales,
        grossProfit,
        grossMargin: `${grossMargin}%`,
        operatingExpenses,
        operatingProfit,
        operatingMargin: `${operatingMargin}%`,
        financeCosts,
        otherIncomeExpense,
        profitBeforeTax,
        incomeTaxExpense,
        profitForPeriod,
        netMargin: `${netMargin}%`
      },
      amortizedCosts
    });
  } catch (err: any) {
    console.error('P&L Summary Error:', err);
    res.status(500).json({ message: 'Failed to get P&L summary', error: err.message });
  }
};

export const getPnLTable = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period } = getFilters(req);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    // Get detailed breakdown by category
    const [revenueBreakdown, costBreakdown, expenseBreakdown, amortizedBreakdown] = await Promise.all([
      // Revenue breakdown
      Invoice.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          status: 'paid',
          type: 'income'
        }},
        { $group: { _id: '$category', amount: { $sum: '$amount' } }},
        { $sort: { amount: -1 }}
      ]),
      
      // Cost of sales breakdown
      Expense.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          category: { $in: ['direct_costs', 'logistics', 'depreciation'] }
        }},
        { $group: { _id: '$category', amount: { $sum: '$amount' } }},
        { $sort: { amount: -1 }}
      ]),
      
      // Operating expenses breakdown
      Expense.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          category: { $in: ['distribution', 'admin', 'staff', 'marketing', 'utilities'] }
        }},
        { $group: { _id: '$category', amount: { $sum: '$amount' } }},
        { $sort: { amount: -1 }}
      ]),
      
      // Amortized costs breakdown
      getAmortizedCosts(startDate, endDate, period)
    ]);

    // Calculate total revenue for percentage calculations
    const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.amount, 0);

    // Build IFRS-compliant P&L table
    const pnlTable = [
      // Revenue Section
      { 
        id: 'revenue_header',
        label: PNL_STRUCTURE.REVENUE,
        amount: totalRevenue,
        pctOfRevenue: '100.00',
        category: 'header',
        expandable: true,
        level: 0
      },
      ...revenueBreakdown.map(item => ({
        id: `revenue_${item._id}`,
        label: item._id,
        amount: item.amount,
        pctOfRevenue: totalRevenue ? ((item.amount / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'revenue',
        expandable: false,
        level: 1
      })),
      
      // Cost of Sales Section
      { 
        id: 'cost_of_sales_header',
        label: PNL_STRUCTURE.COST_OF_SALES,
        amount: costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0),
        pctOfRevenue: totalRevenue ? (((costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0)) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'header',
        expandable: true,
        level: 0
      },
      ...costBreakdown.map(item => ({
        id: `cost_${item._id}`,
        label: item._id,
        amount: item.amount,
        pctOfRevenue: totalRevenue ? ((item.amount / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'cost',
        expandable: false,
        level: 1
      })),
      ...(amortizedBreakdown.directCosts ? [{
        id: 'amortized_direct_costs',
        label: 'Amortized Direct Costs',
        amount: amortizedBreakdown.directCosts,
        pctOfRevenue: totalRevenue ? ((amortizedBreakdown.directCosts / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'cost',
        expandable: false,
        level: 1
      }] : []),
      
      // Gross Profit
      { 
        id: 'gross_profit',
        label: PNL_STRUCTURE.GROSS_PROFIT,
        amount: totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0)),
        pctOfRevenue: totalRevenue ? (((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'subtotal',
        expandable: false,
        level: 0
      },
      
      // Operating Expenses Section
      { 
        id: 'operating_expenses_header',
        label: PNL_STRUCTURE.OPERATING_EXPENSES,
        amount: expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0),
        pctOfRevenue: totalRevenue ? (((expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0)) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'header',
        expandable: true,
        level: 0
      },
      ...expenseBreakdown.map(item => ({
        id: `expense_${item._id}`,
        label: item._id,
        amount: item.amount,
        pctOfRevenue: totalRevenue ? ((item.amount / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'expense',
        expandable: false,
        level: 1
      })),
      ...(amortizedBreakdown.operatingCosts ? [{
        id: 'amortized_operating_costs',
        label: 'Amortized Operating Costs',
        amount: amortizedBreakdown.operatingCosts,
        pctOfRevenue: totalRevenue ? ((amortizedBreakdown.operatingCosts / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'expense',
        expandable: false,
        level: 1
      }] : []),
      
      // Operating Profit
      { 
        id: 'operating_profit',
        label: PNL_STRUCTURE.OPERATING_PROFIT,
        amount: (totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0)),
        pctOfRevenue: totalRevenue ? ((((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'subtotal',
        expandable: false,
        level: 0
      },
      
      // Finance Costs
      { 
        id: 'finance_costs',
        label: PNL_STRUCTURE.FINANCE_COSTS,
        amount: 0, // Placeholder - get from finance models
        pctOfRevenue: '0.00',
        category: 'finance',
        expandable: false,
        level: 0
      },
      
      // Other Income/Expense
      { 
        id: 'other_income_expense',
        label: PNL_STRUCTURE.OTHER_INCOME_EXPENSE,
        amount: 0, // Placeholder - get from other models
        pctOfRevenue: '0.00',
        category: 'other',
        expandable: false,
        level: 0
      },
      
      // Profit Before Tax
      { 
        id: 'profit_before_tax',
        label: PNL_STRUCTURE.PROFIT_BEFORE_TAX,
        amount: ((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0,
        pctOfRevenue: totalRevenue ? (((((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'subtotal',
        expandable: false,
        level: 0
      },
      
      // Income Tax Expense
      { 
        id: 'income_tax_expense',
        label: PNL_STRUCTURE.INCOME_TAX_EXPENSE,
        amount: ((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0 * 0.15,
        pctOfRevenue: totalRevenue ? (((((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0 * 0.15) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'tax',
        expandable: false,
        level: 0
      },
      
      // Profit for the Period
      { 
        id: 'profit_for_period',
        label: PNL_STRUCTURE.PROFIT_FOR_PERIOD,
        amount: (((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0) - (((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0 * 0.15),
        pctOfRevenue: totalRevenue ? ((((((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0) - (((totalRevenue - (costBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.directCosts || 0))) - (expenseBreakdown.reduce((sum, item) => sum + item.amount, 0) + (amortizedBreakdown.operatingCosts || 0))) - 0 + 0 * 0.15)) / totalRevenue) * 100).toFixed(2) : '0.00',
        category: 'final',
        expandable: false,
        level: 0
      }
    ];

    res.json(pnlTable);
  } catch (err: any) {
    console.error('P&L Table Error:', err);
    res.status(500).json({ message: 'Failed to get P&L table', error: err.message });
  }
};

export const getPnLCharts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period } = getFilters(req);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    // Calculate period breakdown
    const periods = calculatePeriodBreakdown(startDate, endDate, period);
    
    // Get data for each period
    const chartData = await Promise.all(periods.map(async (periodInfo) => {
      const [revenue, costs, expenses, amortizedCosts] = await Promise.all([
        Invoice.aggregate([
          { $match: { 
            date: { $gte: periodInfo.start, $lte: periodInfo.end },
            status: 'paid',
            type: 'income'
          }},
          { $group: { _id: null, total: { $sum: '$amount' } }}
        ]),
        
        Expense.aggregate([
          { $match: { 
            date: { $gte: periodInfo.start, $lte: periodInfo.end },
            category: { $in: ['direct_costs', 'logistics', 'depreciation'] }
          }},
          { $group: { _id: null, total: { $sum: '$amount' } }}
        ]),
        
        Expense.aggregate([
          { $match: { 
            date: { $gte: periodInfo.start, $lte: periodInfo.end },
            category: { $in: ['distribution', 'admin', 'staff', 'marketing', 'utilities'] }
          }},
          { $group: { _id: null, total: { $sum: '$amount' } }}
        ]),
        
        getAmortizedCosts(periodInfo.start, periodInfo.end, period)
      ]);

      const periodRevenue = revenue[0]?.total || 0;
      const periodCosts = (costs[0]?.total || 0) + (amortizedCosts.directCosts || 0);
      const periodExpenses = (expenses[0]?.total || 0) + (amortizedCosts.operatingCosts || 0);
      const grossProfit = periodRevenue - periodCosts;
      const operatingProfit = grossProfit - periodExpenses;
      const netProfit = operatingProfit; // Simplified - add finance costs, tax, etc.

      return {
        period: periodInfo.label,
        revenue: periodRevenue,
        costOfSales: periodCosts,
        grossProfit,
        operatingExpenses: periodExpenses,
        operatingProfit,
        netProfit,
        margin: periodRevenue ? ((grossProfit / periodRevenue) * 100).toFixed(2) : '0.00'
      };
    }));

    res.json({
      netProfitOverTime: chartData.map(d => ({ period: d.period, netProfit: d.netProfit })),
      revenueVsExpense: chartData.map(d => ({ 
        period: d.period, 
        revenue: d.revenue, 
        expense: d.operatingExpenses + d.costOfSales,
        net: d.netProfit 
      })),
      marginTrend: chartData.map(d => ({ period: d.period, margin: parseFloat(d.margin) }))
    });
  } catch (err: any) {
    console.error('P&L Charts Error:', err);
    res.status(500).json({ message: 'Failed to get P&L charts', error: err.message });
  }
};

export const getPnLAnalysis = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period } = getFilters(req);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    // Get current period data
    const [currentRevenue, currentCosts, currentExpenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          status: 'paid',
          type: 'income'
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      Expense.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          category: { $in: ['direct_costs', 'logistics', 'depreciation'] }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      Expense.aggregate([
        { $match: { 
          date: { $gte: startDate, $lte: endDate },
          category: { $in: ['distribution', 'admin', 'staff', 'marketing', 'utilities'] }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ])
    ]);

    const currentRevenueAmount = currentRevenue[0]?.total || 0;
    const currentCostsAmount = currentCosts[0]?.total || 0;
    const currentExpensesAmount = currentExpenses[0]?.total || 0;
    const currentGrossProfit = currentRevenueAmount - currentCostsAmount;
    const currentOperatingProfit = currentGrossProfit - currentExpensesAmount;
    const currentMargin = currentRevenueAmount ? ((currentGrossProfit / currentRevenueAmount) * 100) : 0;

    // Get previous period data for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    
    switch (period) {
      case 'monthly':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate.setMonth(previousEndDate.getMonth() - 1);
        break;
      case 'quarterly':
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        previousEndDate.setMonth(previousEndDate.getMonth() - 3);
        break;
      case 'half_yearly':
        previousStartDate.setMonth(previousStartDate.getMonth() - 6);
        previousEndDate.setMonth(previousEndDate.getMonth() - 6);
        break;
      case 'yearly':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
        break;
    }

    const [previousRevenue, previousCosts, previousExpenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate },
          status: 'paid',
          type: 'income'
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      Expense.aggregate([
        { $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate },
          category: { $in: ['direct_costs', 'logistics', 'depreciation'] }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      
      Expense.aggregate([
        { $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate },
          category: { $in: ['distribution', 'admin', 'staff', 'marketing', 'utilities'] }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ])
    ]);

    const previousRevenueAmount = previousRevenue[0]?.total || 0;
    const previousCostsAmount = previousCosts[0]?.total || 0;
    const previousExpensesAmount = previousExpenses[0]?.total || 0;
    const previousGrossProfit = previousRevenueAmount - previousCostsAmount;
    const previousOperatingProfit = previousGrossProfit - previousExpensesAmount;
    const previousMargin = previousRevenueAmount ? ((previousGrossProfit / previousRevenueAmount) * 100) : 0;

    // Calculate changes and identify anomalies
    const revenueChange = previousRevenueAmount ? ((currentRevenueAmount - previousRevenueAmount) / previousRevenueAmount * 100).toFixed(2) : 0;
    const marginChange = previousMargin ? (currentMargin - previousMargin).toFixed(2) : 0;
    const costChange = previousCostsAmount ? ((currentCostsAmount - previousCostsAmount) / previousCostsAmount * 100).toFixed(2) : 0;

    const anomalies: string[] = [];
    const risingCostCenters: string[] = [];
    let marginDrop: string | null = null;

    // Check for anomalies
    if (Math.abs(Number(revenueChange)) > 20) {
      anomalies.push(`Revenue ${Number(revenueChange) > 0 ? 'increased' : 'decreased'} by ${Math.abs(Number(revenueChange))}%`);
    }

    if (Number(costChange) > 15) {
      risingCostCenters.push(`Cost of sales increased by ${costChange}%`);
    }

    if (Number(marginChange) < -5) {
      marginDrop = `Margin dropped by ${Math.abs(Number(marginChange))}%`;
    }

    res.json({
      currentPeriod: {
        revenue: currentRevenueAmount,
        grossProfit: currentGrossProfit,
        operatingProfit: currentOperatingProfit,
        margin: currentMargin
      },
      previousPeriod: {
        revenue: previousRevenueAmount,
        grossProfit: previousGrossProfit,
        operatingProfit: previousOperatingProfit,
        margin: previousMargin
      },
      changes: {
        revenue: `${revenueChange}%`,
        margin: `${marginChange}%`,
        costs: `${costChange}%`
      },
      anomalies,
      risingCostCenters,
      marginDrop
    });
  } catch (err: any) {
    console.error('P&L Analysis Error:', err);
    res.status(500).json({ message: 'Failed to get P&L analysis', error: err.message });
  }
}; 