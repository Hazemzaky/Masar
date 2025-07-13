import mongoose, { Document, Schema } from 'mongoose';

export interface ITariff extends Document {
  assetType: 'Vehicle' | 'Attachment' | 'Equipment' | 'Building' | 'Furniture' | 'IT' | 'Other';
  mainCategory: string;
  subCategory: string;
  subSubCategory?: string;
  pricingType: 'per_hour' | 'per_day' | 'per_month';
  rate: number;
  currency: string;
  description?: string;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  notes?: string;
}

const TariffSchema = new Schema<ITariff>({
  assetType: { 
    type: String, 
    enum: ['Vehicle', 'Attachment', 'Equipment', 'Building', 'Furniture', 'IT', 'Other'], 
    required: true 
  },
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  subSubCategory: { type: String },
  pricingType: { 
    type: String, 
    enum: ['per_hour', 'per_day', 'per_month'], 
    required: true 
  },
  rate: { type: Number, required: true },
  currency: { type: String, default: 'KWD' },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  effectiveDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  notes: { type: String }
}, {
  timestamps: true
});

// Create compound index for efficient tariff lookup
TariffSchema.index({ 
  assetType: 1, 
  mainCategory: 1, 
  subCategory: 1, 
  subSubCategory: 1, 
  pricingType: 1, 
  isActive: 1 
});

export default mongoose.model<ITariff>('Tariff', TariffSchema); 