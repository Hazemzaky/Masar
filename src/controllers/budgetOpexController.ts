import { Request, Response } from 'express';
import BudgetOpex from '../models/BudgetOpex';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetOpex.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, category, costs } = req.body;
  const doc = await BudgetOpex.findOneAndUpdate(
    { year, category },
    { year, category, costs },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, categories } = req.body;
  await BudgetOpex.deleteMany({ year });
  const docs = await BudgetOpex.insertMany(categories.map((c: any) => ({ year, ...c })));
  res.json(docs);
}; 