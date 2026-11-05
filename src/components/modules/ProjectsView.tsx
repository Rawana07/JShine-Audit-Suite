import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  Receipt,
  TrendingUp,
  FileText,
  Clock,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Download,
  Trash2,
} from 'lucide-react';
import {
  Project,
  ProjectLocation,
  Assignment,
  AttendanceRecord,
  WorkReport,
  ClientInvoice,
  VendorBill,
  AuditorSettlement,
  ExpenseRecord,
  Client,
  Vendor,
  Auditor,
  ProjectCategory,
  ExecutionModel,
  AuditLogEntry,
  ProjectSyncConfig,
} from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian, formatTimeIndian } from '../../utils/rules';
import { NavTabId } from '../common/Sidebar';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  vendors?: Vendor[];
  auditors?: Auditor[];
  locations: ProjectLocation[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
  reports: WorkReport[];
  invoices: ClientInvoice[];
  vendorBills: VendorBill[];
  auditorSettlements: AuditorSettlement[];
  expenses: ExpenseRecord[];
  auditLogs?: AuditLogEntry[];
  initialSelectedProjectId?: string | null;
  onAddProject: (project: Project, syncConfig?: ProjectSyncConfig) => void;
  onDeleteProject?: (projectId: string) => void;
  onNavigate: (tab: NavTabId, entityId?: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  vendors = [],
  auditors = [],
  locations,
  assignments,
  attendance,
  reports,
  invoices,
  vendorBills,
  auditorSettlements,
  expenses,
  auditLogs = [],
  initialSelectedProjectId,
  onAddProject,
  onDeleteProject,
  onNavigate,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialSelectedProjectId || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'locations' | 'assignments' | 'attendance' | 'reports' | 'invoices' | 'payables' | 'profitability' | 'audit'
  >('overview');

  // Form State with Multi-Entity Commercial Sync
  const [newProject, setNewProject] = useState({
    name: '',
    clientId: clients[0]?.id || '',
    poNumber: '',
    category: 'Physical Verification' as ProjectCategory,
    executionModel: 'DIRECT' as ExecutionModel,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    totalLocations: 5,
    mandaysPerLocation: 2,
    clientRatePerManday: 1800,
    assignedAuditorId: auditors[0]?.id || '',
    assignedVendorId: vendors[0]?.id || '',
    executionCostRate: auditors[0]?.defaultDayRate || 1000,
    cityList: 'Mumbai, Pune, Ahmedabad, Jaipur, Delhi NCR',
    instructions: '100% itemized verification, barcode scan count, discrepancy verification and sign-off.',
    autoGenerateLocations: true,
    autoGenerateWorkOrder: true,
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = selectedModel === 'ALL' || p.executionModel === selectedModel;
    return matchesSearch && matchesModel;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSeq = projects.length + 1;
    const projectId = `JSS-2026-${String(nextSeq).padStart(4, '0')}`;
    const selectedClient = clients.find((c) => c.id === newProject.clientId);

    const locCount = Math.max(1, Number(newProject.totalLocations) || 1);
    const mandaysPerLoc = Math.max(1, Number(newProject.mandaysPerLocation) || 1);
    const totalMandays = locCount * mandaysPerLoc;
    const clientRate = Math.max(1, Number(newProject.clientRatePerManday) || 1500);
    const execRate = Math.max(0, Number(newProject.executionCostRate) || 1000);
    const totalRevenue = totalMandays * clientRate;

    // Resolve assigned entity
    let assignedId = '';
    let assignedName = '';
    if (newProject.executionModel === 'DIRECT') {
      const aud = auditors.find((a) => a.id === newProject.assignedAuditorId) || auditors[0];
      assignedId = aud ? aud.id : '';
      assignedName = aud ? aud.name : 'Field Auditor';
    } else if (newProject.executionModel === 'VENDOR') {
      const vnd = vendors.find((v) => v.id === newProject.assignedVendorId) || vendors[0];
      assignedId = vnd ? vnd.id : '';
      assignedName = vnd ? vnd.name : 'Vendor Partner';
    } else {
      const vnd = vendors.find((v) => v.id === newProject.assignedVendorId) || vendors[0];
      assignedId = vnd ? vnd.id : (auditors[0]?.id || '');
      assignedName = vnd ? vnd.name : (auditors[0]?.name || 'Hybrid Partner');
    }

    const project: Project = {
      id: `prj_${Date.now()}`,
      projectId,
      name: newProject.name,
      clientId: newProject.clientId,
      clientName: selectedClient ? selectedClient.name : 'Client',
      poNumber: newProject.poNumber,
      category: newProject.category,
      executionModel: newProject.executionModel,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      totalLocations: locCount,
      estimatedMandays: totalMandays,
      clientRatePerManday: clientRate,
      billingType: 'Per Manday',
      gstRatePercent: 18,
      budget: totalRevenue,
      instructions: newProject.instructions,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const syncConfig: ProjectSyncConfig = {
      assignedEntityId: assignedId,
      assignedEntityName: assignedName,
      assignedType: newProject.executionModel === 'VENDOR' ? 'VENDOR' : 'AUDITOR',
      executionCostRate: execRate,
      mandaysPerLocation: mandaysPerLoc,
      cities: newProject.cityList.split(',').map((c) => c.trim()).filter(Boolean),
      autoGenerateLocations: newProject.autoGenerateLocations,
      autoGenerateAssignment: newProject.autoGenerateWorkOrder,
    };

    onAddProject(project, syncConfig);
    setIsAddModalOpen(false);
    setSelectedProjectId(project.id);
  };

  // If a project is selected for detail view:
  if (selectedProject) {
    const projLocations = locations.filter((l) => l.projectId === selectedProject.id);
    const projAssignments = assignments.filter((a) => a.projectId === selectedProject.id);
    const projAttendance = attendance.filter((a) => a.projectId === selectedProject.id);
    const projReports = reports.filter((r) => r.projectId === selectedProject.id);
    const projInvoices = invoices.filter((i) => i.projectId === selectedProject.id);
    const projVendorBills = vendorBills.filter((v) => v.projectId === selectedProject.id);
    const projAuditorSettlements = auditorSettlements.filter((s) => s.projectId === selectedProject.id);
    const projExpenses = expenses.filter((e) => e.projectId === selectedProject.id);
    const projAuditLogs = auditLogs.filter(
      (l) =>
        l.entityId === selectedProject.id ||
        l.entityId === selectedProject.projectId ||
        (l.entityName && l.entityName.includes(selectedProject.projectId)) ||
        l.description.includes(selectedProject.projectId) ||
        l.description.includes(selectedProject.name)
    );

    // Dynamic Profitability calculations
    const approvedMandays = projAttendance
      .filter((a) => a.approvalStatus === 'Approved')
      .reduce((sum, a) => sum + a.mandays, 0);

    const billedRevenue = projInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);
    const expectedRevenue = approvedMandays > 0
      ? approvedMandays * selectedProject.clientRatePerManday
      : selectedProject.budget;

    const vendorCosts = projVendorBills.reduce((sum, vb) => sum + vb.taxableAmount, 0);
    const auditorCosts = projAuditorSettlements.reduce((sum, s) => sum + s.mandayPayable, 0);
    const totalDirectCosts = vendorCosts + auditorCosts;

    const totalProjectExpenses = projExpenses
      .filter((e) => e.approvalStatus === 'Approved')
      .reduce((sum, e) => sum + e.amount, 0);

    const grossMargin = billedRevenue - totalDirectCosts;
    const netProjectProfit = grossMargin - totalProjectExpenses;
    const grossMarginPercent = billedRevenue > 0 ? (grossMargin / billedRevenue) * 100 : 0;
    const netProfitPercent = billedRevenue > 0 ? (netProjectProfit / billedRevenue) * 100 : 0;

    return (
      <div className="space-y-5">
        {/* Top Back bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects List</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
              selectedProject.executionModel === 'DIRECT'
                ? 'bg-emerald-100 text-emerald-800'
                : selectedProject.executionModel === 'VENDOR'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              Scenario: {selectedProject.executionModel} Execution
            </span>
            <StatusBadge status={selectedProject.status} />
          </div>
        </div>

        {/* Project Header summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedProject.projectId}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-600">{selectedProject.category}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedProject.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <div>Client: <strong className="text-slate-800">{selectedProject.clientName}</strong></div>
                <div>PO/WO: <span className="font-mono text-slate-800">{selectedProject.poNumber || 'N/A'}</span></div>
                <div>Timeline: <span className="text-slate-800">{formatDateIndian(selectedProject.startDate)} to {formatDateIndian(selectedProject.endDate)}</span></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right font-mono">
                <div className="text-[10px] text-slate-400 uppercase">Client Billing Rate</div>
                <div className="text-base font-bold text-slate-900">{formatINR(selectedProject.clientRatePerManday)}/day</div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
              >
                Allocate New Locations
              </button>
              {onDeleteProject && (
                <button
                  type="button"
                  onClick={() => setProjectToDelete(selectedProject)}
                  title="Delete Project"
                  className="p-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation tabs within Project */}
          <div className="flex items-center gap-1 border-b border-slate-200 mt-6 overflow-x-auto pb-px">
            {[
              { id: 'overview', label: 'Overview & KPIs' },
              { id: 'locations', label: `Locations (${projLocations.length})` },
              { id: 'assignments', label: `Assignments (${projAssignments.length})` },
              { id: 'attendance', label: `Attendance (${projAttendance.length})` },
              { id: 'reports', label: `Reports (${projReports.length})` },
              { id: 'invoices', label: `Billing & Invoices (${projInvoices.length})` },
              { id: 'payables', label: 'Payables (Vendor/Auditor)' },
              { id: 'profitability', label: 'Profitability Engine' },
              { id: 'audit', label: `Audit Trail (${projAuditLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  detailTab === tab.id
                    ? 'border-slate-950 text-slate-950 bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {detailTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 uppercase font-mono">Locations Progress</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {projLocations.filter((l) => l.status === 'Completed').length} / {projLocations.length || selectedProject.totalLocations}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Sites physically completed</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 uppercase font-mono">Approved Mandays</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{approvedMandays} Days</div>
              <p className="text-[11px] text-slate-400 mt-1">Target: {selectedProject.estimatedMandays} Mandays</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 uppercase font-mono">Billed Client Revenue</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{formatINR(billedRevenue)}</div>
              <p className="text-[11px] text-slate-400 mt-1">{projInvoices.length} Invoices raised</p>
            </div>

            <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-900">
              <div className="text-xs text-slate-400 uppercase font-mono">Net Project Profit</div>
              <div className="text-2xl font-bold text-white mt-1">{formatINR(netProjectProfit)}</div>
              <p className="text-[11px] text-emerald-400 mt-1">{netProfitPercent.toFixed(1)}% Net Margin</p>
            </div>

            {selectedProject.instructions && (
              <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Project Execution Instructions
                </h4>
                <p className="text-xs text-slate-700">{selectedProject.instructions}</p>
              </div>
            )}
          </div>
        )}

        {detailTab === 'locations' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Project Sites ({projLocations.length})</span>
              <button
                type="button"
                onClick={() => onNavigate('locations')}
                className="text-xs font-semibold text-slate-900 hover:underline"
              >
                Import / Manage Locations &rarr;
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Location ID</th>
                  <th className="py-2.5 px-3">Site Name & City</th>
                  <th className="py-2.5 px-3">Assigned Resource</th>
                  <th className="py-2.5 px-3">Client Rate</th>
                  <th className="py-2.5 px-3">Execution Cost</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{loc.locationId}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{loc.siteName}</div>
                      <div className="text-[11px] text-slate-500">{loc.city}, {loc.state}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {loc.assignedEntityName ? (
                        <div>
                          <div className="font-medium text-slate-900">{loc.assignedEntityName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{loc.assignedType}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unallocated</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{formatINR(loc.clientBillingRate)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{formatINR(loc.executionCostRate)}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={loc.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detailTab === 'profitability' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Project Profitability Engine (Live Double-Entry Sync)</h3>
                <p className="text-xs text-slate-500">
                  Gross Margin = Billed Revenue - Direct Costs (Vendor + Auditor) • Net Profit = Gross Margin - Approved Expenses
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                Net Margin: {netProfitPercent.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">1. Billed Revenue</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{formatINR(billedRevenue)}</div>
                <div className="text-[11px] text-slate-500 mt-1">Excludes GST output liabilities</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">2. Direct Execution Cost</span>
                <div className="text-2xl font-bold text-rose-700 mt-1">{formatINR(totalDirectCosts)}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Vendors: {formatINR(vendorCosts)} • Auditors: {formatINR(auditorCosts)}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">3. Variable Expenses</span>
                <div className="text-2xl font-bold text-amber-700 mt-1">{formatINR(totalProjectExpenses)}</div>
                <div className="text-[11px] text-slate-500 mt-1">Travel, food, hotel claims</div>
              </div>
            </div>

            {/* Profitability Waterfall */}
            <div className="p-4 rounded-xl bg-slate-950 text-white font-mono text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Client Billing (Taxable Service Revenue):</span>
                <span className="text-white font-bold">{formatINR(billedRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span>(-) Direct Vendor Outsourcing Costs:</span>
                <span>-{formatINR(vendorCosts)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span>(-) Direct Auditor Manday Fees:</span>
                <span>-{formatINR(auditorCosts)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-emerald-400 font-bold">
                <span>(=) Project Gross Margin:</span>
                <span>{formatINR(grossMargin)} ({grossMarginPercent.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center text-amber-400">
                <span>(-) Field Conveyance & Approved Expenses:</span>
                <span>-{formatINR(totalProjectExpenses)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-emerald-400 font-extrabold text-sm">
                <span>(=) NET PROJECT PROFIT:</span>
                <span>{formatINR(netProjectProfit)} ({netProfitPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs fallback */}
        {(detailTab === 'assignments' || detailTab === 'attendance' || detailTab === 'reports' || detailTab === 'invoices' || detailTab === 'payables') && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-800 mb-1">Detailed {detailTab} records for {selectedProject.projectId}</p>
            <p className="text-slate-500 mb-4">You can also view and edit these in the dedicated module views.</p>
            <button
              type="button"
              onClick={() => {
                if (detailTab === 'assignments') onNavigate('assignments');
                else if (detailTab === 'attendance') onNavigate('attendance');
                else if (detailTab === 'reports') onNavigate('documents');
                else if (detailTab === 'invoices') onNavigate('billing');
                else if (detailTab === 'payables') onNavigate('vendor-payables');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
            >
              Open {detailTab.toUpperCase()} Module
            </button>
          </div>
        )}

        {/* Audit Trail Tab */}
        {detailTab === 'audit' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-mono">
                  Project Lifecycle Audit Records ({projAuditLogs.length} events logged)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Chronological trail of work orders, manday signoffs, client invoices, and changes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('audit-trail')}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
              >
                Open Full System Audit Log
              </button>
            </div>

            {projAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No specific audit logs tagged directly for {selectedProject.projectId} yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Date / Time (IST)</th>
                      <th className="py-2.5 px-4">Actor</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap">
                          {formatDateIndian(log.timestamp)} {formatTimeIndian(log.timestamp)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-900">{log.userName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{log.userRole}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 max-w-xs">{log.description}</td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {log.changes && log.changes.length > 0 ? (
                            <div className="space-y-0.5">
                              {log.changes.map((c, i) => (
                                <div key={i} className="text-[10px]">
                                  <span className="text-slate-700 font-bold">{c.field}:</span>{' '}
                                  <span className="text-rose-600 line-through">{String(c.oldValue ?? 'null')}</span> &rarr;{' '}
                                  <span className="text-emerald-700">{String(c.newValue ?? 'null')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No delta</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Projects Master Table List View
  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Projects Master</h2>
          <p className="text-xs text-slate-500">
            Audit outsourcing, physical verification, stock verification, fixed asset tagging & loss assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Project ID, Name, Client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
          >
            <option value="ALL">All Execution Models</option>
            <option value="DIRECT">Scenario A: Direct Auditor</option>
            <option value="VENDOR">Scenario B: Vendor Outsourced</option>
            <option value="HYBRID">Scenario C: Hybrid Model</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project ID & Name</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Execution Model</th>
                <th className="py-3 px-4">Locations</th>
                <th className="py-3 px-4">Client Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((proj) => {
                const projLocs = locations.filter((l) => l.projectId === proj.id);
                const completed = projLocs.filter((l) => l.status === 'Completed').length;
                return (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{proj.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {proj.projectId} • {formatDateIndian(proj.startDate)} to {formatDateIndian(proj.endDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{proj.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">{proj.category}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {completed} / {projLocs.length || proj.totalLocations} Sites
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {formatINR(proj.clientRatePerManday)}/day
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={proj.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectId(proj.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-black rounded transition-colors"
                        >
                          Manage &rarr;
                        </button>
                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(proj);
                            }}
                            title="Delete Project"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Audit Project"
        subtitle="Configure project parameters, execution model, client commercial rate and budget"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g. Pan-India Fixed Asset Verification & Barcode Tagging"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Client <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={newProject.clientId}
                onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.clientId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client PO / Work Order #</label>
              <input
                type="text"
                value={newProject.poNumber}
                onChange={(e) => setNewProject({ ...newProject, poNumber: e.target.value })}
                placeholder="PO-2026-9901"
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                <option value="Physical Verification">Physical Verification</option>
                <option value="Stock Audit">Stock Audit</option>
                <option value="Inventory Verification">Inventory Verification</option>
                <option value="Fixed Asset Verification">Fixed Asset Verification</option>
                <option value="Asset Tagging">Asset Tagging</option>
                <option value="Internal Audit">Internal Audit</option>
                <option value="Compliance Audit">Compliance Audit</option>
                <option value="Mystery Audit">Mystery Audit</option>
                <option value="Insurance Survey">Insurance Survey</option>
                <option value="Loss Assessment">Loss Assessment</option>
                <option value="Quality Audit">Quality Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Execution Model <span className="text-rose-500">*</span>
              </label>
              <select
                value={newProject.executionModel}
                onChange={(e) => {
                  const model = e.target.value as ExecutionModel;
                  let defaultRate = newProject.executionCostRate;
                  if (model === 'DIRECT') {
                    const aud = auditors.find((a) => a.id === newProject.assignedAuditorId) || auditors[0];
                    defaultRate = aud?.defaultDayRate || 1000;
                  } else if (model === 'VENDOR') {
                    const vnd = vendors.find((v) => v.id === newProject.assignedVendorId) || vendors[0];
                    defaultRate = vnd?.defaultDayRate || 1200;
                  }
                  setNewProject({ ...newProject, executionModel: model, executionCostRate: defaultRate });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                <option value="DIRECT">Scenario A: Direct Auditor Assignment (In-house)</option>
                <option value="VENDOR">Scenario B: Complete Vendor Outsourcing (Partner Agency)</option>
                <option value="HYBRID">Scenario C: Hybrid Execution (Outsourced + Direct)</option>
              </select>
            </div>

            {/* Execution Partner Selection */}
            {newProject.executionModel === 'DIRECT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Lead Field Auditor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newProject.assignedAuditorId}
                  onChange={(e) => {
                    const aud = auditors.find((a) => a.id === e.target.value);
                    setNewProject({
                      ...newProject,
                      assignedAuditorId: e.target.value,
                      executionCostRate: aud?.defaultDayRate || newProject.executionCostRate,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
                >
                  {auditors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.city || 'HQ'} – ₹{a.defaultDayRate}/day)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newProject.executionModel === 'VENDOR' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Vendor Partner <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newProject.assignedVendorId}
                  onChange={(e) => {
                    const vnd = vendors.find((v) => v.id === e.target.value);
                    setNewProject({
                      ...newProject,
                      assignedVendorId: e.target.value,
                      executionCostRate: vnd?.defaultDayRate || newProject.executionCostRate,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.state} – ₹{v.defaultDayRate}/day)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newProject.executionModel === 'HYBRID' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Vendor Agency</label>
                  <select
                    value={newProject.assignedVendorId}
                    onChange={(e) => setNewProject({ ...newProject, assignedVendorId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.state})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Oversight Auditor</label>
                  <select
                    value={newProject.assignedAuditorId}
                    onChange={(e) => setNewProject({ ...newProject, assignedAuditorId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
                  >
                    {auditors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.city || 'HQ'})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={newProject.endDate}
                onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Site Locations</label>
              <input
                type="number"
                min={1}
                required
                value={newProject.totalLocations}
                onChange={(e) => setNewProject({ ...newProject, totalLocations: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mandays Per Location</label>
              <input
                type="number"
                min={1}
                required
                value={newProject.mandaysPerLocation}
                onChange={(e) => setNewProject({ ...newProject, mandaysPerLocation: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Billing Rate (₹ / Manday) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={100}
                required
                value={newProject.clientRatePerManday}
                onChange={(e) => setNewProject({ ...newProject, clientRatePerManday: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Partner / Auditor Cost Rate (₹ / Manday) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={100}
                required
                value={newProject.executionCostRate}
                onChange={(e) => setNewProject({ ...newProject, executionCostRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Cities / Distribution Hubs (Comma Separated)
              </label>
              <input
                type="text"
                value={newProject.cityList}
                onChange={(e) => setNewProject({ ...newProject, cityList: e.target.value })}
                placeholder="Mumbai, Pune, Ahmedabad, Jaipur, Delhi NCR"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Live Synchronized Commercial & Profitability Preview */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Live Commercial & Profitability Sync Preview
                </span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-200 rounded text-slate-700">
                  Total Mandays: {Number(newProject.totalLocations) * Number(newProject.mandaysPerLocation || 1)} Days
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Client Revenue (Fees)</div>
                  <div className="text-sm font-bold text-slate-900">
                    {formatINR(
                      Number(newProject.totalLocations) *
                        Number(newProject.mandaysPerLocation || 1) *
                        Number(newProject.clientRatePerManday || 0)
                    )}
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Direct Execution Cost</div>
                  <div className="text-sm font-bold text-rose-600">
                    {formatINR(
                      Number(newProject.totalLocations) *
                        Number(newProject.mandaysPerLocation || 1) *
                        Number(newProject.executionCostRate || 0)
                    )}
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Gross Margin</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatINR(
                      Number(newProject.totalLocations) *
                        Number(newProject.mandaysPerLocation || 1) *
                        (Number(newProject.clientRatePerManday || 0) - Number(newProject.executionCostRate || 0))
                    )}
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Projected Margin %</div>
                  <div className="text-sm font-bold text-indigo-600">
                    {newProject.clientRatePerManday > 0
                      ? (
                          ((Number(newProject.clientRatePerManday) - Number(newProject.executionCostRate)) /
                            Number(newProject.clientRatePerManday)) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  Immediate Multi-Way Sync: Creating this project automatically generates official locations in the Site Master, assigns the Work Order, and synchronizes live with the Vendor Portal, Auditor Field App, and Client Portal.
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSyncCheck"
                checked={newProject.autoGenerateLocations}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    autoGenerateLocations: e.target.checked,
                    autoGenerateWorkOrder: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="autoSyncCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                Auto-generate and allocate site locations with work order assignment (Recommended)
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Instructions & Scope</label>
              <textarea
                rows={2}
                value={newProject.instructions}
                onChange={(e) => setNewProject({ ...newProject, instructions: e.target.value })}
                placeholder="Specific instructions for auditors or vendors regarding scanning, counts, and sign-offs..."
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Create & Sync Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <Modal
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          title="Confirm Project Deletion"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <p className="font-semibold text-sm mb-1">Delete project permanently?</p>
              <p className="text-[11px]">
                This will delete the project record and its associations from the ERP system.
              </p>
              <div className="mt-2 font-mono font-bold text-slate-900 bg-white/80 p-2 rounded border border-rose-100">
                {projectToDelete.projectId}: {projectToDelete.name}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProject && projectToDelete) {
                    onDeleteProject(projectToDelete.id);
                    if (selectedProjectId === projectToDelete.id) {
                      setSelectedProjectId(null);
                    }
                  }
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
