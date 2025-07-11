import mongoose, { Document, Schema } from 'mongoose';

export interface IPPEItem {
  type: string;
  description: string;
  issuedDate: Date;
  expiryDate?: Date;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'active' | 'expired' | 'damaged' | 'lost' | 'returned';
  notes?: string;
}

export interface IPPE extends Document {
  employee: mongoose.Types.ObjectId;
  ppeItems: IPPEItem[];
  issuedBy: mongoose.Types.ObjectId;
  issueDate: Date;
  returnDate?: Date;
  totalValue: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ppeItemSchema = new Schema<IPPEItem>({
  type: { type: String, required: true },
  description: { type: String, required: true },
  issuedDate: { type: Date, required: true },
  expiryDate: { type: Date },
  condition: { 
    type: String, 
    required: true, 
    enum: ['new', 'good', 'fair', 'poor', 'damaged'],
    default: 'new'
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'expired', 'damaged', 'lost', 'returned'],
    default: 'active'
  },
  notes: { type: String }
});

const ppeSchema = new Schema<IPPE>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  ppeItems: [ppeItemSchema],
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  issueDate: { type: Date, required: true },
  returnDate: { type: Date },
  totalValue: { type: Number, required: true },
  notes: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IPPE>('PPE', ppeSchema); 