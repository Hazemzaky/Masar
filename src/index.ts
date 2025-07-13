import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import expenseRoutes from './routes/expenseRoutes';
import assetRoutes from './routes/assetRoutes';
import assetCategoryRoutes from './routes/assetCategoryRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import fuelLogRoutes from './routes/fuelLogRoutes';
import driverHourRoutes from './routes/driverHourRoutes';
import leaveRoutes from './routes/leaveRoutes';
import payrollRoutes from './routes/payrollRoutes';
import projectRoutes from './routes/projectRoutes';
import procurementRoutes from './routes/procurementRoutes';
import budgetRoutes from './routes/budgetRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import accountRoutes from './routes/accountRoutes';
import journalEntryRoutes from './routes/journalEntryRoutes';
import periodRoutes from './routes/periodRoutes';
import depreciationRoutes from './routes/depreciationRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import hseRoutes from './routes/hseRoutes';
import travelRequestRoutes from './routes/travelRequestRoutes';
import travelAuthorizationRoutes from './routes/travelAuthorizationRoutes';
import travelRoutes from './routes/travelRoutes';
import reimbursementRoutes from './routes/reimbursementRoutes';
import adminRoutes from './routes/adminRoutes';

// Import payroll update function
import { updateMonthlyPayroll } from './controllers/payrollController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/expenses', expenseRoutes);
app.use('/assets', assetRoutes);
app.use('/asset-categories', assetCategoryRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/fuel-logs', fuelLogRoutes);
app.use('/driver-hours', driverHourRoutes);
app.use('/leaves', leaveRoutes);
app.use('/payroll', payrollRoutes);
app.use('/projects', projectRoutes);
app.use('/procurement', procurementRoutes);
app.use('/budgets', budgetRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/accounts', accountRoutes);
app.use('/journal-entries', journalEntryRoutes);
app.use('/periods', periodRoutes);
app.use('/depreciation', depreciationRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/hse', hseRoutes);
app.use('/travel-requests', travelRequestRoutes);
app.use('/travel-authorizations', travelAuthorizationRoutes);
app.use('/travel', travelRoutes);
app.use('/reimbursements', reimbursementRoutes);
app.use('/admin', adminRoutes);

// Scheduled task for monthly payroll update (runs on 24th of each month)
const scheduleMonthlyPayrollUpdate = () => {
  const now = new Date();
  const currentDay = now.getDate();
  
  // Check if it's the 24th of the month
  if (currentDay === 24) {
    console.log('Running scheduled monthly payroll update...');
    
    // Create a mock request and response for the update function
    const mockReq = {
      body: {}
    } as any;
    
    const mockRes = {
      json: (data: any) => {
        console.log('Monthly payroll update result:', data);
      },
      status: (code: number) => ({
        json: (data: any) => {
          console.error('Monthly payroll update error:', data);
        }
      })
    } as any;
    
    updateMonthlyPayroll(mockReq, mockRes);
  }
};

// Run the check every hour
setInterval(scheduleMonthlyPayrollUpdate, 60 * 60 * 1000);

// Also run it once when the server starts to check if it's the 24th
scheduleMonthlyPayrollUpdate();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
}); 