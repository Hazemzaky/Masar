import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  description: string;
  mainCategory: string; // e.g., 'Vehicle', 'Equipment', 'Building', 'IT'
  subCategory: string; // e.g., 'Truck', 'Crane', 'Office', 'Computer'
  subSubCategory?: string; // e.g., 'Heavy Truck', 'Mobile Crane', 'Furniture', 'Laptop'
  subSubSubCategory?: string; // 4th level
  brand?: string;
  status: 'active' | 'disposed' | 'accident/scraped' | 'other' | 'pending';
  availability: 'available' | 'assigned' | 'maintenance' | 'out_of_service';
  currentProject?: mongoose.Types.ObjectId; // Currently assigned project
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
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  subSubCategory: { type: String },
  subSubSubCategory: { type: String },
  brand: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'disposed', 'accident/scraped', 'other', 'pending'],
    default: 'active' 
  },
  availability: { 
    type: String, 
    enum: ['available', 'assigned', 'maintenance', 'out_of_service'],
    default: 'available' 
  },
  currentProject: { type: Schema.Types.ObjectId, ref: 'Project' },
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