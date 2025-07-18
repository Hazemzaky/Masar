import { Request, Response } from 'express';
import PurchaseRequest from '../models/PurchaseRequest';

export const getPurchaseRequests = async (req: Request, res: Response) => {
  try {
    const prs = await PurchaseRequest.find().populate('requester');
    res.json(prs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseRequestById = async (req: Request, res: Response) => {
  try {
    const pr = await PurchaseRequest.findById(req.params.id).populate('requester');
    if (!pr) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }
    res.json(pr);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseRequest = async (req: Request, res: Response) => {
  try {
    const prData = req.body;
    if (req.files && Array.isArray(req.files)) {
      prData.attachments = req.files.map((file: any) => file.path);
    }
    const pr = new PurchaseRequest(prData);
    await pr.save();
    res.status(201).json(pr);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePurchaseRequest = async (req: Request, res: Response) => {
  try {
    const pr = await PurchaseRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pr) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }
    res.json(pr);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePurchaseRequest = async (req: Request, res: Response) => {
  try {
    const pr = await PurchaseRequest.findByIdAndDelete(req.params.id);
    if (!pr) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }
    res.json({ message: 'Purchase request deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 