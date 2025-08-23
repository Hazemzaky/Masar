# General Ledger (GL) System

## Overview

The General Ledger (GL) system serves as the central accounting book where all financial transactions from different modules are automatically recorded and can be reported under IFRS (International Financial Reporting Standards). This system ensures proper double-entry bookkeeping, maintains data integrity, and provides the foundation for complete financial reporting.

## 🏗️ System Architecture

### Core Components

1. **Chart of Accounts (CoA)**
   - IFRS-compliant account structure
   - Hierarchical organization (5 levels deep)
   - Account types: Asset, Liability, Equity, Revenue, Expense
   - IFRS categorization for proper financial reporting

2. **General Ledger Entries**
   - Double-entry bookkeeping validation
   - Automatic transaction ID generation
   - Module source tracking
   - Approval workflow support
   - Reversal capability

3. **GL Posting Service**
   - Automatic transaction posting from modules
   - Default account mappings
   - Custom mapping support
   - Transaction validation

### Database Schema

```
ChartOfAccounts
├── accountCode (unique identifier)
├── accountName
├── accountType (asset|liability|equity|revenue|expense)
├── category & subcategory
├── ifrsCategory & ifrsSubcategory
├── parentAccount (hierarchical structure)
├── level & sortOrder
└── audit fields (createdBy, updatedBy, version)

GeneralLedgerEntry
├── transactionId (unique per transaction)
├── moduleSource (hr|assets|operations|etc.)
├── referenceType & referenceId
├── accountCode & account
├── debit & credit amounts
├── description & narration
├── period & fiscalYear
├── approvalStatus
└── audit fields
```

## 🔄 Automatic Integration

### Module Integration Points

The GL system automatically integrates with all major modules:

| Module | Transaction Types | Default Debit Account | Default Credit Account |
|--------|------------------|----------------------|----------------------|
| **HR** | Payroll, Training | Staff Costs (8100) | Cash (1100) |
| **Assets** | Depreciation, Purchase | Depreciation/PPE | Accumulated Depreciation/Cash |
| **Operations** | Fuel, Maintenance | Cost of Sales (7300) | Cash (1100) |
| **Procurement** | Purchase, Invoice | Direct Materials (7100) | Accounts Payable (3100) |
| **Sales** | Revenue, Credit Sales | Cash/Receivables | Sales Revenue |
| **Admin** | Office, Licenses | Administrative Expenses (8200) | Cash (1100) |
| **HSE** | Safety Equipment | HSE Expenses (8400) | Cash (1100) |

### Example: HR Payroll Integration

```typescript
// When HR processes payroll, this automatically happens:
const payrollResult = await GLPostingService.postPayrollTransaction(
  employeeId,
  salaryAmount,
  transactionDate,
  userId
);

// Creates GL entries:
// DR Staff Costs (8100) - $2,500
// CR Cash (1100) - $2,500
```

## 📊 Chart of Accounts Structure

### IFRS-Compliant Categories

#### Assets
- **1000** Current Assets
  - **1100** Cash and Cash Equivalents
  - **1200** Accounts Receivable
  - **1300** Inventory
  - **1400** Prepaid Expenses

- **2000** Non-Current Assets
  - **2100** Property, Plant and Equipment
  - **2200** Accumulated Depreciation
  - **2300** Intangible Assets

#### Liabilities
- **3000** Current Liabilities
  - **3100** Accounts Payable
  - **3200** Accrued Expenses
  - **3300** Short-term Loans

- **4000** Non-Current Liabilities
  - **4100** Long-term Loans

#### Equity
- **5000** Equity
  - **5100** Share Capital
  - **5200** Retained Earnings

#### Revenue
- **6000** Revenue
  - **6100** Sales Revenue
  - **6200** Service Revenue
  - **6300** Other Income

#### Expenses
- **7000** Cost of Sales
  - **7100** Direct Materials
  - **7200** Direct Labor
  - **7300** Depreciation - Operations

- **8000** Operating Expenses
  - **8100** Staff Costs
  - **8200** Administrative Expenses
  - **8300** Maintenance Expenses
  - **8400** HSE Expenses
  - **8500** Depreciation - Admin

- **9000** Finance Costs
  - **9100** Interest Expense

- **10000** Income Tax Expense

## 🚀 API Endpoints

### General Ledger Routes (`/api/gl`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create GL transaction (double-entry) |
| `GET` | `/entries` | Get GL entries with filters |
| `GET` | `/summary` | Get GL summary by account |
| `GET` | `/trial-balance` | Get trial balance |
| `POST` | `/transactions/reverse` | Reverse a transaction |
| `POST` | `/entries/approve` | Approve GL entries |
| `GET` | `/accounts/:id/entries` | Get entries by account |
| `GET` | `/export` | Export GL data |

### Chart of Accounts Routes (`/api/chart-of-accounts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create new account |
| `GET` | `/` | Get accounts with filters |
| `GET` | `/hierarchy` | Get account hierarchy |
| `GET` | `/ifrs-category` | Get accounts by IFRS category |
| `GET` | `/statistics` | Get account statistics |
| `GET` | `/:id` | Get account by ID |
| `PUT` | `/:id` | Update account |
| `DELETE` | `/:id` | Delete account |
| `POST` | `/bulk` | Bulk create accounts |

## 💡 Usage Examples

### 1. Creating a Simple Transaction

```typescript
import { GLPostingService } from '../services/glPostingService';

// Simple two-entry transaction
const result = await GLPostingService.postSimpleTransaction(
  'hr',                    // moduleSource
  'payroll',               // transactionType
  employeeId,              // referenceId
  2500.00,                 // amount
  new Date(),              // transactionDate
  'Monthly salary',        // description
  userId                    // userId
);
```

### 2. Creating Complex Multi-Entry Transactions

```typescript
// Complex transaction with multiple entries
const result = await GLPostingService.postTransaction({
  moduleSource: 'assets',
  referenceType: 'purchase',
  referenceId: purchaseOrderId,
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
```

### 3. Custom Account Mappings

```typescript
// Add custom mapping for specific transaction types
GLPostingService.addCustomMapping({
  moduleSource: 'custom',
  transactionType: 'special_expense',
  debitAccount: '8200', // Administrative Expenses
  creditAccount: '1100', // Cash
  description: 'Special custom expense'
});
```

## 🔍 Reporting and Analysis

### GL Summary Report

```typescript
// Get summary by account with running balances
const summary = await api.get('/api/gl/summary', {
  params: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    accountCode: '8100' // Staff Costs only
  }
});
```

### Trial Balance

```typescript
// Get trial balance as of specific date
const trialBalance = await api.get('/api/gl/trial-balance', {
  params: {
    asOfDate: '2024-12-31',
    fiscalYear: 2024
  }
});
```

### Account Detail Report

```typescript
// Get detailed entries for specific account
const accountEntries = await api.get(`/api/gl/accounts/${accountId}/entries`, {
  params: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    page: 1,
    limit: 50
  }
});
```

## 🛡️ Data Validation

### Double-Entry Validation

The system automatically validates that:
- Debits equal Credits for each transaction
- At least one entry has a debit or credit amount
- No entry has both debit and credit amounts

### Account Validation

- Verifies account codes exist before posting
- Validates account types and IFRS categories
- Ensures proper hierarchical relationships

### Transaction Validation

- Generates unique transaction IDs
- Tracks module source and reference types
- Maintains audit trail with user tracking

## 🔄 Workflow Integration

### Approval Workflow

1. **Pending**: New GL entries start as pending
2. **Approved**: Authorized users can approve entries
3. **Rejected**: Entries can be rejected with comments

### Reversal Process

1. **Identify**: Find transaction to reverse
2. **Create**: Generate reversal entries
3. **Mark**: Mark original entries as reversed
4. **Audit**: Maintain complete audit trail

## 📈 IFRS Compliance Features

### Revenue Recognition (IFRS 15)

- Point-in-time vs. over-time recognition
- Automatic GL posting for revenue milestones
- Support for complex contract arrangements

### Lease Accounting (IFRS 16)

- Right-of-use asset recognition
- Lease liability tracking
- Automatic depreciation and interest calculations

### Asset Depreciation

- Straight-line and reducing balance methods
- Component depreciation support
- Automatic GL posting for depreciation expense

## 🚀 Getting Started

### 1. Seed Chart of Accounts

```bash
# Run the seed script to create default accounts
npm run seed:chart-of-accounts
```

### 2. Test GL Integration

```typescript
import { runAllGLExamples } from './examples/glIntegrationExamples';

// Run all integration examples
await runAllGLExamples(userId);
```

### 3. Monitor GL Health

```bash
# Check GL system health
curl http://localhost:5000/api/gl/health

# Check Chart of Accounts health
curl http://localhost:5000/api/chart-of-accounts/health
```

## 🔧 Configuration

### Environment Variables

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/masar

# JWT secret for authentication
JWT_SECRET=your-secret-key

# Default currency
DEFAULT_CURRENCY=KWD
```

### Account Mapping Configuration

Default account mappings can be modified in `GLPostingService.ts`:

```typescript
const DEFAULT_ACCOUNT_MAPPINGS: AccountMapping[] = [
  // Add your custom mappings here
  {
    moduleSource: 'your_module',
    transactionType: 'your_transaction',
    debitAccount: 'account_code',
    creditAccount: 'account_code',
    description: 'Your description'
  }
];
```

## 📚 Related Documentation

- [P&L System Documentation](./PNL_SYSTEM_README.md)
- [Account Mapping System](./ACCOUNT_MAPPING_README.md)
- [IFRS Compliance Guide](./IFRS_COMPLIANCE_README.md)

## 🤝 Contributing

When adding new modules or transaction types:

1. **Update Account Mappings**: Add default mappings in `GLPostingService`
2. **Extend Models**: Update relevant models with GL integration fields
3. **Add Controllers**: Implement automatic GL posting in module controllers
4. **Update Documentation**: Document new integration points

## 🐛 Troubleshooting

### Common Issues

1. **Double-Entry Validation Failed**
   - Check that total debits equal total credits
   - Ensure no entry has both debit and credit amounts

2. **Account Not Found**
   - Verify account code exists in Chart of Accounts
   - Check account is active

3. **Transaction ID Generation Failed**
   - Ensure module source and reference type are valid
   - Check database connection

### Debug Mode

Enable debug logging:

```typescript
// In your module controller
console.log('GL Posting Data:', postingData);
console.log('GL Posting Result:', result);
```

## 📞 Support

For technical support or questions about the GL system:

1. Check the logs for error details
2. Verify account mappings are correct
3. Ensure proper authentication and permissions
4. Review the integration examples for reference

---

**Note**: This GL system is designed to be the foundation for all financial reporting. Ensure proper testing and validation before implementing in production environments. 