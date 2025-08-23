import { Request, Response } from 'express';
import ChartOfAccounts from '../models/ChartOfAccounts';

// Extend Request interface to include user property
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Create new account
export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accountData = {
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    };

    const account = new ChartOfAccounts(accountData);
    await account.save();

    const populatedAccount = await account.populate('parentAccount', 'accountCode accountName');
    
    res.status(201).json({
      message: 'Account created successfully',
      account: populatedAccount
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get all accounts with filters
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      accountType,
      category,
      ifrsCategory,
      isActive,
      parentAccount,
      level,
      page = 1,
      limit = 100,
      sortBy = 'accountCode',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query: any = {};
    
    if (accountType) query.accountType = accountType;
    if (category) query.category = category;
    if (ifrsCategory) query.ifrsCategory = ifrsCategory;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (parentAccount) query.parentAccount = parentAccount;
    if (level !== undefined) query.level = Number(level);

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [accounts, total] = await Promise.all([
      ChartOfAccounts.find(query)
        .populate('parentAccount', 'accountCode accountName')
        .populate('createdBy', 'email')
        .populate('updatedBy', 'email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      ChartOfAccounts.countDocuments(query)
    ]);

    res.json({
      accounts,
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

// Get account by ID
export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await ChartOfAccounts.findById(req.params.id)
      .populate('parentAccount', 'accountCode accountName')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    res.json(account);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update account
export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.userId,
      version: { $inc: 1 }
    };

    const account = await ChartOfAccounts.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentAccount', 'accountCode accountName')
     .populate('createdBy', 'email')
     .populate('updatedBy', 'email');

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete account
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const account = await ChartOfAccounts.findById(req.params.id);
    
    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    if (account.isSystem) {
      res.status(400).json({ message: 'System accounts cannot be deleted' });
      return;
    }

    // Check if account has child accounts
    const hasChildren = await ChartOfAccounts.exists({ parentAccount: req.params.id });
    if (hasChildren) {
      res.status(400).json({ message: 'Cannot delete account with child accounts' });
      return;
    }

    await ChartOfAccounts.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get hierarchical structure of accounts
 */
export const getAccountHierarchy = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await ChartOfAccounts.find({ isActive: true })
      .populate('parentAccount')
      .sort({ sortOrder: 1, accountCode: 1 });

    const buildHierarchy = (parentId: string | null = null): any[] => {
      return accounts
        .filter((account: any) => {
          if (parentId === null) {
            return !account.parentAccount;
          }
          return account.parentAccount && account.parentAccount._id.toString() === parentId;
        })
        .map((account: any) => ({
          ...account.toObject(),
          children: buildHierarchy(account._id.toString())
        }));
    };

    const hierarchy = buildHierarchy();
    res.json(hierarchy);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get account hierarchy', error: error.message });
  }
};

// Get accounts by IFRS category
export const getAccountsByIFRSCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ifrsCategory, ifrsSubcategory } = req.query;

    const query: any = { isActive: true };
    if (ifrsCategory) query.ifrsCategory = ifrsCategory;
    if (ifrsSubcategory) query.ifrsSubcategory = ifrsSubcategory;

    const accounts = await ChartOfAccounts.find(query)
      .populate('parentAccount', 'accountCode accountName')
      .sort({ accountCode: 1 });

    res.json({
      ifrsCategory: ifrsCategory || 'all',
      ifrsSubcategory: ifrsSubcategory || 'all',
      accounts,
      count: accounts.length
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Unknown error' });
  }
};

// Bulk create accounts (for system setup)
export const bulkCreateAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accounts } = req.body;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      res.status(400).json({ message: 'Accounts array is required' });
      return;
    }

    const accountData = accounts.map(account => ({
      ...account,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    }));

    const createdAccounts = await ChartOfAccounts.insertMany(accountData);
    
    res.status(201).json({
      message: `${createdAccounts.length} accounts created successfully`,
      accounts: createdAccounts
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get account statistics
export const getAccountStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalAccounts,
      activeAccounts,
      accountsByType,
      accountsByIFRSCategory,
      accountsByLevel
    ] = await Promise.all([
      ChartOfAccounts.countDocuments(),
      ChartOfAccounts.countDocuments({ isActive: true }),
      ChartOfAccounts.aggregate([
        { $group: { _id: '$accountType', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      ChartOfAccounts.aggregate([
        { $group: { _id: '$ifrsCategory', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      ChartOfAccounts.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      totalAccounts,
      activeAccounts,
      inactiveAccounts: totalAccounts - activeAccounts,
      accountsByType,
      accountsByIFRSCategory,
      accountsByLevel
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 