import { Request, Response } from 'express';
import Employee from '../models/Employee';

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, email, position, department, salary, benefits, leaveBalance, hireDate,
      // Additional fields
      photo, location, supervisor, status, employmentType, dateOfHire, contractExpiryDate,
      shiftSchedule, workSchedule, employeeGrade, licenseType, licenseExpiryDate,
      assignedVehicle, routeHistory, gpsTrackingStatus, certifiedEquipment, currentShiftZone,
      pickRate, errorRate, directReports, currentProjects, departmentalKPIs,
      phoneNumber, emergencyContactName, emergencyContactNumber, emergencyContactRelationship,
      languageSkills, logisticsSoftwareKnowledge, equipmentCertifications, firstAidTraining,
      firstAidExpiryDate, customsComplianceCert, cvResume, employmentContract,
      idPassportCopy, workPermit, drivingLicense, healthClearance, certificates,
      performanceRating, attendanceRecord, disciplinaryActions, warningsIssued,
      lastEvaluationDate, nextEvaluationDate, goalsKPIs, salaryBand, bankAccount,
      allowances, bonuses, deductions, uniformIssued, uniformSize, uniformIssueDate,
      ppeIssued, ppeDetails, itEquipment, vehicleAssigned, systemAccounts,
      accessLevels, biometricId, accessCardId, lastLogin
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
    const { position } = req.query;
    let filter: any = {};
    if (position) {
      // Case-insensitive, partial match
      filter.position = { $regex: position, $options: 'i' };
    }
    const employees = await Employee.find(filter);
    res.json(employees);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      benefits, 
      // Additional fields
      photo, location, supervisor, status, employmentType, dateOfHire, contractExpiryDate,
      shiftSchedule, workSchedule, employeeGrade, licenseType, licenseExpiryDate,
      assignedVehicle, routeHistory, gpsTrackingStatus, certifiedEquipment, currentShiftZone,
      pickRate, errorRate, directReports, currentProjects, departmentalKPIs,
      phoneNumber, emergencyContactName, emergencyContactNumber, emergencyContactRelationship,
      languageSkills, logisticsSoftwareKnowledge, equipmentCertifications, firstAidTraining,
      firstAidExpiryDate, customsComplianceCert, cvResume, employmentContract,
      idPassportCopy, workPermit, drivingLicense, healthClearance, certificates,
      performanceRating, attendanceRecord, disciplinaryActions, warningsIssued,
      lastEvaluationDate, nextEvaluationDate, goalsKPIs, salaryBand, bankAccount,
      allowances, bonuses, deductions, uniformIssued, uniformSize, uniformIssueDate,
      ppeIssued, ppeDetails, itEquipment, vehicleAssigned, systemAccounts,
      accessLevels, biometricId, accessCardId, lastLogin,
      ...rest 
    } = req.body;

    const validBenefits = Array.isArray(benefits)
      ? benefits.filter((b: any) => b && typeof b.type === 'string' && typeof b.value === 'number')
      : [];

    // Create update data object with all fields
    const updateData = {
      ...rest,
      benefits: validBenefits,
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
      routeHistory,
      gpsTrackingStatus: gpsTrackingStatus !== undefined ? Boolean(gpsTrackingStatus) : undefined,
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

    const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

export const deactivateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { active: false, terminationDate: new Date() }, { new: true });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json({ message: 'Employee deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 