import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPurchaseRequest,
  getPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequest,
  deletePurchaseRequest,
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  createGoodsReceipt,
  getGoodsReceipts,
  getGoodsReceiptById,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  createProcurementInvoice,
  getProcurementInvoices,
  getProcurementInvoiceById,
  updateProcurementInvoice,
  deleteProcurementInvoice,
  getLowStockAlerts
} from '../controllers/procurementController';

console.log('Procurement routes loaded');

const router = express.Router();

// Purchase Request Routes
router.post('/purchase-requests', authenticate, createPurchaseRequest);
router.get('/purchase-requests', authenticate, getPurchaseRequests);
router.get('/purchase-requests/:id', authenticate, getPurchaseRequestById);
router.put('/purchase-requests/:id', authenticate, updatePurchaseRequest);
router.delete('/purchase-requests/:id', authenticate, deletePurchaseRequest);

// Vendor Routes
router.post('/vendors', authenticate, createVendor);
router.get('/vendors', authenticate, getVendors);
router.get('/vendors/:id', authenticate, getVendorById);
router.put('/vendors/:id', authenticate, updateVendor);
router.delete('/vendors/:id', authenticate, deleteVendor);

// Purchase Order Routes
router.post('/purchase-orders', authenticate, createPurchaseOrder);
router.get('/purchase-orders', authenticate, getPurchaseOrders);
router.get('/purchase-orders/:id', authenticate, getPurchaseOrderById);
router.put('/purchase-orders/:id', authenticate, updatePurchaseOrder);
router.delete('/purchase-orders/:id', authenticate, deletePurchaseOrder);

// Quotation Routes
router.post('/quotations', authenticate, createQuotation);
router.get('/quotations', authenticate, getQuotations);
router.get('/quotations/:id', authenticate, getQuotationById);
router.put('/quotations/:id', authenticate, updateQuotation);
router.delete('/quotations/:id', authenticate, deleteQuotation);

// Goods Receipt Routes
router.post('/goods-receipts', authenticate, createGoodsReceipt);
router.get('/goods-receipts', authenticate, getGoodsReceipts);
router.get('/goods-receipts/:id', authenticate, getGoodsReceiptById);
router.put('/goods-receipts/:id', authenticate, updateGoodsReceipt);
router.delete('/goods-receipts/:id', authenticate, deleteGoodsReceipt);

// Procurement Invoice Routes
router.post('/procurement-invoices', authenticate, createProcurementInvoice);
router.get('/procurement-invoices', authenticate, getProcurementInvoices);
router.get('/procurement-invoices/:id', authenticate, getProcurementInvoiceById);
router.put('/procurement-invoices/:id', authenticate, updateProcurementInvoice);
router.delete('/procurement-invoices/:id', authenticate, deleteProcurementInvoice);

// Low Stock Alerts
router.get('/low-stock-alerts', authenticate, getLowStockAlerts);

// Debug route
router.get('/debug', (req, res) => res.json({ message: 'Procurement router is working' }));

export default router; 