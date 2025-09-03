import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentAudit extends Document {
  documentId: string;
  action: 'upload' | 'download' | 'view' | 'update' | 'delete' | 'restore' | 'archive' | 'share' | 'permission_change';
  performedBy: string; // User ID
  performedAt: Date;
  
  // Action details
  details: {
    fileName?: string;
    fileSize?: number;
    version?: number;
    previousVersion?: number;
    changeDescription?: string;
    ipAddress?: string;
    userAgent?: string;
    downloadMethod?: 'direct' | 'api' | 'bulk';
    sharedWith?: string[]; // User IDs or roles
    permissionChanges?: {
      added: string[];
      removed: string[];
    };
  };
  
  // Context
  module: string;
  category: string;
  entityType?: string;
  entityId?: string;
  
  // Result
  success: boolean;
  errorMessage?: string;
  
  createdAt: Date;
}

const DocumentAuditSchema: Schema = new Schema({
  documentId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['upload', 'download', 'view', 'update', 'delete', 'restore', 'archive', 'share', 'permission_change'],
    required: true,
    index: true
  },
  performedBy: {
    type: String,
    required: true,
    index: true
  },
  performedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Action details
  details: {
    fileName: String,
    fileSize: Number,
    version: Number,
    previousVersion: Number,
    changeDescription: String,
    ipAddress: String,
    userAgent: String,
    downloadMethod: {
      type: String,
      enum: ['direct', 'api', 'bulk']
    },
    sharedWith: [String],
    permissionChanges: {
      added: [String],
      removed: [String]
    }
  },
  
  // Context
  module: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  entityType: String,
  entityId: String,
  
  // Result
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  errorMessage: String
}, {
  timestamps: true
});

// Indexes for efficient querying
DocumentAuditSchema.index({ documentId: 1, performedAt: -1 });
DocumentAuditSchema.index({ performedBy: 1, performedAt: -1 });
DocumentAuditSchema.index({ action: 1, performedAt: -1 });
DocumentAuditSchema.index({ module: 1, category: 1, performedAt: -1 });

// Static method to log audit event
DocumentAuditSchema.statics.logEvent = async function(
  documentId: string,
  action: string,
  performedBy: string,
  details: any = {},
  context: any = {}
) {
  const auditEntry = new this({
    documentId,
    action,
    performedBy,
    details,
    ...context
  });
  
  return auditEntry.save();
};

// Static method to get audit trail for a document
DocumentAuditSchema.statics.getDocumentAuditTrail = async function(
  documentId: string,
  options: any = {}
) {
  const query: any = { documentId };
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.startDate && options.endDate) {
    query.performedAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .sort({ performedAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

// Static method to get user activity
DocumentAuditSchema.statics.getUserActivity = async function(
  userId: string,
  options: any = {}
) {
  const query: any = { performedBy: userId };
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.startDate && options.endDate) {
    query.performedAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .sort({ performedAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

// Static method to get audit statistics
DocumentAuditSchema.statics.getAuditStats = async function(
  module?: string,
  startDate?: Date,
  endDate?: Date
) {
  const matchQuery: any = {};
  
  if (module) matchQuery.module = module;
  if (startDate && endDate) {
    matchQuery.performedAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$performedBy' },
        uniqueDocuments: { $addToSet: '$documentId' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueDocuments: { $size: '$uniqueDocuments' }
      }
    }
  ]);
  
  return stats;
};

export default mongoose.model<IDocumentAudit>('DocumentAudit', DocumentAuditSchema);
