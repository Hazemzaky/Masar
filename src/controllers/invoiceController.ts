import { Request, Response } from 'express';
import Invoice, { IInvoice } from '../models/Invoice';
import mongoose from 'mongoose';
import PDFService from '../services/pdfService';

export const uploadInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    const { expenseId } = req.body;
    const invoice = new Invoice({
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: userId,
      expense: expenseId,
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error in uploadInvoice:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.find()
      .populate('submittedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    
    // Transform the data to match the frontend expectations
    const transformedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      recipient: {
        name: invoice.customerName || 'Unknown Customer',
        email: invoice.customerReference || 'no-email@example.com'
      },
      dueDate: invoice.dueDate,
      status: invoice.paymentStatus, // Map paymentStatus to status for frontend compatibility
      totalAmount: invoice.amount,
      lineItems: invoice.lineItems || [],
      uploadedBy: invoice.uploadedBy,
      fileUrl: invoice.fileUrl,
      serial: invoice.serial || invoice.invoiceNumber,
      // Include additional fields from the new model
      invoiceNumber: invoice.invoiceNumber,
      description: invoice.description,
      currency: invoice.currency,
      taxAmount: invoice.taxAmount,
      netAmount: invoice.netAmount,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }));
    
    res.json(transformedInvoices);
  } catch (error) {
    console.error('Error in getInvoices:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Create a new invoice with line items, recipient, due date, etc.
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    const { recipient, dueDate, lineItems, fileUrl, serial } = req.body;
    if (!recipient || !dueDate || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    
    const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = 0; // Default to 0% tax - can be made configurable
    const taxAmount = totalAmount * taxRate;
    const netAmount = totalAmount - taxAmount;
    
    // Generate invoice number if not provided
    const invoiceNumber = serial || `INV-${Date.now()}`;
    
    const invoice = new Invoice({
      // Basic information
      invoiceNumber,
      description: lineItems.map(item => item.description).join(', '),
      amount: totalAmount,
      currency: 'KWD',
      amountInBaseCurrency: totalAmount,
      
      // Revenue categorization
      category: 'other_income', // Default category
      subcategory: 'invoice',
      
      // IFRS revenue recognition
      ifrsCategory: 'operating_revenue',
      ifrsTreatment: 'revenue',
      revenueRecognitionMethod: 'point_in_time',
      
      // Dates
      invoiceDate: new Date(),
      dueDate: new Date(dueDate),
      revenueRecognitionDate: new Date(),
      
      // Customer information - create a temporary customer reference
      customer: new mongoose.Types.ObjectId(), // This should be replaced with actual customer ID
      customerName: recipient.name,
      customerReference: recipient.email,
      
      // Payment information
      paymentStatus: 'pending',
      
      // Tax information
      taxAmount,
      taxRate,
      taxType: 'VAT',
      netAmount,
      
      // Approval workflow
      status: 'draft',
      submittedBy: userId,
      createdBy: userId,
      updatedBy: userId,
      
      // IFRS compliance
      ifrsDisclosureRequired: false,
      
      // Additional fields for compatibility (these might not be in the schema but won't cause errors)
      fileUrl,
      uploadedBy: userId,
      lineItems,
      totalAmount,
      serial: invoiceNumber,
    });
    
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error in createInvoice:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update invoice status (sent, paid, overdue)
export const updateInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }
    
    // Map frontend status to paymentStatus
    const statusMapping: Record<string, string> = {
      'draft': 'pending',
      'sent': 'pending', 
      'paid': 'paid',
      'overdue': 'overdue',
      'cancelled': 'cancelled',
      'disputed': 'disputed'
    };
    
    invoice.paymentStatus = statusMapping[status] || status;
    invoice.updatedBy = userId;
    
    // If marking as paid, set payment date
    if (status === 'paid') {
      invoice.paymentDate = new Date();
    }
    
    await invoice.save();
    
    // Return transformed data for frontend compatibility
    const transformedInvoice = {
      _id: invoice._id,
      recipient: {
        name: invoice.customerName || 'Unknown Customer',
        email: invoice.customerReference || 'no-email@example.com'
      },
      dueDate: invoice.dueDate,
      status: invoice.paymentStatus,
      totalAmount: invoice.amount,
      lineItems: invoice.lineItems || [],
      serial: invoice.serial || invoice.invoiceNumber,
      invoiceNumber: invoice.invoiceNumber,
      description: invoice.description,
      currency: invoice.currency,
      taxAmount: invoice.taxAmount,
      netAmount: invoice.netAmount,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
    
    res.json(transformedInvoice);
  } catch (error) {
    console.error('Error in updateInvoiceStatus:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Generate PDF for invoice
export const generateInvoicePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { template = 'standard' } = req.query;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const pdfService = PDFService.getInstance();
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, {
      template: template as 'standard' | 'detailed' | 'minimal',
      includeLogo: true,
      companyInfo: {
        name: 'Your Company Name',
        address: '123 Business Street, Kuwait City, Kuwait',
        phone: '+965 1234-5678',
        email: 'billing@company.com',
        website: 'www.company.com',
        taxId: 'TAX-123456789'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in generateInvoicePDF:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Email invoice
export const emailInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { recipientEmail, template = 'standard' } = req.body;
    
    if (!recipientEmail) {
      res.status(400).json({ message: 'Recipient email is required' });
      return;
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const pdfService = PDFService.getInstance();
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, {
      template: template as 'standard' | 'detailed' | 'minimal',
      includeLogo: true,
      companyInfo: {
        name: 'Your Company Name',
        address: '123 Business Street, Kuwait City, Kuwait',
        phone: '+965 1234-5678',
        email: 'billing@company.com',
        website: 'www.company.com',
        taxId: 'TAX-123456789'
      }
    });

    await pdfService.emailInvoice(id, recipientEmail, pdfBuffer);
    
    res.json({ message: 'Invoice sent successfully', recipientEmail });
  } catch (error) {
    console.error('Error in emailInvoice:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Aging report: group invoices by overdue periods
export const getAgingReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const invoices = await Invoice.find({ status: { $in: ['sent', 'overdue'] } });
    const buckets = {
      '0-30': [],
      '31-60': [],
      '61-90': [],
      '90+': [],
    } as Record<string, IInvoice[]>;
    invoices.forEach((inv: any) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 30) buckets['0-30'].push(inv);
      else if (daysOverdue <= 60) buckets['31-60'].push(inv);
      else if (daysOverdue <= 90) buckets['61-90'].push(inv);
      else buckets['90+'].push(inv);
    });
    res.json(buckets);
  } catch (error) {
    console.error('Error in getAgingReport:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 