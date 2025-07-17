import { Request, Response } from 'express';
import BudgetCapex from '../models/BudgetCapex';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetCapex.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetCapex.findOneAndUpdate(
    { year, name: data.name },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, capex } = req.body;
  await BudgetCapex.deleteMany({ year });
  const docs = await BudgetCapex.insertMany(capex.map((c: any) => ({ year, ...c })));
  res.json(docs);
}; 