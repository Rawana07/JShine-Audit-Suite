import { jsPDF } from 'jspdf';
import { ClientInvoice, VendorBill, AuditorSettlement } from '../types/erp';
import { formatINR, formatDateIndian } from './rules';

/**
 * Professional PDF Generation Service for JaySoftShine ERP
 * Creates vectorized, print-ready, GST and statutory compliant PDFs
 */

// Helper to sanitize filename
const sanitizeFilename = (name: string): string => {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
};

/**
 * 1. Export Official GST Tax Invoice to PDF
 */
export const exportInvoiceToPdf = (invoice: ClientInvoice): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 68, 'F');

  // Brand Logo Block
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 12, y + 12, 44, 44, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('JS', margin + 25, y + 40);

  // Brand Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JAYSOFTSHINE', margin + 68, y + 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Audit & Operations Outsourcing Division • Single Org: JaySoftShine', margin + 68, y + 42);
  doc.text('Regd Office: Corporate Office, C-Scheme, Jaipur, Rajasthan - 302001', margin + 68, y + 54);

  // Document Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - margin - 12, y + 32, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('(Rule 46 of CGST Rules, 2017)', pageWidth - margin - 12, y + 46, { align: 'right' });
  doc.text('Original for Recipient', pageWidth - margin - 12, y + 58, { align: 'right' });

  y += 78;

  // GST Registration Details Bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('GSTIN: 08BKDPV7945P1Z2', margin + 8, y + 14);
  doc.text('PAN: BKDPV7945P', margin + 170, y + 14);
  doc.text('State: Rajasthan (Code: 08)', margin + 300, y + 14);
  doc.text('Reverse Charge: No', pageWidth - margin - 8, y + 14, { align: 'right' });

  y += 30;

  // Metadata & Client Information Card
  const boxHeight = 88;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

  // Left side: Billed To (Client)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('BILLED TO (RECIPIENT):', margin + 10, y + 16);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.clientName, margin + 10, y + 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const splitAddress = doc.splitTextToSize(invoice.billingAddress, 250);
  doc.text(splitAddress, margin + 10, y + 44);

  const clientGstY = y + 44 + Math.min(splitAddress.length * 10, 24);
  doc.setFont('helvetica', 'bold');
  doc.text(`Client GSTIN: ${invoice.clientGstin}`, margin + 10, clientGstY);

  // Vertical divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 280, y, margin + 280, y + boxHeight);

  // Right side: Invoice Attributes
  const rightX = margin + 295;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE DETAILS:', rightX, y + 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Invoice Number:', rightX, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoiceNumber, pageWidth - margin - 10, y + 30, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Date:', rightX, y + 44);
  doc.text(formatDateIndian(invoice.invoiceDate), pageWidth - margin - 10, y + 44, { align: 'right' });

  doc.text('Payment Due Date:', rightX, y + 58);
  doc.text(formatDateIndian(invoice.dueDate), pageWidth - margin - 10, y + 58, { align: 'right' });

  doc.text('Place of Supply:', rightX, y + 72);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.stateCode || 'Maharashtra (27)', pageWidth - margin - 10, y + 72, { align: 'right' });

  y += boxHeight + 14;

  // Project Info Line
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Project Reference: ${invoice.projectName}`, margin + 10, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Terms: 30 Days Net`, pageWidth - margin - 10, y + 13, { align: 'right' });

  y += 26;

  // Table Header
  const colX = {
    sr: margin + 8,
    desc: margin + 32,
    sac: margin + 245,
    qty: margin + 320,
    rate: margin + 390,
    amt: pageWidth - margin - 8,
  };

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('#', colX.sr, y + 14);
  doc.text('Service Description', colX.desc, y + 14);
  doc.text('SAC Code', colX.sac, y + 14);
  doc.text('Mandays', colX.qty, y + 14, { align: 'right' });
  doc.text('Rate (INR)', colX.rate, y + 14, { align: 'right' });
  doc.text('Taxable Amount', colX.amt, y + 14, { align: 'right' });

  y += 22;

  // Table Items
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  invoice.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, contentWidth, 24, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 24, margin + contentWidth, y + 24);

    doc.setFont('helvetica', 'normal');
    doc.text(String(index + 1), colX.sr, y + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.text(item.description, colX.desc, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.text(item.hsnSac, colX.sac, y + 15);
    doc.text(String(item.quantity), colX.qty, y + 15, { align: 'right' });
    doc.text(formatINR(item.rate), colX.rate, y + 15, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatINR(item.amount), colX.amt, y + 15, { align: 'right' });

    y += 24;
  });

  // Table bottom border
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  // Tax Breakdown & Totals Box
  const summaryBoxWidth = 230;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryBoxWidth, 90, 4, 4, 'FD');

  let sumY = y + 16;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Taxable Value:', summaryX + 10, sumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(invoice.taxableAmount), summaryX + summaryBoxWidth - 10, sumY, { align: 'right' });

  if (!invoice.isInterState) {
    sumY += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('CGST (9.0%):', summaryX + 10, sumY);
    doc.text(formatINR(invoice.cgstAmount), summaryX + summaryBoxWidth - 10, sumY, { align: 'right' });

    sumY += 16;
    doc.text('SGST (9.0%):', summaryX + 10, sumY);
    doc.text(formatINR(invoice.sgstAmount), summaryX + summaryBoxWidth - 10, sumY, { align: 'right' });
  } else {
    sumY += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('IGST (18.0%):', summaryX + 10, sumY);
    doc.text(formatINR(invoice.igstAmount), summaryX + summaryBoxWidth - 10, sumY, { align: 'right' });
  }

  // Divider
  sumY += 10;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 10, sumY, summaryX + summaryBoxWidth - 10, sumY);
  sumY += 16;

  // Final Total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL INVOICE (INR):', summaryX + 10, sumY);
  doc.text(formatINR(invoice.totalAmount), summaryX + summaryBoxWidth - 10, sumY, { align: 'right' });

  // Bank Account & Remittance Advice (Left of summary)
  const bankWidth = summaryX - margin - 15;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, bankWidth, 90, 4, 4, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Company Bank Details for Electronic Remittance:', margin + 10, y + 16);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Beneficiary Name: JaySoftShine', margin + 10, y + 30);
  doc.text('Bank Name: HDFC Bank Ltd', margin + 10, y + 42);
  doc.text('Current Account No: 50200088991122', margin + 10, y + 54);
  doc.text('IFSC Code: HDFC0000123 • Branch: Jaipur Main Branch', margin + 10, y + 66);
  doc.text('Payment Ref: Please quote Invoice Number in NEFT/RTGS narration', margin + 10, y + 78);

  y += 105;

  // Terms & Conditions and Authorized Signatory
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  y += 12;

  // Declaration
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Declaration: We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.', margin, y + 10);
  doc.text('Subject to Rajasthan Jurisdiction only. Electronic document issued under Information Technology Act, 2000.', margin, y + 20);

  // Signatory on Right
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('For JaySoftShine', pageWidth - margin - 10, y + 15, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory / Managing Partner', pageWidth - margin - 10, y + 55, { align: 'right' });

  // Save the PDF
  const filename = `${sanitizeFilename(invoice.invoiceNumber)}_Tax_Invoice.pdf`;
  doc.save(filename);
};

/**
 * 2. Export Vendor Bill & Outsourcing Advice to PDF
 */
export const exportVendorBillToPdf = (bill: VendorBill): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 68, 'F');

  // Brand Icon
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 12, y + 12, 44, 44, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('JS', margin + 25, y + 40);

  // Brand Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JAYSOFTSHINE', margin + 68, y + 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Vendor Payables & Outsourced Verification Accounting', margin + 68, y + 42);
  doc.text('Commercial Separation & Section 194C TDS Compliance System', margin + 68, y + 54);

  // Right Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('VENDOR BILL VOUCHER', pageWidth - margin - 12, y + 32, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Official Accounts Record', pageWidth - margin - 12, y + 46, { align: 'right' });
  doc.text(`Status: ${bill.paymentStatus.toUpperCase()}`, pageWidth - margin - 12, y + 58, { align: 'right' });

  y += 78;

  // Metadata Box
  const boxHeight = 76;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('VENDOR PARTNER DETAILS:', margin + 12, y + 16);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(bill.vendorName, margin + 12, y + 32);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Vendor ID: ${bill.vendorId}`, margin + 12, y + 46);
  doc.text(`Project Assigned: ${bill.projectName}`, margin + 12, y + 58);

  // Right side of box
  const rightX = margin + 300;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILL & AUDIT PARTICULARS:', rightX, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Vendor Bill No:', rightX, y + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(bill.billNumber, pageWidth - margin - 12, y + 32, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Bill Date:', rightX, y + 46);
  doc.text(formatDateIndian(bill.billDate), pageWidth - margin - 12, y + 46, { align: 'right' });

  doc.text('Execution Model:', rightX, y + 58);
  doc.setFont('helvetica', 'bold');
  doc.text('Outsourced Vendor Package', pageWidth - margin - 12, y + 58, { align: 'right' });

  y += boxHeight + 16;

  // Breakdown Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Financial & Manday Breakdown', margin + 12, y + 14);
  doc.text('Basis / Formula', margin + 260, y + 14);
  doc.text('Amount (INR)', pageWidth - margin - 12, y + 14, { align: 'right' });

  y += 22;

  // Breakdown Rows
  const items = [
    {
      label: 'Approved Physical Verification Mandays',
      desc: `${bill.approvedMandays} Days @ ${formatINR(bill.agreedRate)} / day`,
      amt: formatINR(bill.taxableAmount),
      isBold: false,
    },
    {
      label: 'GST Input Tax Credit (18%)',
      desc: 'Eligible ITC claimed on vendor tax invoice',
      amt: `+ ${formatINR(bill.gstAmount)}`,
      isBold: false,
    },
    {
      label: `Section 194C TDS Withheld (${bill.tdsRatePercent}%)`,
      desc: 'Statutory tax withheld for 26Q return filing',
      amt: `- ${formatINR(bill.tdsDeduction)}`,
      isBold: false,
      isTds: true,
    },
    {
      label: 'Prior Advance Adjusted',
      desc: 'Set off against mobilization advance',
      amt: `- ${formatINR(bill.advanceAdjusted)}`,
      isBold: false,
    },
    {
      label: 'NET PAYABLE AMOUNT',
      desc: 'Taxable + GST - TDS - Advance',
      amt: formatINR(bill.netPayable),
      isBold: true,
      highlight: true,
    },
    {
      label: 'Disbursed / Settled Amount',
      desc: 'Bank NEFT/RTGS transaction record',
      amt: formatINR(bill.paidAmount),
      isBold: false,
    },
    {
      label: 'OUTSTANDING BALANCE',
      desc: bill.outstanding > 0 ? 'Pending payout settlement' : 'Fully Paid & Cleared',
      amt: formatINR(bill.outstanding),
      isBold: true,
      highlight: bill.outstanding > 0,
    },
  ];

  items.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(row.highlight ? 241 : (isEven ? 255 : 248), row.highlight ? 245 : (isEven ? 255 : 250), row.highlight ? 249 : (isEven ? 255 : 252));
    doc.rect(margin, y, contentWidth, 24, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 24, margin + contentWidth, y + 24);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    doc.setTextColor(row.isTds ? 30 : 15, row.isTds ? 64 : 23, row.isTds ? 175 : 42);
    doc.text(row.label, margin + 12, y + 16);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row.desc, margin + 260, y + 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(row.isTds ? 30 : 15, row.isTds ? 64 : 23, row.isTds ? 175 : 42);
    doc.text(row.amt, pageWidth - margin - 12, y + 16, { align: 'right' });

    y += 24;
  });

  y += 20;

  // Statutory & Compliance Note
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 48, 4, 4, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Compliance & Internal Financial Controls (IFC) Verification:', margin + 10, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('• Approved mandays matched against verified GPS check-ins and field audit stock verification summary sheets.', margin + 10, y + 26);
  doc.text('• Confidentiality Notice: Client billing rates and margin spreads are strictly confidential and excluded from partner view.', margin + 10, y + 38);

  y += 68;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + 160, y);
  doc.line(pageWidth - margin - 160, y, pageWidth - margin, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Accounts & Tax Auditor', margin, y + 14);
  doc.text('Authorized Signatory (JaySoftShine)', pageWidth - margin, y + 14, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TDS 194C Verified', margin, y + 24);
  doc.text('Payable Approved for Disbursement', pageWidth - margin, y + 24, { align: 'right' });

  const filename = `${sanitizeFilename(bill.billNumber)}_Vendor_Bill.pdf`;
  doc.save(filename);
};

/**
 * 3. Export Auditor Remuneration & Settlement Voucher to PDF
 */
export const exportAuditorSettlementToPdf = (settlement: AuditorSettlement): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 68, 'F');

  // Brand Icon
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 12, y + 12, 44, 44, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('JS', margin + 25, y + 40);

  // Brand Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JAYSOFTSHINE', margin + 68, y + 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Field Operations & Direct Auditor Remuneration Wing', margin + 68, y + 42);
  doc.text('Site Verification, Travel Allowance (TA), Daily Allowance (DA) Settlements', margin + 68, y + 54);

  // Right Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('AUDITOR SETTLEMENT VOUCHER', pageWidth - margin - 12, y + 32, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Voucher: ${settlement.settlementNumber}`, pageWidth - margin - 12, y + 46, { align: 'right' });
  doc.text(`Status: ${(settlement.status || 'PAID').toUpperCase()}`, pageWidth - margin - 12, y + 58, { align: 'right' });

  y += 78;

  // Auditor & Project Profile Card
  const boxHeight = 76;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFIED FIELD AUDITOR:', margin + 12, y + 16);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(settlement.auditorName, margin + 12, y + 32);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Auditor ID: ${settlement.auditorId}`, margin + 12, y + 46);
  doc.text(`Disbursement Date: ${formatDateIndian(settlement.createdAt)}`, margin + 12, y + 58);

  // Right side of box
  const rightX = margin + 280;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PROJECT & BANK REMITTANCE:', rightX, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Assigned Project:', rightX, y + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const splitProj = doc.splitTextToSize(settlement.projectName, 180);
  doc.text(splitProj[0] || settlement.projectName, pageWidth - margin - 12, y + 32, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Transfer Ref / UTR:', rightX, y + 46);
  doc.setFont('helvetica', 'bold');
  doc.text(settlement.paymentRef || 'Direct Bank/UPI Transfer', pageWidth - margin - 12, y + 46, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Execution Channel:', rightX, y + 58);
  doc.text('Direct Field Auditor', pageWidth - margin - 12, y + 58, { align: 'right' });

  y += boxHeight + 16;

  // Remuneration Breakdown Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Remuneration & Allowance Component', margin + 12, y + 14);
  doc.text('Rate / Details', margin + 270, y + 14);
  doc.text('Amount (INR)', pageWidth - margin - 12, y + 14, { align: 'right' });

  y += 22;

  // Breakdown Rows
  const items = [
    {
      label: 'Audit Manday Remuneration Fee',
      desc: `${settlement.approvedMandays} Days @ ${formatINR(settlement.dailyRate)} / day`,
      amt: formatINR(settlement.mandayPayable),
      isBold: true,
    },
    {
      label: 'Site Travel Allowance (TA)',
      desc: 'Local transport & inter-city site conveyance',
      amt: formatINR(settlement.travelAllowance),
      isBold: false,
    },
    {
      label: 'Daily Food & Subsistence Allowance (DA)',
      desc: 'Per-diem food reimbursement',
      amt: formatINR(settlement.foodAllowance),
      isBold: false,
    },
    {
      label: 'Hotel & Lodging Allowance',
      desc: 'Outstation overnight lodging',
      amt: formatINR(settlement.hotelAllowance),
      isBold: false,
    },
    {
      label: 'Other Incidental Field Expenses',
      desc: 'Printing, toll, stationary or local helpers',
      amt: formatINR(settlement.otherExpenses),
      isBold: false,
    },
    {
      label: 'GROSS PAYABLE REMUNERATION',
      desc: 'Sum of manday fee and all approved allowances',
      amt: formatINR(settlement.grossPayable),
      isBold: true,
      highlight: true,
    },
    {
      label: 'Prior Site Advance Deducted',
      desc: 'Mobilization advance received prior to visit',
      amt: `- ${formatINR(settlement.advanceDeduction)}`,
      isBold: false,
    },
    {
      label: 'TDS Withheld (Section 194J / 194C)',
      desc: 'Professional service tax deducted',
      amt: `- ${formatINR(settlement.tdsDeduction)}`,
      isBold: false,
    },
    {
      label: 'NET DISBURSED AMOUNT (INR)',
      desc: 'Net funds credited to auditor bank / UPI account',
      amt: formatINR(settlement.netPayable),
      isBold: true,
      highlight: true,
    },
  ];

  items.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(row.highlight ? 241 : (isEven ? 255 : 248), row.highlight ? 245 : (isEven ? 255 : 250), row.highlight ? 249 : (isEven ? 255 : 252));
    doc.rect(margin, y, contentWidth, 24, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 24, margin + contentWidth, y + 24);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row.label, margin + 12, y + 16);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row.desc, margin + 270, y + 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row.amt, pageWidth - margin - 12, y + 16, { align: 'right' });

    y += 24;
  });

  y += 24;

  // Signatures & Acknowledgement
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 30, margin + 160, y + 30);
  doc.line(pageWidth - margin - 160, y + 30, pageWidth - margin, y + 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared by JSS Operations', margin, y + 44);
  doc.text('Auditor Acknowledgement', pageWidth - margin, y + 44, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('JaySoftShine Accounts Dept', margin, y + 54);
  doc.text(`Received by ${settlement.auditorName}`, pageWidth - margin, y + 54, { align: 'right' });

  const filename = `${sanitizeFilename(settlement.settlementNumber)}_Auditor_Settlement.pdf`;
  doc.save(filename);
};
