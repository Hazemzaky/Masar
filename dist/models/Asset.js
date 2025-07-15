"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AssetSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    mainCategory: { type: String, required: true },
    subCategory: { type: String, required: true },
    subSubCategory: { type: String },
    subSubSubCategory: { type: String },
    subSubSubSubCategory: { type: String },
    type: { type: String },
    brand: { type: String },
    status: {
        type: String,
        enum: ['active', 'disposed', 'accident/scraped', 'other', 'pending'],
        default: 'active'
    },
    availability: {
        type: String,
        enum: ['available', 'assigned', 'maintenance', 'out_of_service'],
        default: 'available'
    },
    currentProject: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    countryOfOrigin: { type: String },
    purchaseDate: { type: Date, required: true },
    purchaseValue: { type: Number, required: true },
    usefulLifeMonths: { type: Number, required: true },
    salvageValue: { type: Number, default: 0 },
    chassisNumber: { type: String },
    plateNumber: { type: String },
    serialNumber: { type: String },
    fleetNumber: { type: String },
    serial: { type: String, unique: true, sparse: true }, // Document serial number
    notes: { type: String },
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Asset', AssetSchema);
