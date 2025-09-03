import mongoose, { Schema, Document } from 'mongoose';

export interface IReconciliationSession extends Document {
  accountId: string;
  accountName: string;
  accountType: 'bank' | 'vendor' | 'customer' | 'inter-module';
  period: {
    startDate: Date;
    endDate: Date;
  };
  statementBalance: number;
  glBalance: number;
  difference: number;
  status: 'draft' | 'in-progress' | 'completed' | 'reviewed';
  reconciledBy: string;
  reviewedBy?: string;
  statementFile?: {
    filename: string;
    originalName: string;
    uploadedAt: Date;
    recordCount: number;
  };
  matchingRules: {
    dateTolerance: number; // days
    amountTolerance: number; // percentage
    autoMatchEnabled: boolean;
  };
  summary: {
    totalItems: number;
    matchedItems: number;
    unmatchedItems: number;
    pendingReview: number;
    adjustmentEntries: number;
  };
  adjustments: Array<{
    id: string;
    description: string;
    amount: number;
    journalEntryId?: string;
    createdAt: Date;
    createdBy: string;
  }>;
  auditLog: Array<{
    action: string;
    description: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const ReconciliationSessionSchema: Schema = new Schema({
  accountId: {
    type: String,
    required: true,
    index: true
  },
  accountName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['bank', 'vendor', 'customer', 'inter-module'],
    required: true,
    index: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  statementBalance: {
    type: Number,
    required: true,
    default: 0
  },
  glBalance: {
    type: Number,
    required: true,
    default: 0
  },
  difference: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'reviewed'],
    default: 'draft',
    index: true
  },
  reconciledBy: {
    type: String,
    required: true
  },
  reviewedBy: {
    type: String
  },
  statementFile: {
    filename: String,
    originalName: String,
    uploadedAt: Date,
    recordCount: Number
  },
  matchingRules: {
    dateTolerance: {
      type: Number,
      default: 3 // 3 days tolerance
    },
    amountTolerance: {
      type: Number,
      default: 0.01 // 1% tolerance
    },
    autoMatchEnabled: {
      type: Boolean,
      default: true
    }
  },
  summary: {
    totalItems: {
      type: Number,
      default: 0
    },
    matchedItems: {
      type: Number,
      default: 0
    },
    unmatchedItems: {
      type: Number,
      default: 0
    },
    pendingReview: {
      type: Number,
      default: 0
    },
    adjustmentEntries: {
      type: Number,
      default: 0
    }
  },
  adjustments: [{
    id: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    journalEntryId: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String,
      required: true
    }
  }],
  auditLog: [{
    action: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes for better performance
ReconciliationSessionSchema.index({ accountId: 1, 'period.startDate': 1, 'period.endDate': 1 });
ReconciliationSessionSchema.index({ status: 1, createdAt: -1 });
ReconciliationSessionSchema.index({ accountType: 1, status: 1 });

// Virtual for calculating difference
ReconciliationSessionSchema.virtual('calculatedDifference').get(function() {
  return (this as any).statementBalance - (this as any).glBalance;
});

// Pre-save middleware to update difference and summary
ReconciliationSessionSchema.pre('save', function(next) {
  this.difference = this.calculatedDifference;
  
  // Update summary if reconciliation items exist
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
  }
  
  next();
});

// Static method to get reconciliation summary
ReconciliationSessionSchema.statics.getReconciliationSummary = async function(accountType?: string, status?: string) {
  const matchQuery: any = {};
  
  if (accountType) {
    matchQuery.accountType = accountType;
  }
  
  if (status) {
    matchQuery.status = status;
  }
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDifference: { $sum: '$difference' },
        avgDifference: { $avg: '$difference' },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        inProgressSessions: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        totalMatchedItems: { $sum: '$summary.matchedItems' },
        totalUnmatchedItems: { $sum: '$summary.unmatchedItems' }
      }
    }
  ]);
  
  return summary[0] || {
    totalSessions: 0,
    totalDifference: 0,
    avgDifference: 0,
    completedSessions: 0,
    inProgressSessions: 0,
    totalMatchedItems: 0,
    totalUnmatchedItems: 0
  };
};

export default mongoose.model<IReconciliationSession>('ReconciliationSession', ReconciliationSessionSchema);
