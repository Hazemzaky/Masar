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
const InvoiceSchema = new mongoose_1.Schema({
    fileUrl: { type: String, required: false },
    uploadedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadDate: { type: Date, default: Date.now },
    expense: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Expense' },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
    dueDate: { type: Date, required: true },
    recipient: {
        name: { type: String, required: true },
        email: { type: String, required: true },
    },
    lineItems: [
        {
            description: { type: String, required: true },
            quantity: { type: Number, required: true },
            unitPrice: { type: Number, required: true },
            total: { type: Number, required: true },
        }
    ],
    totalAmount: { type: Number, required: true },
    history: [
        {
            status: { type: String, required: true },
            date: { type: Date, required: true },
        }
    ],
    serial: { type: String, unique: true, sparse: true }, // Document serial number
});
exports.default = mongoose_1.default.model('Invoice', InvoiceSchema);
