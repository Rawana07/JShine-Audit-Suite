import React, { useState } from 'react';
import {
  ReceiptIndianRupee,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';
import { ExpenseRecord, Project, ProjectLocation } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian } from '../../utils/rules';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  projects: Project[];
  locations: ProjectLocation[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onApproveExpense: (id: string, approvedBy: string) => void;
  onRejectExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  projects,
  locations,
  onAddExpense,
  onApproveExpense,
  onRejectExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    category: 'Travel' as ExpenseRecord['category'],
    amount: 500,
    submittedBy: 'Rahul Sharma (Auditor)',
    submitterType: 'AUDITOR' as ExpenseRecord['submitterType'],
    description: 'Local taxi and auto fare for site transit',
    date: new Date().toISOString().split('T')[0],
  });

  const totalApproved = expenses
    .filter((e) => e.approvalStatus === 'Approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPending = expenses
    .filter((e) => e.approvalStatus === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === form.projectId) || projects[0];

    const nextSeq = expenses.length + 1;
    const expenseId = `EXP-2026-${String(nextSeq).padStart(3, '0')}`;

    const newExpense: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      expenseId,
      projectId: proj.id,
      projectName: proj.name,
      submittedBy: form.submittedBy,
      submitterType: form.submitterType,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description,
      approvalStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project Expense Claims & Approvals</h2>
          <p className="text-xs text-slate-500">
            Field audit travel, hotel, food conveyance, courier and equipment claims linked to project cost centres.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense Claim</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Total Approved Expenses</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalApproved)}</div>
          <span className="text-[10px] text-slate-400">Deducted from project net profit</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Pending Approval</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{formatINR(totalPending)}</div>
          <span className="text-[10px] text-slate-400">{expenses.filter((e) => e.approvalStatus === 'Pending').length} Claims pending review</span>
        </div>

        <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Total Claims Booked</span>
          <div className="text-xl font-bold text-white mt-1">{expenses.length} Records</div>
          <span className="text-[10px] text-slate-400">Audit trail preserved</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Expense ID (EXP-2026-001), Description, Submitter..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-900 w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          <option value="Travel">Travel</option>
          <option value="Accommodation">Accommodation</option>
          <option value="Food">Food</option>
          <option value="Local Conveyance">Local Conveyance</option>
          <option value="Printing">Printing</option>
          <option value="Courier">Courier</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Claim ID & Date</th>
                <th className="py-3 px-4">Project & Category</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-slate-900">{exp.expenseId}</div>
                    <div className="text-[11px] text-slate-400">{formatDateIndian(exp.date)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 truncate max-w-[180px]">{exp.projectName}</div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{exp.submittedBy}</div>
                    <div className="text-[10px] text-slate-400">{exp.submitterType}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-[220px]">
                    <div className="truncate">{exp.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={exp.approvalStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {exp.approvalStatus === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApproveExpense(exp.id, 'Super Admin')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectExpense(exp.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {exp.approvalStatus === 'Approved' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Submit New Expense Claim"
        subtitle="Attach travel or incidental claims to project cost centres"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
            >
              <option value="Travel">Travel (Flight / Train / Bus)</option>
              <option value="Local Conveyance">Local Conveyance (Auto / Cab)</option>
              <option value="Accommodation">Accommodation / Hotel</option>
              <option value="Food">Food / Meals</option>
              <option value="Printing">Printing & Stationery</option>
              <option value="Courier">Courier & Dispatch</option>
              <option value="Equipment">Equipment / Barcode Scanner</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Claim Amount (₹)</label>
            <input
              type="number"
              min={1}
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Claim Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Submitted By</label>
            <input
              type="text"
              required
              value={form.submittedBy}
              onChange={(e) => setForm({ ...form, submittedBy: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Purpose</label>
            <textarea
              rows={2}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Auto fare from railway station to client warehouse..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
            />
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
              Submit Expense Claim
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
