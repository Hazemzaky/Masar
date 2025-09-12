import { Request, Response } from 'express';
import { 
  CompensationStructure, 
  EmployeeCompensation, 
  SalaryProgression, 
  VariablePay, 
  MarketAnalysis 
} from '../models/compensationModels';

// Compensation Structure Controllers
export const createCompensationStructure = async (req: Request, res: Response) => {
  try {
    const structure = new CompensationStructure(req.body);
    await structure.save();
    res.status(201).json(structure);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCompensationStructures = async (req: Request, res: Response) => {
  try {
    const structures = await CompensationStructure.find().populate('gradeLevels');
    res.json(structures);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompensationStructure = async (req: Request, res: Response) => {
  try {
    const structure = await CompensationStructure.findById(req.params.id).populate('gradeLevels');
    if (!structure) {
      return res.status(404).json({ message: 'Compensation structure not found' });
    }
    res.json(structure);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompensationStructure = async (req: Request, res: Response) => {
  try {
    const structure = await CompensationStructure.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!structure) {
      return res.status(404).json({ message: 'Compensation structure not found' });
    }
    res.json(structure);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCompensationStructure = async (req: Request, res: Response) => {
  try {
    const structure = await CompensationStructure.findByIdAndDelete(req.params.id);
    if (!structure) {
      return res.status(404).json({ message: 'Compensation structure not found' });
    }
    res.json({ message: 'Compensation structure deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Employee Compensation Controllers
export const createEmployeeCompensation = async (req: Request, res: Response) => {
  try {
    const compensation = new EmployeeCompensation(req.body);
    await compensation.save();
    res.status(201).json(compensation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEmployeeCompensations = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, department, grade, status } = req.query;
    const filter: any = {};
    
    if (department) filter.department = department;
    if (grade) filter.grade = grade;
    if (status) filter.status = status;

    const compensations = await EmployeeCompensation.find(filter)
      .populate('employee', 'name email department position')
      .populate('structure', 'name type')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ updatedAt: -1 });

    const total = await EmployeeCompensation.countDocuments(filter);

    res.json({
      compensations,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeCompensation = async (req: Request, res: Response) => {
  try {
    const compensation = await EmployeeCompensation.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('structure', 'name type')
      .populate('variablePay', 'type amount percentage');
    
    if (!compensation) {
      return res.status(404).json({ message: 'Employee compensation not found' });
    }
    res.json(compensation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployeeCompensation = async (req: Request, res: Response) => {
  try {
    const compensation = await EmployeeCompensation.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('employee', 'name email department position');
    
    if (!compensation) {
      return res.status(404).json({ message: 'Employee compensation not found' });
    }
    res.json(compensation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmployeeCompensation = async (req: Request, res: Response) => {
  try {
    const compensation = await EmployeeCompensation.findByIdAndDelete(req.params.id);
    if (!compensation) {
      return res.status(404).json({ message: 'Employee compensation not found' });
    }
    res.json({ message: 'Employee compensation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Salary Progression Controllers
export const createSalaryProgression = async (req: Request, res: Response) => {
  try {
    const progression = new SalaryProgression(req.body);
    await progression.save();
    res.status(201).json(progression);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSalaryProgressions = async (req: Request, res: Response) => {
  try {
    const progressions = await SalaryProgression.find().populate('structure');
    res.json(progressions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSalaryProgression = async (req: Request, res: Response) => {
  try {
    const progression = await SalaryProgression.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!progression) {
      return res.status(404).json({ message: 'Salary progression not found' });
    }
    res.json(progression);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSalaryProgression = async (req: Request, res: Response) => {
  try {
    const progression = await SalaryProgression.findByIdAndDelete(req.params.id);
    if (!progression) {
      return res.status(404).json({ message: 'Salary progression not found' });
    }
    res.json({ message: 'Salary progression deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Variable Pay Controllers
export const createVariablePay = async (req: Request, res: Response) => {
  try {
    const variablePay = new VariablePay(req.body);
    await variablePay.save();
    res.status(201).json(variablePay);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getVariablePay = async (req: Request, res: Response) => {
  try {
    const { employeeId, type, year } = req.query;
    const filter: any = {};
    
    if (employeeId) filter.employee = employeeId;
    if (type) filter.type = type;
    if (year) filter.year = year;

    const variablePay = await VariablePay.find(filter)
      .populate('employee', 'name email department')
      .sort({ createdAt: -1 });
    
    res.json(variablePay);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVariablePay = async (req: Request, res: Response) => {
  try {
    const variablePay = await VariablePay.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!variablePay) {
      return res.status(404).json({ message: 'Variable pay not found' });
    }
    res.json(variablePay);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVariablePay = async (req: Request, res: Response) => {
  try {
    const variablePay = await VariablePay.findByIdAndDelete(req.params.id);
    if (!variablePay) {
      return res.status(404).json({ message: 'Variable pay not found' });
    }
    res.json({ message: 'Variable pay deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Market Analysis Controllers
export const createMarketAnalysis = async (req: Request, res: Response) => {
  try {
    const analysis = new MarketAnalysis(req.body);
    await analysis.save();
    res.status(201).json(analysis);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMarketAnalysis = async (req: Request, res: Response) => {
  try {
    const { position, location, industry } = req.query;
    const filter: any = {};
    
    if (position) filter.position = position;
    if (location) filter.location = location;
    if (industry) filter.industry = industry;

    const analyses = await MarketAnalysis.find(filter).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMarketAnalysis = async (req: Request, res: Response) => {
  try {
    const analysis = await MarketAnalysis.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!analysis) {
      return res.status(404).json({ message: 'Market analysis not found' });
    }
    res.json(analysis);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Reports Controllers
export const getCompensationSummary = async (req: Request, res: Response) => {
  try {
    const { department, grade, year } = req.query;
    const filter: any = {};
    
    if (department) filter.department = department;
    if (grade) filter.grade = grade;
    if (year) filter.year = year;

    const summary = await EmployeeCompensation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          averageBaseSalary: { $avg: '$baseSalary' },
          averageTotalCompensation: { $avg: '$totalCompensation' },
          minSalary: { $min: '$baseSalary' },
          maxSalary: { $max: '$baseSalary' },
          totalCompensationCost: { $sum: '$totalCompensation' }
        }
      }
    ]);

    res.json(summary[0] || {});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayEquityReport = async (req: Request, res: Response) => {
  try {
    const { department, position } = req.query;
    const filter: any = {};
    
    if (department) filter.department = department;
    if (position) filter.position = position;

    const equityReport = await EmployeeCompensation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { gender: '$gender', position: '$position' },
          averageSalary: { $avg: '$baseSalary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.position': 1, '_id.gender': 1 } }
    ]);

    res.json(equityReport);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCostAnalysis = async (req: Request, res: Response) => {
  try {
    const { year, department } = req.query;
    const filter: any = {};
    
    if (year) filter.year = year;
    if (department) filter.department = department;

    const costAnalysis = await EmployeeCompensation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { department: '$department', month: { $month: '$effectiveDate' } },
          totalCost: { $sum: '$totalCompensation' },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.department': 1, '_id.month': 1 } }
    ]);

    res.json(costAnalysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBenchmarkingReport = async (req: Request, res: Response) => {
  try {
    const { position, location } = req.query;
    
    const internalData = await EmployeeCompensation.aggregate([
      { $match: { position, location } },
      {
        $group: {
          _id: '$position',
          internalAverage: { $avg: '$baseSalary' },
          internalMedian: { $avg: '$baseSalary' },
          internalCount: { $sum: 1 }
        }
      }
    ]);

    const marketData = await MarketAnalysis.find({ position, location });

    res.json({
      internal: internalData,
      market: marketData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk Operations
export const bulkUpdateCompensation = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    const results = [];

    for (const update of updates) {
      const result = await EmployeeCompensation.findByIdAndUpdate(
        update.id, 
        update.data, 
        { new: true, runValidators: true }
      );
      results.push(result);
    }

    res.json({ message: 'Bulk update completed', results });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const bulkImportCompensation = async (req: Request, res: Response) => {
  try {
    const { compensations } = req.body;
    const results = await EmployeeCompensation.insertMany(compensations);
    res.status(201).json({ message: 'Bulk import completed', count: results.length });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
