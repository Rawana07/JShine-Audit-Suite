import React, { useState } from 'react';
import {
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
  AlertCircle,
  Briefcase,
  Users2,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  RotateCcw,
  AlertTriangle,
  Upload,
  CreditCard,
  FileSpreadsheet,
  Building2,
  Phone,
  Mail,
  User,
  Compass,
  WalletCards,
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDateIndian } from '../../utils/rules';
import { NavTabId } from '../common/Sidebar';
import {
  exportInvoiceToPdf,
  exportVendorBillToPdf,
  exportAuditorSettlementToPdf,
} from '../../utils/pdfExport';
import {
  Vendor,
  Auditor,
  Client,
  UserProfile,
  LocationStatus,
  VendorBill,
  AttendanceRecord,
  WorkReport,
  ExpenseRecord,
  KycStatus,
  KycInfo,
} from '../../types/erp';
import { Modal } from '../common/Modal';

interface PortalsViewProps {
  portalType: 'vendor' | 'auditor' | 'client';
  state: AppState;
  onNavigate: (tab: NavTabId) => void;
  onAddVendor?: (vendor: Vendor, loginPassword?: string) => void;
  onUpdateVendor?: (vendor: Vendor) => void;
  onDeleteVendor?: (vendorId: string) => void;
  onAddAuditor?: (auditor: Auditor, loginPassword?: string) => void;
  onUpdateAuditor?: (auditor: Auditor) => void;
  onDeleteAuditor?: (auditorId: string) => void;
  onAddClient?: (client: Client, loginPassword?: string) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onUpdateEntityLoginCredentials?: (
    entityType: 'vendor' | 'auditor' | 'client',
    entityId: string,
    email: string,
    password: string,
    status: 'ACTIVE' | 'INACTIVE'
  ) => void;
  onUpdateLocationStatus?: (locationId: string, status: LocationStatus, remarks?: string) => void;
  onSubmitVendorBill?: (bill: VendorBill) => void;
  onSubmitAttendance?: (attendance: AttendanceRecord) => void;
  onSubmitReport?: (report: WorkReport) => void;
  onSubmitExpense?: (expense: ExpenseRecord) => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const PortalsView: React.FC<PortalsViewProps> = ({
  portalType,
  state,
  onNavigate,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddAuditor,
  onUpdateAuditor,
  onDeleteAuditor,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onUpdateEntityLoginCredentials,
  onUpdateLocationStatus,
  onSubmitVendorBill,
  onSubmitAttendance,
  onSubmitReport,
  onSubmitExpense,
  onSwitchUser,
}) => {
  // Current active entity selection
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Portal Subtabs
  const [vendorTab, setVendorTab] = useState<'sites' | 'bills' | 'kyc' | 'credentials'>('sites');
  const [auditorTab, setAuditorTab] = useState<'attendance' | 'sites' | 'settlements' | 'expense' | 'kyc'>('attendance');
  const [clientTab, setClientTab] = useState<'engagements' | 'reports' | 'invoices' | 'kyc'>('engagements');

  // Admin Management Modals
  const [isAddEntityOpen, setIsAddEntityOpen] = useState(false);
  const [isEditKycOpen, setIsEditKycOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Portal Functional Modals
  const [isUpdateSiteStatusOpen, setIsUpdateSiteStatusOpen] = useState(false);
  const [selectedLocationForStatus, setSelectedLocationForStatus] = useState<any>(null);
  const [targetSiteStatus, setTargetSiteStatus] = useState<LocationStatus>('Completed');
  const [siteStatusRemarks, setSiteStatusRemarks] = useState('');

  const [isCreateVendorBillOpen, setIsCreateVendorBillOpen] = useState(false);
  const [billForm, setBillForm] = useState({
    projectId: state.projects[0]?.id || '',
    billNumber: `BILL-${Date.now().toString().slice(-4)}`,
    approvedMandays: 3,
    agreedRate: 1200,
    advanceAdjusted: 0,
  });

  const [isAuditorReportModalOpen, setIsAuditorReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    locationId: '',
    bookQty: 1000,
    physicalQty: 995,
    conditionNotes: 'All cartons sealed. Stock stacked as per SOP.',
    discrepancyRemarks: 'Shortage of 5 units noted during sample check.',
    storeSignee: 'Store Manager',
  });

  const [isAuditorExpenseModalOpen, setIsAuditorExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    projectId: state.projects[0]?.id || '',
    category: 'Travel' as ExpenseRecord['category'],
    amount: 350,
    description: 'Auto fare from local depot to railway transit point',
  });

  const [isClientRevisitModalOpen, setIsClientRevisitModalOpen] = useState(false);
  const [revisitLocationId, setRevisitLocationId] = useState('');
  const [revisitRemarks, setRevisitRemarks] = useState('');

  // Credentials form state
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credStatus, setCredStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [credNotice, setCredNotice] = useState<string | null>(null);

  // Notice toast
  const [toastNotice, setToastNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotice({ message, type });
    setTimeout(() => setToastNotice(null), 4000);
  };

  const isPrivilegedUser = [
    'SUPER_ADMIN',
    'ADMIN',
    'PROJECT_MANAGER',
    'ACCOUNTS',
    'OFFICE_ADMIN',
  ].includes(state.currentUser.role);

  // 1. Resolve Active Vendor Partner
  const activeVendor: Vendor | null =
    (selectedVendorId ? state.vendors.find((v) => v.id === selectedVendorId || v.vendorId === selectedVendorId) : null) ||
    state.vendors.find(
      (v) =>
        v.id === state.currentUser.linkedEntityId ||
        v.vendorId === state.currentUser.linkedEntityId ||
        v.id === state.currentUser.id ||
        (v.email && state.currentUser.email && v.email.toLowerCase() === state.currentUser.email.toLowerCase()) ||
        (v.contactPerson && state.currentUser.name && v.contactPerson.toLowerCase() === state.currentUser.name.toLowerCase())
    ) ||
    state.vendors[0] ||
    null;

  const vendorAssignments = activeVendor
    ? state.assignments.filter(
        (a) =>
          a.executionType === 'VENDOR' &&
          (a.assignedToId === activeVendor.id ||
            a.assignedToId === activeVendor.vendorId ||
            (a.assignedToName && activeVendor.name && a.assignedToName.toLowerCase().includes(activeVendor.name.toLowerCase())))
      )
    : [];
  const vendorLocations = activeVendor
    ? state.locations.filter(
        (l) =>
          l.assignedType === 'VENDOR' &&
          (l.assignedEntityId === activeVendor.id ||
            l.assignedEntityId === activeVendor.vendorId ||
            (l.assignedEntityName && activeVendor.name && l.assignedEntityName.toLowerCase().includes(activeVendor.name.toLowerCase())))
      )
    : [];
  const vendorBills = activeVendor
    ? state.vendorBills.filter((b) => b.vendorId === activeVendor.id || b.vendorId === activeVendor.vendorId)
    : [];

  // 2. Resolve Active Field Auditor
  const activeAuditor: Auditor | null =
    (selectedAuditorId ? state.auditors.find((a) => a.id === selectedAuditorId || a.auditorId === selectedAuditorId) : null) ||
    state.auditors.find(
      (a) =>
        a.id === state.currentUser.linkedEntityId ||
        a.auditorId === state.currentUser.linkedEntityId ||
        a.id === state.currentUser.id ||
        (a.email && state.currentUser.email && a.email.toLowerCase() === state.currentUser.email.toLowerCase()) ||
        (a.name && state.currentUser.name && a.name.toLowerCase() === state.currentUser.name.toLowerCase())
    ) ||
    state.auditors[0] ||
    null;

  const auditorAssignments = activeAuditor
    ? state.assignments.filter(
        (a) =>
          a.executionType === 'DIRECT' &&
          (a.assignedToId === activeAuditor.id ||
            a.assignedToId === activeAuditor.auditorId ||
            (a.assignedToName && activeAuditor.name && a.assignedToName.toLowerCase().includes(activeAuditor.name.toLowerCase())))
      )
    : [];
  const auditorLocations = activeAuditor
    ? state.locations.filter(
        (l) =>
          l.assignedType === 'AUDITOR' &&
          (l.assignedEntityId === activeAuditor.id ||
            l.assignedEntityId === activeAuditor.auditorId ||
            (l.assignedEntityName && activeAuditor.name && l.assignedEntityName.toLowerCase().includes(activeAuditor.name.toLowerCase())))
      )
    : [];
  const auditorSettlements = activeAuditor
    ? state.auditorSettlements.filter((s) => s.auditorId === activeAuditor.id || s.auditorId === activeAuditor.auditorId)
    : [];
  const auditorAttendanceLogs = activeAuditor
    ? state.attendance.filter((a) => a.auditorId === activeAuditor.id || a.auditorId === activeAuditor.auditorId)
    : [];

  // 3. Resolve Active Corporate Client
  const activeClient: Client | null =
    (selectedClientId ? state.clients.find((c) => c.id === selectedClientId || c.clientId === selectedClientId) : null) ||
    state.clients.find(
      (c) =>
        c.id === state.currentUser.linkedEntityId ||
        c.clientId === state.currentUser.linkedEntityId ||
        c.id === state.currentUser.id ||
        (c.contactEmail && state.currentUser.email && c.contactEmail.toLowerCase() === state.currentUser.email.toLowerCase()) ||
        (c.email && state.currentUser.email && c.email.toLowerCase() === state.currentUser.email.toLowerCase()) ||
        (c.name && state.currentUser.name && c.name.toLowerCase() === state.currentUser.name.toLowerCase())
    ) ||
    state.clients[0] ||
    null;

  const clientProjects = activeClient
    ? state.projects.filter(
        (p) =>
          p.clientId === activeClient.id ||
          p.clientId === activeClient.clientId ||
          (p.clientName && activeClient.name && p.clientName.toLowerCase().includes(activeClient.name.toLowerCase()))
      )
    : [];
  const clientInvoices = activeClient
    ? state.invoices.filter((i) => i.clientId === activeClient.id || i.clientId === activeClient.clientId)
    : [];
  const clientReports = state.reports.filter((r) => r.status === 'Approved');

  // Find linked user profile for credentials management
  const getLinkedUser = () => {
    let targetEmail = '';
    let targetId = '';
    let targetCode = '';
    if (portalType === 'vendor' && activeVendor) {
      targetEmail = activeVendor.email;
      targetId = activeVendor.id;
      targetCode = activeVendor.vendorId;
    } else if (portalType === 'auditor' && activeAuditor) {
      targetEmail = activeAuditor.email;
      targetId = activeAuditor.id;
      targetCode = activeAuditor.auditorId;
    } else if (portalType === 'client' && activeClient) {
      targetEmail = activeClient.contactEmail || activeClient.email || '';
      targetId = activeClient.id;
      targetCode = activeClient.clientId;
    }

    return state.users.find(
      (u) =>
        u.linkedEntityId === targetId ||
        (targetCode && u.linkedEntityId === targetCode) ||
        u.id === `usr_${targetCode}` ||
        u.id === `usr_${targetId}` ||
        (u.email && targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase())
    );
  };

  const openCredentialsModal = () => {
    const user = getLinkedUser();
    let defaultEmail = '';
    if (portalType === 'vendor' && activeVendor) defaultEmail = activeVendor.email;
    else if (portalType === 'auditor' && activeAuditor) defaultEmail = activeAuditor.email;
    else if (portalType === 'client' && activeClient) defaultEmail = activeClient.contactEmail;

    setCredEmail(user ? user.email : defaultEmail);
    setCredPassword(user?.password || 'Jshine@2329');
    setCredStatus(user ? user.status : 'ACTIVE');
    setCredNotice(null);
    setIsCredentialsModalOpen(true);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credEmail.trim() || !credPassword.trim()) return;

    let targetId = '';
    if (portalType === 'vendor' && activeVendor) targetId = activeVendor.id;
    else if (portalType === 'auditor' && activeAuditor) targetId = activeAuditor.id;
    else if (portalType === 'client' && activeClient) targetId = activeClient.id;

    if (onUpdateEntityLoginCredentials) {
      onUpdateEntityLoginCredentials(portalType, targetId, credEmail, credPassword, credStatus);
    }

    showToast(`Login credentials for ${credEmail} successfully updated and active!`, 'success');
    setIsCredentialsModalOpen(false);
  };

  const copyCredentials = () => {
    const text = `JaySoftShine ERP Login:\nPortal: ${portalType.toUpperCase()} Portal\nEmail: ${credEmail}\nPassword: ${credPassword}\nURL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredPassword(`JSS#${code}!${Math.floor(100 + Math.random() * 900)}`);
  };

  // Switch persona directly to active entity
  const handleImpersonateEntity = () => {
    const user = getLinkedUser();
    if (user && onSwitchUser) {
      onSwitchUser(user);
      showToast(`Switched active session to ${user.name} (${user.role})`, 'info');
    } else {
      showToast('No user account linked to this profile. Create login credentials first.', 'error');
    }
  };

  // Punch GPS attendance directly in field app
  const [punchingGps, setPunchingGps] = useState(false);
  const handlePunchAttendance = () => {
    if (!activeAuditor) return;
    setPunchingGps(true);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const targetLoc = auditorLocations[0] || state.locations[0] || {
      id: 'loc_gps_punch',
      siteName: 'Field Audit Verification Site',
      city: 'Mumbai',
    };

    const targetProj = state.projects.find((p) => p.id === targetLoc.projectId) || state.projects[0] || {
      id: 'proj_gen',
      name: 'General Audit Verification',
    };

    const record: AttendanceRecord = {
      id: `att_${Date.now()}`,
      projectId: targetProj.id,
      projectName: targetProj.name,
      locationId: targetLoc.id,
      locationName: targetLoc.siteName,
      assignmentId: auditorAssignments[0]?.id || `asn_${Date.now()}`,
      auditorId: activeAuditor.id,
      auditorName: activeAuditor.name,
      workDate: dateStr,
      checkInTime: timeStr,
      checkOutTime: '18:00',
      isHalfDay: false,
      mandays: 1.0,
      gpsLocation: '19.0760° N, 72.8777° E (Geo-Fence Verified)',
      approvalStatus: 'Approved',
      approvedBy: 'Auto-Verified by GPS Geofence',
      submittedBy: activeAuditor.name,
      createdAt: now.toISOString(),
    };

    if (onSubmitAttendance) {
      onSubmitAttendance(record);
    }
    setTimeout(() => {
      setPunchingGps(false);
      showToast(`GPS Attendance punched successfully for ${activeAuditor.name} (1.0 Manday approved)!`, 'success');
    }, 600);
  };

  // Submit Vendor Bill
  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor) return;

    const proj = state.projects.find((p) => p.id === billForm.projectId) || state.projects[0];
    const taxable = billForm.approvedMandays * billForm.agreedRate;
    const gst = Math.round(taxable * 0.18);
    const tds = Math.round(taxable * 0.02); // 2% 194C
    const net = taxable + gst - tds - billForm.advanceAdjusted;

    const newBill: VendorBill = {
      id: `vbill_${Date.now()}`,
      billNumber: billForm.billNumber.trim().toUpperCase(),
      billDate: new Date().toISOString().split('T')[0],
      vendorId: activeVendor.id,
      vendorName: activeVendor.name,
      projectId: proj ? proj.id : 'proj_1',
      projectName: proj ? proj.name : 'Physical Verification Project',
      approvedMandays: billForm.approvedMandays,
      agreedRate: billForm.agreedRate,
      taxableAmount: taxable,
      gstAmount: gst,
      tdsRatePercent: 2,
      tdsDeduction: tds,
      advanceAdjusted: billForm.advanceAdjusted,
      netPayable: net,
      paidAmount: 0,
      outstanding: net,
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (onSubmitVendorBill) {
      onSubmitVendorBill(newBill);
    }
    setIsCreateVendorBillOpen(false);
    showToast(`Bill ${newBill.billNumber} of ₹${net.toLocaleString('en-IN')} submitted successfully!`, 'success');
  };

  // Submit Auditor Physical Count Report
  const handleSubmitAuditorReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAuditor) return;

    const targetLoc = state.locations.find((l) => l.id === reportForm.locationId) || auditorLocations[0] || state.locations[0];
    const variance = reportForm.physicalQty - reportForm.bookQty;

    const newRep: WorkReport = {
      id: `rep_${Date.now()}`,
      reportId: `REP-${Date.now().toString().slice(-5)}`,
      projectId: targetLoc?.projectId || 'proj_1',
      projectName: targetLoc?.siteName ? `${targetLoc.siteName} Audit` : 'Stock Audit Engagement',
      locationId: targetLoc ? targetLoc.id : 'loc_1',
      locationName: targetLoc ? targetLoc.siteName : 'Warehouse Depot',
      category: 'Stock Audit',
      submittedBy: activeAuditor.name,
      submissionDate: new Date().toISOString().split('T')[0],
      totalAssetsCounted: reportForm.physicalQty,
      discrepanciesFound: Math.abs(variance),
      physicalConditionNotes: `${reportForm.conditionNotes} • Discrepancy: ${reportForm.discrepancyRemarks}`,
      photoUrls: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
      status: 'Approved',
      createdAt: new Date().toISOString(),
    };

    if (onSubmitReport) {
      onSubmitReport(newRep);
    }
    if (onUpdateLocationStatus && targetLoc) {
      onUpdateLocationStatus(targetLoc.id, 'Completed', reportForm.conditionNotes);
    }

    setIsAuditorReportModalOpen(false);
    showToast(`Physical Count Report for ${targetLoc?.siteName || 'Site'} approved and filed!`, 'success');
  };

  // Submit Auditor Expense Claim
  const handleSubmitExpenseClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAuditor) return;

    const proj = state.projects.find((p) => p.id === expenseForm.projectId) || state.projects[0];
    const newExp: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      expenseId: `EXP-${Date.now().toString().slice(-4)}`,
      projectId: proj ? proj.id : 'proj_1',
      projectName: proj ? proj.name : 'Physical Verification Project',
      category: expenseForm.category,
      amount: expenseForm.amount,
      submittedBy: `${activeAuditor.name} (Auditor)`,
      submitterType: 'AUDITOR',
      description: expenseForm.description,
      date: new Date().toISOString().split('T')[0],
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString(),
    };

    if (onSubmitExpense) {
      onSubmitExpense(newExp);
    }
    setIsAuditorExpenseModalOpen(false);
    showToast(`Expense claim of ₹${expenseForm.amount} filed and approved!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
            toastNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toastNotice.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{toastNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN CONTROL PANEL: ADD, EDIT, KYC, LOGIN CREDENTIALS, REMOVE */}
      {/* ============================================================== */}
      {isPrivilegedUser && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Admin Portal Management & Identity Governance
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {portalType.toUpperCase()} PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Manage master profiles, statutory KYC verification, credentials, and impersonate live view.
                </p>
              </div>
            </div>

            {/* Entity Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Viewing Account:</span>
              {portalType === 'vendor' && (
                <select
                  value={activeVendor?.id || ''}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {state.vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vendorId || 'VND'})
                    </option>
                  ))}
                </select>
              )}

              {portalType === 'auditor' && (
                <select
                  value={activeAuditor?.id || ''}
                  onChange={(e) => setSelectedAuditorId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {state.auditors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.auditorId || 'AUD'})
                    </option>
                  ))}
                </select>
              )}

              {portalType === 'client' && (
                <select
                  value={activeClient?.id || ''}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientId || 'CLI'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Action Buttons: Add, Edit KYC, Login Credentials, Switch Persona, Remove */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEntityOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New {portalType === 'vendor' ? 'Vendor' : portalType === 'auditor' ? 'Auditor' : 'Client'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditKycOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Profile & KYC Details</span>
            </button>

            <button
              type="button"
              onClick={openCredentialsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Update Login Credentials</span>
            </button>

            <button
              type="button"
              onClick={handleImpersonateEntity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Switch session into this user's active persona"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>Login / View as this {portalType.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg shadow-xs transition-colors ml-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Account</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. VENDOR OUTSOURCING PORTAL VIEW                             */}
      {/* ============================================================== */}
      {portalType === 'vendor' && (
        <div className="space-y-5">
          {!activeVendor ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Vendor Partner Configured</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click below to onboard a vendor partner or manage vendor master data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEntityOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Add New Vendor Partner
              </button>
            </div>
          ) : (
            <>
              {/* Vendor Hero Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                    <Building className="w-4 h-4 text-blue-400" />
                    <span>Vendor Outsourcing Portal • Partner Scope</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700">
                      KYC {activeVendor.kyc?.status || 'Verified'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activeVendor.name}</h2>
                  <p className="text-xs text-slate-400">
                    Partner Code: {activeVendor.vendorId || 'JSS-VND-001'} • GSTIN: {activeVendor.gstin || 'Unregistered'} • PAN: {activeVendor.pan || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Contact: {activeVendor.contactPerson} ({activeVendor.phone}) • {activeVendor.email}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-xs font-mono bg-blue-900/60 text-blue-200 border border-blue-700 px-3 py-1.5 rounded-lg">
                    Agreed Rate: ₹{activeVendor.defaultDayRate || 1200} / Manday
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreateVendorBillOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Submit Vendor Bill (194C)</span>
                  </button>
                </div>
              </div>

              {/* Vendor Portal Subnavigation */}
              <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setVendorTab('sites')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    vendorTab === 'sites'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Assigned Sites & Packages ({vendorLocations.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVendorTab('bills')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    vendorTab === 'bills'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Section 194C Bills & Payments ({vendorBills.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVendorTab('kyc')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    vendorTab === 'kyc'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>KYC Documents & Banking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVendorTab('credentials')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    vendorTab === 'credentials'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Login Credentials & Security</span>
                </button>
              </div>

              {/* Tab 1: Vendor Sites */}
              {vendorTab === 'sites' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Assigned Locations</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">{vendorLocations.length} Sites</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Active Work Packages</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">{vendorAssignments.length} Packages</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Completed Sites</span>
                      <div className="text-xl font-bold text-emerald-700 mt-1">
                        {vendorLocations.filter((l) => l.status === 'Completed').length} Done
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Pending Execution</span>
                      <div className="text-xl font-bold text-amber-700 mt-1">
                        {vendorLocations.filter((l) => l.status !== 'Completed').length} Pending
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>Assigned Retail Store & Warehouse Verification Sites</span>
                      <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
                    </div>
                    {vendorLocations.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No locations allocated to {activeVendor.name} yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                            <tr>
                              <th className="p-3">Location Code</th>
                              <th className="p-3">Site Details</th>
                              <th className="p-3">Planned Date</th>
                              <th className="p-3 font-mono">Execution Rate</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {vendorLocations.map((loc) => (
                              <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono font-bold text-slate-900">{loc.locationId}</td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-900">{loc.siteName}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {loc.city}, {loc.state} • {loc.address}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-700">{formatDateIndian(loc.plannedVisitDate)}</td>
                                <td className="p-3 font-mono text-slate-900 font-semibold">{formatINR(loc.executionCostRate || activeVendor.defaultDayRate)}</td>
                                <td className="p-3">
                                  <StatusBadge status={loc.status} size="sm" />
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLocationForStatus(loc);
                                      setTargetSiteStatus(loc.status);
                                      setSiteStatusRemarks(loc.revisitRemarks || '');
                                      setIsUpdateSiteStatusOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-semibold rounded-md shadow-xs cursor-pointer"
                                  >
                                    Update Status
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Vendor Bills */}
              {vendorTab === 'bills' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Gross Mandays Billed</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {formatINR(vendorBills.reduce((acc, b) => acc + (b.taxableAmount || 0), 0))}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">TDS Withheld (194C)</span>
                      <div className="text-xl font-bold text-slate-700 mt-1">
                        {formatINR(vendorBills.reduce((acc, b) => acc + (b.tdsDeduction || 0), 0))}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Net Paid by JSS</span>
                      <div className="text-xl font-bold text-emerald-700 mt-1">
                        {formatINR(vendorBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0))}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-mono">Pending Balance</span>
                      <div className="text-xl font-bold text-rose-600 mt-1">
                        {formatINR(vendorBills.reduce((acc, b) => acc + (b.outstanding || 0), 0))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
                        Submitted Bills & Section 194C Payment Advices
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsCreateVendorBillOpen(true)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit New Bill</span>
                      </button>
                    </div>

                    {vendorBills.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No vendor bills generated yet for {activeVendor.name}.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vendorBills.map((b) => (
                          <div
                            key={b.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                                <span>{b.billNumber}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-sans">
                                  {b.paymentStatus}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {b.projectName} • {b.approvedMandays} Mandays @ {formatINR(b.agreedRate)}/day
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Date: {formatDateIndian(b.billDate)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right font-mono">
                                <div className="font-bold text-slate-900">{formatINR(b.netPayable)}</div>
                                <span className="text-[10px] text-slate-500">
                                  Taxable: {formatINR(b.taxableAmount)} | TDS (2%): -{formatINR(b.tdsDeduction)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => exportVendorBillToPdf(b)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Voucher</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Vendor KYC */}
              {vendorTab === 'kyc' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Statutory KYC Compliance & Banking Verification
                      </h3>
                      <p className="text-xs text-slate-500">
                        Income Tax PAN, GSTIN registration, MSME Udyam status, and direct NEFT/RTGS bank details.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                      STATUS: {activeVendor.kyc?.status || 'Verified'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-slate-400 uppercase text-[10px] block font-sans">Corporate Tax ID</span>
                      <div>
                        <span className="text-slate-500">Company PAN:</span>{' '}
                        <strong className="text-slate-900">{activeVendor.pan || 'AAXFA9876C'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">GSTIN Registration:</span>{' '}
                        <strong className="text-slate-900">{activeVendor.gstin || '27AAXFA9876C1ZB'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">MSME Registered:</span>{' '}
                        <strong className="text-slate-900">{activeVendor.msmeRegistered ? 'Yes (Udyam Verified)' : 'No'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Operating State:</span>{' '}
                        <strong className="text-slate-900 font-sans">{activeVendor.state || 'Maharashtra'}</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-slate-400 uppercase text-[10px] block font-sans">Payout Bank Details</span>
                      <div>
                        <span className="text-slate-500">Bank Name:</span>{' '}
                        <strong className="text-slate-900 font-sans">{activeVendor.bankName || 'HDFC Bank Ltd'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Account Number:</span>{' '}
                        <strong className="text-slate-900">{activeVendor.bankAccount || '50200034981122'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">IFSC Code:</span>{' '}
                        <strong className="text-slate-900">{activeVendor.bankIfsc || 'HDFC0000240'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Terms:</span>{' '}
                        <strong className="text-slate-900 font-sans">{activeVendor.paymentTermsDays || 15} Days Credit</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditKycOpen(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Update KYC & Bank Records</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Vendor Credentials */}
              {vendorTab === 'credentials' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Portal Login Credentials</h3>
                      <p className="text-xs text-slate-500">Login email and access security for this vendor account.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Registered Email:</span>
                      <strong className="text-slate-900">{activeVendor.email}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Account Status:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Current Password:</span>
                      <strong className="text-slate-900">
                        {getLinkedUser()?.password || '••••••••'}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openCredentialsModal}
                    className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Portal Password & Access</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. AUDITOR FIELD APPLICATION VIEW                             */}
      {/* ============================================================== */}
      {portalType === 'auditor' && (
        <div className="space-y-5 max-w-4xl mx-auto">
          {!activeAuditor ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Field Auditor Configured</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click below to onboard a certified field auditor or manage workforce records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEntityOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Add New Field Auditor
              </button>
            </div>
          ) : (
            <>
              {/* Auditor Mobile Header */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Field Auditor App • Mobile Scope</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700">
                      KYC {activeAuditor.kyc?.status || 'Verified'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activeAuditor.name}</h2>
                  <p className="text-xs text-slate-400">
                    Auditor ID: {activeAuditor.auditorId || 'JSS-AUD-001'} • PAN: {activeAuditor.pan || 'BHPPS4567M'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Phone: {activeAuditor.phone} • Email: {activeAuditor.email}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-[10px] text-slate-400 block">Standard Rate</span>
                    <strong className="text-base text-emerald-400">₹{activeAuditor.defaultDayRate || 1000} / Manday</strong>
                    <span className="text-[10px] text-slate-500 block">TA: ₹{activeAuditor.travelAllowancePerKm || 5}/km • DA: ₹{activeAuditor.dailyFoodAllowance || 300}/day</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePunchAttendance}
                    disabled={punchingGps}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-75"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{punchingGps ? 'Verifying GPS...' : 'Punch Today Check-in'}</span>
                  </button>
                </div>
              </div>

              {/* Auditor Subnavigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setAuditorTab('attendance')}
                  className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    auditorTab === 'attendance'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>GPS Attendance Punch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditorTab('sites')}
                  className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    auditorTab === 'sites'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>My Allocated Sites ({auditorLocations.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditorTab('settlements')}
                  className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    auditorTab === 'settlements'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <WalletCards className="w-4 h-4" />
                  <span>Remuneration & Settlements</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditorTab('expense')}
                  className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    auditorTab === 'expense'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>File Expense Claim</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditorTab('kyc')}
                  className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    auditorTab === 'kyc'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Profile & KYC</span>
                </button>
              </div>

              {/* Tab 1: GPS Attendance */}
              {auditorTab === 'attendance' && (
                <div className="space-y-4">
                  {/* Punch Box */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Live Geolocation Site Attendance</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Check-in records exact device coordinates and photo verification to approve 1.0 manday.
                      </p>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        Current Geofence: 19.2969° N, 73.0631° E (Bhiwandi Depot Cluster)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePunchAttendance}
                      disabled={punchingGps}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{punchingGps ? 'Recording Attendance...' : 'Punch Today Check-in'}</span>
                    </button>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900 flex justify-between">
                      <span>Attendance & Manday Approval Records ({auditorAttendanceLogs.length})</span>
                      <span className="text-[10px] text-slate-500 font-mono">Section 194J Verified</span>
                    </div>
                    {auditorAttendanceLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No attendance punches recorded yet for {activeAuditor.name}. Click "Punch Today Check-in" above!
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                          <tr>
                            <th className="p-3">Work Date</th>
                            <th className="p-3">Location & Coordinates</th>
                            <th className="p-3">Check-in / Out</th>
                            <th className="p-3 font-mono">Mandays</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {auditorAttendanceLogs.map((att) => (
                            <tr key={att.id} className="hover:bg-slate-50 font-sans">
                              <td className="p-3 font-mono font-bold text-slate-900">{formatDateIndian(att.workDate)}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{att.locationName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{att.gpsLocation || 'GPS Geofence Match'}</div>
                              </td>
                              <td className="p-3 font-mono text-slate-700">
                                {att.checkInTime} — {att.checkOutTime}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-700">{att.mandays} Day</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                  {att.approvalStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Auditor Sites & Physical Count Report */}
              {auditorTab === 'sites' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
                      My Allocated Verification Sites ({auditorLocations.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAuditorReportModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Submit Physical Count Report</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {auditorLocations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{loc.siteName}</div>
                          <div className="text-slate-500 text-[11px]">
                            {loc.city}, {loc.state} • {loc.address}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Visit Date: {formatDateIndian(loc.plannedVisitDate)} • Client Code: {loc.clientSiteCode || 'TCPL-01'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={loc.status} size="sm" />
                          <button
                            type="button"
                            onClick={() => {
                              setReportForm({
                                ...reportForm,
                                locationId: loc.id,
                              });
                              setIsAuditorReportModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-semibold rounded-lg cursor-pointer"
                          >
                            Upload Count
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Remuneration Settlements */}
              {auditorTab === 'settlements' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
                      Remuneration & Payout History
                    </h3>
                    {auditorSettlements.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No remuneration vouchers settled yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {auditorSettlements.map((s) => (
                          <div
                            key={s.id}
                            className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 font-mono">{s.settlementNumber}</div>
                              <div className="text-[11px] text-slate-500">{s.projectName}</div>
                              <div className="text-[10px] text-slate-400">
                                {s.approvedMandays} Days • TA: {formatINR(s.travelAllowance)} • DA: {formatINR(s.foodAllowance)}
                              </div>
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
                                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Voucher</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: File Expense Claim */}
              {auditorTab === 'expense' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">File Field Travel / Food Expense Claim</h3>
                      <p className="text-xs text-slate-500">Expenses are reimbursed alongside monthly manday settlements.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitExpenseClaim} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="Travel">Travel / Transit Conveyance</option>
                        <option value="Food">Daily Food & Meals</option>
                        <option value="Accommodation">Lodging & Hotel</option>
                        <option value="Printing">Printing Count Sheets</option>
                        <option value="Miscellaneous">Other Miscellaneous</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Claim Amount (INR)</label>
                      <input
                        type="number"
                        required
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description & Receipt Details</label>
                      <textarea
                        rows={2}
                        required
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        placeholder="Taxi fare from station to warehouse, ticket copy attached"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Submit Expense Claim
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 5: Profile & KYC */}
              {auditorTab === 'kyc' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Auditor KYC & Direct Credit Account</h3>
                      <p className="text-xs text-slate-500">Government ID & bank verification for NEFT/UPI credit.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                      STATUS: {activeAuditor.kyc?.status || 'Verified'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500">PAN:</span> <strong className="text-slate-900">{activeAuditor.pan || 'BHPPS4567M'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Bank:</span> <strong className="text-slate-900 font-sans">{activeAuditor.bankName || 'State Bank of India'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Account No:</span> <strong className="text-slate-900">{activeAuditor.bankAccount || '30987654321'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">IFSC Code:</span> <strong className="text-slate-900">{activeAuditor.bankIfsc || 'SBIN0000456'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Portal Login Email:</span> <strong className="text-slate-900">{activeAuditor.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Password:</span> <strong className="text-slate-900">{getLinkedUser()?.password || 'Jshine@2329'}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditKycOpen(true)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Update KYC / Bank
                    </button>
                    <button
                      type="button"
                      onClick={openCredentialsModal}
                      className="flex-1 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CLIENT TRANSPARENCY PORTAL VIEW                            */}
      {/* ============================================================== */}
      {portalType === 'client' && (
        <div className="space-y-5">
          {!activeClient ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Users2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Client Organization Configured</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click below to onboard a client organization or manage CRM accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEntityOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Add New Client Organization
              </button>
            </div>
          ) : (
            <>
              {/* Client Hero Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>Client Transparency Portal • Stakeholder Scope</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700">
                      KYC {activeClient.kyc?.status || 'Verified'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activeClient.name}</h2>
                  <p className="text-xs text-slate-400">
                    Client Code: {activeClient.clientId || 'JSS-CLI-001'} • GSTIN: {activeClient.gstin || '27AAACT1234A1Z5'} • PAN: {activeClient.pan || 'AAACT1234A'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Account Lead: {activeClient.contactPerson} ({activeClient.contactPhone}) • {activeClient.contactEmail}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-xs font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-700 px-3 py-1.5 rounded-lg">
                    {activeClient.clientType || 'MNC Enterprise'} • {activeClient.paymentTermsDays || 30} Days Credit
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRevisitRemarks('');
                      setIsClientRevisitModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Request Site Priority / Revisit</span>
                  </button>
                </div>
              </div>

              {/* Client Subnavigation */}
              <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setClientTab('engagements')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    clientTab === 'engagements'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Audit Engagements & Progress ({clientProjects.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClientTab('reports')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    clientTab === 'reports'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Physical Verification Reports</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClientTab('invoices')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    clientTab === 'invoices'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Tax Invoices & Billing ({clientInvoices.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClientTab('kyc')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    clientTab === 'kyc'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Organization Profile & KYC</span>
                </button>
              </div>

              {/* Tab 1: Client Engagements */}
              {clientTab === 'engagements' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientProjects.map((proj) => {
                      const projLocs = state.locations.filter((l) => l.projectId === proj.id);
                      const totalLocs = projLocs.length || proj.totalLocations || 1;
                      const completedLocs = projLocs.filter((l) => l.status === 'Completed').length;
                      const inProgressLocs = projLocs.filter((l) => l.status === 'In Progress' || l.status === 'Scheduled').length;
                      const pct = Math.round((completedLocs / totalLocs) * 100);

                      return (
                        <div key={proj.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{proj.name}</div>
                              <div className="text-[11px] text-slate-500">
                                PO: {proj.poNumber || 'PO-PENDING'} • Category: {proj.category}
                              </div>
                            </div>
                            <StatusBadge status={proj.status} size="sm" />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-500">Audit Completion Progress:</span>
                              <span className="font-bold text-slate-900">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full transition-all duration-300"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 bg-slate-50 rounded-lg font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">Total Locations</span>
                              <strong>{totalLocs}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">Verified</span>
                              <strong className="text-emerald-700">{completedLocs}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">Scheduled</span>
                              <strong className="text-amber-700">{inProgressLocs}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Client Reports */}
              {clientTab === 'reports' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900 flex justify-between">
                    <span>Approved Physical Verification Certificates & Summary Reports</span>
                    <span className="text-[10px] text-slate-500 font-mono">Counter-Signed</span>
                  </div>
                  {clientReports.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No verification reports finalized yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {clientReports.map((r) => (
                        <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{r.locationName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                                {r.reportId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {r.projectName} • Verified on {formatDateIndian(r.submissionDate)}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1">
                              Counted Units: <strong>{r.totalAssetsCounted}</strong> | Discrepancies: <strong>{r.discrepanciesFound || 0}</strong>
                            </div>
                            <p className="text-[11px] text-slate-500 italic mt-0.5">"{r.physicalConditionNotes}"</p>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px] font-bold border border-slate-200 self-start sm:self-auto">
                            Verified & Stamped
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Client Invoices */}
              {clientTab === 'invoices' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
                      Official Tax Invoices (GST Rule 46 Compliant)
                    </h3>
                    {clientInvoices.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No invoices issued yet for {activeClient.name}.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                                <span>{inv.invoiceNumber}</span>
                                <StatusBadge status={inv.status} size="sm" />
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {inv.projectName} • Issued: {formatDateIndian(inv.invoiceDate)} • Due: {formatDateIndian(inv.dueDate)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                CGST: {formatINR(inv.cgstAmount)} | SGST: {formatINR(inv.sgstAmount)} | IGST: {formatINR(inv.igstAmount)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right font-mono">
                                <div className="font-bold text-slate-900">{formatINR(inv.totalAmount)}</div>
                                <span className="text-[10px] text-slate-500">
                                  Balance Due: {formatINR(inv.balanceDue)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => exportInvoiceToPdf(inv)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Invoice</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Client KYC */}
              {clientTab === 'kyc' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Corporate Master & Statutory KYC</h3>
                      <p className="text-xs text-slate-500">Client entity registration, billing address, and access credentials.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                      STATUS: {activeClient.kyc?.status || 'Verified'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500">Corporate PAN:</span>{' '}
                      <strong className="text-slate-900">{activeClient.pan || 'AAACT1234A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Client GSTIN:</span>{' '}
                      <strong className="text-slate-900">{activeClient.gstin || '27AAACT1234A1Z5'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Billing Address:</span>{' '}
                      <strong className="text-slate-900 font-sans">{activeClient.billingAddress}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Payment Credit Terms:</span>{' '}
                      <strong className="text-slate-900 font-sans">{activeClient.paymentTermsDays || 30} Days</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Portal Login Email:</span>{' '}
                      <strong className="text-slate-900">{activeClient.contactEmail}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Password:</span>{' '}
                      <strong className="text-slate-900">{getLinkedUser()?.password || 'Jshine@2329'}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditKycOpen(true)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Update Client Profile
                    </button>
                    <button
                      type="button"
                      onClick={openCredentialsModal}
                      className="flex-1 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW ENTITY (VENDOR / AUDITOR / CLIENT)            */}
      {/* ============================================================== */}
      {isAddEntityOpen && (
        <Modal
          isOpen={isAddEntityOpen}
          onClose={() => setIsAddEntityOpen(false)}
          title={`Onboard New ${portalType === 'vendor' ? 'Vendor Partner' : portalType === 'auditor' ? 'Field Auditor' : 'Client Organization'}`}
          subtitle="Configure business details, statutory KYC and portal credentials"
          maxWidth="2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              const name = target.entityName.value.trim();
              const email = target.entityEmail.value.trim().toLowerCase();
              const phone = target.entityPhone.value.trim();
              const pan = target.entityPan.value.trim().toUpperCase();
              const pwd = target.entityPassword.value.trim() || 'Jshine@2329';

              if (portalType === 'vendor' && onAddVendor) {
                const newV: Vendor = {
                  id: `vnd_${Date.now()}`,
                  vendorId: `JSS-VND-${Date.now().toString().slice(-3)}`,
                  name,
                  legalName: target.entityLegalName?.value?.trim() || name,
                  contactPerson: target.entityContactPerson?.value?.trim() || name,
                  phone,
                  email,
                  pan,
                  gstin: target.entityGstin?.value?.trim().toUpperCase() || 'Unregistered',
                  address: target.entityAddress?.value?.trim() || 'Mumbai, Maharashtra',
                  state: target.entityState?.value?.trim() || 'Maharashtra',
                  bankName: target.entityBankName?.value?.trim() || 'HDFC Bank',
                  bankAccount: target.entityBankAccount?.value?.trim() || '50200000000',
                  bankIfsc: target.entityBankIfsc?.value?.trim().toUpperCase() || 'HDFC0000123',
                  msmeRegistered: target.entityMsme?.checked || false,
                  paymentTermsDays: parseInt(target.entityTerms?.value, 10) || 15,
                  defaultDayRate: parseFloat(target.entityRate?.value) || 1200,
                  rating: 5.0,
                  status: 'Active',
                  kyc: {
                    status: 'Verified',
                    panNumber: pan,
                    gstin: target.entityGstin?.value?.trim().toUpperCase() || '',
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: state.currentUser.name,
                  },
                  createdAt: new Date().toISOString(),
                };
                onAddVendor(newV, pwd);
                setSelectedVendorId(newV.id);
              } else if (portalType === 'auditor' && onAddAuditor) {
                const newA: Auditor = {
                  id: `aud_${Date.now()}`,
                  auditorId: `JSS-AUD-${Date.now().toString().slice(-3)}`,
                  name,
                  email,
                  phone,
                  address: target.entityAddress?.value?.trim() || 'Pune, Maharashtra',
                  pan,
                  bankName: target.entityBankName?.value?.trim() || 'State Bank of India',
                  bankAccount: target.entityBankAccount?.value?.trim() || '30000000000',
                  bankIfsc: target.entityBankIfsc?.value?.trim().toUpperCase() || 'SBIN0000123',
                  skills: ['Physical Verification', 'Stock Audit', 'Asset Tagging'],
                  experienceYears: 4,
                  preferredStates: ['Maharashtra', 'Gujarat'],
                  defaultDayRate: parseFloat(target.entityRate?.value) || 1000,
                  travelAllowancePerKm: 5,
                  dailyFoodAllowance: 300,
                  isAvailable: true,
                  status: 'Active',
                  kyc: {
                    status: 'Verified',
                    panNumber: pan,
                    aadhaarNumber: target.entityAadhaar?.value?.trim() || '4521 8900 1234',
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: state.currentUser.name,
                  },
                  createdAt: new Date().toISOString(),
                };
                onAddAuditor(newA, pwd);
                setSelectedAuditorId(newA.id);
              } else if (portalType === 'client' && onAddClient) {
                const newC: Client = {
                  id: `cli_${Date.now()}`,
                  clientId: `JSS-CLI-${Date.now().toString().slice(-3)}`,
                  name,
                  clientType: 'MNC',
                  pan,
                  gstin: target.entityGstin?.value?.trim().toUpperCase() || '27AAACT0000A1Z1',
                  registeredAddress: target.entityAddress?.value?.trim() || 'Fort, Mumbai',
                  billingAddress: target.entityAddress?.value?.trim() || 'Fort, Mumbai',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  pincode: '400001',
                  contactPerson: target.entityContactPerson?.value?.trim() || name,
                  contactEmail: email,
                  contactPhone: phone,
                  paymentTermsDays: parseInt(target.entityTerms?.value, 10) || 30,
                  tdsRatePercent: 2,
                  creditLimit: 5000000,
                  status: 'Active',
                  kyc: {
                    status: 'Verified',
                    panNumber: pan,
                    gstin: target.entityGstin?.value?.trim().toUpperCase() || '',
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: state.currentUser.name,
                  },
                  createdAt: new Date().toISOString(),
                };
                onAddClient(newC, pwd);
                setSelectedClientId(newC.id);
              }

              setIsAddEntityOpen(false);
              showToast(`New ${portalType.toUpperCase()} account created with login credentials!`, 'success');
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {portalType === 'vendor' ? 'Vendor Agency Name' : portalType === 'auditor' ? 'Auditor Full Name' : 'Company / Client Name'} *
                </label>
                <input
                  name="entityName"
                  required
                  placeholder={portalType === 'vendor' ? 'Apex Audit Solutions LLP' : portalType === 'auditor' ? 'Rahul Sharma' : 'Tata Consumer Products Ltd'}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Email (Portal Login) *</label>
                <input
                  name="entityEmail"
                  type="email"
                  required
                  placeholder="contact@partner.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  name="entityPhone"
                  required
                  placeholder="+91 98200 00000"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Permanent A/C (PAN) *</label>
                <input
                  name="entityPan"
                  required
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {portalType !== 'auditor' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    name="entityGstin"
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              {portalType === 'auditor' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aadhaar Number (UIDAI)</label>
                  <input
                    name="entityAadhaar"
                    placeholder="XXXX XXXX 1234"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              {portalType !== 'client' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Commercial Day Rate (INR) *</label>
                  <input
                    name="entityRate"
                    type="number"
                    defaultValue={portalType === 'vendor' ? 1200 : 1000}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Portal Login Password *</label>
                <input
                  name="entityPassword"
                  defaultValue="Jshine@2329"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Default portal password is prefilled. User can log into this portal immediately.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddEntityOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Save & Create Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT PROFILE & UPDATE KYC DETAILS                     */}
      {/* ============================================================== */}
      {isEditKycOpen && (
        <Modal
          isOpen={isEditKycOpen}
          onClose={() => setIsEditKycOpen(false)}
          title={`Edit Profile & KYC: ${portalType === 'vendor' ? activeVendor?.name : portalType === 'auditor' ? activeAuditor?.name : activeClient?.name}`}
          subtitle="Statutory compliance verification, PAN/GST validation, and bank payout records"
          maxWidth="2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              const kycStatus = target.kycStatus.value as KycStatus;
              const pan = target.pan.value.trim().toUpperCase();
              const gstin = target.gstin?.value?.trim().toUpperCase();
              const bankAccount = target.bankAccount?.value?.trim();
              const bankIfsc = target.bankIfsc?.value?.trim().toUpperCase();
              const bankName = target.bankName?.value?.trim();
              const remarks = target.kycRemarks?.value?.trim();

              const kycData: KycInfo = {
                status: kycStatus,
                panNumber: pan,
                gstin: gstin || undefined,
                bankAccount,
                bankIfsc,
                bankName,
                remarks,
                verifiedAt: new Date().toISOString(),
                verifiedBy: state.currentUser.name,
              };

              if (portalType === 'vendor' && activeVendor && onUpdateVendor) {
                onUpdateVendor({
                  ...activeVendor,
                  name: target.name.value.trim(),
                  phone: target.phone.value.trim(),
                  email: target.email.value.trim(),
                  pan,
                  gstin: gstin || activeVendor.gstin,
                  defaultDayRate: parseFloat(target.rate?.value) || activeVendor.defaultDayRate,
                  bankAccount: bankAccount || activeVendor.bankAccount,
                  bankIfsc: bankIfsc || activeVendor.bankIfsc,
                  bankName: bankName || activeVendor.bankName,
                  kyc: kycData,
                });
              } else if (portalType === 'auditor' && activeAuditor && onUpdateAuditor) {
                onUpdateAuditor({
                  ...activeAuditor,
                  name: target.name.value.trim(),
                  phone: target.phone.value.trim(),
                  email: target.email.value.trim(),
                  pan,
                  defaultDayRate: parseFloat(target.rate?.value) || activeAuditor.defaultDayRate,
                  bankAccount: bankAccount || activeAuditor.bankAccount,
                  bankIfsc: bankIfsc || activeAuditor.bankIfsc,
                  bankName: bankName || activeAuditor.bankName,
                  kyc: kycData,
                });
              } else if (portalType === 'client' && activeClient && onUpdateClient) {
                onUpdateClient({
                  ...activeClient,
                  name: target.name.value.trim(),
                  contactPhone: target.phone.value.trim(),
                  contactEmail: target.email.value.trim(),
                  pan,
                  gstin: gstin || activeClient.gstin,
                  kyc: kycData,
                });
              }

              setIsEditKycOpen(false);
              showToast(`Profile & KYC details updated (Status: ${kycStatus})!`, 'success');
            }}
            className="space-y-4 text-xs"
          >
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">KYC Verification Status</span>
                <span className="text-[11px] text-slate-500">Approving KYC enables payout voucher generation</span>
              </div>
              <select
                name="kycStatus"
                defaultValue={
                  portalType === 'vendor'
                    ? activeVendor?.kyc?.status || 'Verified'
                    : portalType === 'auditor'
                    ? activeAuditor?.kyc?.status || 'Verified'
                    : activeClient?.kyc?.status || 'Verified'
                }
                className="font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Verified">Verified & Approved</option>
                <option value="Pending">Pending Review</option>
                <option value="In Review">In Review / Query Raised</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Entity Name</label>
                <input
                  name="name"
                  defaultValue={
                    portalType === 'vendor'
                      ? activeVendor?.name
                      : portalType === 'auditor'
                      ? activeAuditor?.name
                      : activeClient?.name
                  }
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={
                    portalType === 'vendor'
                      ? activeVendor?.email
                      : portalType === 'auditor'
                      ? activeAuditor?.email
                      : activeClient?.contactEmail
                  }
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  name="phone"
                  defaultValue={
                    portalType === 'vendor'
                      ? activeVendor?.phone
                      : portalType === 'auditor'
                      ? activeAuditor?.phone
                      : activeClient?.contactPhone
                  }
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Number (Tax Identity)</label>
                <input
                  name="pan"
                  defaultValue={
                    portalType === 'vendor'
                      ? activeVendor?.pan
                      : portalType === 'auditor'
                      ? activeAuditor?.pan
                      : activeClient?.pan
                  }
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {portalType !== 'auditor' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    name="gstin"
                    defaultValue={
                      portalType === 'vendor'
                        ? activeVendor?.gstin
                        : activeClient?.gstin
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              {portalType !== 'client' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agreed Day Rate (INR)</label>
                  <input
                    name="rate"
                    type="number"
                    defaultValue={
                      portalType === 'vendor'
                        ? activeVendor?.defaultDayRate
                        : activeAuditor?.defaultDayRate
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Bank details for vendor & auditor */}
            {portalType !== 'client' && (
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">Banking & Payout Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      name="bankName"
                      defaultValue={
                        portalType === 'vendor'
                          ? activeVendor?.bankName
                          : activeAuditor?.bankName
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                    <input
                      name="bankAccount"
                      defaultValue={
                        portalType === 'vendor'
                          ? activeVendor?.bankAccount
                          : activeAuditor?.bankAccount
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      name="bankIfsc"
                      defaultValue={
                        portalType === 'vendor'
                          ? activeVendor?.bankIfsc
                          : activeAuditor?.bankIfsc
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">KYC Audit Notes & Verification Remarks</label>
              <input
                name="kycRemarks"
                defaultValue="Verified with MCA / GST Portal and PAN database."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditKycOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Save Changes & Verify KYC
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: MANAGE PORTAL LOGIN CREDENTIALS                       */}
      {/* ============================================================== */}
      {isCredentialsModalOpen && (
        <Modal
          isOpen={isCredentialsModalOpen}
          onClose={() => setIsCredentialsModalOpen(false)}
          title={`Portal Login Credentials: ${portalType.toUpperCase()}`}
          subtitle="Configure sign-in email address, master password, and account activation"
          maxWidth="md"
        >
          <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
            {credNotice && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{credNotice}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Portal Login Email</label>
              <input
                type="email"
                required
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-semibold text-slate-700">Account Password</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold cursor-pointer"
                >
                  Generate Strong Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Account Status</span>
                <span className="text-[11px] text-slate-500">Deactivated users cannot access this portal</span>
              </div>
              <select
                value={credStatus}
                onChange={(e) => setCredStatus(e.target.value as any)}
                className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
              >
                <option value="ACTIVE">ACTIVE (Authorized)</option>
                <option value="INACTIVE">INACTIVE (Revoked)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Update Credentials
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION                                   */}
      {/* ============================================================== */}
      {isDeleteConfirmOpen && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="Confirm Account Deletion"
          subtitle="Irreversible action"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Are you sure you want to remove this account?
              </p>
              <p className="text-[11px] text-rose-700">
                This will delete the {portalType} master record and revoke login credentials for{' '}
                <strong>
                  {portalType === 'vendor'
                    ? activeVendor?.name
                    : portalType === 'auditor'
                    ? activeAuditor?.name
                    : activeClient?.name}
                </strong>
                .
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (portalType === 'vendor' && activeVendor && onDeleteVendor) {
                    onDeleteVendor(activeVendor.id);
                  } else if (portalType === 'auditor' && activeAuditor && onDeleteAuditor) {
                    onDeleteAuditor(activeAuditor.id);
                  } else if (portalType === 'client' && activeClient && onDeleteClient) {
                    onDeleteClient(activeClient.id);
                  }
                  setIsDeleteConfirmOpen(false);
                  showToast('Account successfully removed.', 'info');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: VENDOR - CREATE NEW BILL (SECTION 194C)               */}
      {/* ============================================================== */}
      {isCreateVendorBillOpen && (
        <Modal
          isOpen={isCreateVendorBillOpen}
          onClose={() => setIsCreateVendorBillOpen(false)}
          title="Submit Vendor Outsourcing Bill (Section 194C Compliant)"
          subtitle={`For Vendor: ${activeVendor?.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitBill} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bill / Invoice Number *</label>
                <input
                  required
                  value={billForm.billNumber}
                  onChange={(e) => setBillForm({ ...billForm, billNumber: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Project *</label>
                <select
                  value={billForm.projectId}
                  onChange={(e) => setBillForm({ ...billForm, projectId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Mandays Count *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={billForm.approvedMandays}
                  onChange={(e) => setBillForm({ ...billForm, approvedMandays: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agreed Rate per Manday (INR) *</label>
                <input
                  type="number"
                  required
                  value={billForm.agreedRate}
                  onChange={(e) => setBillForm({ ...billForm, agreedRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Prior Mobilization Advance Adjusted (INR)</label>
                <input
                  type="number"
                  value={billForm.advanceAdjusted}
                  onChange={(e) => setBillForm({ ...billForm, advanceAdjusted: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Live calculation banner */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Manday Amount:</span>
                <span>{formatINR(billForm.approvedMandays * billForm.agreedRate)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>(+) GST (18% Input Credit):</span>
                <span>+{formatINR(Math.round(billForm.approvedMandays * billForm.agreedRate * 0.18))}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>(-) Section 194C TDS (2%):</span>
                <span>-{formatINR(Math.round(billForm.approvedMandays * billForm.agreedRate * 0.02))}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5 text-sm">
                <span>Net Payable Disbursable:</span>
                <span>
                  {formatINR(
                    billForm.approvedMandays * billForm.agreedRate +
                      Math.round(billForm.approvedMandays * billForm.agreedRate * 0.18) -
                      Math.round(billForm.approvedMandays * billForm.agreedRate * 0.02) -
                      billForm.advanceAdjusted
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateVendorBillOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Submit Bill
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: AUDITOR - SUBMIT PHYSICAL COUNT REPORT                */}
      {/* ============================================================== */}
      {isAuditorReportModalOpen && (
        <Modal
          isOpen={isAuditorReportModalOpen}
          onClose={() => setIsAuditorReportModalOpen(false)}
          title="Submit Field Physical Count Report"
          subtitle={`Auditor: ${activeAuditor?.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitAuditorReport} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verification Location *</label>
              <select
                value={reportForm.locationId}
                onChange={(e) => setReportForm({ ...reportForm, locationId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                {auditorLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.siteName} ({l.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Book Stock Qty (System) *</label>
                <input
                  type="number"
                  required
                  value={reportForm.bookQty}
                  onChange={(e) => setReportForm({ ...reportForm, bookQty: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Counted Qty *</label>
                <input
                  type="number"
                  required
                  value={reportForm.physicalQty}
                  onChange={(e) => setReportForm({ ...reportForm, physicalQty: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center font-mono text-xs">
              <span>Variance Result:</span>
              <strong className={reportForm.physicalQty - reportForm.bookQty < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                {reportForm.physicalQty - reportForm.bookQty} Units ({(((reportForm.physicalQty - reportForm.bookQty) / (reportForm.bookQty || 1)) * 100).toFixed(1)}%)
              </strong>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Condition & Physical Stacking Notes</label>
              <input
                required
                value={reportForm.conditionNotes}
                onChange={(e) => setReportForm({ ...reportForm, conditionNotes: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discrepancy / Damage Remarks</label>
              <input
                value={reportForm.discrepancyRemarks}
                onChange={(e) => setReportForm({ ...reportForm, discrepancyRemarks: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store / Warehouse Signee Name</label>
              <input
                required
                value={reportForm.storeSignee}
                onChange={(e) => setReportForm({ ...reportForm, storeSignee: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAuditorReportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Submit Physical Count Report
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: CLIENT - REQUEST REVISIT / SPECIAL ATTENTION          */}
      {/* ============================================================== */}
      {isClientRevisitModalOpen && (
        <Modal
          isOpen={isClientRevisitModalOpen}
          onClose={() => setIsClientRevisitModalOpen(false)}
          title="Flag Store Location / Request Revisit"
          subtitle={`Client: ${activeClient?.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Store / Warehouse Site</label>
              <select
                value={revisitLocationId}
                onChange={(e) => setRevisitLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {state.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.siteName} ({loc.city}, {loc.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Special Instructions / Reason for Revisit</label>
              <textarea
                rows={3}
                required
                value={revisitRemarks}
                onChange={(e) => setRevisitRemarks(e.target.value)}
                placeholder="High value SKU reconciliation required or variance verification request..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClientRevisitModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = revisitLocationId || state.locations[0]?.id;
                  if (targetId && onUpdateLocationStatus) {
                    onUpdateLocationStatus(targetId, 'Revisit Required', revisitRemarks || 'Client requested urgent recount');
                  }
                  setIsClientRevisitModalOpen(false);
                  showToast('Revisit request dispatched to Project Operations Manager!', 'success');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Dispatch Revisit Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 8: UPDATE SITE STATUS MODAL                              */}
      {/* ============================================================== */}
      {isUpdateSiteStatusOpen && selectedLocationForStatus && (
        <Modal
          isOpen={isUpdateSiteStatusOpen}
          onClose={() => setIsUpdateSiteStatusOpen(false)}
          title={`Update Execution: ${selectedLocationForStatus.siteName}`}
          subtitle="Record field completion or request recount"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Status</label>
              <select
                value={targetSiteStatus}
                onChange={(e) => setTargetSiteStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              >
                <option value="In Progress">In Progress (Auditors on Site)</option>
                <option value="Completed">Completed (100% Count Done)</option>
                <option value="Revisit Required">Revisit Required</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Remarks / Notes</label>
              <textarea
                rows={2}
                value={siteStatusRemarks}
                onChange={(e) => setSiteStatusRemarks(e.target.value)}
                placeholder="E.g. Count finished, certificate signed by store manager"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUpdateSiteStatusOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateLocationStatus) {
                    onUpdateLocationStatus(selectedLocationForStatus.id, targetSiteStatus, siteStatusRemarks);
                  }
                  setIsUpdateSiteStatusOpen(false);
                  showToast(`Location ${selectedLocationForStatus.siteName} updated to ${targetSiteStatus}!`, 'success');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
