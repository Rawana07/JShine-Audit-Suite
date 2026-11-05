import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  Mail,
  Send,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Calendar,
  Layers,
  FileCheck2,
  X,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TaxClient, Vendor } from '../../types/erp';
import { Modal } from '../common/Modal';
import { sendTaxClientCredentialsEmail } from '../../services/emailService';

interface TaxClientsViewProps {
  taxClients: TaxClient[];
  vendors: Vendor[];
  onAddTaxClient: (client: TaxClient) => void;
  onUpdateTaxClient: (client: TaxClient) => void;
  onDeleteTaxClient: (clientId: string) => void;
  canManage?: boolean;
}

const AVAILABLE_AYS = [
  'AY 2021-22',
  'AY 2022-23',
  'AY 2023-24',
  'AY 2024-25',
  'AY 2025-26',
  'AY 2026-27',
];

export const TaxClientsView: React.FC<TaxClientsViewProps> = ({
  taxClients,
  vendors,
  onAddTaxClient,
  onUpdateTaxClient,
  onDeleteTaxClient,
  canManage = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'ITR' | 'GST' | 'BOTH'>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [ayFilter, setAyFilter] = useState<string>('ALL');

  // Password visibility map (id -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<TaxClient | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Form states
  const [formSn, setFormSn] = useState<number>(taxClients.length + 1);
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formVendorName, setFormVendorName] = useState('');
  const [formServiceType, setFormServiceType] = useState<'ITR' | 'GST' | 'BOTH'>('ITR');
  const [formAysFiled, setFormAysFiled] = useState<string[]>(['AY 2024-25', 'AY 2025-26']);
  const [formGstin, setFormGstin] = useState('');
  const [formStatus, setFormStatus] = useState<TaxClient['status']>('Active');
  const [formNotes, setFormNotes] = useState('');
  const [formAckNumber, setFormAckNumber] = useState('');

  // Email sending status
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = taxClients.length;
    const itrCount = taxClients.filter((c) => c.serviceType === 'ITR' || c.serviceType === 'BOTH').length;
    const gstCount = taxClients.filter((c) => c.serviceType === 'GST' || c.serviceType === 'BOTH').length;
    const ay2025Count = taxClients.filter((c) => c.aysFiled.includes('AY 2025-26')).length;
    const uniqueVendors = new Set(taxClients.map((c) => c.vendorName).filter(Boolean)).size;

    return { total, itrCount, gstCount, ay2025Count, uniqueVendors };
  }, [taxClients]);

  // Distinct vendor list for filter dropdown
  const allVendorNames = useMemo(() => {
    const names = new Set<string>();
    vendors.forEach((v) => names.add(v.name));
    taxClients.forEach((c) => {
      if (c.vendorName) names.add(c.vendorName);
    });
    return Array.from(names);
  }, [vendors, taxClients]);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return taxClients.filter((client) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        client.name.toLowerCase().includes(q) ||
        client.pan.toLowerCase().includes(q) ||
        client.mobile.includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.vendorName.toLowerCase().includes(q) ||
        client.aysFiled.some((ay) => ay.toLowerCase().includes(q));

      const matchesService =
        serviceFilter === 'ALL' ||
        client.serviceType === serviceFilter ||
        (serviceFilter === 'ITR' && client.serviceType === 'BOTH') ||
        (serviceFilter === 'GST' && client.serviceType === 'BOTH');

      const matchesVendor = vendorFilter === 'ALL' || client.vendorName === vendorFilter;
      const matchesAy = ayFilter === 'ALL' || client.aysFiled.includes(ayFilter);

      return matchesSearch && matchesService && matchesVendor && matchesAy;
    });
  }, [taxClients, searchQuery, serviceFilter, vendorFilter, ayFilter]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `JSS#Tax@${code}`;
  };

  const openAddModal = () => {
    const maxSn = taxClients.reduce((max, c) => (c.sn > max ? c.sn : max), 0);
    setFormSn(maxSn + 1);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormPan('');
    setFormPassword(generateRandomPassword());
    setFormVendorName(vendors[0]?.name || 'Direct In-House (JaySoftShine)');
    setFormServiceType('ITR');
    setFormAysFiled(['AY 2024-25', 'AY 2025-26']);
    setFormGstin('');
    setFormStatus('Active');
    setFormNotes('');
    setFormAckNumber('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (client: TaxClient) => {
    setEditingClient(client);
    setFormSn(client.sn);
    setFormName(client.name);
    setFormMobile(client.mobile);
    setFormEmail(client.email);
    setFormPan(client.pan);
    setFormPassword(client.password);
    setFormVendorName(client.vendorName);
    setFormServiceType(client.serviceType);
    setFormAysFiled(client.aysFiled || []);
    setFormGstin(client.gstin || '');
    setFormStatus(client.status);
    setFormNotes(client.notes || '');
    setFormAckNumber(client.ackNumber || '');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPan = formPan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setActionNotice({
        type: 'error',
        message: 'Invalid PAN format! Must be 10 characters (e.g., ABCDE1234F).',
      });
      return;
    }

    if (editingClient) {
      const updated: TaxClient = {
        ...editingClient,
        sn: formSn,
        name: formName.trim(),
        mobile: formMobile.trim(),
        email: formEmail.trim(),
        pan: cleanPan,
        password: formPassword.trim(),
        vendorName: formVendorName.trim(),
        serviceType: formServiceType,
        aysFiled: formAysFiled,
        gstin: formGstin.trim().toUpperCase() || undefined,
        status: formStatus,
        notes: formNotes.trim() || undefined,
        ackNumber: formAckNumber.trim() || undefined,
      };

      onUpdateTaxClient(updated);
      setEditingClient(null);
      setActionNotice({
        type: 'success',
        message: `Tax client "${updated.name}" updated successfully.`,
      });
    } else {
      const newClient: TaxClient = {
        id: `tax_cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sn: formSn,
        name: formName.trim(),
        mobile: formMobile.trim(),
        email: formEmail.trim(),
        pan: cleanPan,
        password: formPassword.trim(),
        vendorName: formVendorName.trim(),
        serviceType: formServiceType,
        aysFiled: formAysFiled,
        gstin: formGstin.trim().toUpperCase() || undefined,
        status: formStatus,
        notes: formNotes.trim() || undefined,
        ackNumber: formAckNumber.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      onAddTaxClient(newClient);
      setIsAddModalOpen(false);
      setActionNotice({
        type: 'success',
        message: `New tax client "${newClient.name}" (PAN: ${newClient.pan}) onboarded successfully.`,
      });
    }

    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendCredentialsEmail = async (client: TaxClient) => {
    setSendingEmailId(client.id);
    setActionNotice(null);

    try {
      const result = await sendTaxClientCredentialsEmail({
        name: client.name,
        email: client.email,
        pan: client.pan,
        password: client.password,
        vendorName: client.vendorName,
        serviceType: client.serviceType,
        aysFiled: client.aysFiled,
      });

      if (result.success) {
        setActionNotice({
          type: 'success',
          message: `Tax credentials email dispatched to ${client.email} via Google Workspace Gmail (${result.senderEmail || 'Gmail Gateway'}).`,
        });
      } else {
        setActionNotice({
          type: 'error',
          message: `Failed to dispatch via Gmail: ${result.error}`,
        });
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: `Email dispatch error: ${err.message}`,
      });
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredClients.map((c) => ({
      'SN': c.sn,
      'NAME': c.name,
      'MOB. NO.': c.mobile,
      'EMAIL ID': c.email,
      'PAN': c.pan,
      'PASSWORD': c.password,
      'Vendor Name': c.vendorName,
      'SERVICE TYPE': c.serviceType,
      'AYs filled ITR': c.aysFiled.join(', '),
      'GSTIN': c.gstin || 'N/A',
      'STATUS': c.status,
      'ACK NUMBER': c.ackNumber || 'N/A',
      'NOTES': c.notes || '',
      'CREATED AT': c.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ITR & GST Clients');
    XLSX.writeFile(
      workbook,
      `JaySoftShine_ITR_GST_Clients_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const toggleAyFiled = (ay: string) => {
    setFormAysFiled((prev) =>
      prev.includes(ay) ? prev.filter((item) => item !== ay) : [...prev, ay]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-md">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                ITR & GST Clients Utility
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  Compliance Module
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized master utility for Income Tax Returns (ITR) and Goods & Services Tax (GST) clients, portal credentials, vendor assignments, and filled Assessment Years.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
            title="Download client directory as Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Excel
          </button>

          {canManage && (
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-950 hover:bg-black text-white flex items-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Add Tax Client
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Total Tax Clients
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active Master Directory
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            ITR Clients
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {metrics.itrCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Income Tax e-filers
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            GST Clients
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {metrics.gstCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            GSTR-1 / 3B / 9 filers
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            AY 2025-26 Filed
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {metrics.ay2025Count}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            Current Assessment Year
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Vendors Engaged
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.uniqueVendors}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Partner Tax Agencies
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3.5">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Name, PAN, Mobile, Email, Vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap">
          {/* Service Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Services</option>
              <option value="ITR">Income Tax (ITR)</option>
              <option value="GST">GST Compliance</option>
              <option value="BOTH">Both ITR & GST</option>
            </select>
          </div>

          {/* Vendor Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Vendor:</span>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-slate-900 max-w-[180px] truncate"
            >
              <option value="ALL">All Vendors</option>
              {allVendorNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* AY Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">AY:</span>
            <select
              value={ayFilter}
              onChange={(e) => setAyFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-slate-900 font-mono"
            >
              <option value="ALL">All Assessment Years</option>
              {AVAILABLE_AYS.map((ay) => (
                <option key={ay} value={ay}>
                  {ay}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-3 w-12 text-center">SN</th>
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-3">MOB. NO.</th>
                <th className="py-3 px-4">EMAIL ID</th>
                <th className="py-3 px-3">PAN</th>
                <th className="py-3 px-3">PASSWORD</th>
                <th className="py-3 px-4">Vendor Name</th>
                <th className="py-3 px-4">AYs filled ITR</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No Tax Clients Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? 'Try clearing your search query or filters.'
                        : 'Click "Add Tax Client" to onboard an ITR or GST client.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isPwdVisible = visiblePasswords[client.id];
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* SN */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                        {client.sn}
                      </td>

                      {/* NAME */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-950 flex items-center gap-1.5">
                          <span>{client.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold uppercase ${
                              client.serviceType === 'ITR'
                                ? 'bg-blue-100 text-blue-800'
                                : client.serviceType === 'GST'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {client.serviceType}
                          </span>
                        </div>
                        {client.gstin && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            GST: {client.gstin}
                          </div>
                        )}
                      </td>

                      {/* MOB. NO. */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        <a
                          href={`tel:${client.mobile}`}
                          className="hover:text-blue-600 inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.mobile}</span>
                        </a>
                      </td>

                      {/* EMAIL ID */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        <a
                          href={`mailto:${client.email}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {client.email}
                        </a>
                      </td>

                      {/* PAN */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-900 border border-slate-200">
                          <span>{client.pan}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(client.pan, `pan_${client.id}`)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                            title="Copy PAN"
                          >
                            {copiedId === `pan_${client.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* PASSWORD */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">
                          <span className="font-semibold text-slate-800 select-all">
                            {isPwdVisible ? client.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(client.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            title={isPwdVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPwdVisible ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(client.password, `pwd_${client.id}`)
                            }
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedId === `pwd_${client.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Vendor Name */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]" title={client.vendorName}>
                            {client.vendorName}
                          </span>
                        </div>
                      </td>

                      {/* AYs filled ITR */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {client.aysFiled && client.aysFiled.length > 0 ? (
                            client.aysFiled.map((ay) => (
                              <span
                                key={ay}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200"
                              >
                                {ay}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              None filed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={sendingEmailId === client.id}
                            onClick={() => handleSendCredentialsEmail(client)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Dispatch credentials via Google Workspace Gmail"
                          >
                            {sendingEmailId === client.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              <Send className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(client)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Edit client records"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingClientId(client.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete client record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Showing <strong>{filteredClients.length}</strong> of{' '}
            <strong>{taxClients.length}</strong> registered clients
          </span>
          <span className="font-mono text-slate-400">
            JaySoftShine Taxation Suite • Pan-India Compliance
          </span>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {(isAddModalOpen || editingClient) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingClient(null);
          }}
          title={editingClient ? `Edit Tax Client: ${editingClient.name}` : 'Onboard New ITR & GST Client'}
          maxWidth="4xl"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Serial Number (SN) *
                </label>
                <input
                  type="number"
                  required
                  value={formSn}
                  onChange={(e) => setFormSn(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Full Name (NAME) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Lal Sharma / ABC Corp"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (MOB. NO.) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98290 12345"
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (EMAIL ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN (10 Characters) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formPan}
                  onChange={(e) => setFormPan(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono font-bold uppercase tracking-wider"
                />
                <span className="text-[10px] text-slate-400">Format: 5 letters, 4 numbers, 1 letter</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Portal Password (PASSWORD) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPassword(generateRandomPassword())}
                    className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Type *
                </label>
                <select
                  value={formServiceType}
                  onChange={(e) => setFormServiceType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-bold"
                >
                  <option value="ITR">Income Tax Return (ITR)</option>
                  <option value="GST">GST Returns & Compliance</option>
                  <option value="BOTH">Both ITR & GST Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor Name (ITR / GST vendor) *
                </label>
                <div className="space-y-1">
                  <select
                    value={formVendorName}
                    onChange={(e) => setFormVendorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    <option value="Direct In-House (JaySoftShine)">
                      Direct In-House (JaySoftShine)
                    </option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                    <option value="Zenith Audit Services">Zenith Audit Services</option>
                    <option value="Apex Audit Solutions LLP">Apex Audit Solutions LLP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Assessment Years Checklist */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                AYs filled ITR (Assessment Years)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_AYS.map((ay) => {
                  const isChecked = formAysFiled.includes(ay);
                  return (
                    <label
                      key={ay}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAyFiled(ay)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 sr-only"
                      />
                      <span className="font-mono">{ay}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* GSTIN & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN (If Applicable)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="08BKDPV7945P1Z2"
                  value={formGstin}
                  onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Filing Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Filing">Pending Filing</option>
                  <option value="Completed">Completed</option>
                  <option value="Notice Received">Notice Received</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filing Remarks / Acknowledgement Reference
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 44AD presumptive business, filed on 28-Jul with ack ref 99881122"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClient(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-slate-950 hover:bg-black text-white rounded-xl shadow cursor-pointer transition-colors"
              >
                {editingClient ? 'Save Changes' : 'Create Tax Client Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClientId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingClientId(null)}
          title="Confirm Record Removal"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this Tax Client record? This action will permanently remove the credentials, AY filing logs, and assigned vendor association.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClientId(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTaxClient(deletingClientId);
                  setDeletingClientId(null);
                  setActionNotice({
                    type: 'success',
                    message: 'Tax client record removed successfully.',
                  });
                  setTimeout(() => setActionNotice(null), 3000);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
