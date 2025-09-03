import mongoose, { Schema, Document } from 'mongoose';

export interface IReconciliationItem extends Document {
  sessionId: string;
  glEntryId?: string;
  statementId?: string;
  matchStatus: 'matched' | 'unmatched' | 'pending-review' | 'excluded';
  matchType?: 'exact' | 'fuzzy' | 'manual';
  matchConfidence?: number; // 0-100
  
  // GL Entry details
  glEntry?: {
    id: string;
    date: Date;
    reference: string;
    description: string;
    amount: number;
    accountCode: string;
    accountName: string;
    journalEntryId: string;
  };
  
  // Statement details
  statementEntry?: {
    id: string;
    date: Date;
    reference?: string;
    description: string;
    amount: number;
    balance?: number;
    transactionType?: string;
    source: string; // 'bank', 'vendor', 'customer'
  };
  
  // Matching details
  matchingDetails?: {
    dateDifference: number; // days
    amountDifference: number;
    referenceMatch: boolean;
    descriptionSimilarity: number; // 0-100
    matchedBy: string;
    matchedAt: Date;
    notes?: string;
  };
  
  // Review details
  reviewDetails?: {
    reviewedBy: string;
    reviewedAt: Date;
    reviewNotes?: string;
    action: 'approve' | 'reject' | 'modify';
  };
  
  // Exclusion details
  exclusionDetails?: {
    excludedBy: string;
    excludedAt: Date;
    reason: string;
    notes?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const ReconciliationItemSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  glEntryId: {
    type: String,
    index: true
  },
  statementId: {
    type: String,
    index: true
  },
  matchStatus: {
    type: String,
    enum: ['matched', 'unmatched', 'pending-review', 'excluded'],
    default: 'unmatched',
    index: true
  },
  matchType: {
    type: String,
    enum: ['exact', 'fuzzy', 'manual']
  },
  matchConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  glEntry: {
    id: String,
    date: Date,
    reference: String,
    description: String,
    amount: Number,
    accountCode: String,
    accountName: String,
    journalEntryId: String
  },
  statementEntry: {
    id: String,
    date: Date,
    reference: String,
    description: String,
    amount: Number,
    balance: Number,
    transactionType: String,
    source: String
  },
  matchingDetails: {
    dateDifference: Number,
    amountDifference: Number,
    referenceMatch: Boolean,
    descriptionSimilarity: Number,
    matchedBy: String,
    matchedAt: Date,
    notes: String
  },
  reviewDetails: {
    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String,
    action: {
      type: String,
      enum: ['approve', 'reject', 'modify']
    }
  },
  exclusionDetails: {
    excludedBy: String,
    excludedAt: Date,
    reason: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
ReconciliationItemSchema.index({ sessionId: 1, matchStatus: 1 });
ReconciliationItemSchema.index({ glEntryId: 1 });
ReconciliationItemSchema.index({ statementId: 1 });
ReconciliationItemSchema.index({ matchStatus: 1, matchType: 1 });

// Virtual for calculating match quality score
ReconciliationItemSchema.virtual('matchQualityScore').get(function() {
  if (!this.matchingDetails) return 0;
  
  let score = 0;
  const details = this.matchingDetails as any;
  
  // Date match (40% weight)
  if (details.dateDifference === 0) {
    score += 40;
  } else if (details.dateDifference <= 1) {
    score += 30;
  } else if (details.dateDifference <= 3) {
    score += 20;
  } else if (details.dateDifference <= 7) {
    score += 10;
  }
  
  // Amount match (30% weight)
  if (details.amountDifference === 0) {
    score += 30;
  } else if (Math.abs(details.amountDifference) <= 0.01) {
    score += 25;
  } else if (Math.abs(details.amountDifference) <= 0.05) {
    score += 20;
  } else if (Math.abs(details.amountDifference) <= 0.1) {
    score += 10;
  }
  
  // Reference match (20% weight)
  if (details.referenceMatch) {
    score += 20;
  }
  
  // Description similarity (10% weight)
  score += (details.descriptionSimilarity || 0) * 0.1;
  
  return Math.round(score);
});

// Static method to get matching statistics
ReconciliationItemSchema.statics.getMatchingStats = async function(sessionId: string) {
  const stats = await this.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: '$matchStatus',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$matchConfidence' },
        avgQualityScore: { $avg: '$matchQualityScore' }
      }
    }
  ]);
  
  const result = {
    matched: 0,
    unmatched: 0,
    pendingReview: 0,
    excluded: 0,
    totalItems: 0,
    avgConfidence: 0,
    avgQualityScore: 0
  };
  
  stats.forEach((stat: any) => {
    result[stat._id as keyof typeof result] = stat.count;
    result.totalItems += stat.count;
    result.avgConfidence += stat.avgConfidence * stat.count;
    result.avgQualityScore += stat.avgQualityScore * stat.count;
  });
  
  if (result.totalItems > 0) {
    result.avgConfidence = Math.round(result.avgConfidence / result.totalItems);
    result.avgQualityScore = Math.round(result.avgQualityScore / result.totalItems);
  }
  
  return result;
};

// Static method to find potential matches
ReconciliationItemSchema.statics.findPotentialMatches = async function(
  sessionId: string,
  statementEntry: any,
  tolerance: { dateTolerance: number, amountTolerance: number }
) {
  const { dateTolerance, amountTolerance } = tolerance;
  
  // Find GL entries within date range
  const startDate = new Date(statementEntry.date);
  startDate.setDate(startDate.getDate() - dateTolerance);
  const endDate = new Date(statementEntry.date);
  endDate.setDate(endDate.getDate() + dateTolerance);
  
  // Find unmatched GL entries in the session
  const unmatchedGlEntries = await this.find({
    sessionId,
    matchStatus: 'unmatched',
    'glEntry.date': { $gte: startDate, $lte: endDate },
    'glEntry.amount': {
      $gte: statementEntry.amount * (1 - amountTolerance),
      $lte: statementEntry.amount * (1 + amountTolerance)
    }
  }).sort({ 'glEntry.date': 1, 'glEntry.amount': 1 });
  
  return unmatchedGlEntries;
};

export default mongoose.model<IReconciliationItem>('ReconciliationItem', ReconciliationItemSchema);
