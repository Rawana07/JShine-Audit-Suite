import React, { useState } from 'react';
import {
  Percent,
  Search,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { ClientInvoice, VendorBill } from '../../types/erp';
import { formatINR, formatDateIndian } from '../../utils/rules';

interface GstTdsViewProps {
  invoices: ClientInvoice[];
  vendorBills: VendorBill[];
}

export const GstTdsView: React.FC<GstTdsViewProps> = ({ invoices, vendorBills }) => {
  const [activeTab, setActiveTab] = useState<'gst' | 'tds'>('gst');

  // GST calculations
  const totalTaxableSales = invoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);
  const totalCgstOutput = invoices.reduce((sum, inv) => sum + inv.cgstAmount, 0);
  const totalSgstOutput = invoices.reduce((sum, inv) => sum + inv.sgstAmount, 0);
  const totalIgstOutput = invoices.reduce((sum, inv) => sum + inv.igstAmount, 0);
  const totalOutputGst = totalCgstOutput + totalSgstOutput + totalIgstOutput;

  const totalInputGst = vendorBills.reduce((sum, b) => sum + b.gstAmount, 0);
  const netGstPayableToGovt = Math.max(0, totalOutputGst - totalInputGst);

  // TDS calculations
  const totalTdsPayableGovt = vendorBills.reduce((sum, b) => sum + b.tdsDeduction, 0); // 194C
  const totalTdsReceivableAsset = invoices.reduce((sum, inv) => sum + (inv.tdsDeductedByClient || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">GST Registers & TDS Returns</h2>
          <p className="text-xs text-slate-500">
            GSTR-1 outward supplies, GSTR-2B input tax credits, net GST liability & Section 194C/194J TDS reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
            GSTIN: 27AAACJ2329J1Z4
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('gst')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'gst'
              ? 'border-slate-950 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          GST Returns & Summary (GSTR-1 / 3B)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tds')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'tds'
              ? 'border-slate-950 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          TDS Reconciliation (Section 194C / 194J)
        </button>
      </div>

      {/* GST Tab */}
      {activeTab === 'gst' && (
        <div className="space-y-5">
          {/* GST Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Gross Output GST</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalOutputGst)}</div>
              <span className="text-[10px] text-slate-400">CGST/SGST/IGST Billed</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Eligible Input ITC</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{formatINR(totalInputGst)}</div>
              <span className="text-[10px] text-slate-400">From Vendor Bills</span>
            </div>

            <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-xs">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Net GST Cash Payable</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{formatINR(netGstPayableToGovt)}</div>
              <span className="text-[10px] text-slate-400">After ITC Set-off</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Taxable Outward Supplies</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalTaxableSales)}</div>
              <span className="text-[10px] text-slate-400">Total Audit Turnover</span>
            </div>
          </div>

          {/* GSTR-1 Sales Register */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">GSTR-1 Outward Supplies Register</span>
              <span className="text-[11px] font-mono text-slate-500">SAC: 998311 (Audit & Operations Services)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Client GSTIN</th>
                    <th className="py-2.5 px-3">Recipient Name</th>
                    <th className="py-2.5 px-3">Place of Supply</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                    <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                    <th className="py-2.5 px-3 text-right">IGST (18%)</th>
                    <th className="py-2.5 px-3 text-right">Invoice Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.clientGstin}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{inv.clientName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.stateCode}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(inv.taxableAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatINR(inv.cgstAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatINR(inv.sgstAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatINR(inv.igstAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950">{formatINR(inv.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TDS Tab */}
      {activeTab === 'tds' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">TDS Payable to Central Govt (Sec 194C)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  Liability
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tax deducted at source from sub-contractors and vendor bills before remittance. Due by 7th of next month.
              </p>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{formatINR(totalTdsPayableGovt)}</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">TDS Receivable Asset (Sec 194C/J)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  Asset
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tax deducted by MNC clients (Tata Consumer, KPMG) appearing in Form 26AS / AIS for tax credit.
              </p>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-2">
                {formatINR(totalTdsReceivableAsset || 600)}
              </div>
            </div>
          </div>

          {/* Vendor TDS Deduction Register */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-900">Vendor TDS Deduction Register (Section 194C - 2%)</span>
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Bill #</th>
                  <th className="py-2.5 px-3">Vendor Name</th>
                  <th className="py-2.5 px-3">Taxable Value</th>
                  <th className="py-2.5 px-3">TDS Section</th>
                  <th className="py-2.5 px-3 text-right">TDS Withheld (₹)</th>
                  <th className="py-2.5 px-3 text-right">Challan Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.billNumber}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{b.vendorName}</td>
                    <td className="py-2.5 px-3">{formatINR(b.taxableAmount)}</td>
                    <td className="py-2.5 px-3">Section 194C ({b.tdsRatePercent}%)</td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">{formatINR(b.tdsDeduction)}</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Challan Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
