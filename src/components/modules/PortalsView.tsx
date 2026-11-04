import React, { useState } from 'react';
import {
  ExternalLink,
  Building,
  UserCheck,
  CheckCircle2,
  Calendar,
  Camera,
  MapPin,
  Clock,
  ArrowRight,
  Receipt,
  FileText,
  Shield,
  Download,
} from 'lucide-react';
import {
  AppState,
} from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDateIndian } from '../../utils/rules';
import { NavTabId } from '../common/Sidebar';
import { exportInvoiceToPdf, exportVendorBillToPdf, exportAuditorSettlementToPdf } from '../../utils/pdfExport';

interface PortalsViewProps {
  portalType: 'vendor' | 'auditor' | 'client';
  state: AppState;
  onNavigate: (tab: NavTabId) => void;
}

export const PortalsView: React.FC<PortalsViewProps> = ({
  portalType,
  state,
  onNavigate,
}) => {
  // Vendor Portal Data (e.g. Apex Audit Solutions)
  const vendorEntity = state.vendors[0];
  const vendorAssignments = state.assignments.filter(
    (a) => a.executionType === 'VENDOR' || a.assignedToId === vendorEntity.id
  );
  const vendorLocations = state.locations.filter(
    (l) => l.assignedType === 'VENDOR' || l.assignedEntityId === vendorEntity.id
  );
  const vendorBills = state.vendorBills.filter((b) => b.vendorId === vendorEntity.id);

  // Auditor Portal Data (e.g. Rahul Sharma)
  const auditorEntity = state.auditors[0];
  const auditorAssignments = state.assignments.filter(
    (a) => a.executionType === 'DIRECT' || a.assignedToId === auditorEntity.id
  );
  const auditorLocations = state.locations.filter(
    (l) => l.assignedType === 'AUDITOR' || l.assignedEntityId === auditorEntity.id
  );
  const auditorSettlements = state.auditorSettlements.filter(
    (s) => s.auditorId === auditorEntity.id
  );

  // Client Portal Data (e.g. Tata Consumer Products)
  const clientEntity = state.clients[0];
  const clientProjects = state.projects.filter((p) => p.clientId === clientEntity.id);
  const clientInvoices = state.invoices.filter((i) => i.clientId === clientEntity.id);
  const clientReports = state.reports.filter((r) => r.status === 'Approved');

  if (portalType === 'vendor') {
    return (
      <div className="space-y-5">
        {/* Vendor Header */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
              <Building className="w-4 h-4 text-blue-400" />
              <span>Dedicated Vendor Outsourcing Portal</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{vendorEntity.name}</h2>
            <p className="text-xs text-slate-400">
              Contract Partner ID: {vendorEntity.vendorId} • GSTIN: {vendorEntity.gstin}
            </p>
          </div>
          <span className="text-xs font-mono bg-blue-900/60 text-blue-200 border border-blue-700 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            Rate: ₹{vendorEntity.defaultDayRate} / Manday
          </span>
        </div>

        {/* Vendor Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-mono uppercase">Assigned Sites</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{vendorLocations.length} Locations</div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-mono uppercase">Active Packages</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{vendorAssignments.length} Assignments</div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-mono uppercase">Settled Payments</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {formatINR(vendorBills.reduce((acc, b) => acc + b.paidAmount, 0))}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-mono uppercase">Current Dues</span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {formatINR(vendorBills.reduce((acc, b) => acc + b.outstanding, 0))}
            </div>
          </div>
        </div>

        {/* Vendor Sites Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900">
            Assigned Site Verifications
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="p-3">Location ID</th>
                <th className="p-3">Site Details</th>
                <th className="p-3">Planned Date</th>
                <th className="p-3 font-mono">Agreed Payout</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {vendorLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50 font-sans">
                  <td className="p-3 font-mono font-bold text-slate-900">{loc.locationId}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{loc.siteName}</div>
                    <div className="text-[11px] text-slate-500">{loc.city}, {loc.state}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-700">{formatDateIndian(loc.plannedVisitDate)}</td>
                  <td className="p-3 font-mono text-slate-900 font-semibold">{formatINR(loc.executionCostRate)}</td>
                  <td className="p-3"><StatusBadge status={loc.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vendor Invoices & Payment Advices */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
              Vendor Invoices & Payment Advices (Section 194C Compliant)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Official PDF Records</span>
          </div>
          <div className="space-y-2">
            {vendorBills.map((b) => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 font-mono">{b.billNumber}</div>
                  <div className="text-[11px] text-slate-500">{b.projectName} • {b.approvedMandays} Mandays</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900">{formatINR(b.netPayable)}</div>
                    <span className="text-[10px] text-slate-500">TDS: {formatINR(b.tdsDeduction)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportVendorBillToPdf(b)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Official Bill PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (portalType === 'auditor') {
    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Mobile-First Auditor Header */}
        <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-bold">
                Certified Field Auditor
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{auditorEntity.name}</h2>
              <div className="text-xs text-slate-400">{auditorEntity.phone} • {auditorEntity.email}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Standard Day Rate</span>
              <strong className="text-base text-emerald-400 font-mono">₹{auditorEntity.defaultDayRate}</strong>
            </div>
          </div>
        </div>

        {/* Quick Field Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-900 text-left shadow-xs transition-all flex flex-col justify-between"
          >
            <Clock className="w-6 h-6 text-slate-900 mb-2" />
            <div>
              <div className="font-bold text-xs text-slate-900">Today's Check-in</div>
              <div className="text-[11px] text-slate-500">Record site attendance & GPS</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('field-ops')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-900 text-left shadow-xs transition-all flex flex-col justify-between"
          >
            <Camera className="w-6 h-6 text-slate-900 mb-2" />
            <div>
              <div className="font-bold text-xs text-slate-900">Upload Site Evidence</div>
              <div className="text-[11px] text-slate-500">Physical count photos & reports</div>
            </div>
          </button>
        </div>

        {/* Today's Sites */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
            My Allocated Verification Sites ({auditorLocations.length})
          </h3>
          <div className="space-y-2">
            {auditorLocations.map((loc) => (
              <div key={loc.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{loc.siteName}</div>
                  <div className="text-slate-500 text-[11px]">{loc.city}, {loc.state} • {loc.address}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Visit: {formatDateIndian(loc.plannedVisitDate)}</div>
                </div>
                <StatusBadge status={loc.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Remuneration Settlements */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
            My Remuneration & Payout History
          </h3>
          <div className="space-y-2">
            {auditorSettlements.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 font-mono">{s.settlementNumber}</div>
                  <div className="text-[11px] text-slate-500 font-sans">{s.projectName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="font-bold text-emerald-700">{formatINR(s.netPayable)}</div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-sans">
                      {s.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportAuditorSettlementToPdf(s)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Official Settlement Voucher PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Client Portal
  return (
    <div className="space-y-5">
      {/* Client Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Client Transparency Portal</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">{clientEntity.name}</h2>
          <p className="text-xs text-slate-400">
            GSTIN: {clientEntity.gstin} • Account: {clientEntity.contactPerson}
          </p>
        </div>
        <span className="text-xs font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-700 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          MNC Enterprise Client
        </span>
      </div>

      {/* Progress & Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
            Active Audit Engagements
          </h3>
          {clientProjects.map((proj) => (
            <div key={proj.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900">{proj.name}</div>
                  <div className="text-[11px] text-slate-500">PO: {proj.poNumber} • {proj.category}</div>
                </div>
                <StatusBadge status={proj.status} size="sm" />
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-900 h-full w-2/3"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Completed: 67 / 100 Sites</span>
                <span>67% Progress</span>
              </div>
            </div>
          ))}
        </div>

        {/* Client Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
            Approved Tax Invoices
          </h3>
          <div className="space-y-2">
            {clientInvoices.map((inv) => (
              <div key={inv.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-500 font-sans">Date: {formatDateIndian(inv.invoiceDate)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900">{formatINR(inv.totalAmount)}</div>
                    <StatusBadge status={inv.status} size="sm" />
                  </div>
                  <button
                    type="button"
                    onClick={() => exportInvoiceToPdf(inv)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Official GST Tax Invoice PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
