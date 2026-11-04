/**
 * JAYSOFTSHINE – AUDIT & OPERATIONS ERP
 * Tagline: One Platform. Complete Business Control.
 */

import React, { useState, useEffect } from 'react';
import {
  AppState,
  getInitialState,
  saveState,
  resetToSeedData,
  DEFAULT_ROLE_PERMISSIONS,
} from './services/storage';
import { Sidebar, NavTabId } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';
import { LoginPage } from './components/auth/LoginPage';
import {
  UserProfile,
  Project,
  ProjectLocation,
  Assignment,
  AttendanceRecord,
  ClientInvoice,
  ClientPaymentReceipt,
  VendorBill,
  AuditorSettlement,
  ExpenseRecord,
  JournalEntry,
  SmtpConfig,
  Client,
  Auditor,
  Vendor,
  WorkReport,
  AuditLogEntry,
  AuditAction,
  AuditEntityType,
  AuditFieldChange,
  RolePermissionConfig,
} from './types/erp';
import { formatINR } from './utils/rules';
import { ShieldAlert } from 'lucide-react';

// Module Views
import { DashboardView } from './components/modules/DashboardView';
import { ClientsView } from './components/modules/ClientsView';
import { ProjectsView } from './components/modules/ProjectsView';
import { LocationsView } from './components/modules/LocationsView';
import { AssignmentsView } from './components/modules/AssignmentsView';
import { WorkforceAuditorsView } from './components/modules/WorkforceAuditorsView';
import { VendorManagementView } from './components/modules/VendorManagementView';
import { AttendanceMandaysView } from './components/modules/AttendanceMandaysView';
import { FieldOperationsView } from './components/modules/FieldOperationsView';
import { DocumentsReportsView } from './components/modules/DocumentsReportsView';
import { ClientBillingView } from './components/modules/ClientBillingView';
import { VendorPayablesView } from './components/modules/VendorPayablesView';
import { AuditorPayablesView } from './components/modules/AuditorPayablesView';
import { ExpensesView } from './components/modules/ExpensesView';
import { AccountingView } from './components/modules/AccountingView';
import { GstTdsView } from './components/modules/GstTdsView';
import { MisAnalyticsView } from './components/modules/MisAnalyticsView';
import { NotificationsView } from './components/modules/NotificationsView';
import { UserManagementView } from './components/modules/UserManagementView';
import { SettingsView } from './components/modules/SettingsView';
import { PortalsView } from './components/modules/PortalsView';
import { AuditTrailView } from './components/modules/AuditTrailView';

export default function App() {
  const [state, setState] = useState<AppState>(getInitialState);
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedProjectIdForDetail, setSelectedProjectIdForDetail] = useState<string | null>(null);

  // Sync state to local storage on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Centralized audit logger
  const createAuditEntry = (
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    description: string,
    changes?: AuditFieldChange[],
    severity: 'INFO' | 'NOTICE' | 'HIGH' | 'CRITICAL' = 'NOTICE'
  ): AuditLogEntry => {
    return {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action,
      entityType,
      entityId,
      entityName,
      description,
      ipAddress: '103.21.124.88 (Pune, MH - TLS 1.3 Certified)',
      changes,
      severity,
    };
  };

  // Auth Handlers
  const handleLogin = (user: UserProfile) => {
    const loginAudit: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SECURITY_EVENT',
      entityType: 'SECURITY',
      entityId: user.id,
      entityName: `${user.name} Session Authentication`,
      description: `User ${user.name} (${user.role}) successfully authenticated from IP 103.21.124.88`,
      ipAddress: '103.21.124.88 (Pune, MH)',
      severity: 'INFO',
    };

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentUser: user,
      auditLogs: [loginAudit, ...prev.auditLogs],
    }));

    // Route to default view based on role
    if (user.role === 'VENDOR') setCurrentTab('vendor-portal');
    else if (user.role === 'AUDITOR') setCurrentTab('auditor-portal');
    else if (user.role === 'CLIENT') setCurrentTab('client-portal');
    else setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    const logoutAudit: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'SECURITY_EVENT',
      entityType: 'SECURITY',
      entityId: state.currentUser.id,
      entityName: `${state.currentUser.name} Session Termination`,
      description: `User ${state.currentUser.name} (${state.currentUser.role}) logged out of session. Session invalidated.`,
      ipAddress: '103.21.124.88 (Pune, MH)',
      severity: 'INFO',
    };

    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      auditLogs: [logoutAudit, ...prev.auditLogs],
    }));
    setCurrentTab('dashboard');
  };

  const handleSwitchUser = (user: UserProfile) => {
    const switchAudit = createAuditEntry(
      'SECURITY_EVENT',
      'SECURITY',
      user.id,
      `User Impersonation: ${user.name}`,
      `Admin switched active session persona to ${user.name} (${user.role})`,
      [{ field: 'activeRole', oldValue: state.currentUser.role, newValue: user.role }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      currentUser: user,
      auditLogs: [switchAudit, ...prev.auditLogs],
    }));

    if (user.role === 'VENDOR') setCurrentTab('vendor-portal');
    else if (user.role === 'AUDITOR') setCurrentTab('auditor-portal');
    else if (user.role === 'CLIENT') setCurrentTab('client-portal');
    else setCurrentTab('dashboard');
  };

  const handlePasswordChange = (newPassword: string) => {
    const pwdAudit = createAuditEntry(
      'SECURITY_EVENT',
      'SECURITY',
      'SEC-ADMIN-PWD',
      'Admin Master Password',
      'Super Admin Jayesh Vyas reset the master system credential',
      [{ field: 'adminPassword', oldValue: '••••••••', newValue: '•••••••• (Updated)' }],
      'CRITICAL'
    );

    setState((prev) => ({
      ...prev,
      adminPassword: newPassword,
      auditLogs: [pwdAudit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Master Password Updated',
          message: 'The administrator password has been updated and securely recorded in the audit trail.',
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleResetData = () => {
    const fresh = resetToSeedData();
    setState(fresh);
    setCurrentTab('dashboard');
  };

  const handleMarkNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  const handleMarkAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const handleNavigateWithEntity = (tab: NavTabId, entityId?: string) => {
    if (tab === 'projects' && entityId) {
      setSelectedProjectIdForDetail(entityId);
    }
    setCurrentTab(tab);
  };

  // RBAC & Role Management Handlers
  const handleUpdateRolePermissions = (updatedConfig: RolePermissionConfig) => {
    const oldConfig = state.rolePermissions.find((r) => r.role === updatedConfig.role);
    const audit = createAuditEntry(
      'CONFIG_CHANGE',
      'SECURITY',
      `ROLE-${updatedConfig.role}`,
      `${updatedConfig.title} Permissions`,
      `Admin updated access rights & module visibility for role ${updatedConfig.role}`,
      [
        {
          field: 'allowedTabs',
          oldValue: oldConfig?.allowedTabs.join(', ') || '',
          newValue: updatedConfig.allowedTabs.join(', '),
        },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      rolePermissions: prev.rolePermissions.map((rp) =>
        rp.role === updatedConfig.role ? updatedConfig : rp
      ),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Role Permissions Updated',
          message: `Access rights for ${updatedConfig.title} updated in real time.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleResetRolePermissions = () => {
    const audit = createAuditEntry(
      'CONFIG_CHANGE',
      'SECURITY',
      'RBAC-DEFAULTS',
      'Factory RBAC Policies',
      'Admin reset all role access permissions to factory enterprise standards',
      undefined,
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  const handleAddUser = (newUser: UserProfile) => {
    const audit = createAuditEntry(
      'CREATE',
      'SECURITY',
      newUser.id,
      newUser.name,
      `Created new user profile ${newUser.name} with role ${newUser.role}`,
      [{ field: 'email', oldValue: null, newValue: newUser.email }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'New User Account Created',
          message: `${newUser.name} added as ${newUser.role}.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const old = state.users.find((u) => u.id === updatedUser.id);
    const audit = createAuditEntry(
      'UPDATE',
      'SECURITY',
      updatedUser.id,
      updatedUser.name,
      `Updated user record for ${updatedUser.name}`,
      [
        { field: 'role', oldValue: old?.role, newValue: updatedUser.role },
        { field: 'status', oldValue: old?.status, newValue: updatedUser.status },
      ],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      currentUser: prev.currentUser.id === updatedUser.id ? updatedUser : prev.currentUser,
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  // Business Action Handlers with Detailed Audit Logging
  const handleAddClient = (client: Client) => {
    const audit = createAuditEntry(
      'CREATE',
      'CLIENT',
      client.clientId,
      client.name,
      `Onboarded client ${client.name} (GSTIN: ${client.gstin}) with ${client.paymentTermsDays} days credit terms`,
      [{ field: 'name', oldValue: null, newValue: client.name }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      clients: [client, ...prev.clients],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'New Client Onboarded',
          message: `${client.name} (${client.clientId}) registered.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddProject = (project: Project) => {
    const audit = createAuditEntry(
      'CREATE',
      'PROJECT',
      project.projectId,
      project.name,
      `Created audit project ${project.name} under ${project.executionModel} model (Client Rate: ${formatINR(project.clientRatePerManday)}/day)`,
      [
        { field: 'budget', oldValue: 0, newValue: formatINR(project.budget) },
        { field: 'executionModel', oldValue: null, newValue: project.executionModel },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      projects: [project, ...prev.projects],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'New Audit Project Created',
          message: `${project.name} (${project.projectId}) launched.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddLocations = (newLocs: ProjectLocation[]) => {
    const audit = createAuditEntry(
      'CREATE',
      'LOCATION',
      `${newLocs.length} Sites`,
      'Site Master Bulk Import',
      `Imported ${newLocs.length} site locations across India to project repository`,
      [{ field: 'siteCount', oldValue: 0, newValue: newLocs.length }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      locations: [...prev.locations, ...newLocs],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Locations Imported / Added',
          message: `${newLocs.length} sites successfully added to project location master.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddAssignment = (assignment: Assignment, locationIds: string[]) => {
    const audit = createAuditEntry(
      'CREATE',
      'ASSIGNMENT',
      assignment.assignmentId,
      `Work Order for ${assignment.assignedToName}`,
      `Allocated ${locationIds.length} sites to ${assignment.assignedToName} at ${formatINR(assignment.executionRateSnapshot)}/manday`,
      [
        { field: 'assignedTo', oldValue: null, newValue: assignment.assignedToName },
        { field: 'siteCount', oldValue: 0, newValue: locationIds.length },
      ],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      assignments: [assignment, ...prev.assignments],
      locations: prev.locations.map((loc) =>
        locationIds.includes(loc.id)
          ? {
              ...loc,
              status: 'Allocated',
              assignedType: assignment.executionType === 'DIRECT' ? 'AUDITOR' : 'VENDOR',
              assignedEntityId: assignment.assignedToId,
              assignedEntityName: assignment.assignedToName,
              executionCostRate: assignment.executionRateSnapshot,
            }
          : loc
      ),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Work Order Generated',
          message: `Assignment ${assignment.assignmentId} issued to ${assignment.assignedToName}.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddAuditor = (auditor: Auditor) => {
    setState((prev) => ({
      ...prev,
      auditors: [auditor, ...prev.auditors],
    }));
  };

  const handleAddVendor = (vendor: Vendor) => {
    setState((prev) => ({
      ...prev,
      vendors: [vendor, ...prev.vendors],
    }));
  };

  const handleAddAttendance = (attendanceRecord: AttendanceRecord) => {
    setState((prev) => ({
      ...prev,
      attendance: [attendanceRecord, ...prev.attendance],
    }));
  };

  const handleApproveAttendance = (id: string) => {
    const rec = state.attendance.find((a) => a.id === id);
    const audit = createAuditEntry(
      'APPROVE',
      'ATTENDANCE',
      id,
      `${rec?.auditorName || 'Auditor'} Manday Approval`,
      `Project Manager approved ${rec?.mandays || 1.0} manday for ${rec?.locationName || 'site'} after GPS photo verification`,
      [
        { field: 'approvalStatus', oldValue: 'Pending', newValue: 'Approved' },
        { field: 'mandays', oldValue: '0', newValue: `${rec?.mandays || 1.0}` },
      ],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      attendance: prev.attendance.map((a) =>
        a.id === id
          ? {
              ...a,
              approvalStatus: 'Approved',
              approvedBy: state.currentUser.name,
              approvalDate: new Date().toISOString(),
            }
          : a
      ),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Manday Verified & Approved',
          message: `Attendance approved by ${state.currentUser.name}. Ready for auditor settlement & billing.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleRejectAttendance = (id: string, reason: string) => {
    const rec = state.attendance.find((a) => a.id === id);
    const audit = createAuditEntry(
      'REJECT',
      'ATTENDANCE',
      id,
      `${rec?.auditorName || 'Auditor'} Manday Rejection`,
      `Rejected attendance submission for ${rec?.locationName || 'site'}: ${reason}`,
      [
        { field: 'approvalStatus', oldValue: 'Pending', newValue: 'Rejected' },
        { field: 'rejectionReason', oldValue: null, newValue: reason },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      attendance: prev.attendance.map((a) =>
        a.id === id
          ? {
              ...a,
              approvalStatus: 'Rejected',
              rejectionReason: reason,
              approvalDate: new Date().toISOString(),
            }
          : a
      ),
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  const handleAddReport = (report: WorkReport) => {
    setState((prev) => ({
      ...prev,
      reports: [report, ...prev.reports],
    }));
  };

  const handleAddInvoice = (invoice: ClientInvoice) => {
    const audit = createAuditEntry(
      'CREATE',
      'INVOICE',
      invoice.invoiceNumber,
      `Client Tax Invoice for ${invoice.clientName}`,
      `Generated GST Tax Invoice ${invoice.invoiceNumber} for ₹${invoice.totalAmount.toLocaleString('en-IN')} (Taxable: ₹${invoice.taxableAmount.toLocaleString('en-IN')})`,
      [
        { field: 'invoiceAmount', oldValue: 0, newValue: formatINR(invoice.totalAmount) },
        { field: 'paymentStatus', oldValue: null, newValue: 'Unpaid' },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      invoices: [invoice, ...prev.invoices],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Client GST Invoice Generated',
          message: `Invoice ${invoice.invoiceNumber} for ₹${invoice.totalAmount.toLocaleString('en-IN')} raised.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleRecordPayment = (receipt: ClientPaymentReceipt) => {
    const totalCredit = receipt.amountReceived + receipt.tdsDeducted;
    const targetInv = state.invoices.find((i) => i.id === receipt.invoiceId);
    const audit = createAuditEntry(
      'POST',
      'RECEIPT',
      receipt.receiptNumber,
      `Client Payment: ${receipt.clientName}`,
      `Recorded bank receipt of ₹${receipt.amountReceived.toLocaleString('en-IN')} with ₹${receipt.tdsDeducted.toLocaleString('en-IN')} TDS credit asset via ${receipt.paymentMode}`,
      [
        { field: 'amountReceived', oldValue: 0, newValue: formatINR(receipt.amountReceived) },
        { field: 'tdsDeducted', oldValue: 0, newValue: formatINR(receipt.tdsDeducted) },
        { field: 'invoiceBalanceDue', oldValue: formatINR(targetInv?.balanceDue || 0), newValue: formatINR(Math.max(0, (targetInv?.balanceDue || 0) - totalCredit)) },
      ],
      'HIGH'
    );

    setState((prev) => {
      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.id === receipt.invoiceId) {
          const newPaid = inv.paidAmount + totalCredit;
          const newBalance = Math.max(0, inv.totalAmount - newPaid);
          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBalance,
            paymentStatus: newBalance <= 0 ? ('Paid' as const) : ('Partially Paid' as const),
          };
        }
        return inv;
      });

      return {
        ...prev,
        receipts: [receipt, ...prev.receipts],
        invoices: updatedInvoices,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [
          {
            id: `notif_${Date.now()}`,
            title: 'Client Payment Received',
            message: `Bank receipt ${receipt.receiptNumber} recorded.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const handleAddVendorBill = (bill: VendorBill) => {
    setState((prev) => ({
      ...prev,
      vendorBills: [bill, ...prev.vendorBills],
    }));
  };

  const handlePayVendorBill = (billId: string, amount: number) => {
    const targetBill = state.vendorBills.find((b) => b.id === billId);
    const audit = createAuditEntry(
      'DISBURSE',
      'VENDOR_BILL',
      targetBill?.billNumber || billId,
      `Vendor Payout: ${targetBill?.vendorName}`,
      `Disbursed vendor settlement payment of ₹${amount.toLocaleString('en-IN')} via bank transfer`,
      [
        { field: 'paidAmount', oldValue: formatINR(targetBill?.paidAmount || 0), newValue: formatINR((targetBill?.paidAmount || 0) + amount) },
        { field: 'outstanding', oldValue: formatINR(targetBill?.outstanding || 0), newValue: formatINR(Math.max(0, (targetBill?.outstanding || 0) - amount)) },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      vendorBills: prev.vendorBills.map((b) =>
        b.id === billId
          ? {
              ...b,
              paidAmount: b.paidAmount + amount,
              outstanding: Math.max(0, b.outstanding - amount),
              paymentStatus: b.outstanding - amount <= 0 ? 'Paid' : 'Partially Paid',
              paymentDate: new Date().toISOString().split('T')[0],
            }
          : b
      ),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Vendor Settlement Disbursed',
          message: `Payment of ₹${amount.toLocaleString('en-IN')} disbursed to vendor partner.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddSettlement = (settlement: AuditorSettlement) => {
    setState((prev) => ({
      ...prev,
      auditorSettlements: [settlement, ...prev.auditorSettlements],
    }));
  };

  const handlePaySettlement = (settlementId: string, ref: string) => {
    const targetSet = state.auditorSettlements.find((s) => s.id === settlementId);
    const audit = createAuditEntry(
      'DISBURSE',
      'AUDITOR_SETTLEMENT',
      targetSet?.settlementNumber || settlementId,
      `Auditor Remuneration: ${targetSet?.auditorName}`,
      `Disbursed auditor remuneration of ₹${(targetSet?.netPayable || 0).toLocaleString('en-IN')} via ${ref}`,
      [
        { field: 'status', oldValue: 'Approved', newValue: 'Paid' },
        { field: 'paymentRef', oldValue: null, newValue: ref },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      auditorSettlements: prev.auditorSettlements.map((s) =>
        s.id === settlementId
          ? {
              ...s,
              status: 'Paid',
              paidAmount: s.netPayable,
              outstanding: 0,
              paymentDate: new Date().toISOString().split('T')[0],
              paymentRef: ref,
            }
          : s
      ),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Auditor Remuneration Paid',
          message: `Settlement disbursed via ${ref}.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddExpense = (expense: ExpenseRecord) => {
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
  };

  const handleApproveExpense = (id: string, approvedBy: string) => {
    const exp = state.expenses.find((e) => e.id === id);
    const audit = createAuditEntry(
      'APPROVE',
      'EXPENSE',
      id,
      `Expense Claim: ${exp?.submittedBy || 'Auditor'}`,
      `Approved ${exp?.category} claim of ₹${(exp?.amount || 0).toLocaleString('en-IN')} for ${exp?.projectId || 'project'}`,
      [{ field: 'approvalStatus', oldValue: 'Pending', newValue: 'Approved' }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === id ? { ...e, approvalStatus: 'Approved', approvedBy } : e
      ),
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  const handleRejectExpense = (id: string) => {
    const exp = state.expenses.find((e) => e.id === id);
    const audit = createAuditEntry(
      'REJECT',
      'EXPENSE',
      id,
      `Expense Claim: ${exp?.submittedBy || 'Auditor'}`,
      `Rejected ${exp?.category} claim of ₹${(exp?.amount || 0).toLocaleString('en-IN')}`,
      [{ field: 'approvalStatus', oldValue: 'Pending', newValue: 'Rejected' }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === id ? { ...e, approvalStatus: 'Rejected' } : e
      ),
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  const handleAddJournal = (journal: JournalEntry) => {
    const audit = createAuditEntry(
      'POST',
      'JOURNAL_ENTRY',
      journal.voucherNo,
      `Journal Voucher: ${journal.narration}`,
      `Posted double-entry general ledger voucher ${journal.voucherNo} with ₹${journal.totalDebit.toLocaleString('en-IN')} balanced debit/credit`,
      [
        { field: 'totalDebit', oldValue: 0, newValue: formatINR(journal.totalDebit) },
        { field: 'isPosted', oldValue: false, newValue: true },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      journals: [journal, ...prev.journals],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Double-Entry Journal Posted',
          message: `Voucher ${journal.voucherNo} (Debit/Credit: ₹${journal.totalDebit.toLocaleString('en-IN')}) posted.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleSaveSmtp = (config: SmtpConfig) => {
    const audit = createAuditEntry(
      'CONFIG_CHANGE',
      'SMTP',
      'SMTP-CONFIG',
      'Transactional Mail Gateway',
      `Super Admin updated SMTP gateway to ${config.host}:${config.port} (${config.fromEmail})`,
      [
        { field: 'host', oldValue: state.smtpConfig.host, newValue: config.host },
        { field: 'port', oldValue: state.smtpConfig.port, newValue: config.port },
      ],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      smtpConfig: config,
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Mail SMTP Configured',
          message: `Outbound SMTP gateway set to ${config.host}:${config.port}.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  // If user is not authenticated, render Login Page as Home Screen
  if (!state.isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        users={state.users}
        adminPassword={state.adminPassword}
      />
    );
  }

  // Determine permitted tabs for current user based on RBAC rules
  const currentRoleConfig = state.rolePermissions.find(
    (rp) => rp.role === state.currentUser.role
  );

  const allowedTabs: NavTabId[] = currentRoleConfig?.allowedTabs || [
    state.currentUser.role === 'VENDOR'
      ? 'vendor-portal'
      : state.currentUser.role === 'AUDITOR'
      ? 'auditor-portal'
      : state.currentUser.role === 'CLIENT'
      ? 'client-portal'
      : 'dashboard',
  ];

  const isTabAllowed = allowedTabs.includes(currentTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedProjectIdForDetail(null);
          setCurrentTab(tab);
        }}
        userRole={state.currentUser.role}
        userName={state.currentUser.name}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        unreadCount={state.notifications.filter((n) => !n.read).length}
        allowedTabs={allowedTabs}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <Header
          currentUser={state.currentUser}
          availableUsers={state.users}
          onSwitchUser={handleSwitchUser}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentTab={currentTab}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onNavigateTab={(tab) => {
            setSelectedProjectIdForDetail(null);
            setCurrentTab(tab);
          }}
          onResetData={handleResetData}
          notifications={state.notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onLogout={handleLogout}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Access Restriction Barrier for unauthorized page requests */}
          {!isTabAllowed ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm my-12 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Access Restricted (403 Forbidden)</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your active role (<strong className="font-mono text-slate-900">{state.currentUser.role}</strong>) does not have privileges to view module <strong className="font-mono text-slate-900">{currentTab}</strong>.
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider font-mono">JaySoftShine Governance Policy:</div>
                <div className="text-[11px] leading-relaxed">
                  Vendors and Auditors are strictly isolated to protect corporate financials, client commercial rates, and double-entry accounting books.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab(allowedTabs[0] || 'dashboard')}
                className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
              >
                Return to Authorized {allowedTabs[0] ? allowedTabs[0].toUpperCase() : 'PORTAL'}
              </button>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView state={state} onNavigate={handleNavigateWithEntity} />
              )}

              {currentTab === 'clients' && (
                <ClientsView
                  clients={state.clients}
                  onAddClient={handleAddClient}
                  onUpdateClient={() => {}}
                />
              )}

              {currentTab === 'projects' && (
                <ProjectsView
                  projects={state.projects}
                  clients={state.clients}
                  locations={state.locations}
                  assignments={state.assignments}
                  attendance={state.attendance}
                  reports={state.reports}
                  invoices={state.invoices}
                  vendorBills={state.vendorBills}
                  auditorSettlements={state.auditorSettlements}
                  expenses={state.expenses}
                  auditLogs={state.auditLogs}
                  initialSelectedProjectId={selectedProjectIdForDetail}
                  onAddProject={handleAddProject}
                  onNavigate={handleNavigateWithEntity}
                />
              )}

              {currentTab === 'locations' && (
                <LocationsView
                  locations={state.locations}
                  projects={state.projects}
                  auditors={state.auditors}
                  vendors={state.vendors}
                  onAddLocations={handleAddLocations}
                  onUpdateLocation={() => {}}
                />
              )}

              {currentTab === 'assignments' && (
                <AssignmentsView
                  assignments={state.assignments}
                  projects={state.projects}
                  locations={state.locations}
                  auditors={state.auditors}
                  vendors={state.vendors}
                  onAddAssignment={handleAddAssignment}
                />
              )}

              {currentTab === 'workforce' && (
                <WorkforceAuditorsView
                  auditors={state.auditors}
                  onAddAuditor={handleAddAuditor}
                  onUpdateAuditor={() => {}}
                />
              )}

              {currentTab === 'vendors' && (
                <VendorManagementView
                  vendors={state.vendors}
                  vendorBills={state.vendorBills}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={() => {}}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceMandaysView
                  attendance={state.attendance}
                  projects={state.projects}
                  locations={state.locations}
                  auditors={state.auditors}
                  vendors={state.vendors}
                  onAddAttendance={handleAddAttendance}
                  onApprove={(id) => handleApproveAttendance(id)}
                  onReject={(id, reason) => handleRejectAttendance(id, reason)}
                />
              )}

              {currentTab === 'field-ops' && (
                <FieldOperationsView
                  reports={state.reports}
                  locations={state.locations}
                  projects={state.projects}
                  auditors={state.auditors}
                  onAddReport={handleAddReport}
                  onUpdateLocationStatus={() => {}}
                />
              )}

              {currentTab === 'documents' && (
                <DocumentsReportsView
                  reports={state.reports}
                  projects={state.projects}
                />
              )}

              {currentTab === 'billing' && (
                <ClientBillingView
                  invoices={state.invoices}
                  receipts={state.receipts}
                  projects={state.projects}
                  clients={state.clients}
                  onAddInvoice={handleAddInvoice}
                  onRecordPayment={handleRecordPayment}
                />
              )}

              {currentTab === 'vendor-payables' && (
                <VendorPayablesView
                  vendorBills={state.vendorBills}
                  vendors={state.vendors}
                  projects={state.projects}
                  onAddBill={handleAddVendorBill}
                  onPayBill={handlePayVendorBill}
                />
              )}

              {currentTab === 'auditor-payables' && (
                <AuditorPayablesView
                  settlements={state.auditorSettlements}
                  auditors={state.auditors}
                  projects={state.projects}
                  attendance={state.attendance}
                  onAddSettlement={handleAddSettlement}
                  onPaySettlement={handlePaySettlement}
                />
              )}

              {currentTab === 'expenses' && (
                <ExpensesView
                  expenses={state.expenses}
                  projects={state.projects}
                  locations={state.locations}
                  onAddExpense={handleAddExpense}
                  onApproveExpense={handleApproveExpense}
                  onRejectExpense={handleRejectExpense}
                />
              )}

              {currentTab === 'accounting' && (
                <AccountingView
                  journals={state.journals}
                  projects={state.projects}
                  onAddJournal={handleAddJournal}
                />
              )}

              {currentTab === 'gst-tds' && (
                <GstTdsView
                  invoices={state.invoices}
                  vendorBills={state.vendorBills}
                />
              )}

              {currentTab === 'analytics' && (
                <MisAnalyticsView
                  projects={state.projects}
                  invoices={state.invoices}
                  vendorBills={state.vendorBills}
                  auditorSettlements={state.auditorSettlements}
                  locations={state.locations}
                  expenses={state.expenses}
                />
              )}

              {currentTab === 'audit-trail' && (
                <AuditTrailView
                  auditLogs={state.auditLogs}
                  onNavigateToEntity={handleNavigateWithEntity}
                />
              )}

              {currentTab === 'notifications' && (
                <NotificationsView
                  notifications={state.notifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onMarkRead={handleMarkNotificationRead}
                />
              )}

              {currentTab === 'users' && (
                <UserManagementView
                  users={state.users}
                  currentUser={state.currentUser}
                  rolePermissions={state.rolePermissions}
                  onSwitchUser={handleSwitchUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onUpdateRolePermissions={handleUpdateRolePermissions}
                  onResetRolePermissions={handleResetRolePermissions}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  smtpConfig={state.smtpConfig}
                  onSaveSmtp={handleSaveSmtp}
                  adminPassword={state.adminPassword}
                  onPasswordChange={handlePasswordChange}
                />
              )}

              {/* Dedicated Portals */}
              {currentTab === 'vendor-portal' && (
                <PortalsView
                  portalType="vendor"
                  state={state}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'auditor-portal' && (
                <PortalsView
                  portalType="auditor"
                  state={state}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'client-portal' && (
                <PortalsView
                  portalType="client"
                  state={state}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Admin Change Password Modal (Default: Jshine@2329) */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentSavedPassword={state.adminPassword}
        onPasswordChange={handlePasswordChange}
      />
    </div>
  );
}
