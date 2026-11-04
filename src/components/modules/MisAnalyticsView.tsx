import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  Download,
  Percent,
} from 'lucide-react';
import { Project, ClientInvoice, VendorBill, AuditorSettlement, ProjectLocation, ExpenseRecord } from '../../types/erp';
import { formatINR } from '../../utils/rules';

interface MisAnalyticsViewProps {
  projects: Project[];
  invoices: ClientInvoice[];
  vendorBills: VendorBill[];
  auditorSettlements: AuditorSettlement[];
  locations: ProjectLocation[];
  expenses: ExpenseRecord[];
}

export const MisAnalyticsView: React.FC<MisAnalyticsViewProps> = ({
  projects,
  invoices,
  vendorBills,
  auditorSettlements,
  locations,
  expenses,
}) => {
  // Profitability calculations per project
  const projectMetrics = projects.map((proj) => {
    const projInvoices = invoices.filter((i) => i.projectId === proj.id);
    const revenue = projInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0) || proj.budget;

    const projVendorBills = vendorBills.filter((b) => b.projectId === proj.id);
    const vendorCost = projVendorBills.reduce((sum, b) => sum + b.taxableAmount, 0);

    const projSettlements = auditorSettlements.filter((s) => s.projectId === proj.id);
    const auditorCost = projSettlements.reduce((sum, s) => sum + s.mandayPayable, 0);

    const directCost = vendorCost + auditorCost;
    const grossMargin = revenue - directCost;

    const projExpenses = expenses.filter((e) => e.projectId === proj.id && e.approvalStatus === 'Approved');
    const totalExpenses = projExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = grossMargin - totalExpenses;
    const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      id: proj.id,
      code: proj.projectId,
      name: proj.name,
      clientName: proj.clientName,
      executionModel: proj.executionModel,
      revenue,
      vendorCost,
      auditorCost,
      directCost,
      grossMargin,
      expenses: totalExpenses,
      netProfit,
      marginPercent,
    };
  });

  // State-wise distribution
  const stateCounts: Record<string, number> = {};
  locations.forEach((loc) => {
    stateCounts[loc.state] = (stateCounts[loc.state] || 0) + 1;
  });

  // Direct vs Outsourced split
  const directLocations = locations.filter((l) => l.assignedType === 'AUDITOR').length;
  const vendorLocations = locations.filter((l) => l.assignedType === 'VENDOR').length;
  const unallocatedLocations = locations.filter((l) => !l.assignedType).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">MIS & Profitability Analytics</h2>
          <p className="text-xs text-slate-500">
            Project-wise gross margins, direct vs outsourced execution split, state distribution and net profitability.
          </p>
        </div>
      </div>

      {/* Direct vs Outsourced Execution Split Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Field Execution Model Allocation (Direct vs Vendor Outsourced)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-mono text-emerald-800 uppercase font-semibold">Direct Auditor Execution</span>
            <div className="text-2xl font-bold text-emerald-950 mt-1">{directLocations} Sites</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Assigned to certified in-house auditors (33.3% Margin)</p>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-[11px] font-mono text-blue-800 uppercase font-semibold">Vendor Outsourced Sites</span>
            <div className="text-2xl font-bold text-blue-950 mt-1">{vendorLocations} Sites</div>
            <p className="text-[11px] text-blue-700 mt-0.5">Managed by Apex Audit Solutions & partners (20.0% Margin)</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-mono text-slate-600 uppercase font-semibold">Unallocated Sites</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{unallocatedLocations} Sites</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for assignment wizard allocation</p>
          </div>
        </div>
      </div>

      {/* Project Profitability Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Project-Wise Profitability Statement</span>
          <span className="text-[11px] font-mono text-slate-500">Live Double-Entry Ledgers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-sans">Project</th>
                <th className="py-3 px-3">Execution</th>
                <th className="py-3 px-3 text-right">Revenue (₹)</th>
                <th className="py-3 px-3 text-right">Vendor Cost (₹)</th>
                <th className="py-3 px-3 text-right">Auditor Cost (₹)</th>
                <th className="py-3 px-3 text-right">Expenses (₹)</th>
                <th className="py-3 px-3 text-right">Net Profit (₹)</th>
                <th className="py-3 px-3 text-right">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectMetrics.map((pm) => (
                <tr key={pm.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-sans">
                    <div className="font-bold text-slate-900">{pm.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{pm.code} • {pm.clientName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pm.executionModel === 'DIRECT' ? 'bg-emerald-100 text-emerald-800' :
                      pm.executionModel === 'VENDOR' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {pm.executionModel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(pm.revenue)}</td>
                  <td className="py-3 px-3 text-right text-rose-600">{pm.vendorCost > 0 ? `-${formatINR(pm.vendorCost)}` : '-'}</td>
                  <td className="py-3 px-3 text-right text-rose-600">{pm.auditorCost > 0 ? `-${formatINR(pm.auditorCost)}` : '-'}</td>
                  <td className="py-3 px-3 text-right text-amber-600">{pm.expenses > 0 ? `-${formatINR(pm.expenses)}` : '-'}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700 text-sm">
                    {formatINR(pm.netProfit)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">
                    {pm.marginPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* State-Wise Geographic Execution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          State-Wise Site Verification Spread
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-xs">
          {Object.entries(stateCounts).map(([state, count]) => (
            <div key={state} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">{state}</span>
                <span className="text-[10px] text-slate-400 font-mono">India Region</span>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                {count} Sites
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
