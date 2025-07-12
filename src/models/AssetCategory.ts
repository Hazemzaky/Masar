import mongoose, { Document, Schema } from 'mongoose';

export interface IAssetCategory extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId | null;
  level: number; // 1=main, 2=sub, 3=subsub, 4=subsubsub
}

const AssetCategorySchema = new Schema<IAssetCategory>({
  name: { type: String, required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'AssetCategory', default: null },
  level: { type: Number, required: true, min: 1, max: 4 },
});

// Virtual for children
AssetCategorySchema.virtual('children', {
  ref: 'AssetCategory',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
});

AssetCategorySchema.set('toObject', { virtuals: true });
AssetCategorySchema.set('toJSON', { virtuals: true });

export default mongoose.model<IAssetCategory>('AssetCategory', AssetCategorySchema); 