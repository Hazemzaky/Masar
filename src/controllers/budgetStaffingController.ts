import { Request, Response } from 'express';
import BudgetStaffing from '../models/BudgetStaffing';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetStaffing.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetStaffing.findOneAndUpdate(
    { year, name: data.name, department: data.department },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, staff } = req.body;
  await BudgetStaffing.deleteMany({ year });
  const docs = await BudgetStaffing.insertMany(staff.map((s: any) => ({ year, ...s })));
  res.json(docs);
}; 