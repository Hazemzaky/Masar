import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';
import AccountMapping from '../models/AccountMapping';
import Employee from '../models/Employee';
import Asset from '../models/Asset';
import FuelLog from '../models/FuelLog';
import Maintenance from '../models/Maintenance';
import ProcurementInvoice from '../models/ProcurementInvoice';
import BusinessTrip from '../models/BusinessTrip';
import Training from '../models/Training';
import HSE from '../models/Environmental';
import Overtime from '../models/Overtime';
import TripAllowance from '../models/TripAllowance';
import FoodAllowance from '../models/FoodAllowance';
import AdminLegalCase from '../models/LegalCase';
import AdminGovCorrespondence from '../models/GovernmentCorrespondence';
import AdminCompanyFacility from '../models/CompanyFacility';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';
import Project from '../models/Project';
import Client from '../models/Client';
import Payroll from '../models/Payroll';
import PurchaseOrder from '../models/PurchaseOrder';
import PurchaseRequest from '../models/PurchaseRequest';
import Incident from '../models/Incident';
import ManualPnLEntry from '../models/ManualPnLEntry';

// In-memory store for Cost Analysis Dashboard data
interface DashboardData {
  module: string;
  costs: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    halfYearly: number;
    yearly: number;
  };
  recordCount: number;
  lastUpdated: Date;
}

// Global store for dashboard data
const dashboardDataStore = new Map<string, DashboardData>();

// Function to store dashboard data from Cost Analysis Dashboards
export const storeDashboardData = (module: string, data: any) => {
  console.log(`Storing dashboard data for ${module}:`, data);
  dashboardDataStore.set(module, {
    module,
    costs: data.costs || {
      daily: 0,
      weekly: 0,
      monthly: 0,
      quarterly: 0,
      halfYearly: 0,
      yearly: 0
    },
    recordCount: data.recordCount || 0,
    lastUpdated: new Date()
  });
};

// Function to get dashboard data for a specific module
const getDashboardData = (module: string): DashboardData | null => {
  return dashboardDataStore.get(module) || null;
};

// Function to get all dashboard data
const getAllDashboardData = (): Map<string, DashboardData> => {
  return dashboardDataStore;
};

// IFRS P&L Structure as per IAS 1 - Updated for vertical table format
const PNL_STRUCTURE = {
  REVENUE: 'revenue',
  EXPENSES: 'expenses',
  INCOME_EXPENSES_OTHER: 'income_expenses_other',
  EBITIDA: 'ebitida'
};

// New P&L structure with detailed categories
const VERTICAL_PNL_STRUCTURE = {
  REVENUE: {
    id: 'revenue',
    category: 'Revenue',
    items: [
      { id: 'operating_revenues', description: 'Operating Revenues', type: 'revenue', module: 'sales' },
      { id: 'net_operating_revenue', description: 'Net Operating Revenue', type: 'summary', module: 'sales' },
      { id: 'rental_equipment_revenue', description: 'Revenue from Rental Equipment', type: 'revenue', module: 'assets' },
      { id: 'ds_revenue', description: 'Revenue from DS', type: 'revenue', module: 'sales' },
      { id: 'sub_companies_revenue', description: 'Revenue from Sub Companies', type: 'revenue', module: 'sales' },
      { id: 'other_revenue', description: 'Other Revenue', type: 'revenue', module: 'sales' },
      { id: 'provision_end_service', description: 'Provision for End of Service Indemnity No Longer Required', type: 'revenue', module: 'hr' },
      { id: 'provision_impairment', description: 'Provision for Impairment Loss No Longer Required', type: 'revenue', module: 'assets' },
      { id: 'total_revenue', description: 'Total Revenue', type: 'summary', module: 'sales' }
    ]
  },
  EXPENSES: {
    id: 'expenses',
    category: 'Expenses',
    items: [
      { id: 'operation_cost', description: 'Operation Cost', type: 'expense', module: 'operations' },
      { id: 'rental_equipment_cost', description: 'Cost of Rental Equipment', type: 'expense', module: 'assets' },
      { id: 'ds_cost', description: 'Cost of DS', type: 'expense', module: 'operations' },
      { id: 'general_admin_expenses', description: 'General and Administrative Expenses', type: 'expense', module: 'admin' },
      { id: 'staff_costs', description: 'Staff Costs', type: 'expense', module: 'hr' },
      { id: 'business_trip_costs', description: 'Business Trip Expenses', type: 'expense', module: 'hr' },
      { id: 'overtime_costs', description: 'Overtime Expenses', type: 'expense', module: 'hr' },
      { id: 'trip_allowance_costs', description: 'Trip Allowance Expenses', type: 'expense', module: 'hr' },
      { id: 'food_allowance_costs', description: 'Food Allowance Expenses', type: 'expense', module: 'hr' },
      { id: 'hse_training_costs', description: 'HSE & Training Expenses', type: 'expense', module: 'hse' },
      { id: 'inventory_costs', description: 'Inventory & Material Costs', type: 'expense', module: 'operations' },
      { id: 'legal_costs', description: 'Legal & Compliance Costs', type: 'expense', module: 'admin' },
      { id: 'facility_costs', description: 'Facility & Infrastructure Costs', type: 'expense', module: 'admin' },
      { id: 'service_agreement_cost', description: 'Cost of Service Agreement', type: 'expense', module: 'operations' },
      { id: 'total_expenses', description: 'Total Expenses', type: 'summary', module: 'operations' }
    ]
  },
  INCOME_EXPENSES_OTHER: {
    id: 'income_expenses_other',
    category: 'Income, Expenses and Other Items',
    items: [
      { id: 'gain_selling_products', description: 'Gain from Selling Other Products (Manual Entry)', type: 'revenue', module: 'sales' }
    ]
  },
  EBITDA: {
    id: 'ebitda',
    category: 'EBITDA',
    items: [
      { id: 'finance_costs', description: 'Finance Costs (Manual Entry)', type: 'expense', module: 'finance' },
      { id: 'depreciation', description: 'Depreciation', type: 'expense', module: 'assets' }
    ]
  }
};

// Period calculation functions
function getPeriodDates(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // Calculate based on period
    const currentYear = now.getFullYear();
    
    switch (period) {
      case 'q1':
        // Q1 (Apr-Jun) - Current year
        start = new Date(currentYear, 3, 1); // April 1st
        end = new Date(currentYear, 5, 30); // June 30th
        break;
      case 'q2':
        // Q2 (Jul-Sep) - Current year
        start = new Date(currentYear, 6, 1); // July 1st
        end = new Date(currentYear, 8, 30); // September 30th
        break;
      case 'q3':
        // Q3 (Oct-Dec) - Current year
        start = new Date(currentYear, 9, 1); // October 1st
        end = new Date(currentYear, 11, 31); // December 31st
        break;
      case 'q4':
        // Q4 (Jan-Mar) - Next year
        start = new Date(currentYear + 1, 0, 1); // January 1st of next year
        end = new Date(currentYear + 1, 2, 31); // March 31st of next year
        break;
      case 'h1':
        // H1 (Apr-Sep) - Current year
        start = new Date(currentYear, 3, 1); // April 1st
        end = new Date(currentYear, 8, 30); // September 30th
        break;
      case 'h2':
        // H2 (Oct-Mar) - Current year to next year
        start = new Date(currentYear, 9, 1); // October 1st
        end = new Date(currentYear + 1, 2, 31); // March 31st of next year
        break;
      case 'fiscal_year':
      default:
        // Fiscal Year (Apr 1 - Mar 31) - Current year to next year
        start = new Date(currentYear, 3, 1); // April 1st of current year
        end = new Date(currentYear + 1, 2, 31); // March 31st of next year
        break;
    }
  }

  return { start, end };
}

// Amortization calculation utility
function calculateAmortizedAmount(totalAmount: number, startDate: Date, endDate: Date, periodStart: Date, periodEnd: Date, amortizationPeriod: number): number {
  if (!startDate || !endDate || !amortizationPeriod) return totalAmount;

  const assetStart = new Date(startDate);
  const assetEnd = new Date(endDate);
  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);

  // Calculate overlap between asset period and reporting period
  const overlapStart = new Date(Math.max(assetStart.getTime(), periodStartDate.getTime()));
  const overlapEnd = new Date(Math.min(assetEnd.getTime(), periodEndDate.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  // Calculate months of overlap
  const monthsOverlap = (overlapEnd.getFullYear() - overlapStart.getFullYear()) * 12 + 
                       (overlapEnd.getMonth() - overlapStart.getMonth()) + 1;

  // Calculate monthly amortization amount
  const monthlyAmount = totalAmount / amortizationPeriod;

  // Return amortized amount for this period
  return monthlyAmount * monthsOverlap;
}

// Get filters from request
function getFilters(req: Request) {
  const { 
    period = 'yearly', 
    start, 
    end, 
    department, 
    site, 
    branch, 
    operationType, 
    vsBudget, 
    vsLastYear 
  } = req.query;

  const { start: startDate, end: endDate } = getPeriodDates(period as string, start as string, end as string);

  return {
    period: period as string,
    startDate,
    endDate,
    department: department as string,
    site: site as string,
    branch: branch as string,
    operationType: operationType as string,
    vsBudget: vsBudget === 'true',
    vsLastYear: vsLastYear === 'true'
  };
}

// Calculate period breakdown for amortization
function calculatePeriodBreakdown(startDate: Date, endDate: Date, period: string) {
  const periods: Array<{ start: Date; end: Date; label: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  switch (period) {
    case 'monthly':
      let current = new Date(start);
      while (current <= end) {
        const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        periods.push({
          start: new Date(current),
          end: periodEnd,
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      break;
    case 'quarterly':
      let quarterStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
      while (quarterStart <= end) {
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        periods.push({
          start: new Date(quarterStart),
          end: quarterEnd,
          label: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`
        });
        quarterStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1);
      }
      break;
    case 'half_yearly':
      let halfStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 6) * 6, 1);
      while (halfStart <= end) {
        const halfEnd = new Date(halfStart.getFullYear(), halfStart.getMonth() + 6, 0);
        periods.push({
          start: new Date(halfStart),
          end: halfEnd,
          label: `H${Math.floor(halfStart.getMonth() / 6) + 1} ${halfStart.getFullYear()}`
        });
        halfStart = new Date(halfStart.getFullYear(), halfStart.getMonth() + 6, 1);
      }
      break;
    default:
      periods.push({
        start: new Date(start),
        end: new Date(end),
        label: `${start.getFullYear()}`
      });
  }

  return periods;
}

// Manual PnL Entry Model Interface
interface ManualPnLEntry {
  id: string;
  category: string;
  itemId: string;
  description: string;
  amount: number;
  period: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Note: Manual entries are now handled through the database
// All financial data comes from actual business transactions

// Initialize default manual entries in the database
const initializeDefaultManualEntries = async () => {
  try {
    console.log('=== INITIALIZING DEFAULT MANUAL ENTRIES ===');
    console.log('Checking if ManualPnLEntry model is available...');
    
    // Check if model is properly loaded
    if (!ManualPnLEntry) {
      throw new Error('ManualPnLEntry model is not properly loaded');
    }
    
    // Check if entries already exist
    const existingCount = await ManualPnLEntry.countDocuments({ isActive: true });
    console.log(`Existing manual entries count: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('Manual entries already exist, skipping initialization');
      return;
    }
    
    console.log('Creating default manual entries...');
    
    const defaultEntries = [
      {
        itemId: 'rebate',
        description: 'Rebate',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Rebates received',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'sub_companies_revenue',
        description: 'Sub Companies Revenue',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Revenue from subsidiary companies',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'other_revenue',
        description: 'Other Revenue',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Other miscellaneous revenue',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'provision_end_service',
        description: 'Provision End Service',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Reversal of end of service provisions',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'provision_impairment',
        description: 'Provision Impairment',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Reversal of impairment provisions',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'ds_revenue',
        description: 'DS Revenue',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Direct sales revenue',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'rental_equipment_cost',
        description: 'Rental Equipment Cost',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Costs associated with rental equipment',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'ds_cost',
        description: 'DS Cost',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Direct sales costs',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'general_admin_expenses',
        description: 'General Admin Expenses',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'General administrative expenses',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'provision_credit_loss',
        description: 'Provision Credit Loss',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Provision for credit losses',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'service_agreement_cost',
        description: 'Service Agreement Cost',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Costs for service agreements',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'gain_selling_products',
        description: 'Gain Selling Products',
        amount: 0,
        category: 'other_income',
        type: 'revenue',
        notes: 'Gains from selling products',
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        itemId: 'finance_costs',
        description: 'Finance Costs',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Financial costs and interest',
        createdBy: 'system',
        updatedBy: 'system'
      }
    ];

    // Insert all default entries
    await ManualPnLEntry.insertMany(defaultEntries);
    console.log(`Successfully initialized ${defaultEntries.length} default manual entries`);
    console.log('=== MANUAL ENTRIES INITIALIZATION COMPLETE ===');
  } catch (error) {
    console.error('=== ERROR INITIALIZING MANUAL ENTRIES ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== END INITIALIZATION ERROR ===');
    throw error;
  }
};

// Endpoint to update manual PnL entries - NOW WITH DATABASE PERSISTENCE
export const updateManualPnLEntry = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { amount, notes } = req.body;
    const updatedBy = (req as any).user?.id || 'system'; // Get user ID from auth middleware

    console.log(`Manual entry update request:`, { itemId, amount, notes, updatedBy });

    // Validate input
    if (!itemId) {
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }

    if (amount === undefined || amount === null) {
      res.status(400).json({ error: 'Amount is required' });
      return;
    }

    // Validate amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      res.status(400).json({ error: 'Amount must be a valid number' });
      return;
    }

    // Find and update the manual entry in the database
    const manualEntry = await ManualPnLEntry.findOne({ itemId, isActive: true });
    
    if (!manualEntry) {
      res.status(404).json({ error: 'Manual entry not found' });
      return;
    }

    // Update the entry
    manualEntry.amount = numericAmount;
    if (notes !== undefined) {
      manualEntry.notes = notes;
    }
    manualEntry.updatedBy = updatedBy;
    
    await manualEntry.save();

    console.log(`Manual entry updated successfully in database: ${itemId}, amount: ${numericAmount}, notes: ${notes}`);

    res.json({ 
      success: true,
      message: 'Manual entry updated successfully',
      itemId,
      amount: numericAmount,
      notes: notes || manualEntry.notes,
      updatedAt: manualEntry.updatedAt
    });
  } catch (error: any) {
    console.error('Error updating manual PnL entry:', error);
    res.status(500).json({ 
      error: 'Failed to update manual entry', 
      details: error?.message || 'Unknown error' 
    });
  }
};

// Create new manual entry
export const createManualPnLEntry = async (req: Request, res: Response) => {
  try {
    const { itemId, description, amount, category, type, notes, period, startDate, endDate } = req.body;

    console.log(`Creating new manual entry:`, { itemId, description, amount, category, type });

    // Validate input
    if (!itemId || !description || amount === undefined) {
      res.status(400).json({ error: 'Item ID, description, and amount are required' });
      return;
    }

    // Check if entry already exists
    const existingEntry = await ManualPnLEntry.findOne({ itemId });
    if (existingEntry) {
      res.status(409).json({ error: 'Manual entry with this Item ID already exists' });
      return;
    }

    // Create new entry
    const newEntry = new ManualPnLEntry({
      itemId,
      description,
      amount: Number(amount),
      category: category || 'revenue',
      type: type || 'revenue',
      notes: notes || '',
      period: period || 'monthly',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: (req as any).user?.id || 'system',
      updatedBy: (req as any).user?.id || 'system',
      isActive: true
    });

    await newEntry.save();

    console.log(`Manual entry created successfully: ${itemId}`);

    res.status(201).json({
      success: true,
      message: 'Manual entry created successfully',
      data: newEntry
    });
  } catch (error: any) {
    console.error('Error creating manual entry:', error);
    res.status(500).json({ 
      error: 'Failed to create manual entry', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Delete manual entry
export const deleteManualPnLEntry = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    console.log(`Deleting manual entry: ${itemId}`);

    // Find and delete the manual entry
    const manualEntry = await ManualPnLEntry.findOne({ itemId });
    
    if (!manualEntry) {
      res.status(404).json({ error: 'Manual entry not found' });
      return;
    }

    // Soft delete by setting isActive to false
    manualEntry.isActive = false;
    manualEntry.updatedBy = (req as any).user?.id || 'system';
    manualEntry.updatedAt = new Date();

    await manualEntry.save();

    console.log(`Manual entry deleted successfully: ${itemId}`);

    res.json({
      success: true,
      message: 'Manual entry deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting manual entry:', error);
    res.status(500).json({ 
      error: 'Failed to delete manual entry', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Get single manual entry
export const getManualPnLEntry = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    console.log(`Getting manual entry: ${itemId}`);

    const manualEntry = await ManualPnLEntry.findOne({ itemId, isActive: true });
    
    if (!manualEntry) {
      res.status(404).json({ error: 'Manual entry not found' });
      return;
    }

    res.json(manualEntry);
  } catch (error: any) {
    console.error('Error getting manual entry:', error);
    res.status(500).json({ 
      error: 'Failed to get manual entry', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Endpoint to get all manual PnL entries - NOW WITH DATABASE PERSISTENCE
// Fallback manual entries data (in case database fails)
const getFallbackManualEntries = () => {
  return [
    {
      itemId: 'rebate',
      description: 'Rebate',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'Rebates received',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'sub_companies_revenue',
      description: 'Sub Companies Revenue',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'Revenue from subsidiary companies',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'other_revenue',
      description: 'Other Revenue',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'Other miscellaneous revenue',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'provision_end_service',
      description: 'Provision End Service',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'Reversal of end of service provisions',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'provision_impairment',
      description: 'Provision Impairment',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'Reversal of impairment provisions',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'gain_selling_products',
      description: 'Gain Selling Products',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'Gains from selling products',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'provision_credit_loss',
      description: 'Provision Credit Loss',
      amount: 0,
      category: 'expense',
      type: 'expense',
      notes: 'Provision for credit losses',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'rental_equipment_cost',
      description: 'Rental Equipment Cost',
      amount: 0,
      category: 'expense',
      type: 'expense',
      notes: 'Cost of rental equipment',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'service_agreement_cost',
      description: 'Service Agreement Cost',
      amount: 0,
      category: 'expense',
      type: 'expense',
      notes: 'Cost of service agreements',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'ds_revenue',
      description: 'DS Revenue',
      amount: 0,
      category: 'revenue',
      type: 'revenue',
      notes: 'DS revenue',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'ds_cost',
      description: 'DS Cost',
      amount: 0,
      category: 'expense',
      type: 'expense',
      notes: 'DS cost',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'general_admin_expenses',
      description: 'General Admin Expenses',
      amount: 0,
      category: 'expense',
      type: 'expense',
      notes: 'General administrative expenses',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      itemId: 'finance_costs',
      description: 'Finance Costs',
      amount: 0,
      category: 'expense',
      type: 'expense',
      notes: 'Finance and interest costs',
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
  ];
};

export const getManualPnLEntries = async (req: Request, res: Response) => {
  try {
    console.log('=== MANUAL P&L ENTRIES ENDPOINT CALLED ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    
    // Check if ManualPnLEntry model is available
    if (!ManualPnLEntry) {
      console.warn('ManualPnLEntry model not available, returning fallback data');
      const fallbackEntries = getFallbackManualEntries();
      console.log(`Returning ${fallbackEntries.length} fallback manual entries`);
      res.json(fallbackEntries);
      return;
    }
    
    // Fetch manual entries from database
    const manualEntries = await ManualPnLEntry.find({ isActive: true })
      .sort({ itemId: 1 })
      .lean(); // Use lean() for better performance

    console.log(`Found ${manualEntries.length} manual entries in database`);

    // If no entries exist, try to initialize with default entries
    if (manualEntries.length === 0) {
      console.log('No manual entries found, attempting to initialize...');
      try {
        await initializeDefaultManualEntries();
        
        // Fetch again after initialization
        const initializedEntries = await ManualPnLEntry.find({ isActive: true })
          .sort({ itemId: 1 })
          .lean();
        
        console.log(`Initialized and returning ${initializedEntries.length} manual entries`);
        console.log('Sample initialized entry:', initializedEntries[0]);
        res.json(initializedEntries);
        return;
      } catch (initError) {
        console.error('Failed to initialize manual entries, using fallback:', initError);
        const fallbackEntries = getFallbackManualEntries();
        console.log(`Returning ${fallbackEntries.length} fallback manual entries due to initialization failure`);
        res.json(fallbackEntries);
        return;
      }
    }

    console.log('Returning manual entries from database:', manualEntries.length, 'entries');
    console.log('First entry sample:', manualEntries[0]);
    console.log('=== END MANUAL P&L ENTRIES RESPONSE ===');
    res.json(manualEntries);
  } catch (error) {
    console.error('=== ERROR IN MANUAL P&L ENTRIES ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== END ERROR ===');
    
    // Return fallback data instead of error
    console.log('Returning fallback data due to error');
    const fallbackEntries = getFallbackManualEntries();
    res.json(fallbackEntries);
  }
};

// Main P&L Summary endpoint - Updated with ALL module integrations
export const getPnLSummary = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    console.log('P&L Summary - Using integrated data sources:', { period, startDate, endDate });

    // Get dashboard data from Cost Analysis Dashboards
    const allDashboardData = getAllDashboardData();
    console.log('Available dashboard data:', Array.from(allDashboardData.keys()));

    // Get account mappings for categorization
    const accountMappings = await AccountMapping.find({ isActive: true });

    // 1. REVENUE SECTION
    const revenueData = await Promise.all([
      // Operating Revenues - from Invoice module
      Invoice.aggregate([
        {
          $match: {
            invoiceDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['approved', 'sent', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            operatingRevenues: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Rental Equipment Revenue - from Asset module
      Asset.aggregate([
        {
          $match: {
            isRental: true,
            rentalStartDate: { $lte: endDate },
            rentalEndDate: { $gte: startDate }
          }
        },
        {
          $project: {
            rentalRevenue: {
              $multiply: [
                '$monthlyRentalRate',
                {
                  $divide: [
                    { $subtract: [
                      { $min: [endDate, '$rentalEndDate'] },
                      { $max: [startDate, '$rentalStartDate'] }
                    ]},
                    1000 * 60 * 60 * 24 * 30
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            rentalEquipmentRevenue: { $sum: '$rentalRevenue' }
          }
        }
      ]),
      // DS Revenue - from operations
      FuelLog.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            operationType: 'ds'
          }
        },
        {
          $group: {
            _id: null,
            dsRevenue: { $sum: '$revenue' }
          }
        }
      ])
    ]);

    const operatingRevenues = revenueData[0][0]?.operatingRevenues || 0;
    const rentalEquipmentRevenue = revenueData[1][0]?.rentalEquipmentRevenue || 0;
    const dsRevenue = revenueData[2][0]?.dsRevenue || 0;
    
    // Get manual entries from database
    const manualEntries = await ManualPnLEntry.find({ isActive: true }).lean();
    const manualEntriesMap = manualEntries.reduce((acc, entry) => {
      acc[entry.itemId] = entry.amount;
      return acc;
    }, {} as Record<string, number>);

    // Use actual manual entry values from database
    const rebate = manualEntriesMap['rebate'] || 0;
    const subCompaniesRevenue = manualEntriesMap['sub_companies_revenue'] || 0;
    const otherRevenue = manualEntriesMap['other_revenue'] || 0;
    const provisionEndService = manualEntriesMap['provision_end_service'] || 0;
    const provisionImpairment = manualEntriesMap['provision_impairment'] || 0;
    
    // Calculate net operating revenue and total revenue
    const netOperatingRevenue = operatingRevenues + rebate;
    const totalRevenue = netOperatingRevenue + rentalEquipmentRevenue + dsRevenue + subCompaniesRevenue + 
                        otherRevenue + provisionEndService + provisionImpairment;

    // 2. EXPENSES SECTION - ENHANCED WITH ALL MODULES
    const expensesData = await Promise.all([
      // Operation Cost - from FuelLog, Maintenance, etc.
      Promise.all([
        FuelLog.aggregate([
          {
            $match: {
              dateTime: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              fuelCost: { $sum: '$totalCost' }
            }
          }
        ]),
        Maintenance.aggregate([
          {
            $match: {
              $or: [
                { completedDate: { $gte: startDate, $lte: endDate } },
                { scheduledDate: { $gte: startDate, $lte: endDate } }
              ]
            }
          },
          {
            $group: {
              _id: null,
              maintenanceCost: { $sum: '$totalCost' }
            }
          }
        ])
      ]),
      // Business Trip Costs - NEW INTEGRATION
      BusinessTrip.aggregate([
        {
          $match: {
            departureDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['Approved', 'Completed', 'Reimbursed'] }
          }
        },
        {
          $group: {
            _id: null,
            businessTripCost: { 
              $sum: { 
                $add: [
                  { $ifNull: ['$perDiem', 0] },
                  { $ifNull: ['$totalTripCost', 0] }
                ]
              }
            }
          }
        }
      ]),
      // Overtime Costs - NEW INTEGRATION
      Overtime.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, startDate] },
                { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, endDate] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            overtimeCost: { $sum: '$totalCost' }
          }
        }
      ]),
      // Trip Allowance Costs - NEW INTEGRATION
      TripAllowance.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, startDate] },
                { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, endDate] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            tripAllowanceCost: { $sum: '$allowance' }
          }
        }
      ]),
      // Food Allowance Costs - NEW INTEGRATION
      FoodAllowance.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            foodAllowanceCost: { $sum: { $toDouble: '$value' } }
          }
        }
      ]),
      // HSE Training Costs - NEW INTEGRATION
      HSE.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: 'training'
          }
        },
        {
          $group: {
            _id: null,
            hseTrainingCost: { $sum: { $ifNull: ['$cost', 0] } }
          }
        }
      ]),
      // Rental Equipment Cost - from Asset module
      Asset.aggregate([
        {
          $match: {
            isRental: true,
            rentalStartDate: { $lte: endDate },
            rentalEndDate: { $gte: startDate }
          }
        },
        {
          $project: {
            rentalCost: {
              $multiply: [
                '$monthlyMaintenanceCost',
                {
                  $divide: [
                    { $subtract: [
                      { $min: [endDate, '$rentalEndDate'] },
                      { $max: [startDate, '$rentalStartDate'] }
                    ]},
                    1000 * 60 * 60 * 24 * 30
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            rentalEquipmentCost: { $sum: '$rentalCost' }
          }
        }
      ]),
      // DS Cost - from operations
      FuelLog.aggregate([
        {
          $match: {
            dateTime: { $gte: startDate, $lte: endDate },
            type: 'ds'
          }
        },
        {
          $group: {
            _id: null,
            dsCost: { $sum: '$totalCost' }
          }
        }
      ]),
      // Staff Costs - from Employee module
      Employee.aggregate([
        {
          $match: {
            hireDate: { $lte: endDate }
          }
        },
        {
          $project: {
            monthlySalary: { $divide: ['$salary', 12] },
            monthsInPeriod: {
              $cond: {
                if: { $gte: ['$hireDate', startDate] },
                then: { $divide: [{ $subtract: [endDate, '$hireDate'] }, 1000 * 60 * 60 * 24 * 30] },
                else: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24 * 30] }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            staffCost: { $sum: { $multiply: ['$monthlySalary', '$monthsInPeriod'] } }
          }
        }
      ]),
      // Procurement costs
      ProcurementInvoice.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['approved', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            procurementCost: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const fuelCost = (expensesData[0] as any[])[0]?.fuelCost || 0;
    const maintenanceCost = (expensesData[0] as any[])[1]?.maintenanceCost || 0;
    const operationCost = fuelCost + maintenanceCost;
    
    // NEW COST INTEGRATIONS - Using Dashboard Data
    const businessTripData = getDashboardData('businessTrip');
    const overtimeData = getDashboardData('overtime');
    const tripAllowanceData = getDashboardData('tripAllowance');
    const foodAllowanceData = getDashboardData('foodAllowance');
    const hseData = getDashboardData('hse');
    const procurementData = getDashboardData('procurement');
    
    const businessTripCost = businessTripData?.costs?.yearly || 0;
    const overtimeCost = overtimeData?.costs?.yearly || 0;
    const tripAllowanceCost = tripAllowanceData?.costs?.yearly || 0;
    const foodAllowanceCost = foodAllowanceData?.costs?.yearly || 0;
    const hseTrainingCost = hseData?.costs?.yearly || 0;
    const procurementCost = procurementData?.costs?.yearly || 0;
    
    console.log('Dashboard costs:', {
      businessTrip: businessTripCost,
      overtime: overtimeCost,
      tripAllowance: tripAllowanceCost,
      foodAllowance: foodAllowanceCost,
      hse: hseTrainingCost,
      procurement: procurementCost
    });
    
    const rentalEquipmentCost = expensesData[6][0]?.rentalEquipmentCost || 0;
    const dsCost = expensesData[7][0]?.dsCost || 0;
    const staffCost = expensesData[8][0]?.staffCost || 0;
    // procurementCost is now calculated from dashboard data above
    
    // Get general admin expenses from admin module (government correspondence)
    const generalAdminExpensesData = await AdminGovCorrespondence.aggregate([
      {
        $match: {
          submissionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$fee' } }
        }
      }
    ]);
    const generalAdminExpenses = generalAdminExpensesData[0]?.total || 0;
    
    // Use manual entries from database for remaining values
    const serviceAgreementCost = manualEntriesMap['service_agreement_cost'] || 0;
    
    // Calculate total expenses with ALL new integrations
    const totalExpenses = operationCost + rentalEquipmentCost + dsCost + generalAdminExpenses + 
                         staffCost + businessTripCost + overtimeCost + tripAllowanceCost + 
                         foodAllowanceCost + hseTrainingCost + serviceAgreementCost + procurementCost;

    // 3. INCOME, EXPENSES AND OTHER ITEMS - Use manual entries from database
    const gainSellingProducts = manualEntriesMap['gain_selling_products'] || 0;

    // 4. EBITIDA - Use manual entries from database
    const financeCosts = manualEntriesMap['finance_costs'] || 0;
    
    // Calculate depreciation with amortization
    const depreciationData = await Asset.aggregate([
      {
        $match: {
          purchaseDate: { $lte: endDate }
        }
      },
      {
        $project: {
          monthlyDepreciation: { $divide: ['$purchaseValue', { $multiply: ['$usefulLifeMonths', 1] }] },
          monthsInPeriod: {
            $cond: {
              if: { $gte: ['$purchaseDate', startDate] },
              then: { $divide: [{ $subtract: [endDate, '$purchaseDate'] }, 1000 * 60 * 60 * 24 * 30] },
              else: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24 * 30] }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          depreciation: { $sum: { $multiply: ['$monthlyDepreciation', '$monthsInPeriod'] } }
        }
      }
    ]);

    const depreciation = depreciationData[0]?.depreciation || 0;

    // Calculate EBITIDA
    const ebitida = totalRevenue - totalExpenses + gainSellingProducts - financeCosts - depreciation;

    console.log('P&L Summary - Calculated values:', {
      totalRevenue,
      totalExpenses,
      businessTripCost,
      overtimeCost,
      tripAllowanceCost,
      foodAllowanceCost,
      hseTrainingCost,
      ebitida
    });

    // Build response with new structure and ALL integrations
    const pnlSummary = {
      period: filters.period,
      startDate: startDate,
      endDate: endDate,
      revenue: {
        operatingRevenues,
        rebate,
        netOperatingRevenue: netOperatingRevenue,
        rentalEquipmentRevenue,
        dsRevenue,
        subCompaniesRevenue,
        otherRevenue,
        provisionEndService,
        provisionImpairment,
        total: totalRevenue
      },
      expenses: {
        operationCost,
        rentalEquipmentCost,
        dsCost,
        generalAdminExpenses,
        staffCost,
        businessTripCost, // NEW
        overtimeCost, // NEW
        tripAllowanceCost, // NEW
        foodAllowanceCost, // NEW
        hseTrainingCost, // NEW
        procurementCost,
        serviceAgreementCost,
        total: totalExpenses
      },
      incomeExpensesOther: {
        gainSellingProducts
      },
      ebitida: {
        financeCosts,
        depreciation,
        total: ebitida
      },
      netProfit: ebitida,
      // Add breakdown for Cost Analysis Dashboard integration
      breakdown: {
        costOfSales: {
          fuel: fuelCost,
          procurement: procurementCost,
          depreciation: depreciation
        },
        operatingExpenses: {
          staff: staffCost,
          maintenance: maintenanceCost,
          hse: hseTrainingCost,
          training: hseTrainingCost,
          businessTrips: businessTripCost,
          overtime: overtimeCost,
          tripAllowance: tripAllowanceCost,
          foodAllowance: foodAllowanceCost,
          procurement: procurementCost
        }
      }
    };

    res.json(pnlSummary);
  } catch (error) {
    console.error('Error in getPnLSummary:', error);
    res.status(500).json({ error: 'Failed to generate P&L summary' });
  }
};

// P&L Table with detailed line items - Updated for vertical structure with ALL integrations
export const getPnLTable = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate } = filters;

    console.log('P&L Table - Using integrated data sources:', { period: filters.period, startDate, endDate });

    // Get account mappings
    const accountMappings = await AccountMapping.find({ isActive: true });

    // Get actual data for calculations - ENHANCED WITH ALL MODULES
    const [revenueData, expensesData, depreciationData] = await Promise.all([
      // Revenue data
      Promise.all([
        Invoice.aggregate([
          {
            $match: {
              invoiceDate: { $gte: startDate, $lte: endDate },
              status: { $in: ['approved', 'sent', 'paid'] }
            }
          },
          {
            $group: {
              _id: null,
              operatingRevenues: { $sum: '$amount' }
            }
          }
        ]),
        Asset.aggregate([
          {
            $match: {
              isRental: true,
              rentalStartDate: { $lte: endDate },
              rentalEndDate: { $gte: startDate }
            }
          },
          {
            $project: {
              rentalRevenue: {
                $multiply: [
                  '$monthlyRentalRate',
                  {
                    $divide: [
                      { $subtract: [
                        { $min: [endDate, '$rentalEndDate'] },
                        { $max: [startDate, '$rentalStartDate'] }
                      ]},
                      1000 * 60 * 60 * 24 * 30
                    ]
                  }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              rentalEquipmentRevenue: { $sum: '$rentalRevenue' }
            }
          }
        ])
      ]),
      // Expenses data - ENHANCED WITH ALL MODULES
      Promise.all([
        FuelLog.aggregate([
          {
            $match: {
              dateTime: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              operationCost: { $sum: '$totalCost' }
            }
          }
        ]),
        Employee.aggregate([
          {
            $match: {
              hireDate: { $lte: endDate }
            }
          },
          {
            $project: {
              monthlySalary: { $divide: ['$salary', 12] },
              monthsInPeriod: {
                $cond: {
                  if: { $gte: ['$hireDate', startDate] },
                  then: { $divide: [{ $subtract: [endDate, '$hireDate'] }, 1000 * 60 * 60 * 24 * 30] },
                  else: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24 * 30] }
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              staffCost: { $sum: { $multiply: ['$monthlySalary', '$monthsInPeriod'] } }
            }
          }
        ]),
        // NEW INTEGRATIONS FOR TABLE
        BusinessTrip.aggregate([
          {
            $match: {
              departureDate: { $gte: startDate, $lte: endDate },
              status: { $in: ['Approved', 'Completed', 'Reimbursed'] }
            }
          },
          {
            $group: {
              _id: null,
              businessTripCost: { 
                $sum: { 
                  $add: [
                    { $ifNull: ['$perDiem', 0] },
                    { $ifNull: ['$totalTripCost', 0] }
                  ]
                }
              }
            }
          }
        ]),
        Overtime.aggregate([
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, startDate] },
                  { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, endDate] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              overtimeCost: { $sum: '$totalCost' }
            }
          }
        ]),
        TripAllowance.aggregate([
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, startDate] },
                  { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, endDate] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              tripAllowanceCost: { $sum: '$allowance' }
            }
          }
        ]),
        FoodAllowance.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              foodAllowanceCost: { $sum: { $toDouble: '$value' } }
            }
          }
        ]),
        HSE.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate },
              type: 'training'
            }
          },
          {
            $group: {
              _id: null,
              hseTrainingCost: { $sum: { $ifNull: ['$cost', 0] } }
            }
          }
        ])
      ]),
      // Depreciation data
      Asset.aggregate([
        {
          $match: {
            purchaseDate: { $lte: endDate }
          }
        },
        {
          $project: {
            monthlyDepreciation: { $divide: ['$purchaseValue', { $multiply: ['$usefulLifeMonths', 1] }] },
            monthsInPeriod: {
              $cond: {
                if: { $gte: ['$purchaseDate', startDate] },
                then: { $divide: [{ $subtract: [endDate, '$purchaseDate'] }, 1000 * 60 * 60 * 24 * 30] },
                else: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24 * 30] }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            depreciation: { $sum: { $multiply: ['$monthlyDepreciation', '$monthsInPeriod'] } }
          }
        }
      ])
    ]);

    // Extract values
    const operatingRevenues = revenueData[0][0]?.operatingRevenues || 0;
    const rentalEquipmentRevenue = revenueData[1][0]?.rentalEquipmentRevenue || 0;
    const operationCost = expensesData[0][0]?.operationCost || 0;
    const staffCost = expensesData[1][0]?.staffCost || 0;
    const businessTripCost = expensesData[2][0]?.businessTripCost || 0;
    const overtimeCost = expensesData[3][0]?.overtimeCost || 0;
    const tripAllowanceCost = expensesData[4][0]?.tripAllowanceCost || 0;
    const foodAllowanceCost = expensesData[5][0]?.foodAllowanceCost || 0;
    const hseTrainingCost = expensesData[6][0]?.hseTrainingCost || 0;
    const depreciation = depreciationData[0]?.depreciation || 0;

    // Real data from database - no more hardcoded values
    const subCompaniesRevenue = 0; // This should come from actual sub-companies data when available
    const otherRevenue = 0; // This should come from actual other revenue sources when available
    const provisionEndService = 0; // This should come from actual provisions when available
    const provisionImpairment = 0; // This should come from actual impairment data when available
    const dsRevenue = 0; // This should come from actual DS revenue when available
    const rentalEquipmentCost = 0; // This should come from actual rental equipment costs when available
    const dsCost = 0; // This should come from actual DS costs when available
    // Get general admin expenses from admin module (government correspondence)
    const generalAdminExpensesData = await AdminGovCorrespondence.aggregate([
      {
        $match: {
          submissionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$fee' } }
        }
      }
    ]);
    const generalAdminExpenses = generalAdminExpensesData[0]?.total || 0;
    const serviceAgreementCost = 0; // This should come from actual service agreement costs when available
    const gainSellingProducts = 0; // This should come from actual gains when available
    const financeCosts = 0; // This should come from actual finance costs when available

    // Calculate summary values with ALL integrations
    const netOperatingRevenue = operatingRevenues;
    const totalRevenue = netOperatingRevenue + rentalEquipmentRevenue + dsRevenue + subCompaniesRevenue + 
                        otherRevenue + provisionEndService + provisionImpairment;
    const totalExpenses = operationCost + rentalEquipmentCost + dsCost + generalAdminExpenses + 
                         staffCost + businessTripCost + overtimeCost + tripAllowanceCost + 
                         foodAllowanceCost + hseTrainingCost + serviceAgreementCost;
    const ebitida = totalRevenue - totalExpenses + gainSellingProducts - financeCosts - depreciation;

    // Calculate rebate: (Income, Expenses and Other Items + Total Expenses - Total Revenue)
    const incomeExpensesOther = gainSellingProducts;
    const rebate = incomeExpensesOther + totalExpenses - totalRevenue;

    // Build P&L table structure using VERTICAL_PNL_STRUCTURE with ALL integrations
    const pnlTable = Object.values(VERTICAL_PNL_STRUCTURE).map(section => {
      const sectionData = {
        id: section.id,
        category: section.category,
        items: section.items.map(item => {
          let amount = 0;
          let trend = 'neutral';
          let expandable = false;

          // Map item IDs to actual values - ENHANCED WITH ALL MODULES
          switch (item.id) {
            case 'operating_revenues':
              amount = operatingRevenues;
              trend = 'up';
              break;
            case 'net_operating_revenue':
              amount = netOperatingRevenue;
              trend = 'up';
              expandable = true;
              break;
            case 'rental_equipment_revenue':
              amount = rentalEquipmentRevenue;
              trend = 'up';
              break;
            case 'ds_revenue':
              amount = dsRevenue;
              trend = 'up';
              break;
            case 'sub_companies_revenue':
              amount = subCompaniesRevenue;
              trend = 'up';
              break;
            case 'other_revenue':
              amount = otherRevenue;
              trend = 'up';
              break;
            case 'provision_end_service':
              amount = provisionEndService;
              trend = 'up';
              break;
            case 'provision_impairment':
              amount = provisionImpairment;
              trend = 'up';
              break;
            case 'total_revenue':
              amount = totalRevenue;
              trend = 'up';
              expandable = true;
              break;
            case 'rebate':
              amount = rebate;
              trend = rebate >= 0 ? 'up' : 'down';
              expandable = true;
              break;
            case 'operation_cost':
              amount = operationCost;
              trend = 'down';
              break;
            case 'rental_equipment_cost':
              amount = rentalEquipmentCost;
              trend = 'down';
              break;
            case 'ds_cost':
              amount = dsCost;
              trend = 'down';
              break;
            case 'general_admin_expenses':
              amount = generalAdminExpenses;
              trend = 'down';
              break;
            case 'staff_costs':
              amount = staffCost;
              trend = 'down';
              break;
            // NEW EXPENSE INTEGRATIONS
            case 'business_trip_costs':
              amount = businessTripCost;
              trend = 'down';
              break;
            case 'overtime_costs':
              amount = overtimeCost;
              trend = 'down';
              break;
            case 'trip_allowance_costs':
              amount = tripAllowanceCost;
              trend = 'down';
              break;
            case 'food_allowance_costs':
              amount = foodAllowanceCost;
              trend = 'down';
              break;
            case 'hse_training_costs':
              amount = hseTrainingCost;
              trend = 'down';
              break;
            case 'service_agreement_cost':
              amount = serviceAgreementCost;
              trend = 'down';
              break;
            case 'total_expenses':
              amount = totalExpenses;
              trend = 'down';
              expandable = true;
              break;
            case 'gain_selling_products':
              amount = gainSellingProducts;
              trend = 'up';
              break;
            case 'ebitda':
              amount = totalRevenue + gainSellingProducts - totalExpenses;
              trend = totalRevenue + gainSellingProducts - totalExpenses >= 0 ? 'up' : 'down';
              expandable = true;
              break;
            case 'finance_costs':
              amount = financeCosts;
              trend = 'down';
              break;
            case 'depreciation':
              amount = depreciation;
              trend = 'down';
              break;
          }

          return {
            id: item.id,
            description: item.description,
            amount,
            module: item.module,
            trend,
            expandable,
            type: item.type
          };
        }),
        subtotal: 0,
        type: section.id === 'revenue' ? 'revenue' : section.id === 'ebitda' ? 'ebitda' : 'expense'
      };

      // Calculate section subtotal
      if (section.id === 'revenue') {
        sectionData.subtotal = totalRevenue;
      } else if (section.id === 'expenses') {
        sectionData.subtotal = totalExpenses;
      } else if (section.id === 'income_expenses_other') {
        sectionData.subtotal = gainSellingProducts;
      } else if (section.id === 'ebitda') {
        // EBITDA value is the calculated formula, not the sum of items underneath
        sectionData.subtotal = totalRevenue + gainSellingProducts - totalExpenses;
      }

      return sectionData;
    });

    res.json(pnlTable);
  } catch (error) {
    console.error('Error in getPnLTable:', error);
    res.status(500).json({ error: 'Failed to generate P&L table' });
  }
};

// P&L Charts data - Enhanced with all modules
export const getPnLCharts = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    const periods = calculatePeriodBreakdown(startDate, endDate, period);

    // Generate chart data for each period with ALL module integrations
    const chartData = await Promise.all(periods.map(async (period) => {
      const periodStart = period.start;
      const periodEnd = period.end;

      const [revenue, expenses, businessTrips, overtime, allowances] = await Promise.all([
        Invoice.aggregate([
          { $match: { invoiceDate: { $gte: periodStart, $lte: periodEnd }, status: { $in: ['approved', 'sent', 'paid'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        FuelLog.aggregate([
          { $match: { dateTime: { $gte: periodStart, $lte: periodEnd } } },
          { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]),
        BusinessTrip.aggregate([
          { $match: { departureDate: { $gte: periodStart, $lte: periodEnd }, status: { $in: ['Approved', 'Completed', 'Reimbursed'] } } },
          { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$perDiem', 0] }, { $ifNull: ['$totalTripCost', 0] }] } } } }
        ]),
        Overtime.aggregate([
          { $match: { $expr: { $and: [{ $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, periodStart] }, { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, periodEnd] }] } } },
          { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]),
        Promise.all([
          TripAllowance.aggregate([
            { $match: { $expr: { $and: [{ $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, periodStart] }, { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, periodEnd] }] } } },
            { $group: { _id: null, total: { $sum: '$allowance' } } }
          ]),
          FoodAllowance.aggregate([
            { $match: { createdAt: { $gte: periodStart, $lte: periodEnd } } },
            { $group: { _id: null, total: { $sum: { $toDouble: '$value' } } } }
          ])
        ])
      ]);

      const totalRevenue = revenue[0]?.total || 0;
      const totalExpenses = (expenses[0]?.total || 0) + 
                           (businessTrips[0]?.total || 0) + 
                           (overtime[0]?.total || 0) + 
                           (allowances[0][0]?.total || 0) + 
                           (allowances[1][0]?.total || 0);

      return {
        period: period.label,
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        businessTrips: businessTrips[0]?.total || 0,
        overtime: overtime[0]?.total || 0,
        tripAllowance: allowances[0][0]?.total || 0,
        foodAllowance: allowances[1][0]?.total || 0
      };
    }));

    // Revenue vs Expense vs Net Profit chart with breakdown
    const revenueVsExpenseData = chartData.map(item => ({
      period: item.period,
      revenue: item.revenue,
      expenses: item.expenses,
      netProfit: item.netProfit,
      businessTrips: item.businessTrips,
      overtime: item.overtime,
      tripAllowance: item.tripAllowance,
      foodAllowance: item.foodAllowance
    }));

    // Margin trend chart
    const marginTrendData = chartData.map(item => ({
      period: item.period,
      grossMargin: item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue) * 100 : 0,
      netMargin: item.revenue > 0 ? (item.netProfit / item.revenue) * 100 : 0
    }));

    res.json({
      netProfitOverTime: chartData,
      revenueVsExpense: revenueVsExpenseData,
      marginTrend: marginTrendData
    });

  } catch (error: any) {
    console.error('Error in getPnLCharts:', error);
    res.status(500).json({ message: 'Failed to generate P&L charts', error: error.message });
  }
};

// P&L Analysis with insights - Enhanced with all modules
export const getPnLAnalysis = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate } = filters;

    // Generate analysis insights with ALL module data
    const analysis: {
      alerts: Array<{ type: string; message: string; severity: string }>;
      trends: Array<{ description: string }>;
      recommendations: string[];
    } = {
      alerts: [],
      trends: [],
      recommendations: []
    };

    // Enhanced cost center analysis with ALL modules
    const [fuelCosts, businessTripCosts, overtimeCosts, allowanceCosts] = await Promise.all([
      FuelLog.aggregate([
        { $match: { dateTime: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      BusinessTrip.aggregate([
        { $match: { departureDate: { $gte: startDate, $lte: endDate }, status: { $in: ['Approved', 'Completed', 'Reimbursed'] } } },
        { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$perDiem', 0] }, { $ifNull: ['$totalTripCost', 0] }] } } } }
      ]),
      Overtime.aggregate([
        { $match: { $expr: { $and: [{ $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, startDate] }, { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, endDate] }] } } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      Promise.all([
        TripAllowance.aggregate([
          { $match: { $expr: { $and: [{ $gte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, startDate] }, { $lte: [{ $dateFromParts: { year: '$year', month: { $add: ['$month', 1] } } }, endDate] }] } } },
          { $group: { _id: null, total: { $sum: '$allowance' } } }
        ]),
        FoodAllowance.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$value' } } } }
        ])
      ])
    ]);

    const costCenters = [
      { name: 'Fuel & Operations', amount: fuelCosts[0]?.total || 0 },
      { name: 'Business Trips', amount: businessTripCosts[0]?.total || 0 },
      { name: 'Overtime', amount: overtimeCosts[0]?.total || 0 },
      { name: 'Trip Allowances', amount: allowanceCosts[0][0]?.total || 0 },
      { name: 'Food Allowances', amount: allowanceCosts[1][0]?.total || 0 }
    ].sort((a, b) => b.amount - a.amount);

    // Identify rising cost centers
    costCenters.slice(0, 3).forEach((item, index) => {
      if (index === 0 && item.amount > 0) {
        analysis.alerts.push({
          type: 'warning',
          message: `Highest cost center: ${item.name} (KD ${item.amount.toLocaleString()})`,
          severity: 'medium'
        });
      }
    });

    // Margin analysis with enhanced data
    const [revenue, totalExpenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, status: { $in: ['approved', 'sent', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Promise.resolve(costCenters.reduce((sum, center) => sum + center.amount, 0))
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    if (margin < 20) {
      analysis.alerts.push({
        type: 'error',
        message: `Low profit margin: ${margin.toFixed(1)}%. Consider cost optimization across all modules.`,
        severity: 'high'
      });
    }

    // Enhanced recommendations with ALL modules
    analysis.recommendations = [
      'Review high-cost procurement items for bulk purchasing opportunities',
      'Analyze fuel consumption patterns for route optimization',
      'Consider preventive maintenance to reduce repair costs',
      'Optimize business trip planning to reduce travel expenses',
      'Monitor overtime patterns and implement workforce planning',
      'Review allowance policies for cost-effectiveness',
      'Implement HSE training efficiency programs',
      'Evaluate inventory turnover and optimize stock levels',
      'Consider legal cost containment strategies',
      'Assess facility utilization and optimize space usage'
    ];

    // Add trend analysis
    analysis.trends = [
      { description: 'Business trip costs showing seasonal variations' },
      { description: 'Overtime expenses correlating with project deadlines' },
      { description: 'Fuel costs impacted by market price fluctuations' },
      { description: 'Training investments showing long-term ROI potential' }
    ];

    res.json(analysis);

  } catch (error: any) {
    console.error('Error in getPnLAnalysis:', error);
    res.status(500).json({ message: 'Failed to generate P&L analysis', error: error.message });
  }
}; 

// Real-time P&L update webhook endpoint
export const updatePnLRealTime = async (req: Request, res: Response) => {
  try {
    const { module, action, data } = req.body;
    
    // Store dashboard data if provided
    if (data && data.costs) {
      storeDashboardData(module, data);
    }
    
    // Broadcast update to connected clients via WebSocket or Server-Sent Events
    // This would trigger real-time updates in the frontend PnL dashboard
    
    // For now, just return success - implement WebSocket/SSE later
    res.json({ 
      success: true, 
      message: 'P&L update triggered',
      module,
      action,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in updatePnLRealTime:', error);
    res.status(500).json({ error: 'Failed to update P&L in real-time' });
  }
};

// Endpoint to receive dashboard data from Cost Analysis Dashboards
export const receiveDashboardData = async (req: Request, res: Response) => {
  try {
    const { module, costs, recordCount } = req.body;
    
    if (!module || !costs) {
      return res.status(400).json({ error: 'Module and costs data are required' });
    }
    
    storeDashboardData(module, { costs, recordCount });
    
    console.log(`Received dashboard data for ${module}:`, { costs, recordCount });
    
    res.json({ 
      success: true, 
      message: `Dashboard data stored for ${module}`,
      module,
      recordCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in receiveDashboardData:', error);
    res.status(500).json({ error: 'Failed to store dashboard data' });
  }
};

// Get Vertical P&L Data for Dashboard
// Individual Financial Metrics Endpoints - Get values from PnL vertical table
export const getRevenue = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    console.log('Revenue endpoint - Getting from PnL vertical table:', { period, startDate, endDate });

    // Get data from PnL vertical table
    const mockReq = {
      query: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        period: 'monthly'
      }
    } as any;

    let pnlVerticalData: any = null;
    const mockRes = {
      json: (data: any) => { pnlVerticalData = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    const { getVerticalPnLData } = await import('./pnlController');
    await getVerticalPnLData(mockReq, mockRes);

    const totalRevenue = pnlVerticalData?.summary?.revenue || 0;
    const revenueBreakdown = pnlVerticalData?.revenue || {};

    res.json({
      totalRevenue,
      breakdown: revenueBreakdown,
      period,
      startDate,
      endDate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    console.log('Expenses endpoint - Getting from PnL vertical table:', { period, startDate, endDate });

    // Get data from PnL vertical table
    const mockReq = {
      query: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        period: 'monthly'
      }
    } as any;

    let pnlVerticalData: any = null;
    const mockRes = {
      json: (data: any) => { pnlVerticalData = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    const { getVerticalPnLData } = await import('./pnlController');
    await getVerticalPnLData(mockReq, mockRes);

    const totalExpenses = pnlVerticalData?.summary?.operatingExpenses || 0;
    const expensesBreakdown = pnlVerticalData?.expenses || {};

    res.json({
      totalExpenses,
      breakdown: expensesBreakdown,
      period,
      startDate,
      endDate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getEBITDA = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    console.log('EBITDA endpoint - Getting from PnL vertical table:', { period, startDate, endDate });

    // Get data from PnL vertical table
    const mockReq = {
      query: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        period: 'monthly'
      }
    } as any;

    let pnlVerticalData: any = null;
    const mockRes = {
      json: (data: any) => { pnlVerticalData = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    const { getVerticalPnLData } = await import('./pnlController');
    await getVerticalPnLData(mockReq, mockRes);

    const ebitda = pnlVerticalData?.summary?.ebitda || 0;
    const revenue = pnlVerticalData?.summary?.revenue || 0;
    const expenses = pnlVerticalData?.summary?.operatingExpenses || 0;
    const ebitdaBreakdown = pnlVerticalData?.ebitida || {};

    res.json({
      ebitda,
      revenue,
      expenses,
      breakdown: ebitdaBreakdown,
      calculation: `${revenue} - ${expenses} = ${ebitda}`,
      period,
      startDate,
      endDate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSubCompaniesRevenue = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    console.log('Sub Companies Revenue endpoint - Getting from PnL vertical table:', { period, startDate, endDate });

    // Get data from PnL vertical table
    const mockReq = {
      query: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        period: 'monthly'
      }
    } as any;

    let pnlVerticalData: any = null;
    const mockRes = {
      json: (data: any) => { pnlVerticalData = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    const { getVerticalPnLData } = await import('./pnlController');
    await getVerticalPnLData(mockReq, mockRes);

    const subCompaniesRevenue = pnlVerticalData?.subCompaniesRevenue || 0;

    res.json({
      subCompaniesRevenue,
      period,
      startDate,
      endDate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getVerticalPnLData = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    console.log('Vertical P&L Data - Using integrated data sources:', { period, startDate, endDate });

    // Get dashboard data from Cost Analysis Dashboards
    const allDashboardData = getAllDashboardData();
    console.log('Available dashboard data:', Array.from(allDashboardData.keys()));

    // 1. REVENUE SECTION
    const revenueData = await Promise.all([
      // Operating Revenues - from Invoice module
      Invoice.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, operatingRevenues: { $sum: '$amount' } } }
      ]),
      // Rental Equipment Revenue - from Asset module
      Asset.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $addFields: {
          rentalRevenue: {
            $multiply: ['$rentalRate', '$utilizationRate', 30] // Monthly rental revenue
          }
        }},
        { $group: { _id: null, rentalEquipmentRevenue: { $sum: '$rentalRevenue' } } }
      ]),
      // DS Revenue - from operations
      BusinessTrip.aggregate([
        { $match: { status: 'Completed', date: { $gte: startDate, $lte: endDate } } },
        { $addFields: {
          revenue: { $multiply: ['$cost', 0.1] } // 10% revenue from business trips
        }},
        { $group: { _id: null, dsRevenue: { $sum: '$revenue' } } }
      ])
    ]);

    const operatingRevenues = revenueData[0][0]?.operatingRevenues || 0;
    const rentalEquipmentRevenue = revenueData[1][0]?.rentalEquipmentRevenue || 0;
    const dsRevenue = revenueData[2][0]?.dsRevenue || 0;

    console.log('Revenue data from database:', { operatingRevenues, rentalEquipmentRevenue, dsRevenue });

    // Get real data from database - no more hardcoded values
    // These should come from actual business data or be set to 0 if not available
    const subCompaniesRevenue = 0; // This should come from actual sub-companies data when available
    const otherRevenue = 0; // This should come from actual other revenue sources when available
    const provisionEndService = 0; // This should come from actual provisions when available
    const provisionImpairment = 0; // This should come from actual impairment data when available
    const rebate = 0; // This should come from actual rebate data when available

    console.log('Real manual entries for revenue:', { subCompaniesRevenue, otherRevenue, provisionEndService, provisionImpairment, rebate });

    // Calculate net operating revenue and total revenue
    const netOperatingRevenue = operatingRevenues + rebate;
    const totalRevenue = netOperatingRevenue + rentalEquipmentRevenue + dsRevenue + subCompaniesRevenue + 
                        otherRevenue + provisionEndService + provisionImpairment;

    console.log('Total revenue calculation:', { netOperatingRevenue, totalRevenue });

    // 2. EXPENSES SECTION - ENHANCED WITH ALL MODULES
    const expensesData = await Promise.all([
      // Operation costs (fuel, maintenance, procurement)
      Promise.all([
        FuelLog.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, fuelCost: { $sum: '$cost' } } }
        ]),
        Maintenance.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, maintenanceCost: { $sum: '$cost' } } }
        ]),
        ProcurementInvoice.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, procurementCost: { $sum: '$amount' } } }
        ])
      ]),
      // Staff costs
      Payroll.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, staffCost: { $sum: '$totalAmount' } } }
      ]),
      // Business trip costs
      BusinessTrip.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, businessTripCost: { $sum: '$cost' } } }
      ]),
      // Overtime costs
      Overtime.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, overtimeCost: { $sum: '$amount' } } }
      ]),
      // Trip allowance costs
      TripAllowance.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, tripAllowanceCost: { $sum: '$amount' } } }
      ]),
      // Food allowance costs
      FoodAllowance.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, foodAllowanceCost: { $sum: '$amount' } } }
      ]),
      // HSE & Training costs
      Training.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, hseTrainingCost: { $sum: '$cost' } } }
      ]),
      // Rental equipment costs
      Asset.aggregate([
        { $match: { type: 'rental', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, rentalEquipmentCost: { $sum: '$cost' } } }
      ]),
      // DS costs
      BusinessTrip.aggregate([
        { $match: { status: 'Completed', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, dsCost: { $sum: '$cost' } } }
      ])
    ]);

    const fuelCost = (expensesData[0] as any[])[0]?.fuelCost || 0;
    const maintenanceCost = (expensesData[0] as any[])[1]?.maintenanceCost || 0;
    const procurementCost = (expensesData[0] as any[])[2]?.procurementCost || 0;
    const operationCost = fuelCost + maintenanceCost + procurementCost;

    const staffCost = expensesData[1][0]?.staffCost || 0;
    const businessTripCost = expensesData[2][0]?.businessTripCost || 0;
    const overtimeCost = expensesData[3][0]?.overtimeCost || 0;
    const tripAllowanceCost = expensesData[4][0]?.tripAllowanceCost || 0;
    const foodAllowanceCost = expensesData[5][0]?.foodAllowanceCost || 0;
    const hseTrainingCost = expensesData[6][0]?.hseTrainingCost || 0;
    const rentalEquipmentCost = expensesData[7][0]?.rentalEquipmentCost || 0;
    const dsCost = expensesData[8][0]?.dsCost || 0;

    console.log('Expenses data from database:', { 
      fuelCost, maintenanceCost, procurementCost, operationCost,
      staffCost, businessTripCost, overtimeCost, tripAllowanceCost,
      foodAllowanceCost, hseTrainingCost, rentalEquipmentCost, dsCost
    });

    // Get general admin expenses from admin module (government correspondence)
    const generalAdminExpensesData = await AdminGovCorrespondence.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    const generalAdminExpenses = generalAdminExpensesData[0]?.total || 0;

    // Get real data from database - no more hardcoded values
    const serviceAgreementCost = 0; // This should come from actual service agreement costs when available

    // Calculate total expenses with ALL new integrations
    const totalExpenses = operationCost + rentalEquipmentCost + dsCost + generalAdminExpenses + 
                         staffCost + businessTripCost + overtimeCost + tripAllowanceCost + 
                         foodAllowanceCost + hseTrainingCost + procurementCost + serviceAgreementCost;

    console.log('Total expenses calculation:', { totalExpenses, generalAdminExpenses, serviceAgreementCost });

    // 3. INCOME, EXPENSES AND OTHER ITEMS - Real data from database
    const gainSellingProducts = 0; // This should come from actual gains when available
    const financeCosts = 0; // This should come from actual finance costs when available
    const depreciation = 0; // This should come from actual depreciation data when available

    console.log('Other items:', { gainSellingProducts, financeCosts, depreciation });

    // 4. EBITDA CALCULATION
    const ebitda = totalRevenue - totalExpenses + gainSellingProducts - financeCosts - depreciation;

    // 5. NET PROFIT
    const netProfit = ebitda;

    console.log('Final calculations:', { totalRevenue, totalExpenses, ebitda, netProfit, subCompaniesRevenue });

    // Get additional module-specific data for dashboard
    const [hrData, assetsData, operationsData, maintenanceData, procurementData, salesData, adminData, hseData] = await Promise.all([
      // HR Data
      Promise.all([
        Employee.countDocuments({ status: 'active' }),
        Payroll.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Employee.countDocuments({ status: 'terminated' })
      ]),
      // Assets Data
      Promise.all([
        Asset.aggregate([
          { $group: { _id: null, total: { $sum: '$bookValue' } } }
        ]),
        Asset.aggregate([
          { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
        ]),
        Asset.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$depreciationAmount' } } }
        ]),
        Asset.countDocuments({ status: 'renewal_required' })
      ]),
      // Operations Data
      Promise.all([
        BusinessTrip.countDocuments({ status: 'Completed', date: { $gte: startDate, $lte: endDate } }),
        BusinessTrip.aggregate([
          { $match: { status: 'Completed', date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, onTime: { $sum: { $cond: [{ $lte: ['$actualReturnDate', '$returnDate'] }, 1, 0] } }, total: { $sum: 1 } } }
        ]),
        FuelLog.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$cost' } } }
        ]),
        Asset.aggregate([
          { $match: { type: 'vehicle' } },
          { $group: { _id: null, avgUtilization: { $avg: '$utilizationRate' } } }
        ])
      ]),
      // Maintenance Data
      Promise.all([
        Maintenance.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$cost' } } }
        ]),
        Maintenance.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$downtimeHours' } } }
        ])
      ]),
      // Procurement Data
      Promise.all([
        ProcurementInvoice.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        PurchaseOrder.countDocuments({ status: 'open' }),
        PurchaseRequest.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, avgCycleTime: { $avg: { $subtract: ['$approvedDate', '$date'] } } } }
        ])
      ]),
      // Sales Data
      Promise.all([
        Invoice.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Invoice.countDocuments({ status: 'pending' }),
        Invoice.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, avgMargin: { $avg: '$margin' } } }
        ])
      ]),
      // Admin Data
      Promise.all([
        Expense.aggregate([
          { $match: { category: 'admin', date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        PurchaseRequest.countDocuments({ status: 'pending' })
      ]),
      // HSE Data
      Promise.all([
        Incident.countDocuments({ date: { $gte: startDate, $lte: endDate } }),
        Training.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, compliance: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
        ]),
        Incident.countDocuments({ status: 'open' })
      ])
    ]);

    // Return vertical P&L structure with module data
    res.json({
      summary: {
        revenue: totalRevenue,
        operatingExpenses: totalExpenses,
        grossProfit: totalRevenue - totalExpenses,
        operatingProfit: totalRevenue - totalExpenses,
        ebitda: ebitda,
        netProfit: netProfit
      },
      revenue: {
        total: totalRevenue,
        operatingRevenues,
        rebate,
        netOperatingRevenue,
        rentalEquipmentRevenue,
        dsRevenue,
        subCompaniesRevenue,
        otherRevenue,
        provisionEndService,
        provisionImpairment
      },
      expenses: {
        total: totalExpenses,
        operationCost,
        rentalEquipmentCost,
        dsCost,
        generalAdminExpenses,
        staffCost,
        businessTripCost,
        overtimeCost,
        tripAllowanceCost,
        foodAllowanceCost,
        hseTrainingCost,
        procurementCost,
        serviceAgreementCost
      },
      ebitida: {
        total: ebitda,
        financeCosts,
        depreciation
      },
      subCompaniesRevenue: subCompaniesRevenue,
      netProfit: netProfit,
      // Module-specific data for dashboard
      hr: {
        headcount: hrData[0] || 0,
        payroll: hrData[1][0]?.total || 0,
        attrition: hrData[2] || 0
      },
      assets: {
        bookValue: assetsData[0][0]?.total || 0,
        utilization: assetsData[1][0]?.avgUtilization || 0,
        depreciation: assetsData[2][0]?.total || 0,
        renewals: assetsData[3] || 0
      },
      operations: {
        deliveries: operationsData[0] || 0,
        onTimePercentage: operationsData[1][0]?.total ? (operationsData[1][0].onTime / operationsData[1][0].total * 100) : 0,
        deliveryCost: operationsData[2][0]?.total || 0,
        fleetUtilization: operationsData[3][0]?.avgUtilization || 0
      },
      maintenance: {
        cost: maintenanceData[0][0]?.total || 0,
        downtime: maintenanceData[1][0]?.total || 0
      },
      procurement: {
        totalSpend: procurementData[0][0]?.total || 0,
        openPOs: procurementData[1] || 0,
        cycleTime: procurementData[2][0]?.avgCycleTime || 0
      },
      sales: {
        totalSales: salesData[0][0]?.total || 0,
        pipeline: salesData[1] || 0,
        salesMargin: salesData[2][0]?.avgMargin || 0
      },
      admin: {
        costs: adminData[0][0]?.total || 0,
        overheadPercentage: adminData[0][0]?.total && totalExpenses ? (adminData[0][0].total / totalExpenses * 100) : 0,
        pendingApprovals: adminData[1] || 0
      },
      hse: {
        incidents: hseData[0] || 0,
        trainingCompliance: hseData[1][0]?.compliance || 0,
        openActions: hseData[2] || 0
      }
    });
  } catch (error) {
    console.error('Error in getVerticalPnLData:', error);
    res.status(500).json({ error: 'Failed to generate vertical P&L data' });
  }
};

// Export P&L data to Excel
export const exportPnLToExcel = async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    // Get detailed P&L table data (not just summary)
    const tableData = await getPnLTableDataInternal(period as string, startDate as string, endDate as string);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Profit & Loss Statement', ''],
      ['Period', `${startDate} to ${endDate}`],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Section', 'Amount (KD)', 'Percentage of Revenue', 'Items Count'],
      ...tableData.map((section: any) => [
        section.category,
        section.subtotal?.toLocaleString() || '0',
        section.percentageOfRevenue ? `${section.percentageOfRevenue.toFixed(2)}%` : '0%',
        section.items?.length || 0
      ])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'P&L Summary');
    
    // Detailed P&L Table sheet (the main detailed view)
    const detailedTableData = [
      ['Description', 'Amount (KD)', '% of Revenue', 'Source Module', 'Type', 'Expandable'],
      ...tableData.flatMap((section: any) => [
        // Section header row
        [section.category, section.subtotal?.toLocaleString() || '0', 
         section.percentageOfRevenue ? `${section.percentageOfRevenue.toFixed(2)}%` : '0%', 
         `${section.items?.length || 0} Sources`, section.type || 'section', 'No'],
        // Section items
        ...(section.items?.map((item: any) => [
          `  ${item.description}`,
          item.amount?.toLocaleString() || '0',
          item.percentageOfRevenue ? `${item.percentageOfRevenue.toFixed(2)}%` : '0%',
          item.module?.toUpperCase() || 'MANUAL',
          item.type || 'item',
          item.expandable ? 'Yes' : 'No'
        ]) || [])
      ])
    ];
    
    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedTableData);
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed P&L Table');
    
    // Module breakdown sheet
    const moduleBreakdown = [];
    const moduleTotals = new Map();
    
    tableData.forEach((section: any) => {
      section.items?.forEach((item: any) => {
        const module = item.module || 'MANUAL';
        if (!moduleTotals.has(module)) {
          moduleTotals.set(module, 0);
        }
        moduleTotals.set(module, moduleTotals.get(module) + (item.amount || 0));
      });
    });
    
    moduleBreakdown.push(['Module', 'Total Amount (KD)', 'Item Count']);
    moduleTotals.forEach((total, module) => {
      const itemCount = tableData.flatMap((s: any) => s.items || [])
        .filter((item: any) => (item.module || 'MANUAL') === module).length;
      moduleBreakdown.push([module, total.toLocaleString(), itemCount]);
    });
    
    const moduleSheet = XLSX.utils.aoa_to_sheet(moduleBreakdown);
    XLSX.utils.book_append_sheet(workbook, moduleSheet, 'Module Breakdown');
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="PnL_Detailed_Table_${period}_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting P&L to Excel:', error);
    res.status(500).json({ error: 'Failed to export P&L data to Excel' });
  }
};

// Export P&L data to PDF (HTML format for browser printing)
export const exportPnLToPDF = async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    // Get detailed P&L table data (not just summary)
    const tableData = await getPnLTableDataInternal(period as string, startDate as string, endDate as string);
    
    // Create HTML template
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Profit & Loss Statement - Detailed Table</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header p { color: #7f8c8d; margin: 5px 0; }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .summary-table th { background-color: #3498db; color: white; font-weight: bold; }
        .summary-table tr:nth-child(even) { background-color: #f2f2f2; }
        .section-header { background-color: #34495e !important; color: white !important; font-weight: bold; }
        .item-row { background-color: #f9f9f9; }
        .amount { text-align: right; font-weight: bold; }
        .positive { color: #27ae60; }
        .negative { color: #e74c3c; }
        .module-badge { 
          background-color: #e3f2fd; 
          color: #1976d2; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 11px; 
          font-weight: bold;
        }
        .footer { margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Profit & Loss Statement - Detailed Table</h1>
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <table class="summary-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount (KD)</th>
            <th>% of Revenue</th>
            <th>Source Module</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${tableData.map((section: any) => `
            <tr class="section-header">
              <td><strong>${section.category}</strong></td>
              <td class="amount ${section.subtotal >= 0 ? 'positive' : 'negative'}">
                ${section.subtotal?.toLocaleString() || '0'}
              </td>
              <td class="amount">${section.percentageOfRevenue ? section.percentageOfRevenue.toFixed(2) : '0'}%</td>
              <td><span class="module-badge">${section.items?.length || 0} Sources</span></td>
              <td>${section.type || 'section'}</td>
            </tr>
            ${section.items?.map((item: any) => `
              <tr class="item-row">
                <td style="padding-left: 20px;">${item.description}</td>
                <td class="amount ${item.amount >= 0 ? 'positive' : 'negative'}">
                  ${item.amount?.toLocaleString() || '0'}
                </td>
                <td class="amount">${item.percentageOfRevenue ? item.percentageOfRevenue.toFixed(2) : '0'}%</td>
                <td><span class="module-badge">${item.module?.toUpperCase() || 'MANUAL'}</span></td>
                <td>${item.type || 'item'}</td>
              </tr>
            `).join('') || ''}
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This detailed P&L table was generated automatically by the Financial Management System</p>
        <p>For questions or clarifications, please contact the Finance Department</p>
        <p class="no-print"><strong>To print as PDF:</strong> Press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF"</p>
      </div>
    </body>
    </html>
    `;
    
    // Set response headers for HTML
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="PnL_Detailed_Table_${period}_${new Date().toISOString().split('T')[0]}.html"`);
    
    res.send(html);
  } catch (error) {
    console.error('Error exporting P&L to PDF:', error);
    res.status(500).json({ error: 'Failed to export P&L data to PDF' });
  }
};

// Helper function to get P&L table data for export
async function getPnLTableDataInternal(period: string, startDate?: string, endDate?: string) {
  try {
    // Create a mock request object with the same structure as the actual API
    const mockReq = {
      query: {
        period,
        ...(startDate && { start: startDate }),
        ...(endDate && { end: endDate })
      }
    } as any;

    // Create a mock response object to capture the data
    let tableData: any = null;
    const mockRes = {
      json: (data: any) => { tableData = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    // Call the actual getPnLTable function
    await getPnLTable(mockReq, mockRes);

    if (!tableData) {
      throw new Error('Failed to retrieve P&L table data');
    }

    // Calculate percentage of revenue for each section and item
    const totalRevenue = tableData.find((section: any) => section.type === 'revenue')?.subtotal || 0;
    
    // Add percentage calculations to each section and item
    const enhancedTableData = tableData.map((section: any) => ({
      ...section,
      percentageOfRevenue: totalRevenue > 0 ? (Math.abs(section.subtotal || 0) / totalRevenue) * 100 : 0,
      items: section.items?.map((item: any) => ({
        ...item,
        percentageOfRevenue: totalRevenue > 0 ? (Math.abs(item.amount || 0) / totalRevenue) * 100 : 0
      })) || []
    }));

    return enhancedTableData;
  } catch (error) {
    console.error('Error in getPnLTableDataInternal:', error);
    // Return fallback data if there's an error
    return [
      {
        id: 'revenue',
        category: 'REVENUE',
        type: 'revenue',
        subtotal: 0,
        percentageOfRevenue: 0,
        items: []
      },
      {
        id: 'expenses',
        category: 'EXPENSES',
        type: 'expenses',
        subtotal: 0,
        percentageOfRevenue: 0,
        items: []
      }
    ];
  }
}

// Helper function to get P&L data for export
async function getVerticalPnLDataInternal(period: string, startDate?: string, endDate?: string) {
  try {
    // Create a mock request object with the same structure as the actual API
    const mockReq = {
      query: {
        period,
        ...(startDate && { start: startDate }),
        ...(endDate && { end: endDate })
      }
    } as any;

    // Create a mock response object to capture the data
    let pnlData: any = null;
    const mockRes = {
      json: (data: any) => { pnlData = data; },
      status: () => mockRes,
      send: () => {}
    } as any;

    // Call the actual getVerticalPnLData function
    await getVerticalPnLData(mockReq, mockRes);

    if (!pnlData) {
      throw new Error('Failed to retrieve P&L data');
    }

    // Transform the data to match the export format
    const { start, end } = getPeriodDates(period, startDate, endDate);
    
    // Calculate percentage of revenue for each section
    const totalRevenue = pnlData.summary?.revenue || 0;
    
    // Build the export data structure
    const exportData = [];
    
    // Revenue section
    if (pnlData.revenue) {
      const revenueItems = [];
      
      // Add individual revenue items
      if (pnlData.revenue.operatingRevenues > 0) {
        revenueItems.push({
          description: 'Operating Revenues',
          amount: pnlData.revenue.operatingRevenues,
          module: 'sales',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.rentalEquipmentRevenue > 0) {
        revenueItems.push({
          description: 'Rental Equipment Revenue',
          amount: pnlData.revenue.rentalEquipmentRevenue,
          module: 'assets',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.dsRevenue > 0) {
        revenueItems.push({
          description: 'DS Revenue',
          amount: pnlData.revenue.dsRevenue,
          module: 'operations',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.subCompaniesRevenue > 0) {
        revenueItems.push({
          description: 'Sub Companies Revenue',
          amount: pnlData.revenue.subCompaniesRevenue,
          module: 'sales',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.otherRevenue > 0) {
        revenueItems.push({
          description: 'Other Revenue',
          amount: pnlData.revenue.otherRevenue,
          module: 'sales',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.provisionEndService > 0) {
        revenueItems.push({
          description: 'Provision End Service',
          amount: pnlData.revenue.provisionEndService,
          module: 'hr',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.provisionImpairment > 0) {
        revenueItems.push({
          description: 'Provision Impairment',
          amount: pnlData.revenue.provisionImpairment,
          module: 'assets',
          type: 'revenue'
        });
      }
      
      if (pnlData.revenue.rebate > 0) {
        revenueItems.push({
          description: 'Rebate',
          amount: pnlData.revenue.rebate,
          module: 'sales',
          type: 'revenue'
        });
      }

      exportData.push({
        id: 'revenue',
        category: 'REVENUE',
        type: 'revenue',
        subtotal: totalRevenue,
        percentageOfRevenue: 100,
        items: revenueItems
      });
    }

    // Expenses section
    if (pnlData.expenses) {
      const expenseItems = [];
      
      // Add individual expense items
      if (pnlData.expenses.operationCost > 0) {
        expenseItems.push({
          description: 'Operation Cost',
          amount: -pnlData.expenses.operationCost,
          module: 'operations',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.rentalEquipmentCost > 0) {
        expenseItems.push({
          description: 'Rental Equipment Cost',
          amount: -pnlData.expenses.rentalEquipmentCost,
          module: 'assets',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.dsCost > 0) {
        expenseItems.push({
          description: 'DS Cost',
          amount: -pnlData.expenses.dsCost,
          module: 'operations',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.generalAdminExpenses > 0) {
        expenseItems.push({
          description: 'General Admin Expenses',
          amount: -pnlData.expenses.generalAdminExpenses,
          module: 'admin',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.staffCost > 0) {
        expenseItems.push({
          description: 'Staff Costs',
          amount: -pnlData.expenses.staffCost,
          module: 'hr',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.businessTripCost > 0) {
        expenseItems.push({
          description: 'Business Trip Costs',
          amount: -pnlData.expenses.businessTripCost,
          module: 'hr',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.overtimeCost > 0) {
        expenseItems.push({
          description: 'Overtime Costs',
          amount: -pnlData.expenses.overtimeCost,
          module: 'hr',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.tripAllowanceCost > 0) {
        expenseItems.push({
          description: 'Trip Allowance Costs',
          amount: -pnlData.expenses.tripAllowanceCost,
          module: 'hr',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.foodAllowanceCost > 0) {
        expenseItems.push({
          description: 'Food Allowance Costs',
          amount: -pnlData.expenses.foodAllowanceCost,
          module: 'hr',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.hseTrainingCost > 0) {
        expenseItems.push({
          description: 'HSE & Training Costs',
          amount: -pnlData.expenses.hseTrainingCost,
          module: 'hse',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.procurementCost > 0) {
        expenseItems.push({
          description: 'Procurement Costs',
          amount: -pnlData.expenses.procurementCost,
          module: 'procurement',
          type: 'expense'
        });
      }
      
      if (pnlData.expenses.serviceAgreementCost > 0) {
        expenseItems.push({
          description: 'Service Agreement Cost',
          amount: -pnlData.expenses.serviceAgreementCost,
          module: 'operations',
          type: 'expense'
        });
      }

      const totalExpenses = pnlData.expenses.total || 0;
      exportData.push({
        id: 'expenses',
        category: 'EXPENSES',
        type: 'expenses',
        subtotal: -totalExpenses,
        percentageOfRevenue: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0,
        items: expenseItems
      });
    }

    // EBITDA section
    if (pnlData.ebitida) {
      const ebitidaItems = [];
      
      if (pnlData.ebitida.financeCosts > 0) {
        ebitidaItems.push({
          description: 'Finance Costs',
          amount: -pnlData.ebitida.financeCosts,
          module: 'finance',
          type: 'expense'
        });
      }
      
      if (pnlData.ebitida.depreciation > 0) {
        ebitidaItems.push({
          description: 'Depreciation',
          amount: -pnlData.ebitida.depreciation,
          module: 'assets',
          type: 'expense'
        });
      }

      const ebitidaTotal = pnlData.ebitida.total || 0;
      exportData.push({
        id: 'ebitida',
        category: 'EBITDA',
        type: 'ebitida',
        subtotal: ebitidaTotal,
        percentageOfRevenue: totalRevenue > 0 ? (ebitidaTotal / totalRevenue * 100) : 0,
        items: ebitidaItems
      });
    }

    return exportData;
  } catch (error) {
    console.error('Error in getVerticalPnLDataInternal:', error);
    // Return fallback data if there's an error
    return [
      {
        id: 'revenue',
        category: 'REVENUE',
        type: 'revenue',
        subtotal: 0,
        percentageOfRevenue: 0,
        items: []
      },
      {
        id: 'expenses',
        category: 'EXPENSES',
        type: 'expenses',
        subtotal: 0,
        percentageOfRevenue: 0,
        items: []
      }
    ];
  }
}