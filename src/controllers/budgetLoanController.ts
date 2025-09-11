import { Request, Response } from 'express';
import BudgetLoanDatabase from '../models/BudgetLoanDatabase';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetLoanDatabase.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetLoanDatabase.findOneAndUpdate(
    { year, name: data.name },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, loans } = req.body;
  await BudgetLoanDatabase.deleteMany({ year });
  const docs = await BudgetLoanDatabase.insertMany(loans.map((l: any) => ({ year, ...l })));
  res.json(docs);
}; 