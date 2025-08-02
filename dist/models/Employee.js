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
// Sub-schemas for complex nested objects
const DriverLicenseSchema = new mongoose_1.Schema({
    number: { type: String },
    expiryDate: { type: String },
    type: { type: String }
});
const VehicleAssignmentSchema = new mongoose_1.Schema({
    vehicleId: { type: String },
    vehicleType: { type: String },
    assignedDate: { type: String }
});
const WorkShiftSchema = new mongoose_1.Schema({
    id: { type: String },
    name: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    days: [{ type: String }]
});
const CertificationSchema = new mongoose_1.Schema({
    id: { type: String },
    name: { type: String },
    type: { type: String, enum: ['forklift', 'hse', 'hazmat', 'other'] },
    issueDate: { type: String },
    expiryDate: { type: String },
    status: { type: String, enum: ['valid', 'expired', 'expiring-soon'] }
});
const CompensationHistorySchema = new mongoose_1.Schema({
    date: { type: String },
    amount: { type: Number },
    type: { type: String },
    reason: { type: String }
});
const BonusRecordSchema = new mongoose_1.Schema({
    date: { type: String },
    amount: { type: Number },
    type: { type: String },
    description: { type: String }
});
const AllowancesSchema = new mongoose_1.Schema({
    transport: { type: Number, default: 0 },
    housing: { type: Number, default: 0 },
    meal: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
});
const BankInfoSchema = new mongoose_1.Schema({
    bankName: { type: String },
    accountNumber: { type: String },
    iban: { type: String }
});
const LeaveBalanceDetailsSchema = new mongoose_1.Schema({
    vacation: { type: Number, default: 0 },
    sick: { type: Number, default: 0 },
    personal: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
});
const UpcomingLeaveSchema = new mongoose_1.Schema({
    startDate: { type: String },
    endDate: { type: String },
    type: { type: String },
    status: { type: String }
});
const AttendanceLogSchema = new mongoose_1.Schema({
    date: { type: String },
    checkIn: { type: String },
    checkOut: { type: String },
    hours: { type: Number },
    status: { type: String, enum: ['present', 'absent', 'late', 'on-leave'] }
});
const PerformanceGoalSchema = new mongoose_1.Schema({
    id: { type: String },
    title: { type: String },
    description: { type: String },
    progress: { type: Number },
    dueDate: { type: String },
    status: { type: String }
});
const PerformanceFeedbackSchema = new mongoose_1.Schema({
    date: { type: String },
    reviewer: { type: String },
    rating: { type: Number },
    comments: { type: String },
    tags: [{ type: String }]
});
const PerformanceKPIsSchema = new mongoose_1.Schema({
    deliveryTimeliness: { type: Number },
    customerComplaints: { type: Number },
    vehicleUtilization: { type: Number },
    delayPercentage: { type: Number }
});
const PerformanceSchema = new mongoose_1.Schema({
    lastReviewDate: { type: String },
    rating: { type: Number },
    goals: [PerformanceGoalSchema],
    feedback: [PerformanceFeedbackSchema],
    kpis: PerformanceKPIsSchema
});
const DocumentSchema = new mongoose_1.Schema({
    id: { type: String },
    name: { type: String },
    type: { type: String },
    uploadDate: { type: String },
    expiryDate: { type: String },
    status: { type: String, enum: ['valid', 'expired', 'expiring-soon'] },
    category: { type: String, enum: ['id', 'contract', 'medical', 'training', 'license', 'other'] }
});
const ComplianceSchema = new mongoose_1.Schema({
    visaExpiry: { type: String },
    workPermitExpiry: { type: String },
    medicalCheckExpiry: { type: String },
    insuranceStatus: { type: String, enum: ['active', 'expired', 'pending'] }
});
const TimelineEventSchema = new mongoose_1.Schema({
    id: { type: String },
    date: { type: String },
    event: { type: String },
    description: { type: String },
    type: { type: String, enum: ['join', 'promotion', 'leave', 'warning', 'training', 'contract-renewal'] }
});
const HRActionSchema = new mongoose_1.Schema({
    id: { type: String },
    date: { type: String },
    action: { type: String },
    performedBy: { type: String },
    notes: { type: String }
});
const RecognitionSchema = new mongoose_1.Schema({
    id: { type: String },
    type: { type: String, enum: ['employee-of-month', 'safety-milestone', 'performance-award', 'peer-compliment'] },
    title: { type: String },
    date: { type: String },
    description: { type: String }
});
const EquipmentSchema = new mongoose_1.Schema({
    id: { type: String },
    type: { type: String, enum: ['laptop', 'phone', 'uniform', 'rfid-badge', 'vehicle', 'other'] },
    name: { type: String },
    assignedDate: { type: String },
    returnDate: { type: String },
    status: { type: String, enum: ['assigned', 'returned', 'lost'] }
});
const HRNoteSchema = new mongoose_1.Schema({
    id: { type: String },
    date: { type: String },
    note: { type: String },
    hrPersonnel: { type: String },
    followUpDate: { type: String }
});
const OrgChartSchema = new mongoose_1.Schema({
    manager: { type: String },
    directReports: [{ type: String }],
    peers: [{ type: String }]
});
const SkillTagSchema = new mongoose_1.Schema({
    name: { type: String },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    endorsedBy: [{ type: String }]
});
const EmergencyContactSchema = new mongoose_1.Schema({
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
});
const ReadinessTrackerSchema = new mongoose_1.Schema({
    licenseValid: { type: Boolean, default: false },
    safetyTraining: { type: Boolean, default: false },
    medicallyFit: { type: Boolean, default: false },
    vehicleAssigned: { type: Boolean, default: false },
    readyForField: { type: Boolean, default: false }
});
const OvertimeSchema = new mongoose_1.Schema({
    weeklyHours: { type: Number, default: 0 },
    monthlyHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 }
});
const EmployeeSchema = new mongoose_1.Schema({
    // Basic Information
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
    phone: { type: String },
    address: { type: String },
    emergencyContact: { type: String },
    performanceRating: { type: Number },
    lastReviewDate: { type: String },
    skills: [{ type: String }],
    manager: { type: String },
    location: { type: String },
    // Enhanced comprehensive fields
    employeeId: { type: String },
    personalEmail: { type: String },
    dateOfBirth: { type: String },
    nationality: { type: String },
    passportNumber: { type: String },
    civilId: { type: String },
    // Add employeeType and citizenType
    employeeType: { type: String, enum: ['Citizen', 'Foreigner'], required: true },
    citizenType: { type: String, enum: ['Kuwaiti', 'Bedoun'] },
    residencyNumber: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    employmentType: { type: String, enum: ['full-time', 'part-time', 'contractor', 'daily'], default: 'full-time' },
    jobLevel: { type: String },
    hourlyRate: { type: Number },
    site: { type: String },
    status: { type: String, enum: ['active', 'on-leave', 'resigned', 'suspended'], default: 'active' },
    // Logistics-specific fields
    driverLicense: DriverLicenseSchema,
    vehicleAssignment: VehicleAssignmentSchema,
    workShifts: [WorkShiftSchema],
    certifications: [CertificationSchema],
    // Compensation & Benefits
    compensationHistory: [CompensationHistorySchema],
    bonusRecords: [BonusRecordSchema],
    allowances: AllowancesSchema,
    bankInfo: BankInfoSchema,
    payrollIncluded: { type: Boolean, default: true },
    bonusEligible: { type: Boolean, default: true },
    // Leave & Attendance
    leaveBalanceDetails: LeaveBalanceDetailsSchema,
    upcomingLeaves: [UpcomingLeaveSchema],
    attendanceLog: [AttendanceLogSchema],
    attendancePercentage: { type: Number, default: 0 },
    absenceFrequency: { type: Number, default: 0 },
    // Performance & Development
    performance: PerformanceSchema,
    // Documents & Compliance
    documents: [DocumentSchema],
    compliance: ComplianceSchema,
    // Timeline & History
    timeline: [TimelineEventSchema],
    hrActions: [HRActionSchema],
    // Recognition & Awards
    recognition: [RecognitionSchema],
    // Equipment & Assets
    equipment: [EquipmentSchema],
    // Private HR Notes
    privateNotes: { type: String },
    hrNotes: [HRNoteSchema],
    // Organizational
    orgChart: OrgChartSchema,
    skillTags: [SkillTagSchema],
    customTags: [{ type: String }],
    attritionRisk: { type: String, enum: ['low', 'medium', 'high'] },
    officeLocation: { type: String },
    workMode: { type: String, enum: ['office', 'remote', 'hybrid'] },
    emergencyContacts: [EmergencyContactSchema],
    // Readiness Tracker (for drivers/operators)
    readinessTracker: ReadinessTrackerSchema,
    // Overtime & Hours
    overtime: OvertimeSchema,
}, { timestamps: true });
exports.default = mongoose_1.default.model('Employee', EmployeeSchema);
