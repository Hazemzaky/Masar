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
exports.trackDowntime = exports.completeMaintenance = exports.deleteMaintenance = exports.updateMaintenance = exports.getMaintenance = exports.getMaintenances = exports.createMaintenance = void 0;
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const InventoryItem_1 = __importDefault(require("../models/InventoryItem"));
const InventoryTransaction_1 = __importDefault(require("../models/InventoryTransaction"));
const createMaintenance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const _c = req.body, { scheduledDate, scheduledTime, completedDate, completedTime } = _c, rest = __rest(_c, ["scheduledDate", "scheduledTime", "completedDate", "completedTime"]);
        const maintenanceData = Object.assign(Object.assign({}, rest), { scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(), scheduledTime: scheduledTime || '', completedDate: completedDate ? new Date(completedDate) : undefined, completedTime: completedTime || undefined, createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId });
        const maintenance = new Maintenance_1.default(maintenanceData);
        yield maintenance.save();
        // Handle inventory deduction if maintenance is created as completed
        if (maintenance.status === 'completed' && maintenance.parts && maintenance.parts.length > 0) {
            console.log('Processing inventory deduction for newly created completed maintenance:', maintenance._id);
            for (const part of maintenance.parts) {
                try {
                    const inventoryItem = yield InventoryItem_1.default.findById(part.item);
                    if (!inventoryItem) {
                        console.error(`Inventory item not found for part: ${part.item}`);
                        continue;
                    }
                    // Check if sufficient stock is available
                    if (inventoryItem.quantity < part.quantity) {
                        console.error(`Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity}, Required: ${part.quantity}`);
                        return res.status(400).json({
                            message: `Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity} ${inventoryItem.uom}, Required: ${part.quantity} ${inventoryItem.uom}`
                        });
                    }
                    // Deduct quantity from inventory
                    inventoryItem.quantity -= part.quantity;
                    yield inventoryItem.save();
                    // Create inventory transaction record
                    yield InventoryTransaction_1.default.create({
                        item: part.item,
                        type: 'outbound',
                        quantity: part.quantity,
                        date: new Date(),
                        relatedMaintenance: maintenance._id,
                        user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                        notes: `Withdrawn for maintenance: ${maintenance.description}`
                    });
                    console.log(`Successfully deducted ${part.quantity} ${inventoryItem.uom} of ${inventoryItem.description}`);
                }
                catch (error) {
                    console.error('Error processing inventory deduction for part:', part, error);
                    return res.status(500).json({
                        message: 'Error processing inventory deduction',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            console.log('Inventory deduction completed successfully for newly created maintenance:', maintenance._id);
        }
        res.status(201).json(maintenance);
    }
    catch (error) {
        console.error('Error creating maintenance:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createMaintenance = createMaintenance;
const getMaintenances = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const maintenances = yield Maintenance_1.default.find()
            .populate('asset')
            .populate('createdBy', 'email')
            .populate('completedBy', 'email')
            .sort({ createdAt: -1 });
        res.json(maintenances);
    }
    catch (error) {
        console.error('Error fetching maintenances:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getMaintenances = getMaintenances;
const getMaintenance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const maintenance = yield Maintenance_1.default.findById(req.params.id)
            .populate('asset')
            .populate('createdBy', 'email')
            .populate('completedBy', 'email');
        if (!maintenance) {
            res.status(404).json({ message: 'Maintenance not found' });
            return;
        }
        res.json(maintenance);
    }
    catch (error) {
        console.error('Error fetching maintenance:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getMaintenance = getMaintenance;
const updateMaintenance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const _b = req.body, { scheduledDate, scheduledTime, completedDate, completedTime } = _b, rest = __rest(_b, ["scheduledDate", "scheduledTime", "completedDate", "completedTime"]);
        // Get the current maintenance record to check if status is changing to 'completed'
        const currentMaintenance = yield Maintenance_1.default.findById(req.params.id);
        if (!currentMaintenance) {
            res.status(404).json({ message: 'Maintenance not found' });
            return;
        }
        const updateData = Object.assign(Object.assign({}, rest), { scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined, scheduledTime: scheduledTime || undefined, completedDate: completedDate ? new Date(completedDate) : undefined, completedTime: completedTime || undefined });
        const maintenance = yield Maintenance_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('asset');
        if (!maintenance) {
            res.status(404).json({ message: 'Maintenance not found' });
            return;
        }
        // Handle inventory deduction if status is changed to 'completed'
        if (maintenance.status === 'completed' &&
            currentMaintenance.status !== 'completed' &&
            maintenance.parts &&
            maintenance.parts.length > 0) {
            console.log('Processing inventory deduction for updated maintenance:', maintenance._id);
            for (const part of maintenance.parts) {
                try {
                    const inventoryItem = yield InventoryItem_1.default.findById(part.item);
                    if (!inventoryItem) {
                        console.error(`Inventory item not found for part: ${part.item}`);
                        continue;
                    }
                    // Check if sufficient stock is available
                    if (inventoryItem.quantity < part.quantity) {
                        console.error(`Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity}, Required: ${part.quantity}`);
                        return res.status(400).json({
                            message: `Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity} ${inventoryItem.uom}, Required: ${part.quantity} ${inventoryItem.uom}`
                        });
                    }
                    // Deduct quantity from inventory
                    inventoryItem.quantity -= part.quantity;
                    yield inventoryItem.save();
                    // Create inventory transaction record
                    yield InventoryTransaction_1.default.create({
                        item: part.item,
                        type: 'outbound',
                        quantity: part.quantity,
                        date: new Date(),
                        relatedMaintenance: maintenance._id,
                        user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
                        notes: `Withdrawn for maintenance: ${maintenance.description}`
                    });
                    console.log(`Successfully deducted ${part.quantity} ${inventoryItem.uom} of ${inventoryItem.description}`);
                }
                catch (error) {
                    console.error('Error processing inventory deduction for part:', part, error);
                    return res.status(500).json({
                        message: 'Error processing inventory deduction',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            console.log('Inventory deduction completed successfully for updated maintenance:', maintenance._id);
        }
        res.json(maintenance);
    }
    catch (error) {
        console.error('Error updating maintenance:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateMaintenance = updateMaintenance;
const deleteMaintenance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const maintenance = yield Maintenance_1.default.findByIdAndDelete(req.params.id);
        if (!maintenance) {
            res.status(404).json({ message: 'Maintenance not found' });
            return;
        }
        res.json({ message: 'Maintenance deleted' });
    }
    catch (error) {
        console.error('Error deleting maintenance:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteMaintenance = deleteMaintenance;
const completeMaintenance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('completeMaintenance called with:', req.body);
        const { status, completedDate, completedTime, totalMaintenanceTime, cancellationReason } = req.body;
        // If cancelling, update status and cancellationReason
        if (status === 'cancelled') {
            const maintenance = yield Maintenance_1.default.findByIdAndUpdate(req.params.id, {
                status: 'cancelled',
                cancellationReason: cancellationReason || '',
            }, { new: true }).populate('asset');
            if (!maintenance) {
                res.status(404).json({ message: 'Maintenance not found' });
                return;
            }
            return res.json(maintenance);
        }
        const updateData = {
            status,
            completedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
            completedDate: completedDate ? new Date(completedDate) : undefined,
            completedTime: completedTime || undefined,
            totalMaintenanceTime: totalMaintenanceTime !== undefined ? totalMaintenanceTime : undefined
        };
        console.log('Updating maintenance with data:', updateData);
        const maintenance = yield Maintenance_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('asset');
        if (!maintenance) {
            res.status(404).json({ message: 'Maintenance not found' });
            return;
        }
        console.log('Maintenance updated successfully:', maintenance._id);
        // Handle inventory deduction when maintenance is completed
        if (status === 'completed' && maintenance.parts && maintenance.parts.length > 0) {
            console.log('Processing inventory deduction for completed maintenance:', maintenance._id);
            console.log('Maintenance parts:', maintenance.parts);
            for (const part of maintenance.parts) {
                try {
                    console.log('Processing part:', part);
                    const inventoryItem = yield InventoryItem_1.default.findById(part.item);
                    if (!inventoryItem) {
                        console.error(`Inventory item not found for part: ${part.item}`);
                        continue;
                    }
                    console.log(`Found inventory item: ${inventoryItem.description}, current quantity: ${inventoryItem.quantity}`);
                    // Check if sufficient stock is available
                    if (inventoryItem.quantity < part.quantity) {
                        console.error(`Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity}, Required: ${part.quantity}`);
                        return res.status(400).json({
                            message: `Insufficient stock for ${inventoryItem.description}. Available: ${inventoryItem.quantity} ${inventoryItem.uom}, Required: ${part.quantity} ${inventoryItem.uom}`
                        });
                    }
                    // Deduct quantity from inventory
                    const oldQuantity = inventoryItem.quantity;
                    inventoryItem.quantity -= part.quantity;
                    yield inventoryItem.save();
                    console.log(`Successfully deducted ${part.quantity} ${inventoryItem.uom} of ${inventoryItem.description}. Old quantity: ${oldQuantity}, New quantity: ${inventoryItem.quantity}`);
                    // Create inventory transaction record
                    yield InventoryTransaction_1.default.create({
                        item: part.item,
                        type: 'outbound',
                        quantity: part.quantity,
                        date: new Date(),
                        relatedMaintenance: maintenance._id,
                        user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                        notes: `Withdrawn for maintenance: ${maintenance.description}`
                    });
                    console.log(`Successfully deducted ${part.quantity} ${inventoryItem.uom} of ${inventoryItem.description}`);
                }
                catch (error) {
                    console.error('Error processing inventory deduction for part:', part, error);
                    return res.status(500).json({
                        message: 'Error processing inventory deduction',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            console.log('Inventory deduction completed successfully for maintenance:', maintenance._id);
        }
        res.json(maintenance);
    }
    catch (error) {
        console.error('Error completing maintenance:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.completeMaintenance = completeMaintenance;
const trackDowntime = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { downtimeHours } = req.body;
        const maintenance = yield Maintenance_1.default.findByIdAndUpdate(req.params.id, { downtimeHours }, { new: true });
        if (!maintenance) {
            res.status(404).json({ message: 'Maintenance not found' });
            return;
        }
        res.json(maintenance);
    }
    catch (error) {
        console.error('Error tracking downtime:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.trackDowntime = trackDowntime;
