import express from 'express';
import multer from 'multer';
import {
  createBusinessTrip,
  getBusinessTrips,
  getBusinessTripById,
  updateBusinessTrip,
  deleteBusinessTrip
} from '../controllers/businessTripController';

const router = express.Router();

// Multer storage config (simple, can be improved for prod)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/business-trips/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Fields for all possible uploads
const uploadFields = upload.fields([
  { name: 'agendaFile', maxCount: 1 },
  { name: 'seminarFile', maxCount: 1 },
  { name: 'hotelQuotes', maxCount: 10 },
  { name: 'flightQuotes', maxCount: 10 },
  { name: 'receipts', maxCount: 10 },
  { name: 'claimSheet', maxCount: 1 },
  { name: 'postTripSummary', maxCount: 1 },
  { name: 'boardingPass', maxCount: 1 },
  { name: 'signedClaimForm', maxCount: 1 },
]);

router.post('/', uploadFields, createBusinessTrip);
router.get('/', getBusinessTrips);
router.get('/:id', getBusinessTripById);
router.put('/:id', uploadFields, updateBusinessTrip);
router.delete('/:id', deleteBusinessTrip);

export default router; 