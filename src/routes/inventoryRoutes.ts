import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Inventory Items
router.post('/items', authenticate, inventoryController.createItem);
router.get('/items', authenticate, inventoryController.getItems);
router.get('/items/:id', authenticate, inventoryController.getItem);
router.put('/items/:id', authenticate, inventoryController.updateItem);
router.delete('/items/:id', authenticate, inventoryController.deleteItem);

// Inventory Transactions
router.post('/transactions', authenticate, inventoryController.createTransaction);
router.get('/transactions', authenticate, inventoryController.getTransactions);
router.get('/items/:id/transactions', authenticate, inventoryController.getItemTransactions);

export default router; 