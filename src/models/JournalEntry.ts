import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalEntryLine {
  account: mongoose.Types.ObjectId;
  debit: number;
  credit: number;
  description?: string;
}

export interface IJournalEntry extends Document {
  date: Date;
  description: string;
  lines: IJournalEntryLine[];
  createdBy: string;
  period: string;
  status: 'draft' | 'posted' | 'reversed';
  reference?: string;
  serial?: string; // Document serial number
}

const JournalEntryLineSchema: Schema = new Schema({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  description: { type: String },
});

const JournalEntrySchema: Schema = new Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  lines: [JournalEntryLineSchema],
  createdBy: { type: String, required: true },
  period: { type: String, required: true },
  status: { type: String, enum: ['draft', 'posted', 'reversed'], default: 'draft' },
  reference: { type: String },
  serial: { type: String, unique: true, sparse: true }, // Document serial number
});

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema); 