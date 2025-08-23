# General Ledger Integration Examples

## 🚀 How to Use the GL Posting Service

This document provides practical examples of how to integrate the General Ledger (GL) posting service with your existing modules. The service automatically creates double-entry transactions in the GL whenever financial events occur in your system.

## 📋 Prerequisites

Before using the GL posting service, ensure you have:

1. **Chart of Accounts** populated with IFRS-compliant accounts
2. **General Ledger models** properly imported
3. **Authentication middleware** configured
4. **Database connection** established

## 🔧 Basic Integration

### 1. Import the Service

```typescript
import GLPostingService from '../utils/glPostingService';
```

### 2. Call the Service in Your Controllers

The service automatically handles:
- Double-entry validation
- Transaction ID generation
- Period classification
- Audit trail creation
- Account mapping

## 📊 HR Module Integration

### Example: Payroll Processing

```typescript
// In your payroll controller
export const processPayroll = async (req: Request, res: Response) => {
  try {
    const { employeeId, salaryAmount, transactionDate } = req.body;
    const userId = req.user.id; // From auth middleware

    // Process payroll logic here...
    const payroll = await Payroll.create({
      employeeId,
      amount: salaryAmount,
      date: transactionDate,
      // ... other fields
    });

    // Automatically post to General Ledger
    const glResult = await GLPostingService.postPayrollTransaction(
      employeeId,
      salaryAmount,
      transactionDate,
      userId,
      `Salary payment for ${payroll.employeeName}`
    );

    if (glResult.success) {
      console.log(`GL Transaction created: ${glResult.transactionId}`);
      
      // Update payroll record with GL reference
      await Payroll.findByIdAndUpdate(payroll._id, {
        glTransactionId: glResult.transactionId,
        glPosted: true
      });
    } else {
      console.error('GL posting failed:', glResult.error);
      // Handle GL posting failure
    }

    res.status(201).json({
      success: true,
      payroll,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### Example: Training Expenses

```typescript
// In your training controller
export const recordTrainingExpense = async (req: Request, res: Response) => {
  try {
    const { employeeId, trainingType, cost, transactionDate } = req.body;
    const userId = req.user.id;

    // Create training record
    const training = await Training.create({
      employeeId,
      type: trainingType,
      cost,
      date: transactionDate,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postPayrollTransaction(
      employeeId,
      cost,
      transactionDate,
      userId,
      `${trainingType} training for employee ${employeeId}`
    );

    res.status(201).json({
      success: true,
      training,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🏗️ Assets Module Integration

### Example: Asset Depreciation

```typescript
// In your depreciation controller
export const recordDepreciation = async (req: Request, res: Response) => {
  try {
    const { assetId, depreciationAmount, transactionDate } = req.body;
    const userId = req.user.id;

    // Calculate depreciation
    const depreciation = await Depreciation.create({
      assetId,
      amount: depreciationAmount,
      date: transactionDate,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postDepreciationTransaction(
      assetId,
      depreciationAmount,
      transactionDate,
      userId,
      `Monthly depreciation for asset ${assetId}`
    );

    res.status(201).json({
      success: true,
      depreciation,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### Example: Asset Purchase

```typescript
// In your asset controller
export const recordAssetPurchase = async (req: Request, res: Response) => {
  try {
    const { assetName, purchaseAmount, transactionDate, vendorId } = req.body;
    const userId = req.user.id;

    // Create asset record
    const asset = await Asset.create({
      name: assetName,
      purchasePrice: purchaseAmount,
      purchaseDate: transactionDate,
      vendorId,
      // ... other fields
    });

    // Post to GL (using custom mapping for asset purchase)
    const glResult = await GLPostingService.createGLTransaction(
      'ASSET_PURCHASE',
      'Asset',
      asset._id.toString(),
      [
        {
          accountCode: '2100', // Property, Plant & Equipment
          debit: purchaseAmount,
          credit: 0,
          description: `Purchase of ${assetName}`
        },
        {
          accountCode: '1100', // Cash
          debit: 0,
          credit: purchaseAmount,
          description: `Cash payment for ${assetName}`
        }
      ],
      transactionDate,
      userId,
      `Asset Purchase - ${assetName}`
    );

    res.status(201).json({
      success: true,
      asset,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🚛 Operations Module Integration

### Example: Fuel Purchase

```typescript
// In your fuel log controller
export const recordFuelPurchase = async (req: Request, res: Response) => {
  try {
    const { vehicleId, fuelAmount, cost, transactionDate, stationId } = req.body;
    const userId = req.user.id;

    // Create fuel log
    const fuelLog = await FuelLog.create({
      vehicleId,
      fuelAmount,
      cost,
      date: transactionDate,
      stationId,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postFuelTransaction(
      fuelLog._id.toString(),
      cost,
      transactionDate,
      userId,
      `Fuel purchase for vehicle ${vehicleId}`
    );

    res.status(201).json({
      success: true,
      fuelLog,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### Example: Maintenance Expense

```typescript
// In your maintenance controller
export const recordMaintenanceExpense = async (req: Request, res: Response) => {
  try {
    const { assetId, maintenanceType, cost, transactionDate, vendorId } = req.body;
    const userId = req.user.id;

    // Create maintenance record
    const maintenance = await Maintenance.create({
      assetId,
      type: maintenanceType,
      cost,
      date: transactionDate,
      vendorId,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postMaintenanceTransaction(
      maintenance._id.toString(),
      cost,
      transactionDate,
      userId,
      `${maintenanceType} maintenance for asset ${assetId}`
    );

    res.status(201).json({
      success: true,
      maintenance,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🛒 Procurement Module Integration

### Example: Purchase Order

```typescript
// In your purchase order controller
export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { vendorId, items, totalAmount, transactionDate } = req.body;
    const userId = req.user.id;

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      vendorId,
      items,
      totalAmount,
      date: transactionDate,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postProcurementTransaction(
      purchaseOrder._id.toString(),
      totalAmount,
      transactionDate,
      userId,
      true, // isCredit = true for credit purchase
      `Purchase order ${purchaseOrder.poNumber}`
    );

    res.status(201).json({
      success: true,
      purchaseOrder,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 💰 Sales Module Integration

### Example: Sales Invoice

```typescript
// In your sales controller
export const createSalesInvoice = async (req: Request, res: Response) => {
  try {
    const { customerId, items, totalAmount, transactionDate, isCredit } = req.body;
    const userId = req.user.id;

    // Create sales invoice
    const invoice = await Invoice.create({
      customerId,
      items,
      totalAmount,
      date: transactionDate,
      isCredit,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postSalesTransaction(
      invoice._id.toString(),
      totalAmount,
      transactionDate,
      isCredit,
      userId,
      `Sales invoice ${invoice.invoiceNumber}`
    );

    res.status(201).json({
      success: true,
      invoice,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🏢 Admin Module Integration

### Example: Office Expenses

```typescript
// In your expense controller
export const recordOfficeExpense = async (req: Request, res: Response) => {
  try {
    const { expenseType, amount, transactionDate, description } = req.body;
    const userId = req.user.id;

    // Create expense record
    const expense = await Expense.create({
      type: expenseType,
      amount,
      date: transactionDate,
      description,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postAdminExpenseTransaction(
      expense._id.toString(),
      amount,
      transactionDate,
      userId,
      `${expenseType}: ${description}`
    );

    res.status(201).json({
      success: true,
      expense,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🛡️ HSE Module Integration

### Example: Safety Equipment Purchase

```typescript
// In your HSE controller
export const recordSafetyEquipmentPurchase = async (req: Request, res: Response) => {
  try {
    const { equipmentType, cost, transactionDate, vendorId } = req.body;
    const userId = req.user.id;

    // Create HSE record
    const hseRecord = await HSE.create({
      type: equipmentType,
      cost,
      date: transactionDate,
      vendorId,
      // ... other fields
    });

    // Post to GL
    const glResult = await GLPostingService.postHSETransaction(
      hseRecord._id.toString(),
      cost,
      transactionDate,
      userId,
      `Safety equipment: ${equipmentType}`
    );

    res.status(201).json({
      success: true,
      hseRecord,
      glTransactionId: glResult.transactionId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🔄 Advanced Usage

### Custom Account Mappings

You can override default account mappings by creating custom rules:

```typescript
// Get custom mapping from database
const customMapping = await GLPostingService.getCustomAccountMapping(
  'HR',
  'SPECIAL_BONUS'
);

if (customMapping) {
  // Use custom mapping
  const glResult = await GLPostingService.createGLTransaction(
    'HR_SPECIAL_BONUS',
    'Employee',
    employeeId,
    [
      {
        accountCode: customMapping.debit,
        debit: bonusAmount,
        credit: 0,
        description: 'Special bonus payment'
      },
      {
        accountCode: customMapping.credit,
        debit: 0,
        credit: bonusAmount,
        description: 'Cash payment for bonus'
      }
    ],
    transactionDate,
    userId,
    'Special Bonus Payment'
  );
}
```

### Batch Processing

For multiple transactions, you can process them in batches:

```typescript
// Process multiple payroll entries
export const processBatchPayroll = async (req: Request, res: Response) => {
  try {
    const { payrollEntries } = req.body;
    const userId = req.user.id;
    const results = [];

    for (const entry of payrollEntries) {
      const glResult = await GLPostingService.postPayrollTransaction(
        entry.employeeId,
        entry.salaryAmount,
        entry.transactionDate,
        userId,
        entry.description
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

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## ⚠️ Error Handling

### GL Posting Failures

Always handle GL posting failures gracefully:

```typescript
// Post to GL with error handling
const glResult = await GLPostingService.postPayrollTransaction(
  employeeId,
  salaryAmount,
  transactionDate,
  userId
);

if (!glResult.success) {
  // Log the error
  console.error('GL posting failed:', glResult.error);
  
  // Option 1: Continue without GL posting
  console.warn('Continuing without GL posting');
  
  // Option 2: Retry the GL posting
  const retryResult = await GLPostingService.postPayrollTransaction(
    employeeId,
    salaryAmount,
    transactionDate,
    userId
  );
  
  // Option 3: Queue for later processing
  await queueGLPosting({
    type: 'HR_PAYROLL',
    data: { employeeId, salaryAmount, transactionDate, userId }
  });
}
```

### Validation Errors

The service validates accounts before posting:

```typescript
// Validate account codes before posting
const accountCodes = ['8100', '1100'];
const isValid = await GLPostingService.validateAccountCodes(accountCodes);

if (!isValid) {
  throw new Error('Invalid or inactive account codes detected');
}
```

## 📊 Monitoring and Reporting

### Check GL Posting Status

```typescript
// Check if a record has been posted to GL
const payroll = await Payroll.findById(payrollId);
if (payroll.glPosted) {
  console.log(`GL Transaction: ${payroll.glTransactionId}`);
} else {
  console.log('Not yet posted to GL');
}
```

### Get GL Summary

```typescript
// Get GL summary for reporting
const glSummary = await fetch('/api/gl/summary?period=monthly');
const summaryData = await glSummary.json();
console.log('GL Summary:', summaryData);
```

## 🚀 Best Practices

### 1. Always Handle Errors
- Check GL posting results
- Log failures for debugging
- Implement retry mechanisms

### 2. Use Descriptive Descriptions
- Include relevant IDs and names
- Make descriptions searchable
- Follow consistent naming conventions

### 3. Validate Data Before Posting
- Ensure amounts are positive
- Validate account codes exist
- Check transaction dates are valid

### 4. Monitor Performance
- Track GL posting times
- Monitor database performance
- Implement proper indexing

### 5. Maintain Audit Trail
- Keep original transaction references
- Track who created GL entries
- Maintain version history

## 🔍 Troubleshooting

### Common Issues

1. **Double-entry validation failed**
   - Check that debits equal credits
   - Verify amount calculations
   - Ensure no rounding errors

2. **Invalid account codes**
   - Verify account codes exist in Chart of Accounts
   - Check account status (active/inactive)
   - Validate account hierarchy

3. **Transaction ID conflicts**
   - Check for duplicate transaction IDs
   - Verify date formatting
   - Ensure proper sequence generation

4. **Period classification errors**
   - Check transaction date format
   - Verify fiscal year logic
   - Validate period calculations

## 📚 Additional Resources

- [Chart of Accounts Structure](./ChartOfAccounts.md)
- [General Ledger Models](./GeneralLedgerEntry.md)
- [IFRS Compliance Guide](./IFRS_Compliance.md)
- [API Documentation](./API_Documentation.md)

---

**Note**: This service automatically ensures IFRS compliance and double-entry bookkeeping. All transactions are validated and tracked with complete audit trails. 