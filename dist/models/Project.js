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
const ProjectSchema = new mongoose_1.Schema({
    customer: { type: String, required: true },
    equipmentDescription: { type: String, required: true },
    totalBasicHours: { type: Number, required: true, default: 0 },
    totalOvertimeHours: { type: Number, required: true, default: 0 },
    overallHours: { type: Number, required: true, default: 0 },
    overtimeHoursCost: { type: Number, required: true, default: 0 },
    overtimeHours: { type: Number, required: true, default: 0 },
    overtimePrice: { type: Number, required: true, default: 0 },
    rentType: { type: String, enum: ['monthly', 'call_out'], required: true },
    department: { type: String, required: true },
    priceListDescription: { type: String, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    description: { type: String },
    revenue: { type: Number },
    notes: { type: String },
    assignedAssets: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset' }], // Array of assigned asset IDs
    serial: { type: String, unique: true, sparse: true }, // Document serial number
}, { timestamps: true });
exports.default = mongoose_1.default.model('Project', ProjectSchema);
