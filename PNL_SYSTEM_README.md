# IFRS-Compliant Profit & Loss (P&L) Statement System

## Overview

This system implements a comprehensive, IFRS-compliant Profit & Loss Statement that automatically consolidates financial data from all system modules and presents it according to IAS 1 (Presentation of Financial Statements) requirements.

## 🏛️ IFRS Compliance

The P&L Statement follows **IAS 1 - Presentation of Financial Statements** with the following structure:

1. **Revenue** - Income from sales and services
2. **Cost of Sales** - Direct operational costs
3. **Gross Profit** - Revenue minus Cost of Sales
4. **Operating Expenses** - Administrative and operational costs
5. **Operating Profit** - Gross Profit minus Operating Expenses
6. **Finance Costs** - Interest and financial charges
7. **Other Income/Expenses** - Non-operating items
8. **Profit Before Tax** - Operating Profit plus/minus other items
9. **Income Tax Expense** - Corporate tax provision
10. **Profit for the Period** - Final net profit/loss

## 🔄 Automatic Data Consolidation

### Source Modules & Data Mapping

The system automatically consolidates data from the following modules:

#### **Revenue Sources**
- **Sales Module** → Sales invoices, service contracts
- **Invoice Module** → Revenue recognition

#### **Cost of Sales (Direct Costs)**
- **Operations Module** → Fuel costs, vehicle operations, logistics
- **Procurement Module** → Materials, supplies, vendor invoices
- **Assets Module** → Operational asset depreciation

#### **Operating Expenses**
- **HR Module** → Staff salaries, benefits, training costs
- **Maintenance Module** → Equipment repairs, facility maintenance
- **HSE Module** → Safety equipment, training, compliance
- **Admin Module** → Office costs, software licenses, utilities
- **Assets Module** → Administrative asset depreciation, intangible amortization

#### **Finance Costs**
- **Finance Module** → Interest expense, bank charges

#### **Other Items**
- **Finance Module** → Interest income, investment returns
- **Various Modules** → Legal fees, insurance, professional services

## 🗄️ Database Architecture

### AccountMapping Model

The `AccountMapping` model serves as the central configuration for IFRS categorization:

```typescript
interface IAccountMapping {
  module: SourceModule;           // Source system module
  accountCode: string;            // Unique account identifier
  accountName: string;            // Human-readable account name
  pnlCategory: PnLCategory;       // IFRS P&L category
  operatingExpenseSubcategory?: OperatingExpenseSubcategory;
  isAmortizable: boolean;         // Whether costs can be amortized
  amortizationPeriod?: number;    // Amortization period in months
  allocationMethod: 'direct' | 'proportional' | 'time_based' | 'usage_based';
  isActive: boolean;              // Whether mapping is active
  requiresApproval: boolean;      // Approval workflow flag
  approvalThreshold?: number;     // Amount threshold for approval
}
```

### Key Features

- **Flexible Mapping**: Each module's accounts can be mapped to appropriate IFRS categories
- **Amortization Support**: Configurable amortization periods for capitalizable costs
- **Approval Workflows**: Built-in approval thresholds for significant expenses
- **Audit Trail**: Complete tracking of who created/updated each mapping

## ⚙️ Amortization Logic

### How Amortized Costs Are Handled

1. **Identification**: Costs marked as `isAmortizable: true` are identified
2. **Period Calculation**: The system calculates the overlap between:
   - Asset/expense period (start date to end date)
   - Reporting period (monthly, quarterly, half-yearly, yearly)
3. **Allocation**: Costs are distributed proportionally across reporting periods

### Example: Training Program Amortization

```typescript
// Training cost: KD 12,000 over 12 months
const trainingCost = 12000;
const amortizationPeriod = 12; // months
const monthlyAmount = trainingCost / amortizationPeriod;

// For a quarterly report covering months 1-3
const monthsInPeriod = 3;
const quarterlyAmount = monthlyAmount * monthsInPeriod; // KD 3,000
```

### Allocation Methods

- **`direct`**: Full amount recognized in the period incurred
- **`proportional`**: Distributed based on usage or time proportion
- **`time_based`**: Spread evenly over the amortization period
- **`usage_based`**: Allocated based on actual usage metrics

## 📊 API Endpoints

### P&L Summary
```
GET /api/pnl/summary?period=monthly&start=2025-01-01&end=2025-01-31
```

**Response**: High-level financial metrics, margins, and cost breakdowns

### P&L Table
```
GET /api/pnl/table?period=quarterly
```

**Response**: Detailed IFRS-compliant P&L statement with expandable sections

### P&L Charts
```
GET /api/pnl/charts?period=yearly
```

**Response**: Chart data for financial performance visualization

### P&L Analysis
```
GET /api/pnl/analysis?period=monthly
```

**Response**: Financial insights, alerts, and strategic recommendations

## 🎯 Frontend Features

### 1. **Summary Dashboard**
- Key financial metrics (Revenue, Gross Profit, Operating Profit, Net Profit)
- Cost breakdown by module and category
- Margin analysis and trends

### 2. **IFRS-Compliant P&L Table**
- Expandable sections for detailed analysis
- Module source identification for each line item
- Color-coded categories for easy navigation

### 3. **Financial Charts**
- Net profit trends over time
- Revenue vs Expense vs Net Profit comparison
- Margin trend analysis

### 4. **Smart Analysis**
- Financial alerts and warnings
- Performance trend identification
- Strategic recommendations

### 5. **Export Capabilities**
- PDF export for formal reporting
- Excel export for detailed analysis
- Customizable date ranges and periods

## 🚀 Getting Started

### 1. **Database Setup**
```bash
# Run the seed script to populate default account mappings
npm run seed:account-mappings
```

### 2. **API Testing**
```bash
# Test the P&L endpoints
curl "http://localhost:5000/api/pnl/summary?period=monthly"
```

### 3. **Frontend Integration**
```typescript
// Example: Fetching P&L data
const fetchPnLData = async () => {
  const [summary, table, charts, analysis] = await Promise.all([
    api.get('/pnl/summary?period=monthly'),
    api.get('/pnl/table?period=monthly'),
    api.get('/pnl/charts?period=monthly'),
    api.get('/pnl/analysis?period=monthly')
  ]);
  
  setSummaryData(summary.data);
  setTableData(table.data);
  setChartsData(charts.data);
  setAnalysisData(analysis.data);
};
```

## 🔧 Configuration

### Adding New Account Mappings

1. **Create the mapping**:
```typescript
const newMapping = new AccountMapping({
  module: 'new_module',
  accountCode: 'NEW-001',
  accountName: 'New Account',
  pnlCategory: 'operating_expenses',
  operatingExpenseSubcategory: 'other_operating',
  isAmortizable: false,
  allocationMethod: 'direct',
  isActive: true
});
```

2. **Update the controller** to include the new module's data in P&L calculations

### Customizing Amortization Rules

```typescript
// Example: Custom amortization for software licenses
{
  module: 'admin',
  accountCode: 'ADMIN-SOFTWARE',
  accountName: 'Software Licenses',
  pnlCategory: 'operating_expenses',
  operatingExpenseSubcategory: 'admin_expenses',
  isAmortizable: true,
  amortizationPeriod: 24, // 2 years
  allocationMethod: 'time_based'
}
```

## 📈 Business Intelligence Features

### Automatic Insights
- **Cost Center Analysis**: Identifies highest-cost areas
- **Margin Monitoring**: Alerts when margins fall below thresholds
- **Trend Analysis**: Tracks performance over time
- **Anomaly Detection**: Flags unusual financial patterns

### Strategic Recommendations
- Cost optimization opportunities
- Revenue enhancement suggestions
- Risk mitigation strategies
- Performance improvement areas

## 🔒 Security & Compliance

### Authentication
- All P&L endpoints require valid JWT authentication
- User role-based access control
- Audit trail for all data access

### Data Integrity
- Automatic validation of financial calculations
- Reconciliation checks between modules
- Error handling and logging

### IFRS Compliance
- Standard-compliant categorization
- Proper revenue recognition
- Accurate expense allocation
- Transparent financial reporting

## 🚨 Troubleshooting

### Common Issues

1. **No Data Displayed**
   - Check if account mappings are properly configured
   - Verify source modules have data for the selected period
   - Ensure authentication tokens are valid

2. **Amortization Not Working**
   - Verify `isAmortizable` is set to `true`
   - Check `amortizationPeriod` is properly set
   - Ensure start/end dates are valid

3. **Module Data Missing**
   - Check if the module is included in the P&L controller
   - Verify data exists in the source module
   - Check for any filtering issues

### Debug Mode

Enable debug logging in the P&L controller:
```typescript
console.log('P&L Calculation Debug:', {
  filters,
  accountMappings: accountMappings.length,
  dataSources: ['revenue', 'expenses', 'amortization']
});
```

## 🔮 Future Enhancements

### Planned Features
- **Budget vs Actual Comparison**: Track performance against budgets
- **Multi-Currency Support**: Handle multiple currencies
- **Advanced Analytics**: Machine learning insights
- **Real-time Updates**: Live financial data
- **Custom Dashboards**: User-configurable views
- **Regulatory Reporting**: Additional compliance frameworks

### Integration Opportunities
- **ERP Systems**: SAP, Oracle, Microsoft Dynamics
- **Accounting Software**: QuickBooks, Xero, Sage
- **Business Intelligence**: Power BI, Tableau
- **Financial Planning**: Adaptive Insights, Anaplan

## 📚 Additional Resources

- [IAS 1 - Presentation of Financial Statements](https://www.ifrs.org/issued-standards/list-of-standards/ias-1-presentation-of-financial-statements/)
- [IFRS Foundation](https://www.ifrs.org/)
- [Financial Reporting Standards](https://www.ifrs.org/issued-standards/)

## 🤝 Support

For technical support or questions about the P&L system:
- Check the system logs for error messages
- Review the account mapping configuration
- Verify data integrity in source modules
- Contact the development team for complex issues

---

**Note**: This system is designed to be a comprehensive financial reporting solution that automatically consolidates data from all business modules while maintaining IFRS compliance. Regular updates and maintenance ensure continued accuracy and compliance with evolving financial reporting standards. 