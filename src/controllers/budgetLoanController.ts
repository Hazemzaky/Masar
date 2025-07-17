import { Request, Response } from 'express';
import BudgetLoan from '../models/BudgetLoan';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetLoan.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetLoan.findOneAndUpdate(
    { year, name: data.name },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, loans } = req.body;
  await BudgetLoan.deleteMany({ year });
  const docs = await BudgetLoan.insertMany(loans.map((l: any) => ({ year, ...l })));
  res.json(docs);
}; 