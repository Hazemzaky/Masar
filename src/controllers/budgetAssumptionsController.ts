import { Request, Response } from 'express';
import BudgetAssumptions from '../models/BudgetAssumptions';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const doc = await BudgetAssumptions.findOne({ year });
  res.json(doc);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetAssumptions.findOneAndUpdate(
    { year },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
}; 