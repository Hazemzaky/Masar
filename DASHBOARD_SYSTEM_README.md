# Executive Dashboard System

## Overview
The Executive Dashboard System provides a unified view of all business modules, aggregating KPIs and metrics from HR, Assets, Operations, Maintenance, Procurement, Sales, Admin, and HSE into one comprehensive interface. This eliminates the need for managers to navigate between different modules to get a complete business overview.

## Features

### 1. Financial Section
- **P&L Snapshot**: Revenue, Gross Profit, Net Profit, and Margins
- **Balance Sheet Snapshot**: Cash, Accounts Receivable, Accounts Payable, Working Capital
- **Cash Flow Highlights**: Opening Balance, Inflows, Outflows, Closing Balance

### 2. Module KPIs

#### HR Module
- **Headcount**: Active employee count
- **Payroll**: Monthly payroll expenses
- **Attrition**: Employee turnover rate and count

#### Assets Module
- **Book Value**: Total asset value
- **Utilization**: Average asset utilization rate
- **Depreciation**: Monthly depreciation expenses
- **Renewals**: Assets requiring renewal

#### Operations Module
- **Deliveries**: Completed business trips/deliveries
- **On-Time Percentage**: Delivery performance metrics
- **Delivery Cost**: Fuel and operational costs
- **Fleet Utilization**: Vehicle fleet efficiency

#### Maintenance Module
- **Cost**: Monthly maintenance expenses
- **Preventive vs Corrective**: Maintenance strategy breakdown
- **Downtime**: Total equipment downtime hours

#### Procurement Module
- **Total Spend**: Monthly procurement expenses
- **Top Vendors**: Highest spending vendor analysis
- **Open POs**: Pending purchase orders
- **Cycle Time**: Average procurement processing time

#### Sales Module
- **Total Sales**: Monthly revenue generation
- **Pipeline**: Sales opportunities in progress
- **Top Customers**: Highest revenue customers
- **Sales Margin**: Profitability metrics

#### Admin Module
- **Costs**: Administrative expenses
- **Overhead Percentage**: Administrative cost ratio
- **Pending Approvals**: Items awaiting approval

#### HSE Module
- **Incidents**: Monthly safety incidents
- **Training Compliance**: Employee training completion rates
- **Open Actions**: Pending safety actions

### 3. Action Center
- **Overdue Invoices**: Payment collection alerts
- **Unapproved POs**: Purchase order approval status
- **Pending Reconciliations**: Financial reconciliation items
- **Expiring Contracts**: Contract renewal notifications

### 4. Frontend Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Charts**: Line charts for trends, pie charts for distribution
- **Clickable Cards**: Each KPI card links to detailed module views
- **Export Functionality**: PDF snapshot export capability
- **Real-time Updates**: Refresh button for latest data

## API Endpoints

### Main Dashboard
```
GET /api/dashboard/dashboard-summary
```
Returns comprehensive KPI data from all modules.

### Legacy Endpoints (Maintained for Backward Compatibility)
```
GET /api/dashboard/summary          - Basic expense summary
GET /api/dashboard/kpis            - Financial KPIs
GET /api/dashboard/income-statement - Income statement data
GET /api/dashboard/balance-sheet   - Balance sheet data
GET /api/dashboard/cash-flow-statement - Cash flow data
```

## Data Sources

The dashboard aggregates data from the following models:

### Financial Models
- `Expense` - Revenue and expense data
- `Invoice` - Sales and billing information
- `GeneralLedgerEntry` - GL transactions
- `ChartOfAccounts` - Account structure

### HR Models
- `Employee` - Staff information and headcount
- `Payroll` - Compensation data
- `Training` - Training completion rates

### Asset Models
- `Asset` - Asset values and utilization
- `Maintenance` - Maintenance costs and downtime
- `Depreciation` - Asset depreciation calculations

### Operations Models
- `BusinessTrip` - Delivery and trip data
- `FuelLog` - Operational costs
- `VehicleRegistration` - Fleet information

### Procurement Models
- `PurchaseRequest` - Procurement requests
- `PurchaseOrder` - Purchase orders
- `ProcurementInvoice` - Vendor invoices
- `Vendor` - Supplier information

### Sales Models
- `Client` - Customer information
- `Contract` - Sales contracts

### HSE Models
- `Incident` - Safety incidents
- `SafetyInspection` - Inspection data
- `Environmental` - Environmental compliance

## Database Queries

### Financial KPIs
```javascript
// Revenue aggregation
const revenue = await Expense.aggregate([
  { $match: { category: 'income', date: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);

// Expense aggregation
const expenses = await Expense.aggregate([
  { $match: { category: 'expenses', date: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);
```

### HR KPIs
```javascript
// Active headcount
const headcount = await Employee.countDocuments({ status: 'active' });

// Monthly payroll
const payroll = await Payroll.aggregate([
  { $match: { date: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
]);
```

### Asset KPIs
```javascript
// Total book value
const bookValue = await Asset.aggregate([
  { $group: { _id: null, total: { $sum: '$bookValue' } } }
]);

// Average utilization
const utilization = await Asset.aggregate([
  { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
]);
```

## Performance Optimization

### Caching Strategy
- Dashboard data is cached for 5 minutes to improve load times
- Real-time data can be refreshed using the refresh button
- Historical data is aggregated efficiently using MongoDB aggregation pipelines

### Database Indexes
Ensure the following indexes exist for optimal performance:

```javascript
// Expense model
db.expenses.createIndex({ "category": 1, "date": 1 });
db.expenses.createIndex({ "date": 1 });

// Employee model
db.employees.createIndex({ "status": 1 });

// Asset model
db.assets.createIndex({ "type": 1 });

// BusinessTrip model
db.businesstrips.createIndex({ "status": 1, "date": 1 });
```

## Role-Based Access

### CFO View
- Financial metrics prominently displayed
- Detailed P&L and balance sheet information
- Cash flow analysis and projections

### Operations Manager View
- Operations KPIs highlighted
- Fleet utilization and delivery performance
- Maintenance cost analysis

### HR Manager View
- Employee metrics and attrition rates
- Training compliance and safety statistics
- Payroll and benefits overview

### General Manager View
- All module KPIs with equal prominence
- Action center alerts
- Overall business performance summary

## Implementation Notes

### Frontend Components
- `DashboardPage.tsx` - Main dashboard component
- Responsive grid layout using Material-UI Grid
- Interactive charts using Recharts library
- Color-coded modules for easy identification

### Backend Controllers
- `dashboardController.ts` - Main dashboard logic
- Aggregates data from multiple models
- Handles date range filtering
- Provides error handling and validation

### Data Flow
1. Frontend requests dashboard data
2. Backend queries multiple models in parallel
3. Data is aggregated and formatted
4. Response includes all module KPIs
5. Frontend renders cards, charts, and alerts

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Custom Dashboards**: User-configurable KPI layouts
- **Drill-down Capability**: Click KPI cards to see detailed breakdowns
- **Export Options**: Excel, CSV, and custom report formats
- **Mobile App**: Native mobile dashboard application

### Performance Improvements
- **Redis Caching**: Implement Redis for faster data retrieval
- **Data Warehouse**: Move historical data to dedicated analytics database
- **Background Jobs**: Pre-calculate KPIs using scheduled tasks
- **CDN Integration**: Serve static dashboard assets from CDN

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
- Check authentication token validity
- Verify database connectivity
- Review server logs for error messages

#### Slow Performance
- Ensure proper database indexes exist
- Check for large data sets in aggregation queries
- Monitor server resource usage

#### Missing Data
- Verify model relationships are correct
- Check data integrity in source models
- Review aggregation pipeline logic

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=dashboard:*
```

## Support and Maintenance

### Regular Maintenance
- **Daily**: Monitor dashboard performance and error rates
- **Weekly**: Review KPI accuracy and data quality
- **Monthly**: Update chart configurations and thresholds
- **Quarterly**: Review and optimize database queries

### Monitoring
- **Performance Metrics**: Dashboard load times and response rates
- **Error Tracking**: Failed API calls and data retrieval issues
- **Usage Analytics**: Most viewed KPIs and user engagement
- **Data Quality**: Accuracy of calculated metrics and aggregations

## Conclusion

The Executive Dashboard System provides a comprehensive, real-time view of business performance across all modules. It enables managers to make informed decisions quickly without navigating between different systems. The modular architecture ensures easy maintenance and future enhancements while maintaining backward compatibility with existing systems. 