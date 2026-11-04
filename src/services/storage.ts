import {
  UserProfile,
  Client,
  Project,
  ProjectLocation,
  Vendor,
  Auditor,
  Assignment,
  AttendanceRecord,
  WorkReport,
  ClientInvoice,
  ClientPaymentReceipt,
  VendorBill,
  AuditorSettlement,
  ExpenseRecord,
  JournalEntry,
  SmtpConfig,
  SystemNotification,
  AuditLogEntry,
  RolePermissionConfig,
  OrganizationProfile,
  BankDetails,
} from '../types/erp';

export interface AppState {
  isAuthenticated: boolean;
  currentUser: UserProfile;
  adminPassword: string; // Default: Jshine@2329
  organization: OrganizationProfile;
  users: UserProfile[];
  clients: Client[];
  projects: Project[];
  locations: ProjectLocation[];
  vendors: Vendor[];
  auditors: Auditor[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
  reports: WorkReport[];
  invoices: ClientInvoice[];
  receipts: ClientPaymentReceipt[];
  vendorBills: VendorBill[];
  auditorSettlements: AuditorSettlement[];
  expenses: ExpenseRecord[];
  journals: JournalEntry[];
  smtpConfig: SmtpConfig;
  notifications: SystemNotification[];
  auditLogs: AuditLogEntry[];
  rolePermissions: RolePermissionConfig[];
}

const STORAGE_KEY = 'jaysoftshine_erp_prod_v2';

export const INITIAL_ORGANIZATION: OrganizationProfile = {
  name: 'JaySoftShine',
  legalName: 'JaySoftShine Audit & Verification Services',
  gstin: '08BKDPV7945P1Z2',
  pan: 'BKDPV7945P',
  stateCode: '08 (Rajasthan)',
  address: 'Corporate Office, C-Scheme',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302001',
  phone: '+91 98200 12345',
  email: 'jay@jaysoftshine.com',
  website: 'https://jaysoftshine.com',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountHolderName: 'JaySoftShine',
    accountNumber: '50200088991122',
    ifscCode: 'HDFC0000123',
    branch: 'Jaipur Main Branch',
    upiId: 'jaysoftshine@hdfcbank',
    pan: 'BKDPV7945P',
  },
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    name: 'Jayesh Vyas',
    email: 'jay@jaysoftshine.com',
    role: 'SUPER_ADMIN',
    phone: '+91 98200 12345',
    status: 'ACTIVE',
    department: 'Executive Management',
    password: 'Jshine@2329',
    address: 'Jaipur, Rajasthan',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountHolderName: 'Jayesh Vyas',
      accountNumber: '50100023456789',
      ifscCode: 'HDFC0000123',
      branch: 'Jaipur Main',
      upiId: 'jayesh@okhdfcbank',
      pan: 'BKDPV7945P',
    },
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_LOCATIONS: ProjectLocation[] = [];
export const INITIAL_VENDORS: Vendor[] = [];
export const INITIAL_AUDITORS: Auditor[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_REPORTS: WorkReport[] = [];
export const INITIAL_INVOICES: ClientInvoice[] = [];
export const INITIAL_RECEIPTS: ClientPaymentReceipt[] = [];
export const INITIAL_VENDOR_BILLS: VendorBill[] = [];
export const INITIAL_AUDITOR_SETTLEMENTS: AuditorSettlement[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_JOURNALS: JournalEntry[] = [];

export const INITIAL_SMTP: SmtpConfig = {
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  username: 'resend',
  password: 're_H5oTPCSP_NFHME4D7pwvm2jTGak4YjYoe',
  fromEmail: 'onboarding@resend.dev',
  fromName: 'JaySoftShine ERP',
  isConfigured: true,
  lastTestedAt: '2026-11-03',
};

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_welcome',
    title: 'Production ERP Live',
    message: 'JaySoftShine ERP is operational. Resend email gateway (smtp.resend.com) active.',
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_init_001',
    timestamp: new Date().toISOString(),
    userId: 'usr_admin',
    userName: 'Jayesh Vyas',
    userRole: 'SUPER_ADMIN',
    action: 'CONFIG_CHANGE',
    entityType: 'PROJECT',
    entityId: 'SYS-INIT',
    entityName: 'Production Environment',
    description: 'JaySoftShine ERP initialized in clean production state. Resend email service configured.',
    ipAddress: '103.21.124.88 (TLS 1.3 Certified)',
    severity: 'NOTICE',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionConfig[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
    description: 'Unrestricted full access across all 24 modules, user rights management, master password resets, double-entry books, and statutory filings.',
    allowedTabs: [
      'dashboard',
      'clients',
      'projects',
      'locations',
      'assignments',
      'workforce',
      'vendors',
      'attendance',
      'field-ops',
      'documents',
      'billing',
      'vendor-payables',
      'auditor-payables',
      'expenses',
      'accounting',
      'gst-tds',
      'analytics',
      'audit-trail',
      'notifications',
      'users',
      'settings',
      'vendor-portal',
      'auditor-portal',
      'client-portal',
    ],
    canAddEdit: true,
    canApproveMandays: true,
    canDisburseFunds: true,
    canManageRoles: true,
    canExportFinancials: true,
  },
  {
    role: 'OFFICE_ADMIN',
    title: 'Office Administrator',
    description: 'Operational coordinator. Can manage clients, projects, site schedules, and auditor allocations. Excluded from confidential accounts, bank disbursement, and audit trail logs.',
    allowedTabs: [
      'dashboard',
      'clients',
      'projects',
      'locations',
      'assignments',
      'workforce',
      'vendors',
      'attendance',
      'field-ops',
      'documents',
      'notifications',
    ],
    canAddEdit: true,
    canApproveMandays: false,
    canDisburseFunds: false,
    canManageRoles: false,
    canExportFinancials: false,
  },
  {
    role: 'PROJECT_MANAGER',
    title: 'Project Delivery Manager',
    description: 'Field execution authority. Approves mandays, verifies field physical count reports, reviews discrepancies, and monitors site delivery.',
    allowedTabs: [
      'dashboard',
      'projects',
      'locations',
      'assignments',
      'workforce',
      'attendance',
      'field-ops',
      'documents',
      'notifications',
    ],
    canAddEdit: true,
    canApproveMandays: true,
    canDisburseFunds: false,
    canManageRoles: false,
    canExportFinancials: false,
  },
  {
    role: 'ACCOUNTS',
    title: 'Accounts & Finance (CA)',
    description: 'Financial ledger authority. Billed client invoicing, vendor bill clearances, auditor settlement payouts, GST registers, and double-entry trial balance.',
    allowedTabs: [
      'dashboard',
      'billing',
      'vendor-payables',
      'auditor-payables',
      'expenses',
      'accounting',
      'gst-tds',
      'analytics',
      'notifications',
    ],
    canAddEdit: true,
    canApproveMandays: false,
    canDisburseFunds: true,
    canManageRoles: false,
    canExportFinancials: true,
  },
  {
    role: 'VENDOR',
    title: 'Vendor Partner (Outsourced Agency)',
    description: 'External Partner Scope Only. Strictly restricted to viewing vendor packages, allocated sites, auditor timesheets, and submitted bills.',
    allowedTabs: [
      'vendor-portal',
      'notifications',
    ],
    canAddEdit: false,
    canApproveMandays: false,
    canDisburseFunds: false,
    canManageRoles: false,
    canExportFinancials: false,
  },
  {
    role: 'AUDITOR',
    title: 'Field Audit Associate',
    description: 'Mobile Field Scope Only. Strictly restricted to own assigned audit sites, daily GPS attendance punch-in, field reports upload, expense filing, and personal settlement sheets.',
    allowedTabs: [
      'auditor-portal',
      'notifications',
    ],
    canAddEdit: false,
    canApproveMandays: false,
    canDisburseFunds: false,
    canManageRoles: false,
    canExportFinancials: false,
  },
  {
    role: 'CLIENT',
    title: 'Client Stakeholder',
    description: 'Client Transparency View. Strictly restricted to viewing project verification progress, summary reports, and issued tax invoices.',
    allowedTabs: [
      'client-portal',
      'notifications',
    ],
    canAddEdit: false,
    canApproveMandays: false,
    canDisburseFunds: false,
    canManageRoles: false,
    canExportFinancials: false,
  },
];

export function getInitialState(): AppState {
  // Clear any legacy test data from v1
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('jaysoftshine_erp_v1');
  }

  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.adminPassword) {
        parsed.adminPassword = 'Jshine@2329';
      }
      if (!parsed.organization) {
        parsed.organization = INITIAL_ORGANIZATION;
      }
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = INITIAL_USERS;
      }
      if (!parsed.auditLogs || parsed.auditLogs.length === 0) {
        parsed.auditLogs = INITIAL_AUDIT_LOGS;
      }
      if (!parsed.rolePermissions || parsed.rolePermissions.length === 0) {
        parsed.rolePermissions = DEFAULT_ROLE_PERMISSIONS;
      }
      if (!parsed.smtpConfig) {
        parsed.smtpConfig = INITIAL_SMTP;
      }
      if (typeof parsed.isAuthenticated !== 'boolean') {
        parsed.isAuthenticated = false;
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
    }
  }

  const defaultState: AppState = {
    isAuthenticated: false,
    currentUser: INITIAL_USERS[0],
    adminPassword: 'Jshine@2329',
    organization: INITIAL_ORGANIZATION,
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    projects: INITIAL_PROJECTS,
    locations: INITIAL_LOCATIONS,
    vendors: INITIAL_VENDORS,
    auditors: INITIAL_AUDITORS,
    assignments: INITIAL_ASSIGNMENTS,
    attendance: INITIAL_ATTENDANCE,
    reports: INITIAL_REPORTS,
    invoices: INITIAL_INVOICES,
    receipts: INITIAL_RECEIPTS,
    vendorBills: INITIAL_VENDOR_BILLS,
    auditorSettlements: INITIAL_AUDITOR_SETTLEMENTS,
    expenses: INITIAL_EXPENSES,
    journals: INITIAL_JOURNALS,
    smtpConfig: INITIAL_SMTP,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  };

  saveState(defaultState);
  return defaultState;
}

export function saveState(state: AppState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function resetToSeedData(): AppState {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return getInitialState();
}
