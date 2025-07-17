import { Request, Response } from 'express';
import Budget from '../models/Budget';
import Expense from '../models/Expense';

export const createBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, project, period, year, category, subCategory, accountCode, amount, forecast, scenarios, notes } = req.body;
    if (!year || !category) {
      res.status(400).json({ message: 'Year and category are required.' });
      return;
    }
    const budget = new Budget({
      department,
      project,
      period,
      year,
      category,
      subCategory,
      accountCode,
      amount,
      forecast,
      scenarios,
      notes,
      actual: 0,
      variance: 0,
    });
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBudgets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, project, period, year, category } = req.query;
    const filter: any = {};
    if (department) filter.department = department;
    if (project) filter.project = project;
    if (period) filter.period = period;
    if (year) filter.year = Number(year);
    if (category) filter.category = category;
    const budgets = await Budget.find(filter);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const oldBudget = await Budget.findById(id);
    const budget = await Budget.findByIdAndUpdate(id, req.body, { new: true });
    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }
    // Add to history
    if (oldBudget) {
      const changes: any = {};
      const oldBudgetObj = oldBudget.toObject() as Record<string, any>;
      for (const key in req.body) {
        if (req.body[key] !== oldBudgetObj[key]) {
          changes[key] = { from: oldBudgetObj[key], to: req.body[key] };
        }
      }
      budget.history.push({ changedBy: req.body.changedBy || 'system', date: new Date(), changes });
      await budget.save();
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getVariance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);
    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }
    // Variance = actual - amount
    const variance = budget.actual - budget.amount;
    res.json({ variance, actual: budget.actual, budgeted: budget.amount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { forecast } = req.body;
    const budget = await Budget.findByIdAndUpdate(id, { forecast }, { new: true });
    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const scenarioModeling = async (req: Request, res: Response): Promise<void> => {
  try {
    // Accept scenario params via query or body
    const { best, worst, expected } = req.query;
    // For demo, just return the values
    res.json({ best, worst, expected });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const recalculateActual = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);
    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }
    // Find all expenses for this department/project/period
    const expenseFilter: any = { managementDepartment: budget.department };
    if (budget.project) expenseFilter.project = budget.project;
    // For period, assume period is 'YYYY-MM' or 'YYYY-QX' or 'YYYY'
    // We'll match by year and month if possible
    if (budget.period.match(/^\d{4}-\d{2}$/)) {
      // Month
      const [year, month] = budget.period.split('-');
      expenseFilter.date = {
        $gte: new Date(`${year}-${month}-01T00:00:00.000Z`),
        $lt: new Date(`${year}-${('0' + (parseInt(month) + 1)).slice(-2)}-01T00:00:00.000Z`)
      };
    } else if (budget.period.match(/^\d{4}-Q\d$/)) {
      // Quarter
      const [year, q] = budget.period.split('-Q');
      const quarter = parseInt(q);
      const startMonth = (quarter - 1) * 3 + 1;
      expenseFilter.date = {
        $gte: new Date(`${year}-${('0' + startMonth).slice(-2)}-01T00:00:00.000Z`),
        $lt: new Date(`${year}-${('0' + (startMonth + 3)).slice(-2)}-01T00:00:00.000Z`)
      };
    } else if (budget.period.match(/^\d{4}$/)) {
      // Year
      const year = budget.period;
      expenseFilter.date = {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lt: new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`)
      };
    }
    const expenses = await Expense.find(expenseFilter);
    const actual = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    budget.actual = actual;
    budget.variance = actual - budget.amount;
    await budget.save();
    res.json({ actual, variance: budget.variance, budget });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 
