import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { IInvoice } from '../models/Invoice';

export interface InvoicePDFOptions {
  template?: 'standard' | 'detailed' | 'minimal';
  includeLogo?: boolean;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  };
}

export class PDFService {
  private static instance: PDFService;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  public async generateInvoicePDF(
    invoice: IInvoice, 
    options: InvoicePDFOptions = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      const html = this.generateInvoiceHTML(invoice, options);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  private generateInvoiceHTML(invoice: IInvoice, options: InvoicePDFOptions): string {
    const template = options.template || 'standard';
    const companyInfo = options.companyInfo || {
      name: 'Your Company Name',
      address: '123 Business Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'billing@company.com',
      website: 'www.company.com',
      taxId: 'TAX-123456789'
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-KW', {
        style: 'currency',
        currency: 'KWD'
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getStatusColor = (status: string) => {
      const colors = {
        draft: '#6c757d',
        pending: '#ffc107',
        paid: '#28a745',
        overdue: '#dc3545',
        cancelled: '#6c757d',
        disputed: '#fd7e14'
      };
      return colors[status as keyof typeof colors] || '#6c757d';
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #007bff;
        }
        
        .company-info h1 {
            color: #007bff;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .company-details {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
            background-color: ${getStatusColor(invoice.paymentStatus)};
        }
        
        .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .bill-to, .invoice-meta {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .customer-name {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .meta-label {
            font-weight: 600;
            color: #666;
        }
        
        .meta-value {
            color: #333;
        }
        
        .line-items {
            margin-bottom: 40px;
        }
        
        .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .line-items-table th {
            background: #007bff;
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
        }
        
        .line-items-table td {
            padding: 15px 10px;
            border-bottom: 1px solid #e9ecef;
            font-size: 14px;
        }
        
        .line-items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .line-items-table tr:hover {
            background: #e3f2fd;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }
        
        .totals-table {
            width: 300px;
        }
        
        .totals-table tr td {
            padding: 8px 15px;
            border: none;
        }
        
        .totals-table tr:last-child {
            border-top: 2px solid #007bff;
            font-weight: bold;
            font-size: 16px;
        }
        
        .totals-table tr:last-child td {
            padding-top: 15px;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        .payment-terms {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .payment-terms h4 {
            color: #856404;
            margin-bottom: 10px;
        }
        
        .notes {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin-top: 20px;
        }
        
        .notes h4 {
            color: #333;
            margin-bottom: 10px;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .invoice-container { max-width: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>${companyInfo.name}</h1>
                <div class="company-details">
                    <div>${companyInfo.address}</div>
                    <div>Phone: ${companyInfo.phone}</div>
                    <div>Email: ${companyInfo.email}</div>
                    ${companyInfo.website ? `<div>Website: ${companyInfo.website}</div>` : ''}
                    ${companyInfo.taxId ? `<div>Tax ID: ${companyInfo.taxId}</div>` : ''}
                </div>
            </div>
            <div class="invoice-details">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#${invoice.invoiceNumber}</div>
                <div class="status-badge">${invoice.paymentStatus}</div>
            </div>
        </div>

        <!-- Invoice Information -->
        <div class="invoice-info">
            <div class="bill-to">
                <div class="section-title">Bill To</div>
                <div class="customer-name">${invoice.customerName || 'N/A'}</div>
                <div>${invoice.customerReference || 'N/A'}</div>
            </div>
            <div class="invoice-meta">
                <div class="section-title">Invoice Details</div>
                <div class="meta-row">
                    <span class="meta-label">Invoice Date:</span>
                    <span class="meta-value">${formatDate(invoice.invoiceDate)}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Due Date:</span>
                    <span class="meta-value">${formatDate(invoice.dueDate)}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Currency:</span>
                    <span class="meta-value">${invoice.currency}</span>
                </div>
                ${invoice.contractNumber ? `
                <div class="meta-row">
                    <span class="meta-label">Contract #:</span>
                    <span class="meta-value">${invoice.contractNumber}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Payment Terms -->
        <div class="payment-terms">
            <h4>Payment Terms</h4>
            <p>Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.</p>
        </div>

        <!-- Line Items -->
        <div class="line-items">
            <div class="section-title">Line Items</div>
            <table class="line-items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.lineItems?.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                            <td class="text-right">${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" class="text-center">No line items</td></tr>'}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">${formatCurrency(invoice.netAmount)}</td>
                </tr>
                <tr>
                    <td>Tax (${invoice.taxRate}%):</td>
                    <td class="text-right">${formatCurrency(invoice.taxAmount)}</td>
                </tr>
                <tr>
                    <td>Total Amount:</td>
                    <td class="text-right">${formatCurrency(invoice.amount)}</td>
                </tr>
            </table>
        </div>

        <!-- Notes -->
        ${invoice.ifrsNotes ? `
        <div class="notes">
            <h4>Notes</h4>
            <p>${invoice.ifrsNotes}</p>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business! If you have any questions about this invoice, please contact us.</p>
            <p>Generated on ${formatDate(new Date())} | Invoice #${invoice.invoiceNumber}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  public async generateInvoiceTemplate(templateId: string): Promise<string> {
    // This would generate different template variations
    const templates = {
      standard: 'Standard template with company branding',
      detailed: 'Detailed template with more information',
      minimal: 'Minimal template for simple invoices'
    };
    
    return templates[templateId as keyof typeof templates] || templates.standard;
  }

  public async emailInvoice(
    invoiceId: string, 
    recipientEmail: string, 
    pdfBuffer: Buffer
  ): Promise<void> {
    // This would integrate with your email service
    // For now, we'll just log the action
    console.log(`Emailing invoice ${invoiceId} to ${recipientEmail}`);
    console.log(`PDF size: ${pdfBuffer.length} bytes`);
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default PDFService;
