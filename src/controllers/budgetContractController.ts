import { Request, Response } from 'express';
import BudgetContractDatabase from '../models/BudgetContractDatabase';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetContractDatabase.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetContractDatabase.findOneAndUpdate(
    { year, name: data.name },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, contracts } = req.body;
  await BudgetContractDatabase.deleteMany({ year });
  const docs = await BudgetContractDatabase.insertMany(contracts.map((c: any) => ({ year, ...c })));
  res.json(docs);
}; 