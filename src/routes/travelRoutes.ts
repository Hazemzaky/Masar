import { Router } from 'express';
import * as travelController from '../controllers/travelController';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
// import upload middleware if needed for file uploads

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post('/', authenticate, travelController.createTravelRecord);
router.get('/', authenticate, travelController.getTravelRecords);
router.get('/analytics', authenticate, travelController.getTravelAnalytics);
router.get('/notifications', authenticate, travelController.getTravelNotifications);
router.get('/:id', authenticate, travelController.getTravelRecord);
router.put('/:id', authenticate, travelController.updateTravelRecord);
router.delete('/:id', authenticate, travelController.deleteTravelRecord);
router.post('/:id/documents', authenticate, upload.single('file'), travelController.uploadTravelDocument);
router.post('/:id/expenses', authenticate, upload.single('receipt'), travelController.addTravelExpense);
router.put('/:id/expenses/:expenseId', authenticate, upload.single('receipt'), travelController.updateTravelExpense);
router.delete('/:id/expenses/:expenseId', authenticate, travelController.deleteTravelExpense);
router.post('/:id/expenses/:expenseId/receipt', authenticate, upload.single('receipt'), travelController.uploadExpenseReceipt);
router.post('/country-guidelines', travelController.createCountryGuideline);
router.get('/country-guidelines', travelController.getCountryGuidelines);
router.get('/country-guidelines/:id', travelController.getCountryGuideline);
router.put('/country-guidelines/:id', travelController.updateCountryGuideline);
router.delete('/country-guidelines/:id', travelController.deleteCountryGuideline);

export default router; 