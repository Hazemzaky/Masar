import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Customer from '../models/Customer';
import mongoose from 'mongoose';

// Get comprehensive invoice analytics
export const getInvoiceAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    const invoiceFilter: any = {};
    if (Object.keys(dateFilter).length > 0) {
      invoiceFilter.invoiceDate = dateFilter;
    }

    // Total revenue and invoice counts
    const totalStats = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
          averageInvoiceAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Revenue by status
    const revenueByStatus = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Monthly revenue trends
    const monthlyTrends = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top customers by revenue
    const topCustomers = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$amount' },
          invoiceCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          customerName: '$customer.name',
          totalRevenue: 1,
          invoiceCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Payment method breakdown
    const paymentMethods = await Payment.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice'
        }
      },
      { $unwind: '$invoice' },
      { $match: { 'invoice.invoiceDate': dateFilter } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Aging analysis
    const now = new Date();
    const agingAnalysis = await Invoice.aggregate([
      { $match: { paymentStatus: { $in: ['pending', 'overdue'] } } },
      {
        $project: {
          amount: 1,
          dueDate: 1,
          daysOverdue: {
            $divide: [
              { $subtract: [now, '$dueDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$daysOverdue', 0] }, then: 'current' },
                { case: { $lte: ['$daysOverdue', 30] }, then: '1-30' },
                { case: { $lte: ['$daysOverdue', 60] }, then: '31-60' },
                { case: { $lte: ['$daysOverdue', 90] }, then: '61-90' },
                { case: { $gt: ['$daysOverdue', 90] }, then: '90+' }
              ],
              default: 'current'
            }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      totalStats: totalStats[0] || { totalRevenue: 0, totalInvoices: 0, averageInvoiceAmount: 0 },
      revenueByStatus,
      monthlyTrends,
      topCustomers,
      paymentMethods,
      agingAnalysis
    });
  } catch (error) {
    console.error('Error in getInvoiceAnalytics:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get payment analytics
export const getPaymentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    const filter: any = {};
    if (Object.keys(dateFilter).length > 0) {
      filter.paymentDate = dateFilter;
    }

    // Payment statistics
    const paymentStats = await Payment.aggregate([
      { $match: { ...filter, status: { $ne: 'rejected' } } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averagePayment: { $avg: '$amount' }
        }
      }
    ]);

    // Payment trends by month
    const monthlyPaymentTrends = await Payment.aggregate([
      { $match: { ...filter, status: { $ne: 'rejected' } } },
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

    // Payment method analysis
    const paymentMethodAnalysis = await Payment.aggregate([
      { $match: { ...filter, status: { $ne: 'rejected' } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Payment status analysis
    const paymentStatusAnalysis = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      paymentStats: paymentStats[0] || { totalPayments: 0, totalAmount: 0, averagePayment: 0 },
      monthlyPaymentTrends,
      paymentMethodAnalysis,
      paymentStatusAnalysis
    });
  } catch (error) {
    console.error('Error in getPaymentAnalytics:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get customer analytics
export const getCustomerAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    // Customer statistics
    const customerStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalCreditLimit: { $sum: '$creditLimit' },
          totalOutstanding: { $sum: '$outstandingBalance' }
        }
      }
    ]);

    // Customer status distribution
    const statusDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Business type distribution
    const businessTypeDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$businessType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalInvoiced' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Top customers by outstanding balance
    const topOutstandingCustomers = await Customer.find({
      outstandingBalance: { $gt: 0 }
    })
    .select('name outstandingBalance creditLimit status')
    .sort({ outstandingBalance: -1 })
    .limit(10);

    // Customer payment performance
    const paymentPerformance = await Customer.aggregate([
      {
        $project: {
          name: 1,
          averagePaymentTime: 1,
          totalInvoiced: 1,
          totalPaid: 1,
          paymentRate: {
            $cond: [
              { $gt: ['$totalInvoiced', 0] },
              { $multiply: [{ $divide: ['$totalPaid', '$totalInvoiced'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { paymentRate: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      customerStats: customerStats[0] || { 
        totalCustomers: 0, 
        activeCustomers: 0, 
        totalCreditLimit: 0, 
        totalOutstanding: 0 
      },
      statusDistribution,
      businessTypeDistribution,
      topOutstandingCustomers,
      paymentPerformance
    });
  } catch (error) {
    console.error('Error in getCustomerAnalytics:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get comprehensive dashboard data
export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    // Get all analytics in parallel
    const [
      invoiceAnalytics,
      paymentAnalytics,
      customerAnalytics
    ] = await Promise.all([
      getInvoiceAnalyticsData(dateFilter),
      getPaymentAnalyticsData(dateFilter),
      getCustomerAnalyticsData()
    ]);

    res.json({
      invoices: invoiceAnalytics,
      payments: paymentAnalytics,
      customers: customerAnalytics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Helper functions
async function getInvoiceAnalyticsData(dateFilter: any) {
  const invoiceFilter: any = {};
  if (Object.keys(dateFilter).length > 0) {
    invoiceFilter.invoiceDate = dateFilter;
  }

  const totalStats = await Invoice.aggregate([
    { $match: invoiceFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalInvoices: { $sum: 1 },
        averageInvoiceAmount: { $avg: '$amount' }
      }
    }
  ]);

  const revenueByStatus = await Invoice.aggregate([
    { $match: invoiceFilter },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  return {
    totalStats: totalStats[0] || { totalRevenue: 0, totalInvoices: 0, averageInvoiceAmount: 0 },
    revenueByStatus
  };
}

async function getPaymentAnalyticsData(dateFilter: any) {
  const filter: any = {};
  if (Object.keys(dateFilter).length > 0) {
    filter.paymentDate = dateFilter;
  }

  const paymentStats = await Payment.aggregate([
    { $match: { ...filter, status: { $ne: 'rejected' } } },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averagePayment: { $avg: '$amount' }
      }
    }
  ]);

  return {
    paymentStats: paymentStats[0] || { totalPayments: 0, totalAmount: 0, averagePayment: 0 }
  };
}

async function getCustomerAnalyticsData() {
  const customerStats = await Customer.aggregate([
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalOutstanding: { $sum: '$outstandingBalance' }
      }
    }
  ]);

  return {
    customerStats: customerStats[0] || { 
      totalCustomers: 0, 
      activeCustomers: 0, 
      totalOutstanding: 0 
    }
  };
}
