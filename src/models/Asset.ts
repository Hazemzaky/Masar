import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  description: string;
  type: string; // e.g., 'vehicle', 'equipment'
  brand?: string;
  status: 'active' | 'disposed' | 'accident/scraped' | 'other' | 'pending';
  countryOfOrigin?: string;
  purchaseDate: Date;
  purchaseValue: number;
  usefulLifeMonths: number; // in months
  salvageValue: number;
  chassisNumber?: string;
  plateNumber?: string;
  serialNumber?: string;
  fleetNumber?: string;
  notes?: string;
}

const AssetSchema = new Schema<IAsset>({
  description: { type: String, required: true },
  type: { type: String, required: true },
  brand: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'disposed', 'accident/scraped', 'other', 'pending'],
    default: 'active' 
  },
  countryOfOrigin: { type: String },
  purchaseDate: { type: Date, required: true },
  purchaseValue: { type: Number, required: true },
  usefulLifeMonths: { type: Number, required: true },
  salvageValue: { type: Number, default: 0 },
  chassisNumber: { type: String },
  plateNumber: { type: String },
  serialNumber: { type: String },
  fleetNumber: { type: String },
  notes: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IAsset>('Asset', AssetSchema); 