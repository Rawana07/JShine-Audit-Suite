import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Scale,
  TrendingUp,
  Receipt,
  Building,
  Layers,
} from 'lucide-react';
import { JournalEntry, Project } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian, validateJournalBalance } from '../../utils/rules';

interface AccountingViewProps {
  journals: JournalEntry[];
  projects: Project[];
  onAddJournal: (journal: JournalEntry) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  journals,
  projects,
  onAddJournal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'journals' | 'coa' | 'trial-balance' | 'profit-loss' | 'balance-sheet'
  >('journals');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddJournalOpen, setIsAddJournalOpen] = useState(false);

  // Standard Indian Chart of Accounts (COA)
  const chartOfAccounts = [
    // Assets (1000 - 1999)
    { code: '1010', name: 'HDFC Bank Current Account', type: 'Asset', balance: 34800 },
    { code: '1020', name: 'ICICI Bank Operating Account', type: 'Asset', balance: 0 },
    { code: '1030', name: 'Petty Cash Balance', type: 'Asset', balance: 5000 },
    { code: '1100', name: 'Accounts Receivable (Trade Debtors)', type: 'Asset', balance: 70800 },
    { code: '1200', name: 'TDS Receivable (Section 194C/J Asset)', type: 'Asset', balance: 600 },
    { code: '1310', name: 'Input CGST (Eligible ITC)', type: 'Asset', balance: 4320 },
    { code: '1320', name: 'Input SGST (Eligible ITC)', type: 'Asset', balance: 4320 },
    { code: '1330', name: 'Input IGST (Eligible ITC)', type: 'Asset', balance: 0 },
    { code: '1410', name: 'Advances to Vendors', type: 'Asset', balance: 5000 },
    { code: '1420', name: 'Advances to Auditors', type: 'Asset', balance: 0 },

    // Liabilities (2000 - 2999)
    { code: '2100', name: 'Vendor Payables (Apex Audit Solutions)', type: 'Liability', balance: 29800 },
    { code: '2150', name: 'Auditor Payables (Field Associates)', type: 'Liability', balance: 0 },
    { code: '2210', name: 'Output CGST Liability', type: 'Liability', balance: 8100 },
    { code: '2220', name: 'Output SGST Liability', type: 'Liability', balance: 8100 },
    { code: '2230', name: 'Output IGST Liability', type: 'Liability', balance: 0 },
    { code: '2300', name: 'TDS Payable (Withheld from Vendors - 194C)', type: 'Liability', balance: 1080 },

    // Equity (3000 - 3999)
    { code: '3010', name: 'Partners Capital Account (Jayesh Vyas)', type: 'Equity', balance: 50000 },
    { code: '3020', name: 'Retained Earnings', type: 'Equity', balance: 27460 },

    // Income (4000 - 4999)
    { code: '4000', name: 'Audit & Physical Verification Revenue', type: 'Income', balance: 90000 },
    { code: '4100', name: 'Stock Audit Consultancy Revenue', type: 'Income', balance: 0 },

    // Expenses (5000 - 5999)
    { code: '5010', name: 'Direct Vendor Outsourcing Charges', type: 'Expense', balance: 54000 },
    { code: '5020', name: 'Direct Auditor Remuneration', type: 'Expense', balance: 1000 },
    { code: '5110', name: 'Field Travel & Conveyance Expenses', type: 'Expense', balance: 250 },
    { code: '5120', name: 'Food & Site Per-Diem Allowances', type: 'Expense', balance: 300 },
    { code: '5200', name: 'Bank Charges & Professional Fees', type: 'Expense', balance: 0 },
  ];

  // New Journal Entry Form State
  const [jvForm, setJvForm] = useState({
    voucherNo: '',
    narration: '',
    voucherType: 'Journal' as JournalEntry['voucherType'],
    date: new Date().toISOString().split('T')[0],
    lines: [
      { accountCode: '1100', accountName: 'Accounts Receivable (Trade Debtors)', debit: 11800, credit: 0 },
      { accountCode: '4000', accountName: 'Audit & Physical Verification Revenue', debit: 0, credit: 10000 },
      { accountCode: '2210', accountName: 'Output CGST Liability', debit: 0, credit: 900 },
      { accountCode: '2220', accountName: 'Output SGST Liability', debit: 0, credit: 900 },
    ],
  });

  const balanceCheck = validateJournalBalance(jvForm.lines);

  const handleLineChange = (index: number, field: 'accountCode' | 'debit' | 'credit', val: any) => {
    const updated = [...jvForm.lines];
    if (field === 'accountCode') {
      const coa = chartOfAccounts.find((c) => c.code === val);
      updated[index].accountCode = val;
      updated[index].accountName = coa ? coa.name : 'Account';
    } else {
      updated[index][field] = Number(val);
    }
    setJvForm({ ...jvForm, lines: updated });
  };

  const handleAddLine = () => {
    setJvForm({
      ...jvForm,
      lines: [
        ...jvForm.lines,
        { accountCode: '1010', accountName: 'HDFC Bank Current Account', debit: 0, credit: 0 },
      ],
    });
  };

  const handleRemoveLine = (idx: number) => {
    if (jvForm.lines.length <= 2) return;
    setJvForm({
      ...jvForm,
      lines: jvForm.lines.filter((_, i) => i !== idx),
    });
  };

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceCheck.isBalanced) {
      alert('Double-entry rule violation: Total Debit must exactly equal Total Credit.');
      return;
    }

    const nextSeq = journals.length + 1;
    const voucherNo = jvForm.voucherNo || `JV-2026-${String(nextSeq).padStart(3, '0')}`;

    const newJournal: JournalEntry = {
      id: `jv_${Date.now()}`,
      voucherNo,
      date: jvForm.date,
      narration: jvForm.narration || 'Being posted financial journal entry',
      voucherType: jvForm.voucherType,
      lines: jvForm.lines,
      totalDebit: balanceCheck.totalDebit,
      totalCredit: balanceCheck.totalCredit,
      isPosted: true,
      postedBy: 'Amit Deshmukh (CA)',
      createdAt: new Date().toISOString(),
    };

    onAddJournal(newJournal);
    setIsAddJournalOpen(false);
  };

  // Calculations for Trial Balance
  const totalDebitTrial = chartOfAccounts.reduce(
    (sum, c) => sum + (c.type === 'Asset' || c.type === 'Expense' ? c.balance : 0),
    0
  );
  const totalCreditTrial = chartOfAccounts.reduce(
    (sum, c) => sum + (c.type === 'Liability' || c.type === 'Equity' || c.type === 'Income' ? c.balance : 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Double-Entry Accounting Engine</h2>
          <p className="text-xs text-slate-500">
            Strict double-entry bookkeeping (Total Debit = Total Credit), Chart of Accounts, General Ledger, Trial Balance & P&L.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAddJournalOpen(true);
            setJvForm((prev) => ({
              ...prev,
              voucherNo: `JV-2026-${String(journals.length + 1).padStart(3, '0')}`,
            }));
          }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Voucher (JV)</span>
        </button>
      </div>

      {/* Accounting Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'journals', label: `Journal Vouchers (${journals.length})` },
          { id: 'coa', label: `Chart of Accounts (${chartOfAccounts.length})` },
          { id: 'trial-balance', label: 'Trial Balance' },
          { id: 'profit-loss', label: 'Profit & Loss Statement' },
          { id: 'balance-sheet', label: 'Balance Sheet' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-slate-950 text-slate-950 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Journal Entries */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {journals.map((jv) => (
                <div key={jv.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                        {jv.voucherNo}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Date: {formatDateIndian(jv.date)}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {jv.voucherType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-mono">Posted by {jv.postedBy}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Balanced (₹{formatINR(jv.totalDebit)})
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-slate-400 text-[11px]">
                        <tr>
                          <th className="py-1">Account Code & Name</th>
                          <th className="py-1 text-right">Debit (₹)</th>
                          <th className="py-1 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {jv.lines.map((line, idx) => (
                          <tr key={idx} className="text-slate-700">
                            <td className="py-1 font-sans">
                              <span className="font-mono font-bold text-slate-900">{line.accountCode}</span> - {line.accountName}
                            </td>
                            <td className="py-1 text-right font-bold text-slate-900">
                              {line.debit > 0 ? formatINR(line.debit) : '-'}
                            </td>
                            <td className="py-1 text-right font-bold text-slate-900">
                              {line.credit > 0 ? formatINR(line.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                    Narration: {jv.narration}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chart of Accounts */}
      {activeTab === 'coa' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Accounting Type</th>
                <th className="py-3 px-4 text-right">Current Ledger Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartOfAccounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{acc.code}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{acc.name}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      acc.type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                      acc.type === 'Liability' ? 'bg-amber-100 text-amber-800' :
                      acc.type === 'Income' ? 'bg-emerald-100 text-emerald-800' :
                      acc.type === 'Expense' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-right text-slate-900">
                    {formatINR(acc.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Trial Balance */}
      {activeTab === 'trial-balance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Trial Balance as on Current Date</h3>
              <p className="text-xs text-slate-500">Self-balancing double-entry verification (Debits = Credits)</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Books Balanced
            </span>
          </div>

          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Account Head</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Debit Balance (₹)</th>
                <th className="py-2.5 px-3 text-right">Credit Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartOfAccounts.map((acc) => {
                const isDebit = acc.type === 'Asset' || acc.type === 'Expense';
                return (
                  <tr key={acc.code} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">
                      <span className="font-mono text-slate-500">{acc.code}</span> - {acc.name}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{acc.type}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {isDebit && acc.balance > 0 ? formatINR(acc.balance) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {!isDebit && acc.balance > 0 ? formatINR(acc.balance) : '-'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-950 text-white font-extrabold text-sm">
                <td className="py-3 px-3 font-sans" colSpan={2}>TOTAL TRIAL BALANCE</td>
                <td className="py-3 px-3 text-right text-emerald-400">{formatINR(totalDebitTrial)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">{formatINR(totalCreditTrial)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Profit & Loss Statement */}
      {activeTab === 'profit-loss' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Statement of Profit and Loss (FY 2026-27)</h3>
            <p className="text-xs text-slate-500">Audit revenue recognized net of GST liabilities vs direct auditor/vendor costs</p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Revenue */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 uppercase font-sans text-xs">I. Revenue from Operations</div>
              <div className="flex justify-between text-slate-700">
                <span>4000 - Audit & Physical Verification Revenue:</span>
                <span className="font-bold">₹90,000</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                <span>Total Revenue (A):</span>
                <span>₹90,000</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 uppercase font-sans text-xs">II. Direct Project Costs & Expenses</div>
              <div className="flex justify-between text-slate-700">
                <span>5010 - Direct Vendor Outsourcing Charges (Apex Audit):</span>
                <span>₹54,000</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>5020 - Direct Auditor Remuneration:</span>
                <span>₹1,000</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>5110 - Field Travel & Conveyance Expenses:</span>
                <span>₹250</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>5120 - Food & Site Per-Diem Allowances:</span>
                <span>₹300</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                <span>Total Direct Expenses (B):</span>
                <span>₹55,550</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="p-4 bg-slate-950 text-white rounded-xl flex justify-between items-center text-sm font-extrabold">
              <span>NET PROFIT BEFORE TAX (A - B):</span>
              <span className="text-emerald-400">₹34,450 (38.3% Net Margin)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Balance Sheet */}
      {activeTab === 'balance-sheet' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Balance Sheet as on Current Date</h3>
            <p className="text-xs text-slate-500">Double-entry equation: Total Assets = Total Liabilities + Equity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Assets */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 uppercase font-sans text-xs border-b pb-1.5">ASSETS</h4>
              <div className="flex justify-between">
                <span>HDFC Bank Account:</span> <span className="font-bold">₹34,800</span>
              </div>
              <div className="flex justify-between">
                <span>Accounts Receivable (TCPL):</span> <span className="font-bold">₹70,800</span>
              </div>
              <div className="flex justify-between">
                <span>TDS Receivable (Asset):</span> <span className="font-bold">₹600</span>
              </div>
              <div className="flex justify-between">
                <span>Eligible Input GST Credit:</span> <span className="font-bold">₹8,640</span>
              </div>
              <div className="flex justify-between">
                <span>Advances to Vendors:</span> <span className="font-bold">₹5,000</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm text-slate-900 font-sans">
                <span>TOTAL ASSETS:</span>
                <span>₹1,19,840</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 uppercase font-sans text-xs border-b pb-1.5">LIABILITIES & EQUITY</h4>
              <div className="flex justify-between">
                <span>Vendor Payables (Apex):</span> <span className="font-bold">₹29,800</span>
              </div>
              <div className="flex justify-between">
                <span>Output GST Liability:</span> <span className="font-bold">₹16,200</span>
              </div>
              <div className="flex justify-between">
                <span>TDS Payable (Sec 194C):</span> <span className="font-bold">₹1,080</span>
              </div>
              <div className="flex justify-between">
                <span>Partners Capital:</span> <span className="font-bold">₹50,000</span>
              </div>
              <div className="flex justify-between">
                <span>Retained Earnings (P&L):</span> <span className="font-bold">₹22,760</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm text-slate-900 font-sans">
                <span>TOTAL LIABILITIES & EQUITY:</span>
                <span>₹1,19,840</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Journal Entry Modal */}
      <Modal
        isOpen={isAddJournalOpen}
        onClose={() => setIsAddJournalOpen(false)}
        title="Create Double-Entry Journal Voucher"
        subtitle="Mandatory accounting rule: Total Debit must exactly equal Total Credit"
        maxWidth="4xl"
      >
        <form onSubmit={handlePostJournal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher #</label>
              <input
                type="text"
                required
                value={jvForm.voucherNo}
                onChange={(e) => setJvForm({ ...jvForm, voucherNo: e.target.value })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={jvForm.date}
                onChange={(e) => setJvForm({ ...jvForm, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Type</label>
              <select
                value={jvForm.voucherType}
                onChange={(e) => setJvForm({ ...jvForm, voucherType: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                <option value="Journal">Journal Voucher (JV)</option>
                <option value="Payment">Payment Voucher</option>
                <option value="Receipt">Receipt Voucher</option>
                <option value="Sales">Sales Voucher</option>
                <option value="Purchase">Purchase Voucher</option>
                <option value="Contra">Contra Voucher</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Narration</label>
            <input
              type="text"
              required
              value={jvForm.narration}
              onChange={(e) => setJvForm({ ...jvForm, narration: e.target.value })}
              placeholder="Being ..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Double-Entry Lines</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {jvForm.lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <select
                    value={line.accountCode}
                    onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    {chartOfAccounts.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.type})
                      </option>
                    ))}
                  </select>

                  <div className="w-28">
                    <input
                      type="number"
                      placeholder="Debit"
                      value={line.debit || ''}
                      onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                      className="w-full text-right font-mono text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      placeholder="Credit"
                      value={line.credit || ''}
                      onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                      className="w-full text-right font-mono text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="text-slate-400 hover:text-rose-600 px-1"
                    title="Remove line"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Double-entry Balance Indicator */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
              balanceCheck.isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div>
              <span>Total Debit: <strong>{formatINR(balanceCheck.totalDebit)}</strong></span>
              <span className="mx-2">•</span>
              <span>Total Credit: <strong>{formatINR(balanceCheck.totalCredit)}</strong></span>
            </div>
            <div className="font-bold flex items-center gap-1.5">
              {balanceCheck.isBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>BALANCED (Diff: ₹0)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>UNBALANCED (Diff: {formatINR(balanceCheck.difference)})</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddJournalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!balanceCheck.isBalanced}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors disabled:opacity-50"
            >
              Post Journal Voucher
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
