import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  amount: number;
  description: string;
  date: Date;
  category: string;
  user: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  currency?: string;
  depreciationStart?: Date;
  depreciationEnd?: Date;
  managementDepartment?: string;
  proofUrl?: string;
  customType?: string;
  project?: mongoose.Types.ObjectId;
  reconciled: boolean;
}

const ExpenseSchema: Schema = new Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  currency: { type: String },
  depreciationStart: { type: Date },
  depreciationEnd: { type: Date },
  managementDepartment: { type: String },
  proofUrl: { type: String },
  customType: { type: String },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  reconciled: { type: Boolean, default: false },
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema); 