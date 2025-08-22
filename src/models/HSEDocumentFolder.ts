import mongoose, { Schema, Document } from 'mongoose';

export interface IHSEDocumentFolder extends Document {
  name: string;
  description?: string;
  parentFolder?: mongoose.Types.ObjectId;
  path: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HSEDocumentFolderSchema = new Schema<IHSEDocumentFolder>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentFolder: {
    type: Schema.Types.ObjectId,
    ref: 'HSEDocumentFolder',
    default: null
  },
  path: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create a compound index for parentFolder and name to ensure unique folder names within the same parent
HSEDocumentFolderSchema.index({ parentFolder: 1, name: 1 }, { unique: true });

// Pre-save middleware to generate path
HSEDocumentFolderSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name') || this.isModified('parentFolder')) {
    if (this.parentFolder) {
      const parent = await mongoose.model('HSEDocumentFolder').findById(this.parentFolder);
      if (parent) {
        this.path = `${parent.path}/${this.name}`;
      } else {
        this.path = this.name;
      }
    } else {
      this.path = this.name;
    }
  }
  next();
});

export default mongoose.model<IHSEDocumentFolder>('HSEDocumentFolder', HSEDocumentFolderSchema); 