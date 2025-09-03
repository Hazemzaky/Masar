import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  // Basic Information
  title: string;
  description?: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  
  // Module and Category
  module: 'hr' | 'finance' | 'procurement' | 'assets' | 'hse' | 'general';
  category: string; // e.g., 'contracts', 'invoices', 'employee-docs', 'safety-reports'
  subcategory?: string;
  
  // Entity Association
  entityType?: 'employee' | 'vendor' | 'asset' | 'project' | 'invoice' | 'contract' | 'general';
  entityId?: string; // Reference to the associated entity
  
  // Access Control
  permissions: {
    roles: string[]; // ['hr', 'finance', 'admin', 'employee']
    users: string[]; // Specific user IDs
    departments: string[]; // Department-based access
    isPublic: boolean; // Public documents (limited use)
  };
  
  // Versioning
  currentVersion: number;
  totalVersions: number;
  isLatestVersion: boolean;
  parentDocumentId?: string; // For versioned documents
  
  // Metadata
  tags: string[];
  keywords: string[];
  
  // Upload Information
  uploadedBy: string; // User ID
  uploadedAt: Date;
  
  // Status
  status: 'active' | 'archived' | 'deleted';
  
  // Security
  isEncrypted: boolean;
  encryptionKey?: string;
  
  // Audit
  lastAccessedAt?: Date;
  accessCount: number;
  
  // Expiry (for time-sensitive documents)
  expiryDate?: Date;
  isExpired: boolean;
  
  // Compliance
  retentionPeriod?: number; // Days
  complianceTags: string[]; // ['gdpr', 'sox', 'hipaa', etc.]
  
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true,
    unique: true
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
  fileExtension: {
    type: String,
    required: true
  },
  
  // Module and Category
  module: {
    type: String,
    enum: ['hr', 'finance', 'procurement', 'assets', 'hse', 'general'],
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    index: true
  },
  
  // Entity Association
  entityType: {
    type: String,
    enum: ['employee', 'vendor', 'asset', 'project', 'invoice', 'contract', 'general']
  },
  entityId: {
    type: String,
    index: true
  },
  
  // Access Control
  permissions: {
    roles: [{
      type: String,
      enum: ['hr', 'finance', 'admin', 'employee', 'manager', 'supervisor']
    }],
    users: [String], // User IDs
    departments: [String],
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  
  // Versioning
  currentVersion: {
    type: Number,
    default: 1
  },
  totalVersions: {
    type: Number,
    default: 1
  },
  isLatestVersion: {
    type: Boolean,
    default: true
  },
  parentDocumentId: {
    type: String,
    index: true
  },
  
  // Metadata
  tags: [String],
  keywords: [String],
  
  // Upload Information
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
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  
  // Security
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: String,
  
  // Audit
  lastAccessedAt: Date,
  accessCount: {
    type: Number,
    default: 0
  },
  
  // Expiry
  expiryDate: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Compliance
  retentionPeriod: Number, // Days
  complianceTags: [String]
}, {
  timestamps: true
});

// Indexes for better performance
DocumentSchema.index({ module: 1, category: 1 });
DocumentSchema.index({ entityType: 1, entityId: 1 });
DocumentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
DocumentSchema.index({ status: 1, isLatestVersion: 1 });
DocumentSchema.index({ 'permissions.roles': 1 });
DocumentSchema.index({ tags: 1 });
DocumentSchema.index({ expiryDate: 1, isExpired: 1 });

// Virtual for file size in human readable format
DocumentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = (this as any).fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for download URL
DocumentSchema.virtual('downloadUrl').get(function() {
  return `/api/documents/${this._id}/download`;
});

// Pre-save middleware
DocumentSchema.pre('save', function(next) {
  // Check if document is expired
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.isExpired = true;
  }
  
  // Generate keywords from title and description
  if (this.isModified('title') || this.isModified('description')) {
    const text = `${this.title} ${this.description || ''}`.toLowerCase();
    this.keywords = [...new Set(text.split(/\s+/).filter(word => word.length > 2))];
  }
  
  next();
});

// Static method to get documents by module and permissions
DocumentSchema.statics.getDocumentsByModule = async function(
  module: string,
  userRoles: string[],
  userId: string,
  options: any = {}
) {
  const query: any = {
    module,
    status: 'active',
    isLatestVersion: true,
    $or: [
      { 'permissions.isPublic': true },
      { 'permissions.roles': { $in: userRoles } },
      { 'permissions.users': userId }
    ]
  };
  
  // Add entity filter if provided
  if (options.entityType && options.entityId) {
    query.entityType = options.entityType;
    query.entityId = options.entityId;
  }
  
  // Add category filter if provided
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .sort({ uploadedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to check document access
DocumentSchema.statics.checkAccess = async function(
  documentId: string,
  userRoles: string[],
  userId: string
) {
  const document = await this.findById(documentId);
  if (!document) return false;
  
  // Check if document is active
  if (document.status !== 'active') return false;
  
  // Check if document is expired
  if (document.isExpired) return false;
  
  // Check permissions
  const hasAccess = 
    document.permissions.isPublic ||
    document.permissions.roles.some((role: string) => userRoles.includes(role)) ||
    document.permissions.users.includes(userId);
  
  return hasAccess;
};

// Static method to get document statistics
DocumentSchema.statics.getDocumentStats = async function(module?: string) {
  const matchQuery: any = { status: 'active' };
  if (module) matchQuery.module = module;
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        avgSize: { $avg: '$fileSize' },
        byModule: {
          $push: {
            module: '$module',
            category: '$category',
            size: '$fileSize'
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalDocuments: 0,
    totalSize: 0,
    avgSize: 0,
    byModule: []
  };
};

export default mongoose.model<IDocument>('Document', DocumentSchema);
