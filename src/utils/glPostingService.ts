import mongoose from 'mongoose';
import GeneralLedgerEntry from '../models/GeneralLedgerEntry';
import ChartOfAccounts from '../models/ChartOfAccounts';
import { IGeneralLedgerEntry } from '../models/GeneralLedgerEntry';

/**
 * GL Posting Service
 * 
 * This service automatically posts financial transactions from various modules
 * into the General Ledger, ensuring double-entry bookkeeping compliance.
 * 
 * Key Features:
 * - Automatic account mapping based on module and transaction type
 * - Double-entry validation (debits = credits)
 * - IFRS-compliant account categorization
 * - Transaction ID generation and period classification
 * - Audit trail with user tracking
 */

export class GLPostingService {
  
  /**
   * Default account mappings for common transactions
   * These can be overridden by custom mappings in the database
   */
  private static readonly DEFAULT_ACCOUNT_MAPPINGS = {
    // HR Module
    HR_PAYROLL: {
      debit: '8100', // Staff Costs - Salaries
      credit: '1100'  // Cash
    },
    HR_TRAINING: {
      debit: '8200', // Staff Costs - Training
      credit: '1100'  // Cash
    },
    HR_BENEFITS: {
      debit: '8300', // Staff Costs - Benefits
      credit: '1100'  // Cash
    },
    
    // Assets Module
    ASSET_PURCHASE: {
      debit: '2100', // Property, Plant & Equipment
      credit: '1100'  // Cash
    },
    ASSET_DEPRECIATION: {
      debit: '8500', // Depreciation Expense
      credit: '2200'  // Accumulated Depreciation
    },
    ASSET_DISPOSAL: {
      debit: '1100', // Cash
      credit: '2100'  // Property, Plant & Equipment
    },
    
    // Operations Module
    OPERATIONS_FUEL: {
      debit: '7100', // Direct Materials - Fuel
      credit: '1100'  // Cash
    },
    OPERATIONS_MAINTENANCE: {
      debit: '8400', // Operating Expenses - Maintenance
      credit: '1100'  // Cash
    },
    OPERATIONS_TOLLS: {
      debit: '7100', // Direct Materials - Tolls
      credit: '1100'  // Cash
    },
    
    // Procurement Module
    PROCUREMENT_MATERIALS: {
      debit: '7100', // Direct Materials
      credit: '3100'  // Accounts Payable
    },
    PROCUREMENT_SERVICES: {
      debit: '8400', // Operating Expenses - Services
      credit: '3100'  // Accounts Payable
    },
    
    // Sales Module
    SALES_REVENUE_CASH: {
      debit: '1100', // Cash
      credit: '6100'  // Sales Revenue
    },
    SALES_REVENUE_CREDIT: {
      debit: '1200', // Accounts Receivable
      credit: '6100'  // Sales Revenue
    },
    SALES_COST_OF_GOODS: {
      debit: '7200', // Cost of Goods Sold
      credit: '7100'  // Direct Materials
    },
    
    // Admin Module
    ADMIN_OFFICE_EXPENSES: {
      debit: '8600', // Operating Expenses - Office
      credit: '1100'  // Cash
    },
    ADMIN_LICENSES: {
      debit: '8700', // Operating Expenses - Licenses
      credit: '1100'  // Cash
    },
    
    // HSE Module
    HSE_SAFETY_EQUIPMENT: {
      debit: '8800', // Operating Expenses - HSE
      credit: '1100'  // Cash
    },
    HSE_TRAINING: {
      debit: '8200', // Staff Costs - Training
      credit: '1100'  // Cash
    }
  };

  /**
   * Post HR Payroll Transaction
   * Example: Employee salary payment
   */
  static async postPayrollTransaction(
    employeeId: string,
    salaryAmount: number,
    transactionDate: Date,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.HR_PAYROLL;
      
      const transaction = await this.createGLTransaction(
        'HR_PAYROLL',
        'Employee',
        employeeId,
        [
          {
            accountCode: mapping.debit,
            debit: salaryAmount,
            credit: 0,
            description: description || `Salary payment for employee ${employeeId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: salaryAmount,
            description: `Cash payment for salary`
          }
        ],
        transactionDate,
        userId,
        `HR Payroll - Employee ${employeeId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting HR payroll transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post Asset Depreciation Transaction
   * Example: Monthly depreciation of equipment
   */
  static async postDepreciationTransaction(
    assetId: string,
    depreciationAmount: number,
    transactionDate: Date,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.ASSET_DEPRECIATION;
      
      const transaction = await this.createGLTransaction(
        'ASSET_DEPRECIATION',
        'Asset',
        assetId,
        [
          {
            accountCode: mapping.debit,
            debit: depreciationAmount,
            credit: 0,
            description: description || `Depreciation for asset ${assetId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: depreciationAmount,
            description: `Accumulated depreciation for asset ${assetId}`
          }
        ],
        transactionDate,
        userId,
        `Asset Depreciation - Asset ${assetId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting asset depreciation transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post Procurement Purchase Transaction
   * Example: Purchase of raw materials
   */
  static async postProcurementTransaction(
    purchaseOrderId: string,
    amount: number,
    transactionDate: Date,
    userId: string,
    isCredit: boolean = true,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.PROCUREMENT_MATERIALS;
      
      const transaction = await this.createGLTransaction(
        'PROCUREMENT_PURCHASE',
        'PurchaseOrder',
        purchaseOrderId,
        [
          {
            accountCode: mapping.debit,
            debit: amount,
            credit: 0,
            description: description || `Materials purchase - PO ${purchaseOrderId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: amount,
            description: `Credit purchase - PO ${purchaseOrderId}`
          }
        ],
        transactionDate,
        userId,
        `Procurement Purchase - PO ${purchaseOrderId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting procurement transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post Sales Revenue Transaction
   * Example: Sale of goods or services
   */
  static async postSalesTransaction(
    invoiceId: string,
    amount: number,
    transactionDate: Date,
    isCredit: boolean,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = isCredit 
        ? this.DEFAULT_ACCOUNT_MAPPINGS.SALES_REVENUE_CREDIT
        : this.DEFAULT_ACCOUNT_MAPPINGS.SALES_REVENUE_CASH;
      
      const transaction = await this.createGLTransaction(
        'SALES_REVENUE',
        'Invoice',
        invoiceId,
        [
          {
            accountCode: mapping.debit,
            debit: amount,
            credit: 0,
            description: description || `Revenue from invoice ${invoiceId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: amount,
            description: `Sales revenue - Invoice ${invoiceId}`
          }
        ],
        transactionDate,
        userId,
        `Sales Revenue - Invoice ${invoiceId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting sales transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post Operations Fuel Transaction
   * Example: Fuel purchase for vehicles
   */
  static async postFuelTransaction(
    fuelLogId: string,
    amount: number,
    transactionDate: Date,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.OPERATIONS_FUEL;
      
      const transaction = await this.createGLTransaction(
        'OPERATIONS_FUEL',
        'FuelLog',
        fuelLogId,
        [
          {
            accountCode: mapping.debit,
            debit: amount,
            credit: 0,
            description: description || `Fuel purchase - Log ${fuelLogId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: amount,
            description: `Cash payment for fuel`
          }
        ],
        transactionDate,
        userId,
        `Operations Fuel - Log ${fuelLogId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting fuel transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post Maintenance Transaction
   * Example: Vehicle or equipment maintenance
   */
  static async postMaintenanceTransaction(
    maintenanceId: string,
    amount: number,
    transactionDate: Date,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.OPERATIONS_MAINTENANCE;
      
      const transaction = await this.createGLTransaction(
        'OPERATIONS_MAINTENANCE',
        'Maintenance',
        maintenanceId,
        [
          {
            accountCode: mapping.debit,
            debit: amount,
            credit: 0,
            description: description || `Maintenance expense - ${maintenanceId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: amount,
            description: `Cash payment for maintenance`
          }
        ],
        transactionDate,
        userId,
        `Operations Maintenance - ${maintenanceId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting maintenance transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post Admin Office Expenses Transaction
   * Example: Office supplies, utilities, etc.
   */
  static async postAdminExpenseTransaction(
    expenseId: string,
    amount: number,
    transactionDate: Date,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.ADMIN_OFFICE_EXPENSES;
      
      const transaction = await this.createGLTransaction(
        'ADMIN_OFFICE_EXPENSE',
        'Expense',
        expenseId,
        [
          {
            accountCode: mapping.debit,
            debit: amount,
            credit: 0,
            description: description || `Office expense - ${expenseId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: amount,
            description: `Cash payment for office expense`
          }
        ],
        transactionDate,
        userId,
        `Admin Office Expense - ${expenseId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting admin expense transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Post HSE Safety Equipment Transaction
   * Example: Safety equipment purchase
   */
  static async postHSETransaction(
    hseId: string,
    amount: number,
    transactionDate: Date,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const mapping = this.DEFAULT_ACCOUNT_MAPPINGS.HSE_SAFETY_EQUIPMENT;
      
      const transaction = await this.createGLTransaction(
        'HSE_SAFETY_EQUIPMENT',
        'HSE',
        hseId,
        [
          {
            accountCode: mapping.debit,
            debit: amount,
            credit: 0,
            description: description || `HSE safety equipment - ${hseId}`
          },
          {
            accountCode: mapping.credit,
            debit: 0,
            credit: amount,
            description: `Cash payment for HSE equipment`
          }
        ],
        transactionDate,
        userId,
        `HSE Safety Equipment - ${hseId}`
      );

      return { success: true, transactionId: transaction.transactionId };
    } catch (error: any) {
      console.error('Error posting HSE transaction:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Core method to create GL transactions
   * This handles the actual creation of double-entry transactions
   */
  private static async createGLTransaction(
    transactionType: string,
    referenceType: string,
    referenceId: string,
    entries: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      description: string;
    }>,
    transactionDate: Date,
    userId: string,
    narration: string
  ): Promise<{ transactionId: string }> {
    // Validate double-entry (debits must equal credits)
    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Double-entry validation failed: Debits (${totalDebits}) must equal Credits (${totalCredits})`);
    }

    // Generate unique transaction ID
    const transactionId = this.generateTransactionId(transactionType);
    
    // Determine period and fiscal year
    const period = this.determinePeriod(transactionDate);
    const fiscalYear = this.determineFiscalYear(transactionDate);

    // Create GL entries
    const glEntries: Partial<IGeneralLedgerEntry>[] = entries.map(entry => ({
      transactionId,
      transactionDate,
      moduleSource: this.getModuleFromTransactionType(transactionType),
      referenceType,
      referenceId: referenceId as any, // Type assertion for ObjectId compatibility
      accountCode: entry.accountCode,
      debit: entry.debit,
      credit: entry.credit,
      description: entry.description,
      narration,
      period,
      fiscalYear,
      approvalStatus: 'pending',
      createdBy: userId as any, // Type assertion for ObjectId compatibility
      updatedBy: userId as any // Type assertion for ObjectId compatibility
    }));

    // Save all entries in a transaction
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const entry of glEntries) {
          const glEntry = new GeneralLedgerEntry(entry);
          await glEntry.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }

    return { transactionId };
  }

  /**
   * Generate unique transaction ID
   * Format: GL-YYYYMMDD-XXXX (e.g., GL-20241201-0001)
   */
  private static generateTransactionId(transactionType: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GL-${dateStr}-${random}`;
  }

  /**
   * Determine period based on transaction date
   */
  private static determinePeriod(date: Date): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  }

  /**
   * Determine fiscal year based on transaction date
   * Assumes fiscal year starts in January
   */
  private static determineFiscalYear(date: Date): number {
    return date.getFullYear();
  }

  /**
   * Get module source from transaction type
   */
  private static getModuleFromTransactionType(transactionType: string): string {
    if (transactionType.startsWith('HR_')) return 'HR';
    if (transactionType.startsWith('ASSET_')) return 'Assets';
    if (transactionType.startsWith('OPERATIONS_')) return 'Operations';
    if (transactionType.startsWith('PROCUREMENT_')) return 'Procurement';
    if (transactionType.startsWith('SALES_')) return 'Sales';
    if (transactionType.startsWith('ADMIN_')) return 'Admin';
    if (transactionType.startsWith('HSE_')) return 'HSE';
    return 'Other';
  }

  /**
   * Get custom account mapping from database
   * This allows users to override default mappings
   */
  static async getCustomAccountMapping(
    module: string,
    transactionType: string
  ): Promise<any> {
    // TODO: Implement custom mapping lookup from database
    // This would check the AccountMapping collection for custom rules
    return null;
  }

  /**
   * Validate account codes exist and are active
   */
  static async validateAccountCodes(accountCodes: string[]): Promise<boolean> {
    try {
      const accounts = await ChartOfAccounts.find({
        accountCode: { $in: accountCodes },
        isActive: true
      });
      
      return accounts.length === accountCodes.length;
    } catch (error) {
      console.error('Error validating account codes:', error);
      return false;
    }
  }
}

export default GLPostingService; 