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
const MaintenancePartSchema = new mongoose_1.Schema({
    item: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InventoryItem' },
    itemName: { type: String },
    quantity: { type: Number },
    cost: { type: Number },
    availableQuantity: { type: Number },
    withdrawnQuantity: { type: Number }
}, { _id: false }); // Disable _id for embedded documents
const MaintenanceSchema = new mongoose_1.Schema({
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true },
    type: { type: String, enum: ['preventive', 'corrective'], required: true },
    description: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String },
    completedDate: { type: Date },
    completedTime: { type: String },
    totalCost: { type: Number, default: 0 },
    totalMaintenanceTime: { type: Number, default: 0 },
    parts: [MaintenancePartSchema],
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    downtimeHours: { type: Number },
    notes: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    completedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String },
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Maintenance', MaintenanceSchema);
