import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
      { id: 'rebate', description: 'Rebate', type: 'revenue', module: 'sales' },
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
      { id: 'provision_credit_loss', description: 'Provision for Expected Credit Loss (Manual Entry)', type: 'expense', module: 'finance' },
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
  EBITIDA: {
    id: 'ebitida',
    category: 'EBITIDA',
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
    switch (period) {
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'half_yearly':
        const half = Math.floor(now.getMonth() / 6);
        start = new Date(now.getFullYear(), half * 6, 1);
        end = new Date(now.getFullYear(), (half + 1) * 6, 0);
        break;
      case 'yearly':
      default:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
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

// Manual entry values - these would come from a database in production
const MANUAL_ENTRIES: { [key: string]: number } = {
  rebate: 0,
  subCompaniesRevenue: 0,
  otherRevenue: 0,
  provisionEndService: 0,
  provisionImpairment: 0,
  dsRevenue: 0,
  rentalEquipmentCost: 0,
  dsCost: 0,
  generalAdminExpenses: 0,
  provisionCreditLoss: 0,
  serviceAgreementCost: 0,
  gainSellingProducts: 0,
  financeCosts: 0
};

// Function to get manual entry value
function getManualEntryValue(itemId: string, period: string, startDate: Date, endDate: Date): number {
  // In production, this would query a database for manual entries
  // For now, return the default value
  return MANUAL_ENTRIES[itemId] || 0;
}

// Function to update manual entry value
function updateManualEntryValue(itemId: string, amount: number): void {
  if (MANUAL_ENTRIES.hasOwnProperty(itemId)) {
    MANUAL_ENTRIES[itemId] = amount;
  }
}

// Endpoint to update manual PnL entries
export const updateManualPnLEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId, amount, period, startDate, endDate, notes } = req.body;
    
    if (!itemId || typeof amount !== 'number') {
      res.status(400).json({ error: 'Invalid itemId or amount' });
      return;
    }

    // Update the manual entry value
    updateManualEntryValue(itemId, amount);
    
    res.json({ 
      success: true, 
      message: 'Manual PnL entry updated successfully',
      itemId,
      amount,
      period,
      startDate,
      endDate,
      notes
    });
  } catch (error) {
    console.error('Error updating manual PnL entry:', error);
    res.status(500).json({ error: 'Failed to update manual PnL entry' });
  }
};

// Endpoint to get all manual PnL entries
export const getManualPnLEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const entries = Object.entries(MANUAL_ENTRIES).map(([itemId, amount]) => ({
      itemId,
      amount,
      description: VERTICAL_PNL_STRUCTURE[itemId as keyof typeof VERTICAL_PNL_STRUCTURE]?.items?.find(item => item.id === itemId)?.description || itemId
    }));
    
    res.json(entries);
  } catch (error) {
    console.error('Error getting manual PnL entries:', error);
    res.status(500).json({ error: 'Failed to get manual PnL entries' });
  }
};

// Main P&L Summary endpoint - Updated for vertical structure
export const getPnLSummary = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

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
    
    // Manual entries (these would come from a manual entry system)
    const rebate = getManualEntryValue('rebate', filters.period, startDate, endDate);
    const subCompaniesRevenue = getManualEntryValue('subCompaniesRevenue', filters.period, startDate, endDate);
    const otherRevenue = getManualEntryValue('otherRevenue', filters.period, startDate, endDate);
    const provisionEndService = getManualEntryValue('provisionEndService', filters.period, startDate, endDate);
    const provisionImpairment = getManualEntryValue('provisionImpairment', filters.period, startDate, endDate);
    
    // Calculate net operating revenue and total revenue
    const netOperatingRevenue = operatingRevenues + rebate;
    const totalRevenue = netOperatingRevenue + rentalEquipmentRevenue + dsRevenue + subCompaniesRevenue + 
                        otherRevenue + provisionEndService + provisionImpairment;

    // 2. EXPENSES SECTION
    const expensesData = await Promise.all([
      // Operation Cost - from FuelLog, Maintenance, etc.
      Promise.all([
        FuelLog.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
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
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              maintenanceCost: { $sum: '$cost' }
            }
          }
        ])
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
            date: { $gte: startDate, $lte: endDate },
            operationType: 'ds'
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
    const rentalEquipmentCost = expensesData[1][0]?.rentalEquipmentCost || 0;
    const dsCost = expensesData[2][0]?.dsCost || 0;
    const staffCost = expensesData[3][0]?.staffCost || 0;
    const procurementCost = expensesData[4][0]?.procurementCost || 0;
    
    // Manual entries
    const generalAdminExpenses = getManualEntryValue('generalAdminExpenses', filters.period, startDate, endDate);
    const provisionCreditLoss = getManualEntryValue('provisionCreditLoss', filters.period, startDate, endDate);
    const serviceAgreementCost = getManualEntryValue('serviceAgreementCost', filters.period, startDate, endDate);
    
    // Calculate total expenses
    const totalExpenses = operationCost + rentalEquipmentCost + dsCost + generalAdminExpenses + 
                         staffCost + provisionCreditLoss + serviceAgreementCost;

    // 3. INCOME, EXPENSES AND OTHER ITEMS
    const gainSellingProducts = getManualEntryValue('gainSellingProducts', filters.period, startDate, endDate);

    // 4. EBITIDA
    const financeCosts = getManualEntryValue('financeCosts', filters.period, startDate, endDate);
    
    // Calculate depreciation with amortization
    const depreciationData = await Asset.aggregate([
      {
        $match: {
          purchaseDate: { $lte: endDate }
        }
      },
      {
        $project: {
          monthlyDepreciation: { $divide: ['$purchasePrice', { $multiply: ['$usefulLife', 12] }] },
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

    // Build response with new structure
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
        provisionCreditLoss,
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
      netProfit: ebitida
    };

    res.json(pnlSummary);
  } catch (error) {
    console.error('Error in getPnLSummary:', error);
    res.status(500).json({ error: 'Failed to generate P&L summary' });
  }
};

// P&L Table with detailed line items - Updated for vertical structure
export const getPnLTable = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate } = filters;

    // Get account mappings
    const accountMappings = await AccountMapping.find({ isActive: true });

    // Get actual data for calculations
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
      // Expenses data
      Promise.all([
        FuelLog.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
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
            monthlyDepreciation: { $divide: ['$purchasePrice', { $multiply: ['$usefulLife', 12] }] },
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
    const depreciation = depreciationData[0]?.depreciation || 0;

    // Manual entries (these would come from a manual entry system)
    const rebate = getManualEntryValue('rebate', filters.period, startDate, endDate);
    const subCompaniesRevenue = getManualEntryValue('subCompaniesRevenue', filters.period, startDate, endDate);
    const otherRevenue = getManualEntryValue('otherRevenue', filters.period, startDate, endDate);
    const provisionEndService = getManualEntryValue('provisionEndService', filters.period, startDate, endDate);
    const provisionImpairment = getManualEntryValue('provisionImpairment', filters.period, startDate, endDate);
    const dsRevenue = getManualEntryValue('dsRevenue', filters.period, startDate, endDate);
    const rentalEquipmentCost = getManualEntryValue('rentalEquipmentCost', filters.period, startDate, endDate);
    const dsCost = getManualEntryValue('dsCost', filters.period, startDate, endDate);
    const generalAdminExpenses = getManualEntryValue('generalAdminExpenses', filters.period, startDate, endDate);
    const provisionCreditLoss = getManualEntryValue('provisionCreditLoss', filters.period, startDate, endDate);
    const serviceAgreementCost = getManualEntryValue('serviceAgreementCost', filters.period, startDate, endDate);
    const gainSellingProducts = getManualEntryValue('gainSellingProducts', filters.period, startDate, endDate);
    const financeCosts = getManualEntryValue('financeCosts', filters.period, startDate, endDate);

    // Calculate summary values
    const netOperatingRevenue = operatingRevenues + rebate;
    const totalRevenue = netOperatingRevenue + rentalEquipmentRevenue + dsRevenue + subCompaniesRevenue + 
                        otherRevenue + provisionEndService + provisionImpairment;
    const totalExpenses = operationCost + rentalEquipmentCost + dsCost + generalAdminExpenses + 
                         staffCost + provisionCreditLoss + serviceAgreementCost;
    const ebitida = totalRevenue - totalExpenses + gainSellingProducts - financeCosts - depreciation;

    // Build P&L table structure using VERTICAL_PNL_STRUCTURE
    const pnlTable = Object.values(VERTICAL_PNL_STRUCTURE).map(section => {
      const sectionData = {
        id: section.id,
        category: section.category,
        items: section.items.map(item => {
          let amount = 0;
          let trend = 'neutral';
          let expandable = false;

          // Map item IDs to actual values
          switch (item.id) {
            case 'operating_revenues':
              amount = operatingRevenues;
              trend = 'up';
              break;
            case 'rebate':
              amount = rebate;
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
            case 'provision_credit_loss':
              amount = provisionCreditLoss;
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
        type: section.id === 'revenue' ? 'revenue' : 'expense'
      };

      // Calculate section subtotal
      if (section.id === 'revenue') {
        sectionData.subtotal = totalRevenue;
      } else if (section.id === 'expenses') {
        sectionData.subtotal = totalExpenses;
      } else if (section.id === 'income_expenses_other') {
        sectionData.subtotal = gainSellingProducts;
      } else if (section.id === 'ebitida') {
        sectionData.subtotal = ebitida;
      }

      return sectionData;
    });

    res.json(pnlTable);
  } catch (error) {
    console.error('Error in getPnLTable:', error);
    res.status(500).json({ error: 'Failed to generate P&L table' });
  }
};

// P&L Charts data
export const getPnLCharts = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate, period } = filters;

    const periods = calculatePeriodBreakdown(startDate, endDate, period);

    // Generate chart data for each period
    const chartData = await Promise.all(periods.map(async (period) => {
      const periodStart = period.start;
      const periodEnd = period.end;

      const [revenue, expenses] = await Promise.all([
        Invoice.aggregate([
          { $match: { invoiceDate: { $gte: periodStart, $lte: periodEnd }, status: { $in: ['approved', 'sent', 'paid'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Expense.aggregate([
          { $match: { date: { $gte: periodStart, $lte: periodEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      return {
        period: period.label,
        revenue: revenue[0]?.total || 0,
        expenses: expenses[0]?.total || 0,
        netProfit: (revenue[0]?.total || 0) - (expenses[0]?.total || 0)
      };
    }));

    // Revenue vs Expense vs Net Profit chart
    const revenueVsExpenseData = chartData.map(item => ({
      period: item.period,
      revenue: item.revenue,
      expenses: item.expenses,
      netProfit: item.netProfit
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

// P&L Analysis with insights
export const getPnLAnalysis = async (req: Request, res: Response) => {
  try {
    const filters = getFilters(req);
    const { startDate, endDate } = filters;

    // Generate analysis insights
    const analysis: {
      alerts: Array<{ type: string; message: string; severity: string }>;
      trends: Array<{ description: string }>;
      recommendations: string[];
    } = {
      alerts: [],
      trends: [],
      recommendations: []
    };

    // Cost center analysis
    const costCenterData = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Identify rising cost centers
    costCenterData.slice(0, 3).forEach((item, index) => {
      if (index === 0) {
        analysis.alerts.push({
          type: 'warning',
          message: `Highest cost center: ${item._id} (KD ${item.total.toLocaleString()})`,
          severity: 'medium'
        });
      }
    });

    // Margin analysis
    const [revenue, expenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, status: { $in: ['approved', 'sent', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;
    const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    if (margin < 20) {
      analysis.alerts.push({
        type: 'error',
        message: `Low profit margin: ${margin.toFixed(1)}%. Consider cost optimization.`,
        severity: 'high'
      });
    }

    // Add recommendations
    analysis.recommendations = [
      'Review high-cost procurement items for bulk purchasing opportunities',
      'Analyze fuel consumption patterns for route optimization',
      'Consider preventive maintenance to reduce repair costs',
      'Evaluate staff training ROI and optimize training programs'
    ];

    res.json(analysis);

  } catch (error: any) {
    console.error('Error in getPnLAnalysis:', error);
    res.status(500).json({ message: 'Failed to generate P&L analysis', error: error.message });
  }
}; 