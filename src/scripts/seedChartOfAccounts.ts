import mongoose from 'mongoose';
import ChartOfAccounts from '../models/ChartOfAccounts';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

// Default Chart of Accounts structure following IFRS standards
const DEFAULT_ACCOUNTS = [
  // Assets
  {
    accountCode: '1000',
    accountName: 'Current Assets',
    accountType: 'asset',
    category: 'Assets',
    ifrsCategory: 'current_assets',
    level: 0,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '1100',
    accountName: 'Cash and Cash Equivalents',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Current Assets',
    ifrsCategory: 'current_assets',
    ifrsSubcategory: 'cash_equivalents',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '1200',
    accountName: 'Accounts Receivable',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Current Assets',
    ifrsCategory: 'current_assets',
    ifrsSubcategory: 'trade_receivables',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '1300',
    accountName: 'Inventory',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Current Assets',
    ifrsCategory: 'current_assets',
    ifrsSubcategory: 'inventory',
    level: 1,
    sortOrder: 3,
    isSystem: true
  },
  {
    accountCode: '1400',
    accountName: 'Prepaid Expenses',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Current Assets',
    ifrsCategory: 'current_assets',
    ifrsSubcategory: 'prepayments',
    level: 1,
    sortOrder: 4,
    isSystem: true
  },
  {
    accountCode: '2000',
    accountName: 'Non-Current Assets',
    accountType: 'asset',
    category: 'Assets',
    ifrsCategory: 'non_current_assets',
    level: 0,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '2100',
    accountName: 'Property, Plant and Equipment',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Non-Current Assets',
    ifrsCategory: 'property_plant_equipment',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '2200',
    accountName: 'Accumulated Depreciation',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Non-Current Assets',
    ifrsCategory: 'property_plant_equipment',
    ifrsSubcategory: 'accumulated_depreciation',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '2300',
    accountName: 'Intangible Assets',
    accountType: 'asset',
    category: 'Assets',
    subcategory: 'Non-Current Assets',
    ifrsCategory: 'intangible_assets',
    level: 1,
    sortOrder: 3,
    isSystem: true
  },

  // Liabilities
  {
    accountCode: '3000',
    accountName: 'Current Liabilities',
    accountType: 'liability',
    category: 'Liabilities',
    ifrsCategory: 'current_liabilities',
    level: 0,
    sortOrder: 3,
    isSystem: true
  },
  {
    accountCode: '3100',
    accountName: 'Accounts Payable',
    accountType: 'liability',
    category: 'Liabilities',
    subcategory: 'Current Liabilities',
    ifrsCategory: 'current_liabilities',
    ifrsSubcategory: 'trade_payables',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '3200',
    accountName: 'Accrued Expenses',
    accountType: 'liability',
    category: 'Liabilities',
    subcategory: 'Current Liabilities',
    ifrsCategory: 'current_liabilities',
    ifrsSubcategory: 'accruals',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '3300',
    accountName: 'Short-term Loans',
    accountType: 'liability',
    category: 'Liabilities',
    subcategory: 'Current Liabilities',
    ifrsCategory: 'current_liabilities',
    ifrsSubcategory: 'borrowings',
    level: 1,
    sortOrder: 3,
    isSystem: true
  },
  {
    accountCode: '4000',
    accountName: 'Non-Current Liabilities',
    accountType: 'liability',
    category: 'Liabilities',
    ifrsCategory: 'non_current_liabilities',
    level: 0,
    sortOrder: 4,
    isSystem: true
  },
  {
    accountCode: '4100',
    accountName: 'Long-term Loans',
    accountType: 'liability',
    category: 'Liabilities',
    subcategory: 'Non-Current Liabilities',
    ifrsCategory: 'non_current_liabilities',
    ifrsSubcategory: 'borrowings',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },

  // Equity
  {
    accountCode: '5000',
    accountName: 'Equity',
    accountType: 'equity',
    category: 'Equity',
    ifrsCategory: 'share_capital',
    level: 0,
    sortOrder: 5,
    isSystem: true
  },
  {
    accountCode: '5100',
    accountName: 'Share Capital',
    accountType: 'equity',
    category: 'Equity',
    subcategory: 'Share Capital',
    ifrsCategory: 'share_capital',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '5200',
    accountName: 'Retained Earnings',
    accountType: 'equity',
    category: 'Equity',
    subcategory: 'Retained Earnings',
    ifrsCategory: 'retained_earnings',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },

  // Revenue
  {
    accountCode: '6000',
    accountName: 'Revenue',
    accountType: 'revenue',
    category: 'Revenue',
    ifrsCategory: 'revenue',
    level: 0,
    sortOrder: 6,
    isSystem: true
  },
  {
    accountCode: '6100',
    accountName: 'Sales Revenue',
    accountType: 'revenue',
    category: 'Revenue',
    subcategory: 'Sales',
    ifrsCategory: 'revenue',
    ifrsSubcategory: 'sales',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '6200',
    accountName: 'Service Revenue',
    accountType: 'revenue',
    category: 'Revenue',
    subcategory: 'Services',
    ifrsCategory: 'revenue',
    ifrsSubcategory: 'services',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '6300',
    accountName: 'Other Income',
    accountType: 'revenue',
    category: 'Revenue',
    subcategory: 'Other',
    ifrsCategory: 'other_income',
    level: 1,
    sortOrder: 3,
    isSystem: true
  },

  // Expenses
  {
    accountCode: '7000',
    accountName: 'Cost of Sales',
    accountType: 'expense',
    category: 'Expenses',
    ifrsCategory: 'cost_of_sales',
    level: 0,
    sortOrder: 7,
    isSystem: true
  },
  {
    accountCode: '7100',
    accountName: 'Direct Materials',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Cost of Sales',
    ifrsCategory: 'cost_of_sales',
    ifrsSubcategory: 'materials',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '7200',
    accountName: 'Direct Labor',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Cost of Sales',
    ifrsCategory: 'cost_of_sales',
    ifrsSubcategory: 'labor',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '7300',
    accountName: 'Depreciation - Operations',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Cost of Sales',
    ifrsCategory: 'cost_of_sales',
    ifrsSubcategory: 'depreciation',
    level: 1,
    sortOrder: 3,
    isSystem: true
  },
  {
    accountCode: '8000',
    accountName: 'Operating Expenses',
    accountType: 'expense',
    category: 'Expenses',
    ifrsCategory: 'operating_expenses',
    level: 0,
    sortOrder: 8,
    isSystem: true
  },
  {
    accountCode: '8100',
    accountName: 'Staff Costs',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Operating Expenses',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'staff_costs',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '8200',
    accountName: 'Administrative Expenses',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Operating Expenses',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'administrative',
    level: 1,
    sortOrder: 2,
    isSystem: true
  },
  {
    accountCode: '8300',
    accountName: 'Maintenance Expenses',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Operating Expenses',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'maintenance',
    level: 1,
    sortOrder: 3,
    isSystem: true
  },
  {
    accountCode: '8400',
    accountName: 'HSE Expenses',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Operating Expenses',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'hse',
    level: 1,
    sortOrder: 4,
    isSystem: true
  },
  {
    accountCode: '8500',
    accountName: 'Depreciation - Admin',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Operating Expenses',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'depreciation',
    level: 1,
    sortOrder: 5,
    isSystem: true
  },
  {
    accountCode: '9000',
    accountName: 'Finance Costs',
    accountType: 'expense',
    category: 'Expenses',
    ifrsCategory: 'finance_costs',
    level: 0,
    sortOrder: 9,
    isSystem: true
  },
  {
    accountCode: '9100',
    accountName: 'Interest Expense',
    accountType: 'expense',
    category: 'Expenses',
    subcategory: 'Finance Costs',
    ifrsCategory: 'finance_costs',
    ifrsSubcategory: 'interest',
    level: 1,
    sortOrder: 1,
    isSystem: true
  },
  {
    accountCode: '10000',
    accountName: 'Income Tax Expense',
    accountType: 'expense',
    category: 'Expenses',
    ifrsCategory: 'income_tax_expense',
    level: 0,
    sortOrder: 10,
    isSystem: true
  }
];

async function seedChartOfAccounts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/masar';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get a default user for createdBy/updatedBy fields
    const defaultUser = await User.findOne();
    if (!defaultUser) {
      console.error('No users found in database. Please create a user first.');
      process.exit(1);
    }

    // Clear existing accounts (except system accounts)
    const existingCount = await ChartOfAccounts.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing accounts. Skipping seed.`);
      await mongoose.disconnect();
      return;
    }

    // Create accounts with proper parent-child relationships
    const createdAccounts: any[] = [];
    
    for (const accountData of DEFAULT_ACCOUNTS) {
      // Find parent account if subcategory exists
      if (accountData.subcategory) {
        const parentAccount = createdAccounts.find(acc => 
          acc.category === accountData.category && 
          acc.subcategory === undefined
        );
        if (parentAccount) {
          accountData.parentAccount = parentAccount._id;
        }
      }

      const account = new ChartOfAccounts({
        ...accountData,
        createdBy: defaultUser._id,
        updatedBy: defaultUser._id
      });

      const savedAccount = await account.save();
      createdAccounts.push(savedAccount);
      console.log(`Created account: ${savedAccount.accountCode} - ${savedAccount.accountName}`);
    }

    console.log(`\n✅ Successfully seeded ${createdAccounts.length} Chart of Accounts`);
    console.log('Chart of Accounts structure:');
    
    // Display hierarchy
    const displayHierarchy = (accounts: any[], level = 0) => {
      accounts.forEach(account => {
        const indent = '  '.repeat(level);
        console.log(`${indent}${account.accountCode} - ${account.accountName} (${account.accountType})`);
        
        const children = createdAccounts.filter(acc => 
          acc.parentAccount && acc.parentAccount.toString() === account._id.toString()
        );
        if (children.length > 0) {
          displayHierarchy(children, level + 1);
        }
      });
    };

    const rootAccounts = createdAccounts.filter(acc => !acc.parentAccount);
    displayHierarchy(rootAccounts);

  } catch (error) {
    console.error('Error seeding Chart of Accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedChartOfAccounts();
}

export default seedChartOfAccounts; 