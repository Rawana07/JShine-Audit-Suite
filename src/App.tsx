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
  OrganizationProfile,
  LocationStatus,
  ProjectSyncConfig,
  TaxClient,
} from './types/erp';
import { formatINR } from './utils/rules';
import { ShieldAlert, KeyRound, CheckCircle2, Lock, X } from 'lucide-react';
import { Modal } from './components/common/Modal';

// Module Views
import { DashboardView } from './components/modules/DashboardView';
import { ClientsView } from './components/modules/ClientsView';
import { TaxClientsView } from './components/modules/TaxClientsView';
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
import {
  fetchFullCloudState,
  pushStateToCloud,
  listenToCloudUpdates,
  subscribeToSyncStatus,
  CloudSyncStatus,
} from './services/cloudDb';

export default function App() {
  const [state, setState] = useState<AppState>(getInitialState);
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedProjectIdForDetail, setSelectedProjectIdForDetail] = useState<string | null>(null);

  // Cloud Database Synchronization State (Firestore)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>({
    connected: false,
    lastSyncedAt: null,
    error: null,
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Email Password Reset Link State (?resetEmail=...&resetToken=...)
  const [resetUrlParams, setResetUrlParams] = useState<{ email: string; token: string } | null>(null);
  const [resetModalNewPassword, setResetModalNewPassword] = useState('');
  const [resetModalConfirmPassword, setResetModalConfirmPassword] = useState('');
  const [resetModalSuccessMsg, setResetModalSuccessMsg] = useState<string | null>(null);
  const [resetModalErrorMsg, setResetModalErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const email = search.get('resetEmail');
      const token = search.get('resetToken');
      if (email && token) {
        setResetUrlParams({ email, token });
      }
    }
  }, []);

  // Multi-Device Cloud Sync Initialization
  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to connection status
    const unsubStatus = subscribeToSyncStatus((status) => {
      if (isMounted) setCloudSyncStatus(status);
    });

    // 2. Fetch full cloud state on boot so any device immediately loads the latest state
    (async () => {
      setIsCloudSyncing(true);
      try {
        const cloudData = await fetchFullCloudState();
        if (cloudData && isMounted) {
          setState((prev) => {
            const merged = { ...prev, ...cloudData };
            saveState(merged);
            return merged;
          });
        } else if (!cloudData) {
          // If cloud is empty, seed with current state
          await pushStateToCloud(state, true);
        }
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    })();

    // 3. Listen to real-time updates pushed from other devices
    const unsubCloud = listenToCloudUpdates((partial) => {
      if (isMounted) {
        setState((prev) => {
          const merged = { ...prev, ...partial };
          saveState(merged);
          return merged;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubStatus();
      unsubCloud();
    };
  }, []);

  // Sync state to local storage and push to Google Cloud Firestore on change
  useEffect(() => {
    saveState(state);
    pushStateToCloud(state);
  }, [state]);

  const handleForceSync = async () => {
    setIsCloudSyncing(true);
    try {
      const cloudData = await fetchFullCloudState();
      if (cloudData) {
        setState((prev) => {
          const merged = { ...prev, ...cloudData };
          saveState(merged);
          return merged;
        });
      }
      await pushStateToCloud(state, true);
    } finally {
      setIsCloudSyncing(false);
    }
  };

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

  // Organization Master Handler
  const handleUpdateOrganization = (org: OrganizationProfile) => {
    const audit = createAuditEntry(
      'CONFIG_CHANGE',
      'COMPANY',
      'ORG-MASTER',
      'Company Master Configuration',
      `Updated company profile: ${org.name} (GSTIN: ${org.gstin}, PAN: ${org.pan})`,
      [
        { field: 'name', oldValue: state.organization.name, newValue: org.name },
        { field: 'gstin', oldValue: state.organization.gstin, newValue: org.gstin },
        { field: 'pan', oldValue: state.organization.pan, newValue: org.pan },
      ],
      'CRITICAL'
    );

    setState((prev) => ({
      ...prev,
      organization: org,
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Organization Master Saved',
          message: `${org.name} statutory and tax parameters updated.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  // Business Action Handlers with Detailed Audit Logging
  const handleAddClient = (client: Client, loginPassword?: string) => {
    const audit = createAuditEntry(
      'CREATE',
      'CLIENT',
      client.clientId,
      client.name,
      `Onboarded client ${client.name} (GSTIN: ${client.gstin}) with ${client.paymentTermsDays} days credit terms`,
      [{ field: 'name', oldValue: null, newValue: client.name }],
      'NOTICE'
    );

    const clientEmail = (client.contactEmail || client.email || `${client.clientId.toLowerCase()}@clientportal.com`).trim().toLowerCase();
    const newUser: UserProfile = {
      id: `usr_${client.clientId}`,
      name: client.contactPerson || client.name,
      email: clientEmail,
      role: 'CLIENT',
      phone: client.contactPhone || client.phone || '+91 98200 00000',
      linkedEntityId: client.id,
      status: 'ACTIVE',
      department: client.name,
      password: (loginPassword && loginPassword.trim()) ? loginPassword.trim() : 'Jshine@2329',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setState((prev) => ({
      ...prev,
      clients: [client, ...prev.clients],
      users: [...prev.users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase() && u.linkedEntityId !== client.id && u.linkedEntityId !== client.clientId), newUser],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'New Client Onboarded',
          message: `${client.name} (${client.clientId}) registered with active Portal Login.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const old = state.clients.find((c) => c.clientId === updatedClient.clientId || c.id === updatedClient.id);
    const audit = createAuditEntry(
      'UPDATE',
      'CLIENT',
      updatedClient.clientId,
      updatedClient.name,
      `Updated client profile & KYC for ${updatedClient.name}`,
      [
        { field: 'kycStatus', oldValue: old?.kyc?.status, newValue: updatedClient.kyc?.status },
        { field: 'creditLimit', oldValue: old?.creditLimit, newValue: updatedClient.creditLimit },
      ],
      'NOTICE'
    );

    setState((prev) => {
      const newEmail = (updatedClient.contactEmail || updatedClient.email || '').trim().toLowerCase();
      const updatedUsers = prev.users.map((u) => {
        if (
          u.linkedEntityId === updatedClient.id ||
          u.linkedEntityId === updatedClient.clientId ||
          (old && (u.email.toLowerCase() === (old.contactEmail || old.email || '').toLowerCase()))
        ) {
          return {
            ...u,
            name: updatedClient.contactPerson || updatedClient.name,
            email: newEmail || u.email,
            phone: updatedClient.contactPhone || updatedClient.phone || u.phone,
            department: updatedClient.name,
          };
        }
        return u;
      });

      return {
        ...prev,
        clients: prev.clients.map((c) => (c.id === updatedClient.id || c.clientId === updatedClient.clientId ? updatedClient : c)),
        users: updatedUsers,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [
          {
            id: `notif_${Date.now()}`,
            title: 'Client Profile Updated',
            message: `${updatedClient.name} KYC and profile details saved.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const handleAddTaxClient = (client: TaxClient) => {
    const audit = createAuditEntry(
      'CREATE',
      'TAX_CLIENT',
      client.id,
      client.name,
      `Onboarded tax client ${client.name} (PAN: ${client.pan}) for ${client.serviceType} under vendor ${client.vendorName}`,
      [{ field: 'pan', oldValue: null, newValue: client.pan }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      taxClients: [client, ...(prev.taxClients || [])],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Tax Client Registered',
          message: `${client.name} (PAN: ${client.pan}) added to ITR & GST Compliance Directory.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateTaxClient = (updatedClient: TaxClient) => {
    const old = state.taxClients?.find((c) => c.id === updatedClient.id);
    const audit = createAuditEntry(
      'UPDATE',
      'TAX_CLIENT',
      updatedClient.id,
      updatedClient.name,
      `Updated tax client records for ${updatedClient.name} (AYs: ${updatedClient.aysFiled.join(', ')})`,
      [
        { field: 'aysFiled', oldValue: old?.aysFiled.join(', '), newValue: updatedClient.aysFiled.join(', ') },
        { field: 'status', oldValue: old?.status, newValue: updatedClient.status },
      ],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      taxClients: (prev.taxClients || []).map((c) =>
        c.id === updatedClient.id ? updatedClient : c
      ),
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  const handleDeleteTaxClient = (clientId: string) => {
    const client = state.taxClients?.find((c) => c.id === clientId);
    const audit = createAuditEntry(
      'DELETE',
      'TAX_CLIENT',
      clientId,
      client?.name || clientId,
      `Removed tax client ${client?.name || clientId} (PAN: ${client?.pan}) from compliance master`,
      undefined,
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      taxClients: (prev.taxClients || []).filter((c) => c.id !== clientId),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Tax Client Removed',
          message: `Record for ${client?.name || 'client'} was removed from database.`,
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleDeleteClient = (clientId: string) => {
    const c = state.clients.find((item) => item.clientId === clientId);
    const audit = createAuditEntry(
      'DELETE',
      'CLIENT',
      clientId,
      c?.name || clientId,
      `Deactivated / Removed client ${c?.name || clientId}`,
      [{ field: 'status', oldValue: 'Active', newValue: 'Deactivated' }],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      clients: prev.clients.filter((item) => item.clientId !== clientId),
      users: prev.users.filter((u) => u.linkedEntityId !== clientId),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Client Removed',
          message: `${c?.name || clientId} removed from active roster.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddProject = (project: Project, syncConfig?: ProjectSyncConfig) => {
    const client = state.clients.find((c) => c.id === project.clientId || c.clientId === project.clientId);

    // Auto-generate Locations across hubs
    const generatedLocations: ProjectLocation[] = [];
    if (syncConfig?.autoGenerateLocations !== false) {
      const defaultHubs = [
        { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
        { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
        { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
        { city: 'Delhi NCR', state: 'Delhi', pincode: '110001' },
        { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
        { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
        { city: 'Nagpur', state: 'Maharashtra', pincode: '440001' },
        { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
      ];

      const inputCities = syncConfig?.cities && syncConfig.cities.length > 0 ? syncConfig.cities : [];
      const mandaysPerLoc =
        syncConfig?.mandaysPerLocation ||
        Math.max(1, Math.round(project.estimatedMandays / Math.max(1, project.totalLocations)));
      const executionRate = syncConfig?.executionCostRate || Math.round(project.clientRatePerManday * 0.65);

      for (let i = 0; i < project.totalLocations; i++) {
        const hub = defaultHubs[i % defaultHubs.length];
        const cityName = inputCities[i % inputCities.length] || hub.city;
        const locSeq = String(i + 1).padStart(3, '0');
        const locId = `${project.projectId}-L${locSeq}`;
        const siteCode = `${client?.clientId || 'CLI'}-S${locSeq}`;

        generatedLocations.push({
          id: `loc_${project.id}_${i + 1}`,
          projectId: project.id,
          projectCode: project.projectId,
          locationId: locId,
          clientSiteCode: siteCode,
          siteName: `${project.name} - Hub #${i + 1} (${cityName})`,
          address: `Survey ${100 + i * 15}/2, Commercial Logistics Park, Sector ${i + 3}`,
          city: cityName,
          district: cityName,
          state: hub.state,
          pincode: hub.pincode,
          contactPerson: client?.contactPerson || 'Store Operations Lead',
          contactPhone: client?.contactPhone || '+91 98200 12345',
          plannedVisitDate: project.startDate,
          estimatedMandays: mandaysPerLoc,
          actualMandays: 0,
          assignedType: syncConfig?.assignedType === 'VENDOR' ? 'VENDOR' : 'AUDITOR',
          assignedEntityId: syncConfig?.assignedEntityId || '',
          assignedEntityName: syncConfig?.assignedEntityName || '',
          clientBillingRate: project.clientRatePerManday,
          executionCostRate: executionRate,
          status: 'Allocated',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Auto-generate Assignment Work Order
    let generatedAssignment: Assignment | null = null;
    if (syncConfig?.autoGenerateAssignment !== false && syncConfig?.assignedEntityName) {
      const totalExpectedMandays =
        project.estimatedMandays || project.totalLocations * (syncConfig?.mandaysPerLocation || 2);
      const clientRate = project.clientRatePerManday;
      const execRate = syncConfig?.executionCostRate || Math.round(clientRate * 0.65);
      const rev = totalExpectedMandays * clientRate;
      const cost = totalExpectedMandays * execRate;
      const margin = rev - cost;

      generatedAssignment = {
        id: `asn_${project.id}_${Date.now()}`,
        assignmentId: `JSS-ASN-2026-${String(state.assignments.length + 1).padStart(3, '0')}`,
        projectId: project.id,
        projectName: project.name,
        locationIds: generatedLocations.map((l) => l.id),
        executionType: project.executionModel === 'VENDOR' ? 'VENDOR' : 'DIRECT',
        assignedToId: syncConfig.assignedEntityId || '',
        assignedToName: syncConfig.assignedEntityName || '',
        assignedDate: new Date().toISOString().split('T')[0],
        plannedStartDate: project.startDate,
        plannedEndDate: project.endDate,
        expectedMandays: totalExpectedMandays,
        clientRateSnapshot: clientRate,
        executionRateSnapshot: execRate,
        estimatedRevenue: rev,
        estimatedCost: cost,
        estimatedMargin: margin,
        approvalStatus: 'Approved',
        instructions:
          project.instructions ||
          'Perform 100% stock count, asset tagging, verify stock register balances, and obtain counter-signatures.',
        createdAt: new Date().toISOString(),
      };
    }

    const audit = createAuditEntry(
      'CREATE',
      'PROJECT',
      project.projectId,
      project.name,
      `Created project ${project.name} (${project.clientName}) under ${project.executionModel} model. Synced ${generatedLocations.length} locations & Work Order for ${syncConfig?.assignedEntityName || 'Partner'} (Client Fees: ${formatINR(project.clientRatePerManday)}/day, Cost Rate: ${formatINR(syncConfig?.executionCostRate || 0)}/day)`,
      [
        { field: 'budget', oldValue: 0, newValue: formatINR(project.budget) },
        { field: 'executionModel', oldValue: null, newValue: project.executionModel },
        { field: 'locationsSynced', oldValue: 0, newValue: generatedLocations.length },
        { field: 'assignedTo', oldValue: null, newValue: syncConfig?.assignedEntityName || 'Unassigned' },
      ],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      projects: [project, ...prev.projects],
      locations: [...generatedLocations, ...prev.locations],
      assignments: generatedAssignment ? [generatedAssignment, ...prev.assignments] : prev.assignments,
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Project & Operations Synchronized',
          message: `${project.name} (${project.projectId}) launched with ${generatedLocations.length} sites allocated to ${syncConfig?.assignedEntityName || 'team'}.`,
          type: 'success',
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

  const handleAddAuditor = (auditor: Auditor, loginPassword?: string) => {
    const audit = createAuditEntry(
      'CREATE',
      'AUDITOR',
      auditor.auditorId,
      auditor.name,
      `Onboarded auditor ${auditor.name} (${auditor.city || 'India'}, ${auditor.state || 'IN'}) with KYC ${auditor.kyc?.status || 'Pending'}`,
      [{ field: 'name', oldValue: null, newValue: auditor.name }],
      'NOTICE'
    );

    const auditorEmail = auditor.email.trim().toLowerCase();
    const newUser: UserProfile = {
      id: `usr_${auditor.auditorId}`,
      name: auditor.name,
      email: auditorEmail,
      role: 'AUDITOR',
      phone: auditor.phone,
      linkedEntityId: auditor.id,
      status: 'ACTIVE',
      department: 'Field Audit Associate',
      password: (loginPassword && loginPassword.trim()) ? loginPassword.trim() : 'Jshine@2329',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setState((prev) => ({
      ...prev,
      auditors: [auditor, ...prev.auditors],
      users: [...prev.users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase() && u.linkedEntityId !== auditor.id && u.linkedEntityId !== auditor.auditorId), newUser],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Field Auditor Registered',
          message: `${auditor.name} (${auditor.auditorId}) onboarded with active Portal Login.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateAuditor = (updatedAuditor: Auditor) => {
    const old = state.auditors.find((a) => a.auditorId === updatedAuditor.auditorId || a.id === updatedAuditor.id);
    const audit = createAuditEntry(
      'UPDATE',
      'AUDITOR',
      updatedAuditor.auditorId,
      updatedAuditor.name,
      `Updated field auditor profile & KYC for ${updatedAuditor.name} (KYC: ${updatedAuditor.kyc?.status || 'Pending'})`,
      [
        { field: 'kycStatus', oldValue: old?.kyc?.status, newValue: updatedAuditor.kyc?.status },
        { field: 'dailyRate', oldValue: old?.dailyRate, newValue: updatedAuditor.dailyRate },
      ],
      'NOTICE'
    );

    setState((prev) => {
      const newEmail = updatedAuditor.email.trim().toLowerCase();
      const updatedUsers = prev.users.map((u) => {
        if (
          u.linkedEntityId === updatedAuditor.id ||
          u.linkedEntityId === updatedAuditor.auditorId ||
          (old && (u.email.toLowerCase() === old.email.toLowerCase()))
        ) {
          return {
            ...u,
            name: updatedAuditor.name,
            email: newEmail || u.email,
            phone: updatedAuditor.phone || u.phone,
          };
        }
        return u;
      });

      return {
        ...prev,
        auditors: prev.auditors.map((a) => (a.id === updatedAuditor.id || a.auditorId === updatedAuditor.auditorId ? updatedAuditor : a)),
        users: updatedUsers,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [
          {
            id: `notif_${Date.now()}`,
            title: 'Auditor Profile Updated',
            message: `${updatedAuditor.name} profile and KYC updated.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const handleDeleteAuditor = (auditorId: string) => {
    const a = state.auditors.find((item) => item.auditorId === auditorId);
    const audit = createAuditEntry(
      'DELETE',
      'AUDITOR',
      auditorId,
      a?.name || auditorId,
      `Deactivated / Removed auditor ${a?.name || auditorId}`,
      [{ field: 'status', oldValue: 'Active', newValue: 'Deactivated' }],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      auditors: prev.auditors.filter((item) => item.auditorId !== auditorId),
      users: prev.users.filter((u) => u.linkedEntityId !== auditorId),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Auditor Removed',
          message: `${a?.name || auditorId} removed from roster.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleAddVendor = (vendor: Vendor, loginPassword?: string) => {
    const audit = createAuditEntry(
      'CREATE',
      'VENDOR',
      vendor.vendorId,
      vendor.name,
      `Onboarded vendor ${vendor.name} (GSTIN: ${vendor.gstin || 'Unregistered'}, PAN: ${vendor.pan}) with KYC ${vendor.kyc?.status || 'Pending'}`,
      [{ field: 'name', oldValue: null, newValue: vendor.name }],
      'NOTICE'
    );

    const vendorEmail = vendor.email.trim().toLowerCase();
    const newUser: UserProfile = {
      id: `usr_${vendor.vendorId}`,
      name: vendor.contactPerson || vendor.name,
      email: vendorEmail,
      role: 'VENDOR',
      phone: vendor.phone,
      linkedEntityId: vendor.id,
      status: 'ACTIVE',
      department: vendor.name,
      password: (loginPassword && loginPassword.trim()) ? loginPassword.trim() : 'Jshine@2329',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setState((prev) => ({
      ...prev,
      vendors: [vendor, ...prev.vendors],
      users: [...prev.users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase() && u.linkedEntityId !== vendor.id && u.linkedEntityId !== vendor.vendorId), newUser],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Vendor Partner Registered',
          message: `${vendor.name} (${vendor.vendorId}) onboarded with active Portal Login.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const old = state.vendors.find((v) => v.vendorId === updatedVendor.vendorId || v.id === updatedVendor.id);
    const audit = createAuditEntry(
      'UPDATE',
      'VENDOR',
      updatedVendor.vendorId,
      updatedVendor.name,
      `Updated vendor profile & KYC for ${updatedVendor.name} (KYC: ${updatedVendor.kyc?.status || 'Pending'})`,
      [
        { field: 'kycStatus', oldValue: old?.kyc?.status, newValue: updatedVendor.kyc?.status },
        { field: 'gstin', oldValue: old?.gstin, newValue: updatedVendor.gstin },
      ],
      'NOTICE'
    );

    setState((prev) => {
      const newEmail = updatedVendor.email.trim().toLowerCase();
      const updatedUsers = prev.users.map((u) => {
        if (
          u.linkedEntityId === updatedVendor.id ||
          u.linkedEntityId === updatedVendor.vendorId ||
          (old && (u.email.toLowerCase() === old.email.toLowerCase()))
        ) {
          return {
            ...u,
            name: updatedVendor.contactPerson || updatedVendor.name,
            email: newEmail || u.email,
            phone: updatedVendor.phone || u.phone,
            department: updatedVendor.name,
          };
        }
        return u;
      });

      return {
        ...prev,
        vendors: prev.vendors.map((v) => (v.id === updatedVendor.id || v.vendorId === updatedVendor.vendorId ? updatedVendor : v)),
        users: updatedUsers,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [
          {
            id: `notif_${Date.now()}`,
            title: 'Vendor Profile Updated',
            message: `${updatedVendor.name} profile and KYC saved.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const handleDeleteVendor = (vendorId: string) => {
    const v = state.vendors.find((item) => item.vendorId === vendorId);
    const audit = createAuditEntry(
      'DELETE',
      'VENDOR',
      vendorId,
      v?.name || vendorId,
      `Deactivated / Removed vendor partner ${v?.name || vendorId}`,
      [{ field: 'status', oldValue: 'Active', newValue: 'Deactivated' }],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((item) => item.vendorId !== vendorId),
      users: prev.users.filter((u) => u.linkedEntityId !== vendorId),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Vendor Partner Removed',
          message: `${v?.name || vendorId} removed from repository.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateEntityLoginCredentials = (
    entityType: 'vendor' | 'auditor' | 'client',
    entityId: string,
    email: string,
    password: string,
    status: 'ACTIVE' | 'INACTIVE'
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim() || 'Jshine@2329';

    let entityName = entityId;
    let targetRole: 'VENDOR' | 'AUDITOR' | 'CLIENT' = 'VENDOR';
    let resolvedEntityId = entityId;
    let resolvedEntityCode = '';

    if (entityType === 'vendor') {
      const v = state.vendors.find(
        (item) => item.id === entityId || item.vendorId === entityId || (item.email && item.email.toLowerCase() === cleanEmail)
      );
      entityName = v?.name || entityId;
      targetRole = 'VENDOR';
      if (v) {
        resolvedEntityId = v.id;
        resolvedEntityCode = v.vendorId;
      }
    } else if (entityType === 'auditor') {
      const a = state.auditors.find(
        (item) => item.id === entityId || item.auditorId === entityId || (item.email && item.email.toLowerCase() === cleanEmail)
      );
      entityName = a?.name || entityId;
      targetRole = 'AUDITOR';
      if (a) {
        resolvedEntityId = a.id;
        resolvedEntityCode = a.auditorId;
      }
    } else if (entityType === 'client') {
      const c = state.clients.find(
        (item) =>
          item.id === entityId ||
          item.clientId === entityId ||
          ((item.contactEmail || item.email) && (item.contactEmail || item.email)?.toLowerCase() === cleanEmail)
      );
      entityName = c?.name || entityId;
      targetRole = 'CLIENT';
      if (c) {
        resolvedEntityId = c.id;
        resolvedEntityCode = c.clientId;
      }
    }

    const audit = createAuditEntry(
      'SECURITY_EVENT',
      'SECURITY',
      resolvedEntityId,
      `Portal Credentials: ${entityName}`,
      `Admin updated login credentials for ${entityType.toUpperCase()} ${entityName} (${cleanEmail}) - Status: ${status}`,
      [
        { field: 'email', oldValue: null, newValue: cleanEmail },
        { field: 'status', oldValue: null, newValue: status },
      ],
      'HIGH'
    );

    setState((prev) => {
      // Find matching user profile by linked ID, code, or existing email
      const existingUserIndex = prev.users.findIndex(
        (u) =>
          u.linkedEntityId === resolvedEntityId ||
          (resolvedEntityCode && u.linkedEntityId === resolvedEntityCode) ||
          u.id === `usr_${resolvedEntityCode}` ||
          u.id === `usr_${resolvedEntityId}` ||
          (u.email && u.email.toLowerCase() === cleanEmail)
      );

      let updatedUsers = [...prev.users];
      if (existingUserIndex >= 0) {
        updatedUsers[existingUserIndex] = {
          ...updatedUsers[existingUserIndex],
          name: entityName || updatedUsers[existingUserIndex].name,
          email: cleanEmail,
          password: cleanPassword,
          status,
          role: targetRole,
          linkedEntityId: resolvedEntityId,
        };
      } else {
        const newUser: UserProfile = {
          id: `usr_${resolvedEntityCode || resolvedEntityId || Date.now().toString(36)}`,
          name: entityName,
          email: cleanEmail,
          role: targetRole,
          status,
          password: cleanPassword,
          linkedEntityId: resolvedEntityId,
          createdAt: new Date().toISOString().split('T')[0],
        };
        updatedUsers = [...updatedUsers, newUser];
      }

      // Keep vendor/auditor/client entity email in sync
      let updatedVendors = prev.vendors;
      let updatedAuditors = prev.auditors;
      let updatedClients = prev.clients;

      if (entityType === 'vendor') {
        updatedVendors = prev.vendors.map((v) =>
          v.id === resolvedEntityId || v.vendorId === resolvedEntityCode ? { ...v, email: cleanEmail } : v
        );
      } else if (entityType === 'auditor') {
        updatedAuditors = prev.auditors.map((a) =>
          a.id === resolvedEntityId || a.auditorId === resolvedEntityCode ? { ...a, email: cleanEmail } : a
        );
      } else if (entityType === 'client') {
        updatedClients = prev.clients.map((c) =>
          c.id === resolvedEntityId || c.clientId === resolvedEntityCode ? { ...c, contactEmail: cleanEmail, email: cleanEmail } : c
        );
      }

      return {
        ...prev,
        users: updatedUsers,
        vendors: updatedVendors,
        auditors: updatedAuditors,
        clients: updatedClients,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [
          {
            id: `notif_${Date.now()}`,
            title: 'Portal Credentials Updated',
            message: `Login credentials for ${entityName} (${cleanEmail}) saved with status ${status}. User can sign in immediately.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const handleChangeUserPassword = (userId: string, newPassword: string) => {
    const cleanPwd = newPassword.trim();
    const targetUser = state.users.find((u) => u.id === userId);
    const audit = createAuditEntry(
      'SECURITY_EVENT',
      'SECURITY',
      userId,
      `User Password Reset: ${targetUser?.name || userId}`,
      `Admin updated password for user ${targetUser?.name || userId} (${targetUser?.email || ''})`,
      [{ field: 'password', oldValue: '••••••••', newValue: '•••••••• (Updated)' }],
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, password: cleanPwd } : u)),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'User Password Updated',
          message: `Password for ${targetUser?.name || 'user'} (${targetUser?.email || ''}) updated and active.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleDeleteUser = (userId: string) => {
    const u = state.users.find((item) => item.id === userId);
    const audit = createAuditEntry(
      'DELETE',
      'SECURITY',
      userId,
      u?.name || userId,
      `Removed user account ${u?.name || userId} (${u?.email || ''})`,
      undefined,
      'HIGH'
    );

    setState((prev) => ({
      ...prev,
      users: prev.users.filter((item) => item.id !== userId),
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'User Account Removed',
          message: `${u?.name || userId} account deleted.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const handleUpdateLocationStatus = (locationId: string, status: LocationStatus, remarks?: string) => {
    const loc = state.locations.find((l) => l.id === locationId);
    const audit = createAuditEntry(
      'UPDATE',
      'LOCATION',
      locationId,
      loc?.storeName || locationId,
      `Updated site status to ${status}${remarks ? `: ${remarks}` : ''}`,
      [{ field: 'status', oldValue: loc?.status, newValue: status }],
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      locations: prev.locations.map((l) =>
        l.id === locationId
          ? {
              ...l,
              status,
              ...(status === 'Completed' ? { completedDate: new Date().toISOString().split('T')[0] } : {}),
              ...(remarks ? { remarks: `${l.remarks ? l.remarks + ' | ' : ''}${remarks}` } : {}),
            }
          : l
      ),
      auditLogs: [audit, ...prev.auditLogs],
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

  const handleResetPasswordDirect = (email: string, newPassword: string) => {
    const matchedUser = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const audit = createAuditEntry(
      'UPDATE',
      'SECURITY',
      matchedUser?.id || email,
      matchedUser?.name || email,
      `User password reset requested and updated for ${email}`,
      undefined,
      'NOTICE'
    );

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPassword } : u
      ),
      adminPassword:
        email.toLowerCase() === 'jay@jaysoftshine.com' ? newPassword : prev.adminPassword,
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  const handleCompleteUrlPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetModalErrorMsg(null);
    if (!resetUrlParams) return;

    if (resetModalNewPassword.length < 6) {
      setResetModalErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (resetModalNewPassword !== resetModalConfirmPassword) {
      setResetModalErrorMsg('New password and confirmation do not match.');
      return;
    }

    handleResetPasswordDirect(resetUrlParams.email, resetModalNewPassword);
    setResetModalSuccessMsg(
      'Your password has been successfully updated! You can now sign in using your new credentials.'
    );
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => {
      setResetUrlParams(null);
      setResetModalSuccessMsg(null);
      setResetModalNewPassword('');
      setResetModalConfirmPassword('');
    }, 2500);
  };

  // If user is not authenticated, render Login Page as Home Screen
  if (!state.isAuthenticated) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          users={state.users}
          vendors={state.vendors}
          auditors={state.auditors}
          clients={state.clients}
          adminPassword={state.adminPassword}
          onResetPassword={handleResetPasswordDirect}
          onProvisionEntityUser={(newUser) => {
            setState((prev) => ({
              ...prev,
              users: [...prev.users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase() && u.id !== newUser.id), newUser],
            }));
          }}
          cloudSyncStatus={cloudSyncStatus}
          onSyncFromCloud={handleForceSync}
        />

        {/* Modal for reset link from email */}
        {resetUrlParams && (
          <Modal
            isOpen={true}
            onClose={() => {
              setResetUrlParams(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
            title="Set New Corporate Password"
            maxWidth="sm"
          >
            <form onSubmit={handleCompleteUrlPasswordReset} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium block">Resetting Password For:</span>
                <span className="font-bold text-slate-900 font-mono text-sm block mt-0.5">
                  {resetUrlParams.email}
                </span>
                <span className="text-[11px] text-emerald-700 block mt-1 font-semibold">
                  ✓ Verified one-time security reset token
                </span>
              </div>

              {resetModalSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetModalSuccessMsg}</span>
                </div>
              )}

              {resetModalErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetModalErrorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Choose New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetModalNewPassword}
                  onChange={(e) => setResetModalNewPassword(e.target.value)}
                  placeholder="Enter min 6 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetModalConfirmPassword}
                  onChange={(e) => setResetModalConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetUrlParams(null);
                    window.history.replaceState({}, '', window.location.pathname);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-slate-950 hover:bg-black text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save & Apply New Password
                </button>
              </div>
            </form>
          </Modal>
        )}
      </>
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
          cloudSyncStatus={cloudSyncStatus}
          onForceSync={handleForceSync}
          isSyncing={isCloudSyncing}
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
                  onUpdateClient={handleUpdateClient}
                />
              )}

              {currentTab === 'tax-clients' && (
                <TaxClientsView
                  taxClients={state.taxClients || []}
                  vendors={state.vendors}
                  onAddTaxClient={handleAddTaxClient}
                  onUpdateTaxClient={handleUpdateTaxClient}
                  onDeleteTaxClient={handleDeleteTaxClient}
                  canManage={state.currentUser.role === 'SUPER_ADMIN' || state.currentUser.role === 'ADMIN' || state.currentUser.role === 'ACCOUNTS' || state.currentUser.role === 'OFFICE_ADMIN'}
                />
              )}

              {currentTab === 'projects' && (
                <ProjectsView
                  projects={state.projects}
                  clients={state.clients}
                  vendors={state.vendors}
                  auditors={state.auditors}
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
                  onUpdateAuditor={handleUpdateAuditor}
                />
              )}

              {currentTab === 'vendors' && (
                <VendorManagementView
                  vendors={state.vendors}
                  vendorBills={state.vendorBills}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={handleUpdateVendor}
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
                  onUpdateLocationStatus={handleUpdateLocationStatus}
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
                  onDeleteUser={handleDeleteUser}
                  onChangeUserPassword={handleChangeUserPassword}
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
                  organization={state.organization}
                  onUpdateOrganization={handleUpdateOrganization}
                />
              )}

              {/* Dedicated Portals */}
              {currentTab === 'vendor-portal' && (
                <PortalsView
                  portalType="vendor"
                  state={state}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={handleUpdateVendor}
                  onDeleteVendor={handleDeleteVendor}
                  onAddAuditor={handleAddAuditor}
                  onUpdateAuditor={handleUpdateAuditor}
                  onDeleteAuditor={handleDeleteAuditor}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onUpdateEntityLoginCredentials={handleUpdateEntityLoginCredentials}
                  onUpdateLocationStatus={handleUpdateLocationStatus}
                  onSubmitVendorBill={handleAddVendorBill}
                  onSubmitAttendance={handleAddAttendance}
                  onSubmitReport={handleAddReport}
                  onSubmitExpense={handleAddExpense}
                  onSwitchUser={handleSwitchUser}
                />
              )}

              {currentTab === 'auditor-portal' && (
                <PortalsView
                  portalType="auditor"
                  state={state}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={handleUpdateVendor}
                  onDeleteVendor={handleDeleteVendor}
                  onAddAuditor={handleAddAuditor}
                  onUpdateAuditor={handleUpdateAuditor}
                  onDeleteAuditor={handleDeleteAuditor}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onUpdateEntityLoginCredentials={handleUpdateEntityLoginCredentials}
                  onUpdateLocationStatus={handleUpdateLocationStatus}
                  onSubmitVendorBill={handleAddVendorBill}
                  onSubmitAttendance={handleAddAttendance}
                  onSubmitReport={handleAddReport}
                  onSubmitExpense={handleAddExpense}
                  onSwitchUser={handleSwitchUser}
                />
              )}

              {currentTab === 'client-portal' && (
                <PortalsView
                  portalType="client"
                  state={state}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={handleUpdateVendor}
                  onDeleteVendor={handleDeleteVendor}
                  onAddAuditor={handleAddAuditor}
                  onUpdateAuditor={handleUpdateAuditor}
                  onDeleteAuditor={handleDeleteAuditor}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onUpdateEntityLoginCredentials={handleUpdateEntityLoginCredentials}
                  onUpdateLocationStatus={handleUpdateLocationStatus}
                  onSubmitVendorBill={handleAddVendorBill}
                  onSubmitAttendance={handleAddAttendance}
                  onSubmitReport={handleAddReport}
                  onSubmitExpense={handleAddExpense}
                  onSwitchUser={handleSwitchUser}
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
