import { Request, Response } from 'express';
import PurchaseOrder from '../models/PurchaseOrder';
import { generateSerial } from '../utils/serialUtils';

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const pos = await PurchaseOrder.find().populate('purchaseRequest').populate('vendor');
    res.json(pos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('purchaseRequest').populate('vendor');
    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(po);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const poData = req.body;
    // Use serialing system for poNumber and serial
    const docCode = 'PO';
    const dept = poData.department || 'PR';
    const serial = await generateSerial(docCode, dept, PurchaseOrder);
    poData.serial = serial;
    if (!poData.poNumber) {
      poData.poNumber = serial;
    }
    const po = new PurchaseOrder(poData);
    await po.save();
    res.status(201).json(po);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(po);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json({ message: 'Purchase order deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 