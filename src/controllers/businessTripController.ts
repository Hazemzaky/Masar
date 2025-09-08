import { Request, Response } from 'express';
import BusinessTrip from '../models/BusinessTrip';

// Helper to safely extract files from req.files
function getFile(req: Request, field: string): string | undefined {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  return files && files[field] && files[field][0] ? files[field][0].path : undefined;
}
function getFiles(req: Request, field: string): string[] | undefined {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  return files && files[field] ? files[field].map(f => f.path) : undefined;
}

// Create a new business trip
export const createBusinessTrip = async (req: Request, res: Response) => {
  try {
    console.log('Creating business trip with data:', req.body);
    
    // Parse approval comments if provided
    let approvalComments: any = {};
    if (req.body.approvalComments) {
      try {
        approvalComments = JSON.parse(req.body.approvalComments);
      } catch (e) {
        console.log('Failed to parse approval comments:', e);
      }
    }

    // Initialize approval chain
    const approvalChain = [
      { role: 'Dept. Manager', name: '', status: 'Pending' as const, comment: approvalComments['manager'] || '' },
      { role: 'HR', name: '', status: 'Pending' as const, comment: approvalComments['hr'] || '' },
      { role: 'DCEO', name: '', status: 'Pending' as const, comment: approvalComments['dceo'] || '' },
      { role: 'GCEO', name: '', status: 'Pending' as const, comment: approvalComments['gceo'] || '' },
    ];

    const trip = new BusinessTrip({
      ...req.body,
      agendaFile: getFile(req, 'agendaFile'),
      seminarFile: getFile(req, 'seminarFile'),
      hotelQuotes: getFiles(req, 'hotelQuotes'),
      flightQuotes: getFiles(req, 'flightQuotes'),
      receipts: getFiles(req, 'receipts'),
      claimSheet: getFile(req, 'claimSheet'),
      postTripSummary: getFile(req, 'postTripSummary'),
      boardingPass: getFile(req, 'boardingPass'),
      signedClaimForm: getFile(req, 'signedClaimForm'),
      // Handle amortization fields
      costAmortization: req.body.costAmortization === 'true',
      totalTripCost: req.body.totalTripCost ? Number(req.body.totalTripCost) : undefined,
      customPeriod: req.body.customPeriod ? Number(req.body.customPeriod) : undefined,
      amortizationStartDate: req.body.amortizationStartDate ? new Date(req.body.amortizationStartDate) : undefined,
      amortizationEndDate: req.body.amortizationEndDate ? new Date(req.body.amortizationEndDate) : undefined,
      // Initialize required fields
      approvalChain,
      // Handle other fields
      requiresVisa: req.body.requiresVisa === 'true',
      perDiemPaid: req.body.perDiemPaid === 'true',
      perDiem: Number(req.body.perDiem) || 0,
      totalPerDiem: Number(req.body.totalPerDiem) || 0,
      // Handle additional fields
      financeApproval: req.body.financeApproval || 'pending',
      financeComments: req.body.financeComments || '',
    });
    
    console.log('Saving business trip...');
    await trip.save();
    console.log('Business trip saved successfully');
    res.status(201).json(trip);
  } catch (err) {
    console.error('Error creating business trip:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
};

// Get all business trips (with optional filters)
export const getBusinessTrips = async (req: Request, res: Response) => {
  try {
    const trips = await BusinessTrip.find().populate('employee');
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
};

// Get a single business trip by ID
export const getBusinessTripById = async (req: Request, res: Response) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id).populate('employee');
    if (!trip) return res.status(404).json({ error: 'Not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
};

// Update a business trip
export const updateBusinessTrip = async (req: Request, res: Response) => {
  try {
    const update: any = { ...req.body };
    if (req.files) {
      if (getFile(req, 'agendaFile')) update.agendaFile = getFile(req, 'agendaFile');
      if (getFile(req, 'seminarFile')) update.seminarFile = getFile(req, 'seminarFile');
      if (getFiles(req, 'hotelQuotes')) update.hotelQuotes = getFiles(req, 'hotelQuotes');
      if (getFiles(req, 'flightQuotes')) update.flightQuotes = getFiles(req, 'flightQuotes');
      if (getFiles(req, 'receipts')) update.receipts = getFiles(req, 'receipts');
      if (getFile(req, 'claimSheet')) update.claimSheet = getFile(req, 'claimSheet');
      if (getFile(req, 'postTripSummary')) update.postTripSummary = getFile(req, 'postTripSummary');
      if (getFile(req, 'boardingPass')) update.boardingPass = getFile(req, 'boardingPass');
      if (getFile(req, 'signedClaimForm')) update.signedClaimForm = getFile(req, 'signedClaimForm');
    }
    
    // Handle amortization fields
    if (req.body.costAmortization !== undefined) {
      update.costAmortization = req.body.costAmortization === 'true';
    }
    if (req.body.totalTripCost) {
      update.totalTripCost = Number(req.body.totalTripCost);
    }
    if (req.body.customPeriod) {
      update.customPeriod = Number(req.body.customPeriod);
    }
    if (req.body.amortizationStartDate) {
      update.amortizationStartDate = new Date(req.body.amortizationStartDate);
    }
    if (req.body.amortizationEndDate) {
      update.amortizationEndDate = new Date(req.body.amortizationEndDate);
    }
    
    const trip = await BusinessTrip.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!trip) return res.status(404).json({ error: 'Not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
};

// Delete a business trip
export const deleteBusinessTrip = async (req: Request, res: Response) => {
  try {
    const trip = await BusinessTrip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}; 