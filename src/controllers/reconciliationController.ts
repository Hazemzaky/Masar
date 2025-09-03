import { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import ReconciliationSession from '../models/ReconciliationSession';
import ReconciliationItem from '../models/ReconciliationItem';
import JournalEntry from '../models/JournalEntry';
import Account from '../models/Account';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reconciliation';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });

// Get reconciliation dashboard data
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const { accountType, status, startDate, endDate } = req.query;
    
    // Get reconciliation summary
    const summary = await (ReconciliationSession as any).getReconciliationSummary(
      accountType as string,
      status as string
    );
    
    // Get recent reconciliation sessions
    let query: any = {};
    if (accountType) query.accountType = accountType;
    if (status) query.status = status;
    if (startDate && endDate) {
      query['period.startDate'] = { $gte: new Date(startDate as string) };
      query['period.endDate'] = { $lte: new Date(endDate as string) };
    }
    
    const sessions = await ReconciliationSession.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('accountName accountType status period statementBalance glBalance difference summary createdAt');
    
    // Get accounts for reconciliation
    const accounts = await Account.find({ 
      type: { $in: ['asset', 'liability'] },
      isActive: true 
    }).select('code name type balance');
    
    res.json({
      summary,
      recentSessions: sessions,
      accounts: accounts.map(acc => ({
        id: acc._id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance: (acc as any).balance || 0,
        lastReconciled: null // TODO: Get from reconciliation sessions
      }))
    });
  } catch (error) {
    console.error('Error fetching reconciliation dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data', error });
  }
};

// Create new reconciliation session
export const createSession = async (req: Request, res: Response) => {
  try {
    const {
      accountId,
      accountName,
      accountType,
      startDate,
      endDate,
      matchingRules
    } = req.body;
    
    // Get GL balance for the account
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Get GL balance for the period
    const glBalance = await getGLBalanceForPeriod(accountId as string, startDate as string, endDate as string);
    
    const session = new ReconciliationSession({
      accountId,
      accountName,
      accountType,
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      glBalance,
      statementBalance: 0, // Will be updated when statement is uploaded
      reconciledBy: (req as any).user?.userId || 'system',
      matchingRules: {
        dateTolerance: matchingRules?.dateTolerance || 3,
        amountTolerance: matchingRules?.amountTolerance || 0.01,
        autoMatchEnabled: matchingRules?.autoMatchEnabled !== false
      }
    });
    
    await session.save();
    
    // Add audit log entry
    session.auditLog.push({
      action: 'session_created',
      description: 'Reconciliation session created',
      performedBy: (req as any).user?.userId || 'system',
      performedAt: new Date()
    });
    
    await session.save();
    
    res.json({ message: 'Reconciliation session created', session });
  } catch (error) {
    console.error('Error creating reconciliation session:', error);
    res.status(500).json({ message: 'Failed to create reconciliation session', error });
  }
};

// Upload and parse bank/vendor/customer statement
export const uploadStatement = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const session = await ReconciliationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Reconciliation session not found' });
    }
    
    // Parse the uploaded file
    const statementEntries = await parseStatementFile(file.path, session.accountType);
    
    // Update session with statement file info
    session.statementFile = {
      filename: file.filename,
      originalName: file.originalname,
      uploadedAt: new Date(),
      recordCount: statementEntries.length
    };
    
    // Calculate statement balance
    session.statementBalance = statementEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    await session.save();
    
    // Create reconciliation items for statement entries
    for (const entry of statementEntries) {
      const item = new ReconciliationItem({
        sessionId: session._id,
        statementId: entry.id,
        matchStatus: 'unmatched',
        statementEntry: {
          ...entry,
          source: session.accountType
        }
      });
      await item.save();
    }
    
    // Create reconciliation items for GL entries
    await createGLReconciliationItems(session);
    
    // Update session summary
    await updateSessionSummary(session._id as string);
    
    // Add audit log entry
    session.auditLog.push({
      action: 'statement_uploaded',
      description: `Statement uploaded: ${file.originalname} (${statementEntries.length} entries)`,
      performedBy: (req as any).user?.userId || 'system',
      performedAt: new Date(),
      details: { filename: file.originalname, recordCount: statementEntries.length }
    });
    
    await session.save();
    
    res.json({
      message: 'Statement uploaded and parsed successfully',
      recordCount: statementEntries.length,
      statementBalance: session.statementBalance
    });
  } catch (error) {
    console.error('Error uploading statement:', error);
    res.status(500).json({ message: 'Failed to upload statement', error });
  }
};

// Get reconciliation session details
export const getSessionDetails = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { matchStatus, page = 1, limit = 50 } = req.query;
    
    const session = await ReconciliationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Reconciliation session not found' });
    }
    
    // Get reconciliation items
    let query: any = { sessionId };
    if (matchStatus) {
      query.matchStatus = matchStatus;
    }
    
    const items = await ReconciliationItem.find(query)
      .sort({ createdAt: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    // Get matching statistics
    const stats = await (ReconciliationItem as any).getMatchingStats(sessionId);
    
    res.json({
      session,
      items,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await ReconciliationItem.countDocuments(query)
      }
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ message: 'Failed to fetch session details', error });
  }
};

// Perform auto-matching
export const performAutoMatch = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ReconciliationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Reconciliation session not found' });
    }
    
    if (!session.matchingRules.autoMatchEnabled) {
      return res.status(400).json({ message: 'Auto-matching is disabled for this session' });
    }
    
    // Get unmatched statement entries
    const unmatchedStatementItems = await ReconciliationItem.find({
      sessionId,
      matchStatus: 'unmatched',
      statementId: { $exists: true }
    });
    
    let matchedCount = 0;
    let pendingReviewCount = 0;
    
    for (const item of unmatchedStatementItems) {
      if (!item.statementEntry) continue;
      
      // Find potential matches
      const potentialMatches = await (ReconciliationItem as any).findPotentialMatches(
        sessionId,
        item.statementEntry,
        {
          dateTolerance: session.matchingRules.dateTolerance,
          amountTolerance: session.matchingRules.amountTolerance
        }
      );
      
      if (potentialMatches.length > 0) {
        // Find the best match
        const bestMatch = findBestMatch(item.statementEntry, potentialMatches);
        
        if (bestMatch) {
          // Update both items to matched status
          await ReconciliationItem.findByIdAndUpdate(item._id, {
            matchStatus: 'matched',
            matchType: bestMatch.confidence > 90 ? 'exact' : 'fuzzy',
            matchConfidence: bestMatch.confidence,
            glEntryId: bestMatch.glEntryId,
            matchingDetails: {
              dateDifference: bestMatch.dateDifference,
              amountDifference: bestMatch.amountDifference,
              referenceMatch: bestMatch.referenceMatch,
              descriptionSimilarity: bestMatch.descriptionSimilarity,
              matchedBy: (req as any).user?.userId || 'system',
              matchedAt: new Date()
            }
          });
          
          await ReconciliationItem.findByIdAndUpdate(bestMatch.itemId, {
            matchStatus: 'matched',
            matchType: bestMatch.confidence > 90 ? 'exact' : 'fuzzy',
            matchConfidence: bestMatch.confidence,
            statementId: item.statementId,
            matchingDetails: {
              dateDifference: bestMatch.dateDifference,
              amountDifference: bestMatch.amountDifference,
              referenceMatch: bestMatch.referenceMatch,
              descriptionSimilarity: bestMatch.descriptionSimilarity,
              matchedBy: (req as any).user?.userId || 'system',
              matchedAt: new Date()
            }
          });
          
          if (bestMatch.confidence > 90) {
            matchedCount++;
          } else {
            pendingReviewCount++;
          }
        }
      }
    }
    
    // Update session summary
    await updateSessionSummary(sessionId);
    
    // Add audit log entry
    session.auditLog.push({
      action: 'auto_match_performed',
      description: `Auto-matching completed: ${matchedCount} matched, ${pendingReviewCount} pending review`,
      performedBy: (req as any).user?.userId || 'system',
      performedAt: new Date(),
      details: { matchedCount, pendingReviewCount }
    });
    
    await session.save();
    
    res.json({
      message: 'Auto-matching completed',
      matchedCount,
      pendingReviewCount
    });
  } catch (error) {
    console.error('Error performing auto-match:', error);
    res.status(500).json({ message: 'Failed to perform auto-matching', error });
  }
};

// Manual match items
export const manualMatch = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { statementItemId, glItemId, notes } = req.body;
    
    const statementItem = await ReconciliationItem.findById(statementItemId);
    const glItem = await ReconciliationItem.findById(glItemId);
    
    if (!statementItem || !glItem) {
      return res.status(404).json({ message: 'One or both items not found' });
    }
    
    // Calculate matching details
    const matchingDetails = calculateMatchingDetails(
      statementItem.statementEntry!,
      glItem.glEntry!
    );
    
    // Update both items
    await ReconciliationItem.findByIdAndUpdate(statementItemId, {
      matchStatus: 'matched',
      matchType: 'manual',
      matchConfidence: 100,
      glEntryId: glItem.glEntryId,
      matchingDetails: {
        ...matchingDetails,
        matchedBy: (req as any).user?.userId || 'system',
        matchedAt: new Date(),
        notes
      }
    });
    
    await ReconciliationItem.findByIdAndUpdate(glItemId, {
      matchStatus: 'matched',
      matchType: 'manual',
      matchConfidence: 100,
      statementId: statementItem.statementId,
      matchingDetails: {
        ...matchingDetails,
        matchedBy: (req as any).user?.userId || 'system',
        matchedAt: new Date(),
        notes
      }
    });
    
    // Update session summary
    await updateSessionSummary(sessionId);
    
    res.json({ message: 'Items matched successfully' });
  } catch (error) {
    console.error('Error performing manual match:', error);
    res.status(500).json({ message: 'Failed to perform manual match', error });
  }
};

// Create adjusting journal entry
export const createAdjustingEntry = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { description, amount, accountCode, reference } = req.body;
    
    const session = await ReconciliationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Reconciliation session not found' });
    }
    
    // Create journal entry
    const journalEntry = new JournalEntry({
      date: new Date(),
      reference: reference || `REC-${sessionId}-${Date.now()}`,
      description: description || 'Reconciliation adjustment',
      entries: [
        {
          accountCode: session.accountId,
          debit: amount > 0 ? amount : 0,
          credit: amount < 0 ? Math.abs(amount) : 0,
          description: description || 'Reconciliation adjustment'
        },
        {
          accountCode: accountCode,
          debit: amount < 0 ? Math.abs(amount) : 0,
          credit: amount > 0 ? amount : 0,
          description: description || 'Reconciliation adjustment'
        }
      ],
      totalDebit: Math.abs(amount),
      totalCredit: Math.abs(amount),
      createdBy: (req as any).user?.userId || 'system'
    });
    
    await journalEntry.save();
    
    // Add adjustment to session
    const adjustmentId = `adj-${Date.now()}`;
    session.adjustments.push({
      id: adjustmentId,
      description,
      amount,
      journalEntryId: (journalEntry._id as any).toString(),
      createdAt: new Date(),
      createdBy: (req as any).user?.userId || 'system'
    });
    
    // Update GL balance
    session.glBalance += amount;
    
    await session.save();
    
    // Add audit log entry
    session.auditLog.push({
      action: 'adjustment_created',
      description: `Adjusting entry created: ${description} (${amount})`,
      performedBy: (req as any).user?.userId || 'system',
      performedAt: new Date(),
      details: { adjustmentId, journalEntryId: journalEntry._id, amount }
    });
    
    await session.save();
    
    res.json({
      message: 'Adjusting entry created successfully',
      journalEntry,
      adjustmentId
    });
  } catch (error) {
    console.error('Error creating adjusting entry:', error);
    res.status(500).json({ message: 'Failed to create adjusting entry', error });
  }
};

// Complete reconciliation
export const completeReconciliation = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    
    const session = await ReconciliationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Reconciliation session not found' });
    }
    
    // Check if there are unmatched items
    const unmatchedCount = await ReconciliationItem.countDocuments({
      sessionId,
      matchStatus: 'unmatched'
    });
    
    if (unmatchedCount > 0) {
      return res.status(400).json({
        message: 'Cannot complete reconciliation with unmatched items',
        unmatchedCount
      });
    }
    
    // Update session status
    session.status = 'completed';
    session.completedAt = new Date();
    
    // Add audit log entry
    session.auditLog.push({
      action: 'reconciliation_completed',
      description: 'Reconciliation completed successfully',
      performedBy: (req as any).user?.userId || 'system',
      performedAt: new Date(),
      details: { notes }
    });
    
    await session.save();
    
    res.json({ message: 'Reconciliation completed successfully' });
  } catch (error) {
    console.error('Error completing reconciliation:', error);
    res.status(500).json({ message: 'Failed to complete reconciliation', error });
  }
};

// Helper functions
async function getGLBalanceForPeriod(accountId: string, startDate: string, endDate: string): Promise<number> {
  // This would typically query the General Ledger for the account balance
  // For now, return a mock balance
  return 0;
}

async function parseStatementFile(filePath: string, accountType: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Parse based on account type
        const entry = parseStatementEntry(data, accountType);
        if (entry) {
          results.push(entry);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function parseStatementEntry(data: any, accountType: string): any {
  // This would parse different statement formats based on account type
  // For now, return a mock entry
  return {
    id: `stmt-${Date.now()}-${Math.random()}`,
    date: new Date(data.date || new Date()),
    reference: data.reference || '',
    description: data.description || data.memo || '',
    amount: parseFloat(data.amount || 0),
    balance: parseFloat(data.balance || 0),
    transactionType: data.type || 'unknown'
  };
}

async function createGLReconciliationItems(session: any): Promise<void> {
  // This would create reconciliation items for GL entries
  // For now, create mock items
  const mockGlEntries = [
    {
      id: 'gl-1',
      date: new Date(),
      reference: 'JE-001',
      description: 'Sample GL Entry',
      amount: 1000,
      accountCode: session.accountId,
      accountName: session.accountName,
      journalEntryId: 'je-1'
    }
  ];
  
  for (const entry of mockGlEntries) {
    const item = new ReconciliationItem({
      sessionId: session._id,
      glEntryId: entry.id,
      matchStatus: 'unmatched',
      glEntry: entry
    });
    await item.save();
  }
}

async function updateSessionSummary(sessionId: string): Promise<void> {
  const stats = await (ReconciliationItem as any).getMatchingStats(sessionId);
  
  await ReconciliationSession.findByIdAndUpdate(sessionId, {
    'summary.totalItems': stats.totalItems,
    'summary.matchedItems': stats.matched,
    'summary.unmatchedItems': stats.unmatched,
    'summary.pendingReview': stats.pendingReview,
    'summary.adjustmentEntries': 0 // TODO: Count from adjustments
  });
}

function findBestMatch(statementEntry: any, potentialMatches: any[]): any {
  // Implement matching algorithm
  // For now, return the first match
  if (potentialMatches.length === 0) return null;
  
  const match = potentialMatches[0];
  return {
    itemId: match._id,
    glEntryId: match.glEntryId,
    confidence: 95,
    dateDifference: 0,
    amountDifference: 0,
    referenceMatch: true,
    descriptionSimilarity: 90
  };
}

function calculateMatchingDetails(statementEntry: any, glEntry: any): any {
  const dateDifference = Math.abs(
    (statementEntry.date.getTime() - glEntry.date.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const amountDifference = statementEntry.amount - glEntry.amount;
  
  const referenceMatch = statementEntry.reference === glEntry.reference;
  
  // Simple description similarity (in real implementation, use more sophisticated algorithm)
  const descriptionSimilarity = calculateStringSimilarity(
    statementEntry.description,
    glEntry.description
  );
  
  return {
    dateDifference,
    amountDifference,
    referenceMatch,
    descriptionSimilarity
  };
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple similarity calculation (in real implementation, use Levenshtein distance or similar)
  const words1 = str1.toLowerCase().split(' ');
  const words2 = str2.toLowerCase().split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  return (commonWords.length / Math.max(words1.length, words2.length)) * 100;
}
