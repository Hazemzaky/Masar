import { Request, Response } from 'express';
import ProcurementInvoice from '../models/ProcurementInvoice';

export const getProcurementInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await ProcurementInvoice.find().populate('purchaseOrder');
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProcurementInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await ProcurementInvoice.findById(req.params.id).populate('purchaseOrder');
    if (!invoice) {
      return res.status(404).json({ message: 'Procurement invoice not found' });
    }
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProcurementInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body;
    if (req.file) {
      invoiceData.invoiceFile = req.file.path;
    }
    const invoice = new ProcurementInvoice(invoiceData);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProcurementInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await ProcurementInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) {
      return res.status(404).json({ message: 'Procurement invoice not found' });
    }
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProcurementInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await ProcurementInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Procurement invoice not found' });
    }
    res.json({ message: 'Procurement invoice deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 