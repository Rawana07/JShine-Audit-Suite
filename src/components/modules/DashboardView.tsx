import React from 'react';
import {
  FolderGit2,
  MapPin,
  Briefcase,
  UserCheck,
  Receipt,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Calendar,
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { KpiCard } from '../common/KpiCard';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDateIndian } from '../../utils/rules';
import { NavTabId } from '../common/Sidebar';

interface DashboardViewProps {
  state: AppState;
  onNavigate: (tab: NavTabId, entityId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ state, onNavigate }) => {
  // Compute true business KPIs from live database state
  const activeProjects = state.projects.filter((p) => p.status === 'Active').length;
  const totalLocations = state.locations.length;
  const completedLocations = state.locations.filter((l) => l.status === 'Completed').length;
  const pendingLocations = state.locations.filter(
    (l) => l.status !== 'Completed' && l.status !== 'Cancelled'
  ).length;

  // 1. Total Outstanding Receivables & Invoices
  const totalOutstandingReceivables = state.invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);
  const pendingInvoices = state.invoices.filter((inv) => inv.balanceDue > 0);
  const overdueInvoices = pendingInvoices.filter((inv) => new Date(inv.dueDate) < new Date());
  const clientPaymentsReceived = state.receipts.reduce((acc, r) => acc + r.amountReceived, 0);
  const clientTdsDeducted = state.receipts.reduce((acc, r) => acc + r.tdsDeducted, 0);

  // 2. Pending Approvals across Mandays, Reports, and Expenses
  const pendingAttendance = state.attendance.filter((a) => a.approvalStatus === 'Pending');
  const pendingReports = state.reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review');
  const pendingExpenses = (state.expenses || []).filter((e) => e.approvalStatus === 'Pending');
  const totalPendingApprovals = pendingAttendance.length + pendingReports.length + pendingExpenses.length;

  // 3. Monthly Revenue (Current active billing cycle)
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const invoiceDates = state.invoices.map((inv) => inv.invoiceDate).sort();
  const latestMonthPrefix =
    invoiceDates.length > 0 ? invoiceDates[invoiceDates.length - 1].slice(0, 7) : currentMonthPrefix;
  const targetMonthPrefix = state.invoices.some((i) => i.invoiceDate.startsWith(currentMonthPrefix))
    ? currentMonthPrefix
    : latestMonthPrefix;

  const currentMonthInvoices = state.invoices.filter((inv) => inv.invoiceDate.startsWith(targetMonthPrefix));
  const monthlyRevenue = currentMonthInvoices.reduce((acc, inv) => acc + inv.taxableAmount, 0);
  const monthlyGrossBilled = currentMonthInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  const [mYear, mMonth] = targetMonthPrefix.split('-');
  const monthName = new Date(parseInt(mYear, 10), parseInt(mMonth, 10) - 1, 1).toLocaleString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

  // Direct costs and payables
  const vendorPayable = state.vendorBills.reduce((acc, b) => acc + b.outstanding, 0);
  const auditorPayable = state.auditorSettlements.reduce((acc, s) => acc + s.outstanding, 0);

  // Profitability calculations across all projects
  const totalRevenue = state.invoices.reduce((acc, inv) => acc + inv.taxableAmount, 0);
  const totalVendorCost = state.vendorBills.reduce((acc, b) => acc + b.taxableAmount, 0);
  const totalAuditorCost = state.auditorSettlements.reduce((acc, s) => acc + s.mandayPayable, 0);
  const totalDirectCosts = totalVendorCost + totalAuditorCost;
  const totalExpenses = state.expenses
    .filter((e) => e.approvalStatus === 'Approved')
    .reduce((acc, e) => acc + e.amount, 0);

  const grossMargin = totalRevenue - totalDirectCosts;
  const netProjectProfit = grossMargin - totalExpenses;
  const marginPercentage = totalRevenue > 0 ? (netProjectProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Corporate Identity */}
      <div className="rounded-2xl bg-slate-950 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Operational Control Centre • Single Organization: JaySoftShine
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Executive Operations & Profitability Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Managing end-to-end audit lifecycle from MNC work orders, direct auditor allocations, vendor outsourcing, field mandays to billing & double-entry profitability.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="flex-1 sm:flex-none px-4 py-2 bg-white text-slate-950 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Projects Master</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('assignments')}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Allocate Work</span>
          </button>
        </div>
      </div>

      {/* Featured Executive Operational Insight Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Executive Operational Insights</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Admin Real-Time KPI Deck
            </span>
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click any card to drill into workflows
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="Total Outstanding Receivables"
            value={formatINR(totalOutstandingReceivables)}
            subtitle={`${pendingInvoices.length} invoices pending • ${formatINR(clientPaymentsReceived)} collected`}
            icon={Receipt}
            badge={
              overdueInvoices.length > 0
                ? { text: `${overdueInvoices.length} Overdue`, variant: 'rose' }
                : pendingInvoices.length > 0
                ? { text: `${pendingInvoices.length} Due`, variant: 'amber' }
                : { text: 'All Cleared', variant: 'emerald' }
            }
            onClick={() => onNavigate('billing')}
          />
          <KpiCard
            title="Pending Approvals"
            value={totalPendingApprovals}
            subtitle={`${pendingAttendance.length} Mandays • ${pendingReports.length} Reports • ${pendingExpenses.length} Expenses`}
            icon={Clock}
            badge={
              totalPendingApprovals > 0
                ? { text: `${totalPendingApprovals} Pending`, variant: 'amber' }
                : { text: 'All Cleared', variant: 'emerald' }
            }
            onClick={() => onNavigate('attendance')}
          />
          <KpiCard
            title="Monthly Revenue"
            value={formatINR(monthlyRevenue)}
            subtitle={`${monthName} Billing (${currentMonthInvoices.length} Invoices) • Gross: ${formatINR(monthlyGrossBilled)}`}
            icon={Calendar}
            badge={{ text: monthName, variant: 'blue' }}
            highlight
            onClick={() => onNavigate('billing')}
          />
        </div>
      </div>

      {/* Secondary Operational & Profitability Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard
          title="Active Projects"
          value={activeProjects}
          subtitle={`${state.projects.length} Total Projects`}
          icon={FolderGit2}
          onClick={() => onNavigate('projects')}
        />
        <KpiCard
          title="Total Sites"
          value={totalLocations}
          subtitle={`${completedLocations} Done • ${pendingLocations} Pending`}
          icon={MapPin}
          onClick={() => onNavigate('locations')}
        />
        <KpiCard
          title="Total Revenue"
          value={formatINR(totalRevenue)}
          subtitle="Taxable Invoiced"
          icon={TrendingUp}
          onClick={() => onNavigate('billing')}
        />
        <KpiCard
          title="Net Profit"
          value={formatINR(netProjectProfit)}
          subtitle={`${marginPercentage.toFixed(1)}% Net Margin`}
          icon={TrendingUp}
          trend={{ value: `${marginPercentage.toFixed(1)}%`, isPositive: netProjectProfit >= 0 }}
          onClick={() => onNavigate('accounting')}
        />
        <KpiCard
          title="Vendor Payables"
          value={formatINR(vendorPayable)}
          subtitle={`${state.vendorBills.filter((b) => b.outstanding > 0).length} Bills Due`}
          icon={Building}
          onClick={() => onNavigate('vendor-payables')}
        />
        <KpiCard
          title="Auditor Payables"
          value={formatINR(auditorPayable)}
          subtitle={`${state.auditorSettlements.filter((s) => s.outstanding > 0).length} Settlements Due`}
          icon={UserCheck}
          onClick={() => onNavigate('auditor-payables')}
        />
      </div>

      {/* Business Model Scenarios Banner (Scenarios A, B, C) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Execution Business Models (Configured & Live)</h3>
            <p className="text-xs text-slate-500">JaySoftShine operational models with independent client, vendor, and auditor commercial rates</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
            Confidential Commercial Separation Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Scenario A: Direct Auditor</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Direct</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Direct assignment to certified individual auditors.</p>
            <div className="mt-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Client Rate:</span> <span className="text-slate-800 font-semibold">₹1,500/day</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Auditor Rate:</span> <span className="text-slate-800 font-semibold">₹1,000/day</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-200 pt-1">
                <span>Gross Margin:</span> <span>₹500/day (33.3%)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Scenario B: Full Vendor Outsourcing</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Outsourced</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">100-location outsourced packages (e.g. Apex Audit Solutions).</p>
            <div className="mt-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Client Rate:</span> <span className="text-slate-800 font-semibold">₹1,500/day</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Vendor Rate:</span> <span className="text-slate-800 font-semibold">₹1,200/day</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-200 pt-1">
                <span>Gross Margin:</span> <span>₹300/day (20.0%)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Scenario C: Hybrid Execution</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Hybrid</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Blended: 20 Direct Sites + 80 Vendor Sites under 1 project.</p>
            <div className="mt-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Total 100 Mandays:</span> <span className="text-slate-800 font-semibold">₹1,50,000 Rev</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Direct Cost:</span> <span className="text-slate-800 font-semibold">₹1,16,000 Cost</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-200 pt-1">
                <span>Blended Margin:</span> <span>₹34,000 (22.7%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Active Projects Table & Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects (2 columns on large screen) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Projects Overview</h3>
              <p className="text-xs text-slate-500">Real-time status, execution model, and location progress</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              <span>View All Projects</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Project ID & Name</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Execution</th>
                  <th className="py-2.5 px-3">Locations</th>
                  <th className="py-2.5 px-3">Client Rate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.projects.map((proj) => {
                  const projLocs = state.locations.filter((l) => l.projectId === proj.id);
                  const completed = projLocs.filter((l) => l.status === 'Completed').length;
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{proj.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{proj.projectId} • {proj.category}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {proj.clientName}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          proj.executionModel === 'DIRECT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proj.executionModel === 'VENDOR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {proj.executionModel}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {completed} / {projLocs.length || proj.totalLocations}
                        </div>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full"
                            style={{
                              width: `${
                                projLocs.length > 0 ? (completed / projLocs.length) * 100 : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        {formatINR(proj.clientRatePerManday)}/day
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={proj.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate('projects', proj.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white rounded text-slate-800 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Queues: Approvals & Financial Tasks */}
        <div className="space-y-4">
          {/* Attendance Approval Queue */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pending Approvals
                </h4>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingAttendance.length + pendingReports.length}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              {pendingAttendance.length > 0 ? (
                pendingAttendance.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{a.auditorName || a.vendorName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{a.locationName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{a.mandays} Manday • {a.workDate}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('attendance')}
                      className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-black"
                    >
                      Review
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-xs text-slate-400">
                  No attendance pending approval
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Operational Actions
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('locations')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left font-medium text-slate-800 flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-slate-600" />
                <span>Bulk Excel Import</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('billing')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left font-medium text-slate-800 flex items-center gap-2"
              >
                <Receipt className="w-4 h-4 text-slate-600" />
                <span>Raise GST Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auditor-payables')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left font-medium text-slate-800 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span>Auditor Settlements</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('accounting')}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left font-medium text-slate-800 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>Trial Balance & JV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
