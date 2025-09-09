import { Request, Response } from 'express';
import ManualPnLEntry from '../models/ManualPnLEntry';
import mongoose from 'mongoose';

// Interface for manual entry data
interface ManualEntryData {
  itemId: string;
  description: string;
  amount: number;
  category: 'revenue' | 'expense' | 'other_income';
  type: 'revenue' | 'expense';
  notes?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
}

// Default manual entries configuration
const DEFAULT_MANUAL_ENTRIES: ManualEntryData[] = [
  // Revenue Items
  {
    itemId: 'rebate',
    description: 'Rebate',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Rebates received from suppliers and partners',
    period: 'monthly'
  },
  {
    itemId: 'sub_companies_revenue',
    description: 'Sub Companies Revenue',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Revenue from subsidiary companies',
    period: 'monthly'
  },
  {
    itemId: 'other_revenue',
    description: 'Other Revenue',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Other miscellaneous revenue sources',
    period: 'monthly'
  },
  {
    itemId: 'provision_end_service',
    description: 'Provision End Service',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Reversal of end of service provisions',
    period: 'monthly'
  },
  {
    itemId: 'provision_impairment',
    description: 'Provision Impairment',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Reversal of impairment provisions',
    period: 'monthly'
  },
  {
    itemId: 'ds_revenue',
    description: 'DS Revenue',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Direct sales revenue',
    period: 'monthly'
  },
  {
    itemId: 'gain_selling_products',
    description: 'Gain Selling Products',
    amount: 0,
    category: 'revenue',
    type: 'revenue',
    notes: 'Gains from selling products and services',
    period: 'monthly'
  },
  // Expense Items
  {
    itemId: 'rental_equipment_cost',
    description: 'Rental Equipment Cost',
    amount: 0,
    category: 'expense',
    type: 'expense',
    notes: 'Cost of rental equipment and machinery',
    period: 'monthly'
  },
  {
    itemId: 'ds_cost',
    description: 'DS Cost',
    amount: 0,
    category: 'expense',
    type: 'expense',
    notes: 'Direct sales costs',
    period: 'monthly'
  },
  {
    itemId: 'general_admin_expenses',
    description: 'General Admin Expenses',
    amount: 0,
    category: 'expense',
    type: 'expense',
    notes: 'General administrative expenses',
    period: 'monthly'
  },
  {
    itemId: 'provision_credit_loss',
    description: 'Provision Credit Loss',
    amount: 0,
    category: 'expense',
    type: 'expense',
    notes: 'Provision for credit losses and bad debts',
    period: 'monthly'
  },
  {
    itemId: 'service_agreement_cost',
    description: 'Service Agreement Cost',
    amount: 0,
    category: 'expense',
    type: 'expense',
    notes: 'Cost of service agreements and contracts',
    period: 'monthly'
  },
  {
    itemId: 'finance_costs',
    description: 'Finance Costs',
    amount: 0,
    category: 'expense',
    type: 'expense',
    notes: 'Finance costs, interest, and banking charges',
    period: 'monthly'
  }
];

// Initialize default manual entries
export const initializeDefaultEntries = async () => {
  try {
    console.log('Initializing default manual entries...');
    
    // Check if entries already exist
    const existingEntries = await ManualPnLEntry.countDocuments();
    
    if (existingEntries === 0) {
      console.log('No manual entries found, creating default entries...');
      
      const entriesToCreate = DEFAULT_MANUAL_ENTRIES.map(entry => ({
        ...entry,
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        startDate: new Date(),
        endDate: new Date()
      }));

      await ManualPnLEntry.insertMany(entriesToCreate);
      console.log(`Successfully created ${entriesToCreate.length} default manual entries`);
    } else {
      console.log(`Found ${existingEntries} existing manual entries`);
    }
  } catch (error: any) {
    console.error('Error initializing default manual entries:', error);
    throw error;
  }
};

// Get all manual entries
export const getAllManualEntries = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all manual entries...');
    
    const entries = await ManualPnLEntry.find({ isActive: true })
      .sort({ category: 1, description: 1 });
    
    console.log(`Found ${entries.length} manual entries`);
    
    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching manual entries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch manual entries', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Get single manual entry by itemId
export const getManualEntry = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    
    console.log(`Fetching manual entry: ${itemId}`);
    
    const entry = await ManualPnLEntry.findOne({ itemId, isActive: true });
    
    if (!entry) {
      res.status(404).json({ error: 'Manual entry not found' });
      return;
    }
    
    res.json(entry);
  } catch (error: any) {
    console.error('Error fetching manual entry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch manual entry', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Create new manual entry
export const createManualEntry = async (req: Request, res: Response) => {
  try {
    const entryData: ManualEntryData = req.body;
    
    console.log('Creating new manual entry:', entryData);
    
    // Validate required fields
    if (!entryData.itemId || !entryData.description || entryData.amount === undefined) {
      res.status(400).json({ error: 'Missing required fields: itemId, description, amount' });
      return;
    }
    
    // Check if entry already exists
    const existingEntry = await ManualPnLEntry.findOne({ itemId: entryData.itemId });
    if (existingEntry) {
      res.status(409).json({ error: 'Manual entry with this itemId already exists' });
      return;
    }
    
    const newEntry = new ManualPnLEntry({
      ...entryData,
      createdBy: (req as any).user?.id || 'system',
      updatedBy: (req as any).user?.id || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    await newEntry.save();
    
    console.log('Manual entry created successfully:', newEntry.itemId);
    
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

// Update manual entry
export const updateManualEntry = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;
    
    console.log(`Updating manual entry: ${itemId}`, updateData);
    
    const entry = await ManualPnLEntry.findOne({ itemId, isActive: true });
    
    if (!entry) {
      res.status(404).json({ error: 'Manual entry not found' });
      return;
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        (entry as any)[key] = updateData[key];
      }
    });
    
    entry.updatedBy = (req as any).user?.id || 'system';
    entry.updatedAt = new Date();
    
    await entry.save();
    
    console.log('Manual entry updated successfully:', itemId);
    
    res.json({
      success: true,
      message: 'Manual entry updated successfully',
      data: entry
    });
  } catch (error: any) {
    console.error('Error updating manual entry:', error);
    res.status(500).json({ 
      error: 'Failed to update manual entry', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Delete manual entry (soft delete)
export const deleteManualEntry = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    
    console.log(`Deleting manual entry: ${itemId}`);
    
    const entry = await ManualPnLEntry.findOne({ itemId, isActive: true });
    
    if (!entry) {
      res.status(404).json({ error: 'Manual entry not found' });
      return;
    }
    
    // Soft delete
    entry.isActive = false;
    entry.updatedBy = (req as any).user?.id || 'system';
    entry.updatedAt = new Date();
    
    await entry.save();
    
    console.log('Manual entry deleted successfully:', itemId);
    
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

// Bulk update multiple entries
export const bulkUpdateEntries = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    
    console.log('Bulk updating manual entries:', updates);
    
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Updates must be an array' });
      return;
    }
    
    const results = [];
    
    for (const update of updates) {
      const { itemId, ...updateData } = update;
      
      const entry = await ManualPnLEntry.findOne({ itemId, isActive: true });
      
      if (entry) {
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined) {
            (entry as any)[key] = updateData[key];
          }
        });
        
        entry.updatedBy = (req as any).user?.id || 'system';
        entry.updatedAt = new Date();
        
        await entry.save();
        results.push({ itemId, success: true });
      } else {
        results.push({ itemId, success: false, error: 'Entry not found' });
      }
    }
    
    console.log('Bulk update completed:', results);
    
    res.json({
      success: true,
      message: 'Bulk update completed',
      results
    });
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ 
      error: 'Failed to perform bulk update', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Get manual entries summary for P&L integration
export const getManualEntriesSummary = async (req: Request, res: Response) => {
  try {
    console.log('Fetching manual entries summary for P&L integration...');
    
    const entries = await ManualPnLEntry.find({ isActive: true });
    
    const summary = {
      totalRevenue: 0,
      totalExpenses: 0,
      netImpact: 0,
      revenueItems: [] as any[],
      expenseItems: [] as any[],
      totalEntries: entries.length
    };
    
    entries.forEach(entry => {
      if (entry.type === 'revenue') {
        summary.totalRevenue += entry.amount;
        summary.revenueItems.push({
          itemId: entry.itemId,
          description: entry.description,
          amount: entry.amount,
          category: entry.category
        });
      } else if (entry.type === 'expense') {
        summary.totalExpenses += entry.amount;
        summary.expenseItems.push({
          itemId: entry.itemId,
          description: entry.description,
          amount: entry.amount,
          category: entry.category
        });
      }
    });
    
    summary.netImpact = summary.totalRevenue - summary.totalExpenses;
    
    console.log('Manual entries summary:', summary);
    
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching manual entries summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch manual entries summary', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Reset all entries to default values
export const resetToDefaults = async (req: Request, res: Response) => {
  try {
    console.log('Resetting all manual entries to default values...');
    
    // Delete all existing entries
    await ManualPnLEntry.deleteMany({});
    
    // Create default entries
    await initializeDefaultEntries();
    
    console.log('Manual entries reset to defaults successfully');
    
    res.json({
      success: true,
      message: 'Manual entries reset to default values successfully'
    });
  } catch (error: any) {
    console.error('Error resetting to defaults:', error);
    res.status(500).json({ 
      error: 'Failed to reset to defaults', 
      details: error?.message || 'Unknown error'
    });
  }
};

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const count = await ManualPnLEntry.countDocuments({ isActive: true });
    
    res.json({
      status: 'healthy',
      totalEntries: count,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};
