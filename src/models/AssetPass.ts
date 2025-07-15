import mongoose, { Document, Schema } from 'mongoose';

export interface IAssetPass extends Document {
  asset: mongoose.Types.ObjectId;
  passType: 'KOC' | 'KNPC' | 'GO' | 'RATQA' | 'ABDALI' | 'WANEET';
  passNumber: string;
  issuanceDate: Date;
  expiryDate: Date;
  certificate: string; // File path
  createdAt: Date;
  updatedAt: Date;
}

const AssetPassSchema = new Schema<IAssetPass>({
  asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  passType: { type: String, enum: ['KOC', 'KNPC', 'GO', 'RATQA', 'ABDALI', 'WANEET'], required: true },
  passNumber: { type: String, required: true },
  issuanceDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  certificate: { type: String }, // File path
}, {
  timestamps: true
});

export default mongoose.model<IAssetPass>('AssetPass', AssetPassSchema); 