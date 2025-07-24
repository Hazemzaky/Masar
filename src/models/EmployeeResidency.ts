import mongoose, { Document, Schema } from 'mongoose';

export interface IPass {
  passType: 'KOC' | 'KNPC' | 'GO' | 'RATQA' | 'ABDALI' | 'WANEET';
  issuanceDate: Date;
  expiryDate: Date;
  sponsor: string;
}

export interface IEmployeeResidency extends Document {
  employee: mongoose.Types.ObjectId;
  employeeType: 'citizen' | 'foreigner';
  coId?: string; // 5 digits
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
  status: 'active' | 'expired' | 'under_renewal' | 'cancelled' | 'deported';
  hasPasses: boolean;
  passes: IPass[];
  passCopies?: string[];
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  numberOfDependents?: number;
  dependentsLocation?: 'kuwait' | 'home_country' | 'other';
  dependentsLocationOther?: string;
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
  workPermitStart?: Date;
  workPermitEnd?: Date;
  workPermitCopy?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const passSchema = new Schema<IPass>({
  passType: { 
    type: String, 
    enum: ['KOC', 'KNPC', 'GO', 'RATQA', 'ABDALI', 'WANEET'], 
    required: true 
  },
  issuanceDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  sponsor: { type: String, required: true }
});

const employeeResidencySchema = new Schema<IEmployeeResidency>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeType: { type: String, enum: ['citizen', 'foreigner'], required: true },
  coId: { type: String, maxlength: 5, minlength: 5 }, // 5 digits
  passportNumber: { type: String, required: true },
  passportExpiry: { type: Date, required: true },
  nationality: { type: String, required: true },
  residencyNumber: { type: String, required: function(this: any) { return this.employeeType === 'foreigner'; } },
  residencyExpiry: { type: Date, required: function(this: any) { return this.employeeType === 'foreigner'; } },
  civilId: { type: String, required: function(this: any) { return this.employeeType === 'citizen'; } },
  civilIdExpiry: { type: Date, required: function(this: any) { return this.employeeType === 'citizen'; } },
  visaType: { 
    type: String, 
    enum: ['business_visa', 'work_visa', 'family_visa', 'other'], 
    required: true 
  },
  visaNumber: { type: String, required: true },
  visaExpiry: { type: Date, required: true },
  sponsor: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'under_renewal', 'cancelled', 'deported'], 
    default: 'active' 
  },
  hasPasses: { type: Boolean, default: false },
  passes: [passSchema],
  passCopies: [{ type: String }],
  maritalStatus: { 
    type: String, 
    enum: ['single', 'married', 'divorced', 'widowed'] 
  },
  numberOfDependents: { type: Number, min: 0 },
  dependentsLocation: { 
    type: String, 
    enum: ['kuwait', 'home_country', 'other'] 
  },
  dependentsLocationOther: { type: String },
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
  workPermitStart: { type: Date },
  workPermitEnd: { type: Date },
  workPermitCopy: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IEmployeeResidency>('EmployeeResidency', employeeResidencySchema); 