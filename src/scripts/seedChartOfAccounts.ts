import mongoose from 'mongoose';
import ChartOfAccounts from '../models/ChartOfAccounts';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

// Default Chart of Accounts structure following IFRS standards
const DEFAULT_ACCOUNTS = [
  // Assets - Current
  {
    accountCode: '1100',
    accountName: 'Cash and Cash Equivalents',
    accountType: 'asset',
    category: 'current',
    subcategory: 'cash',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'current_assets',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '1200',
    accountName: 'Accounts Receivable',
    accountType: 'asset',
    category: 'current',
    subcategory: 'receivables',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'current_assets',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '1300',
    accountName: 'Inventory',
    accountType: 'asset',
    category: 'current',
    subcategory: 'inventory',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'current_assets',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '1400',
    accountName: 'Prepaid Expenses',
    accountType: 'asset',
    category: 'current',
    subcategory: 'prepaid',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'current_assets',
    level: 1,
    sortOrder: 4,
    isSystem: true,
    parentAccount: null
  },

  // Assets - Non-Current
  {
    accountCode: '2100',
    accountName: 'Property, Plant and Equipment',
    accountType: 'asset',
    category: 'non_current',
    subcategory: 'property_plant_equipment',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'property_plant_equipment',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '2200',
    accountName: 'Accumulated Depreciation',
    accountType: 'asset',
    category: 'non_current',
    subcategory: 'accumulated_depreciation',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'property_plant_equipment',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '2300',
    accountName: 'Intangible Assets',
    accountType: 'asset',
    category: 'non_current',
    subcategory: 'intangible_assets',
    ifrsCategory: 'assets',
    ifrsSubcategory: 'intangible_assets',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    parentAccount: null
  },

  // Liabilities - Current
  {
    accountCode: '3100',
    accountName: 'Accounts Payable',
    accountType: 'liability',
    category: 'current',
    subcategory: 'trade_payables',
    ifrsCategory: 'liabilities',
    ifrsSubcategory: 'current_liabilities',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '3200',
    accountName: 'Accrued Expenses',
    accountType: 'liability',
    category: 'current',
    subcategory: 'accruals',
    ifrsCategory: 'liabilities',
    ifrsSubcategory: 'current_liabilities',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '3300',
    accountName: 'Short-term Loans',
    accountType: 'liability',
    category: 'current',
    subcategory: 'borrowings',
    ifrsCategory: 'liabilities',
    ifrsSubcategory: 'current_liabilities',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    parentAccount: null
  },

  // Liabilities - Non-Current
  {
    accountCode: '4100',
    accountName: 'Long-term Loans',
    accountType: 'liability',
    category: 'non_current',
    subcategory: 'borrowings',
    ifrsCategory: 'liabilities',
    ifrsSubcategory: 'non_current_liabilities',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },

  // Equity
  {
    accountCode: '5100',
    accountName: 'Share Capital',
    accountType: 'equity',
    category: 'equity',
    subcategory: 'share_capital',
    ifrsCategory: 'equity',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '5200',
    accountName: 'Retained Earnings',
    accountType: 'equity',
    category: 'equity',
    subcategory: 'retained_earnings',
    ifrsCategory: 'equity',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },

  // Revenue
  {
    accountCode: '6100',
    accountName: 'Sales Revenue',
    accountType: 'revenue',
    category: 'revenue',
    subcategory: 'sales',
    ifrsCategory: 'revenue',
    ifrsSubcategory: 'revenue',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '6200',
    accountName: 'Service Revenue',
    accountType: 'revenue',
    category: 'revenue',
    subcategory: 'services',
    ifrsCategory: 'revenue',
    ifrsSubcategory: 'revenue',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '6300',
    accountName: 'Other Income',
    accountType: 'revenue',
    category: 'revenue',
    subcategory: 'other_income',
    ifrsCategory: 'revenue',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    parentAccount: null
  },

  // Expenses
  {
    accountCode: '7100',
    accountName: 'Direct Materials',
    accountType: 'expense',
    category: 'cost_of_sales',
    subcategory: 'materials',
    ifrsCategory: 'cost_of_sales',
    ifrsSubcategory: 'cost_of_sales',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '7200',
    accountName: 'Direct Labor',
    accountType: 'expense',
    category: 'cost_of_sales',
    subcategory: 'labor',
    ifrsCategory: 'cost_of_sales',
    ifrsSubcategory: 'cost_of_sales',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '7300',
    accountName: 'Depreciation - Operations',
    accountType: 'expense',
    category: 'cost_of_sales',
    subcategory: 'depreciation',
    ifrsCategory: 'cost_of_sales',
    ifrsSubcategory: 'cost_of_sales',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    parentAccount: null
  },

  // Expenses - Operating
  {
    accountCode: '8100',
    accountName: 'Staff Costs',
    accountType: 'expense',
    category: 'operating_expenses',
    subcategory: 'staff_costs',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'operating_expenses',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '8200',
    accountName: 'Administrative Expenses',
    accountType: 'expense',
    category: 'operating_expenses',
    subcategory: 'administrative',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'operating_expenses',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '8300',
    accountName: 'Maintenance Expenses',
    accountType: 'expense',
    category: 'operating_expenses',
    subcategory: 'maintenance',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'operating_expenses',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '8400',
    accountName: 'HSE Expenses',
    accountType: 'expense',
    category: 'operating_expenses',
    subcategory: 'hse',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'operating_expenses',
    level: 1,
    sortOrder: 4,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '8500',
    accountName: 'Depreciation - Admin',
    accountType: 'expense',
    category: 'operating_expenses',
    subcategory: 'depreciation',
    ifrsCategory: 'operating_expenses',
    ifrsSubcategory: 'operating_expenses',
    level: 1,
    sortOrder: 5,
    isSystem: true,
    parentAccount: null
  },

  // Expenses - Finance
  {
    accountCode: '9100',
    accountName: 'Interest Expense',
    accountType: 'expense',
    category: 'finance_costs',
    subcategory: 'interest',
    ifrsCategory: 'finance_costs',
    ifrsSubcategory: 'finance_costs',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    parentAccount: null
  },
  {
    accountCode: '10000',
    accountName: 'Income Tax Expense',
    accountType: 'expense',
    category: 'income_tax_expense',
    level: 0,
    sortOrder: 10,
    isSystem: true,
    parentAccount: null
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