import mongoose, { Document, Schema } from 'mongoose';

export interface ILowStockAlert extends Document {
  item: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  minStock: number;
  triggeredAt: Date;
  resolved: boolean;
}

const LowStockAlertSchema = new Schema<ILowStockAlert>({
  item: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  minStock: { type: Number, required: true },
  triggeredAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
});

export default mongoose.model<ILowStockAlert>('LowStockAlert', LowStockAlertSchema); 