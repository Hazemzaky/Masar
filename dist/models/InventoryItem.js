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
const InventoryItemSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    type: { type: String, enum: ['spare', 'tool', 'consumable', 'tyres'], required: true },
    rop: { type: Number },
    quantity: { type: Number, required: true, default: 0 },
    uom: { type: String, required: true },
    location: { type: String },
    rack: { type: String },
    aisle: { type: String },
    bin: { type: String },
    warranty: { type: Boolean, default: false },
    warrantyPeriod: { type: Number },
    warrantyStartDate: { type: Date },
    purchaseCost: { type: Number },
    supplier: { type: String },
    relatedAsset: { type: String },
    notes: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    costType: { type: String, enum: ['direct', 'depreciated'], default: 'direct' }, // New field
    depreciationDuration: { type: Number }, // New field (months)
    serial: { type: String, required: true, unique: true }, // Serial number field
});
exports.default = mongoose_1.default.model('InventoryItem', InventoryItemSchema);
