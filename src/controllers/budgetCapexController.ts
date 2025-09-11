import { Request, Response } from 'express';
import BudgetCapexDatabase from '../models/BudgetCapexDatabase';

export const get = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year as string) } : {};
    
    const capexBudgets = await BudgetCapexDatabase.find(query).sort({ no: 1 });
    res.json(capexBudgets);
  } catch (error) {
    console.error('Error fetching CAPEX budgets:', error);
    res.status(500).json({ message: 'Failed to fetch CAPEX budgets' });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const { year, capexBudgets } = req.body;
    
    if (!year || !Array.isArray(capexBudgets)) {
      return res.status(400).json({ message: 'Year and CAPEX budgets array are required' });
    }

    // Delete existing CAPEX budgets for the year
    await BudgetCapexDatabase.deleteMany({ year });

    // Insert new CAPEX budgets
    const capexBudgetsWithYear = capexBudgets.map((capex: any) => ({
      ...capex,
      year
    }));

    const savedBudgets = await BudgetCapexDatabase.insertMany(capexBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error saving CAPEX budgets:', error);
    res.status(500).json({ message: 'Failed to save CAPEX budgets' });
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { year, capexBudgets } = req.body;
    
    if (!year || !Array.isArray(capexBudgets)) {
      return res.status(400).json({ message: 'Year and CAPEX budgets array are required' });
    }

    // Delete existing CAPEX budgets for the year
    await BudgetCapexDatabase.deleteMany({ year });

    // Insert new CAPEX budgets
    const capexBudgetsWithYear = capexBudgets.map((capex: any) => ({
      ...capex,
      year
    }));

    const savedBudgets = await BudgetCapexDatabase.insertMany(capexBudgetsWithYear);
    res.json(savedBudgets);
  } catch (error) {
    console.error('Error bulk saving CAPEX budgets:', error);
    res.status(500).json({ message: 'Failed to bulk save CAPEX budgets' });
  }
}; 