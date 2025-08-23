import mongoose from 'mongoose';
import GeneralLedgerEntry from '../models/GeneralLedgerEntry';
import ChartOfAccounts from '../models/ChartOfAccounts';

// Interface for GL posting data
interface GLPostingData {
  moduleSource: string;
  referenceType: string;
  referenceId: mongoose.Types.ObjectId;
  transactionDate: Date;
  description: string;
  entries: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    description?: string;
    narration?: string;
  }>;
  currency?: string;
  exchangeRate?: number;
}

// Interface for account mapping
interface AccountMapping {
  moduleSource: string;
  transactionType: string;
  debitAccount: string;
  creditAccount: string;
  description: string;
}

// Default account mappings for common transactions
const DEFAULT_ACCOUNT_MAPPINGS: AccountMapping[] = [
  // HR Module
  {
    moduleSource: 'hr',
    transactionType: 'payroll',
    debitAccount: '8100', // Staff Costs
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Payroll expense'
  },
  {
    moduleSource: 'hr',
    transactionType: 'training',
    debitAccount: '8100', // Staff Costs
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Training expense'
  },

  // Assets Module
  {
    moduleSource: 'assets',
    transactionType: 'depreciation',
    debitAccount: '8500', // Depreciation - Admin
    creditAccount: '2200', // Accumulated Depreciation
    description: 'Asset depreciation'
  },
  {
    moduleSource: 'assets',
    transactionType: 'purchase',
    debitAccount: '2100', // Property, Plant and Equipment
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Asset purchase'
  },

  // Operations Module
  {
    moduleSource: 'operations',
    transactionType: 'fuel',
    debitAccount: '7300', // Depreciation - Operations
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Fuel expense'
  },
  {
    moduleSource: 'operations',
    transactionType: 'maintenance',
    debitAccount: '8300', // Maintenance Expenses
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Maintenance expense'
  },

  // Procurement Module
  {
    moduleSource: 'procurement',
    transactionType: 'purchase',
    debitAccount: '7100', // Direct Materials
    creditAccount: '3100', // Accounts Payable
    description: 'Material purchase'
  },
  {
    moduleSource: 'procurement',
    transactionType: 'invoice',
    debitAccount: '7100', // Direct Materials
    creditAccount: '3100', // Accounts Payable
    description: 'Procurement invoice'
  },

  // Sales Module
  {
    moduleSource: 'sales',
    transactionType: 'revenue',
    debitAccount: '1100', // Cash and Cash Equivalents
    creditAccount: '6100', // Sales Revenue
    description: 'Sales revenue'
  },
  {
    moduleSource: 'sales',
    transactionType: 'credit_sale',
    debitAccount: '1200', // Accounts Receivable
    creditAccount: '6100', // Sales Revenue
    description: 'Credit sale'
  },

  // Admin Module
  {
    moduleSource: 'admin',
    transactionType: 'office_expense',
    debitAccount: '8200', // Administrative Expenses
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Office expense'
  },
  {
    moduleSource: 'admin',
    transactionType: 'license',
    debitAccount: '8200', // Administrative Expenses
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'License expense'
  },

  // HSE Module
  {
    moduleSource: 'hse',
    transactionType: 'safety_equipment',
    debitAccount: '8400', // HSE Expenses
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'Safety equipment expense'
  },
  {
    moduleSource: 'hse',
    transactionType: 'training',
    debitAccount: '8400', // HSE Expenses
    creditAccount: '1100', // Cash and Cash Equivalents
    description: 'HSE training expense'
  }
];

// Generate transaction ID
function generateTransactionId(moduleSource: string, referenceType: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${moduleSource.toUpperCase()}-${referenceType.toUpperCase()}-${timestamp}-${random}`.toUpperCase();
}

// Determine period based on date
function getPeriodFromDate(date: Date): string {
  const month = date.getMonth() + 1;
  if (month <= 3) return 'quarterly';
  if (month <= 6) return 'half_yearly';
  if (month <= 12) return 'yearly';
  return 'monthly';
}

// Main GL posting service
export class GLPostingService {
  /**
   * Automatically post a transaction to the General Ledger
   */
  static async postTransaction(postingData: GLPostingData, userId: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate double-entry balance
      const totalDebits = postingData.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredits = postingData.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Double-entry validation failed: Debits (${totalDebits}) must equal Credits (${totalCredits})`);
      }

      const transactionId = generateTransactionId(postingData.moduleSource, postingData.referenceType);
      const period = getPeriodFromDate(postingData.transactionDate);
      const fiscalYear = postingData.transactionDate.getFullYear();

      // Create GL entries
      const glEntries = await Promise.all(
        postingData.entries.map(async (entry) => {
          // Find account by account code
          const account = await ChartOfAccounts.findOne({ accountCode: entry.accountCode });
          if (!account) {
            throw new Error(`Account with code ${entry.accountCode} not found`);
          }

          const glEntry = new GeneralLedgerEntry({
            transactionId,
            transactionDate: postingData.transactionDate,
            moduleSource: postingData.moduleSource,
            referenceType: postingData.referenceType,
            referenceId: postingData.referenceId,
            accountCode: account.accountCode,
            account: account._id,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            description: entry.description || postingData.description,
            narration: entry.narration,
            currency: postingData.currency || 'KWD',
            exchangeRate: postingData.exchangeRate || 1,
            period,
            fiscalYear,
            createdBy: userId,
            updatedBy: userId
          });

          return await glEntry.save({ session });
        })
      );

      await session.commitTransaction();

      return {
        success: true,
        transactionId,
        entries: glEntries,
        validation: {
          totalDebits,
          totalCredits,
          balance: totalDebits - totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Post a simple two-entry transaction using default account mappings
   */
  static async postSimpleTransaction(
    moduleSource: string,
    transactionType: string,
    referenceId: mongoose.Types.ObjectId,
    amount: number,
    transactionDate: Date,
    description: string,
    userId: string,
    customMapping?: { debitAccount: string; creditAccount: string }
  ): Promise<any> {
    // Find default account mapping
    let mapping = DEFAULT_ACCOUNT_MAPPINGS.find(m => 
      m.moduleSource === moduleSource && m.transactionType === transactionType
    );

    if (!mapping && customMapping) {
      mapping = {
        moduleSource,
        transactionType,
        debitAccount: customMapping.debitAccount,
        creditAccount: customMapping.creditAccount,
        description
      };
    }

    if (!mapping) {
      throw new Error(`No account mapping found for ${moduleSource} - ${transactionType}`);
    }

    const postingData: GLPostingData = {
      moduleSource,
      referenceType: transactionType,
      referenceId,
      transactionDate,
      description: mapping.description,
      entries: [
        {
          accountCode: mapping.debitAccount,
          debit: amount,
          credit: 0,
          description: `${mapping.description} - Debit`
        },
        {
          accountCode: mapping.creditAccount,
          debit: 0,
          credit: amount,
          description: `${mapping.description} - Credit`
        }
      ]
    };

    return await this.postTransaction(postingData, userId);
  }

  /**
   * Post HR payroll transaction
   */
  static async postPayrollTransaction(
    employeeId: mongoose.Types.ObjectId,
    amount: number,
    transactionDate: Date,
    userId: string
  ): Promise<any> {
    return await this.postSimpleTransaction(
      'hr',
      'payroll',
      employeeId,
      amount,
      transactionDate,
      `Payroll for employee ${employeeId}`,
      userId
    );
  }

  /**
   * Post asset depreciation transaction
   */
  static async postDepreciationTransaction(
    assetId: mongoose.Types.ObjectId,
    amount: number,
    transactionDate: Date,
    userId: string
  ): Promise<any> {
    return await this.postSimpleTransaction(
      'assets',
      'depreciation',
      assetId,
      amount,
      transactionDate,
      `Depreciation for asset ${assetId}`,
      userId
    );
  }

  /**
   * Post procurement purchase transaction
   */
  static async postProcurementTransaction(
    purchaseOrderId: mongoose.Types.ObjectId,
    amount: number,
    transactionDate: Date,
    userId: string
  ): Promise<any> {
    return await this.postSimpleTransaction(
      'procurement',
      'purchase',
      purchaseOrderId,
      amount,
      transactionDate,
      `Procurement purchase ${purchaseOrderId}`,
      userId
    );
  }

  /**
   * Post sales revenue transaction
   */
  static async postSalesTransaction(
    invoiceId: mongoose.Types.ObjectId,
    amount: number,
    transactionDate: Date,
    isCredit: boolean,
    userId: string
  ): Promise<any> {
    const transactionType = isCredit ? 'credit_sale' : 'revenue';
    return await this.postSimpleTransaction(
      'sales',
      transactionType,
      invoiceId,
      amount,
      transactionDate,
      `Sales ${isCredit ? 'credit' : 'cash'} ${invoiceId}`,
      userId
    );
  }

  /**
   * Post expense transaction
   */
  static async postExpenseTransaction(
    expenseId: mongoose.Types.ObjectId,
    amount: number,
    transactionDate: Date,
    moduleSource: string,
    expenseType: string,
    userId: string
  ): Promise<any> {
    return await this.postSimpleTransaction(
      moduleSource,
      expenseType,
      expenseId,
      amount,
      transactionDate,
      `${expenseType} expense ${expenseId}`,
      userId
    );
  }

  /**
   * Get account mappings for a specific module and transaction type
   */
  static getAccountMappings(moduleSource?: string, transactionType?: string): AccountMapping[] {
    let mappings = DEFAULT_ACCOUNT_MAPPINGS;
    
    if (moduleSource) {
      mappings = mappings.filter(m => m.moduleSource === moduleSource);
    }
    
    if (transactionType) {
      mappings = mappings.filter(m => m.transactionType === transactionType);
    }
    
    return mappings;
  }

  /**
   * Add custom account mapping
   */
  static addCustomMapping(mapping: AccountMapping): void {
    DEFAULT_ACCOUNT_MAPPINGS.push(mapping);
  }
}

export default GLPostingService; 