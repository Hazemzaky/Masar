import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';
import { generateSerial } from '../utils/serialUtils';

export function createItem(req: Request, res: Response) {
  (async () => {
    try {
      // Accept costType and depreciationDuration from req.body
      const {
        description, type, rop, quantity, uom, location, rack, aisle, bin, warranty, warrantyPeriod, warrantyStartDate, purchaseCost, supplier, relatedAsset, notes, status,
        costType, depreciationDuration
      } = req.body;
      // Generate serial number
      const department = (location && typeof location === 'string') ? location.substring(0, 2).toUpperCase() : 'ST';
      const serial = await generateSerial('IN', department, InventoryItem);
      const item = new InventoryItem({
        description, type, rop, quantity, uom, location, rack, aisle, bin, warranty, warrantyPeriod, warrantyStartDate, purchaseCost, supplier, relatedAsset, notes, status,
        costType, depreciationDuration, serial
      });
      await item.save();
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function getItems(req: Request, res: Response) {
  (async () => {
    try {
      const items = await InventoryItem.find();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function getItem(req: Request, res: Response) {
  (async () => {
    try {
      const item = await InventoryItem.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function updateItem(req: Request, res: Response) {
  (async () => {
    try {
      // Accept costType and depreciationDuration from req.body
      const updateData = { ...req.body };
      const item = await InventoryItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function deleteItem(req: Request, res: Response) {
  (async () => {
    try {
      const item = await InventoryItem.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found' });
      res.json({ message: 'Item deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function createTransaction(req: Request, res: Response) {
  (async () => {
    try {
      const { type, parts, maintenanceId, ...rest } = req.body;
      
      // Handle multiple parts for maintenance
      if (parts && Array.isArray(parts)) {
        const transactions = [];
        
        for (const part of parts) {
          const { item, quantity, notes } = part;
          const inventoryItem = await InventoryItem.findById(item);
          if (!inventoryItem) {
            return res.status(404).json({ message: `Item ${item} not found` });
          }
          
          let newQty = inventoryItem.quantity;
          if (type === 'inbound') newQty += quantity;
          else if (type === 'outbound') newQty -= quantity;
          else if (type === 'adjustment') newQty = quantity;
          
          if (newQty < 0) {
            return res.status(400).json({ 
              message: `Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity} ${inventoryItem.uom}` 
            });
          }
          
          inventoryItem.quantity = newQty;
          await inventoryItem.save();
          
          const transaction = new InventoryTransaction({ 
            item, 
            type, 
            quantity, 
            notes,
            relatedMaintenance: maintenanceId,
            ...rest 
          });
          await transaction.save();
          transactions.push(transaction);
        }
        
        return res.status(201).json(transactions);
      }
      
      // Handle single item transaction (original logic)
      const { item, quantity, ...singleRest } = req.body;
      const inventoryItem = await InventoryItem.findById(item);
      if (!inventoryItem) return res.status(404).json({ message: 'Item not found' });
      
      let newQty = inventoryItem.quantity;
      if (type === 'inbound') newQty += quantity;
      else if (type === 'outbound') newQty -= quantity;
      else if (type === 'adjustment') newQty = quantity;
      
      if (newQty < 0) return res.status(400).json({ message: 'Insufficient stock' });
      
      inventoryItem.quantity = newQty;
      await inventoryItem.save();
      
      const transaction = new InventoryTransaction({ item, type, quantity, ...singleRest });
      await transaction.save();
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function getTransactions(req: Request, res: Response) {
  (async () => {
    try {
      const filter: any = {};
      if (req.query.item) filter.item = req.query.item;
      if (req.query.type) filter.type = req.query.type;
      const txns = await InventoryTransaction.find(filter).populate('item').populate('relatedAsset').populate('relatedMaintenance').populate('user');
      res.json(txns);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
}

export function getItemTransactions(req: Request, res: Response) {
  (async () => {
    try {
      const txns = await InventoryTransaction.find({ item: req.params.id }).populate('item').populate('relatedAsset').populate('relatedMaintenance').populate('user');
      res.json(txns);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  })();
} 