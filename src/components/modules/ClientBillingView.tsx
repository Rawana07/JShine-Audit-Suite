import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
  ArrowUpRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import { ClientInvoice, ClientPaymentReceipt, Project, Client } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian, calculateGstBreakdown } from '../../utils/rules';
import { exportInvoiceToPdf } from '../../utils/pdfExport';

interface ClientBillingViewProps {
  invoices: ClientInvoice[];
  receipts: ClientPaymentReceipt[];
  projects: Project[];
  clients: Client[];
  onAddInvoice: (invoice: ClientInvoice) => void;
  onRecordPayment: (receipt: ClientPaymentReceipt) => void;
}

export const ClientBillingView: React.FC<ClientBillingViewProps> = ({
  invoices,
  receipts,
  projects,
  clients,
  onAddInvoice,
  onRecordPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<ClientInvoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<ClientInvoice | null>(null);

  // New Invoice Form
  const [invForm, setInvForm] = useState({
    projectId: projects[0]?.id || '',
    clientId: clients[0]?.id || '',
    description: 'Physical Verification & Stock Audit Charges',
    hsnSac: '998311',
    quantity: 20,
    rate: 1500,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  // Receipt Form
  const [recForm, setRecForm] = useState({
    amountReceived: 0,
    tdsDeducted: 0,
    paymentMode: 'NEFT/RTGS' as ClientPaymentReceipt['paymentMode'],
    referenceNo: '',
    bankAccount: 'HDFC Current A/c - 50200088991100',
    remarks: 'Full settlement received via bank transfer.',
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalReceived = receipts.reduce((sum, rec) => sum + rec.amountReceived, 0);
  const totalTdsReceivable = receipts.reduce((sum, rec) => sum + rec.tdsDeducted, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const filteredInvoices = invoices.filter((i) => {
    return (
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === invForm.projectId) || projects[0];
    const client = clients.find((c) => c.id === proj.clientId) || clients[0];

    const nextSeq = invoices.length + 1;
    const invoiceNumber = `JSS/26-27/${String(nextSeq).padStart(3, '0')}`;

    const taxableAmount = invForm.quantity * invForm.rate;
    // Calculate GST based on Client state vs JaySoftShine (Maharashtra)
    const gstBreakdown = calculateGstBreakdown(taxableAmount, client.state, 'Maharashtra', 18);

    const newInvoice: ClientInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: invForm.dueDate,
      clientId: client.id,
      clientName: client.name,
      projectId: proj.id,
      projectName: proj.name,
      billingAddress: client.billingAddress + ', ' + client.city + ', ' + client.state + ' - ' + client.pincode,
      clientGstin: client.gstin,
      stateCode: client.state,
      items: [
        {
          description: invForm.description,
          hsnSac: invForm.hsnSac,
          quantity: invForm.quantity,
          rate: invForm.rate,
          amount: taxableAmount,
        },
      ],
      taxableAmount,
      isInterState: gstBreakdown.isInterState,
      cgstAmount: gstBreakdown.cgstAmount,
      sgstAmount: gstBreakdown.sgstAmount,
      igstAmount: gstBreakdown.igstAmount,
      totalAmount: gstBreakdown.totalInvoiceAmount,
      tdsDeductedByClient: 0,
      paidAmount: 0,
      balanceDue: gstBreakdown.totalInvoiceAmount,
      status: 'Issued',
      createdAt: new Date().toISOString(),
    };

    onAddInvoice(newInvoice);
    setIsNewInvoiceOpen(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay) return;

    const nextSeq = receipts.length + 1;
    const receiptNumber = `JSS-REC-26-${String(nextSeq).padStart(3, '0')}`;

    const newReceipt: ClientPaymentReceipt = {
      id: `rec_${Date.now()}`,
      receiptNumber,
      receiptDate: new Date().toISOString().split('T')[0],
      clientId: selectedInvoiceToPay.clientId,
      clientName: selectedInvoiceToPay.clientName,
      invoiceId: selectedInvoiceToPay.id,
      invoiceNumber: selectedInvoiceToPay.invoiceNumber,
      amountReceived: Number(recForm.amountReceived),
      tdsDeducted: Number(recForm.tdsDeducted),
      paymentMode: recForm.paymentMode,
      referenceNo: recForm.referenceNo || `REF-${Date.now()}`,
      bankAccount: recForm.bankAccount,
      remarks: recForm.remarks,
      createdAt: new Date().toISOString(),
    };

    onRecordPayment(newReceipt);
    setIsReceiptModalOpen(false);
    setSelectedInvoiceToPay(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Client Invoicing & Receivables</h2>
          <p className="text-xs text-slate-500">
            GST-compliant tax invoicing (SAC 998311), state-wise CGST/SGST/IGST, TDS receivable tracking & receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewInvoiceOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise GST Tax Invoice</span>
        </button>
      </div>

      {/* Financial Receivables Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Total Invoiced</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalInvoiced)}</div>
          <span className="text-[10px] text-slate-400">{invoices.length} Tax Invoices</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Cash & Bank Received</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{formatINR(totalReceived)}</div>
          <span className="text-[10px] text-slate-400">Directly Bank Credited</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">TDS Deducted (Sec 194C)</span>
          <div className="text-xl font-bold text-blue-700 mt-1">{formatINR(totalTdsReceivable)}</div>
          <span className="text-[10px] text-slate-400">TDS Asset / Form 26AS</span>
        </div>

        <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-xs">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Client Outstanding</span>
          <div className="text-xl font-bold text-rose-400 mt-1">{formatINR(totalOutstanding)}</div>
          <span className="text-[10px] text-slate-400">Payment Pending</span>
        </div>
      </div>

      {/* Sub Tabs: Invoices vs Receipts */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-slate-950 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Tax Invoices ({invoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'receipts'
              ? 'border-slate-950 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Payment Receipts ({receipts.length})
        </button>
      </div>

      {/* Invoices List Table */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice # & Date</th>
                  <th className="py-3 px-4">Client & Project</th>
                  <th className="py-3 px-4">Taxable Value</th>
                  <th className="py-3 px-4">GST Treatment</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid & TDS</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">{formatDateIndian(inv.invoiceDate)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{inv.projectName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {formatINR(inv.taxableAmount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {inv.isInterState ? (
                        <span>IGST 18%: {formatINR(inv.igstAmount)}</span>
                      ) : (
                        <span>CGST+SGST: {formatINR(inv.cgstAmount + inv.sgstAmount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-950">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-emerald-700 font-semibold">{formatINR(inv.paidAmount)} Paid</div>
                      {inv.tdsDeductedByClient > 0 && (
                        <div className="text-blue-700">TDS: {formatINR(inv.tdsDeductedByClient)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-rose-600">{formatINR(inv.balanceDue)}</span>
                      ) : (
                        <span className="text-emerald-600">Nil</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintInvoice(inv)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="View Official GST Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportInvoiceToPdf(inv)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Export Tax Invoice to PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        {inv.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceToPay(inv);
                              setRecForm({
                                amountReceived: inv.balanceDue - Math.round(inv.taxableAmount * 0.02),
                                tdsDeducted: Math.round(inv.taxableAmount * 0.02),
                                paymentMode: 'NEFT/RTGS',
                                referenceNo: '',
                                bankAccount: 'HDFC Current A/c - 50200088991100',
                                remarks: `Settlement against Inv ${inv.invoiceNumber}`,
                              });
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded font-semibold text-xs flex items-center gap-1"
                          >
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipts Table */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt # & Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Against Invoice</th>
                  <th className="py-3 px-4">Amount Received</th>
                  <th className="py-3 px-4">TDS Deducted (Asset)</th>
                  <th className="py-3 px-4">Bank Ref & Account</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div>{rec.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{formatDateIndian(rec.receiptDate)}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{rec.clientName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{rec.invoiceNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{formatINR(rec.amountReceived)}</td>
                    <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{formatINR(rec.tdsDeducted)}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      <div>{rec.referenceNo}</div>
                      <div className="text-slate-400">{rec.bankAccount}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{rec.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raise New GST Invoice Modal */}
      <Modal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        title="Generate GST Tax Invoice"
        subtitle="Compliant Indian Tax Invoice with SAC 998311 & automatic CGST/SGST/IGST calculation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={invForm.projectId}
                onChange={(e) => {
                  setInvForm({ ...invForm, projectId: e.target.value });
                  const p = projects.find((x) => x.id === e.target.value);
                  if (p) setInvForm((prev) => ({ ...prev, rate: p.clientRatePerManday || 1500 }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectId} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={invForm.dueDate}
                onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Line Item Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={invForm.description}
                onChange={(e) => setInvForm({ ...invForm, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SAC Code</label>
              <input
                type="text"
                value={invForm.hsnSac}
                onChange={(e) => setInvForm({ ...invForm, hsnSac: e.target.value })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billable Mandays / Qty</label>
              <input
                type="number"
                min={1}
                value={invForm.quantity}
                onChange={(e) => setInvForm({ ...invForm, quantity: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rate per Manday (₹)</label>
              <input
                type="number"
                min={100}
                value={invForm.rate}
                onChange={(e) => setInvForm({ ...invForm, rate: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Taxable Amount</label>
              <div className="p-2 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-900">
                {formatINR(invForm.quantity * invForm.rate)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span> <span>{formatINR(invForm.quantity * invForm.rate)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated 18% GST:</span> <span>{formatINR(invForm.quantity * invForm.rate * 0.18)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
              <span>Total Invoice Amount:</span> <span>{formatINR(invForm.quantity * invForm.rate * 1.18)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewInvoiceOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Issue Tax Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Client Payment Receipt Modal */}
      {selectedInvoiceToPay && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title={`Record Payment Receipt: ${selectedInvoiceToPay.invoiceNumber}`}
          subtitle={`Client: ${selectedInvoiceToPay.clientName} • Balance Due: ${formatINR(selectedInvoiceToPay.balanceDue)}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Net Bank Receipt Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={recForm.amountReceived}
                onChange={(e) => setRecForm({ ...recForm, amountReceived: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TDS Deducted by Client (₹) - Section 194C
              </label>
              <input
                type="number"
                value={recForm.tdsDeducted}
                onChange={(e) => setRecForm({ ...recForm, tdsDeducted: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Asset booked to TDS Receivable ledger</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={recForm.paymentMode}
                onChange={(e) => setRecForm({ ...recForm, paymentMode: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                <option value="NEFT/RTGS">NEFT / RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Direct Transfer">Direct Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Reference / UTR #</label>
              <input
                type="text"
                required
                value={recForm.referenceNo}
                onChange={(e) => setRecForm({ ...recForm, referenceNo: e.target.value })}
                placeholder="e.g. HDFCR52026110190823"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
              >
                Post Payment Voucher
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Printable GST Tax Invoice Modal */}
      {printInvoice && (
        <Modal
          isOpen={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          title={`TAX INVOICE: ${printInvoice.invoiceNumber}`}
          subtitle="Official GST Document (Rule 46 of CGST Rules, 2017)"
          maxWidth="4xl"
        >
          <div className="printable-document p-8 bg-white border border-slate-300 rounded-xl space-y-6 text-xs text-slate-800 font-sans">
            {/* Top header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">JAYSOFTSHINE</h1>
                <p className="text-xs font-semibold text-slate-700">Audit & Operations Outsourcing Division</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Registered Office: 402, Trade Square, Senapati Bapat Marg, Dadar West, Mumbai - 400028
                </p>
                <p className="text-[11px] font-mono text-slate-800">
                  GSTIN: <strong>27AAACJ2329J1Z4</strong> • PAN: <strong>AAACJ2329J</strong> • State: Maharashtra (27)
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-black text-slate-950 uppercase">TAX INVOICE</div>
                <div className="font-mono text-sm font-bold text-slate-900">{printInvoice.invoiceNumber}</div>
                <div className="text-xs text-slate-600 mt-1">Invoice Date: {formatDateIndian(printInvoice.invoiceDate)}</div>
                <div className="text-xs text-slate-600">Due Date: {formatDateIndian(printInvoice.dueDate)}</div>
              </div>
            </div>

            {/* Client Bill To */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Billed To (Client):</span>
                <strong className="text-sm text-slate-950 block">{printInvoice.clientName}</strong>
                <p className="text-slate-600 mt-1">{printInvoice.billingAddress}</p>
                <div className="font-mono text-xs mt-1">
                  Client GSTIN: <strong>{printInvoice.clientGstin}</strong>
                </div>
              </div>

              <div className="border-l border-slate-200 pl-4">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Project Details:</span>
                <strong className="text-xs text-slate-950 block">{printInvoice.projectName}</strong>
                <div className="text-slate-600 mt-1">Place of Supply: {printInvoice.stateCode}</div>
                <div className="font-mono text-[11px] mt-1 text-slate-700">Payment Terms: 30 Days Net</div>
              </div>
            </div>

            {/* Table of items */}
            <table className="w-full text-left border border-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Service Description</th>
                  <th className="p-2.5 font-mono">SAC Code</th>
                  <th className="p-2.5 text-right">Mandays</th>
                  <th className="p-2.5 text-right">Rate (₹)</th>
                  <th className="p-2.5 text-right">Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{item.description}</td>
                    <td className="p-2.5 font-mono text-slate-600">{item.hsnSac}</td>
                    <td className="p-2.5 text-right font-mono">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono">{formatINR(item.rate)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tax totals breakdown */}
            <div className="flex justify-end">
              <div className="w-80 font-mono text-xs space-y-1.5 border border-slate-200 p-3 rounded-lg bg-slate-50">
                <div className="flex justify-between text-slate-600">
                  <span>Total Taxable Amount:</span>
                  <span className="font-semibold text-slate-900">{formatINR(printInvoice.taxableAmount)}</span>
                </div>
                {!printInvoice.isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (9.0%):</span>
                      <span>{formatINR(printInvoice.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (9.0%):</span>
                      <span>{formatINR(printInvoice.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST (18.0%):</span>
                    <span>{formatINR(printInvoice.igstAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-1.5 flex justify-between text-slate-950 font-bold text-sm">
                  <span>TOTAL INVOICE AMOUNT:</span>
                  <span>{formatINR(printInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Bank details & Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-0.5">
                <strong className="text-slate-900 block font-sans text-xs mb-1">Company Bank Details for Payment:</strong>
                <div>Bank Name: HDFC Bank Ltd</div>
                <div>Account Name: JAYSOFTSHINE SERVICES LLP</div>
                <div>Current A/C: 50200088991100</div>
                <div>IFSC Code: HDFC0000240 (Lower Parel Branch)</div>
              </div>

              <div className="text-center pt-8">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                  For JAYSOFTSHINE
                </div>
                <div className="text-[10px] text-slate-500">Authorized Signatory / Partner</div>
              </div>
            </div>

            {/* Print & PDF download action buttons */}
            <div className="no-print pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save via Browser</span>
              </button>
              <button
                type="button"
                onClick={() => exportInvoiceToPdf(printInvoice)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
