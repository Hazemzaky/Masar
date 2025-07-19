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
const employeeController = __importStar(require("../controllers/employeeController"));
const router = (0, express_1.Router)();
// Basic CRUD operations
router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);
// Employee management operations
router.put('/:id/deactivate', employeeController.deactivateEmployee);
// Bulk operations
router.put('/bulk/update', employeeController.bulkUpdateEmployees);
// Statistics and analytics
router.get('/stats/overview', employeeController.getEmployeeStats);
// ==================== ATTENDANCE ENDPOINTS ====================
router.post('/:id/attendance/check-in', employeeController.checkIn);
router.post('/:id/attendance/check-out', employeeController.checkOut);
router.post('/:id/attendance/mark-leave', employeeController.markLeave);
router.get('/:id/attendance/history', employeeController.getAttendanceHistory);
router.get('/:id/attendance/stats', employeeController.getAttendanceStats);
exports.default = router;
