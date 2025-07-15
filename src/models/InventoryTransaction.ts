import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryTransaction extends Document {
  item: mongoose.Types.ObjectId;
  type: 'inbound' | 'outbound' | 'adjustment';
  quantity: number;
  date: Date;
  relatedAsset?: mongoose.Types.ObjectId;
  relatedMaintenance?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  notes?: string;
  serial?: string; // Document serial number
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>({
  item: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['inbound', 'outbound', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  relatedAsset: { type: Schema.Types.ObjectId, ref: 'Asset' },
  relatedMaintenance: { type: Schema.Types.ObjectId, ref: 'Maintenance' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  serial: { type: String, unique: true, sparse: true }, // Document serial number
});

export default mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
