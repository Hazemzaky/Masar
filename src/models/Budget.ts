import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  department: string;
  project?: mongoose.Types.ObjectId;
  period: string; // e.g., '2024-Q2', '2024', '2024-05'
  year: number;
  category: string;
  subCategory?: string;
  accountCode?: string;
  amount: number; // budgeted
  forecast: number;
  scenarios: {
    best: number;
    worst: number;
    expected: number;
  };
  actual: number;
  variance: number;
  notes?: string;
  history: {
    changedBy: string;
    date: Date;
    changes: object;
  }[];
}

const tabCategories = [
  'Budget Assumptions', 'Summary', 'Variance', 'Expected Sales', 'Sales', 'Other', 'Logistics Cost',
  'Cost Of Water Sale', 'Cost Of Rental Equipment', 'GA', 'OPEX', 'Staff', 'Costs', 'Manpower', 'Capex'
];

const BudgetSchema: Schema = new Schema({
  department: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  period: { type: String, required: true },
  year: { type: Number, required: true },
  category: { type: String, required: true, enum: tabCategories },
  subCategory: { type: String },
  accountCode: { type: String },
  amount: { type: Number, required: true },
  forecast: { type: Number, required: true },
  scenarios: {
    best: { type: Number, required: true },
    worst: { type: Number, required: true },
    expected: { type: Number, required: true },
  },
  actual: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  notes: { type: String },
  history: [
    {
      changedBy: { type: String },
      date: { type: Date, default: Date.now },
      changes: { type: Object },
    }
  ],
});

export default mongoose.model<IBudget>('Budget', BudgetSchema); 