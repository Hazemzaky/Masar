/**
 * General Ledger Integration Examples
 * 
 * This file demonstrates how different modules automatically post transactions
 * to the General Ledger, ensuring proper double-entry bookkeeping and IFRS compliance.
 */

import { GLPostingService } from '../services/glPostingService';
import mongoose from 'mongoose';
import { Request, Response } from 'express'; // Added for batch processing example

// Example 1: HR Payroll Transaction
export const exampleHRPayrollIntegration = async (userId: string) => {
  console.log('=== HR Payroll Integration Example ===');
  
  try {
    // When HR processes payroll, it automatically creates GL entries
    const payrollResult = await GLPostingService.postPayrollTransaction(
      new mongoose.Types.ObjectId(), // employeeId
      2500.00, // salary amount
      new Date(), // transaction date
      userId
    );
    
    console.log('✅ Payroll posted to GL:', payrollResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Staff Costs (8100) - ${payrollResult.entries[0].debit}`);
    console.log(`   Credit: Cash (1100) - ${payrollResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${payrollResult.transactionId}`);
    
    return payrollResult;
  } catch (error) {
    console.error('❌ Payroll GL posting failed:', error);
    throw error;
  }
};

// Example 2: Asset Depreciation Transaction
export const exampleAssetDepreciationIntegration = async (userId: string) => {
  console.log('=== Asset Depreciation Integration Example ===');
  
  try {
    // When assets are depreciated, it automatically creates GL entries
    const depreciationResult = await GLPostingService.postDepreciationTransaction(
      new mongoose.Types.ObjectId(), // assetId
      500.00, // depreciation amount
      new Date(), // transaction date
      userId
    );
    
    console.log('✅ Depreciation posted to GL:', depreciationResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Depreciation Expense (8500) - ${depreciationResult.entries[0].debit}`);
    console.log(`   Credit: Accumulated Depreciation (2200) - ${depreciationResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${depreciationResult.transactionId}`);
    
    return depreciationResult;
  } catch (error) {
    console.error('❌ Depreciation GL posting failed:', error);
    throw error;
  }
};

// Example 3: Procurement Purchase Transaction
export const exampleProcurementIntegration = async (userId: string) => {
  console.log('=== Procurement Integration Example ===');
  
  try {
    // When procurement creates a purchase order, it automatically creates GL entries
    const procurementResult = await GLPostingService.postProcurementTransaction(
      new mongoose.Types.ObjectId(), // purchaseOrderId
      1500.00, // purchase amount
      new Date(), // transaction date
      userId
    );
    
    console.log('✅ Procurement posted to GL:', procurementResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Direct Materials (7100) - ${procurementResult.entries[0].debit}`);
    console.log(`   Credit: Accounts Payable (3100) - ${procurementResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${procurementResult.transactionId}`);
    
    return procurementResult;
  } catch (error) {
    console.error('❌ Procurement GL posting failed:', error);
    throw error;
  }
};

// Example 4: Sales Revenue Transaction
export const exampleSalesIntegration = async (userId: string) => {
  console.log('=== Sales Integration Example ===');
  
  try {
    // When sales creates an invoice, it automatically creates GL entries
    const salesResult = await GLPostingService.postSalesTransaction(
      new mongoose.Types.ObjectId(), // invoiceId
      3000.00, // revenue amount
      new Date(), // transaction date
      false, // isCredit = false (cash sale)
      userId
    );
    
    console.log('✅ Sales posted to GL:', salesResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Cash (1100) - ${salesResult.entries[0].debit}`);
    console.log(`   Credit: Sales Revenue (6100) - ${salesResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${salesResult.transactionId}`);
    
    return salesResult;
  } catch (error) {
    console.error('❌ Sales GL posting failed:', error);
    throw error;
  }
};

// Example 5: Complex Multi-Entry Transaction
export const exampleComplexTransaction = async (userId: string) => {
  console.log('=== Complex Multi-Entry Transaction Example ===');
  
  try {
    // Example: Equipment purchase with installation costs
    const complexTransaction = await GLPostingService.postTransaction({
      moduleSource: 'assets',
      referenceType: 'purchase',
      referenceId: new mongoose.Types.ObjectId(),
      transactionDate: new Date(),
      description: 'Equipment purchase with installation',
      entries: [
        {
          accountCode: '2100', // Property, Plant and Equipment
          debit: 10000.00,
          credit: 0,
          description: 'Equipment cost'
        },
        {
          accountCode: '2100', // Property, Plant and Equipment
          debit: 500.00,
          credit: 0,
          description: 'Installation cost'
        },
        {
          accountCode: '1100', // Cash
          debit: 0,
          credit: 10500.00,
          description: 'Payment for equipment and installation'
        }
      ]
    }, userId);
    
    console.log('✅ Complex transaction posted to GL:', complexTransaction);
    console.log('📊 GL Entry Details:');
    complexTransaction.entries.forEach((entry: any, index: number) => {
      console.log(`   Entry ${index + 1}: ${entry.accountCode} - ${entry.description}`);
      if (entry.debit > 0) {
        console.log(`     Debit: ${entry.debit}`);
      } else {
        console.log(`     Credit: ${entry.credit}`);
      }
    });
    console.log(`   Transaction ID: ${complexTransaction.transactionId}`);
    console.log(`   Validation: ${complexTransaction.validation.isBalanced ? 'Balanced ✓' : 'Not Balanced ✗'}`);
    
    return complexTransaction;
  } catch (error) {
    console.error('❌ Complex transaction GL posting failed:', error);
    throw error;
  }
};

// Example 6: Expense Transaction with Custom Mapping
export const exampleCustomExpenseIntegration = async (userId: string) => {
  console.log('=== Custom Expense Integration Example ===');
  
  try {
    // Example: HSE safety equipment expense
    const expenseResult = await GLPostingService.postExpenseTransaction(
      new mongoose.Types.ObjectId(), // expenseId
      750.00, // expense amount
      new Date(), // transaction date
      'hse', // moduleSource
      'safety_equipment', // expenseType
      userId
    );
    
    console.log('✅ HSE expense posted to GL:', expenseResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: HSE Expenses (8400) - ${expenseResult.entries[0].debit}`);
    console.log(`   Credit: Cash (1100) - ${expenseResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${expenseResult.transactionId}`);
    
    return expenseResult;
  } catch (error) {
    console.error('❌ Expense GL posting failed:', error);
    throw error;
  }
};

// Example 7: Revenue Recognition (IFRS 15)
export const exampleRevenueRecognitionIntegration = async (userId: string) => {
  console.log('=== Revenue Recognition Integration Example ===');
  
  try {
    // Example: Service contract revenue recognition over time
    const revenueResult = await GLPostingService.postTransaction({
      moduleSource: 'sales',
      referenceType: 'revenue',
      referenceId: new mongoose.Types.ObjectId(),
      transactionDate: new Date(),
      description: 'Monthly service revenue recognition',
      entries: [
        {
          accountCode: '1200', // Accounts Receivable
          debit: 2500.00,
          credit: 0,
          description: 'Service revenue recognized'
        },
        {
          accountCode: '6200', // Service Revenue
          debit: 0,
          credit: 2500.00,
          description: 'Service revenue earned'
        }
      ]
    }, userId);
    
    console.log('✅ Revenue recognition posted to GL:', revenueResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Accounts Receivable (1200) - ${revenueResult.entries[0].debit}`);
    console.log(`   Credit: Service Revenue (6200) - ${revenueResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${revenueResult.transactionId}`);
    
    return revenueResult;
  } catch (error) {
    console.error('❌ Revenue recognition GL posting failed:', error);
    throw error;
  }
};

// Example 8: Lease Accounting (IFRS 16)
export const exampleLeaseAccountingIntegration = async (userId: string) => {
  console.log('=== Lease Accounting Integration Example ===');
  
  try {
    // Example: Right-of-use asset and lease liability recognition
    const leaseResult = await GLPostingService.postTransaction({
      moduleSource: 'assets',
      referenceType: 'lease',
      referenceId: new mongoose.Types.ObjectId(),
      transactionDate: new Date(),
      description: 'Lease asset and liability recognition',
      entries: [
        {
          accountCode: '2100', // Property, Plant and Equipment
          debit: 50000.00,
          credit: 0,
          description: 'Right-of-use asset'
        },
        {
          accountCode: '4100', // Long-term Loans
          debit: 0,
          credit: 50000.00,
          description: 'Lease liability'
        }
      ]
    }, userId);
    
    console.log('✅ Lease accounting posted to GL:', leaseResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Right-of-use Asset (2100) - ${leaseResult.entries[0].debit}`);
    console.log(`   Credit: Lease Liability (4100) - ${leaseResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${leaseResult.transactionId}`);
    
    return leaseResult;
  } catch (error) {
    console.error('❌ Lease accounting GL posting failed:', error);
    throw error;
  }
};

// Example 9: Amortization of Intangible Assets
export const exampleAmortizationIntegration = async (userId: string) => {
  console.log('=== Amortization Integration Example ===');
  
  try {
    // Example: Software license amortization
    const amortizationResult = await GLPostingService.postTransaction({
      moduleSource: 'assets',
      referenceType: 'amortization',
      referenceId: new mongoose.Types.ObjectId(),
      transactionDate: new Date(),
      description: 'Monthly software license amortization',
      entries: [
        {
          accountCode: '8200', // Administrative Expenses
          debit: 200.00,
          credit: 0,
          description: 'Software amortization expense'
        },
        {
          accountCode: '2300', // Intangible Assets
          debit: 0,
          credit: 200.00,
          description: 'Accumulated amortization'
        }
      ]
    }, userId);
    
    console.log('✅ Amortization posted to GL:', amortizationResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Administrative Expenses (8200) - ${amortizationResult.entries[0].debit}`);
    console.log(`   Credit: Intangible Assets (2300) - ${amortizationResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${amortizationResult.transactionId}`);
    
    return amortizationResult;
  } catch (error) {
    console.error('❌ Amortization GL posting failed:', error);
    throw error;
  }
};

// Example 10: Intercompany Transactions
export const exampleIntercompanyIntegration = async (userId: string) => {
  console.log('=== Intercompany Transaction Integration Example ===');
  
  try {
    // Example: Intercompany loan
    const intercompanyResult = await GLPostingService.postTransaction({
      moduleSource: 'finance',
      referenceType: 'intercompany',
      referenceId: new mongoose.Types.ObjectId(),
      transactionDate: new Date(),
      description: 'Intercompany loan to subsidiary',
      entries: [
        {
          accountCode: '1200', // Accounts Receivable
          debit: 100000.00,
          credit: 0,
          description: 'Intercompany receivable'
        },
        {
          accountCode: '1100', // Cash
          debit: 0,
          credit: 100000.00,
          description: 'Cash transferred to subsidiary'
        }
      ]
    }, userId);
    
    console.log('✅ Intercompany transaction posted to GL:', intercompanyResult);
    console.log('📊 GL Entry Details:');
    console.log(`   Debit: Intercompany Receivable (1200) - ${intercompanyResult.entries[0].debit}`);
    console.log(`   Credit: Cash (1100) - ${intercompanyResult.entries[1].credit}`);
    console.log(`   Transaction ID: ${intercompanyResult.transactionId}`);
    
    return intercompanyResult;
  } catch (error) {
    console.error('❌ Intercompany transaction GL posting failed:', error);
    throw error;
  }
};

// Example: Batch Processing
export const processBatchPayroll = async (req: Request, res: Response) => {
  try {
    const { payrollEntries } = req.body;
    const userId = (req as any).user?.id; // Type assertion for user property
    const results = [];

    for (const entry of payrollEntries) {
      const glResult = await GLPostingService.postPayrollTransaction(
        entry.employeeId,
        entry.salaryAmount,
        new Date(entry.transactionDate),
        userId
      );

      results.push({
        employeeId: entry.employeeId,
        success: glResult.success,
        transactionId: glResult.transactionId,
        error: glResult.error
      });
    }

    res.status(200).json({
      success: true,
      results
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
};

// Main function to run all examples
export const runAllGLExamples = async (userId: string) => {
  console.log('🚀 Starting General Ledger Integration Examples...\n');
  
  try {
    await exampleHRPayrollIntegration(userId);
    console.log('');
    
    await exampleAssetDepreciationIntegration(userId);
    console.log('');
    
    await exampleProcurementIntegration(userId);
    console.log('');
    
    await exampleSalesIntegration(userId);
    console.log('');
    
    await exampleComplexTransaction(userId);
    console.log('');
    
    await exampleCustomExpenseIntegration(userId);
    console.log('');
    
    await exampleRevenueRecognitionIntegration(userId);
    console.log('');
    
    await exampleLeaseAccountingIntegration(userId);
    console.log('');
    
    await exampleAmortizationIntegration(userId);
    console.log('');
    
    await exampleIntercompanyIntegration(userId);
    console.log('');
    
    console.log('🎉 All GL integration examples completed successfully!');
    console.log('📋 Summary:');
    console.log('   • HR Payroll → Staff Costs (DR) / Cash (CR)');
    console.log('   • Asset Depreciation → Depreciation Expense (DR) / Accumulated Depreciation (CR)');
    console.log('   • Procurement → Direct Materials (DR) / Accounts Payable (CR)');
    console.log('   • Sales → Cash/Receivables (DR) / Revenue (CR)');
    console.log('   • Complex transactions with multiple entries');
    console.log('   • IFRS 15 revenue recognition');
    console.log('   • IFRS 16 lease accounting');
    console.log('   • Intangible asset amortization');
    console.log('   • Intercompany transactions');
    
  } catch (error: any) {
    console.error('💥 Some examples failed:', error);
  }
};

export default {
  exampleHRPayrollIntegration,
  exampleAssetDepreciationIntegration,
  exampleProcurementIntegration,
  exampleSalesIntegration,
  exampleComplexTransaction,
  exampleCustomExpenseIntegration,
  exampleRevenueRecognitionIntegration,
  exampleLeaseAccountingIntegration,
  exampleAmortizationIntegration,
  exampleIntercompanyIntegration,
  runAllGLExamples
}; 