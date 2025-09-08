import { Request, Response } from 'express';
import PurchaseRequest from '../models/PurchaseRequest';
import BusinessTrip from '../models/BusinessTrip';
import Leave from '../models/Leave';
import Reimbursement from '../models/Reimbursement';
import Payroll from '../models/Payroll';
import Asset from '../models/Asset';
import Maintenance from '../models/Maintenance';
import Training from '../models/Training';
import RiskAssessment from '../models/RiskAssessment';
import TravelAuthorization from '../models/TravelAuthorization';
import TravelRequest from '../models/TravelRequest';
import GovernmentDocument from '../models/GovernmentDocument';
import CompanyFacility from '../models/CompanyFacility';
import LegalCase from '../models/LegalCase';
import GovernmentCorrespondence from '../models/GovernmentCorrespondence';
import Environmental from '../models/Environmental';
import Client from '../models/Client';
import Invoice from '../models/Invoice';
import Expense from '../models/Expense';
import ProcurementInvoice from '../models/ProcurementInvoice';
import GoodsReceipt from '../models/GoodsReceipt';

interface PendingRequestItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requestedBy: string;
  department: string;
  requestDate: string;
  requiredDate?: string;
  amount?: number;
  source: string;
  sourcePage: string;
  actions: string[];
}

export const getAllPendingRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingRequests: PendingRequestItem[] = [];

    // 1. Procurement - Purchase Requests
    const purchaseRequests = await PurchaseRequest.find({ 
      status: { $in: ['pending', 'sent_to_procurement'] } 
    }).populate('requester', 'name email');
    
    purchaseRequests.forEach(pr => {
      pendingRequests.push({
        id: pr._id.toString(),
        type: 'Purchase Request',
        title: `PR-${pr.requestNumber}`,
        description: pr.description || 'Purchase Request',
        status: pr.status,
        priority: pr.priority,
        requestedBy: typeof pr.requester === 'object' ? pr.requester.name : pr.requester || 'Unknown',
        department: pr.department,
        requestDate: pr.createdAt.toISOString(),
        requiredDate: pr.requiredDate?.toISOString(),
        amount: pr.totalAmount,
        source: 'procurement',
        sourcePage: 'Procurement',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 2. Business Trips
    const businessTrips = await BusinessTrip.find({ 
      status: { $in: ['Under Review', 'Pending'] } 
    });
    
    businessTrips.forEach(trip => {
      pendingRequests.push({
        id: trip._id.toString(),
        type: 'Business Trip',
        title: `Trip to ${trip.destination}`,
        description: `Business trip from ${trip.departureDate} to ${trip.returnDate}`,
        status: trip.status,
        priority: trip.priority || 'medium',
        requestedBy: trip.employeeName || 'Unknown',
        department: trip.department || 'Unknown',
        requestDate: trip.createdAt.toISOString(),
        requiredDate: trip.departureDate,
        amount: trip.cost,
        source: 'business-trips',
        sourcePage: 'Business Trips',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 3. Leave Requests
    const leaveRequests = await Leave.find({ 
      status: 'pending' 
    });
    
    leaveRequests.forEach(leave => {
      pendingRequests.push({
        id: leave._id.toString(),
        type: 'Leave Request',
        title: `${leave.days} days leave`,
        description: `Leave request for ${leave.days} days`,
        status: leave.status,
        priority: 'medium',
        requestedBy: leave.employeeName || 'Unknown',
        department: 'HR',
        requestDate: leave.requestedAt.toISOString(),
        amount: leave.cost,
        source: 'leave',
        sourcePage: 'Leave Management',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 4. Reimbursements
    const reimbursements = await Reimbursement.find({ 
      status: 'pending' 
    });
    
    reimbursements.forEach(reimb => {
      pendingRequests.push({
        id: reimb._id.toString(),
        type: 'Reimbursement',
        title: `Reimbursement - ${reimb.description}`,
        description: reimb.description,
        status: reimb.status,
        priority: 'medium',
        requestedBy: reimb.employeeName || 'Unknown',
        department: 'Finance',
        requestDate: reimb.createdAt.toISOString(),
        amount: reimb.amount,
        source: 'reimbursements',
        sourcePage: 'Reimbursements',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 5. Payroll Processing
    const payrollPending = await Payroll.find({ 
      status: 'pending' 
    });
    
    payrollPending.forEach(payroll => {
      pendingRequests.push({
        id: payroll._id.toString(),
        type: 'Payroll Processing',
        title: `Payroll Run - ${payroll.runDate.toISOString().split('T')[0]}`,
        description: `Payroll processing for ${payroll.employeeName}`,
        status: payroll.status,
        priority: 'high',
        requestedBy: 'System',
        department: 'HR',
        requestDate: payroll.runDate.toISOString(),
        amount: payroll.netPay,
        source: 'payroll',
        sourcePage: 'Payroll',
        actions: ['process', 'view']
      });
    });

    // 6. Asset Management
    const assetPending = await Asset.find({ 
      status: 'pending' 
    });
    
    assetPending.forEach(asset => {
      pendingRequests.push({
        id: asset._id.toString(),
        type: 'Asset Approval',
        title: `Asset - ${asset.description}`,
        description: `Asset approval for ${asset.description}`,
        status: asset.status,
        priority: 'medium',
        requestedBy: asset.requestedBy || 'Unknown',
        department: 'Assets',
        requestDate: asset.createdAt.toISOString(),
        amount: asset.purchasePrice,
        source: 'assets',
        sourcePage: 'Asset Management',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 7. Maintenance Requests
    const maintenancePending = await Maintenance.find({ 
      status: { $in: ['pending', 'scheduled'] } 
    });
    
    maintenancePending.forEach(maintenance => {
      pendingRequests.push({
        id: maintenance._id.toString(),
        type: 'Maintenance Request',
        title: `Maintenance - ${maintenance.description}`,
        description: maintenance.description,
        status: maintenance.status,
        priority: maintenance.priority || 'medium',
        requestedBy: maintenance.requestedBy || 'Unknown',
        department: 'Maintenance',
        requestDate: maintenance.createdAt.toISOString(),
        requiredDate: maintenance.scheduledDate?.toISOString(),
        amount: maintenance.cost,
        source: 'maintenance',
        sourcePage: 'Maintenance',
        actions: ['approve', 'schedule', 'view']
      });
    });

    // 8. Training Certificates
    const trainingPending = await Training.find({ 
      'certificates.status': 'pending_renewal' 
    });
    
    trainingPending.forEach(training => {
      training.certificates?.forEach((cert: any) => {
        if (cert.status === 'pending_renewal') {
          pendingRequests.push({
            id: `${training._id}-${cert.certificateNumber}`,
            type: 'Certificate Renewal',
            title: `Certificate Renewal - ${cert.certificateNumber}`,
            description: `Certificate renewal for ${training.employeeName}`,
            status: cert.status,
            priority: 'high',
            requestedBy: training.employeeName || 'Unknown',
            department: 'HSE',
            requestDate: training.createdAt.toISOString(),
            requiredDate: cert.expiryDate,
            source: 'hse',
            sourcePage: 'HSE Training',
            actions: ['renew', 'view']
          });
        }
      });
    });

    // 9. Risk Assessments
    const riskPending = await RiskAssessment.find({ 
      status: { $in: ['pending', 'in_progress'] } 
    });
    
    riskPending.forEach(risk => {
      pendingRequests.push({
        id: risk._id.toString(),
        type: 'Risk Assessment',
        title: `Risk Assessment - ${risk.title}`,
        description: risk.description,
        status: risk.status,
        priority: risk.overallRiskLevel === 'critical' ? 'urgent' : 'high',
        requestedBy: risk.responsiblePerson || 'Unknown',
        department: 'HSE',
        requestDate: risk.createdAt.toISOString(),
        requiredDate: risk.targetDate?.toISOString(),
        source: 'hse',
        sourcePage: 'HSE Risk Assessment',
        actions: ['review', 'complete', 'view']
      });
    });

    // 10. Travel Authorizations
    const travelAuthPending = await TravelAuthorization.find({ 
      status: { $in: ['pending', 'in_progress'] } 
    });
    
    travelAuthPending.forEach(auth => {
      pendingRequests.push({
        id: auth._id.toString(),
        type: 'Travel Authorization',
        title: `Travel Auth - ${auth.destination}`,
        description: `Travel authorization for ${auth.destination}`,
        status: auth.status,
        priority: 'medium',
        requestedBy: auth.employeeName || 'Unknown',
        department: 'Admin',
        requestDate: auth.createdAt.toISOString(),
        requiredDate: auth.departureDate?.toISOString(),
        source: 'admin',
        sourcePage: 'Admin Travel',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 11. Government Documents
    const govDocPending = await GovernmentDocument.find({ 
      status: 'pending_renewal' 
    });
    
    govDocPending.forEach(doc => {
      pendingRequests.push({
        id: doc._id.toString(),
        type: 'Document Renewal',
        title: `Document Renewal - ${doc.documentType}`,
        description: `Document renewal for ${doc.documentType}`,
        status: doc.status,
        priority: 'high',
        requestedBy: doc.employeeName || 'Unknown',
        department: 'Admin',
        requestDate: doc.createdAt.toISOString(),
        requiredDate: doc.expiryDate?.toISOString(),
        source: 'admin',
        sourcePage: 'Admin Documents',
        actions: ['renew', 'view']
      });
    });

    // 12. Legal Cases
    const legalPending = await LegalCase.find({ 
      status: { $in: ['open', 'pending'] } 
    });
    
    legalPending.forEach(legal => {
      pendingRequests.push({
        id: legal._id.toString(),
        type: 'Legal Case',
        title: `Legal Case - ${legal.caseNumber}`,
        description: legal.description,
        status: legal.status,
        priority: legal.priority,
        requestedBy: legal.lawyerName || 'Unknown',
        department: 'Legal',
        requestDate: legal.filingDate.toISOString(),
        amount: legal.estimatedCost,
        source: 'admin',
        sourcePage: 'Admin Legal',
        actions: ['review', 'update', 'view']
      });
    });

    // 13. Sales Quotations
    const salesPending = await Client.find({ 
      type: 'quotation',
      'quotationData.approvalStatus': 'pending' 
    });
    
    salesPending.forEach(client => {
      pendingRequests.push({
        id: client._id.toString(),
        type: 'Sales Quotation',
        title: `Quotation - ${client.name}`,
        description: `Quotation approval for ${client.name}`,
        status: client.quotationData?.approvalStatus || 'pending',
        priority: 'medium',
        requestedBy: 'Sales Team',
        department: 'Sales',
        requestDate: client.createdAt.toISOString(),
        source: 'sales',
        sourcePage: 'Sales',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 14. Invoices
    const invoicePending = await Invoice.find({ 
      status: 'pending_approval' 
    });
    
    invoicePending.forEach(invoice => {
      pendingRequests.push({
        id: invoice._id.toString(),
        type: 'Invoice Approval',
        title: `Invoice - ${invoice.invoiceNumber}`,
        description: `Invoice approval for ${invoice.clientName}`,
        status: invoice.status,
        priority: 'medium',
        requestedBy: 'Finance Team',
        department: 'Finance',
        requestDate: invoice.createdAt.toISOString(),
        amount: invoice.amount,
        source: 'invoices',
        sourcePage: 'Invoices',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 15. Expenses
    const expensePending = await Expense.find({ 
      status: 'pending_approval' 
    });
    
    expensePending.forEach(expense => {
      pendingRequests.push({
        id: expense._id.toString(),
        type: 'Expense Approval',
        title: `Expense - ${expense.description}`,
        description: expense.description,
        status: expense.status,
        priority: 'medium',
        requestedBy: 'Finance Team',
        department: 'Finance',
        requestDate: expense.createdAt.toISOString(),
        amount: expense.amount,
        source: 'expenses',
        sourcePage: 'Expenses',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 16. Procurement Invoices
    const procInvoicePending = await ProcurementInvoice.find({ 
      status: 'pending' 
    });
    
    procInvoicePending.forEach(invoice => {
      pendingRequests.push({
        id: invoice._id.toString(),
        type: 'Procurement Invoice',
        title: `Proc Invoice - ${invoice.serial}`,
        description: `Procurement invoice approval`,
        status: invoice.status,
        priority: 'medium',
        requestedBy: 'Procurement Team',
        department: 'Procurement',
        requestDate: invoice.createdAt.toISOString(),
        amount: invoice.amount,
        source: 'procurement',
        sourcePage: 'Procurement',
        actions: ['approve', 'reject', 'view']
      });
    });

    // 17. Goods Receipt Notes
    const grnPending = await GoodsReceipt.find({ 
      status: 'pending' 
    });
    
    grnPending.forEach(grn => {
      pendingRequests.push({
        id: grn._id.toString(),
        type: 'Goods Receipt',
        title: `GRN - ${grn.grnNumber}`,
        description: `Goods receipt approval`,
        status: grn.status,
        priority: 'medium',
        requestedBy: 'Warehouse Team',
        department: 'Procurement',
        requestDate: grn.createdAt.toISOString(),
        source: 'procurement',
        sourcePage: 'Procurement',
        actions: ['approve', 'reject', 'view']
      });
    });

    // Sort by priority and date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    pendingRequests.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });

    // Calculate statistics
    const stats = {
      total: pendingRequests.length,
      byType: pendingRequests.reduce((acc, req) => {
        acc[req.type] = (acc[req.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: pendingRequests.reduce((acc, req) => {
        acc[req.priority] = (acc[req.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySource: pendingRequests.reduce((acc, req) => {
        acc[req.source] = (acc[req.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: pendingRequests.reduce((sum, req) => sum + (req.amount || 0), 0)
    };

    res.json({
      success: true,
      data: pendingRequests,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending requests', 
      error: error.message 
    });
  }
};
