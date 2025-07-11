import { Request, Response } from 'express';
import TravelRequest from '../models/TravelRequest';
import Employee from '../models/Employee';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Create travel request
export const createTravelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestData = {
      ...req.body,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    };

    const travelRequest = new TravelRequest(requestData);
    await travelRequest.save();

    res.status(201).json({
      success: true,
      data: travelRequest,
      message: 'Travel request created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create travel request'
    });
  }
};

// Get all travel requests
export const getTravelRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, employee, department, travelType } = req.query;
    
    let filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (employee) {
      filter.employee = employee;
    }
    
    if (department) {
      filter.department = department;
    }
    
    if (travelType) {
      filter.travelType = travelType;
    }

    const travelRequests = await TravelRequest.find(filter)
      .populate('employee', 'name email department')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('approvalWorkflow.approver', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: travelRequests,
      count: travelRequests.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch travel requests'
    });
  }
};

// Get travel request by ID
export const getTravelRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const travelRequest = await TravelRequest.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvalWorkflow.approver', 'name email role');

    if (!travelRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: travelRequest
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch travel request'
    });
  }
};

// Update travel request
export const updateTravelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.userId,
    };

    const travelRequest = await TravelRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee', 'name email department')
     .populate('createdBy', 'name email')
     .populate('updatedBy', 'name email')
     .populate('approvalWorkflow.approver', 'name email role');

    if (!travelRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: travelRequest,
      message: 'Travel request updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update travel request'
    });
  }
};

// Delete travel request
export const deleteTravelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const travelRequest = await TravelRequest.findByIdAndDelete(req.params.id);

    if (!travelRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Travel request deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete travel request'
    });
  }
};

// Submit travel request for approval
export const submitTravelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const travelRequest = await TravelRequest.findById(req.params.id);

    if (!travelRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
      return;
    }

    if (travelRequest.status !== 'draft') {
      res.status(400).json({
        success: false,
        message: 'Travel request can only be submitted from draft status'
      });
      return;
    }

    // Set up approval workflow based on travel type and cost
    type AllowedRole = 'supervisor' | 'hr' | 'finance' | 'travel_desk';
    const approvalWorkflow: import('../models/TravelRequest').IApprovalStep[] = [];

    // Always require supervisor approval
    approvalWorkflow.push({
      approver: req.body.supervisorId || req.user?.userId,
      role: 'supervisor',
      status: 'pending',
      required: true
    });

    // HR approval for international travel
    if (travelRequest.travelType === 'international') {
      approvalWorkflow.push({
        approver: req.body.hrId,
        role: 'hr',
        status: 'pending',
        required: true
      });
    }

    // Finance approval for high cost trips
    if (travelRequest.estimatedCost.total > 5000) {
      approvalWorkflow.push({
        approver: req.body.financeId,
        role: 'finance',
        status: 'pending',
        required: true
      });
    }

    travelRequest.approvalWorkflow = approvalWorkflow;
    travelRequest.status = 'submitted';
    travelRequest.submittedAt = new Date();
    travelRequest.updatedBy = req.user?.userId as any;

    await travelRequest.save();

    res.status(200).json({
      success: true,
      data: travelRequest,
      message: 'Travel request submitted for approval'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit travel request'
    });
  }
};

// Approve/reject travel request
export const approveTravelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, comment } = req.body;
    const { id, stepIndex } = req.params;

    const travelRequest = await TravelRequest.findById(id);

    if (!travelRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
      return;
    }

    const stepIndexNum = Number(stepIndex);
    if (isNaN(stepIndexNum) || stepIndexNum < 0 || stepIndexNum >= travelRequest.approvalWorkflow.length) {
      res.status(400).json({
        success: false,
        message: 'Invalid approval step'
      });
      return;
    }

    const approvalStep = travelRequest.approvalWorkflow[stepIndexNum];
    
    // Check if user is authorized to approve this step
    if (approvalStep.approver.toString() !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this step'
      });
      return;
    }

    // Update approval step
    approvalStep.status = action; // 'approved' or 'rejected'
    approvalStep.comment = comment;
    approvalStep.approvedAt = new Date();

    // Check if all required approvals are complete
    const allApproved = travelRequest.approvalWorkflow
      .filter(step => step.required)
      .every(step => step.status === 'approved');

    const anyRejected = travelRequest.approvalWorkflow
      .some(step => step.status === 'rejected');

    if (anyRejected) {
      travelRequest.status = 'rejected';
      travelRequest.rejectedAt = new Date();
      travelRequest.rejectionReason = comment;
    } else if (allApproved) {
      travelRequest.status = 'approved';
      travelRequest.approvedAt = new Date();
    } else {
      travelRequest.status = 'under_review';
    }

    travelRequest.updatedBy = req.user?.userId as any;
    await travelRequest.save();

    res.status(200).json({
      success: true,
      data: travelRequest,
      message: `Travel request ${action} successfully`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process approval'
    });
  }
};

// Get travel requests by employee
export const getTravelRequestsByEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.params.employeeId;
    
    const travelRequests = await TravelRequest.find({ employee: employeeId })
      .populate('employee', 'name email department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvalWorkflow.approver', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: travelRequests,
      count: travelRequests.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employee travel requests'
    });
  }
};

// Get pending approvals for user
export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    const pendingRequests = await TravelRequest.find({
      'approvalWorkflow.approver': userId,
      'approvalWorkflow.status': 'pending',
      status: { $in: ['submitted', 'under_review'] }
    })
    .populate('employee', 'name email department')
    .populate('createdBy', 'name email')
    .populate('approvalWorkflow.approver', 'name email role')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingRequests,
      count: pendingRequests.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending approvals'
    });
  }
}; 