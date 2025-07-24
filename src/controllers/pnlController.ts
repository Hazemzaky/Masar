import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';

// Helper to get date range and filters from query
function getFilters(req: Request) {
  const { start, end, department, site, branch, operationType, vsBudget, vsLastYear } = req.query;
  let startDate: Date | undefined, endDate: Date | undefined;
  if (start && end) {
    startDate = new Date(start as string);
    endDate = new Date(end as string);
  }
  return { startDate, endDate, department, site, branch, operationType, vsBudget, vsLastYear };
}

export const getPnLSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getFilters(req);
    const match: any = {};
    if (startDate && endDate) match.date = { $gte: startDate, $lte: endDate };
    // Add more filters as needed
    const revenueAgg = await Expense.aggregate([
      { $match: { ...match, category: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expensesAgg = await Expense.aggregate([
      { $match: { ...match, category: 'expenses' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    const expenses = expensesAgg[0]?.total || 0;
    const grossProfit = revenue - expenses;
    const netProfit = grossProfit; // Add more as needed
    const grossMarginPct = revenue ? ((grossProfit / revenue) * 100).toFixed(2) : 0;
    res.json({ revenue, expenses, grossProfit, netProfit, grossMarginPct });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get P&L summary', error: err });
  }
};

export const getPnLTable = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getFilters(req);
    const match: any = {};
    if (startDate && endDate) match.date = { $gte: startDate, $lte: endDate };
    // Example: group by category for table rows
    const rows = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } }
    ]);
    // Calculate % of revenue and trends (stub)
    const revenue = rows.find(r => r._id === 'income')?.amount || 1;
    const table = rows.map(row => ({
      label: row._id,
      amount: row.amount,
      pctOfRevenue: ((row.amount / revenue) * 100).toFixed(2),
      trend: 'up', // Stub
      expandable: false
    }));
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get P&L table', error: err });
  }
};

export const getPnLCharts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getFilters(req);
    // Example: Net profit over time (monthly)
    const pipeline = [
      { $match: startDate && endDate ? { date: { $gte: startDate, $lte: endDate } } : {} },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        income: { $sum: { $cond: [{ $eq: ['$category', 'income'] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$category', 'expenses'] }, '$amount', 0] } }
      } },
      { $sort: { _id: 1 as 1 } }
    ];
    const data = await Expense.aggregate(pipeline);
    const netProfitOverTime = data.map(d => ({
      period: d._id,
      netProfit: d.income - d.expense,
      revenue: d.income,
      expense: d.expense,
      margin: d.income ? ((d.income - d.expense) / d.income) * 100 : 0
    }));
    res.json({ netProfitOverTime, revenueVsExpense: netProfitOverTime, marginTrend: netProfitOverTime });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get P&L charts', error: err });
  }
};

export const getPnLAnalysis = async (req: Request, res: Response) => {
  try {
    // Stub: In real use, analyze for anomalies, rising cost centers, margin drops
    res.json({
      anomalies: [],
      risingCostCenters: [],
      marginDrop: null
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get P&L analysis', error: err });
  }
}; 