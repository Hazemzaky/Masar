import express from 'express';
import { body, validationResult } from 'express-validator';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { authMiddleware } from '../middleware/auth';
import { PayrollAttendanceService } from '../services/payrollAttendanceService';

const router = express.Router();

// Get attendance records with advanced filtering
router.get('/records', authMiddleware, async (req, res) => {
  try {
    const { date, employeeId, department, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let query: any = {};
    
    // Date filtering
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = {
        $gte: targetDate,
        $lt: nextDay
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else {
      // Default to today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = {
        $gte: today,
        $lt: tomorrow
      };
    }
    
    // Employee filtering
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    // Status filtering
    if (status) {
      query.status = status;
    }
    
    const records = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'name email position department employeeId site avatar',
        match: department ? { department } : {}
      })
      .sort({ date: -1, checkIn: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    // Filter out records where employee is null (due to department filter)
    const filteredRecords = records.filter(record => record.employee);
    
    res.json({
      records: filteredRecords,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await Attendance.countDocuments(query)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comprehensive attendance statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Get all employees
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Get today's attendance
    const todayAttendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('employee', 'name department position employeeId avatar');
    
    // Calculate basic stats
    const presentToday = todayAttendance.filter(a => ['present', 'late'].includes(a.status)).length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;
    const onLeaveToday = todayAttendance.filter(a => a.status === 'on-leave').length;
    const remoteToday = todayAttendance.filter(a => a.workMode === 'remote').length;
    
    // Calculate advanced metrics
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;
    const punctualityRate = presentToday > 0 ? ((presentToday - lateToday) / presentToday) * 100 : 0;
    
    // Calculate average times
    const checkInTimes = todayAttendance.filter(a => a.checkIn).map(a => a.checkIn);
    const checkOutTimes = todayAttendance.filter(a => a.checkOut).map(a => a.checkOut);
    
    const averageCheckInTime = checkInTimes.length > 0 ? 
      checkInTimes.reduce((acc, time) => {
        const [hours, minutes] = time!.split(':').map(Number);
        return acc + hours * 60 + minutes;
      }, 0) / checkInTimes.length : 0;
    
    const averageCheckOutTime = checkOutTimes.length > 0 ?
      checkOutTimes.reduce((acc, time) => {
        const [hours, minutes] = time!.split(':').map(Number);
        return acc + hours * 60 + minutes;
      }, 0) / checkOutTimes.length : 0;
    
    // Calculate productivity and other advanced metrics
    const productivityScore = todayAttendance.length > 0 ?
      todayAttendance.reduce((acc, record) => acc + (record.productivity?.score || 75), 0) / todayAttendance.length : 75;
    
    const healthComplianceRate = todayAttendance.length > 0 ?
      (todayAttendance.filter(a => a.healthCheck).length / todayAttendance.length) * 100 : 0;
    
    const biometricSuccessRate = todayAttendance.length > 0 ?
      (todayAttendance.filter(a => a.biometricData?.confidence && a.biometricData.confidence > 0.8).length / todayAttendance.length) * 100 : 0;
    
    // Get top performers
    const topPerformers = todayAttendance
      .filter(a => a.productivity?.score)
      .sort((a, b) => (b.productivity?.score || 0) - (a.productivity?.score || 0))
      .slice(0, 10)
      .map(a => ({
        employeeId: a.employee._id,
        name: a.employee.name,
        score: a.productivity?.score || 0,
        avatar: a.employee.avatar
      }));
    
    // Department statistics
    const departmentStats = await Employee.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 }
        }
      }
    ]);
    
    const departmentStatsWithAttendance = await Promise.all(
      departmentStats.map(async (dept) => {
        const deptAttendance = await Attendance.countDocuments({
          date: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['present', 'late'] },
          employee: { 
            $in: await Employee.find({ department: dept._id }).select('_id') 
          }
        });
        
        return {
          department: dept._id,
          present: deptAttendance,
          total: dept.total,
          rate: dept.total > 0 ? (deptAttendance / dept.total) * 100 : 0
        };
      })
    );
    
    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const checkIns = todayAttendance.filter(a => {
        if (!a.checkIn) return false;
        const checkInHour = parseInt(a.checkIn.split(':')[0]);
        return checkInHour === hour;
      }).length;
      
      const checkOuts = todayAttendance.filter(a => {
        if (!a.checkOut) return false;
        const checkOutHour = parseInt(a.checkOut.split(':')[0]);
        return checkOutHour === hour;
      }).length;
      
      return { hour, checkIns, checkOuts };
    });
    
    res.json({
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      onLeaveToday,
      remoteToday,
      averageCheckInTime: Math.floor(averageCheckInTime / 60).toString().padStart(2, '0') + ':' + 
                         Math.floor(averageCheckInTime % 60).toString().padStart(2, '0'),
      averageCheckOutTime: Math.floor(averageCheckOutTime / 60).toString().padStart(2, '0') + ':' + 
                          Math.floor(averageCheckOutTime % 60).toString().padStart(2, '0'),
      averageWorkHours: todayAttendance.reduce((acc, a) => acc + (a.totalHours || 0), 0) / (todayAttendance.length || 1),
      totalOvertimeHours: todayAttendance.reduce((acc, a) => acc + (a.overtimeHours || 0), 0),
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      punctualityRate: Math.round(punctualityRate * 100) / 100,
      productivityScore: Math.round(productivityScore * 100) / 100,
      healthComplianceRate: Math.round(healthComplianceRate * 100) / 100,
      biometricSuccessRate: Math.round(biometricSuccessRate * 100) / 100,
      topPerformers,
      departmentStats: departmentStatsWithAttendance,
      hourlyDistribution
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get live updates
router.get('/live-updates', authMiddleware, async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentUpdates = await Attendance.find({
      updatedAt: { $gte: fiveMinutesAgo }
    })
    .populate('employee', 'name avatar department')
    .sort({ updatedAt: -1 })
    .limit(20);
    
    const updates = recentUpdates.map(record => ({
      type: record.checkOut ? 'check-out' : 'check-in',
      employee: {
        name: record.employee.name,
        avatar: record.employee.avatar,
        department: record.employee.department
      },
      timestamp: record.updatedAt,
      location: record.location?.address
    }));
    
    res.json({ updates });
  } catch (error) {
    console.error('Error fetching live updates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quick check-in
router.post('/quick-check-in', authMiddleware, [
  body('employeeId').notEmpty().withMessage('Employee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { employeeId } = req.body;
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Check if already checked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        employeeId,
        employee: employeeId,
        date: new Date(),
        checkIn: currentTime,
        status: 'present',
        workMode: 'office',
        isManualEntry: true,
        healthCheck: true,
        productivity: {
          score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
          activeMinutes: 0
        },
        energyLevel: Math.floor(Math.random() * 5) + 6, // Random between 6-10
        biometricData: {
          confidence: 0.95
        },
        device: {
          type: 'web',
          deviceId: 'admin-panel',
          ipAddress: req.ip || 'unknown'
        }
      });
    } else if (!attendance.checkOut) {
      // Check out
      attendance.checkOut = currentTime;
      
      // Calculate hours
      const checkInTime = new Date(`2000-01-01T${attendance.checkIn}:00`);
      const checkOutTime = new Date(`2000-01-01T${currentTime}:00`);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      
      attendance.totalHours = hours;
      attendance.regularHours = Math.min(hours, 8);
      attendance.overtimeHours = Math.max(0, hours - 8);
    } else {
      return res.status(400).json({ message: 'Employee already completed attendance for today' });
    }
    
    await attendance.save();
    await attendance.populate('employee', 'name email position department employeeId avatar');
    
    res.json({
      message: attendance.checkOut ? 'Check-out successful' : 'Check-in successful',
      attendance
    });
  } catch (error) {
    console.error('Error in quick check-in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Biometric authentication endpoint
router.post('/biometric-auth', authMiddleware, [
  body('type').isIn(['fingerprint', 'face']).withMessage('Invalid biometric type'),
  body('data').notEmpty().withMessage('Biometric data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type, data, employeeId } = req.body;
    
    // In a real implementation, this would verify against stored biometric templates
    // For now, we'll simulate the process
    const confidence = Math.random() * 0.3 + 0.7; // Random confidence between 0.7-1.0
    const success = confidence > 0.8;
    
    if (success && employeeId) {
      const employee = await Employee.findById(employeeId);
      if (employee) {
        // Create or update attendance record with biometric data
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        
        let attendance = await Attendance.findOne({
          employeeId,
          date: { $gte: startOfDay, $lte: endOfDay }
        });
        
        const currentTime = new Date().toTimeString().slice(0, 5);
        
        if (!attendance) {
          attendance = new Attendance({
            employeeId,
            employee: employeeId,
            date: new Date(),
            checkIn: currentTime,
            status: 'present',
            workMode: 'office',
            biometricData: {
              [type === 'fingerprint' ? 'fingerprintId' : 'faceId']: data,
              confidence
            },
            healthCheck: true,
            productivity: {
              score: Math.floor(Math.random() * 40) + 60,
              activeMinutes: 0
            },
            device: {
              type: 'biometric',
              deviceId: `${type}-scanner-01`,
              ipAddress: req.ip || 'unknown'
            }
          });
          
          await attendance.save();
        } else {
          attendance.biometricData = {
            [type === 'fingerprint' ? 'fingerprintId' : 'faceId']: data,
            confidence
          };
          await attendance.save();
        }
      }
    }
    
    res.json({
      success,
      confidence: Math.round(confidence * 100),
      message: success ? 'Biometric authentication successful' : 'Biometric authentication failed'
    });
  } catch (error) {
    console.error('Error in biometric auth:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk attendance operations
router.post('/bulk-update', authMiddleware, [
  body('records').isArray().withMessage('Records must be an array'),
  body('operation').isIn(['approve', 'reject', 'modify']).withMessage('Invalid operation')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { records, operation, modifications } = req.body;
    
    let updatedCount = 0;
    
    for (const recordId of records) {
      const attendance = await Attendance.findById(recordId);
      if (attendance) {
        switch (operation) {
          case 'approve':
            attendance.approvedBy = req.user.userId;
            break;
          case 'reject':
            attendance.status = 'absent';
            attendance.notes = 'Rejected by admin';
            break;
          case 'modify':
            if (modifications) {
              Object.assign(attendance, modifications);
            }
            break;
        }
        
        await attendance.save();
        updatedCount++;
      }
    }
    
    res.json({
      message: `Bulk ${operation} completed`,
      updatedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export attendance data
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, department } = req.query;
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    const records = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'name email position department employeeId',
        match: department ? { department } : {}
      })
      .sort({ date: -1 });
    
    const filteredRecords = records.filter(record => record.employee);
    
    if (format === 'csv') {
      const csvHeaders = [
        'Employee ID', 'Name', 'Department', 'Position', 'Date',
        'Check In', 'Check Out', 'Total Hours', 'Status', 'Work Mode'
      ].join(',');
      
      const csvData = filteredRecords.map(record => [
        record.employee.employeeId,
        record.employee.name,
        record.employee.department,
        record.employee.position,
        record.date.toISOString().split('T')[0],
        record.checkIn || '',
        record.checkOut || '',
        record.totalHours || 0,
        record.status,
        record.workMode || 'office'
      ].join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-export.csv');
      res.send(csvHeaders + '\n' + csvData);
    } else {
      res.json({ records: filteredRecords });
    }
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Analytics endpoint for advanced reporting
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = '30', department } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let matchQuery: any = {
      date: { $gte: startDate }
    };
    
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      matchQuery.employee = { $in: employees };
    }
    
    // Attendance trends
    const attendanceTrends = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          remote: { $sum: { $cond: [{ $eq: ["$workMode", "remote"] }, 1, 0] } },
          avgProductivity: { $avg: "$productivity.score" },
          totalHours: { $sum: "$totalHours" },
          overtimeHours: { $sum: "$overtimeHours" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Department comparison
    const departmentComparison = await Employee.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'attendances',
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$employee', '$$empId'] },
                date: { $gte: startDate }
              }
            }
          ],
          as: 'attendanceRecords'
        }
      },
      {
        $group: {
          _id: '$department',
          totalEmployees: { $sum: 1 },
          totalAttendanceRecords: { $sum: { $size: '$attendanceRecords' } },
          avgAttendanceRate: {
            $avg: {
              $divide: [
                { $size: { $filter: { input: '$attendanceRecords', cond: { $in: ['$$this.status', ['present', 'late']] } } } },
                { $max: [{ $size: '$attendanceRecords' }, 1] }
              ]
            }
          },
          avgProductivity: {
            $avg: {
              $avg: '$attendanceRecords.productivity.score'
            }
          }
        }
      }
    ]);
    
    // Peak hours analysis
    const peakHours = await Attendance.aggregate([
      { $match: matchQuery },
      { $match: { checkIn: { $exists: true } } },
      {
        $group: {
          _id: { $substr: ['$checkIn', 0, 2] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      attendanceTrends,
      departmentComparison,
      peakHours,
      period: days,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Payroll integration endpoints
router.get('/payroll-calculation/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const payrollData = await PayrollAttendanceService.calculateAttendanceBasedPayroll(
      employeeId,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    if (!payrollData) {
      return res.status(404).json({ message: 'Employee not found or no attendance data' });
    }
    
    res.json(payrollData);
  } catch (error) {
    console.error('Error calculating payroll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/payroll-bulk', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const payrollData = await PayrollAttendanceService.calculateBulkAttendancePayroll(
      new Date(startDate as string),
      new Date(endDate as string),
      department as string
    );
    
    res.json({
      payrollData,
      summary: {
        totalEmployees: payrollData.length,
        totalBaseSalary: payrollData.reduce((sum, p) => sum + p.employee.baseSalary, 0),
        totalAdjustments: payrollData.reduce((sum, p) => sum + p.netAdjustment, 0),
        totalFinalSalary: payrollData.reduce((sum, p) => sum + p.finalSalary, 0)
      }
    });
  } catch (error) {
    console.error('Error calculating bulk payroll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/payroll-insights', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const insights = await PayrollAttendanceService.getAttendanceInsights(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json(insights);
  } catch (error) {
    console.error('Error getting payroll insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
