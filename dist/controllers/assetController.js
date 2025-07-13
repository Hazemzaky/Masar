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
const createAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Creating asset with data:', req.body);
        // Validate required fields
        const { description, type, mainCategory, subCategory, purchaseDate, purchaseValue, usefulLifeMonths } = req.body;
        if (!description || !type || !mainCategory || !subCategory || !purchaseDate || !purchaseValue || !usefulLifeMonths) {
            return res.status(400).json({
                message: 'Missing required fields: description, type, mainCategory, subCategory, purchaseDate, purchaseValue, usefulLifeMonths'
            });
        }
        // Create asset with proper field mapping
        const assetData = {
            description: req.body.description,
            type: req.body.type,
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
            notes: req.body.notes
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
        }).select('description type mainCategory subCategory subSubCategory subSubSubCategory subSubSubSubCategory brand plateNumber serialNumber fleetNumber chassisNumber');
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
        // Optionally accept ?type=Vehicle|Equipment|Attachment
        const { type } = req.query;
        // These should match the frontend's hierarchies
        const vehicleHierarchy = {
            'Heavy Trucks': {
                'Dump Trucks': {
                    'Articulated Dump Trucks': ['Small (20-30 ton)', 'Medium (30-40 ton)', 'Large (40+ ton)'],
                    'Rigid Dump Trucks': ['Small (15-25 ton)', 'Medium (25-35 ton)', 'Large (35+ ton)']
                },
                'Crane Trucks': {
                    'Mobile Cranes': ['Small (10-25 ton)', 'Medium (25-50 ton)', 'Large (50+ ton)'],
                    'Tower Cranes': ['Hammerhead', 'Luffing Jib', 'Self-Erecting']
                },
                'Mixer Trucks': {
                    'Concrete Mixers': ['6-8 cubic meters', '8-10 cubic meters', '10+ cubic meters'],
                    'Cement Mixers': ['Small', 'Medium', 'Large']
                },
                'Tanker Trucks': {
                    'Fuel Tankers': ['Small (5,000-10,000L)', 'Medium (10,000-20,000L)', 'Large (20,000+ L)'],
                    'Water Tankers': ['Small (5,000-10,000L)', 'Medium (10,000-20,000L)', 'Large (20,000+ L)'],
                    'Chemical Tankers': ['Stainless Steel', 'Aluminum', 'Specialty']
                },
                'Flatbed Trucks': {
                    'Standard Flatbeds': ['Small (20-30 ft)', 'Medium (30-40 ft)', 'Large (40+ ft)'],
                    'Extendable Flatbeds': ['Manual Extension', 'Hydraulic Extension']
                }
            },
            'Light Trucks': {
                'Pickup Trucks': {
                    'Small Pickups': ['Compact', 'Mid-size'],
                    'Large Pickups': ['Full-size', 'Heavy Duty']
                },
                'Delivery Trucks': {
                    'Box Trucks': ['Small (10-14 ft)', 'Medium (14-20 ft)', 'Large (20+ ft)'],
                    'Flatbed Trucks': ['Small', 'Medium', 'Large']
                },
                'Service Trucks': {
                    'Utility Trucks': ['Small', 'Medium', 'Large'],
                    'Crane Trucks': ['Small (2-5 ton)', 'Medium (5-10 ton)', 'Large (10+ ton)']
                }
            },
            'Specialized Vehicles': {
                'Crane Trucks': {
                    'Mobile Cranes': ['Small (10-25 ton)', 'Medium (25-50 ton)', 'Large (50+ ton)'],
                    'Tower Cranes': ['Hammerhead', 'Luffing Jib', 'Self-Erecting']
                },
                'Aerial Work Platforms': {
                    'Scissor Lifts': ['Electric', 'Rough Terrain', 'Slab'],
                    'Boom Lifts': ['Articulating', 'Telescopic', 'Truck Mounted']
                },
                'Forklifts': {
                    'Electric Forklifts': ['3-Wheel Electric', '4-Wheel Electric', 'Narrow Aisle'],
                    'Internal Combustion': ['Gasoline', 'Diesel', 'LP Gas', 'Dual Fuel'],
                    'Rough Terrain': ['Standard', 'Variable Reach', 'Telehandler']
                }
            },
            'Transport Vehicles': {
                'Passenger Vehicles': {
                    'Sedans': ['Compact', 'Mid-size', 'Full-size', 'Luxury'],
                    'SUVs': ['Compact', 'Mid-size', 'Full-size', 'Luxury'],
                    'Vans': ['Passenger Vans', 'Cargo Vans', 'Minivans']
                },
                'Buses': {
                    'Mini Buses': ['8-15 passengers', '15-25 passengers'],
                    'Standard Buses': ['25-40 passengers', '40+ passengers'],
                    'Coaches': ['Luxury Coaches', 'Standard Coaches']
                }
            },
            'Construction Vehicles': {
                'Excavators': {
                    'Mini Excavators': ['1-3 ton', '3-5 ton', '5-8 ton'],
                    'Standard Excavators': ['8-15 ton', '15-25 ton', '25-35 ton'],
                    'Large Excavators': ['35-50 ton', '50-80 ton', '80+ ton']
                },
                'Bulldozers': {
                    'Crawler Dozers': ['Small (D3-D5)', 'Medium (D6-D8)', 'Large (D9-D11)'],
                    'Wheel Dozers': ['Compact', 'Standard', 'Large']
                },
                'Loaders': {
                    'Wheel Loaders': ['Compact', 'Small', 'Medium', 'Large', 'Extra Large'],
                    'Skid Steer Loaders': ['Standard', 'Compact', 'Large Frame'],
                    'Track Loaders': ['Compact', 'Standard']
                }
            },
            'Agricultural Vehicles': {
                'Tractors': {
                    'Small Tractors': ['20-50 HP', '50-80 HP'],
                    'Medium Tractors': ['80-120 HP', '120-180 HP'],
                    'Large Tractors': ['180-300 HP', '300+ HP']
                },
                'Harvesters': {
                    'Combine Harvesters': ['Small', 'Medium', 'Large'],
                    'Forage Harvesters': ['Small', 'Medium', 'Large']
                }
            },
            'Mining Vehicles': {
                'Haul Trucks': {
                    'Small Haul Trucks': ['30-50 ton', '50-80 ton'],
                    'Medium Haul Trucks': ['80-120 ton', '120-180 ton'],
                    'Large Haul Trucks': ['180-300 ton', '300+ ton']
                },
                'Loaders': {
                    'Wheel Loaders': ['Small', 'Medium', 'Large'],
                    'Track Loaders': ['Small', 'Medium', 'Large']
                }
            },
            'Waste Management Vehicles': {
                'Garbage Trucks': {
                    'Rear Loader Garbage Trucks': ['Small', 'Medium', 'Large'],
                    'Side Loader Garbage Trucks': ['Small', 'Medium', 'Large'],
                    'Front Loader Garbage Trucks': ['Small', 'Medium', 'Large']
                },
                'Vacuum Trucks': {
                    'Sewer Vacuum Trucks': ['Small', 'Medium', 'Large'],
                    'Industrial Vacuum Trucks': ['Small', 'Medium', 'Large']
                }
            },
            'Emergency Vehicles': {
                'Fire Trucks': {
                    'Pumper Trucks': ['Small', 'Medium', 'Large'],
                    'Ladder Trucks': ['Small', 'Medium', 'Large'],
                    'Rescue Trucks': ['Small', 'Medium', 'Large']
                },
                'Ambulances': {
                    'Basic Life Support': ['Type I', 'Type II', 'Type III'],
                    'Advanced Life Support': ['Type I', 'Type II', 'Type III']
                }
            },
            'Military Vehicles': {
                'Transport Vehicles': {
                    'Light Transport': ['Jeeps', 'Humvees', 'Light Trucks'],
                    'Heavy Transport': ['Medium Trucks', 'Heavy Trucks', 'Tank Transporters']
                },
                'Specialized Vehicles': {
                    'Armored Vehicles': ['Light Armored', 'Medium Armored', 'Heavy Armored'],
                    'Engineering Vehicles': ['Bulldozers', 'Excavators', 'Cranes']
                }
            },
            'Recreational Vehicles': {
                'Motorhomes': {
                    'Class A Motorhomes': ['Small (25-30 ft)', 'Medium (30-35 ft)', 'Large (35+ ft)'],
                    'Class B Motorhomes': ['Camper Vans', 'Conversion Vans'],
                    'Class C Motorhomes': ['Small (20-25 ft)', 'Medium (25-30 ft)', 'Large (30+ ft)']
                },
                'Travel Trailers': {
                    'Small Trailers': ['15-20 ft', '20-25 ft'],
                    'Medium Trailers': ['25-30 ft', '30-35 ft'],
                    'Large Trailers': ['35-40 ft', '40+ ft']
                }
            },
            'Livestock Transport Vehicles': {
                'Cattle Trailers': ['Small', 'Medium', 'Large'],
                'Poultry Vans': ['Small', 'Medium', 'Large'],
                'Multi-Tier Animal Trucks': ['Small', 'Medium', 'Large']
            },
            'Car Transporters': {
                'Single Car Haulers': ['Open', 'Enclosed'],
                'Multi-Car Carriers': ['3-Car', '5-Car', '7-Car', '9-Car']
            },
            'Waste Collection Vehicles': {
                'Rear Loader Garbage Trucks': ['Small', 'Medium', 'Large'],
                'Side Loader Garbage Trucks': ['Small', 'Medium', 'Large'],
                'Vacuum Trucks': ['Small', 'Medium', 'Large']
            },
            'Modular Container Vehicles': {
                'Side Lifter Trucks': ['Small', 'Medium', 'Large'],
                'Intermodal Chassis Trucks': ['20-ft', '40-ft', '45-ft']
            }
        };
        const equipmentHierarchy = {
            'Material Handling Equipment': {
                'Conveyors': {
                    'Belt Conveyors': ['Flat Belt', 'Incline Belt'],
                    'Roller Conveyors': ['Gravity', 'Powered'],
                    'Chain Conveyors': ['Standard', 'Heavy Duty']
                },
                'Lifting Equipment': {
                    'Scissor Lifts': ['Electric', 'Hydraulic', 'Rough Terrain'],
                    'Lift Tables': ['Manual', 'Hydraulic', 'Electric']
                },
                'Pallet Handling': {
                    'Pallet Jacks': ['Manual', 'Electric', 'Rough Terrain'],
                    'Pallet Inverters': ['Manual', 'Automatic'],
                    'Pallet Stackers': ['Manual', 'Electric', 'Semi-Electric']
                },
                'Industrial Trucks': {
                    'Tow Tractors': ['Electric', 'Internal Combustion'],
                    'Platform Trucks': ['Manual', 'Electric', 'Rough Terrain']
                }
            },
            'Transport Equipment': {
                'Hand Trucks & Dollies': {
                    'Appliance Dollies': ['Standard', 'Heavy Duty'],
                    'Convertible Hand Trucks': ['2-Wheel', '4-Wheel'],
                    'Platform Dollies': ['Small', 'Medium', 'Large']
                },
                'Trolleys': {
                    'Flatbed Trolleys': ['Small', 'Medium', 'Large'],
                    'Cage Trolleys': ['Standard', 'Heavy Duty'],
                    'Specialty Trolleys': ['Medical', 'Food Service', 'Industrial']
                },
                'Carts': {
                    'Utility Carts': ['Small', 'Medium', 'Large'],
                    'Service Carts': ['Tool Carts', 'Maintenance Carts', 'Cleaning Carts'],
                    'Tool Carts': ['Mechanic', 'Electrician', 'Plumber']
                },
                'AGVs (Automated Guided Vehicles)': {
                    'Tow-Type AGVs': ['Small', 'Medium', 'Large'],
                    'Unit Load AGVs': ['Pallet Carriers', 'Container Carriers'],
                    'Fork AGVs': ['Standard', 'Heavy Duty']
                },
                'Industrial Trailers': {
                    'Tugger Carts': ['Small', 'Medium', 'Large'],
                    'Tow Trains': ['Manual', 'Automated']
                }
            },
            'Safety Equipment': {
                'Personal Protective Equipment (PPE)': {
                    'Head Protection': ['Hard Hats', 'Bump Caps', 'Safety Helmets'],
                    'Eye & Face Protection': ['Goggles', 'Face Shields', 'Safety Glasses'],
                    'Respiratory Protection': ['N95 Masks', 'Half/Full Face Respirators', 'Air Purifying Respirators'],
                    'Hearing Protection': ['Earplugs', 'Earmuffs', 'Electronic Hearing Protection'],
                    'Hand Protection (Gloves)': ['Cut Resistant', 'Chemical Resistant', 'Heat Resistant'],
                    'Foot Protection (Safety Boots)': ['Steel Toe', 'Composite Toe', 'Electrical Hazard']
                },
                'Fall Protection': {
                    'Safety Harnesses': ['Full Body', 'Chest', 'Seat'],
                    'Lanyards & Lifelines': ['Shock Absorbing', 'Self Retracting', 'Vertical'],
                    'Anchor Points': ['Permanent', 'Temporary', 'Mobile']
                },
                'Fire Safety': {
                    'Fire Extinguishers': ['ABC Powder', 'CO2', 'Foam', 'Water'],
                    'Fire Blankets': ['Standard', 'Heavy Duty'],
                    'Smoke Detectors': ['Ionization', 'Photoelectric', 'Dual Sensor']
                },
                'Site Safety': {
                    'Barricades': ['Plastic', 'Metal', 'Temporary'],
                    'Safety Cones': ['Small', 'Medium', 'Large'],
                    'Signage': ['Warning', 'Caution', 'Information'],
                    'Emergency Showers/Eyewash Stations': ['Portable', 'Fixed', 'Combination']
                }
            },
            'Storage Equipment': {
                'Racking Systems': {
                    'Pallet Racks': ['Selective', 'Drive-In', 'Push-Back', 'Mobile'],
                    'Cantilever Racks': ['Single Sided', 'Double Sided'],
                    'Push-Back Racks': ['2 Deep', '3 Deep', '4 Deep']
                },
                'Shelving Units': {
                    'Wire Shelving': ['Light Duty', 'Medium Duty', 'Heavy Duty'],
                    'Steel Shelving': ['Light Duty', 'Medium Duty', 'Heavy Duty'],
                    'Mobile Shelving': ['Manual', 'Electric', 'Compactus']
                },
                'Bins & Containers': {
                    'Stackable Bins': ['Small', 'Medium', 'Large'],
                    'Collapsible Crates': ['Standard', 'Heavy Duty'],
                    'IBC Totes': ['Plastic', 'Stainless Steel', 'Carbon Steel']
                },
                'Lockers & Cabinets': {
                    'Tool Cabinets': ['Small', 'Medium', 'Large'],
                    'PPE Lockers': ['Individual', 'Multi-User'],
                    'Flammable Storage Cabinets': ['Small', 'Medium', 'Large']
                }
            },
            'Construction & Earthmoving Equipment': {
                'Earthmoving Machinery': {
                    'Excavators': ['Mini', 'Standard', 'Large', 'Wheeled'],
                    'Bulldozers': ['Small', 'Medium', 'Large'],
                    'Backhoe Loaders': ['Standard', 'Compact', 'Large'],
                    'Skid Steer Loaders': ['Standard', 'Compact', 'Large Frame']
                },
                'Compaction Equipment': {
                    'Vibratory Rollers': ['Single Drum', 'Double Drum', 'Pneumatic'],
                    'Plate Compactors': ['Forward Plate', 'Reversible Plate'],
                    'Rammers': ['Standard', 'Heavy Duty']
                },
                'Paving Equipment': {
                    'Asphalt Pavers': ['Track Pavers', 'Wheel Pavers', 'Mini Pavers'],
                    'Concrete Pavers': ['Slipform Pavers', 'Form Pavers']
                },
                'Drilling & Piling Equipment': {
                    'Rotary Drilling Rigs': ['Small', 'Medium', 'Large'],
                    'Pile Drivers': ['Vibratory', 'Impact', 'Press-In']
                }
            },
            'Power & Utility Equipment': {
                'Generators': {
                    'Portable Generators': ['Small (1-5 kW)', 'Medium (5-15 kW)', 'Large (15+ kW)'],
                    'Diesel Generators': ['Small', 'Medium', 'Large'],
                    'Solar Generators': ['Small', 'Medium', 'Large']
                },
                'Compressors': {
                    'Electric Air Compressors': ['Small', 'Medium', 'Large'],
                    'Diesel Compressors': ['Small', 'Medium', 'Large'],
                    'Portable Compressors': ['Small', 'Medium', 'Large']
                },
                'Welding Equipment': {
                    'Arc Welders': ['Stick', 'MIG', 'TIG'],
                    'MIG/TIG Welders': ['Small', 'Medium', 'Large'],
                    'Plasma Cutters': ['Small', 'Medium', 'Large']
                },
                'Power Distribution': {
                    'Temporary Power Panels': ['Small', 'Medium', 'Large'],
                    'Power Cables & Reels': ['Extension Cords', 'Heavy Duty Cables', 'Reels']
                },
                'Lighting Towers': {
                    'Solar Light Towers': ['Small', 'Medium', 'Large'],
                    'Diesel Light Towers': ['Small', 'Medium', 'Large']
                }
            },
            'Maintenance Tools & Equipment': {
                'Hand Tools': {
                    'Wrenches': ['Adjustable', 'Combination', 'Socket'],
                    'Screwdrivers': ['Phillips', 'Flat Head', 'Torx'],
                    'Pliers': ['Standard', 'Needle Nose', 'Locking']
                },
                'Power Tools': {
                    'Drills': ['Cordless', 'Corded', 'Hammer Drills'],
                    'Grinders': ['Angle Grinders', 'Bench Grinders', 'Die Grinders'],
                    'Impact Drivers': ['Cordless', 'Corded', 'Pneumatic']
                },
                'Diagnostic Tools': {
                    'Multimeters': ['Digital', 'Analog', 'Clamp Meters'],
                    'Thermal Cameras': ['Small', 'Medium', 'Large'],
                    'Oscilloscopes': ['Digital', 'Analog']
                },
                'Cleaning Equipment': {
                    'Industrial Vacuums': ['Wet/Dry', 'HEPA', 'Explosion Proof'],
                    'Pressure Washers': ['Electric', 'Gas', 'Diesel'],
                    'Steam Cleaners': ['Small', 'Medium', 'Large']
                },
                'Lubrication Equipment': {
                    'Grease Guns': ['Manual', 'Electric', 'Pneumatic'],
                    'Oil Dispensers': ['Manual', 'Electric', 'Automatic']
                }
            },
            'Site Infrastructure Equipment': {
                'Site Offices & Cabins': {
                    'Portable Offices': ['Small', 'Medium', 'Large'],
                    'Restrooms': ['Single', 'Multiple', 'ADA Compliant'],
                    'Storage Units': ['Small', 'Medium', 'Large']
                },
                'Fencing & Barriers': {
                    'Temporary Fencing': ['Chain Link', 'Plastic', 'Metal'],
                    'Concrete Barriers': ['Small', 'Medium', 'Large'],
                    'Traffic Barriers': ['Water Filled', 'Concrete', 'Steel']
                },
                'Water Supply Systems': {
                    'Water Tanks': ['Small', 'Medium', 'Large'],
                    'Water Pumps': ['Submersible', 'Centrifugal', 'Diaphragm'],
                    'Filtration Systems': ['Small', 'Medium', 'Large']
                },
                'Waste Management Systems': {
                    'Waste Bins': ['Small', 'Medium', 'Large'],
                    'Septic Tanks': ['Small', 'Medium', 'Large'],
                    'Recycling Systems': ['Small', 'Medium', 'Large']
                },
                'Site Access Solutions': {
                    'Access Control Gates': ['Manual', 'Automatic', 'Security'],
                    'Turnstiles': ['Manual', 'Automatic', 'Security'],
                    'Temporary Roads & Mats': ['Steel Mats', 'Plastic Mats', 'Wood Mats']
                }
            }
        };
        const attachmentHierarchy = {
            'Flatbed Trailers': {
                'Standard Flatbeds': {
                    '48-ft Flatbed': {},
                    '53-ft Flatbed': {}
                },
                'Extendable Flatbeds': {
                    'Manual Extension': {},
                    'Hydraulic Extension': {}
                },
                'Drop Deck Flatbeds (Step Decks)': {
                    'Single Drop': {},
                    'Double Drop': {}
                },
                'Removable Gooseneck (RGN) Flatbeds': {
                    'Hydraulic RGN': {},
                    'Mechanical RGN': {}
                }
            },
            'Enclosed Trailers (Dry Vans)': {
                'Standard Dry Vans': {
                    '53-ft Dry Van': {},
                    '48-ft Dry Van': {}
                },
                'Pup Trailers': {
                    '28-ft Pup': {}
                },
                'High Cube Dry Vans': {
                    'Insulated Models': {}
                },
                'Curtainside Trailers': {
                    'Rolling Tarp Systems': {}
                }
            },
            'Refrigerated Trailers (Reefers)': {
                'Standard Reefer Vans': {
                    'Single Temp Zone': {},
                    'Multi Temp Zone': {}
                },
                'Insulated Reefers': {},
                'Nose-Mount Unit Reefers': {},
                'Under-Mount Unit Reefers': {}
            },
            'Tanker Trailers': {
                'Fuel Tankers': {
                    'Aluminum Fuel Tankers': {},
                    'Compartmentalized': {}
                },
                'Chemical Tankers': {
                    'Stainless Steel': {},
                    'Acid/Alkali Resistant': {}
                },
                'Food-Grade Tankers': {
                    'Insulated': {},
                    'Sanitary Fittings': {}
                },
                'Dry Bulk Tankers': {
                    'Pneumatic Discharge': {}
                },
                'Water Tankers': {}
            },
            'Lowboy Trailers': {
                'Fixed Neck Lowboys': {},
                'Removable Gooseneck (RGN) Lowboys': {
                    '2-Axle': {},
                    '3-Axle': {},
                    'Extendable RGN': {}
                },
                'Drop Side Lowboys': {},
                'Beam & Perimeter Frame Lowboys': {}
            },
            'Container Trailers (Chassis)': {
                'Standard Container Chassis': {
                    '20-ft': {},
                    '40-ft': {},
                    '45-ft': {}
                },
                'Extendable Chassis': {},
                'Gooseneck Chassis': {},
                'Tank Container Chassis': {}
            },
            'Dump Trailers': {
                'End Dump Trailers': {
                    'Half-Round': {},
                    'Square Box': {}
                },
                'Side Dump Trailers': {},
                'Belly Dump (Bottom Dump)': {},
                'Hydraulic vs Air Lift Systems': {}
            },
            'Car Carrier Trailers': {
                'Single-Car Trailers': {},
                'Multi-Car Open Trailers': {
                    '3-Car': {},
                    '5-Car': {},
                    '7-Car': {}
                },
                'Enclosed Car Haulers': {
                    'Liftgate Enclosed Trailers': {},
                    'Stackable Ramps': {}
                }
            },
            'Logging Trailers': {
                'Pole Trailers': {},
                'Fixed-Length Log Trailers': {},
                'Self-Loading Logging Trailers': {},
                'Off-Road Logging Units': {}
            },
            'Specialty Trailers': {
                'Mobile Medical Trailers': {},
                'Event/Exhibit Trailers': {},
                'Command Center Trailers': {},
                'Hazmat Response Trailers': {},
                'Wind Blade Transport Trailers': {},
                'Helicopter/Boat Transport Trailers': {}
            },
            'Utility Trailers': {
                'Open Utility Trailers': {
                    'Single Axle': {},
                    'Tandem Axle': {}
                },
                'Enclosed Utility Trailers': {},
                'Tilt Deck Utility Trailers': {},
                'Landscape Trailers': {}
            },
            'Modular Trailers / Multi-Axle': {
                'Hydraulic Modular Trailers (HMT)': {
                    '2-Line Axle Modules': {},
                    '4-Line Axle Modules': {}
                },
                'SPMT (Self-Propelled Modular Transporters)': {
                    'Remote-Controlled SPMT': {},
                    'Power Pack Units (PPU)': {}
                },
                'Extendable Beam Modular Trailers': {},
                'Turntable Steering Modular Systems': {}
            }
        };
        let categories;
        if (type === 'Vehicle') {
            categories = vehicleHierarchy;
        }
        else if (type === 'Equipment') {
            categories = equipmentHierarchy;
        }
        else if (type === 'Attachment') {
            categories = attachmentHierarchy;
        }
        else {
            categories = Object.assign(Object.assign(Object.assign({}, vehicleHierarchy), equipmentHierarchy), attachmentHierarchy);
        }
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching asset categories:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAssetCategories = getAssetCategories;
