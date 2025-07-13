import { Request, Response } from 'express';
import Asset from '../models/Asset';

export const createAsset = async (req: Request, res: Response) => {
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
    }).select('description type mainCategory subCategory subSubCategory subSubSubCategory subSubSubSubCategory brand plateNumber serialNumber fleetNumber chassisNumber');
    
    res.json(availableAssets);
  } catch (error) {
    console.error('Error fetching available assets:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// New function to get asset categories for hierarchical selection
export const getAssetCategories = async (req: Request, res: Response) => {
  try {
    // Optionally accept ?type=Vehicle|Equipment|Attachment
    const { type } = req.query;

    // These should match the frontend's hierarchies exactly
    const vehicleHierarchy = {
      'Trucks': {
        'Light-Duty Trucks': {
          'Pickup Trucks': {
            'Single Cab': {},
            'Double Cab': {},
            'Crew Cab': {}
          },
          'Mini Trucks': {
            'Kei Trucks': {},
            'Flatbed Mini Trucks': {},
            'Box Mini Trucks': {}
          }
        },
        'Medium-Duty Trucks': {
          'Box Trucks': {
            'Dry Van': {},
            'Refrigerated Box': {}
          },
          'Flatbed Trucks': {
            'Stake Bed': {},
            'Drop-Side Flatbed': {}
          },
          'Utility Service Trucks': {
            'Bucket Trucks': {},
            'Maintenance Trucks': {}
          }
        },
        'Heavy-Duty Trucks': {
          'Tractor-Trailers (Semi-Trucks)': {
            'Sleeper Cab': {},
            'Day Cab': {}
          },
          'Dump Trucks': {
            'Standard Dump': {},
            'Articulated Dump': {}
          },
          'Tanker Trucks': {
            'Fuel Tankers': {},
            'Water Tankers': {},
            'Chemical Tankers': {}
          },
          'Logging Trucks': {
            'Long Log': {},
            'Short Log': {}
          }
        }
      },
      'Vans': {
        'Cargo Vans': {
          'Standard Roof': {},
          'High Roof': {},
          'Extended Wheelbase': {}
        },
        'Passenger Vans': {
          '8-Seater': {},
          '12-Seater': {},
          '15-Seater': {}
        },
        'Mini Vans': {
          'Family Vans': {
            'Hybrid': {},
            'Electric': {}
          },
          'Taxi Vans': {
            'Wheelchair Accessible': {},
            'Partitioned Vans': {}
          }
        },
        'Specialty Vans': {
          'Refrigerated Vans': {},
          'Mobile Workshop Vans': {},
          'Surveillance Vans': {}
        }
      },
      'Specialized Logistics Vehicles': {
        'Armored Vehicles': {
          'Cash-in-Transit Vans': {},
          'Secure Cargo Trucks': {}
        },
        'Refrigerated (Reefer) Trucks': {
          'Light-Duty Reefers': {},
          'Medium-Duty Reefers': {},
          'Trailer Reefers': {}
        },
        'Livestock Transport Vehicles': {
          'Cattle Trailers': {},
          'Poultry Vans': {},
          'Multi-Tier Animal Trucks': {}
        },
        'Car Transporters': {
          'Single Car Haulers': {},
          'Multi-Car Carriers': {}
        },
        'Waste Collection Vehicles': {
          'Rear Loader Garbage Trucks': {},
          'Side Loader Garbage Trucks': {},
          'Vacuum Trucks': {}
        },
        'Modular Container Vehicles': {
          'Side Lifter Trucks': {},
          'Intermodal Chassis Trucks': {}
        }
      },
      'Lifting & Rigging Equipment': {
        'Cranes': {
          'Mobile Cranes': {
            'Truck-Mounted Cranes': {},
            'All-Terrain Cranes': {}
          },
          'Tower Cranes': {
            'Hammerhead': {},
            'Luffing Jib': {}
          },
          'Overhead Cranes': {
            'Single Girder': {},
            'Double Girder': {}
          }
        },
        'Hoists': {
          'Manual Chain Hoists': {},
          'Electric Chain Hoists': {},
          'Wire Rope Hoists': {}
        },
        'Forklifts': {
          'Counterbalance Forklifts': {
            'Electric': {},
            'Diesel': {}
          },
          'Reach Trucks': {},
          'Rough Terrain Forklifts': {}
        },
        'Jacks & Lifting Devices': {
          'Hydraulic Jacks': {
            'Bottle Jack': {},
            'Floor Jack': {}
          },
          'Pneumatic Lifts': {},
          'Gantry Systems': {}
        },
        'Rigging Accessories': {
          'Slings': {
            'Wire Rope Slings': {},
            'Synthetic Slings': {}
          },
          'Shackles': {},
          'Turnbuckles': {},
          'Eye Bolts': {}
        }
      }
    };

    const equipmentHierarchy = {
      'Material Handling Equipment': {
        'Conveyors': {
          'Belt Conveyors': {
            'Flat Belt': {},
            'Incline Belt': {}
          },
          'Roller Conveyors': {
            'Gravity': {},
            'Powered': {}
          },
          'Chain Conveyors': {}
        },
        'Lifting Equipment': {
          'Scissor Lifts': {},
          'Lift Tables': {
            'Manual': {},
            'Hydraulic': {}
          }
        },
        'Pallet Handling': {
          'Pallet Jacks': {
            'Manual': {},
            'Electric': {}
          },
          'Pallet Inverters': {},
          'Pallet Stackers': {}
        },
        'Industrial Trucks': {
          'Tow Tractors': {},
          'Platform Trucks': {}
        }
      },
      'Transport Equipment': {
        'Hand Trucks & Dollies': {
          'Appliance Dollies': {},
          'Convertible Hand Trucks': {}
        },
        'Trolleys': {
          'Flatbed Trolleys': {},
          'Cage Trolleys': {}
        },
        'Carts': {
          'Utility Carts': {},
          'Service Carts': {},
          'Tool Carts': {}
        },
        'AGVs (Automated Guided Vehicles)': {
          'Tow-Type AGVs': {},
          'Unit Load AGVs': {}
        },
        'Industrial Trailers': {
          'Tugger Carts': {},
          'Tow Trains': {}
        }
      },
      'Safety Equipment': {
        'Personal Protective Equipment (PPE)': {
          'Head Protection': {
            'Hard Hats': {},
            'Bump Caps': {}
          },
          'Eye & Face Protection': {
            'Goggles': {},
            'Face Shields': {}
          },
          'Respiratory Protection': {
            'N95 Masks': {},
            'Half/Full Face Respirators': {}
          },
          'Hearing Protection': {
            'Earplugs': {},
            'Earmuffs': {}
          },
          'Hand Protection (Gloves)': {},
          'Foot Protection (Safety Boots)': {}
        },
        'Fall Protection': {
          'Safety Harnesses': {},
          'Lanyards & Lifelines': {},
          'Anchor Points': {}
        },
        'Fire Safety': {
          'Fire Extinguishers': {
            'ABC Powder': {},
            'CO2': {}
          },
          'Fire Blankets': {},
          'Smoke Detectors': {}
        },
        'Site Safety': {
          'Barricades': {},
          'Safety Cones': {},
          'Signage': {},
          'Emergency Showers/Eyewash Stations': {}
        }
      },
      'Storage Equipment': {
        'Racking Systems': {
          'Pallet Racks': {
            'Selective': {},
            'Drive-In': {}
          },
          'Cantilever Racks': {},
          'Push-Back Racks': {}
        },
        'Shelving Units': {
          'Wire Shelving': {},
          'Steel Shelving': {},
          'Mobile Shelving': {}
        },
        'Bins & Containers': {
          'Stackable Bins': {},
          'Collapsible Crates': {},
          'IBC Totes': {}
        },
        'Lockers & Cabinets': {
          'Tool Cabinets': {},
          'PPE Lockers': {},
          'Flammable Storage Cabinets': {}
        }
      },
      'Construction & Earthmoving Equipment': {
        'Earthmoving Machinery': {
          'Excavators': {
            'Tracked': {},
            'Wheeled': {}
          },
          'Bulldozers': {},
          'Backhoe Loaders': {},
          'Skid Steer Loaders': {}
        },
        'Compaction Equipment': {
          'Vibratory Rollers': {},
          'Plate Compactors': {},
          'Rammers': {}
        },
        'Paving Equipment': {
          'Asphalt Pavers': {},
          'Concrete Pavers': {}
        },
        'Drilling & Piling Equipment': {
          'Rotary Drilling Rigs': {},
          'Pile Drivers': {}
        }
      },
      'Power & Utility Equipment': {
        'Generators': {
          'Portable Generators': {},
          'Diesel Generators': {},
          'Solar Generators': {}
        },
        'Compressors': {
          'Electric Air Compressors': {},
          'Diesel Compressors': {}
        },
        'Welding Equipment': {
          'Arc Welders': {},
          'MIG/TIG Welders': {}
        },
        'Power Distribution': {
          'Temporary Power Panels': {},
          'Power Cables & Reels': {}
        },
        'Lighting Towers': {
          'Solar Light Towers': {},
          'Diesel Light Towers': {}
        }
      },
      'Maintenance Tools & Equipment': {
        'Hand Tools': {
          'Wrenches': {},
          'Screwdrivers': {},
          'Pliers': {}
        },
        'Power Tools': {
          'Drills': {},
          'Grinders': {},
          'Impact Drivers': {}
        },
        'Diagnostic Tools': {
          'Multimeters': {},
          'Thermal Cameras': {}
        },
        'Cleaning Equipment': {
          'Industrial Vacuums': {},
          'Pressure Washers': {}
        },
        'Lubrication Equipment': {
          'Grease Guns': {},
          'Oil Dispensers': {}
        }
      },
      'Site Infrastructure Equipment': {
        'Site Offices & Cabins': {
          'Portable Offices': {},
          'Restrooms': {},
          'Storage Units': {}
        },
        'Fencing & Barriers': {
          'Temporary Fencing': {},
          'Concrete Barriers': {}
        },
        'Water Supply Systems': {
          'Water Tanks': {},
          'Water Pumps': {}
        },
        'Waste Management Systems': {
          'Waste Bins': {},
          'Septic Tanks': {}
        },
        'Site Access Solutions': {
          'Access Control Gates': {},
          'Turnstiles': {},
          'Temporary Roads & Mats': {}
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
    } else if (type === 'Equipment') {
      categories = equipmentHierarchy;
    } else if (type === 'Attachment') {
      categories = attachmentHierarchy;
    } else {
      categories = {
        ...vehicleHierarchy,
        ...equipmentHierarchy,
        ...attachmentHierarchy
      };
    }
    res.json(categories);
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 