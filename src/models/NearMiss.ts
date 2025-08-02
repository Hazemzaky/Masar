import mongoose, { Document, Schema } from 'mongoose';

export interface INearMiss extends Document {
  serialNumber: string;
  date: Date;
  description: string;
  driver: mongoose.Types.ObjectId;
  abbreviation: 'Motor Vehicle Accident' | 'Property Damage' | 'Injury';
  incidentSeverity: 'Normal' | 'Low' | 'Medium' | 'High';
  driverAtFault: 'At Fault' | 'Not At Fault';
  damageDescription?: string;
  directOrRootCause?: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NearMissSchema = new Schema<INearMiss>({
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  abbreviation: {
    type: String,
    enum: ['Motor Vehicle Accident', 'Property Damage', 'Injury'],
    required: true
  },
  incidentSeverity: {
    type: String,
    enum: ['Normal', 'Low', 'Medium', 'High'],
    required: true
  },
  driverAtFault: {
    type: String,
    enum: ['At Fault', 'Not At Fault'],
    required: true
  },
  damageDescription: {
    type: String
  },
  directOrRootCause: {
    type: String
  },
  actionTaken: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model<INearMiss>('NearMiss', NearMissSchema); 