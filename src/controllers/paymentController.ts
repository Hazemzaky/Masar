import { Request, Response } from 'express';
import Payment, { IPayment } from '../models/Payment';
import Invoice from '../models/Invoice';
import mongoose from 'mongoose';

// Record a payment
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const {
      invoiceId,
      amount,
      currency = 'KWD',
      paymentMethod,
      paymentReference,
      paymentDate,
      bankDetails,
      checkDetails,
      creditCardDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod || !paymentReference) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Check if invoice exists
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    // Check if payment amount doesn't exceed invoice amount
    const existingPayments = await Payment.find({ invoice: invoiceId, status: { $ne: 'rejected' } });
    const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (totalPaid + amount > invoice.amount) {
      res.status(400).json({ 
        message: `Payment amount exceeds remaining balance. Remaining: ${invoice.amount - totalPaid} ${currency}` 
      });
      return;
    }

    // Create payment record
    const payment = new Payment({
      invoice: invoiceId,
      amount,
      currency,
      paymentMethod,
      paymentReference,
      paymentDate: new Date(paymentDate),
      bankDetails,
      checkDetails,
      creditCardDetails,
      notes,
      createdBy: userId,
      updatedBy: userId
    });

    await payment.save();

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= invoice.amount) {
      invoice.paymentStatus = 'paid';
      invoice.paymentDate = new Date();
      invoice.updatedBy = userId;
      await invoice.save();
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error in recordPayment:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get payments for an invoice
export const getInvoicePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    
    const payments = await Payment.find({ invoice: invoiceId })
      .populate('createdBy', 'name email')
      .populate('reconciledBy', 'name email')
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error in getInvoicePayments:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get all payments with filters
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};
    
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate as string);
      if (endDate) filter.paymentDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const payments = await Payment.find(filter)
      .populate('invoice', 'invoiceNumber customerName amount')
      .populate('createdBy', 'name email')
      .populate('reconciledBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in getPayments:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    payment.status = status;
    payment.updatedBy = userId;
    
    if (notes) payment.notes = notes;
    
    if (status === 'reconciled') {
      payment.reconciledBy = userId;
      payment.reconciledAt = new Date();
    }

    await payment.save();

    res.json(payment);
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Reconcile payments with bank statement
export const reconcilePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIds } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    if (!paymentIds || !Array.isArray(paymentIds)) {
      res.status(400).json({ message: 'Payment IDs array is required' });
      return;
    }

    const result = await Payment.updateMany(
      { _id: { $in: paymentIds } },
      {
        status: 'reconciled',
        reconciledBy: userId,
        reconciledAt: new Date(),
        updatedBy: userId
      }
    );

    res.json({ 
      message: `${result.modifiedCount} payments reconciled successfully`,
      reconciledCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in reconcilePayments:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get payment analytics
export const getPaymentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter: any = {};
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate as string);
      if (endDate) filter.paymentDate.$lte = new Date(endDate as string);
    }

    // Total payments by method
    const paymentsByMethod = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Payments by status
    const paymentsByStatus = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly payment trends
    const monthlyTrends = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Average payment time (from invoice date to payment date)
    const avgPaymentTime = await Payment.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoiceData'
        }
      },
      {
        $unwind: '$invoiceData'
      },
      {
        $project: {
          paymentTime: {
            $divide: [
              { $subtract: ['$paymentDate', '$invoiceData.invoiceDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgPaymentTime: { $avg: '$paymentTime' }
        }
      }
    ]);

    res.json({
      paymentsByMethod,
      paymentsByStatus,
      monthlyTrends,
      averagePaymentTime: avgPaymentTime[0]?.avgPaymentTime || 0
    });
  } catch (error) {
    console.error('Error in getPaymentAnalytics:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Delete payment
export const deletePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    // Check if payment is already reconciled
    if (payment.status === 'reconciled') {
      res.status(400).json({ message: 'Cannot delete reconciled payment' });
      return;
    }

    await Payment.findByIdAndDelete(id);

    // Update invoice status if needed
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      const remainingPayments = await Payment.find({ 
        invoice: payment.invoice, 
        status: { $ne: 'rejected' },
        _id: { $ne: id }
      });
      
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
      
      if (totalPaid < invoice.amount) {
        invoice.paymentStatus = 'pending';
        invoice.paymentDate = undefined;
        invoice.updatedBy = userId;
        await invoice.save();
      }
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error in deletePayment:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
