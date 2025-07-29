import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  description: string;
  type: string; // First level: Vehicle, Attachment, Equipment, Building, Furniture, IT, Other
  mainCategory: string; // Second level: depends on type
  subCategory: string; // Third level: depends on main category
  subSubCategory?: string; // Fourth level: depends on sub category
  subSubSubCategory?: string; // Fifth level: depends on sub-sub category
  subSubSubSubCategory?: string; // Sixth level: manual entry
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
  serial?: string; // Document serial number
  notes?: string;
}

const AssetSchema = new Schema<IAsset>({
  description: { type: String, required: true },
  type: { type: String, required: true }, // First level
  mainCategory: { type: String, required: true }, // Second level
  subCategory: { type: String, required: true }, // Third level
  subSubCategory: { type: String }, // Fourth level
  subSubSubCategory: { type: String }, // Fifth level
  subSubSubSubCategory: { type: String }, // Sixth level
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
  serial: { type: String, unique: true, sparse: true }, // Document serial number
  notes: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IAsset>('Asset', AssetSchema); 