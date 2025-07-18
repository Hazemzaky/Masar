import { Request, Response } from 'express';
import GoodsReceipt from '../models/GoodsReceipt';

export const getGoodsReceipts = async (req: Request, res: Response) => {
  try {
    const grns = await GoodsReceipt.find().populate('purchaseOrder').populate('receivedBy');
    res.json(grns);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGoodsReceiptById = async (req: Request, res: Response) => {
  try {
    const grn = await GoodsReceipt.findById(req.params.id).populate('purchaseOrder').populate('receivedBy');
    if (!grn) {
      return res.status(404).json({ message: 'Goods receipt not found' });
    }
    res.json(grn);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const grnData = req.body;
    if (req.files && Array.isArray(req.files)) {
      grnData.documents = req.files.map((file: any) => file.path);
    }
    const grn = new GoodsReceipt(grnData);
    await grn.save();
    res.status(201).json(grn);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const grn = await GoodsReceipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grn) {
      return res.status(404).json({ message: 'Goods receipt not found' });
    }
    res.json(grn);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const grn = await GoodsReceipt.findByIdAndDelete(req.params.id);
    if (!grn) {
      return res.status(404).json({ message: 'Goods receipt not found' });
    }
    res.json({ message: 'Goods receipt deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 