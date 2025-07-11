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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = createItem;
exports.getItems = getItems;
exports.getItem = getItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.createTransaction = createTransaction;
exports.getTransactions = getTransactions;
exports.getItemTransactions = getItemTransactions;
const InventoryItem_1 = __importDefault(require("../models/InventoryItem"));
const InventoryTransaction_1 = __importDefault(require("../models/InventoryTransaction"));
function createItem(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const item = new InventoryItem_1.default(req.body);
            yield item.save();
            res.status(201).json(item);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function getItems(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield InventoryItem_1.default.find();
            res.json(items);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function getItem(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield InventoryItem_1.default.findById(req.params.id);
            if (!item)
                return res.status(404).json({ message: 'Item not found' });
            res.json(item);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function updateItem(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield InventoryItem_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!item)
                return res.status(404).json({ message: 'Item not found' });
            res.json(item);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function deleteItem(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield InventoryItem_1.default.findByIdAndDelete(req.params.id);
            if (!item)
                return res.status(404).json({ message: 'Item not found' });
            res.json({ message: 'Item deleted' });
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function createTransaction(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const _a = req.body, { type, parts, maintenanceId } = _a, rest = __rest(_a, ["type", "parts", "maintenanceId"]);
            // Handle multiple parts for maintenance
            if (parts && Array.isArray(parts)) {
                const transactions = [];
                for (const part of parts) {
                    const { item, quantity, notes } = part;
                    const inventoryItem = yield InventoryItem_1.default.findById(item);
                    if (!inventoryItem) {
                        return res.status(404).json({ message: `Item ${item} not found` });
                    }
                    let newQty = inventoryItem.quantity;
                    if (type === 'inbound')
                        newQty += quantity;
                    else if (type === 'outbound')
                        newQty -= quantity;
                    else if (type === 'adjustment')
                        newQty = quantity;
                    if (newQty < 0) {
                        return res.status(400).json({
                            message: `Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity} ${inventoryItem.uom}`
                        });
                    }
                    inventoryItem.quantity = newQty;
                    yield inventoryItem.save();
                    const transaction = new InventoryTransaction_1.default(Object.assign({ item,
                        type,
                        quantity,
                        notes, relatedMaintenance: maintenanceId }, rest));
                    yield transaction.save();
                    transactions.push(transaction);
                }
                return res.status(201).json(transactions);
            }
            // Handle single item transaction (original logic)
            const _b = req.body, { item, quantity } = _b, singleRest = __rest(_b, ["item", "quantity"]);
            const inventoryItem = yield InventoryItem_1.default.findById(item);
            if (!inventoryItem)
                return res.status(404).json({ message: 'Item not found' });
            let newQty = inventoryItem.quantity;
            if (type === 'inbound')
                newQty += quantity;
            else if (type === 'outbound')
                newQty -= quantity;
            else if (type === 'adjustment')
                newQty = quantity;
            if (newQty < 0)
                return res.status(400).json({ message: 'Insufficient stock' });
            inventoryItem.quantity = newQty;
            yield inventoryItem.save();
            const transaction = new InventoryTransaction_1.default(Object.assign({ item, type, quantity }, singleRest));
            yield transaction.save();
            res.status(201).json(transaction);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function getTransactions(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const filter = {};
            if (req.query.item)
                filter.item = req.query.item;
            if (req.query.type)
                filter.type = req.query.type;
            const txns = yield InventoryTransaction_1.default.find(filter).populate('item').populate('relatedAsset').populate('relatedMaintenance').populate('user');
            res.json(txns);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
function getItemTransactions(req, res) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const txns = yield InventoryTransaction_1.default.find({ item: req.params.id }).populate('item').populate('relatedAsset').populate('relatedMaintenance').populate('user');
            res.json(txns);
        }
        catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }))();
}
