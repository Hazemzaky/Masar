import { Request, Response } from 'express';
import Asset from '../models/Asset';

export const createAsset = async (req: Request, res: Response) => {
  try {
    console.log('Creating asset with data:', req.body);
    
    // Validate required fields
    const { description, mainCategory, subCategory, purchaseDate, purchaseValue, usefulLifeMonths } = req.body;
    if (!description || !mainCategory || !subCategory || !purchaseDate || !purchaseValue || !usefulLifeMonths) {
      return res.status(400).json({ 
        message: 'Missing required fields: description, mainCategory, subCategory, purchaseDate, purchaseValue, usefulLifeMonths' 
      });
    }

    // Create asset with proper field mapping
    const assetData = {
      description: req.body.description,
      mainCategory: req.body.mainCategory,
      subCategory: req.body.subCategory,
      subSubCategory: req.body.subSubCategory,
      subSubSubCategory: req.body.subSubSubCategory,
      brand: req.body.brand,
      status: req.body.status || 'active',
      availability: req.body.availability || 'available',
      countryOfOrigin: req.body.countryOfOrigin,
      purchaseDate: new Date(req.body.purchaseDate),
      purchaseValue: Number(req.body.purchaseValue),
      usefulLifeMonths: Number(req.body.usefulLifeMonths),
      salvageValue: Number(req.body.salvageValue) || 0,
      chassisNumber: req.body.chassisNumber,
      plateNumber: req.body.plateNumber,
      serialNumber: req.body.serialNumber,
      fleetNumber: req.body.fleetNumber,
      notes: req.body.notes
    };

    console.log('Processed asset data:', assetData);
    
    const asset = new Asset(assetData);
    console.log('Asset object created:', asset);
    
    await asset.save();
    console.log('Asset saved successfully');
    
    res.status(201).json(asset);
  } catch (error: any) {
    console.error('Error creating asset:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Asset with this description already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await Asset.find().populate('currentProject', 'customer description status').sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAsset = async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('currentProject', 'customer description status');
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('currentProject', 'customer description status');
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const changeAssetStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const asset = await Asset.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    res.json(asset);
  } catch (error) {
    console.error('Error changing asset status:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const calculateDepreciation = async (req: Request, res: Response) => {
  // Skeleton: implement depreciation calculation logic here
  res.json({ message: 'Depreciation calculation not implemented yet.' });
};

// New function to get available assets with hierarchical structure
export const getAvailableAssets = async (req: Request, res: Response) => {
  try {
    const availableAssets = await Asset.find({
      availability: 'available',
      status: 'active'
    }).select('description mainCategory subCategory subSubCategory subSubSubCategory brand plateNumber serialNumber fleetNumber chassisNumber');
    
    res.json(availableAssets);
  } catch (error) {
    console.error('Error fetching available assets:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// New function to get asset categories for hierarchical selection
export const getAssetCategories = async (req: Request, res: Response) => {
  try {
    const assets = await Asset.find({
      availability: 'available',
      status: 'active'
    }).select('mainCategory subCategory subSubCategory');
    
    // Build hierarchical structure
    const categories: any = {};
    
    assets.forEach(asset => {
      if (!categories[asset.mainCategory]) {
        categories[asset.mainCategory] = {};
      }
      if (!categories[asset.mainCategory][asset.subCategory]) {
        categories[asset.mainCategory][asset.subCategory] = [];
      }
      if (asset.subSubCategory && !categories[asset.mainCategory][asset.subCategory].includes(asset.subSubCategory)) {
        categories[asset.mainCategory][asset.subCategory].push(asset.subSubCategory);
      }
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 