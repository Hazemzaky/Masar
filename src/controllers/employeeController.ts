import { Request, Response } from 'express';
import Employee from '../models/Employee';

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, email, position, department, salary, benefits, leaveBalance, hireDate,
      // Enhanced comprehensive fields
      employeeId, personalEmail, dateOfBirth, nationality, passportNumber, civilId,
      gender, maritalStatus, employmentType, jobLevel, hourlyRate, site, status,
      phone, address, emergencyContact, performanceRating, lastReviewDate, skills,
      manager, location,
      
      // Logistics-specific fields
      driverLicense, vehicleAssignment, workShifts, certifications,
      
      // Compensation & Benefits
      compensationHistory, bonusRecords, allowances, bankInfo, payrollIncluded, bonusEligible,
      
      // Leave & Attendance
      leaveBalanceDetails, upcomingLeaves, attendanceLog, attendancePercentage, absenceFrequency,
      
      // Performance & Development
      performance,
      
      // Documents & Compliance
      documents, compliance,
      
      // Timeline & History
      timeline, hrActions,
      
      // Recognition & Awards
      recognition,
      
      // Equipment & Assets
      equipment,
      
      // Private HR Notes
      privateNotes, hrNotes,
      
      // Organizational
      orgChart, skillTags, customTags, attritionRisk, officeLocation, workMode, emergencyContacts,
      
      // Readiness Tracker
      readinessTracker,
      
      // Overtime & Hours
      overtime,
      
      // Legacy fields for backward compatibility
      photo, supervisor, dateOfHire, contractExpiryDate, shiftSchedule, workSchedule,
      employeeGrade, licenseType, licenseExpiryDate, assignedVehicle, routeHistory,
      gpsTrackingStatus, certifiedEquipment, currentShiftZone, pickRate, errorRate,
      directReports, currentProjects, departmentalKPIs, phoneNumber, emergencyContactName,
      emergencyContactNumber, emergencyContactRelationship, languageSkills, logisticsSoftwareKnowledge,
      equipmentCertifications, firstAidTraining, firstAidExpiryDate, customsComplianceCert,
      cvResume, employmentContract, idPassportCopy, workPermit, drivingLicense, healthClearance,
      certificates, attendanceRecord, disciplinaryActions, warningsIssued, lastEvaluationDate,
      nextEvaluationDate, goalsKPIs, salaryBand, bankAccount, allowances_old, bonuses, deductions,
      uniformIssued, uniformSize, uniformIssueDate, ppeIssued, ppeDetails, itEquipment,
      vehicleAssigned, systemAccounts, accessLevels, biometricId, accessCardId, lastLogin
    } = req.body;

    // Validate required fields
    if (!name || !email || !position || !department || !salary) {
      res.status(400).json({ message: 'Missing required fields: name, email, position, department, salary' });
      return;
    }

    // Validate benefits
    const validBenefits = Array.isArray(benefits)
      ? benefits.filter((b: any) => b && typeof b.type === 'string' && typeof b.value === 'number')
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
      
      // Enhanced comprehensive fields
      employeeId,
      personalEmail,
      dateOfBirth,
      nationality,
      passportNumber,
      civilId,
      gender,
      maritalStatus,
      employmentType: employmentType || 'full-time',
      jobLevel,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      site,
      status: status || 'active',
      phone: phone || phoneNumber,
      address,
      emergencyContact,
      performanceRating: performanceRating ? Number(performanceRating) : undefined,
      lastReviewDate,
      skills: Array.isArray(skills) ? skills : [],
      manager,
      location,
      
      // Logistics-specific fields
      driverLicense,
      vehicleAssignment,
      workShifts: Array.isArray(workShifts) ? workShifts : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      
      // Compensation & Benefits
      compensationHistory: Array.isArray(compensationHistory) ? compensationHistory : [],
      bonusRecords: Array.isArray(bonusRecords) ? bonusRecords : [],
      allowances: allowances || allowances_old,
      bankInfo,
      payrollIncluded: payrollIncluded !== undefined ? Boolean(payrollIncluded) : true,
      bonusEligible: bonusEligible !== undefined ? Boolean(bonusEligible) : true,
      
      // Leave & Attendance
      leaveBalanceDetails,
      upcomingLeaves: Array.isArray(upcomingLeaves) ? upcomingLeaves : [],
      attendanceLog: Array.isArray(attendanceLog) ? attendanceLog : [],
      attendancePercentage: attendancePercentage ? Number(attendancePercentage) : 0,
      absenceFrequency: absenceFrequency ? Number(absenceFrequency) : 0,
      
      // Performance & Development
      performance,
      
      // Documents & Compliance
      documents: Array.isArray(documents) ? documents : [],
      compliance,
      
      // Timeline & History
      timeline: Array.isArray(timeline) ? timeline : [],
      hrActions: Array.isArray(hrActions) ? hrActions : [],
      
      // Recognition & Awards
      recognition: Array.isArray(recognition) ? recognition : [],
      
      // Equipment & Assets
      equipment: Array.isArray(equipment) ? equipment : [],
      
      // Private HR Notes
      privateNotes,
      hrNotes: Array.isArray(hrNotes) ? hrNotes : [],
      
      // Organizational
      orgChart,
      skillTags: Array.isArray(skillTags) ? skillTags : [],
      customTags: Array.isArray(customTags) ? customTags : [],
      attritionRisk,
      officeLocation,
      workMode,
      emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : [],
      
      // Readiness Tracker
      readinessTracker,
      
      // Overtime & Hours
      overtime,
      
      // Legacy fields for backward compatibility
      photo,
      supervisor,
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
      attendanceRecord,
      disciplinaryActions,
      warningsIssued,
      lastEvaluationDate,
      nextEvaluationDate,
      goalsKPIs,
      salaryBand,
      bankAccount,
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

    const employee = new Employee(employeeData);
    await employee.save();
    res.status(201).json(employee);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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
};

export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      position, department, status, site, employmentType, search, searchBy 
    } = req.query;
    
    let filter: any = {};
    
    // Position filter
    if (position) {
      filter.position = { $regex: position, $options: 'i' };
    }
    
    // Department filter
    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Site filter
    if (site) {
      filter.site = { $regex: site, $options: 'i' };
    }
    
    // Employment type filter
    if (employmentType) {
      filter.employmentType = employmentType;
    }
    
    // Search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      switch (searchBy) {
        case 'name':
          filter.name = searchRegex;
          break;
        case 'id':
          filter.employeeId = searchRegex;
          break;
        case 'email':
          filter.email = searchRegex;
          break;
        case 'phone':
          filter.$or = [
            { phone: searchRegex },
            { 'emergencyContacts.phone': searchRegex }
          ];
          break;
        default:
          filter.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { employeeId: searchRegex },
            { phone: searchRegex }
          ];
      }
    }
    
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    
    // Calculate statistics
    const total = employees.length;
    const active = employees.filter(emp => emp.active && emp.status === 'active').length;
    const onLeave = employees.filter(emp => emp.status === 'on-leave').length;
    const resigned = employees.filter(emp => emp.status === 'resigned').length;
    
    res.json({
      employees,
      stats: {
        total,
        active,
        onLeave,
        resigned
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      benefits, 
      // Enhanced comprehensive fields
      employeeId, personalEmail, dateOfBirth, nationality, passportNumber, civilId,
      gender, maritalStatus, employmentType, jobLevel, hourlyRate, site, status,
      phone, address, emergencyContact, performanceRating, lastReviewDate, skills,
      manager, location,
      
      // Logistics-specific fields
      driverLicense, vehicleAssignment, workShifts, certifications,
      
      // Compensation & Benefits
      compensationHistory, bonusRecords, allowances, bankInfo, payrollIncluded, bonusEligible,
      
      // Leave & Attendance
      leaveBalanceDetails, upcomingLeaves, attendanceLog, attendancePercentage, absenceFrequency,
      
      // Performance & Development
      performance,
      
      // Documents & Compliance
      documents, compliance,
      
      // Timeline & History
      timeline, hrActions,
      
      // Recognition & Awards
      recognition,
      
      // Equipment & Assets
      equipment,
      
      // Private HR Notes
      privateNotes, hrNotes,
      
      // Organizational
      orgChart, skillTags, customTags, attritionRisk, officeLocation, workMode, emergencyContacts,
      
      // Readiness Tracker
      readinessTracker,
      
      // Overtime & Hours
      overtime,
      
      // Legacy fields for backward compatibility
      photo, supervisor, dateOfHire, contractExpiryDate, shiftSchedule, workSchedule,
      employeeGrade, licenseType, licenseExpiryDate, assignedVehicle, routeHistory,
      gpsTrackingStatus, certifiedEquipment, currentShiftZone, pickRate, errorRate,
      directReports, currentProjects, departmentalKPIs, phoneNumber, emergencyContactName,
      emergencyContactNumber, emergencyContactRelationship, languageSkills, logisticsSoftwareKnowledge,
      equipmentCertifications, firstAidTraining, firstAidExpiryDate, customsComplianceCert,
      cvResume, employmentContract, idPassportCopy, workPermit, drivingLicense, healthClearance,
      certificates, attendanceRecord, disciplinaryActions, warningsIssued, lastEvaluationDate,
      nextEvaluationDate, goalsKPIs, salaryBand, bankAccount, allowances_old, bonuses, deductions,
      uniformIssued, uniformSize, uniformIssueDate, ppeIssued, ppeDetails, itEquipment,
      vehicleAssigned, systemAccounts, accessLevels, biometricId, accessCardId, lastLogin,
      ...rest 
    } = req.body;

    const validBenefits = Array.isArray(benefits)
      ? benefits.filter((b: any) => b && typeof b.type === 'string' && typeof b.value === 'number')
      : undefined;

    // Create update data object with all fields
    const updateData = {
      ...rest,
      benefits: validBenefits,
      
      // Enhanced comprehensive fields
      employeeId,
      personalEmail,
      dateOfBirth,
      nationality,
      passportNumber,
      civilId,
      gender,
      maritalStatus,
      employmentType,
      jobLevel,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      site,
      status,
      phone: phone || phoneNumber,
      address,
      emergencyContact,
      performanceRating: performanceRating ? Number(performanceRating) : undefined,
      lastReviewDate,
      skills: Array.isArray(skills) ? skills : undefined,
      manager,
      location,
      
      // Logistics-specific fields
      driverLicense,
      vehicleAssignment,
      workShifts: Array.isArray(workShifts) ? workShifts : undefined,
      certifications: Array.isArray(certifications) ? certifications : undefined,
      
      // Compensation & Benefits
      compensationHistory: Array.isArray(compensationHistory) ? compensationHistory : undefined,
      bonusRecords: Array.isArray(bonusRecords) ? bonusRecords : undefined,
      allowances: allowances || allowances_old,
      bankInfo,
      payrollIncluded: payrollIncluded !== undefined ? Boolean(payrollIncluded) : undefined,
      bonusEligible: bonusEligible !== undefined ? Boolean(bonusEligible) : undefined,
      
      // Leave & Attendance
      leaveBalanceDetails,
      upcomingLeaves: Array.isArray(upcomingLeaves) ? upcomingLeaves : undefined,
      attendanceLog: Array.isArray(attendanceLog) ? attendanceLog : undefined,
      attendancePercentage: attendancePercentage ? Number(attendancePercentage) : undefined,
      absenceFrequency: absenceFrequency ? Number(absenceFrequency) : undefined,
      
      // Performance & Development
      performance,
      
      // Documents & Compliance
      documents: Array.isArray(documents) ? documents : undefined,
      compliance,
      
      // Timeline & History
      timeline: Array.isArray(timeline) ? timeline : undefined,
      hrActions: Array.isArray(hrActions) ? hrActions : undefined,
      
      // Recognition & Awards
      recognition: Array.isArray(recognition) ? recognition : undefined,
      
      // Equipment & Assets
      equipment: Array.isArray(equipment) ? equipment : undefined,
      
      // Private HR Notes
      privateNotes,
      hrNotes: Array.isArray(hrNotes) ? hrNotes : undefined,
      
      // Organizational
      orgChart,
      skillTags: Array.isArray(skillTags) ? skillTags : undefined,
      customTags: Array.isArray(customTags) ? customTags : undefined,
      attritionRisk,
      officeLocation,
      workMode,
      emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : undefined,
      
      // Readiness Tracker
      readinessTracker,
      
      // Overtime & Hours
      overtime,
      
      // Legacy fields for backward compatibility
      photo,
      supervisor,
      dateOfHire,
      contractExpiryDate,
      shiftSchedule,
      workSchedule,
      employeeGrade,
      licenseType,
      licenseExpiryDate,
      assignedVehicle,
      routeHistory,
      gpsTrackingStatus: gpsTrackingStatus !== undefined ? Boolean(gpsTrackingStatus) : undefined,
      certifiedEquipment,
      currentShiftZone,
      pickRate,
      errorRate,
      directReports,
      currentProjects,
      departmentalKPIs,
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
      attendanceRecord,
      disciplinaryActions,
      warningsIssued,
      lastEvaluationDate,
      nextEvaluationDate,
      goalsKPIs,
      salaryBand,
      bankAccount,
      bonuses,
      deductions,
      uniformIssued: uniformIssued !== undefined ? Boolean(uniformIssued) : undefined,
      uniformSize,
      uniformIssueDate,
      ppeIssued: ppeIssued !== undefined ? Boolean(ppeIssued) : undefined,
      ppeDetails,
      itEquipment,
      vehicleAssigned,
      systemAccounts,
      accessLevels,
      biometricId,
      accessCardId,
      lastLogin
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json(employee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
      return;
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deactivateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { active: false, status: 'resigned' },
      { new: true }
    );
    
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    res.json({ message: 'Employee deactivated successfully', employee });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk operations
export const bulkUpdateEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeIds, updates } = req.body;
    
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      res.status(400).json({ message: 'Employee IDs array is required' });
      return;
    }
    
    const result = await Employee.updateMany(
      { _id: { $in: employeeIds } },
      updates,
      { runValidators: true }
    );
    
    res.json({ 
      message: `${result.modifiedCount} employees updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ active: true, status: 'active' });
    const onLeave = await Employee.countDocuments({ status: 'on-leave' });
    const resigned = await Employee.countDocuments({ status: 'resigned' });
    const suspended = await Employee.countDocuments({ status: 'suspended' });
    
    // Department statistics
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Employment type statistics
    const employmentTypeStats = await Employee.aggregate([
      {
        $group: {
          _id: '$employmentType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      total,
      active,
      onLeave,
      resigned,
      suspended,
      departmentStats,
      employmentTypeStats
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==================== ATTENDANCE ENDPOINTS ====================

// Check-in endpoint
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { checkInTime } = req.body;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const checkInDateTime = checkInTime || new Date().toISOString();
    
    // Check if attendance record already exists for today
    const existingRecordIndex = employee.attendanceLog?.findIndex(record => record.date === today);
    
    if (existingRecordIndex !== undefined && existingRecordIndex >= 0) {
      // Update existing record
      employee.attendanceLog![existingRecordIndex].checkIn = checkInDateTime;
      employee.attendanceLog![existingRecordIndex].status = 'present';
    } else {
      // Create new attendance record
      const newRecord = {
        date: today,
        checkIn: checkInDateTime,
        checkOut: '',
        hours: 0,
        status: 'present' as const
      };
      
      if (!employee.attendanceLog) {
        employee.attendanceLog = [];
      }
      employee.attendanceLog.push(newRecord);
    }
    
    // Recalculate attendance statistics
    await calculateAttendanceStats(employee);
    
    await employee.save();
    
    res.json({
      message: 'Check-in recorded successfully',
      attendance: employee.attendanceLog?.find(record => record.date === today),
      stats: {
        attendancePercentage: employee.attendancePercentage,
        absenceFrequency: employee.absenceFrequency
      }
    });
  } catch (error: any) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check-out endpoint
export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { checkOutTime } = req.body;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const checkOutDateTime = checkOutTime || new Date().toISOString();
    
    // Find today's attendance record
    const todayRecordIndex = employee.attendanceLog?.findIndex(record => record.date === today);
    
    if (todayRecordIndex === undefined || todayRecordIndex < 0) {
      res.status(400).json({ message: 'No check-in record found for today' });
      return;
    }
    
    const todayRecord = employee.attendanceLog![todayRecordIndex];
    
    if (!todayRecord.checkIn) {
      res.status(400).json({ message: 'No check-in time recorded for today' });
      return;
    }
    
    // Calculate hours worked
    const checkInTime = new Date(todayRecord.checkIn);
    const checkOutTimeDate = new Date(checkOutDateTime);
    const hoursWorked = (checkOutTimeDate.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    // Update attendance record
    todayRecord.checkOut = checkOutDateTime;
    todayRecord.hours = Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
    
    // Recalculate attendance statistics
    await calculateAttendanceStats(employee);
    
    await employee.save();
    
    res.json({
      message: 'Check-out recorded successfully',
      attendance: todayRecord,
      stats: {
        attendancePercentage: employee.attendancePercentage,
        absenceFrequency: employee.absenceFrequency
      }
    });
  } catch (error: any) {
    console.error('Error recording check-out:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark leave endpoint
export const markLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { leaveType = 'personal', reason } = req.body;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if attendance record already exists for today
    const existingRecordIndex = employee.attendanceLog?.findIndex(record => record.date === today);
    
    if (existingRecordIndex !== undefined && existingRecordIndex >= 0) {
      // Update existing record
      employee.attendanceLog![existingRecordIndex].status = 'on-leave';
      employee.attendanceLog![existingRecordIndex].checkIn = '';
      employee.attendanceLog![existingRecordIndex].checkOut = '';
      employee.attendanceLog![existingRecordIndex].hours = 0;
    } else {
      // Create new attendance record
      const newRecord = {
        date: today,
        checkIn: '',
        checkOut: '',
        hours: 0,
        status: 'on-leave' as const
      };
      
      if (!employee.attendanceLog) {
        employee.attendanceLog = [];
      }
      employee.attendanceLog.push(newRecord);
    }
    
    // Update leave balance if applicable
    if (employee.leaveBalanceDetails && leaveType in employee.leaveBalanceDetails) {
      const leaveTypeKey = leaveType as keyof typeof employee.leaveBalanceDetails;
      if (employee.leaveBalanceDetails[leaveTypeKey] > 0) {
        employee.leaveBalanceDetails[leaveTypeKey] -= 1;
      }
    }
    
    // Recalculate attendance statistics
    await calculateAttendanceStats(employee);
    
    await employee.save();
    
    res.json({
      message: 'Leave marked successfully',
      attendance: employee.attendanceLog?.find(record => record.date === today),
      leaveBalance: employee.leaveBalanceDetails,
      stats: {
        attendancePercentage: employee.attendancePercentage,
        absenceFrequency: employee.absenceFrequency
      }
    });
  } catch (error: any) {
    console.error('Error marking leave:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance history endpoint
export const getAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    let attendanceHistory = employee.attendanceLog || [];
    
    // Filter by date range if provided
    if (startDate && endDate) {
      attendanceHistory = attendanceHistory.filter((record: any) => 
        record.date >= startDate && record.date <= endDate
      );
    }
    
    // Sort by date (newest first) and limit results
    attendanceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    attendanceHistory = attendanceHistory.slice(0, Number(limit));
    
    res.json({
      employeeId: id,
      employeeName: employee.name,
      attendanceHistory,
      totalRecords: attendanceHistory.length,
      stats: {
        attendancePercentage: employee.attendancePercentage,
        absenceFrequency: employee.absenceFrequency
      }
    });
  } catch (error: any) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance statistics endpoint
export const getAttendanceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    
    let attendanceRecords = employee.attendanceLog || [];
    
    // Filter by month/year if provided
    if (month && year) {
      const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
      attendanceRecords = attendanceRecords.filter((record: any) => 
        record.date.startsWith(targetMonth)
      );
    }
    
    // Calculate detailed statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((record: any) => record.status === 'present').length;
    const absentDays = attendanceRecords.filter((record: any) => record.status === 'absent').length;
    const lateDays = attendanceRecords.filter((record: any) => record.status === 'late').length;
    const leaveDays = attendanceRecords.filter((record: any) => record.status === 'on-leave').length;
    
    const totalHours = attendanceRecords.reduce((sum, record: any) => sum + (record.hours || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
    
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    res.json({
      employeeId: id,
      employeeName: employee.name,
      period: month && year ? `${month}/${year}` : 'All time',
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        attendancePercentage: employee.attendancePercentage,
        absenceFrequency: employee.absenceFrequency
      },
      recentRecords: attendanceRecords.slice(-5) // Last 5 records
    });
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to calculate attendance statistics
const calculateAttendanceStats = async (employee: any): Promise<void> => {
  try {
    const attendanceRecords = employee.attendanceLog || [];
    
    if (attendanceRecords.length === 0) {
      employee.attendancePercentage = 0;
      employee.absenceFrequency = 0;
      return;
    }
    
    // Calculate attendance percentage (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRecords = attendanceRecords.filter((record: any) => 
      new Date(record.date) >= thirtyDaysAgo
    );
    
    const totalRecentDays = recentRecords.length;
    const presentDays = recentRecords.filter((record: any) => record.status === 'present').length;
    
    employee.attendancePercentage = totalRecentDays > 0 
      ? Math.round((presentDays / totalRecentDays) * 100) 
      : 0;
    
    // Calculate absence frequency (last 30 days)
    const absentDays = recentRecords.filter((record: any) => 
      record.status === 'absent' || record.status === 'late'
    ).length;
    
    employee.absenceFrequency = absentDays;
    
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
  }
}; 