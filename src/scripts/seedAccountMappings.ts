import mongoose from 'mongoose';
import AccountMapping from '../models/AccountMapping';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

// Default account mappings for IFRS P&L categorization
const DEFAULT_ACCOUNT_MAPPINGS = [
  // REVENUE - Sales Module
  {
    module: 'sales',
    accountCode: 'SALES-001',
    accountName: 'Sales Revenue',
    accountDescription: 'Revenue from sales of goods and services',
    pnlCategory: 'revenue',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'sales',
    accountCode: 'SALES-002',
    accountName: 'Service Revenue',
    accountDescription: 'Revenue from service contracts and consulting',
    pnlCategory: 'revenue',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },

  // COST OF SALES - Operations Module
  {
    module: 'operations',
    accountCode: 'OPS-001',
    accountName: 'Fuel Costs',
    accountDescription: 'Vehicle fuel and operational fuel expenses',
    pnlCategory: 'cost_of_sales',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'operations',
    accountCode: 'OPS-002',
    accountName: 'Vehicle Maintenance',
    accountDescription: 'Direct vehicle maintenance and repair costs',
    pnlCategory: 'cost_of_sales',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'operations',
    accountCode: 'OPS-003',
    accountName: 'Toll & Parking',
    accountDescription: 'Toll fees, parking, and road charges',
    pnlCategory: 'cost_of_sales',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },

  // COST OF SALES - Procurement Module
  {
    module: 'procurement',
    accountCode: 'PROC-001',
    accountName: 'Raw Materials',
    accountDescription: 'Direct materials and supplies for operations',
    pnlCategory: 'cost_of_sales',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'procurement',
    accountCode: 'PROC-002',
    accountName: 'Vendor Invoices',
    accountDescription: 'Direct procurement costs from vendors',
    pnlCategory: 'cost_of_sales',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },

  // COST OF SALES - Assets Module (Operational)
  {
    module: 'assets',
    accountCode: 'ASSET-001',
    accountName: 'Operational Asset Depreciation',
    accountDescription: 'Depreciation of assets directly used in operations',
    pnlCategory: 'cost_of_sales',
    isAmortizable: true,
    amortizationPeriod: 60, // 5 years
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: false
  },

  // OPERATING EXPENSES - HR Module
  {
    module: 'hr',
    accountCode: 'HR-001',
    accountName: 'Staff Salaries',
    accountDescription: 'Employee salaries and wages',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'staff_costs',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 1000
  },
  {
    module: 'hr',
    accountCode: 'HR-002',
    accountName: 'Employee Benefits',
    accountDescription: 'Health insurance, retirement, and other benefits',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'staff_costs',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 500
  },
  {
    module: 'hr',
    accountCode: 'HR-003',
    accountName: 'Training & Development',
    accountDescription: 'Employee training programs and certifications',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'staff_costs',
    isAmortizable: true,
    amortizationPeriod: 12, // 1 year
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 2000
  },

  // OPERATING EXPENSES - Maintenance Module
  {
    module: 'maintenance',
    accountCode: 'MAINT-001',
    accountName: 'Equipment Maintenance',
    accountDescription: 'Maintenance and repair of non-operational equipment',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'maintenance',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 500
  },
  {
    module: 'maintenance',
    accountCode: 'MAINT-002',
    accountName: 'Facility Maintenance',
    accountDescription: 'Building and facility maintenance costs',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'maintenance',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 1000
  },

  // OPERATING EXPENSES - HSE Module
  {
    module: 'hse',
    accountCode: 'HSE-001',
    accountName: 'Safety Equipment',
    accountDescription: 'Personal protective equipment and safety gear',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'hse_costs',
    isAmortizable: true,
    amortizationPeriod: 24, // 2 years
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 500
  },
  {
    module: 'hse',
    accountCode: 'HSE-002',
    accountName: 'Safety Training',
    accountDescription: 'Health and safety training programs',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'hse_costs',
    isAmortizable: true,
    amortizationPeriod: 12, // 1 year
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 1000
  },

  // OPERATING EXPENSES - Admin Module
  {
    module: 'admin',
    accountCode: 'ADMIN-001',
    accountName: 'Office Supplies',
    accountDescription: 'Office stationery and supplies',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'admin_expenses',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'admin',
    accountCode: 'ADMIN-002',
    accountName: 'Software Licenses',
    accountDescription: 'Business software and application licenses',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'admin_expenses',
    isAmortizable: true,
    amortizationPeriod: 12, // 1 year
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 500
  },
  {
    module: 'admin',
    accountCode: 'ADMIN-003',
    accountName: 'Utilities',
    accountDescription: 'Electricity, water, internet, and phone services',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'utilities',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },

  // OPERATING EXPENSES - Assets Module (Non-Operational)
  {
    module: 'assets',
    accountCode: 'ASSET-002',
    accountName: 'Administrative Asset Depreciation',
    accountDescription: 'Depreciation of office and administrative assets',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'depreciation',
    isAmortizable: true,
    amortizationPeriod: 60, // 5 years
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'assets',
    accountCode: 'ASSET-003',
    accountName: 'Intangible Asset Amortization',
    accountDescription: 'Amortization of software, patents, and licenses',
    pnlCategory: 'operating_expenses',
    operatingExpenseSubcategory: 'amortization',
    isAmortizable: true,
    amortizationPeriod: 36, // 3 years
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: false
  },

  // FINANCE COSTS - Finance Module
  {
    module: 'finance',
    accountCode: 'FIN-001',
    accountName: 'Interest Expense',
    accountDescription: 'Interest on loans and borrowings',
    pnlCategory: 'finance_costs',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },
  {
    module: 'finance',
    accountCode: 'FIN-002',
    accountName: 'Bank Charges',
    accountDescription: 'Bank fees and transaction charges',
    pnlCategory: 'finance_costs',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },

  // OTHER INCOME - Finance Module
  {
    module: 'finance',
    accountCode: 'FIN-003',
    accountName: 'Interest Income',
    accountDescription: 'Interest earned on deposits and investments',
    pnlCategory: 'other_income',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: false
  },

  // OTHER EXPENSES - Various Modules
  {
    module: 'admin',
    accountCode: 'ADMIN-004',
    accountName: 'Legal & Professional',
    accountDescription: 'Legal fees and professional consulting',
    pnlCategory: 'other_expenses',
    isAmortizable: false,
    allocationMethod: 'direct',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 1000
  },
  {
    module: 'admin',
    accountCode: 'ADMIN-005',
    accountName: 'Insurance',
    accountDescription: 'Business insurance premiums',
    pnlCategory: 'other_expenses',
    isAmortizable: true,
    amortizationPeriod: 12, // 1 year
    allocationMethod: 'time_based',
    isActive: true,
    requiresApproval: true,
    approvalThreshold: 2000
  }
];

async function seedAccountMappings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('Connected to MongoDB');

    // Get a default user for createdBy/updatedBy fields
    const defaultUser = await User.findOne();
    if (!defaultUser) {
      console.error('No users found in database. Please create a user first.');
      process.exit(1);
    }

    // Clear existing mappings
    await AccountMapping.deleteMany({});
    console.log('Cleared existing account mappings');

    // Insert new mappings
    const mappingsWithUser = DEFAULT_ACCOUNT_MAPPINGS.map(mapping => ({
      ...mapping,
      createdBy: defaultUser._id,
      updatedBy: defaultUser._id
    }));

    const result = await AccountMapping.insertMany(mappingsWithUser);
    console.log(`Successfully seeded ${result.length} account mappings`);

    // Display summary
    const summary = await AccountMapping.aggregate([
      {
        $group: {
          _id: '$pnlCategory',
          count: { $sum: 1 },
          modules: { $addToSet: '$module' }
        }
      }
    ]);

    console.log('\nAccount Mapping Summary:');
    summary.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} accounts from modules: ${cat.modules.join(', ')}`);
    });

    console.log('\nAccount mappings seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding account mappings:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAccountMappings(); 