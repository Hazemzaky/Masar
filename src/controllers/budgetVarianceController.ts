import { Request, Response } from 'express';
import BudgetVarianceDatabase from '../models/BudgetVarianceDatabase';

export const get = async (req: Request, res: Response) => {
  const { year, module } = req.query;
  const docs = await BudgetVarianceDatabase.find({ year, module });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, module, item, budget, actual } = req.body;
  const doc = await BudgetVarianceDatabase.findOneAndUpdate(
    { year, module, item },
    { year, module, item, budget, actual },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, module, items } = req.body;
  await BudgetVarianceDatabase.deleteMany({ year, module });
  const docs = await BudgetVarianceDatabase.insertMany(items.map((i: any) => ({ year, module, ...i })));
  res.json(docs);
}; 