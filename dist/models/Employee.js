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
const EmployeeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    position: { type: String, required: true },
    department: { type: String, required: true },
    salary: { type: Number, required: true },
    benefits: [{
            type: { type: String, required: true },
            value: { type: Number, required: true }
        }],
    leaveBalance: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    hireDate: { type: Date, required: true },
    terminationDate: { type: Date },
    // Additional fields for comprehensive employee management
    photo: { type: String },
    location: { type: String },
    supervisor: { type: String },
    status: { type: String, default: 'Active' },
    employmentType: { type: String, default: 'Full-time' },
    dateOfHire: { type: String },
    contractExpiryDate: { type: String },
    shiftSchedule: { type: String, default: 'Day' },
    workSchedule: { type: String },
    employeeGrade: { type: String },
    licenseType: { type: String },
    licenseExpiryDate: { type: String },
    assignedVehicle: { type: String },
    routeHistory: { type: String },
    gpsTrackingStatus: { type: Boolean, default: false },
    certifiedEquipment: { type: String },
    currentShiftZone: { type: String },
    pickRate: { type: String },
    errorRate: { type: String },
    directReports: { type: String },
    currentProjects: { type: String },
    departmentalKPIs: { type: String },
    phoneNumber: { type: String },
    emergencyContactName: { type: String },
    emergencyContactNumber: { type: String },
    emergencyContactRelationship: { type: String },
    languageSkills: { type: String },
    logisticsSoftwareKnowledge: { type: String },
    equipmentCertifications: { type: String },
    firstAidTraining: { type: String },
    firstAidExpiryDate: { type: String },
    customsComplianceCert: { type: String },
    cvResume: { type: String },
    employmentContract: { type: String },
    idPassportCopy: { type: String },
    workPermit: { type: String },
    drivingLicense: { type: String },
    healthClearance: { type: String },
    certificates: { type: String },
    performanceRating: { type: String },
    attendanceRecord: { type: String },
    disciplinaryActions: { type: String },
    warningsIssued: { type: String },
    lastEvaluationDate: { type: String },
    nextEvaluationDate: { type: String },
    goalsKPIs: { type: String },
    salaryBand: { type: String },
    bankAccount: { type: String },
    allowances: { type: String },
    bonuses: { type: String },
    deductions: { type: String },
    uniformIssued: { type: Boolean, default: false },
    uniformSize: { type: String },
    uniformIssueDate: { type: String },
    ppeIssued: { type: Boolean, default: false },
    ppeDetails: { type: String },
    itEquipment: { type: String },
    vehicleAssigned: { type: String },
    systemAccounts: { type: String },
    accessLevels: { type: String },
    biometricId: { type: String },
    accessCardId: { type: String },
    lastLogin: { type: String },
});
exports.default = mongoose_1.default.model('Employee', EmployeeSchema);
