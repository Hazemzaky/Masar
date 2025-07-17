import { Request, Response } from 'express';
import BudgetContract from '../models/BudgetContract';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetContract.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetContract.findOneAndUpdate(
    { year, name: data.name },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, contracts } = req.body;
  await BudgetContract.deleteMany({ year });
  const docs = await BudgetContract.insertMany(contracts.map((c: any) => ({ year, ...c })));
  res.json(docs);
}; 