import mongoose, { Document, Schema } from 'mongoose';

export interface IPrepaidCard extends Document {
  cardId: string;
  client: mongoose.Types.ObjectId;
  balance: number;
  status: 'Active' | 'Blocked';
  lastUsed?: Date;
}

const PrepaidCardSchema = new Schema<IPrepaidCard>({
  cardId: { type: String, required: true, unique: true, index: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  balance: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' },
  lastUsed: { type: Date },
}, { timestamps: true });

export default mongoose.model<IPrepaidCard>('PrepaidCard', PrepaidCardSchema); 