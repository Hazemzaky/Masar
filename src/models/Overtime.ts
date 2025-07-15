import mongoose, { Document, Schema } from 'mongoose';

export interface IOvertime extends Document {
  employee: mongoose.Types.ObjectId;
  month: number; // 0=Jan, 1=Feb, ...
  year: number;
  salary: number;
  dailySalary: number;
  hourlyRate: number;
  normalRate: number;
  normalHours: number;
  normalSalary: number;
  fridayRate: number;
  fridayHours: number;
  fridaySalary: number;
  holidayRate: number;
  holidayHours: number;
  holidaySalary: number;
  totalOvertimeHours: number;
  totalCost: number;
}

const OvertimeSchema = new Schema<IOvertime>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  salary: { type: Number, required: true },
  dailySalary: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  normalRate: { type: Number, required: true },
  normalHours: { type: Number, required: true },
  normalSalary: { type: Number, required: true },
  fridayRate: { type: Number, required: true },
  fridayHours: { type: Number, required: true },
  fridaySalary: { type: Number, required: true },
  holidayRate: { type: Number, required: true },
  holidayHours: { type: Number, required: true },
  holidaySalary: { type: Number, required: true },
  totalOvertimeHours: { type: Number, required: true },
  totalCost: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IOvertime>('Overtime', OvertimeSchema); 