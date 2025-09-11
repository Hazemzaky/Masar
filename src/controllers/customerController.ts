import { Request, Response } from 'express';
import Customer, { ICustomer } from '../models/Customer';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import mongoose from 'mongoose';

// Create a new customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const customerData = {
      ...req.body,
      createdBy: userId,
      updatedBy: userId
    };

    // Check if customer with same email already exists
    const existingCustomer = await Customer.findOne({ email: customerData.email });
    if (existingCustomer) {
      res.status(400).json({ message: 'Customer with this email already exists' });
      return;
    }

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get all customers with filters and pagination
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      status,
      businessType,
      city,
      tags,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filter: any = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'primaryContact.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (businessType) filter.businessType = businessType;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const customers = await Customer.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Customer.countDocuments(filter);

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get customer by ID
export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (error) {
    console.error('Error in getCustomer:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== customer.email) {
      const existingCustomer = await Customer.findOne({ 
        email: req.body.email,
        _id: { $ne: id }
      });
      if (existingCustomer) {
        res.status(400).json({ message: 'Customer with this email already exists' });
        return;
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: userId },
      { new: true, runValidators: true }
    );

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Check if customer has any invoices
    const invoiceCount = await Invoice.countDocuments({ customer: id });
    if (invoiceCount > 0) {
      res.status(400).json({ 
        message: 'Cannot delete customer with existing invoices. Please archive instead.',
        invoiceCount 
      });
      return;
    }

    await Customer.findByIdAndDelete(id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get customer invoices
export const getCustomerInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter: any = { customer: id };
    
    if (status) filter.paymentStatus = status;
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const invoices = await Invoice.find(filter)
      .populate('createdBy', 'name email')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in getCustomerInvoices:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get customer payment history
export const getCustomerPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    // Get customer's invoices first
    const invoices = await Invoice.find({ customer: id });
    const invoiceIds = invoices.map(inv => inv._id);

    const filter: any = { invoice: { $in: invoiceIds } };
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate as string);
      if (endDate) filter.paymentDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(filter)
      .populate('invoice', 'invoiceNumber amount')
      .populate('createdBy', 'name email')
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
    console.error('Error in getCustomerPayments:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update customer payment statistics
export const updateCustomerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Update payment statistics
    await (Customer as any).updatePaymentStats(id);

    const updatedCustomer = await Customer.findById(id);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error in updateCustomerStats:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get customer analytics
export const getCustomerAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    // Get customer's invoices
    const invoiceFilter: any = { customer: id };
    if (Object.keys(dateFilter).length > 0) {
      invoiceFilter.invoiceDate = dateFilter;
    }

    const invoices = await Invoice.find(invoiceFilter);
    const invoiceIds = invoices.map(inv => inv._id);

    // Get payments for these invoices
    const payments = await Payment.find({ 
      invoice: { $in: invoiceIds },
      status: { $ne: 'rejected' }
    });

    // Calculate analytics
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    // Payment method breakdown
    const paymentMethodBreakdown = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Monthly trends
    const monthlyTrends = invoices.reduce((acc, invoice) => {
      const month = invoice.invoiceDate.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + invoice.amount;
      return acc;
    }, {} as Record<string, number>);

    // Average payment time
    let totalPaymentTime = 0;
    let paymentCount = 0;

    for (const payment of payments) {
      const invoice = invoices.find((inv: any) => inv._id.equals(payment.invoice));
      if (invoice) {
        const paymentTime = (payment.paymentDate.getTime() - invoice.invoiceDate.getTime()) / (1000 * 60 * 60 * 24);
        totalPaymentTime += paymentTime;
        paymentCount++;
      }
    }

    const averagePaymentTime = paymentCount > 0 ? totalPaymentTime / paymentCount : 0;

    res.json({
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      paymentMethodBreakdown,
      monthlyTrends,
      averagePaymentTime,
      invoiceCount: invoices.length,
      paymentCount: payments.length
    });
  } catch (error) {
    console.error('Error in getCustomerAnalytics:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Search customers for autocomplete
export const searchCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      res.json([]);
      return;
    }

    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { 'primaryContact.name': { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    })
    .select('name email phone primaryContact.name')
    .limit(10);

    res.json(customers);
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
