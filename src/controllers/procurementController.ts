import { Request, Response } from 'express';
import PurchaseRequest from '../models/PurchaseRequest';
import Vendor from '../models/Vendor';
import PurchaseOrder from '../models/PurchaseOrder';
import mongoose from 'mongoose';
import Quotation from '../models/Quotation';
import GoodsReceipt from '../models/GoodsReceipt';
import ProcurementInvoice from '../models/ProcurementInvoice';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';
import LowStockAlert from '../models/LowStockAlert';
import { generateSerial } from '../utils/serialUtils';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: { userId: string; role?: string };
}

// Create a new Purchase Request
export const createPurchaseRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { itemDescription, quantity, priority, budgetCode, department, attachments } = req.body;
    const requester = req.user?.userId || req.body.requester; // support both direct and middleware
    if (!itemDescription || !quantity || !priority || !budgetCode || !department || !requester) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    // Serial number generation
    const docCode = 'PR';
    const dept = department || 'PR';
    const serial = await generateSerial(docCode, dept, PurchaseRequest);
    const pr = new PurchaseRequest({
      itemDescription,
      quantity,
      priority,
      budgetCode,
      department,
      requester,
      attachments: attachments || [],
      status: 'pending',
      approvalHistory: [{ approver: requester, action: 'pending', date: new Date() }],
      serial
    });
    await pr.save();
    res.status(201).json(pr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all Purchase Requests
export const getPurchaseRequests = async (req: AuthRequest, res: Response) => {
  try {
    const prs = await PurchaseRequest.find().populate('requester').populate('approvalHistory.approver');
    res.json(prs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a single Purchase Request by ID
export const getPurchaseRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const pr = await PurchaseRequest.findById(req.params.id).populate('requester').populate('approvalHistory.approver');
    if (!pr) {
      res.status(404).json({ message: 'Purchase Request not found' });
      return;
    }
    res.json(pr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a Purchase Request (fields or status)
export const updatePurchaseRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { status, approvalAction, comment } = req.body;
    const pr = await PurchaseRequest.findById(req.params.id);
    if (!pr) {
      res.status(404).json({ message: 'Purchase Request not found' });
      return;
    }
    // Stock check before approval
    if (status === 'approved') {
      const invItem = await InventoryItem.findOne({ description: pr.itemDescription });
      if (invItem && typeof invItem.rop === 'number' && invItem.quantity >= invItem.rop) {
        res.status(400).json({ message: `Stock for '${pr.itemDescription}' is sufficient (${invItem.quantity} in stock, ROP: ${invItem.rop}). Approval blocked.` });
        return;
      }
    }
    // Only allow status/approval changes via this endpoint
    if (status && ['approved', 'sent_to_procurement', 'rejected'].includes(status)) {
      pr.status = status;
      pr.approvalHistory.push({
        approver: req.user?.userId || req.body.approver,
        action: status,
        date: new Date(),
        comment,
      });
    }
    Object.assign(pr, req.body);
    await pr.save();
    res.json(pr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a Purchase Request
export const deletePurchaseRequest = async (req: AuthRequest, res: Response) => {
  try {
    const pr = await PurchaseRequest.findByIdAndDelete(req.params.id);
    if (!pr) {
      res.status(404).json({ message: 'Purchase Request not found' });
      return;
    }
    res.json({ message: 'Purchase Request deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// --- Vendor Endpoints ---
export const createVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, contactInfo, registrationStatus, rating, documents, status } = req.body;
    if (!name || !contactInfo) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    if (!req.user?.userId) {
      res.status(400).json({ message: 'Approver (user) is required' });
      return;
    }
    const vendor = new Vendor({
      name,
      contactInfo,
      registrationStatus: registrationStatus || 'pending',
      rating,
      documents: documents || {},
      status: status || 'active',
      approvalHistory: [{ approver: new mongoose.Types.ObjectId(req.user.userId), action: 'pending', date: new Date() }],
    });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendors = await Vendor.find().populate('approvalHistory.approver');
    res.json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getVendorById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('approvalHistory.approver');
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, registrationStatus, approvalAction, comment } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    // Approval workflow
    if (status && ['active', 'blacklisted', 'inactive'].includes(status)) {
      if (req.user?.userId) {
        vendor.status = status;
        vendor.approvalHistory.push({
          approver: new mongoose.Types.ObjectId(req.user.userId),
          action: status,
          date: new Date(),
          comment,
        });
      }
    }
    if (registrationStatus && ['pending', 'approved', 'rejected'].includes(registrationStatus)) {
      if (req.user?.userId) {
        vendor.registrationStatus = registrationStatus;
        vendor.approvalHistory.push({
          approver: new mongoose.Types.ObjectId(req.user.userId),
          action: registrationStatus,
          date: new Date(),
          comment,
        });
      }
    }
    Object.assign(vendor, req.body);
    await vendor.save();
    res.json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// --- Purchase Order Endpoints ---
function generatePONumber() {
  // Example: PO-YYYYMMDD-HHMMSS-RANDOM
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${date}-${time}-${rand}`;
}

export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { purchaseRequest, vendor, items, totalAmount, deliveryTerms, paymentTerms, scannedPO, generatedPDF, department } = req.body;
    if (!purchaseRequest || !vendor || !items || !totalAmount) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const poNumber = generatePONumber();
    // Serial number generation
    const docCode = 'PO';
    const dept = department || 'PR';
    const serial = await generateSerial(docCode, dept, PurchaseOrder);
    const po = new PurchaseOrder({
      poNumber,
      purchaseRequest,
      vendor,
      items,
      totalAmount,
      deliveryTerms,
      paymentTerms,
      status: 'open',
      scannedPO,
      generatedPDF,
      serial
    });
    await po.save();
    res.status(201).json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pos = await PurchaseOrder.find()
      .populate('purchaseRequest')
      .populate('vendor');
    res.json(pos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPurchaseOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('purchaseRequest')
      .populate('vendor');
    if (!po) {
      res.status(404).json({ message: 'Purchase Order not found' });
      return;
    }
    res.json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      res.status(404).json({ message: 'Purchase Order not found' });
      return;
    }
    // Only allow status transitions via this endpoint
    if (status && ['open', 'ordered', 'delivered', 'cancelled'].includes(status)) {
      po.status = status;
    }
    Object.assign(po, req.body);
    await po.save();
    res.json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) {
      res.status(404).json({ message: 'Purchase Order not found' });
      return;
    }
    res.json({ message: 'Purchase Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// --- Quotation (RFQ/RFP) Endpoints ---
export const createQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { purchaseRequest, vendors, responses, selectedVendor, justification, approvalStatus } = req.body;
    if (!purchaseRequest || !vendors || !Array.isArray(vendors) || vendors.length === 0) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const quotation = new Quotation({
      purchaseRequest,
      vendors,
      responses: responses || [],
      selectedVendor,
      justification,
      approvalStatus: approvalStatus || 'pending',
    });
    await quotation.save();
    res.status(201).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getQuotations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotations = await Quotation.find()
      .populate('purchaseRequest')
      .populate('vendors')
      .populate('responses.vendor')
      .populate('selectedVendor');
    res.json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getQuotationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('purchaseRequest')
      .populate('vendors')
      .populate('responses.vendor')
      .populate('selectedVendor');
    if (!quotation) {
      res.status(404).json({ message: 'Quotation not found' });
      return;
    }
    res.json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { responses, selectedVendor, justification, approvalStatus } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      res.status(404).json({ message: 'Quotation not found' });
      return;
    }
    if (responses) {
      quotation.responses = responses;
    }
    if (selectedVendor) {
      quotation.selectedVendor = selectedVendor;
    }
    if (justification !== undefined) {
      quotation.justification = justification;
    }
    if (approvalStatus && ['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      quotation.approvalStatus = approvalStatus;
    }
    Object.assign(quotation, req.body);
    await quotation.save();
    res.json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      res.status(404).json({ message: 'Quotation not found' });
      return;
    }
    res.json({ message: 'Quotation deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// --- Goods Receipt (GRN) Endpoints ---
export const createGoodsReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { purchaseOrder, receivedBy, receivedDate, items, documents, status } = req.body;
    
    // Validate required fields
    if (!purchaseOrder || !receivedBy || !receivedDate || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ 
        success: false,
        message: 'Missing required fields: purchaseOrder, receivedBy, receivedDate, and items array are required' 
      });
      return;
    }

    // Validate items structure
    for (const item of items) {
      if (!item.description || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({ 
          success: false,
          message: 'Invalid item data: description and positive quantity are required for each item' 
        });
        return;
      }
    }

    // Create the GRN
    // Serial number generation
    const docCode = 'GR';
    const department = req.body.department || 'PR';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    const count = await GoodsReceipt.countDocuments({
      serial: { $regex: `^${docCode}-${department}-${dateStr}-` }
    });
    const seq = String(count + 1).padStart(3, '0');
    const serial = `${docCode}-${department}-${dateStr}-${seq}`;
    const grn = new GoodsReceipt({
      purchaseOrder,
      receivedBy,
      receivedDate: new Date(receivedDate),
      items,
      documents: documents || [],
      status: status || 'received',
      serial
    });

    await grn.save();

    // Inventory update logic with better error handling
    try {
      for (const item of items) {
        // Try to find by name/description
        let invItem = await InventoryItem.findOne({ description: item.description });
        
        if (!invItem) {
          // Create new inventory item if not found
          invItem = new InventoryItem({
            description: item.description,
            type: 'consumable', // Default, adjust as needed
            quantity: item.quantity,
            uom: 'pcs', // Default, adjust as needed
            status: 'active'
          });
        } else {
          invItem.quantity += item.quantity;
        }
        
        await invItem.save();
        
        // Log inventory transaction
        await InventoryTransaction.create({
          item: invItem._id,
          type: 'inbound',
          quantity: item.quantity,
          date: new Date(receivedDate),
          user: receivedBy,
          notes: `GRN: ${grn._id}`,
        });
        
        // Low stock alert check
        if (typeof invItem.rop === 'number' && invItem.quantity < invItem.rop) {
          await LowStockAlert.create({
            item: invItem._id,
            name: invItem.description,
            quantity: invItem.quantity,
            minStock: invItem.rop,
            triggeredAt: new Date(),
            resolved: false,
          });
        } else {
          // Optionally resolve previous alerts if stock is now sufficient
          await LowStockAlert.updateMany(
            { item: invItem._id, resolved: false }, 
            { resolved: true }
          );
        }
      }
    } catch (inventoryError) {
      console.error('Inventory update error:', inventoryError);
      // Don't fail the GRN creation if inventory update fails
      // Just log the error and continue
    }

    res.status(201).json({
      success: true,
      data: grn,
      message: 'Goods Receipt created successfully'
    });
  } catch (error: any) {
    console.error('GRN creation error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: validationErrors 
      });
    } else if (error.code === 11000) {
      res.status(400).json({ 
        success: false,
        message: 'Duplicate entry found' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Server error while creating Goods Receipt',
        error: error.message 
      });
    }
  }
};

export const getGoodsReceipts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grns = await GoodsReceipt.find()
      .populate('purchaseOrder')
      .populate('receivedBy');
    res.json(grns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getGoodsReceiptById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grn = await GoodsReceipt.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('receivedBy');
    if (!grn) {
      res.status(404).json({ message: 'Goods Receipt not found' });
      return;
    }
    res.json(grn);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateGoodsReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grn = await GoodsReceipt.findById(req.params.id);
    if (!grn) {
      res.status(404).json({ message: 'Goods Receipt not found' });
      return;
    }
    Object.assign(grn, req.body);
    await grn.save();
    res.json(grn);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteGoodsReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grn = await GoodsReceipt.findByIdAndDelete(req.params.id);
    if (!grn) {
      res.status(404).json({ message: 'Goods Receipt not found' });
      return;
    }
    res.json({ message: 'Goods Receipt deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// --- Procurement Invoice Endpoints ---
export const createProcurementInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { purchaseOrder, invoiceFile, amount, status, paymentDate, matchedGRN, serial } = req.body;
    if (!purchaseOrder || !invoiceFile || !amount) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const invoice = new ProcurementInvoice({
      purchaseOrder,
      invoiceFile,
      amount,
      status: status || 'pending',
      paymentDate,
      matchedGRN,
      serial,
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProcurementInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoices = await ProcurementInvoice.find()
      .populate('purchaseOrder')
      .populate('matchedGRN');
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProcurementInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await ProcurementInvoice.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('matchedGRN');
    if (!invoice) {
      res.status(404).json({ message: 'Procurement Invoice not found' });
      return;
    }
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProcurementInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await ProcurementInvoice.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ message: 'Procurement Invoice not found' });
      return;
    }
    Object.assign(invoice, req.body);
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteProcurementInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await ProcurementInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      res.status(404).json({ message: 'Procurement Invoice not found' });
      return;
    }
    res.json({ message: 'Procurement Invoice deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// --- Low Stock Alerts Endpoint ---
export const getLowStockAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await LowStockAlert.find({ resolved: false }).populate('item');
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 