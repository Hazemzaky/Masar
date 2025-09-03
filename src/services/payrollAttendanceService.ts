import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import mongoose from 'mongoose';

export interface AttendanceBasedPayrollData {
  employeeId: string;
  employee: {
    name: string;
    position: string;
    department: string;
    baseSalary: number;
    hourlyRate?: number;
  };
  attendanceSummary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    leaveDays: number;
    remoteDays: number;
    halfDays: number;
  };
  hoursSummary: {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    breakHours: number;
    paidHours: number;
  };
  deductions: {
    absentDeduction: number;
    lateDeduction: number;
    unpaidLeaveDeduction: number;
    healthViolationDeduction: number;
  };
  bonuses: {
    punctualityBonus: number;
    perfectAttendanceBonus: number;
    productivityBonus: number;
    overtimePayment: number;
  };
  netAdjustment: number;
  finalSalary: number;
  productivityMetrics: {
    averageProductivity: number;
    averageEnergyLevel: number;
    achievements: string[];
    violations: string[];
  };
}

export class PayrollAttendanceService {
  
  /**
   * Calculate payroll based on attendance data for a specific period
   */
  static async calculateAttendanceBasedPayroll(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AttendanceBasedPayrollData | null> {
    try {
      // Get employee data
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Get attendance records for the period
      const attendanceRecords = await Attendance.find({
        employeeId: employeeId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      // Calculate attendance summary
      const attendanceSummary = {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(r => ['present', 'late'].includes(r.status)).length,
        absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
        lateDays: attendanceRecords.filter(r => r.status === 'late').length,
        leaveDays: attendanceRecords.filter(r => r.status === 'on-leave').length,
        remoteDays: attendanceRecords.filter(r => r.workMode === 'remote').length,
        halfDays: attendanceRecords.filter(r => r.status === 'half-day').length
      };

      // Calculate hours summary
      const hoursSummary = {
        totalHours: attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
        regularHours: attendanceRecords.reduce((sum, r) => sum + (r.regularHours || 0), 0),
        overtimeHours: attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
        breakHours: attendanceRecords.reduce((sum, r) => sum + (r.breakDuration || 0) / 60, 0),
        paidHours: 0 // Will be calculated based on attendance
      };

      // Calculate working days in period (excluding weekends)
      const workingDays = this.calculateWorkingDays(startDate, endDate);
      const expectedHours = workingDays * 8; // 8 hours per day standard

      // Calculate paid hours (considering absences and half days)
      hoursSummary.paidHours = hoursSummary.regularHours + 
        (attendanceSummary.halfDays * 4) + // Half day = 4 hours
        hoursSummary.overtimeHours;

      // Calculate deductions
      const baseSalary = employee.salary || 0;
      const hourlyRate = employee.hourlyRate || (baseSalary / (workingDays * 8));
      
      const deductions = {
        absentDeduction: attendanceSummary.absentDays * (baseSalary / workingDays),
        lateDeduction: attendanceSummary.lateDays * (hourlyRate * 0.5), // 0.5 hour deduction per late
        unpaidLeaveDeduction: this.calculateUnpaidLeaveDeduction(attendanceRecords, baseSalary, workingDays),
        healthViolationDeduction: this.calculateHealthViolationDeduction(attendanceRecords, hourlyRate)
      };

      // Calculate bonuses
      const bonuses = {
        punctualityBonus: attendanceSummary.lateDays === 0 ? baseSalary * 0.02 : 0, // 2% bonus for no late days
        perfectAttendanceBonus: attendanceSummary.absentDays === 0 ? baseSalary * 0.03 : 0, // 3% bonus for perfect attendance
        productivityBonus: this.calculateProductivityBonus(attendanceRecords, baseSalary),
        overtimePayment: hoursSummary.overtimeHours * hourlyRate * 1.5 // 1.5x rate for overtime
      };

      // Calculate productivity metrics
      const productivityMetrics = {
        averageProductivity: attendanceRecords.length > 0 ? 
          attendanceRecords.reduce((sum, r) => sum + (r.productivity?.score || 0), 0) / attendanceRecords.length : 0,
        averageEnergyLevel: attendanceRecords.length > 0 ?
          attendanceRecords.reduce((sum, r) => sum + (r.energyLevel || 5), 0) / attendanceRecords.length : 5,
        achievements: [...new Set(attendanceRecords.flatMap(r => r.achievements || []))],
        violations: [...new Set(attendanceRecords.flatMap(r => r.violations || []))]
      };

      // Calculate net adjustment and final salary
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
      const totalBonuses = Object.values(bonuses).reduce((sum, val) => sum + val, 0);
      const netAdjustment = totalBonuses - totalDeductions;
      const finalSalary = baseSalary + netAdjustment;

      return {
        employeeId,
        employee: {
          name: employee.name,
          position: employee.position || '',
          department: employee.department || '',
          baseSalary,
          hourlyRate
        },
        attendanceSummary,
        hoursSummary,
        deductions,
        bonuses,
        netAdjustment,
        finalSalary: Math.max(0, finalSalary), // Ensure non-negative
        productivityMetrics
      };

    } catch (error) {
      console.error('Error calculating attendance-based payroll:', error);
      return null;
    }
  }

  /**
   * Calculate payroll for all employees for a specific period
   */
  static async calculateBulkAttendancePayroll(
    startDate: Date, 
    endDate: Date, 
    departmentFilter?: string
  ): Promise<AttendanceBasedPayrollData[]> {
    try {
      let employeeQuery: any = { status: 'active' };
      if (departmentFilter) {
        employeeQuery.department = departmentFilter;
      }

      const employees = await Employee.find(employeeQuery);
      const payrollData: AttendanceBasedPayrollData[] = [];

      for (const employee of employees) {
        const data = await this.calculateAttendanceBasedPayroll(
          (employee._id as any).toString(), 
          startDate, 
          endDate
        );
        if (data) {
          payrollData.push(data);
        }
      }

      return payrollData.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
    } catch (error) {
      console.error('Error calculating bulk attendance payroll:', error);
      return [];
    }
  }

  /**
   * Get attendance insights for payroll decisions
   */
  static async getAttendanceInsights(
    startDate: Date, 
    endDate: Date
  ): Promise<{
    topPerformers: any[];
    attendanceRisks: any[];
    departmentSummary: any[];
    costImpact: {
      totalSalaryBudget: number;
      attendanceAdjustments: number;
      overtimeCosts: number;
      bonusPayout: number;
      deductionSavings: number;
    };
  }> {
    try {
      const payrollData = await this.calculateBulkAttendancePayroll(startDate, endDate);

      // Top performers (highest productivity + attendance)
      const topPerformers = payrollData
        .filter(p => p.attendanceSummary.presentDays > 0)
        .map(p => ({
          employeeId: p.employeeId,
          name: p.employee.name,
          department: p.employee.department,
          attendanceRate: (p.attendanceSummary.presentDays / p.attendanceSummary.totalDays) * 100,
          productivityScore: p.productivityMetrics.averageProductivity,
          combinedScore: ((p.attendanceSummary.presentDays / p.attendanceSummary.totalDays) * 50) + 
                        (p.productivityMetrics.averageProductivity * 0.5),
          bonusEarned: Object.values(p.bonuses).reduce((sum, val) => sum + val, 0)
        }))
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, 10);

      // Attendance risks (high absence or low productivity)
      const attendanceRisks = payrollData
        .filter(p => {
          const attendanceRate = (p.attendanceSummary.presentDays / p.attendanceSummary.totalDays) * 100;
          return attendanceRate < 85 || p.productivityMetrics.averageProductivity < 60 || p.attendanceSummary.absentDays > 5;
        })
        .map(p => ({
          employeeId: p.employeeId,
          name: p.employee.name,
          department: p.employee.department,
          attendanceRate: (p.attendanceSummary.presentDays / p.attendanceSummary.totalDays) * 100,
          absentDays: p.attendanceSummary.absentDays,
          lateDays: p.attendanceSummary.lateDays,
          productivityScore: p.productivityMetrics.averageProductivity,
          totalDeductions: Object.values(p.deductions).reduce((sum, val) => sum + val, 0),
          riskLevel: this.calculateRiskLevel(p)
        }))
        .sort((a, b) => b.totalDeductions - a.totalDeductions);

      // Department summary
      const departmentMap = new Map();
      payrollData.forEach(p => {
        const dept = p.employee.department;
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            employeeCount: 0,
            totalSalary: 0,
            totalDeductions: 0,
            totalBonuses: 0,
            averageAttendance: 0,
            averageProductivity: 0
          });
        }
        
        const deptData = departmentMap.get(dept);
        deptData.employeeCount += 1;
        deptData.totalSalary += p.employee.baseSalary;
        deptData.totalDeductions += Object.values(p.deductions).reduce((sum, val) => sum + val, 0);
        deptData.totalBonuses += Object.values(p.bonuses).reduce((sum, val) => sum + val, 0);
        deptData.averageAttendance += (p.attendanceSummary.presentDays / p.attendanceSummary.totalDays) * 100;
        deptData.averageProductivity += p.productivityMetrics.averageProductivity;
      });

      const departmentSummary = Array.from(departmentMap.values()).map(dept => ({
        ...dept,
        averageAttendance: dept.averageAttendance / dept.employeeCount,
        averageProductivity: dept.averageProductivity / dept.employeeCount,
        netAdjustment: dept.totalBonuses - dept.totalDeductions
      }));

      // Cost impact summary
      const costImpact = {
        totalSalaryBudget: payrollData.reduce((sum, p) => sum + p.employee.baseSalary, 0),
        attendanceAdjustments: payrollData.reduce((sum, p) => sum + p.netAdjustment, 0),
        overtimeCosts: payrollData.reduce((sum, p) => sum + p.bonuses.overtimePayment, 0),
        bonusPayout: payrollData.reduce((sum, p) => sum + Object.values(p.bonuses).reduce((s, v) => s + v, 0), 0),
        deductionSavings: payrollData.reduce((sum, p) => sum + Object.values(p.deductions).reduce((s, v) => s + v, 0), 0)
      };

      return {
        topPerformers,
        attendanceRisks,
        departmentSummary,
        costImpact
      };
    } catch (error) {
      console.error('Error getting attendance insights:', error);
      return {
        topPerformers: [],
        attendanceRisks: [],
        departmentSummary: [],
        costImpact: {
          totalSalaryBudget: 0,
          attendanceAdjustments: 0,
          overtimeCosts: 0,
          bonusPayout: 0,
          deductionSavings: 0
        }
      };
    }
  }

  // Helper methods
  private static calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  private static calculateUnpaidLeaveDeduction(records: any[], baseSalary: number, workingDays: number): number {
    const unpaidLeaveDays = records.filter(r => 
      r.status === 'on-leave' && r.notes?.toLowerCase().includes('unpaid')
    ).length;
    
    return unpaidLeaveDays * (baseSalary / workingDays);
  }

  private static calculateHealthViolationDeduction(records: any[], hourlyRate: number): number {
    const violations = records.reduce((count, r) => count + (r.violations?.length || 0), 0);
    return violations * (hourlyRate * 0.25); // 0.25 hour deduction per violation
  }

  private static calculateProductivityBonus(records: any[], baseSalary: number): number {
    if (records.length === 0) return 0;
    
    const avgProductivity = records.reduce((sum, r) => sum + (r.productivity?.score || 0), 0) / records.length;
    
    if (avgProductivity >= 95) return baseSalary * 0.05; // 5% bonus for 95%+ productivity
    if (avgProductivity >= 90) return baseSalary * 0.03; // 3% bonus for 90%+ productivity
    if (avgProductivity >= 85) return baseSalary * 0.01; // 1% bonus for 85%+ productivity
    
    return 0;
  }

  private static calculateRiskLevel(payrollData: AttendanceBasedPayrollData): 'low' | 'medium' | 'high' {
    const attendanceRate = (payrollData.attendanceSummary.presentDays / payrollData.attendanceSummary.totalDays) * 100;
    const productivity = payrollData.productivityMetrics.averageProductivity;
    
    if (attendanceRate < 70 || productivity < 50 || payrollData.attendanceSummary.absentDays > 8) {
      return 'high';
    } else if (attendanceRate < 85 || productivity < 70 || payrollData.attendanceSummary.absentDays > 4) {
      return 'medium';
    }
    return 'low';
  }
}
