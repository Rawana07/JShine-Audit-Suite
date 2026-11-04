import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  CreditCard,
  UserCheck,
  Building,
  Download,
} from 'lucide-react';
import { AuditorSettlement, Auditor, Project, AttendanceRecord } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian } from '../../utils/rules';
import { exportAuditorSettlementToPdf } from '../../utils/pdfExport';

interface AuditorPayablesViewProps {
  settlements: AuditorSettlement[];
  auditors: Auditor[];
  projects: Project[];
  attendance: AttendanceRecord[];
  onAddSettlement: (settlement: AuditorSettlement) => void;
  onPaySettlement: (settlementId: string, ref: string) => void;
}

export const AuditorPayablesView: React.FC<AuditorPayablesViewProps> = ({
  settlements,
  auditors,
  projects,
  attendance,
  onAddSettlement,
  onPaySettlement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingSettlement, setPayingSettlement] = useState<AuditorSettlement | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [printSettlement, setPrintSettlement] = useState<AuditorSettlement | null>(null);

  // Form State
  const [form, setForm] = useState({
    auditorId: auditors[0]?.id || '',
    projectId: projects[0]?.id || '',
    approvedMandays: 1,
    dailyRate: 1000,
    travelAllowance: 250,
    foodAllowance: 300,
    hotelAllowance: 0,
    otherExpenses: 0,
    advanceDeduction: 0,
    tdsDeduction: 0,
  });

  const totalGross = settlements.reduce((sum, s) => sum + s.grossPayable, 0);
  const totalPaid = settlements.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalOutstanding = settlements.reduce((sum, s) => sum + s.outstanding, 0);

  const filteredSettlements = settlements.filter((s) => {
    return (
      s.settlementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.auditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAuditorChange = (audId: string) => {
    const aud = auditors.find((a) => a.id === audId);
    if (!aud) return;

    // Count approved mandays for this auditor in selected project
    const approvedCount = attendance
      .filter((a) => a.auditorId === aud.id && a.projectId === form.projectId && a.approvalStatus === 'Approved')
      .reduce((sum, a) => sum + a.mandays, 0);

    setForm((prev) => ({
      ...prev,
      auditorId: audId,
      dailyRate: aud.defaultDayRate || 1000,
      approvedMandays: approvedCount > 0 ? approvedCount : 1,
      foodAllowance: aud.dailyFoodAllowance || 300,
    }));
  };

  const handleCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const aud = auditors.find((a) => a.id === form.auditorId) || auditors[0];
    const proj = projects.find((p) => p.id === form.projectId) || projects[0];

    const mandayPayable = form.approvedMandays * form.dailyRate;
    const allowances = Number(form.travelAllowance) + Number(form.foodAllowance) + Number(form.hotelAllowance) + Number(form.otherExpenses);
    const grossPayable = mandayPayable + allowances;
    const netPayable = grossPayable - Number(form.advanceDeduction) - Number(form.tdsDeduction);

    const nextSeq = settlements.length + 1;
    const settlementNumber = `JSS-SET-2026-${String(nextSeq).padStart(3, '0')}`;

    const newSettlement: AuditorSettlement = {
      id: `set_${Date.now()}`,
      settlementNumber,
      auditorId: aud.id,
      auditorName: aud.name,
      projectId: proj.id,
      projectName: proj.name,
      approvedMandays: Number(form.approvedMandays),
      dailyRate: Number(form.dailyRate),
      mandayPayable,
      travelAllowance: Number(form.travelAllowance),
      foodAllowance: Number(form.foodAllowance),
      hotelAllowance: Number(form.hotelAllowance),
      otherExpenses: Number(form.otherExpenses),
      grossPayable,
      advanceDeduction: Number(form.advanceDeduction),
      tdsDeduction: Number(form.tdsDeduction),
      netPayable,
      paidAmount: 0,
      outstanding: netPayable,
      status: 'Approved',
      createdAt: new Date().toISOString(),
    };

    onAddSettlement(newSettlement);
    setIsAddOpen(false);
  };

  const handleConfirmPay = () => {
    if (payingSettlement) {
      onPaySettlement(payingSettlement.id, paymentRef || `UPI/${Date.now()}`);
      setPayingSettlement(null);
      setPaymentRef('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Auditor Payables & Settlements</h2>
          <p className="text-xs text-slate-500">
            Field auditor remuneration sheets, approved manday fee calculation, travel & food allowances, and payout vouchers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Settlement Sheet</span>
        </button>
      </div>

      {/* Payables Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Total Gross Auditor Payables</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalGross)}</div>
          <span className="text-[10px] text-slate-400">Mandays + TA/DA Allowances</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Settled Payments</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{formatINR(totalPaid)}</div>
          <span className="text-[10px] text-slate-400">Paid to Auditors</span>
        </div>

        <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Pending Auditor Dues</span>
          <div className="text-xl font-bold text-rose-400 mt-1">{formatINR(totalOutstanding)}</div>
          <span className="text-[10px] text-slate-400">Awaiting Disbursement</span>
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
            placeholder="Search by Settlement #, Auditor Name, Project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Settlement #</th>
                <th className="py-3 px-4">Auditor Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Mandays Fee</th>
                <th className="py-3 px-4">Allowances (TA/Food)</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div>{s.settlementNumber}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{formatDateIndian(s.createdAt)}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.auditorName}</td>
                  <td className="py-3 px-4 text-slate-700 truncate max-w-[180px]">{s.projectName}</td>
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-slate-900">{formatINR(s.mandayPayable)}</div>
                    <div className="text-[10px] text-slate-400">{s.approvedMandays} Days @ ₹{s.dailyRate}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {formatINR(s.travelAllowance + s.foodAllowance + s.hotelAllowance + s.otherExpenses)}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {formatINR(s.grossPayable)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {formatINR(s.netPayable)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintSettlement(s)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Settlement Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Voucher</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportAuditorSettlementToPdf(s)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Export Settlement Voucher to PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      {s.outstanding > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPayingSettlement(s);
                            setPaymentRef(`UPI/${Date.now().toString().slice(-8)}`);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded font-semibold text-xs transition-colors"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Paid</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Settlement Sheet Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Generate Auditor Settlement Sheet"
        subtitle="Auto-compute remuneration based on approved mandays and daily rate"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSettlement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auditor <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.auditorId}
                onChange={(e) => handleAuditorChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {auditors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.auditorId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
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
                step="0.5"
                min={0.5}
                value={form.approvedMandays}
                onChange={(e) => setForm({ ...form, approvedMandays: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Remuneration Rate (₹)</label>
              <input
                type="number"
                min={100}
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Allowance (₹)</label>
              <input
                type="number"
                value={form.travelAllowance}
                onChange={(e) => setForm({ ...form, travelAllowance: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Allowance (₹)</label>
              <input
                type="number"
                value={form.foodAllowance}
                onChange={(e) => setForm({ ...form, foodAllowance: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Allowance (₹)</label>
              <input
                type="number"
                value={form.hotelAllowance}
                onChange={(e) => setForm({ ...form, hotelAllowance: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Deducted (₹)</label>
              <input
                type="number"
                value={form.advanceDeduction}
                onChange={(e) => setForm({ ...form, advanceDeduction: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Approve Settlement
            </button>
          </div>
        </form>
      </Modal>

      {/* Disburse Modal */}
      {payingSettlement && (
        <Modal
          isOpen={!!payingSettlement}
          onClose={() => setPayingSettlement(null)}
          title="Disburse Auditor Settlement"
          subtitle={`Auditor: ${payingSettlement.auditorName} • Settlement: ${payingSettlement.settlementNumber}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Manday Fee:</span> <span>{formatINR(payingSettlement.mandayPayable)}</span>
              </div>
              <div className="flex justify-between">
                <span>Allowances:</span> <span>+{formatINR(payingSettlement.travelAllowance + payingSettlement.foodAllowance)}</span>
              </div>
              <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-900 text-sm">
                <span>Net Payable:</span> <span>{formatINR(payingSettlement.outstanding)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank / UPI Transfer Reference #
              </label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. UPI/631122894101"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingSettlement(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Disbursement</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Settlement Voucher Modal */}
      {printSettlement && (
        <Modal
          isOpen={!!printSettlement}
          onClose={() => setPrintSettlement(null)}
          title={`SETTLEMENT VOUCHER: ${printSettlement.settlementNumber}`}
          subtitle="Auditor Remuneration & Allowance Advice"
          maxWidth="2xl"
        >
          <div className="printable-document p-6 bg-white border border-slate-300 rounded-xl space-y-4 text-xs font-sans">
            <div className="flex justify-between border-b pb-3 border-slate-900">
              <div>
                <h2 className="text-lg font-bold text-slate-950">JAYSOFTSHINE</h2>
                <p className="text-[11px] text-slate-600">Audit & Field Operations - Disbursement Voucher</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-slate-900">{printSettlement.settlementNumber}</div>
                <div className="text-[11px] text-slate-500">Date: {formatDateIndian(printSettlement.createdAt)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Auditor Name:</span>
                <strong className="text-sm text-slate-900">{printSettlement.auditorName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Project Name:</span>
                <strong className="text-xs text-slate-900">{printSettlement.projectName}</strong>
              </div>
            </div>

            <table className="w-full text-left border border-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="p-2">Component</th>
                  <th className="p-2">Rate / Quantity</th>
                  <th className="p-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                <tr>
                  <td className="p-2 font-sans font-medium">Audit Manday Remuneration</td>
                  <td className="p-2">{printSettlement.approvedMandays} Days @ ₹{printSettlement.dailyRate}</td>
                  <td className="p-2 text-right">{formatINR(printSettlement.mandayPayable)}</td>
                </tr>
                {printSettlement.travelAllowance > 0 && (
                  <tr>
                    <td className="p-2 font-sans font-medium">Travel Allowance (TA)</td>
                    <td className="p-2">Site Conveyance</td>
                    <td className="p-2 text-right">{formatINR(printSettlement.travelAllowance)}</td>
                  </tr>
                )}
                {printSettlement.foodAllowance > 0 && (
                  <tr>
                    <td className="p-2 font-sans font-medium">Daily Food Allowance (DA)</td>
                    <td className="p-2">Per-diem</td>
                    <td className="p-2 text-right">{formatINR(printSettlement.foodAllowance)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold font-sans">
                  <td className="p-2" colSpan={2}>GROSS PAYABLE</td>
                  <td className="p-2 text-right font-mono">{formatINR(printSettlement.grossPayable)}</td>
                </tr>
                <tr className="bg-slate-100 font-bold text-slate-950 font-sans text-sm">
                  <td className="p-2" colSpan={2}>NET DISBURSED AMOUNT</td>
                  <td className="p-2 text-right font-mono">{formatINR(printSettlement.netPayable)}</td>
                </tr>
              </tbody>
            </table>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-900">JaySoftShine Accounts</div>
              </div>
              <div className="border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-900">Auditor Signature</div>
              </div>
            </div>

            <div className="no-print pt-4 border-t flex justify-end gap-2.5">
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
                onClick={() => exportAuditorSettlementToPdf(printSettlement)}
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
