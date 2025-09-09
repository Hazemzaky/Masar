import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import budgetRoutes from './routes/budgetRoutes';
import accountRoutes from './routes/accountRoutes';
import journalEntryRoutes from './routes/journalEntryRoutes';
import periodRoutes from './routes/periodRoutes';
import projectRoutes from './routes/projectRoutes';
import fuelLogRoutes from './routes/fuelLogRoutes';
import driverHourRoutes from './routes/driverHourRoutes';
import assetRoutes from './routes/assetRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import depreciationRoutes from './routes/depreciationRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import employeeRoutes from './routes/employeeRoutes';
import payrollRoutes from './routes/payrollRoutes';
import reimbursementRoutes from './routes/reimbursementRoutes';
import leaveRoutes from './routes/leaveRoutes';
import hseRoutes from './routes/hseRoutes';
import adminRoutes from './routes/adminRoutes';
import procurementRoutes from './routes/procurementRoutes';
import travelRoutes from './routes/travelRoutes';
import travelRequestRoutes from './routes/travelRequestRoutes';
import travelAuthorizationRoutes from './routes/travelAuthorizationRoutes';
import assetCategoryRoutes from './routes/assetCategoryRoutes';
import foodAllowanceRoutes from './routes/foodAllowanceRoutes';
import clientRoutes from './routes/clientRoutes';
import trackerRoutes from './routes/trackerRoutes';
import assetPassRoutes from './routes/assetPassRoutes';
import employeePassRoutes from './routes/employeePassRoutes';
import overtimeRoutes from './routes/overtimeRoutes';
import tripAllowanceRoutes from './routes/tripAllowanceRoutes';
import quotationRoutes from './routes/quotationRoutes';
import waterLogRoutes from './routes/waterLogRoutes';
import stationTrackRoutes from './routes/stationTrackRoutes';
import budgetAssumptionsRoutes from './routes/budgetAssumptions';
import budgetRevenueRoutes from './routes/budgetRevenue';
import budgetOpexRoutes from './routes/budgetOpex';
import budgetStaffingRoutes from './routes/budgetStaffing';
import budgetLoanRoutes from './routes/budgetLoan';
import budgetCapexRoutes from './routes/budgetCapex';
import budgetVarianceRoutes from './routes/budgetVariance';
import budgetContractRoutes from './routes/budgetContract';
import budgetManpowerRoutes from './routes/budgetManpower';
import budgetGARoutes from './routes/budgetGA';
import budgetITOpexRoutes from './routes/budgetITOpex';
import procurementInvoiceRoutes from './routes/procurementInvoiceRoutes';
import vendorRoutes from './routes/vendorRoutes';
import purchaseRequestRoutes from './routes/purchaseRequestRoutes';
import goodsReceiptRoutes from './routes/goodsReceiptRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import businessTripRoutes from './routes/businessTripRoutes';
import pnlRoutes from './routes/pnlRoutes';
import reconciliationRoutes from './routes/reconciliationRoutes';
import contractRoutes from './routes/contractRoutes';
import glRoutes from './routes/glRoutes';
import chartOfAccountsRoutes from './routes/chartOfAccountsRoutes';
import accidentRoutes from './routes/accidentRoutes';
import nearMissRoutes from './routes/nearMissRoutes';
import trainingRoutes from './routes/trainingRoutes';
import attendanceRoutes from './routes/attendance';
import documentRoutes from './routes/documentRoutes';
import pendingRequestsRoutes from './routes/pendingRequestsRoutes';
import './models/Contract';
import './models/ProcurementInvoice';
import './models/Vendor';
import './models/PurchaseRequest';
import './models/GoodsReceipt';
import './models/PurchaseOrder';
import './models/Accident';
import './models/NearMiss';
import './models/SafetyInspection';
import './models/Incident';
import './models/RiskAssessment';
import './models/PPE';
import './models/Training';
import './models/Environmental';
import './models/EmergencyContact';
import './models/EmergencyPlan';
import './models/HSEDocumentFolder';
import './models/HSEDocument';
// Import P&L related models
import './models/PnLStatement';
import './models/Expense';
import './models/Invoice';
import './models/AccountMapping';
import './models/ChartOfAccounts';
import './models/GeneralLedgerEntry';
import './models/Attendance';
import './models/Document';
import './models/DocumentVersion';
import './models/DocumentAudit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/financedb';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/uploads/quotations', express.static('uploads/quotations'));
app.use('/uploads/contracts', express.static('uploads/contracts'));

app.get('/', (req: Request, res: Response) => {
  res.send('Financial Management API is running');
});

// Debug route to test if the server is working
app.get('/debug', (req: Request, res: Response) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth',
      '/api/expenses',
      '/api/invoices',
      '/api/dashboard',
      '/api/budgets',
      '/api/accounts',
      '/api/projects',
      '/api/employees',
      '/api/assets',
      '/api/inventory',
      '/api/payroll',
      '/api/leave',
      '/api/reimbursements',
      '/api/pnl',
      '/api/gl',
      '/api/chart-of-accounts',
      '/api/attendance'
    ]
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/driver-hours', driverHourRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/depreciation', depreciationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/hse', hseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/travel-requests', travelRequestRoutes);
app.use('/api/travel-authorizations', travelAuthorizationRoutes);
app.use('/api/asset-categories', assetCategoryRoutes);
app.use('/api/food-allowance', foodAllowanceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/asset-passes', assetPassRoutes);
app.use('/api/employee-passes', employeePassRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/trip-allowance', tripAllowanceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/water-logs', waterLogRoutes);
app.use('/api/station-tracks', stationTrackRoutes);
app.use('/api/budget/assumptions', budgetAssumptionsRoutes);
app.use('/api/budget/revenue', budgetRevenueRoutes);
app.use('/api/budget/opex', budgetOpexRoutes);
app.use('/api/budget/staffing', budgetStaffingRoutes);
app.use('/api/budget/loans', budgetLoanRoutes);
app.use('/api/budget/capex', budgetCapexRoutes);
app.use('/api/budget/variance', budgetVarianceRoutes);
app.use('/api/budget/contracts', budgetContractRoutes);
app.use('/api/budget/manpower', budgetManpowerRoutes);
app.use('/api/budget/ga', budgetGARoutes);
app.use('/api/budget/it-opex', budgetITOpexRoutes);
app.use('/api/procurement-invoices', procurementInvoiceRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/goods-receipts', goodsReceiptRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/business-trips', businessTripRoutes);
app.use('/api/pnl', pnlRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/gl', glRoutes);
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
app.use('/api/hse/accidents', accidentRoutes);
app.use('/api/hse/near-misses', nearMissRoutes);
app.use('/api/hse/training', trainingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/pending-requests', pendingRequestsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 