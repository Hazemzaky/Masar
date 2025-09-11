import { Request, Response } from 'express';
import BudgetStaffingDatabase from '../models/BudgetStaffingDatabase';

export const get = async (req: Request, res: Response) => {
  const { year } = req.query;
  const docs = await BudgetStaffingDatabase.find({ year });
  res.json(docs);
};

export const save = async (req: Request, res: Response) => {
  const { year, ...data } = req.body;
  const doc = await BudgetStaffingDatabase.findOneAndUpdate(
    { year, name: data.name, department: data.department },
    { year, ...data },
    { upsert: true, new: true }
  );
  res.json(doc);
};

export const bulkSave = async (req: Request, res: Response) => {
  const { year, staff } = req.body;
  await BudgetStaffingDatabase.deleteMany({ year });
  const docs = await BudgetStaffingDatabase.insertMany(staff.map((s: any) => ({ year, ...s })));
  res.json(docs);
}; 