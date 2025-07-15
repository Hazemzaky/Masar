import mongoose, { Document, Schema } from 'mongoose';

export interface IMaintenancePart {
  item: mongoose.Types.ObjectId;
  itemName: string;
  quantity: number;
  cost: number;
  availableQuantity?: number;
  withdrawnQuantity?: number;
}

export interface IMaintenance extends Document {
  asset: mongoose.Types.ObjectId;
  type: 'preventive' | 'corrective';
  description: string;
  scheduledDate: Date;
  scheduledTime?: string;
  completedDate?: Date;
  completedTime?: string;
  totalCost: number;
  totalMaintenanceTime: number; // in hours
  parts: IMaintenancePart[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  downtimeHours?: number;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  completedBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
}

const MaintenancePartSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
  itemName: { type: String },
  quantity: { type: Number },
  cost: { type: Number },
  availableQuantity: { type: Number },
  withdrawnQuantity: { type: Number }
}, { _id: false }); // Disable _id for embedded documents

const MaintenanceSchema = new Schema<IMaintenance>({
  asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  type: { type: String, enum: ['preventive', 'corrective'], required: true },
  description: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String },
  completedDate: { type: Date },
  completedTime: { type: String },
  totalCost: { type: Number, default: 0 },
  totalMaintenanceTime: { type: Number, default: 0 },
  parts: [MaintenancePartSchema],
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  downtimeHours: { type: Number },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema); 