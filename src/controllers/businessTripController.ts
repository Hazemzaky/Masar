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
    });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
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