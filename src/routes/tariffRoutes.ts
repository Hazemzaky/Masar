import express from 'express';
import {
  createTariff,
  getTariffs,
  getTariff,
  updateTariff,
  deleteTariff,
  calculateRevenue,
  getApplicableTariffs
} from '../controllers/tariffController';

const router = express.Router();

// Tariff CRUD operations
router.post('/', createTariff);
router.get('/', getTariffs);
router.get('/applicable', getApplicableTariffs);
router.get('/:id', getTariff);
router.put('/:id', updateTariff);
router.delete('/:id', deleteTariff);

// Revenue calculation
router.post('/calculate-revenue', calculateRevenue);

export default router; 