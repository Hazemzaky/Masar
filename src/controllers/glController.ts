import { Request, Response } from 'express';
import mongoose from 'mongoose';
import GeneralLedgerEntry from '../models/GeneralLedgerEntry';
import ChartOfAccounts from '../models/ChartOfAccounts';
import User from '../models/User';

// Extend Request interface to include user property
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Helper function to generate transaction ID
function generateTransactionId(moduleSource: string, referenceType: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${moduleSource.toUpperCase()}-${referenceType.toUpperCase()}-${timestamp}-${random}`.toUpperCase();
}

// Helper function to determine period based on date
function getPeriodFromDate(date: Date): string {
  const month = date.getMonth() + 1;
  if (month <= 3) return 'quarterly';
  if (month <= 6) return 'half_yearly';
  if (month <= 12) return 'yearly';
  return 'monthly';
}

// Create GL entries for a transaction (double-entry)
export const createGLTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { entries, moduleSource, referenceType, referenceId, transactionDate, description } = req.body;

    if (!Array.isArray(entries) || entries.length < 2) {
      res.status(400).json({ message: 'At least two entries required for double-entry bookkeeping' });
      return;
    }

    // Validate double-entry balance
    const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      res.status(400).json({ 
        message: 'Double-entry validation failed: Debits must equal Credits',
        totalDebits,
        totalCredits,
        difference: totalDebits - totalCredits
      });
      return;
    }

    const transactionId = generateTransactionId(moduleSource, referenceType);
    const period = getPeriodFromDate(new Date(transactionDate));
    const fiscalYear = new Date(transactionDate).getFullYear();

    // Create GL entries
    const glEntries = await Promise.all(
      entries.map(async (entry) => {
        // Verify account exists
        const account = await ChartOfAccounts.findById(entry.account);
        if (!account) {
          throw new Error(`Account ${entry.account} not found`);
        }

        const glEntry = new GeneralLedgerEntry({
          transactionId,
          transactionDate: new Date(transactionDate),
          moduleSource,
          referenceType,
          referenceId,
          accountCode: account.accountCode,
          account: entry.account,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          description: entry.description || description,
          narration: entry.narration,
          currency: entry.currency || 'KWD',
          exchangeRate: entry.exchangeRate || 1,
          period,
          fiscalYear,
          createdBy: req.user?.userId,
          updatedBy: req.user?.userId
        });

        return await glEntry.save({ session });
      })
    );

    await session.commitTransaction();
    res.status(201).json({
      message: 'GL transaction created successfully',
      transactionId,
      entries: glEntries,
      validation: {
        totalDebits,
        totalCredits,
        balance: totalDebits - totalCredits
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Get GL entries with filters
export const getGLEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      accountCode,
      moduleSource,
      referenceType,
      period,
      fiscalYear,
      approvalStatus,
      page = 1,
      limit = 50,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};
    
    if (startDate && endDate) {
      query.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (accountCode) query.accountCode = accountCode;
    if (moduleSource) query.moduleSource = moduleSource;
    if (referenceType) query.referenceType = referenceType;
    if (period) query.period = period;
    if (fiscalYear) query.fiscalYear = Number(fiscalYear);
    if (approvalStatus) query.approvalStatus = approvalStatus;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [entries, total] = await Promise.all([
      GeneralLedgerEntry.find(query)
        .populate('account', 'accountCode accountName accountType')
        .populate('createdBy', 'email')
        .populate('approvedBy', 'email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      GeneralLedgerEntry.countDocuments(query)
    ]);

    res.json({
      entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get GL summary with running balances
export const getGLSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, accountCode, moduleSource } = req.query;

    const query: any = {};
    if (startDate && endDate) {
      query.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    if (accountCode) query.accountCode = accountCode;
    if (moduleSource) query.moduleSource = moduleSource;

    // Aggregate to get summary by account
    const summary = await GeneralLedgerEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$accountCode',
          accountId: { $first: '$account' },
          totalDebits: { $sum: '$debit' },
          totalCredits: { $sum: '$credit' },
          entryCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'chartofaccounts',
          localField: 'accountId',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      {
        $unwind: '$accountDetails'
      },
      {
        $project: {
          accountCode: '$accountDetails.accountCode',
          accountName: '$accountDetails.accountName',
          accountType: '$accountDetails.accountType',
          category: '$accountDetails.category',
          totalDebits: 1,
          totalCredits: 1,
          netAmount: { $subtract: ['$totalDebits', '$totalCredits'] },
          entryCount: 1
        }
      },
      { $sort: { accountCode: 1 } }
    ]);

    // Calculate totals
    const totals = summary.reduce((acc, account) => {
      acc.totalDebits += account.totalDebits;
      acc.totalCredits += account.totalCredits;
      acc.totalEntries += account.entryCount;
      return acc;
    }, { totalDebits: 0, totalCredits: 0, totalEntries: 0 });

    res.json({
      summary,
      totals,
      validation: {
        balance: totals.totalDebits - totals.totalCredits,
        isBalanced: Math.abs(totals.totalDebits - totals.totalCredits) < 0.01
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get trial balance
 */
export const getTrialBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period, fiscalYear } = req.query;
    
    const matchStage: any = {};
    if (period) matchStage.period = period;
    if (fiscalYear) matchStage.fiscalYear = Number(fiscalYear);

    const trialBalance = await GeneralLedgerEntry.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'chartofaccounts',
          localField: 'accountCode',
          foreignField: 'accountCode',
          as: 'account'
        }
      },
      { $unwind: '$account' },
      {
        $group: {
          _id: {
            accountCode: '$accountCode',
            accountName: '$account.accountName',
            accountType: '$account.accountType',
            category: '$account.category'
          },
          totalDebits: { $sum: '$debit' },
          totalCredits: { $sum: '$credit' },
          netAmount: { $sum: { $subtract: ['$debit', '$credit'] } }
        }
      },
      {
        $group: {
          _id: '$_id.accountType',
          accounts: {
            $push: {
              accountCode: '$_id.accountCode',
              accountName: '$_id.accountName',
              category: '$_id.category',
              totalDebits: '$totalDebits',
              totalCredits: '$totalCredits',
              netAmount: '$netAmount'
            }
          },
          totalDebits: { $sum: '$totalDebits' },
          totalCredits: { $sum: '$totalCredits' },
          netAmount: { $sum: '$netAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json(trialBalance);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get trial balance', error: error.message });
  }
};

// Reverse a GL transaction
export const reverseGLTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId, reason } = req.body;

    // Find original entries
    const originalEntries = await GeneralLedgerEntry.find({ transactionId });
    if (originalEntries.length === 0) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Create reversal entries
    const reversalEntries = await Promise.all(
      originalEntries.map(async (entry) => {
        const reversalEntry = new GeneralLedgerEntry({
          transactionId: generateTransactionId('general', 'reversal'),
          transactionDate: new Date(),
          moduleSource: 'general',
          referenceType: 'reversal',
          referenceId: entry._id,
          accountCode: entry.accountCode,
          account: entry.account,
          debit: entry.credit, // Reverse debit/credit
          credit: entry.debit,
          description: `Reversal: ${entry.description}`,
          narration: reason,
          currency: entry.currency,
          exchangeRate: entry.exchangeRate,
          period: getPeriodFromDate(new Date()),
          fiscalYear: new Date().getFullYear(),
          isReversed: false,
          reversedBy: entry._id,
          reversalDate: new Date(),
          createdBy: req.user?.userId,
          updatedBy: req.user?.userId
        });

        return await reversalEntry.save({ session });
      })
    );

    // Mark original entries as reversed
    await GeneralLedgerEntry.updateMany(
      { transactionId },
      { 
        isReversed: true,
        reversedBy: reversalEntries[0]._id,
        reversalDate: new Date(),
        updatedBy: req.user?.userId
      },
      { session }
    );

    await session.commitTransaction();
    res.json({
      message: 'Transaction reversed successfully',
      reversalTransactionId: reversalEntries[0].transactionId,
      reversedEntries: reversalEntries
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Approve GL entries
export const approveGLEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryIds, approvalStatus, comments } = req.body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      res.status(400).json({ message: 'Entry IDs required' });
      return;
    }

    const updateData: any = {
      approvalStatus,
      updatedBy: req.user?.userId
    };

    if (approvalStatus === 'approved') {
      updateData.approvedBy = req.user?.userId;
      updateData.approvedAt = new Date();
    }

    const result = await GeneralLedgerEntry.updateMany(
      { _id: { $in: entryIds } },
      updateData
    );

    res.json({
      message: `${result.modifiedCount} entries updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get GL entries by account
export const getGLEntriesByAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const query: any = { account: accountId };
    
    if (startDate && endDate) {
      query.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      GeneralLedgerEntry.find(query)
        .populate('account', 'accountCode accountName accountType')
        .populate('createdBy', 'email')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GeneralLedgerEntry.countDocuments(query)
    ]);

    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = entries.map((entry: any) => {
      const accountType = entry.account?.accountType || 'unknown';
      if (accountType === 'asset' || accountType === 'expense') {
        runningBalance += entry.debit - entry.credit;
      } else {
        runningBalance += entry.credit - entry.debit;
      }
      return {
        ...entry.toObject(),
        runningBalance
      };
    });

    res.json({
      entries: entriesWithBalance,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Export GL data
export const exportGLData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { format, startDate, endDate, accountCode, moduleSource } = req.query;

    const query: any = {};
    if (startDate && endDate) {
      query.transactionDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    if (accountCode) query.accountCode = accountCode;
    if (moduleSource) query.moduleSource = moduleSource;

    const entries = await GeneralLedgerEntry.find(query)
      .populate('account', 'accountCode accountName accountType category')
      .populate('createdBy', 'email')
      .sort({ transactionDate: 1, accountCode: 1 });

    if (format === 'excel') {
      // TODO: Implement Excel export
      res.status(501).json({ message: 'Excel export not yet implemented' });
    } else if (format === 'pdf') {
      // TODO: Implement PDF export
      res.status(501).json({ message: 'PDF export not yet implemented' });
    } else {
      res.json({
        message: 'Export data prepared',
        format: 'json',
        data: entries,
        filters: { startDate, endDate, accountCode, moduleSource }
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 