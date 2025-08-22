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
  try {
    console.log('HSEDocumentFolder pre-save middleware executing...');
    console.log('Document data:', {
      name: this.name,
      parentFolder: this.parentFolder,
      isNew: this.isNew,
      modifiedFields: this.modifiedPaths()
    });
    
    // Always generate path for new documents or when name/parentFolder changes
    if (this.isNew || this.isModified('name') || this.isModified('parentFolder')) {
      if (this.parentFolder) {
        console.log('Parent folder exists, looking up parent...');
        const parent = await mongoose.model('HSEDocumentFolder').findById(this.parentFolder);
        if (parent) {
          this.path = `${parent.path}/${this.name}`;
          console.log('Set path to:', this.path);
        } else {
          console.log('Parent not found, setting path to name only');
          this.path = this.name;
        }
      } else {
        console.log('No parent folder, setting path to name only');
        this.path = this.name;
      }
    } else {
      console.log('No relevant fields modified, keeping existing path');
    }
    
    // Fallback: ensure path is always set
    if (!this.path) {
      console.log('Path is still undefined, setting fallback path');
      this.path = this.name;
    }
    
    console.log('Final path value:', this.path);
    next();
  } catch (error) {
    console.error('Error in HSEDocumentFolder pre-save middleware:', error);
    // Fallback: set path to name if middleware fails
    if (!this.path) {
      this.path = this.name;
    }
    next();
  }
});

export default mongoose.model<IHSEDocumentFolder>('HSEDocumentFolder', HSEDocumentFolderSchema); 