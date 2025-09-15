import mongoose, { Document, Schema } from 'mongoose';

export interface IJobCardPart {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IJobCard extends Document {
  maintenanceId: mongoose.Types.ObjectId;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  parts: IJobCardPart[];
  createdBy?: mongoose.Types.ObjectId;
  completedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
}

const JobCardPartSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const JobCardSchema = new Schema<IJobCard>({
  maintenanceId: { type: Schema.Types.ObjectId, ref: 'Maintenance', required: true },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], 
    default: 'OPEN' 
  },
  parts: [JobCardPartSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, {
  timestamps: true
});

// Index for better query performance
JobCardSchema.index({ maintenanceId: 1 });
JobCardSchema.index({ status: 1 });
JobCardSchema.index({ createdAt: -1 });

export default mongoose.model<IJobCard>('JobCard', JobCardSchema);
