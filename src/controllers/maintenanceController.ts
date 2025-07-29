import { Request, Response } from 'express';
import Maintenance from '../models/Maintenance';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';
import { AuthRequest } from '../middleware/auth';

export const createMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduledDate, scheduledTime, completedDate, completedTime, ...rest } = req.body;
    
    const maintenanceData = {
      ...rest,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      scheduledTime: scheduledTime || '',
      completedDate: completedDate ? new Date(completedDate) : undefined,
      completedTime: completedTime || undefined,
      createdBy: req.user?.userId
    };
    
    const maintenance = new Maintenance(maintenanceData);
    await maintenance.save();
    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMaintenances = async (req: Request, res: Response) => {
  try {
    const maintenances = await Maintenance.find()
      .populate('asset')
      .populate('createdBy', 'email')
      .populate('completedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(maintenances);
  } catch (error) {
    console.error('Error fetching maintenances:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMaintenance = async (req: Request, res: Response) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('asset')
      .populate('createdBy', 'email')
      .populate('completedBy', 'email');
    if (!maintenance) {
      res.status(404).json({ message: 'Maintenance not found' });
      return;
    }
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduledDate, scheduledTime, completedDate, completedTime, ...rest } = req.body;
    
    const updateData = {
      ...rest,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      scheduledTime: scheduledTime || undefined,
      completedDate: completedDate ? new Date(completedDate) : undefined,
      completedTime: completedTime || undefined,
    };
    
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('asset');
    
    if (!maintenance) {
      res.status(404).json({ message: 'Maintenance not found' });
      return;
    }
    res.json(maintenance);
  } catch (error) {
    console.error('Error updating maintenance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteMaintenance = async (req: Request, res: Response) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      res.status(404).json({ message: 'Maintenance not found' });
      return;
    }
    res.json({ message: 'Maintenance deleted' });
  } catch (error) {
    console.error('Error deleting maintenance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const completeMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { status, completedDate, completedTime, totalMaintenanceTime, cancellationReason } = req.body;
    
    // If cancelling, update status and cancellationReason
    if (status === 'cancelled') {
      const maintenance = await Maintenance.findByIdAndUpdate(
        req.params.id,
        {
          status: 'cancelled',
          cancellationReason: cancellationReason || '',
        },
        { new: true }
      ).populate('asset');
      
      if (!maintenance) {
        res.status(404).json({ message: 'Maintenance not found' });
        return;
      }
      return res.json(maintenance);
    }
    
    const updateData: any = {
      status,
      totalMaintenanceTime,
      completedBy: req.user?.userId
    };
    
    // Only update completion date/time if provided
    if (completedDate) {
      updateData.completedDate = new Date(completedDate);
    }
    if (completedTime) {
      updateData.completedTime = completedTime;
    }
    
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('asset');
    
    if (!maintenance) {
      res.status(404).json({ message: 'Maintenance not found' });
      return;
    }

    // Handle inventory deduction when maintenance is completed
    if (status === 'completed' && maintenance.parts && maintenance.parts.length > 0) {
      console.log('Processing inventory deduction for completed maintenance:', maintenance._id);
      console.log('Maintenance parts:', maintenance.parts);
      
      for (const part of maintenance.parts) {
        try {
          console.log('Processing part:', part);
          const inventoryItem = await InventoryItem.findById(part.item);
          if (!inventoryItem) {
            console.error(`Inventory item not found for part: ${part.item}`);
            continue;
          }

          console.log(`Found inventory item: ${inventoryItem.description}, current quantity: ${inventoryItem.quantity}`);

          // Check if sufficient stock is available
          if (inventoryItem.quantity < part.quantity) {
            console.error(`Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity}, Required: ${part.quantity}`);
            return res.status(400).json({ 
              message: `Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity} ${inventoryItem.uom}, Required: ${part.quantity} ${inventoryItem.uom}` 
            });
          }

          // Deduct quantity from inventory
          const oldQuantity = inventoryItem.quantity;
          inventoryItem.quantity -= part.quantity;
          await inventoryItem.save();

          console.log(`Successfully deducted ${part.quantity} ${inventoryItem.uom} of ${inventoryItem.description}. Old quantity: ${oldQuantity}, New quantity: ${inventoryItem.quantity}`);

          // Create inventory transaction record
          await InventoryTransaction.create({
            item: part.item,
            type: 'outbound',
            quantity: part.quantity,
            date: new Date(),
            relatedMaintenance: maintenance._id,
            user: req.user?.userId,
            notes: `Withdrawn for maintenance: ${maintenance.description}`
          });

          console.log(`Successfully deducted ${part.quantity} ${inventoryItem.uom} of ${inventoryItem.description}`);
        } catch (error: unknown) {
          console.error('Error processing inventory deduction for part:', part, error);
          return res.status(500).json({ 
            message: 'Error processing inventory deduction', 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      console.log('Inventory deduction completed successfully for maintenance:', maintenance._id);
    }
    
    res.json(maintenance);
  } catch (error) {
    console.error('Error completing maintenance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const trackDowntime = async (req: Request, res: Response) => {
  try {
    const { downtimeHours } = req.body;
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { downtimeHours },
      { new: true }
    );
    
    if (!maintenance) {
      res.status(404).json({ message: 'Maintenance not found' });
      return;
    }
    
    res.json(maintenance);
  } catch (error) {
    console.error('Error tracking downtime:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 