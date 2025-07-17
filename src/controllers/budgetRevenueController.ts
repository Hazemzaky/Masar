import { Request, Response } from 'express';
import BudgetRevenue from '../models/BudgetRevenue';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetRevenue.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, businessLine, units, price } = req.body;
  const doc = await BudgetRevenue.findOneAndUpdate(
    { year, businessLine },
    { year, businessLine, units, price },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, lines } = req.body;
  await BudgetRevenue.deleteMany({ year });
  const docs = await BudgetRevenue.insertMany(lines.map((l: any) => ({ year, ...l })));
  res.json(docs);
}; 