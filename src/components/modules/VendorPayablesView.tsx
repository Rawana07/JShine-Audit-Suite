import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Printer,
  TrendingDown,
  AlertCircle,
  Download,
} from 'lucide-react';
import { VendorBill, Vendor, Project } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian } from '../../utils/rules';
import { exportVendorBillToPdf } from '../../utils/pdfExport';

interface VendorPayablesViewProps {
  vendorBills: VendorBill[];
  vendors: Vendor[];
  projects: Project[];
  onAddBill: (bill: VendorBill) => void;
  onPayBill: (billId: string, amount: number) => void;
}

export const VendorPayablesView: React.FC<VendorPayablesViewProps> = ({
  vendorBills,
  vendors,
  projects,
  onAddBill,
  onPayBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<VendorBill | null>(null);
  const [printBill, setPrintBill] = useState<VendorBill | null>(null);

  // Form State
  const [form, setForm] = useState({
    billNumber: '',
    vendorId: vendors[0]?.id || '',
    projectId: projects[0]?.id || '',
    approvedMandays: 25,
    agreedRate: 1200,
    advanceAdjusted: 0,
    tdsRatePercent: 2, // 194C
  });

  const totalPayable = vendorBills.reduce((sum, b) => sum + b.netPayable, 0);
  const totalPaid = vendorBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalOutstanding = vendorBills.reduce((sum, b) => sum + b.outstanding, 0);
  const totalTdsDeducted = vendorBills.reduce((sum, b) => sum + b.tdsDeduction, 0);

  const filteredBills = vendorBills.filter((b) => {
    return (
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === form.vendorId) || vendors[0];
    const project = projects.find((p) => p.id === form.projectId) || projects[0];

    const taxableAmount = form.approvedMandays * form.agreedRate;
    const gstAmount = Math.round(taxableAmount * 0.18); // 18% GST input
    const tdsDeduction = Math.round((taxableAmount * form.tdsRatePercent) / 100);
    const netPayable = taxableAmount + gstAmount - tdsDeduction - Number(form.advanceAdjusted);

    const newBill: VendorBill = {
      id: `vb_${Date.now()}`,
      billNumber: form.billNumber || `APEX/26-27/${Date.now().toString().slice(-3)}`,
      billDate: new Date().toISOString().split('T')[0],
      vendorId: vendor.id,
      vendorName: vendor.name,
      projectId: project.id,
      projectName: project.name,
      approvedMandays: Number(form.approvedMandays),
      agreedRate: Number(form.agreedRate),
      taxableAmount,
      gstAmount,
      tdsRatePercent: Number(form.tdsRatePercent),
      tdsDeduction,
      advanceAdjusted: Number(form.advanceAdjusted),
      netPayable,
      paidAmount: 0,
      outstanding: netPayable,
      paymentStatus: 'Approved',
      createdAt: new Date().toISOString(),
    };

    onAddBill(newBill);
    setIsAddBillOpen(false);
  };

  const handleConfirmPayment = () => {
    if (payingBill) {
      onPayBill(payingBill.id, payingBill.outstanding);
      setPayingBill(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Vendor Payables & Settlements</h2>
          <p className="text-xs text-slate-500">
            Outsourcing vendor bills, approved mandays rate matching, 2% TDS deductions (Section 194C) & payments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddBillOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Vendor Bill</span>
        </button>
      </div>

      {/* Payables Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Total Vendor Bills</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalPayable)}</div>
          <span className="text-[10px] text-slate-400">{vendorBills.length} Invoices</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Settled Payments</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{formatINR(totalPaid)}</div>
          <span className="text-[10px] text-slate-400">Paid to Vendors</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">TDS Withheld (194C)</span>
          <div className="text-xl font-bold text-blue-700 mt-1">{formatINR(totalTdsDeducted)}</div>
          <span className="text-[10px] text-slate-400">Statutory Liability</span>
        </div>

        <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-xs">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Vendor Outstanding</span>
          <div className="text-xl font-bold text-rose-400 mt-1">{formatINR(totalOutstanding)}</div>
          <span className="text-[10px] text-slate-400">Pending Settlement</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Vendor Bill #, Vendor Name, Project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Vendor Bills Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bill # & Date</th>
                <th className="py-3 px-4">Vendor Partner</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Approved Mandays</th>
                <th className="py-3 px-4">Taxable & GST</th>
                <th className="py-3 px-4">TDS (194C)</th>
                <th className="py-3 px-4">Net Payable</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-slate-900">{b.billNumber}</div>
                    <div className="text-[11px] text-slate-400">{formatDateIndian(b.billDate)}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{b.vendorName}</td>
                  <td className="py-3 px-4 text-slate-700 truncate max-w-[180px]">{b.projectName}</td>
                  <td className="py-3 px-4 font-mono font-medium">
                    {b.approvedMandays} Days @ {formatINR(b.agreedRate)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="font-semibold text-slate-900">{formatINR(b.taxableAmount)}</div>
                    <div className="text-slate-400">GST: {formatINR(b.gstAmount)}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-700 font-semibold">
                    -{formatINR(b.tdsDeduction)} ({b.tdsRatePercent}%)
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-950">
                    {formatINR(b.netPayable)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {b.outstanding > 0 ? (
                      <span className="text-rose-600">{formatINR(b.outstanding)}</span>
                    ) : (
                      <span className="text-emerald-600">Settled</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.paymentStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintBill(b)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Vendor Bill Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportVendorBillToPdf(b)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Export Vendor Bill to PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      {b.outstanding > 0 && (
                        <button
                          type="button"
                          onClick={() => setPayingBill(b)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Settle
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

      {/* Enter Vendor Bill Modal */}
      <Modal
        isOpen={isAddBillOpen}
        onClose={() => setIsAddBillOpen(false)}
        title="Enter Vendor Invoice / Bill"
        subtitle="Match approved mandays against agreed rates and apply TDS Section 194C"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Bill # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.billNumber}
                onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
                placeholder="e.g. APEX/26-27/152"
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Partner <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.vendorId}
                onChange={(e) => {
                  setForm({ ...form, vendorId: e.target.value });
                  const v = vendors.find((x) => x.id === e.target.value);
                  if (v) setForm((prev) => ({ ...prev, agreedRate: v.defaultDayRate || 1200 }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vendorId})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Mandays</label>
              <input
                type="number"
                min={1}
                value={form.approvedMandays}
                onChange={(e) => setForm({ ...form, approvedMandays: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Rate per Manday (₹)</label>
              <input
                type="number"
                min={100}
                value={form.agreedRate}
                onChange={(e) => setForm({ ...form, agreedRate: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TDS Rate (%) - Section 194C</label>
              <input
                type="number"
                step="0.1"
                value={form.tdsRatePercent}
                onChange={(e) => setForm({ ...form, tdsRatePercent: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Adjusted (₹)</label>
              <input
                type="number"
                value={form.advanceAdjusted}
                onChange={(e) => setForm({ ...form, advanceAdjusted: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddBillOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Approve & Book Vendor Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle Payment Confirmation */}
      {payingBill && (
        <Modal
          isOpen={!!payingBill}
          onClose={() => setPayingBill(null)}
          title="Settle Vendor Bill Payment"
          subtitle={`Bill: ${payingBill.billNumber} • Vendor: ${payingBill.vendorName}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span> <span>{formatINR(payingBill.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (Input Credit):</span> <span>+{formatINR(payingBill.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>TDS Withheld (194C):</span> <span>-{formatINR(payingBill.tdsDeduction)}</span>
              </div>
              <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-900 text-sm">
                <span>Net Payment Amount:</span> <span>{formatINR(payingBill.outstanding)}</span>
              </div>
            </div>

            <p className="text-slate-600">
              Payment voucher will debit Vendor Payable ledger and credit Bank Account.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Payment of {formatINR(payingBill.outstanding)}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Official Vendor Bill & Outsourcing Voucher Modal */}
      {printBill && (
        <Modal
          isOpen={!!printBill}
          onClose={() => setPrintBill(null)}
          title={`VENDOR BILL VOUCHER: ${printBill.billNumber}`}
          subtitle={`Vendor Partner: ${printBill.vendorName} • Section 194C TDS Compliant`}
          maxWidth="4xl"
        >
          <div className="printable-document p-6 bg-white border border-slate-300 rounded-xl space-y-5 text-xs font-sans text-slate-800">
            {/* Top Header */}
            <div className="flex justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">JAYSOFTSHINE</h2>
                <p className="text-xs font-semibold text-slate-700">Vendor Outsourcing & Payables Accounting</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  GSTIN: 27AAACJ2329J1Z4 • PAN: AAACJ2329J • Single Org
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-slate-950 uppercase">VENDOR BILL VOUCHER</div>
                <div className="font-mono font-bold text-slate-900">{printBill.billNumber}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Date: {formatDateIndian(printBill.billDate)}</div>
                <div className="text-[11px] font-semibold text-slate-700">Status: {printBill.paymentStatus}</div>
              </div>
            </div>

            {/* Vendor & Project Details */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Vendor Partner:</span>
                <strong className="text-sm text-slate-900 block">{printBill.vendorName}</strong>
                <span className="text-[11px] text-slate-600 font-mono">Vendor ID: {printBill.vendorId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Linked Project:</span>
                <strong className="text-xs text-slate-900 block">{printBill.projectName}</strong>
                <span className="text-[11px] text-slate-500">Execution: Outsourced Manday Package</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full text-left border border-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="p-2.5">Component & Statutory Treatment</th>
                  <th className="p-2.5">Calculation Basis</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-900">
                    Approved Physical Verification Mandays
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {printBill.approvedMandays} Days @ {formatINR(printBill.agreedRate)} / day
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">
                    {formatINR(printBill.taxableAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-900">
                    GST Input Tax Credit (ITC 18%)
                  </td>
                  <td className="p-2.5 text-slate-600">Eligible business ITC</td>
                  <td className="p-2.5 text-right text-emerald-700 font-semibold">
                    +{formatINR(printBill.gstAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-blue-900">
                    TDS Withheld under Section 194C ({printBill.tdsRatePercent}%)
                  </td>
                  <td className="p-2.5 text-slate-600">Statutory Tax Withholding for 26Q</td>
                  <td className="p-2.5 text-right text-blue-700 font-semibold">
                    -{formatINR(printBill.tdsDeduction)}
                  </td>
                </tr>
                {printBill.advanceAdjusted > 0 && (
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-900">Prior Advance Adjusted</td>
                    <td className="p-2.5 text-slate-600">Mobilization Advance Set-off</td>
                    <td className="p-2.5 text-right text-slate-700">
                      -{formatINR(printBill.advanceAdjusted)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold font-sans text-sm text-slate-950">
                  <td className="p-2.5" colSpan={2}>NET PAYABLE AMOUNT</td>
                  <td className="p-2.5 text-right font-mono text-base">{formatINR(printBill.netPayable)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans text-slate-600" colSpan={2}>Amount Settled / Disbursed:</td>
                  <td className="p-2.5 text-right text-emerald-700 font-semibold">{formatINR(printBill.paidAmount)}</td>
                </tr>
                <tr className="bg-slate-100 font-bold font-sans text-xs">
                  <td className="p-2.5" colSpan={2}>OUTSTANDING BALANCE:</td>
                  <td className="p-2.5 text-right font-mono text-rose-700">
                    {printBill.outstanding > 0 ? formatINR(printBill.outstanding) : 'Nil (Settled)'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* IFC Note */}
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-500">
              Internal Financial Controls: Mandays verified against GPS photo timestamps and client-accepted physical verification stock sheets. Section 194C TDS certificate Form 16A issued quarterly.
            </div>

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-900">JSS Accounts & Tax Department</div>
                <div className="text-[10px] text-slate-500">Verified & Passed for Payment</div>
              </div>
              <div className="border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-900">Managing Partner / Authorized Signatory</div>
                <div className="text-[10px] text-slate-500">JaySoftShine</div>
              </div>
            </div>

            {/* Action Buttons */}
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
                onClick={() => exportVendorBillToPdf(printBill)}
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
