import { Request, Response } from 'express';
import TravelAuthorization from '../models/TravelAuthorization';
import TravelRequest from '../models/TravelRequest';
import Employee from '../models/Employee';
import User from '../models/User';
import { generateSerial } from '../utils/serialUtils';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Create travel authorization
export const createTravelAuthorization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { travelRequestId, department } = req.body;
    
    // Verify travel request exists and is approved
    const travelRequest = await TravelRequest.findById(travelRequestId);
    if (!travelRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
      return;
    }
    
    if (travelRequest.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: 'Travel request must be approved before creating authorization'
      });
      return;
    }

    // Serial number generation
    const docCode = 'TA';
    const dept = department || 'TA';
    const serial = await generateSerial(docCode, dept, TravelAuthorization);

    const authorizationData = {
      ...req.body,
      serial,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    };

    const travelAuthorization = new TravelAuthorization(authorizationData);
    await travelAuthorization.save();

    res.status(201).json({
      success: true,
      data: travelAuthorization,
      message: 'Travel authorization created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create travel authorization'
    });
  }
};

// Get all travel authorizations
export const getTravelAuthorizations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, employee, budgetStatus } = req.query;
    
    let filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (employee) {
      filter.employee = employee;
    }
    
    if (budgetStatus) {
      filter.budgetStatus = budgetStatus;
    }

    const travelAuthorizations = await TravelAuthorization.find(filter)
      .populate('travelRequest')
      .populate('employee', 'name email department')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('authorizedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: travelAuthorizations,
      count: travelAuthorizations.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch travel authorizations'
    });
  }
};

// Get travel authorization by ID
export const getTravelAuthorizationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const travelAuthorization = await TravelAuthorization.findById(req.params.id)
      .populate('travelRequest')
      .populate('employee', 'name email department position')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('authorizedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('budgetApprovals.approvedBy', 'name email');

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: travelAuthorization
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch travel authorization'
    });
  }
};

// Update travel authorization
export const updateTravelAuthorization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.userId,
    };

    const travelAuthorization = await TravelAuthorization.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('travelRequest')
     .populate('employee', 'name email department')
     .populate('createdBy', 'name email')
     .populate('updatedBy', 'name email')
     .populate('authorizedBy', 'name email')
     .populate('rejectedBy', 'name email')
     .populate('budgetApprovals.approvedBy', 'name email');

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: travelAuthorization,
      message: 'Travel authorization updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update travel authorization'
    });
  }
};

// Delete travel authorization
export const deleteTravelAuthorization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const travelAuthorization = await TravelAuthorization.findByIdAndDelete(req.params.id);

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Travel authorization deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete travel authorization'
    });
  }
};

// Approve budget
export const approveBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { budgetIndex, approvedAmount, comments } = req.body;
    const { id } = req.params;

    const travelAuthorization = await TravelAuthorization.findById(id);

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    if (budgetIndex >= travelAuthorization.budgetApprovals.length) {
      res.status(400).json({
        success: false,
        message: 'Invalid budget approval index'
      });
      return;
    }

    const budgetApproval = travelAuthorization.budgetApprovals[budgetIndex];
    
    // Update budget approval
    budgetApproval.approvedAmount = approvedAmount;
    budgetApproval.comments = comments;
    budgetApproval.approvedAt = new Date();
    budgetApproval.approvedBy = req.user?.userId as any;
    budgetApproval.status = 'approved';

    // Recalculate total budget approved
    travelAuthorization.totalBudgetApproved = travelAuthorization.budgetApprovals
      .filter(budget => budget.status === 'approved')
      .reduce((sum, budget) => sum + budget.approvedAmount, 0);

    // Check if all budget approvals are complete
    const allBudgetApproved = travelAuthorization.budgetApprovals
      .every(budget => budget.status === 'approved');

    if (allBudgetApproved) {
      travelAuthorization.budgetStatus = 'approved';
      
      // Check if all requirements are met
      if (travelAuthorization.visaRequirements.status === 'approved' || 
          travelAuthorization.visaRequirements.status === 'not_required') {
        if (travelAuthorization.policyAcknowledgment) {
          travelAuthorization.status = 'authorized';
          travelAuthorization.authorizedAt = new Date();
          travelAuthorization.authorizedBy = req.user?.userId as any;
        } else {
          travelAuthorization.status = 'pending_policy';
        }
      } else {
        travelAuthorization.status = 'pending_visa';
      }
    }

    travelAuthorization.updatedBy = req.user?.userId as any;
    await travelAuthorization.save();

    res.status(200).json({
      success: true,
      data: travelAuthorization,
      message: 'Budget approved successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve budget'
    });
  }
};

// Update visa requirements
export const updateVisaRequirements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { visaRequirements } = req.body;

    const travelAuthorization = await TravelAuthorization.findById(id);

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    travelAuthorization.visaRequirements = {
      ...travelAuthorization.visaRequirements,
      ...visaRequirements
    };

    // Update status based on visa requirements
    if (travelAuthorization.visaRequirements.status === 'approved' || 
        travelAuthorization.visaRequirements.status === 'not_required') {
      if (travelAuthorization.budgetStatus === 'approved') {
        if (travelAuthorization.policyAcknowledgment) {
          travelAuthorization.status = 'authorized';
          travelAuthorization.authorizedAt = new Date();
          travelAuthorization.authorizedBy = req.user?.userId as any;
        } else {
          travelAuthorization.status = 'pending_policy';
        }
      } else {
        travelAuthorization.status = 'pending_budget';
      }
    } else {
      travelAuthorization.status = 'pending_visa';
    }

    travelAuthorization.updatedBy = req.user?.userId as any;
    await travelAuthorization.save();

    res.status(200).json({
      success: true,
      data: travelAuthorization,
      message: 'Visa requirements updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update visa requirements'
    });
  }
};

// Acknowledge travel policy
export const acknowledgePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { policyVersion, ipAddress, userAgent } = req.body;

    const travelAuthorization = await TravelAuthorization.findById(id);

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    travelAuthorization.policyAcknowledgment = {
      policyVersion,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user?.userId as any,
      ipAddress,
      userAgent
    };

    // Check if all requirements are met
    if (travelAuthorization.budgetStatus === 'approved' && 
        (travelAuthorization.visaRequirements.status === 'approved' || 
         travelAuthorization.visaRequirements.status === 'not_required')) {
      travelAuthorization.status = 'authorized';
      travelAuthorization.authorizedAt = new Date();
      travelAuthorization.authorizedBy = req.user?.userId as any;
    }

    travelAuthorization.updatedBy = req.user?.userId as any;
    await travelAuthorization.save();

    res.status(200).json({
      success: true,
      data: travelAuthorization,
      message: 'Travel policy acknowledged successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to acknowledge policy'
    });
  }
};

// Complete safety briefing
export const completeSafetyBriefing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const travelAuthorization = await TravelAuthorization.findById(id);

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    travelAuthorization.safetyBriefing.completed = true;
    travelAuthorization.safetyBriefing.completedAt = new Date();
    travelAuthorization.safetyBriefing.conductedBy = req.user?.userId as any;
    travelAuthorization.safetyBriefing.notes = notes;

    travelAuthorization.updatedBy = req.user?.userId as any;
    await travelAuthorization.save();

    res.status(200).json({
      success: true,
      data: travelAuthorization,
      message: 'Safety briefing completed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete safety briefing'
    });
  }
};

// Update insurance status
export const updateInsuranceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, type, coverage, cost } = req.body;

    const travelAuthorization = await TravelAuthorization.findById(id);

    if (!travelAuthorization) {
      res.status(404).json({
        success: false,
        message: 'Travel authorization not found'
      });
      return;
    }

    travelAuthorization.insurance.status = status;
    if (type) travelAuthorization.insurance.type = type;
    if (coverage) travelAuthorization.insurance.coverage = coverage;
    if (cost) travelAuthorization.insurance.cost = cost;

    travelAuthorization.updatedBy = req.user?.userId as any;
    await travelAuthorization.save();

    res.status(200).json({
      success: true,
      data: travelAuthorization,
      message: 'Insurance status updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update insurance status'
    });
  }
};

// Get travel authorizations by employee
export const getTravelAuthorizationsByEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.params.employeeId;
    
    const travelAuthorizations = await TravelAuthorization.find({ employee: employeeId })
      .populate('travelRequest')
      .populate('employee', 'name email department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('authorizedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('budgetApprovals.approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: travelAuthorizations,
      count: travelAuthorizations.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employee travel authorizations'
    });
  }
}; 