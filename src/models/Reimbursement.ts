import mongoose, { Document, Schema } from 'mongoose';

export interface IReimbursement extends Document {
  employee: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: mongoose.Types.ObjectId;
  payroll?: mongoose.Types.ObjectId;
  serial?: string; // Document serial number
}

const ReimbursementSchema: Schema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  payroll: { type: Schema.Types.ObjectId, ref: 'Payroll' },
  serial: { type: String, unique: true, sparse: true }, // Document serial number
});

export default mongoose.model<IReimbursement>('Reimbursement', ReimbursementSchema); 