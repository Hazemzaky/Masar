import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeResidency extends Document {
  employee: mongoose.Types.ObjectId;
  personType: 'citizen' | 'foreigner';
  passportNumber: string;
  passportExpiry: Date;
  nationality: string;
  residencyNumber?: string;
  residencyExpiry?: Date;
  civilId?: string;
  civilIdExpiry?: Date;
  visaType: 'business_visa' | 'work_visa' | 'family_visa' | 'other';
  visaNumber: string;
  visaExpiry: Date;
  sponsor: string;
  sponsorType: 'company' | 'individual';
  status: 'active' | 'expired' | 'pending_renewal' | 'cancelled';
  documents: {
    passportCopy: string;
    residencyCopy: string;
    civilIdCopy: string;
    visaCopy: string;
    otherDocuments: string[];
  };
  notes: string;
  renewalReminders: {
    enabled: boolean;
    reminderDays: number[];
    lastReminderSent: Date;
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeResidencySchema = new Schema<IEmployeeResidency>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  personType: { type: String, enum: ['citizen', 'foreigner'], required: true },
  passportNumber: { type: String, required: true },
  passportExpiry: { type: Date, required: true },
  nationality: { type: String, required: true },
  residencyNumber: { type: String, required: function(this: any) { return this.personType === 'foreigner'; } },
  residencyExpiry: { type: Date, required: function(this: any) { return this.personType === 'foreigner'; } },
  civilId: { type: String, required: function(this: any) { return this.personType === 'citizen'; } },
  civilIdExpiry: { type: Date, required: function(this: any) { return this.personType === 'citizen'; } },
  visaType: { 
    type: String, 
    enum: ['business_visa', 'work_visa', 'family_visa', 'other'], 
    required: true 
  },
  visaNumber: { type: String, required: true },
  visaExpiry: { type: Date, required: true },
  sponsor: { type: String, required: true },
  sponsorType: { 
    type: String, 
    enum: ['company', 'individual'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'pending_renewal', 'cancelled'], 
    default: 'active' 
  },
  documents: {
    passportCopy: { type: String },
    residencyCopy: { type: String },
    civilIdCopy: { type: String },
    visaCopy: { type: String },
    otherDocuments: [{ type: String }]
  },
  notes: { type: String },
  renewalReminders: {
    enabled: { type: Boolean, default: true },
    reminderDays: [{ type: Number, default: [30, 15, 7, 1] }],
    lastReminderSent: { type: Date }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IEmployeeResidency>('EmployeeResidency', employeeResidencySchema); 