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
exports.completeProject = exports.getAvailableAssets = exports.getProjectProfitability = exports.deleteProject = exports.updateProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = __importDefault(require("../models/Project"));
const Asset_1 = __importDefault(require("../models/Asset"));
const Expense_1 = __importDefault(require("../models/Expense"));
const Payroll_1 = __importDefault(require("../models/Payroll"));
const FuelLog_1 = __importDefault(require("../models/FuelLog"));
const DriverHour_1 = __importDefault(require("../models/DriverHour"));
const serialUtils_1 = require("../utils/serialUtils");
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { assignedAssets } = _a, projectData = __rest(_a, ["assignedAssets"]);
        // Serial number generation
        const docCode = 'PJ';
        const dept = projectData.department || 'PJ';
        const serial = yield (0, serialUtils_1.generateSerial)(docCode, dept, Project_1.default);
        // Create the project first
        const project = new Project_1.default(Object.assign(Object.assign({}, projectData), { serial }));
        yield project.save();
        // If assets are assigned, update their availability
        if (assignedAssets && assignedAssets.length > 0) {
            // Verify all assets are available
            const assets = yield Asset_1.default.find({
                _id: { $in: assignedAssets },
                availability: 'available',
                status: 'active'
            });
            if (assets.length !== assignedAssets.length) {
                return res.status(400).json({
                    message: 'Some assets are not available for assignment'
                });
            }
            // Update project with assigned assets
            project.assignedAssets = assignedAssets;
            yield project.save();
            // Update assets to show they're assigned
            yield Asset_1.default.updateMany({ _id: { $in: assignedAssets } }, {
                availability: 'assigned',
                currentProject: project._id
            });
        }
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createProject = createProject;
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield Project_1.default.find().populate('assignedAssets');
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getProjects = getProjects;
const getProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield Project_1.default.findById(req.params.id).populate('assignedAssets');
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getProject = getProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { assignedAssets } = _a, updateData = __rest(_a, ["assignedAssets"]);
        const projectId = req.params.id;
        // Get current project to check existing asset assignments
        const currentProject = yield Project_1.default.findById(projectId);
        if (!currentProject) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // Handle asset assignment changes
        if (assignedAssets !== undefined) {
            const oldAssets = currentProject.assignedAssets || [];
            const newAssets = assignedAssets || [];
            // Release old assets
            if (oldAssets.length > 0) {
                yield Asset_1.default.updateMany({ _id: { $in: oldAssets } }, {
                    availability: 'available',
                    currentProject: null
                });
            }
            // Assign new assets
            if (newAssets.length > 0) {
                // Verify all new assets are available
                const availableAssets = yield Asset_1.default.find({
                    _id: { $in: newAssets },
                    availability: 'available',
                    status: 'active'
                });
                if (availableAssets.length !== newAssets.length) {
                    return res.status(400).json({
                        message: 'Some assets are not available for assignment'
                    });
                }
                // Update assets to show they're assigned
                yield Asset_1.default.updateMany({ _id: { $in: newAssets } }, {
                    availability: 'assigned',
                    currentProject: projectId
                });
            }
            updateData.assignedAssets = newAssets;
        }
        const project = yield Project_1.default.findByIdAndUpdate(projectId, updateData, { new: true }).populate('assignedAssets');
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateProject = updateProject;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield Project_1.default.findById(req.params.id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // Release assigned assets before deleting project
        if (project.assignedAssets && project.assignedAssets.length > 0) {
            yield Asset_1.default.updateMany({ _id: { $in: project.assignedAssets } }, {
                availability: 'available',
                currentProject: null
            });
        }
        yield Project_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteProject = deleteProject;
const getProjectProfitability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { id } = req.params;
        // Revenue: sum of all income (category: 'income') assigned to this project
        const revenueAgg = yield Expense_1.default.aggregate([
            { $match: { project: new mongoose_1.default.Types.ObjectId(id), category: 'income' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenue = ((_a = revenueAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Costs: sum of all expenses, payroll, fuel logs, driver hours assigned to this project
        const expenseAgg = yield Expense_1.default.aggregate([
            { $match: { project: new mongoose_1.default.Types.ObjectId(id), category: { $ne: 'income' } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const expenses = ((_b = expenseAgg[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        const payrollAgg = yield Payroll_1.default.aggregate([
            { $match: { project: new mongoose_1.default.Types.ObjectId(id) } },
            { $group: { _id: null, total: { $sum: '$netPay' } } }
        ]);
        const payroll = ((_c = payrollAgg[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const fuelAgg = yield FuelLog_1.default.aggregate([
            { $match: { project: new mongoose_1.default.Types.ObjectId(id) } },
            { $group: { _id: null, total: { $sum: '$cost' } } }
        ]);
        const fuel = ((_d = fuelAgg[0]) === null || _d === void 0 ? void 0 : _d.total) || 0;
        const driverHourAgg = yield DriverHour_1.default.aggregate([
            { $match: { project: new mongoose_1.default.Types.ObjectId(id) } },
            { $group: { _id: null, total: { $sum: '$cost' } } }
        ]);
        const driverHours = ((_e = driverHourAgg[0]) === null || _e === void 0 ? void 0 : _e.total) || 0;
        const totalCost = expenses + payroll + fuel + driverHours;
        const profit = revenue - totalCost;
        res.json({ revenue, expenses, payroll, fuel, driverHours, totalCost, profit });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getProjectProfitability = getProjectProfitability;
// New function to get available assets
const getAvailableAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const availableAssets = yield Asset_1.default.find({
            availability: 'available',
            status: 'active'
        }).select('description type brand plateNumber serialNumber fleetNumber');
        res.json(availableAssets);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAvailableAssets = getAvailableAssets;
// New function to complete a project and release assets
const completeProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield Project_1.default.findById(req.params.id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // Release assigned assets
        if (project.assignedAssets && project.assignedAssets.length > 0) {
            yield Asset_1.default.updateMany({ _id: { $in: project.assignedAssets } }, {
                availability: 'available',
                currentProject: null
            });
        }
        // Update project status to completed
        project.status = 'completed';
        project.endTime = new Date();
        yield project.save();
        res.json({ message: 'Project completed and assets released', project });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.completeProject = completeProject;
