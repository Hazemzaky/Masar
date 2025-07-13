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
exports.completeProject = exports.getAvailableAssets = exports.getProjectProfitability = exports.deleteProject = exports.updateProject = exports.getProject = exports.getProjects = exports.createProject = exports.checkEmployeeAvailability = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = __importDefault(require("../models/Project"));
const Asset_1 = __importDefault(require("../models/Asset"));
const Expense_1 = __importDefault(require("../models/Expense"));
const Payroll_1 = __importDefault(require("../models/Payroll"));
const FuelLog_1 = __importDefault(require("../models/FuelLog"));
const DriverHour_1 = __importDefault(require("../models/DriverHour"));
const Payroll_2 = require("../models/Payroll");
// New function to check employee availability for project assignment
const checkEmployeeAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeIds } = req.body;
        if (!employeeIds || !Array.isArray(employeeIds)) {
            res.status(400).json({ message: 'Employee IDs array is required' });
            return;
        }
        const availabilityResults = [];
        for (const employeeId of employeeIds) {
            const employee = yield Payroll_2.PayrollEmployee.findById(employeeId)
                .select('fullName employeeCode position department currentProject')
                .populate('currentProject', 'customer description status');
            if (!employee) {
                availabilityResults.push({
                    employeeId,
                    available: false,
                    reason: 'Employee not found'
                });
                continue;
            }
            if (employee.currentProject) {
                availabilityResults.push({
                    employeeId,
                    employeeName: employee.fullName,
                    employeeCode: employee.employeeCode,
                    available: false,
                    reason: 'Already assigned to project',
                    currentProject: employee.currentProject
                });
            }
            else {
                availabilityResults.push({
                    employeeId,
                    employeeName: employee.fullName,
                    employeeCode: employee.employeeCode,
                    available: true
                });
            }
        }
        res.json(availabilityResults);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.checkEmployeeAvailability = checkEmployeeAvailability;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customer, equipmentDescription, rentTime, rentType, timing, operatorDriver, startTime, endTime, description, revenue, notes, assignedEmployees, assignedDrivers } = req.body;
        // Validate required fields
        if (!customer || !equipmentDescription || !rentTime || !rentType || !timing || !operatorDriver) {
            return res.status(400).json({
                message: 'Missing required fields: customer, equipmentDescription, rentTime, rentType, timing, operatorDriver'
            });
        }
        // If assignedDrivers is provided, check their availability
        if (assignedDrivers && Array.isArray(assignedDrivers) && assignedDrivers.length > 0) {
            const availabilityCheck = yield Promise.all(assignedDrivers.map((employeeId) => __awaiter(void 0, void 0, void 0, function* () {
                const employee = yield Payroll_2.PayrollEmployee.findById(employeeId);
                return {
                    employeeId,
                    available: !(employee === null || employee === void 0 ? void 0 : employee.currentProject),
                    employee: employee
                };
            })));
            const unavailableEmployees = availabilityCheck.filter(check => !check.available);
            if (unavailableEmployees.length > 0) {
                return res.status(400).json({
                    message: 'Some drivers are not available for assignment',
                    unavailableEmployees: unavailableEmployees.map(u => {
                        var _a, _b;
                        return ({
                            employeeId: u.employeeId,
                            employeeName: (_a = u.employee) === null || _a === void 0 ? void 0 : _a.fullName,
                            currentProject: (_b = u.employee) === null || _b === void 0 ? void 0 : _b.currentProject
                        });
                    })
                });
            }
        }
        // Create the project
        const projectData = {
            customer,
            equipmentDescription,
            rentTime,
            rentType,
            timing,
            operatorDriver,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
            status: 'active',
            description,
            revenue: revenue ? Number(revenue) : undefined,
            notes,
            assignedDrivers: assignedDrivers || []
        };
        const project = new Project_1.default(projectData);
        yield project.save();
        // If drivers are assigned, update their project assignment
        if (assignedDrivers && Array.isArray(assignedDrivers) && assignedDrivers.length > 0) {
            yield Promise.all(assignedDrivers.map((employeeId) => __awaiter(void 0, void 0, void 0, function* () {
                yield Payroll_2.PayrollEmployee.findByIdAndUpdate(employeeId, {
                    currentProject: project._id,
                    projectAssignmentDate: new Date()
                });
            })));
        }
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createProject = createProject;
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield Project_1.default.find()
            .populate('assignedAssets')
            .populate('assignedDrivers', 'fullName employeeCode position department');
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getProjects = getProjects;
const getProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield Project_1.default.findById(req.params.id)
            .populate('assignedAssets')
            .populate('assignedDrivers', 'fullName employeeCode position department');
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
        const _a = req.body, { assignedAssets, assignedDrivers } = _a, updateData = __rest(_a, ["assignedAssets", "assignedDrivers"]);
        const projectId = req.params.id;
        // Get current project to check existing asset and driver assignments
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
        // Handle driver assignment changes
        if (assignedDrivers !== undefined) {
            const oldDrivers = currentProject.assignedDrivers || [];
            const newDrivers = assignedDrivers || [];
            // Unassign old drivers
            if (oldDrivers.length > 0) {
                yield Payroll_2.PayrollEmployee.updateMany({ _id: { $in: oldDrivers } }, {
                    currentProject: null,
                    projectAssignmentDate: null
                });
            }
            // Check availability of new drivers
            if (newDrivers.length > 0) {
                const availabilityCheck = yield Promise.all(newDrivers.map((employeeId) => __awaiter(void 0, void 0, void 0, function* () {
                    const employee = yield Payroll_2.PayrollEmployee.findById(employeeId);
                    return {
                        employeeId,
                        available: !(employee === null || employee === void 0 ? void 0 : employee.currentProject) || employee.currentProject.toString() === projectId,
                        employee: employee
                    };
                })));
                const unavailableDrivers = availabilityCheck.filter(check => !check.available);
                if (unavailableDrivers.length > 0) {
                    return res.status(400).json({
                        message: 'Some drivers are not available for assignment',
                        unavailableDrivers: unavailableDrivers.map(u => {
                            var _a, _b;
                            return ({
                                employeeId: u.employeeId,
                                employeeName: (_a = u.employee) === null || _a === void 0 ? void 0 : _a.fullName,
                                currentProject: (_b = u.employee) === null || _b === void 0 ? void 0 : _b.currentProject
                            });
                        })
                    });
                }
                // Assign new drivers
                yield Promise.all(newDrivers.map((employeeId) => __awaiter(void 0, void 0, void 0, function* () {
                    yield Payroll_2.PayrollEmployee.findByIdAndUpdate(employeeId, {
                        currentProject: projectId,
                        projectAssignmentDate: new Date()
                    });
                })));
            }
            updateData.assignedDrivers = newDrivers;
        }
        const project = yield Project_1.default.findByIdAndUpdate(projectId, updateData, { new: true })
            .populate('assignedAssets')
            .populate('assignedDrivers', 'fullName employeeCode position department');
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
        // Unassign drivers before deleting project
        if (project.assignedDrivers && project.assignedDrivers.length > 0) {
            yield Payroll_2.PayrollEmployee.updateMany({ _id: { $in: project.assignedDrivers } }, {
                currentProject: null,
                projectAssignmentDate: null
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
        const { id } = req.params;
        const project = yield Project_1.default.findById(id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // Update project status to completed
        project.status = 'completed';
        project.endTime = new Date();
        yield project.save();
        // Unassign all employees from this project
        yield Payroll_2.PayrollEmployee.updateMany({ currentProject: id }, {
            currentProject: null,
            projectAssignmentDate: null
        });
        // Also unassign any assets from this project
        yield Asset_1.default.updateMany({ currentProject: id }, {
            availability: 'available',
            currentProject: null
        });
        res.json({ message: 'Project completed successfully', project });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.completeProject = completeProject;
