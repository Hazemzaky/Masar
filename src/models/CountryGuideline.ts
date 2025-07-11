import mongoose, { Document, Schema } from 'mongoose';

export interface ICountryGuideline extends Document {
  country: string;
  notes?: string;
  tags: string[];
  flagIcon?: string;
}

const CountryGuidelineSchema = new Schema<ICountryGuideline>({
  country: { type: String, required: true, unique: true },
  notes: { type: String },
  tags: [{ type: String }],
  flagIcon: { type: String },
});

export default mongoose.model<ICountryGuideline>('CountryGuideline', CountryGuidelineSchema); 