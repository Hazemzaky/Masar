import { Request, Response } from 'express';
import BudgetAssumptionsDatabase from '../models/BudgetAssumptionsDatabase';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const doc = await BudgetAssumptionsDatabase.findOne({ year });
  res.json(doc);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetAssumptionsDatabase.findOneAndUpdate(
    { year },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
}; 