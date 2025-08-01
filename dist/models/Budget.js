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
const tabCategories = [
    'Budget Assumptions', 'Summary', 'Variance', 'Expected Sales', 'Sales', 'Other', 'Logistics Cost',
    'Cost Of Water Sale', 'Cost Of Rental Equipment', 'GA', 'OPEX', 'Staff', 'Costs', 'Manpower', 'Capex'
];
const BudgetSchema = new mongoose_1.Schema({
    department: { type: String, required: true },
    project: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Project' },
    period: { type: String, required: true },
    year: { type: Number, required: true },
    category: { type: String, required: true, enum: tabCategories },
    subCategory: { type: String },
    accountCode: { type: String },
    amount: { type: Number, required: true },
    forecast: { type: Number, required: true },
    scenarios: {
        best: { type: Number, required: true },
        worst: { type: Number, required: true },
        expected: { type: Number, required: true },
    },
    actual: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    notes: { type: String },
    history: [
        {
            changedBy: { type: String },
            date: { type: Date, default: Date.now },
            changes: { type: Object },
        }
    ],
});
exports.default = mongoose_1.default.model('Budget', BudgetSchema);
