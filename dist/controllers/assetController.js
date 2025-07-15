"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetCategories = exports.getAvailableAssets = exports.calculateDepreciation = exports.changeAssetStatus = exports.deleteAsset = exports.updateAsset = exports.getAsset = exports.getAssets = exports.createAsset = void 0;
const Asset_1 = __importDefault(require("../models/Asset"));
const serialUtils_1 = require("../utils/serialUtils");
const createAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Creating asset with data:', req.body);
        // Validate required fields
        const { description, mainCategory, subCategory, purchaseDate, purchaseValue, usefulLifeMonths, department } = req.body;
        if (!description || !mainCategory || !subCategory || !purchaseDate || !purchaseValue || !usefulLifeMonths) {
            return res.status(400).json({
                message: 'Missing required fields: description, mainCategory, subCategory, purchaseDate, purchaseValue, usefulLifeMonths'
            });
        }
        // Serial number generation
        const docCode = 'AS';
        const dept = department || 'AS';
        const serial = yield (0, serialUtils_1.generateSerial)(docCode, dept, Asset_1.default);
        // Create asset with proper field mapping
        const assetData = {
            description: req.body.description,
            mainCategory: req.body.mainCategory,
            subCategory: req.body.subCategory,
            subSubCategory: req.body.subSubCategory,
            subSubSubCategory: req.body.subSubSubCategory,
            subSubSubSubCategory: req.body.subSubSubSubCategory,
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
            notes: req.body.notes,
            serial
        };
        console.log('Processed asset data:', assetData);
        const asset = new Asset_1.default(assetData);
        console.log('Asset object created:', asset);
        yield asset.save();
        console.log('Asset saved successfully');
        res.status(201).json(asset);
    }
    catch (error) {
        console.error('Error creating asset:', error);
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
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
});
exports.createAsset = createAsset;
const getAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assets = yield Asset_1.default.find().populate('currentProject', 'customer description status').sort({ createdAt: -1 });
        res.json(assets);
    }
    catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAssets = getAssets;
const getAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const asset = yield Asset_1.default.findById(req.params.id).populate('currentProject', 'customer description status');
        if (!asset) {
            res.status(404).json({ message: 'Asset not found' });
            return;
        }
        res.json(asset);
    }
    catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAsset = getAsset;
const updateAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const asset = yield Asset_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('currentProject', 'customer description status');
        if (!asset) {
            res.status(404).json({ message: 'Asset not found' });
            return;
        }
        res.json(asset);
    }
    catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateAsset = updateAsset;
const deleteAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const asset = yield Asset_1.default.findByIdAndDelete(req.params.id);
        if (!asset) {
            res.status(404).json({ message: 'Asset not found' });
            return;
        }
        res.json({ message: 'Asset deleted' });
    }
    catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteAsset = deleteAsset;
const changeAssetStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const asset = yield Asset_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!asset) {
            res.status(404).json({ message: 'Asset not found' });
            return;
        }
        res.json(asset);
    }
    catch (error) {
        console.error('Error changing asset status:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.changeAssetStatus = changeAssetStatus;
const calculateDepreciation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Skeleton: implement depreciation calculation logic here
    res.json({ message: 'Depreciation calculation not implemented yet.' });
});
exports.calculateDepreciation = calculateDepreciation;
// New function to get available assets with hierarchical structure
const getAvailableAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const availableAssets = yield Asset_1.default.find({
            availability: 'available',
            status: 'active'
        }).select('description mainCategory subCategory subSubCategory subSubSubCategory subSubSubSubCategory brand plateNumber serialNumber fleetNumber chassisNumber');
        res.json(availableAssets);
    }
    catch (error) {
        console.error('Error fetching available assets:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAvailableAssets = getAvailableAssets;
// New function to get asset categories for hierarchical selection
const getAssetCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assets = yield Asset_1.default.find({
            availability: 'available',
            status: 'active'
        }).select('mainCategory subCategory subSubCategory subSubSubCategory subSubSubSubCategory');
        // Build hierarchical structure
        const categories = {};
        assets.forEach(asset => {
            if (!categories[asset.mainCategory]) {
                categories[asset.mainCategory] = {};
            }
            if (!categories[asset.mainCategory][asset.subCategory]) {
                categories[asset.mainCategory][asset.subCategory] = {};
            }
            if (asset.subSubCategory && !categories[asset.mainCategory][asset.subCategory][asset.subSubCategory]) {
                categories[asset.mainCategory][asset.subCategory][asset.subSubCategory] = {};
            }
            if (asset.subSubSubCategory && asset.subSubCategory && !categories[asset.mainCategory][asset.subCategory][asset.subSubCategory][asset.subSubSubCategory]) {
                categories[asset.mainCategory][asset.subCategory][asset.subSubCategory][asset.subSubSubCategory] = [];
            }
            if (asset.subSubSubSubCategory && asset.subSubSubCategory && asset.subSubCategory && asset.subSubCategory) {
                const level4 = categories[asset.mainCategory][asset.subCategory][asset.subSubCategory][asset.subSubSubCategory];
                if (level4 && !level4.includes(asset.subSubSubSubCategory)) {
                    level4.push(asset.subSubSubSubCategory);
                }
            }
        });
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching asset categories:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAssetCategories = getAssetCategories;
