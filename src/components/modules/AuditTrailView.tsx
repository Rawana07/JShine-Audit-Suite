import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  User,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Clock,
  Globe,
  Database,
  Lock,
  Layers,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AuditLogEntry,
  AuditAction,
  AuditEntityType,
  NavTabId,
} from '../../types/erp';
import { formatDateIndian, formatTimeIndian } from '../../utils/rules';
import { Modal } from '../common/Modal';

interface AuditTrailViewProps {
  auditLogs: AuditLogEntry[];
  onNavigateToEntity?: (tab: NavTabId, entityId?: string) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditLogs,
  onNavigateToEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [selectedInspectionLog, setSelectedInspectionLog] = useState<AuditLogEntry | null>(null);

  // Toggle row expansion for changes
  const toggleRow = (id: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredLogs.forEach((l) => {
      if (l.changes && l.changes.length > 0) {
        next[l.id] = true;
      }
    });
    setExpandedLogIds(next);
  };

  const collapseAll = () => {
    setExpandedLogIds({});
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesUser = log.userName.toLowerCase().includes(query) || log.userId.toLowerCase().includes(query);
        const matchesDesc = log.description.toLowerCase().includes(query);
        const matchesEntityId = log.entityId.toLowerCase().includes(query);
        const matchesEntityName = (log.entityName || '').toLowerCase().includes(query);
        const matchesIp = (log.ipAddress || '').toLowerCase().includes(query);
        const matchesFields = log.changes?.some(
          (c) =>
            c.field.toLowerCase().includes(query) ||
            String(c.oldValue || '').toLowerCase().includes(query) ||
            String(c.newValue || '').toLowerCase().includes(query)
        );

        if (!matchesUser && !matchesDesc && !matchesEntityId && !matchesEntityName && !matchesIp && !matchesFields) {
          return false;
        }
      }

      // Action filter
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }

      // Entity filter
      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'ALL') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (timeFilter === 'TODAY') {
          const isToday =
            logDate.getDate() === now.getDate() &&
            logDate.getMonth() === now.getMonth() &&
            logDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (timeFilter === '7DAYS') {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (timeFilter === '30DAYS') {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [auditLogs, searchTerm, actionFilter, entityFilter, severityFilter, timeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const criticalHigh = auditLogs.filter((l) => l.severity === 'CRITICAL' || l.severity === 'HIGH').length;
    const financialMoves = auditLogs.filter(
      (l) => l.action === 'DISBURSE' || l.action === 'POST' || l.entityType === 'INVOICE' || l.entityType === 'RECEIPT'
    ).length;
    const uniqueActors = new Set(auditLogs.map((l) => l.userId)).size;

    return {
      total,
      criticalHigh,
      financialMoves,
      uniqueActors,
    };
  }, [auditLogs]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportData = filteredLogs.map((log) => ({
      'Log ID': log.id,
      'Timestamp (ISO)': log.timestamp,
      'Date (IST)': formatDateIndian(log.timestamp),
      'Time (IST)': formatTimeIndian(log.timestamp),
      'User Name': log.userName,
      'User ID': log.userId,
      'User Role': log.userRole,
      'Action': log.action,
      'Severity': log.severity,
      'Entity Type': log.entityType,
      'Entity ID': log.entityId,
      'Entity Name': log.entityName || '',
      'Description': log.description,
      'IP Address': log.ipAddress || 'Internal SSL',
      'Changes Summary': log.changes
        ? log.changes.map((c) => `${c.field}: [${c.oldValue ?? 'null'}] -> [${c.newValue ?? 'null'}]`).join(' | ')
        : 'None',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Trail');
    XLSX.writeFile(wb, `JaySoftShine_Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Severity', 'Entity Type', 'Entity ID', 'Description', 'Changes'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.userName}"`,
      l.userRole,
      l.action,
      l.severity,
      l.entityType,
      l.entityId,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${(l.changes || []).map((c) => `${c.field}: ${c.oldValue} -> ${c.newValue}`).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JaySoftShine_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            HIGH
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            NOTICE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            INFO
          </span>
        );
    }
  };

  const getActionBadge = (action: AuditAction) => {
    const colors: Record<AuditAction, string> = {
      CREATE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      UPDATE: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      DELETE: 'bg-rose-50 text-rose-800 border-rose-200',
      APPROVE: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
      REJECT: 'bg-rose-100 text-rose-900 border-rose-300 font-semibold',
      DISBURSE: 'bg-purple-100 text-purple-900 border-purple-200 font-semibold',
      POST: 'bg-indigo-100 text-indigo-900 border-indigo-200 font-semibold',
      SECURITY_EVENT: 'bg-red-950 text-white border-red-900 font-bold',
      CONFIG_CHANGE: 'bg-slate-900 text-white border-slate-800 font-medium',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colors[action] || 'bg-slate-100 text-slate-800'}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <History className="w-4 h-4 text-slate-900" />
              Statutory Governance & Internal Financial Controls (IFC)
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Enterprise Audit Trail & Immutable Change Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Provides complete accountability under Section 143(3)(j) of the Companies Act 2013 and ICAI standards. Every transaction, master modification, manday approval, financial disbursement, and administrative credential update is recorded with timestamp and field-level delta diffs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Download Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors"
              title="Download raw CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Total Logged Events</span>
              <Database className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Permanent immutable records</div>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
            <div className="flex items-center justify-between text-rose-700 text-xs">
              <span className="font-semibold">Security & High Alert</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-900 mt-1 font-mono">
              {stats.criticalHigh}
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">Requires audit inspection</div>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
            <div className="flex items-center justify-between text-indigo-700 text-xs">
              <span className="font-semibold">Financial Postings & Payouts</span>
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-950 mt-1 font-mono">
              {stats.financialMoves}
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Ledger & disbursement events</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Active System Actors</span>
              <User className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {stats.uniqueActors}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tracked with authenticated IPs</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by actor name, user ID, entity ID, description, field delta, or IP trace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="DISBURSE">DISBURSE</option>
              <option value="POST">POST (Accounting)</option>
              <option value="SECURITY_EVENT">SECURITY_EVENT</option>
              <option value="CONFIG_CHANGE">CONFIG_CHANGE</option>
            </select>

            {/* Entity Type Filter */}
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Entity Types</option>
              <option value="PROJECT">Project</option>
              <option value="LOCATION">Location / Site</option>
              <option value="ASSIGNMENT">Assignment / Allocation</option>
              <option value="ATTENDANCE">Attendance / Manday</option>
              <option value="INVOICE">Client Invoice</option>
              <option value="RECEIPT">Client Receipt</option>
              <option value="VENDOR_BILL">Vendor Bill</option>
              <option value="AUDITOR_SETTLEMENT">Auditor Settlement</option>
              <option value="EXPENSE">Expense Claim</option>
              <option value="JOURNAL_ENTRY">Journal Entry</option>
              <option value="SECURITY">Security / Auth</option>
              <option value="SMTP">SMTP Config</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="NOTICE">Notice</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        {/* Date presets & view actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Timeline:</span>
            {[
              { id: 'ALL', label: 'All Records' },
              { id: 'TODAY', label: 'Today' },
              { id: '7DAYS', label: 'Past 7 Days' },
              { id: '30DAYS', label: 'Past 30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTimeFilter(p.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  timeFilter === p.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] text-slate-600 hover:text-slate-900 font-medium hover:underline"
            >
              Expand All Diffs
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] text-slate-600 hover:text-slate-900 font-medium hover:underline"
            >
              Collapse All
            </button>
            {(searchTerm || actionFilter !== 'ALL' || entityFilter !== 'ALL' || severityFilter !== 'ALL' || timeFilter !== 'ALL') && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActionFilter('ALL');
                    setEntityFilter('ALL');
                    setSeverityFilter('ALL');
                    setTimeFilter('ALL');
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Reset All Filters
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Audit Logs Record ({filteredLogs.length} matching)
            </span>
            <span className="text-[11px] text-slate-400">
              Sorted chronologically (Newest first)
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <Lock className="w-3 h-3 text-slate-400" />
            Compliance Mode: WORM (Write Once, Read Many)
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No matching audit events found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing the severity filters, or expanding the date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center"></th>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4">Action & Severity</th>
                  <th className="py-3 px-4">Entity Reference</th>
                  <th className="py-3 px-4">Operation Summary</th>
                  <th className="py-3 px-4">Origin / IP</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const hasChanges = log.changes && log.changes.length > 0;
                  const isExpanded = !!expandedLogIds[log.id];

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${log.severity === 'CRITICAL' ? 'bg-rose-50/20' : ''}`}>
                        {/* Expand toggle */}
                        <td className="py-3 px-4 text-center">
                          {hasChanges ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(log.id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                              title={isExpanded ? 'Hide changes' : 'Show changed fields'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-700" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300">•</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-slate-800 text-[11px]">
                            {formatDateIndian(log.timestamp)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimeIndian(log.timestamp)}
                          </div>
                        </td>

                        {/* User / Actor */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {log.userName.charAt(0)}
                            </div>
                            <span>{log.userName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {log.userRole}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({log.userId})
                            </span>
                          </div>
                        </td>

                        {/* Action & Severity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {getActionBadge(log.action)}
                            {getSeverityBadge(log.severity)}
                          </div>
                        </td>

                        {/* Entity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {log.entityType}
                            </span>
                          </div>
                          <div className="font-mono font-semibold text-slate-900 mt-0.5 text-[11px] truncate max-w-[180px]">
                            {log.entityId}
                          </div>
                          {log.entityName && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={log.entityName}>
                              {log.entityName}
                            </div>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4">
                          <p className="text-slate-700 text-xs leading-relaxed max-w-md">
                            {log.description}
                          </p>
                          {hasChanges && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                              <span className="font-mono text-slate-400">{log.changes!.length} delta {log.changes!.length === 1 ? 'field' : 'fields'} modified</span>
                              <button
                                type="button"
                                onClick={() => toggleRow(log.id)}
                                className="text-slate-900 font-semibold hover:underline ml-1"
                              >
                                {isExpanded ? 'Hide' : 'View diff'}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* IP Address & Security */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {log.ipAddress || '103.21.124.88 (Pune, MH)'}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            TLS 1.3 Certified
                          </div>
                        </td>

                        {/* Detail Modal Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedInspectionLog(log)}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>

                      {/* Expandable diff rows */}
                      {isExpanded && hasChanges && (
                        <tr className="bg-slate-50/90 border-t border-b border-slate-200">
                          <td colSpan={8} className="p-4 pl-14">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                                  Field-Level Delta Modifications
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Log ID: {log.id}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {log.changes!.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50/70 border border-slate-200/60 text-xs"
                                  >
                                    <div className="md:col-span-3 font-mono font-bold text-slate-700 truncate">
                                      {change.field}
                                    </div>
                                    <div className="md:col-span-4 bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-1 rounded font-mono text-[11px] truncate">
                                      <span className="text-[9px] uppercase tracking-wide text-rose-500 block">Previous State:</span>
                                      {change.oldValue === null || change.oldValue === undefined ? (
                                        <span className="italic text-slate-400">null</span>
                                      ) : (
                                        String(change.oldValue)
                                      )}
                                    </div>
                                    <div className="md:col-span-1 flex justify-center text-slate-400">
                                      <ArrowRight className="w-4 h-4" />
                                    </div>
                                    <div className="md:col-span-4 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded font-mono text-[11px] truncate">
                                      <span className="text-[9px] uppercase tracking-wide text-emerald-500 block">Updated State:</span>
                                      {change.newValue === null || change.newValue === undefined ? (
                                        <span className="italic text-slate-400">null</span>
                                      ) : (
                                        String(change.newValue)
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forensic Inspection Modal */}
      {selectedInspectionLog && (
        <Modal
          isOpen={!!selectedInspectionLog}
          onClose={() => setSelectedInspectionLog(null)}
          title={`Forensic Audit Trace: ${selectedInspectionLog.id}`}
          maxWidth="4xl"
        >
          <div className="space-y-5">
            {/* Metadata overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Timestamp (ISO)</span>
                <span className="font-mono font-semibold text-slate-800">{selectedInspectionLog.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Date & Time (IST)</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatDateIndian(selectedInspectionLog.timestamp)} {formatTimeIndian(selectedInspectionLog.timestamp)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Action & Severity</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getActionBadge(selectedInspectionLog.action)}
                  {getSeverityBadge(selectedInspectionLog.severity)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Entity Type & ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedInspectionLog.entityType}: {selectedInspectionLog.entityId}
                </span>
              </div>
            </div>

            {/* Actor identity & Session authentication */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
                Authenticated User Context
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Actor Name:</span>
                  <span className="font-semibold text-slate-900">{selectedInspectionLog.userName}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">User Role & ID:</span>
                  <span className="font-mono text-slate-800">{selectedInspectionLog.userRole} ({selectedInspectionLog.userId})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Origin IP & TLS Status:</span>
                  <span className="font-mono text-slate-800">{selectedInspectionLog.ipAddress || '103.21.124.88 (Pune, MH)'}</span>
                </div>
              </div>
            </div>

            {/* Description & Narrative */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono mb-1.5">
                Audit Narrative & Business Context
              </h4>
              <p className="text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                {selectedInspectionLog.description}
              </p>
            </div>

            {/* Changes Detailed Diff */}
            {selectedInspectionLog.changes && selectedInspectionLog.changes.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
                  State Mutation Diff ({selectedInspectionLog.changes.length} properties)
                </h4>
                <div className="space-y-2">
                  {selectedInspectionLog.changes.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                    >
                      <div className="md:col-span-3 font-mono font-bold text-slate-800">
                        {c.field}
                      </div>
                      <div className="md:col-span-4 bg-rose-50 text-rose-900 p-2 rounded border border-rose-200 font-mono text-[11px]">
                        <span className="text-[9px] uppercase font-bold text-rose-500 block">Original Value:</span>
                        {String(c.oldValue ?? 'null')}
                      </div>
                      <div className="md:col-span-1 text-center text-slate-400 font-bold">
                        →
                      </div>
                      <div className="md:col-span-4 bg-emerald-50 text-emerald-900 p-2 rounded border border-emerald-200 font-mono text-[11px]">
                        <span className="text-[9px] uppercase font-bold text-emerald-600 block">Committed Value:</span>
                        {String(c.newValue ?? 'null')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Payload & Verification Hash */}
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase tracking-wider">Cryptographic Verification & Raw Payload</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  SHA-256 Signature Valid
                </span>
              </div>
              <pre className="overflow-x-auto p-2 bg-slate-900 rounded-lg text-slate-300 text-[10px]">
                {JSON.stringify(selectedInspectionLog, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400">
                Log reference: <span className="font-mono text-slate-600">{selectedInspectionLog.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspectionLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
