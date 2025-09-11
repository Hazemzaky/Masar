"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const invoiceController_1 = require("../controllers/invoiceController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.post('/upload', auth_1.authenticate, upload.single('file'), invoiceController_1.uploadInvoice);
router.get('/', auth_1.authenticate, invoiceController_1.getInvoices);
router.post('/', auth_1.authenticate, invoiceController_1.createInvoice);
router.put('/:id/status', auth_1.authenticate, invoiceController_1.updateInvoiceStatus);
router.get('/aging-report', auth_1.authenticate, invoiceController_1.getAgingReport);
router.get('/:id/pdf', auth_1.authenticate, invoiceController_1.generateInvoicePDF);
router.post('/:id/email', auth_1.authenticate, invoiceController_1.emailInvoice);
exports.default = router;
