import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryItem extends Document {
  description: string;
  type: 'spare' | 'tool' | 'consumable' | 'tyres';
  rop?: number;
  quantity: number;
  uom: string;
  location?: string;
  rack?: string;
  aisle?: string;
  bin?: string;
  warranty?: boolean;
  warrantyPeriod?: number;
  warrantyStartDate?: Date;
  purchaseCost?: number;
  supplier?: string;
  relatedAsset?: string;
  notes?: string;
  status: 'active' | 'inactive';
  costType?: 'direct' | 'depreciated'; // New field
  depreciationDuration?: number; // New field (months)
}

const InventoryItemSchema = new Schema<IInventoryItem>({
  description: { type: String, required: true },
  type: { type: String, enum: ['spare', 'tool', 'consumable', 'tyres'], required: true },
  rop: { type: Number },
  quantity: { type: Number, required: true, default: 0 },
  uom: { type: String, required: true },
  location: { type: String },
  rack: { type: String },
  aisle: { type: String },
  bin: { type: String },
  warranty: { type: Boolean, default: false },
  warrantyPeriod: { type: Number },
  warrantyStartDate: { type: Date },
  purchaseCost: { type: Number },
  supplier: { type: String },
  relatedAsset: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  costType: { type: String, enum: ['direct', 'depreciated'], default: 'direct' }, // New field
  depreciationDuration: { type: Number }, // New field (months)
});

export default mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema); 