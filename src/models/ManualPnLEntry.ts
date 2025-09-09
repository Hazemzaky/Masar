import mongoose, { Document, Schema } from 'mongoose';

// Manual P&L Entry Interface
export interface IManualPnLEntry extends Document {
  itemId: string;
  description: string;
  amount: number;
  category: 'revenue' | 'expense' | 'other_income';
  type: 'revenue' | 'expense';
  notes?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  // Optional fields for future enhancements
  period?: string;
  startDate?: Date;
  endDate?: Date;
  attachedFiles?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
}

// Manual P&L Entry Schema
const ManualPnLEntrySchema = new Schema<IManualPnLEntry>({
  itemId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['revenue', 'expense', 'other_income']
  },
  type: {
    type: String,
    required: true,
    enum: ['revenue', 'expense']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdBy: {
    type: String,
    required: true,
    default: 'system'
  },
  updatedBy: {
    type: String,
    required: true,
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  attachedFiles: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'manualpnlentries'
});

// Indexes for better query performance
ManualPnLEntrySchema.index({ itemId: 1 });
ManualPnLEntrySchema.index({ category: 1 });
ManualPnLEntrySchema.index({ type: 1 });
ManualPnLEntrySchema.index({ isActive: 1 });
ManualPnLEntrySchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedBy field
ManualPnLEntrySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Static method to get all active entries
ManualPnLEntrySchema.statics.getActiveEntries = function() {
  return this.find({ isActive: true }).sort({ itemId: 1 });
};

// Static method to get entries by category
ManualPnLEntrySchema.statics.getEntriesByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ itemId: 1 });
};

// Instance method to update amount
ManualPnLEntrySchema.methods.updateAmount = function(newAmount: number, updatedBy: string) {
  this.amount = newAmount;
  this.updatedBy = updatedBy;
  return this.save();
};

// Instance method to add notes
ManualPnLEntrySchema.methods.addNotes = function(notes: string, updatedBy: string) {
  this.notes = notes;
  this.updatedBy = updatedBy;
  return this.save();
};

// Instance method to attach file
ManualPnLEntrySchema.methods.attachFile = function(fileInfo: {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}) {
  if (!this.attachedFiles) {
    this.attachedFiles = [];
  }
  this.attachedFiles.push({
    ...fileInfo,
    uploadedAt: new Date()
  });
  return this.save();
};

const ManualPnLEntry = mongoose.model<IManualPnLEntry>('ManualPnLEntry', ManualPnLEntrySchema);

export default ManualPnLEntry;
