import { Request, Response } from 'express';
import { 
  BenefitsPlan, 
  BenefitsEnrollment, 
  BenefitsCategory, 
  BenefitsCost,
  OpenEnrollment,
  BenefitsCommunication
} from '../models/benefitsModels';

// Benefits Plans Controllers
export const createBenefitsPlan = async (req: Request, res: Response) => {
  try {
    const plan = new BenefitsPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBenefitsPlans = async (req: Request, res: Response) => {
  try {
    const { category, status, type } = req.query;
    const filter: any = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const plans = await BenefitsPlan.find(filter)
      .populate('category', 'name description')
      .sort({ name: 1 });
    
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBenefitsPlan = async (req: Request, res: Response) => {
  try {
    const plan = await BenefitsPlan.findById(req.params.id)
      .populate('category', 'name description')
      .populate('costs', 'year costPerEmployee');
    
    if (!plan) {
      return res.status(404).json({ message: 'Benefits plan not found' });
    }
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBenefitsPlan = async (req: Request, res: Response) => {
  try {
    const plan = await BenefitsPlan.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!plan) {
      return res.status(404).json({ message: 'Benefits plan not found' });
    }
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBenefitsPlan = async (req: Request, res: Response) => {
  try {
    const plan = await BenefitsPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Benefits plan not found' });
    }
    res.json({ message: 'Benefits plan deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Benefits Enrollment Controllers
export const createBenefitsEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = new BenefitsEnrollment(req.body);
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBenefitsEnrollments = async (req: Request, res: Response) => {
  try {
    const { employeeId, planId, status, year } = req.query;
    const filter: any = {};
    
    if (employeeId) filter.employee = employeeId;
    if (planId) filter.plan = planId;
    if (status) filter.status = status;
    if (year) filter.year = year;

    const enrollments = await BenefitsEnrollment.find(filter)
      .populate('employee', 'name email department')
      .populate('plan', 'name type category')
      .sort({ createdAt: -1 });
    
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBenefitsEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await BenefitsEnrollment.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('plan', 'name type category description')
      .populate('dependents', 'name relationship dateOfBirth');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Benefits enrollment not found' });
    }
    res.json(enrollment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBenefitsEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await BenefitsEnrollment.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!enrollment) {
      return res.status(404).json({ message: 'Benefits enrollment not found' });
    }
    res.json(enrollment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBenefitsEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await BenefitsEnrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Benefits enrollment not found' });
    }
    res.json({ message: 'Benefits enrollment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Benefits Categories Controllers
export const createBenefitsCategory = async (req: Request, res: Response) => {
  try {
    const category = new BenefitsCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBenefitsCategories = async (req: Request, res: Response) => {
  try {
    const categories = await BenefitsCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBenefitsCategory = async (req: Request, res: Response) => {
  try {
    const category = await BenefitsCategory.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Benefits category not found' });
    }
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBenefitsCategory = async (req: Request, res: Response) => {
  try {
    const category = await BenefitsCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Benefits category not found' });
    }
    res.json({ message: 'Benefits category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Benefits Cost Management Controllers
export const createBenefitsCost = async (req: Request, res: Response) => {
  try {
    const cost = new BenefitsCost(req.body);
    await cost.save();
    res.status(201).json(cost);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBenefitsCosts = async (req: Request, res: Response) => {
  try {
    const { planId, year, department } = req.query;
    const filter: any = {};
    
    if (planId) filter.plan = planId;
    if (year) filter.year = year;
    if (department) filter.department = department;

    const costs = await BenefitsCost.find(filter)
      .populate('plan', 'name type category')
      .sort({ year: -1, plan: 1 });
    
    res.json(costs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBenefitsCost = async (req: Request, res: Response) => {
  try {
    const cost = await BenefitsCost.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!cost) {
      return res.status(404).json({ message: 'Benefits cost not found' });
    }
    res.json(cost);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBenefitsCost = async (req: Request, res: Response) => {
  try {
    const cost = await BenefitsCost.findByIdAndDelete(req.params.id);
    if (!cost) {
      return res.status(404).json({ message: 'Benefits cost not found' });
    }
    res.json({ message: 'Benefits cost deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Benefits Administration Controllers
export const approveBenefitsChange = async (req: Request, res: Response) => {
  try {
    const { enrollmentId, approverId, comments } = req.body;
    
    const enrollment = await BenefitsEnrollment.findByIdAndUpdate(
      enrollmentId,
      { 
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalComments: comments
      },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Benefits enrollment not found' });
    }
    
    res.json({ message: 'Benefits change approved successfully', enrollment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectBenefitsChange = async (req: Request, res: Response) => {
  try {
    const { enrollmentId, approverId, comments } = req.body;
    
    const enrollment = await BenefitsEnrollment.findByIdAndUpdate(
      enrollmentId,
      { 
        status: 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalComments: comments
      },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Benefits enrollment not found' });
    }
    
    res.json({ message: 'Benefits change rejected', enrollment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const pendingEnrollments = await BenefitsEnrollment.find({ status: 'pending' })
      .populate('employee', 'name email department')
      .populate('plan', 'name type category')
      .sort({ createdAt: -1 });
    
    res.json(pendingEnrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Reports Controllers
export const getBenefitsSummary = async (req: Request, res: Response) => {
  try {
    const { year, department } = req.query;
    const filter: any = {};
    
    if (year) filter.year = year;
    if (department) filter.department = department;

    const summary = await BenefitsEnrollment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          totalCost: { $sum: '$monthlyCost' },
          averageCostPerEmployee: { $avg: '$monthlyCost' }
        }
      }
    ]);

    const planBreakdown = await BenefitsEnrollment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$plan',
          enrollmentCount: { $sum: 1 },
          totalCost: { $sum: '$monthlyCost' }
        }
      },
      { $lookup: { from: 'benefitsplans', localField: '_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $sort: { totalCost: -1 } }
    ]);

    res.json({
      summary: summary[0] || {},
      planBreakdown
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBenefitsCostAnalysis = async (req: Request, res: Response) => {
  try {
    const { year, department } = req.query;
    const filter: any = {};
    
    if (year) filter.year = year;
    if (department) filter.department = department;

    const costAnalysis = await BenefitsEnrollment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { department: '$department', month: { $month: '$enrollmentDate' } },
          totalCost: { $sum: '$monthlyCost' },
          enrollmentCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.department': 1, '_id.month': 1 } }
    ]);

    res.json(costAnalysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEnrollmentReport = async (req: Request, res: Response) => {
  try {
    const { year, planId } = req.query;
    const filter: any = {};
    
    if (year) filter.year = year;
    if (planId) filter.plan = planId;

    const enrollmentReport = await BenefitsEnrollment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { plan: '$plan', status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $lookup: { from: 'benefitsplans', localField: '_id.plan', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $sort: { 'plan.name': 1 } }
    ]);

    res.json(enrollmentReport);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUtilizationReport = async (req: Request, res: Response) => {
  try {
    const { year, planId } = req.query;
    const filter: any = {};
    
    if (year) filter.year = year;
    if (planId) filter.plan = planId;

    const utilizationReport = await BenefitsEnrollment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$plan',
          totalEnrollments: { $sum: 1 },
          activeEnrollments: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalUtilization: { $sum: '$utilization' }
        }
      },
      { $lookup: { from: 'benefitsplans', localField: '_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $addFields: { utilizationRate: { $divide: ['$totalUtilization', '$totalEnrollments'] } } },
      { $sort: { utilizationRate: -1 } }
    ]);

    res.json(utilizationReport);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Employee Self-Service Controllers
export const getEmployeeBenefits = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    
    const benefits = await BenefitsEnrollment.find({ employee: employeeId })
      .populate('plan', 'name type category description')
      .populate('dependents', 'name relationship dateOfBirth')
      .sort({ createdAt: -1 });
    
    res.json(benefits);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const enrollInBenefits = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const enrollmentData = { ...req.body, employee: employeeId };
    
    const enrollment = new BenefitsEnrollment(enrollmentData);
    await enrollment.save();
    
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEmployeeBenefits = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { enrollmentId, ...updateData } = req.body;
    
    const enrollment = await BenefitsEnrollment.findOneAndUpdate(
      { _id: enrollmentId, employee: employeeId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Benefits enrollment not found' });
    }
    
    res.json(enrollment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBenefitsStatements = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    
    const filter: any = { employee: employeeId };
    if (year) filter.year = year;
    
    const statements = await BenefitsEnrollment.find(filter)
      .populate('plan', 'name type category')
      .sort({ year: -1, month: -1 });
    
    res.json(statements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Open Enrollment Controllers
export const createOpenEnrollment = async (req: Request, res: Response) => {
  try {
    const openEnrollment = new OpenEnrollment(req.body);
    await openEnrollment.save();
    res.status(201).json(openEnrollment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getOpenEnrollment = async (req: Request, res: Response) => {
  try {
    const openEnrollments = await OpenEnrollment.find()
      .populate('eligiblePlans', 'name type category')
      .sort({ startDate: -1 });
    
    res.json(openEnrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOpenEnrollment = async (req: Request, res: Response) => {
  try {
    const openEnrollment = await OpenEnrollment.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!openEnrollment) {
      return res.status(404).json({ message: 'Open enrollment not found' });
    }
    res.json(openEnrollment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const startOpenEnrollment = async (req: Request, res: Response) => {
  try {
    const openEnrollment = await OpenEnrollment.findByIdAndUpdate(
      req.params.id,
      { status: 'active', startDate: new Date() },
      { new: true }
    );
    if (!openEnrollment) {
      return res.status(404).json({ message: 'Open enrollment not found' });
    }
    res.json({ message: 'Open enrollment started successfully', openEnrollment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const endOpenEnrollment = async (req: Request, res: Response) => {
  try {
    const openEnrollment = await OpenEnrollment.findByIdAndUpdate(
      req.params.id,
      { status: 'closed', endDate: new Date() },
      { new: true }
    );
    if (!openEnrollment) {
      return res.status(404).json({ message: 'Open enrollment not found' });
    }
    res.json({ message: 'Open enrollment ended successfully', openEnrollment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Benefits Communication Controllers
export const createBenefitsCommunication = async (req: Request, res: Response) => {
  try {
    const communication = new BenefitsCommunication(req.body);
    await communication.save();
    res.status(201).json(communication);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBenefitsCommunications = async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const filter: any = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;

    const communications = await BenefitsCommunication.find(filter)
      .sort({ createdAt: -1 });
    
    res.json(communications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBenefitsCommunication = async (req: Request, res: Response) => {
  try {
    const communication = await BenefitsCommunication.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!communication) {
      return res.status(404).json({ message: 'Benefits communication not found' });
    }
    res.json(communication);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
