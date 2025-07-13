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
exports.deactivateEmployee = exports.updateEmployee = exports.getEmployee = exports.getEmployees = exports.createEmployee = void 0;
const Employee_1 = __importDefault(require("../models/Employee"));
const createEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, position, department, salary, benefits, leaveBalance, hireDate, 
        // Additional fields
        photo, location, supervisor, status, employmentType, dateOfHire, contractExpiryDate, shiftSchedule, workSchedule, employeeGrade, licenseType, licenseExpiryDate, assignedVehicle, routeHistory, gpsTrackingStatus, certifiedEquipment, currentShiftZone, pickRate, errorRate, directReports, currentProjects, departmentalKPIs, phoneNumber, emergencyContactName, emergencyContactNumber, emergencyContactRelationship, languageSkills, logisticsSoftwareKnowledge, equipmentCertifications, firstAidTraining, firstAidExpiryDate, customsComplianceCert, cvResume, employmentContract, idPassportCopy, workPermit, drivingLicense, healthClearance, certificates, performanceRating, attendanceRecord, disciplinaryActions, warningsIssued, lastEvaluationDate, nextEvaluationDate, goalsKPIs, salaryBand, bankAccount, allowances, bonuses, deductions, uniformIssued, uniformSize, uniformIssueDate, ppeIssued, ppeDetails, itEquipment, vehicleAssigned, systemAccounts, accessLevels, biometricId, accessCardId, lastLogin } = req.body;
        // Validate required fields
        if (!name || !email || !position || !department || !salary) {
            res.status(400).json({ message: 'Missing required fields: name, email, position, department, salary' });
            return;
        }
        // Validate benefits
        const validBenefits = Array.isArray(benefits)
            ? benefits.filter((b) => b && typeof b.type === 'string' && typeof b.value === 'number')
            : [];
        // Create employee object with all fields
        const employeeData = {
            name,
            email,
            position,
            department,
            salary: Number(salary),
            benefits: validBenefits,
            leaveBalance: Number(leaveBalance) || 0,
            hireDate: hireDate ? new Date(hireDate) : new Date(),
            // Additional fields
            photo,
            location,
            supervisor,
            status: status || 'Active',
            employmentType: employmentType || 'Full-time',
            dateOfHire,
            contractExpiryDate,
            shiftSchedule: shiftSchedule || 'Day',
            workSchedule,
            employeeGrade,
            licenseType,
            licenseExpiryDate,
            assignedVehicle,
            routeHistory,
            gpsTrackingStatus: Boolean(gpsTrackingStatus),
            certifiedEquipment,
            currentShiftZone,
            pickRate,
            errorRate,
            directReports,
            currentProjects,
            departmentalKPIs,
            phoneNumber,
            emergencyContactName,
            emergencyContactNumber,
            emergencyContactRelationship,
            languageSkills,
            logisticsSoftwareKnowledge,
            equipmentCertifications,
            firstAidTraining,
            firstAidExpiryDate,
            customsComplianceCert,
            cvResume,
            employmentContract,
            idPassportCopy,
            workPermit,
            drivingLicense,
            healthClearance,
            certificates,
            performanceRating,
            attendanceRecord,
            disciplinaryActions,
            warningsIssued,
            lastEvaluationDate,
            nextEvaluationDate,
            goalsKPIs,
            salaryBand,
            bankAccount,
            allowances,
            bonuses,
            deductions,
            uniformIssued: Boolean(uniformIssued),
            uniformSize,
            uniformIssueDate,
            ppeIssued: Boolean(ppeIssued),
            ppeDetails,
            itEquipment,
            vehicleAssigned,
            systemAccounts,
            accessLevels,
            biometricId,
            accessCardId,
            lastLogin
        };
        const employee = new Employee_1.default(employeeData);
        yield employee.save();
        res.status(201).json(employee);
    }
    catch (error) {
        console.error('Error creating employee:', error);
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        // Handle duplicate key errors
        if (error.code === 11000) {
            res.status(400).json({
                message: 'Employee with this email already exists'
            });
            return;
        }
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});
exports.createEmployee = createEmployee;
const getEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employees = yield Employee_1.default.find();
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getEmployees = getEmployees;
const getEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employee = yield Employee_1.default.findById(req.params.id);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getEmployee = getEmployee;
const updateEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { benefits, 
        // Additional fields
        photo, location, supervisor, status, employmentType, dateOfHire, contractExpiryDate, shiftSchedule, workSchedule, employeeGrade, licenseType, licenseExpiryDate, assignedVehicle, routeHistory, gpsTrackingStatus, certifiedEquipment, currentShiftZone, pickRate, errorRate, directReports, currentProjects, departmentalKPIs, phoneNumber, emergencyContactName, emergencyContactNumber, emergencyContactRelationship, languageSkills, logisticsSoftwareKnowledge, equipmentCertifications, firstAidTraining, firstAidExpiryDate, customsComplianceCert, cvResume, employmentContract, idPassportCopy, workPermit, drivingLicense, healthClearance, certificates, performanceRating, attendanceRecord, disciplinaryActions, warningsIssued, lastEvaluationDate, nextEvaluationDate, goalsKPIs, salaryBand, bankAccount, allowances, bonuses, deductions, uniformIssued, uniformSize, uniformIssueDate, ppeIssued, ppeDetails, itEquipment, vehicleAssigned, systemAccounts, accessLevels, biometricId, accessCardId, lastLogin } = _a, rest = __rest(_a, ["benefits", "photo", "location", "supervisor", "status", "employmentType", "dateOfHire", "contractExpiryDate", "shiftSchedule", "workSchedule", "employeeGrade", "licenseType", "licenseExpiryDate", "assignedVehicle", "routeHistory", "gpsTrackingStatus", "certifiedEquipment", "currentShiftZone", "pickRate", "errorRate", "directReports", "currentProjects", "departmentalKPIs", "phoneNumber", "emergencyContactName", "emergencyContactNumber", "emergencyContactRelationship", "languageSkills", "logisticsSoftwareKnowledge", "equipmentCertifications", "firstAidTraining", "firstAidExpiryDate", "customsComplianceCert", "cvResume", "employmentContract", "idPassportCopy", "workPermit", "drivingLicense", "healthClearance", "certificates", "performanceRating", "attendanceRecord", "disciplinaryActions", "warningsIssued", "lastEvaluationDate", "nextEvaluationDate", "goalsKPIs", "salaryBand", "bankAccount", "allowances", "bonuses", "deductions", "uniformIssued", "uniformSize", "uniformIssueDate", "ppeIssued", "ppeDetails", "itEquipment", "vehicleAssigned", "systemAccounts", "accessLevels", "biometricId", "accessCardId", "lastLogin"]);
        const validBenefits = Array.isArray(benefits)
            ? benefits.filter((b) => b && typeof b.type === 'string' && typeof b.value === 'number')
            : [];
        // Create update data object with all fields
        const updateData = Object.assign(Object.assign({}, rest), { benefits: validBenefits, 
            // Additional fields
            photo,
            location,
            supervisor,
            status,
            employmentType,
            dateOfHire,
            contractExpiryDate,
            shiftSchedule,
            workSchedule,
            employeeGrade,
            licenseType,
            licenseExpiryDate,
            assignedVehicle,
            routeHistory, gpsTrackingStatus: gpsTrackingStatus !== undefined ? Boolean(gpsTrackingStatus) : undefined, certifiedEquipment,
            currentShiftZone,
            pickRate,
            errorRate,
            directReports,
            currentProjects,
            departmentalKPIs,
            phoneNumber,
            emergencyContactName,
            emergencyContactNumber,
            emergencyContactRelationship,
            languageSkills,
            logisticsSoftwareKnowledge,
            equipmentCertifications,
            firstAidTraining,
            firstAidExpiryDate,
            customsComplianceCert,
            cvResume,
            employmentContract,
            idPassportCopy,
            workPermit,
            drivingLicense,
            healthClearance,
            certificates,
            performanceRating,
            attendanceRecord,
            disciplinaryActions,
            warningsIssued,
            lastEvaluationDate,
            nextEvaluationDate,
            goalsKPIs,
            salaryBand,
            bankAccount,
            allowances,
            bonuses,
            deductions, uniformIssued: uniformIssued !== undefined ? Boolean(uniformIssued) : undefined, uniformSize,
            uniformIssueDate, ppeIssued: ppeIssued !== undefined ? Boolean(ppeIssued) : undefined, ppeDetails,
            itEquipment,
            vehicleAssigned,
            systemAccounts,
            accessLevels,
            biometricId,
            accessCardId,
            lastLogin });
        const employee = yield Employee_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        res.json(employee);
    }
    catch (error) {
        console.error('Error updating employee:', error);
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        // Handle duplicate key errors
        if (error.code === 11000) {
            res.status(400).json({
                message: 'Employee with this email already exists'
            });
            return;
        }
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});
exports.updateEmployee = updateEmployee;
const deactivateEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employee = yield Employee_1.default.findByIdAndUpdate(req.params.id, { active: false, terminationDate: new Date() }, { new: true });
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        res.json({ message: 'Employee deactivated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deactivateEmployee = deactivateEmployee;
