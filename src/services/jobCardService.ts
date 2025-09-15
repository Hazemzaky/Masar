import mongoose from 'mongoose';
import JobCard, { IJobCard } from '../models/JobCard';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';

export interface CreateJobCardData {
  maintenanceId: string;
  parts: Array<{ itemId: string; quantity: number }>;
  createdBy?: string;
  notes?: string;
}

export interface EditJobCardData {
  parts: Array<{ itemId: string; quantity: number }>;
  notes?: string;
}

/**
 * Create a new job card and reserve parts in inventory
 */
export const createJobCard = async (data: CreateJobCardData): Promise<IJobCard> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Check if maintenance exists
      const Maintenance = mongoose.model('Maintenance');
      const maintenance = await Maintenance.findById(data.maintenanceId).session(session);
      if (!maintenance) {
        throw new Error('Maintenance record not found');
      }

      // Validate and reserve parts
      for (const part of data.parts) {
        const inventoryItem = await InventoryItem.findById(part.itemId).session(session);
        if (!inventoryItem) {
          throw new Error(`Inventory item not found: ${part.itemId}`);
        }

        const availableQty = inventoryItem.quantity - inventoryItem.reservedQty;
        if (availableQty < part.quantity) {
          throw new Error(
            `Insufficient stock for ${inventoryItem.description}. Available: ${availableQty}, Required: ${part.quantity}`
          );
        }

        // Reserve the quantity
        inventoryItem.reservedQty += part.quantity;
        await inventoryItem.save({ session });
      }

      // Create job card
      const jobCardData = {
        ...data,
        parts: data.parts.map(part => ({
          itemId: new mongoose.Types.ObjectId(part.itemId),
          quantity: part.quantity
        })),
        createdBy: data.createdBy ? new mongoose.Types.ObjectId(data.createdBy) : undefined
      };

      const jobCard = new JobCard(jobCardData);
      await jobCard.save({ session });

      return jobCard;
    });

    // Return the created job card
    const jobCard = await JobCard.findOne({ maintenanceId: data.maintenanceId })
      .populate('maintenanceId')
      .populate('parts.itemId')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });
    
    return jobCard!;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Edit a job card and adjust part reservations
 */
export const editJobCard = async (jobCardId: string, data: EditJobCardData): Promise<IJobCard> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get current job card
      const currentJobCard = await JobCard.findById(jobCardId).session(session);
      if (!currentJobCard) {
        throw new Error('Job card not found');
      }

      if (currentJobCard.status === 'COMPLETED' || currentJobCard.status === 'CANCELLED') {
        throw new Error('Cannot edit completed or cancelled job card');
      }

      // Create maps for easy comparison
      const oldPartsMap = new Map();
      currentJobCard.parts.forEach(part => {
        oldPartsMap.set(part.itemId.toString(), part.quantity);
      });

      const newPartsMap = new Map();
      data.parts.forEach(part => {
        newPartsMap.set(part.itemId, part.quantity);
      });

      // Calculate differences and adjust reservations
      const allItemIds = new Set([...oldPartsMap.keys(), ...newPartsMap.keys()]);
      
      for (const itemId of allItemIds) {
        const oldQty = oldPartsMap.get(itemId) || 0;
        const newQty = newPartsMap.get(itemId) || 0;
        const difference = newQty - oldQty;

        if (difference !== 0) {
          const inventoryItem = await InventoryItem.findById(itemId).session(session);
          if (!inventoryItem) {
            throw new Error(`Inventory item not found: ${itemId}`);
          }

          if (difference > 0) {
            // Need to reserve more
            const availableQty = inventoryItem.quantity - inventoryItem.reservedQty;
            if (availableQty < difference) {
              throw new Error(
                `Insufficient stock for ${inventoryItem.description}. Available: ${availableQty}, Required: ${difference}`
              );
            }
            inventoryItem.reservedQty += difference;
          } else {
            // Need to release some reservations
            inventoryItem.reservedQty += difference; // difference is negative
            if (inventoryItem.reservedQty < 0) {
              inventoryItem.reservedQty = 0;
            }
          }

          await inventoryItem.save({ session });
        }
      }

      // Update job card
      currentJobCard.parts = data.parts.map(part => ({
        itemId: new mongoose.Types.ObjectId(part.itemId),
        quantity: part.quantity
      }));
      if (data.notes !== undefined) {
        currentJobCard.notes = data.notes;
      }
      
      await currentJobCard.save({ session });
    });

    // Return updated job card
    const jobCard = await JobCard.findById(jobCardId)
      .populate('maintenanceId')
      .populate('parts.itemId')
      .populate('createdBy', 'email');
    
    return jobCard!;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Cancel a job card and release all reserved parts
 */
export const cancelJobCard = async (jobCardId: string): Promise<IJobCard> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const jobCard = await JobCard.findById(jobCardId).session(session);
      if (!jobCard) {
        throw new Error('Job card not found');
      }

      if (jobCard.status === 'CANCELLED') {
        throw new Error('Job card is already cancelled');
      }

      // Release all reserved parts
      for (const part of jobCard.parts) {
        const inventoryItem = await InventoryItem.findById(part.itemId).session(session);
        if (inventoryItem) {
          inventoryItem.reservedQty -= part.quantity;
          if (inventoryItem.reservedQty < 0) {
            inventoryItem.reservedQty = 0;
          }
          await inventoryItem.save({ session });
        }
      }

      // Update job card status
      jobCard.status = 'CANCELLED';
      await jobCard.save({ session });
    });

    // Return updated job card
    const jobCard = await JobCard.findById(jobCardId)
      .populate('maintenanceId')
      .populate('parts.itemId')
      .populate('createdBy', 'email');
    
    return jobCard!;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Complete a job card and convert reserved parts to consumed
 */
export const completeJobCard = async (jobCardId: string, completedBy?: string): Promise<IJobCard> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const jobCard = await JobCard.findById(jobCardId).session(session);
      if (!jobCard) {
        throw new Error('Job card not found');
      }

      if (jobCard.status === 'COMPLETED') {
        throw new Error('Job card is already completed');
      }

      if (jobCard.status === 'CANCELLED') {
        throw new Error('Cannot complete a cancelled job card');
      }

      // Convert reserved parts to consumed
      for (const part of jobCard.parts) {
        const inventoryItem = await InventoryItem.findById(part.itemId).session(session);
        if (inventoryItem) {
          // Release reservation and consume from total
          inventoryItem.reservedQty -= part.quantity;
          inventoryItem.quantity -= part.quantity;
          
          if (inventoryItem.reservedQty < 0) {
            inventoryItem.reservedQty = 0;
          }
          if (inventoryItem.quantity < 0) {
            inventoryItem.quantity = 0;
          }
          
          await inventoryItem.save({ session });

          // Create inventory transaction record
          await InventoryTransaction.create([{
            item: part.itemId,
            type: 'outbound',
            quantity: part.quantity,
            date: new Date(),
            relatedMaintenance: jobCard.maintenanceId,
            user: completedBy ? new mongoose.Types.ObjectId(completedBy) : undefined,
            notes: `Consumed for job card completion`
          }], { session });
        }
      }

      // Update job card status
      jobCard.status = 'COMPLETED';
      jobCard.completedBy = completedBy ? new mongoose.Types.ObjectId(completedBy) : undefined;
      await jobCard.save({ session });
    });

    // Return updated job card
    const jobCard = await JobCard.findById(jobCardId)
      .populate('maintenanceId')
      .populate('parts.itemId')
      .populate('createdBy', 'email')
      .populate('completedBy', 'email');
    
    return jobCard!;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Get job card by ID
 */
export const getJobCard = async (jobCardId: string): Promise<IJobCard | null> => {
  return await JobCard.findById(jobCardId)
    .populate('maintenanceId')
    .populate('parts.itemId')
    .populate('createdBy', 'email')
    .populate('completedBy', 'email');
};

/**
 * Get all job cards with optional filters
 */
export const getJobCards = async (filters: {
  maintenanceId?: string;
  status?: string;
  createdBy?: string;
} = {}): Promise<IJobCard[]> => {
  const query: any = {};
  
  if (filters.maintenanceId) {
    query.maintenanceId = filters.maintenanceId;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.createdBy) {
    query.createdBy = filters.createdBy;
  }

  return await JobCard.find(query)
    .populate('maintenanceId')
    .populate('parts.itemId')
    .populate('createdBy', 'email')
    .populate('completedBy', 'email')
    .sort({ createdAt: -1 });
};

/**
 * Delete a job card (only if not completed or cancelled)
 */
export const deleteJobCard = async (jobCardId: string): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const jobCard = await JobCard.findById(jobCardId).session(session);
      if (!jobCard) {
        throw new Error('Job card not found');
      }

      if (jobCard.status === 'COMPLETED' || jobCard.status === 'CANCELLED') {
        throw new Error('Cannot delete completed or cancelled job card');
      }

      // Release all reserved parts
      for (const part of jobCard.parts) {
        const inventoryItem = await InventoryItem.findById(part.itemId).session(session);
        if (inventoryItem) {
          inventoryItem.reservedQty -= part.quantity;
          if (inventoryItem.reservedQty < 0) {
            inventoryItem.reservedQty = 0;
          }
          await inventoryItem.save({ session });
        }
      }

      // Delete job card
      await JobCard.findByIdAndDelete(jobCardId).session(session);
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};
