import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentVersion extends Document {
  documentId: string; // Reference to the main document
  version: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  originalName: string;
  
  // Version-specific metadata
  changeDescription?: string;
  changeReason?: string;
  
  // Upload information
  uploadedBy: string;
  uploadedAt: Date;
  
  // File integrity
  checksum: string; // MD5 or SHA256 hash
  isCorrupted: boolean;
  
  // Status
  status: 'active' | 'archived' | 'deleted';
  
  createdAt: Date;
  updatedAt: Date;
}

const DocumentVersionSchema: Schema = new Schema({
  documentId: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: Number,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  
  // Version-specific metadata
  changeDescription: String,
  changeReason: String,
  
  // Upload information
  uploadedBy: {
    type: String,
    required: true,
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // File integrity
  checksum: {
    type: String,
    required: true
  },
  isCorrupted: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient version queries
DocumentVersionSchema.index({ documentId: 1, version: 1 }, { unique: true });
DocumentVersionSchema.index({ documentId: 1, status: 1 });

// Virtual for file size in human readable format
DocumentVersionSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = (this as any).fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to get all versions of a document
DocumentVersionSchema.statics.getDocumentVersions = async function(documentId: string) {
  return this.find({ documentId, status: 'active' })
    .sort({ version: -1 });
};

// Static method to get latest version
DocumentVersionSchema.statics.getLatestVersion = async function(documentId: string) {
  return this.findOne({ documentId, status: 'active' })
    .sort({ version: -1 });
};

// Static method to create new version
DocumentVersionSchema.statics.createVersion = async function(
  documentId: string,
  versionData: any
) {
  // Get the next version number
  const latestVersion = await this.findOne({ documentId })
    .sort({ version: -1 });
  
  const nextVersion = latestVersion ? latestVersion.version + 1 : 1;
  
  const version = new this({
    ...versionData,
    documentId,
    version: nextVersion
  });
  
  return version.save();
};

export default mongoose.model<IDocumentVersion>('DocumentVersion', DocumentVersionSchema);
