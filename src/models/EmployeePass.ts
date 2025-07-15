import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeePass extends Document {
  employee: mongoose.Types.ObjectId;
  passType: 'KOC' | 'KNPC' | 'GO' | 'RATQA' | 'ABDALI' | 'WANEET';
  passNumber: string;
  issuanceDate: Date;
  expiryDate: Date;
  certificate: string; // File path
  createdAt: Date;
  updatedAt: Date;
}

const EmployeePassSchema = new Schema<IEmployeePass>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  passType: { type: String, enum: ['KOC', 'KNPC', 'GO', 'RATQA', 'ABDALI', 'WANEET'], required: true },
  passNumber: { type: String, required: true },
  issuanceDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  certificate: { type: String }, // File path
}, {
  timestamps: true
});

export default mongoose.model<IEmployeePass>('EmployeePass', EmployeePassSchema); 