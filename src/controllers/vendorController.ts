import { Request, Response } from 'express';
import Vendor from '../models/Vendor';

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const vendorData = req.body;
    if (req.file) {
      vendorData.tradeLicense = req.file.path;
    }
    // Always initialize approvalHistory as an empty array on creation
    vendorData.approvalHistory = [];

    // Extra validation for required fields
    const requiredFields = ['name', 'phone', 'email', 'address'];
    const missing = requiredFields.filter(f => !vendorData[f] || vendorData[f].trim() === '');
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const vendor = new Vendor(vendorData);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error: any) {
    console.error('Vendor creation error:', error.message, 'Payload:', req.body);
    res.status(400).json({ message: error.message });
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 