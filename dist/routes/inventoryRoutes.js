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
const express_1 = require("express");
const inventoryController = __importStar(require("../controllers/inventoryController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Inventory Items
router.post('/items', auth_1.authenticate, inventoryController.createItem);
router.get('/items', auth_1.authenticate, inventoryController.getItems);
router.get('/items/:id', auth_1.authenticate, inventoryController.getItem);
router.put('/items/:id', auth_1.authenticate, inventoryController.updateItem);
router.delete('/items/:id', auth_1.authenticate, inventoryController.deleteItem);
// Inventory Transactions
router.post('/transactions', auth_1.authenticate, inventoryController.createTransaction);
router.get('/transactions', auth_1.authenticate, inventoryController.getTransactions);
router.get('/items/:id/transactions', auth_1.authenticate, inventoryController.getItemTransactions);
exports.default = router;
