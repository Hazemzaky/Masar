import { Request, Response } from 'express';
import AssetPass from '../models/AssetPass';
import Asset from '../models/Asset';

// Create Asset Pass
export const createAssetPass = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { asset, passType, passNumber, issuanceDate, expiryDate } = req.body;
    if (!asset || !passType || !passNumber || !issuanceDate || !expiryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Check asset exists
    const assetObj = await Asset.findById(asset);
    if (!assetObj) {
      return res.status(400).json({ message: 'Asset not found' });
    }
    const certificate = req.file ? `/uploads/${req.file.filename}` : undefined;
    const assetPass = new AssetPass({
      asset,
      passType,
      passNumber,
      issuanceDate,
      expiryDate,
      certificate
    });
    await assetPass.save();
    res.status(201).json(assetPass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all Asset Passes (optionally filter by asset or passType)
export const getAssetPasses = async (req: Request, res: Response) => {
  try {
    const { asset, passType } = req.query;
    const filter: any = {};
    if (asset) filter.asset = asset;
    if (passType) filter.passType = passType;
    const passes = await AssetPass.find(filter).populate('asset', 'description plateNumber');
    res.json(passes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Asset Pass by ID
export const getAssetPassById = async (req: Request, res: Response) => {
  try {
    const pass = await AssetPass.findById(req.params.id).populate('asset', 'description plateNumber');
    if (!pass) return res.status(404).json({ message: 'Asset Pass not found' });
    res.json(pass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Asset Pass (optionally update certificate)
export const updateAssetPass = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.certificate = `/uploads/${req.file.filename}`;
    }
    const pass = await AssetPass.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!pass) return res.status(404).json({ message: 'Asset Pass not found' });
    res.json(pass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Asset Pass
export const deleteAssetPass = async (req: Request, res: Response) => {
  try {
    const pass = await AssetPass.findByIdAndDelete(req.params.id);
    if (!pass) return res.status(404).json({ message: 'Asset Pass not found' });
    res.json({ message: 'Asset Pass deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 