export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OFFICE_ADMIN'
  | 'PROJECT_MANAGER'
  | 'ACCOUNTS'
  | 'VENDOR'
  | 'SUB_VENDOR'
  | 'AUDITOR'
  | 'CLIENT';

export interface BankDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
  upiId?: string;
  pan?: string;
}

export interface OrganizationProfile {
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  stateCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  bankDetails?: BankDetails;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  linkedEntityId?: string; // vendorId, auditorId, or clientId if external
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
  address?: string;
  bankDetails?: BankDetails;
  createdAt: string;
}

export type ExecutionModel = 'DIRECT' | 'VENDOR' | 'HYBRID';

export type ProjectCategory =
  | 'Physical Verification'
  | 'Stock Audit'
  | 'Inventory Verification'
  | 'Fixed Asset Verification'
  | 'Asset Tagging'
  | 'Internal Audit'
  | 'Compliance Audit'
  | 'Mystery Audit'
  | 'Insurance Survey'
  | 'Loss Assessment'
  | 'Quality Audit'
  | 'Other';

export type ProjectStatus = 'Draft' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';

export type LocationStatus =
  | 'Unallocated'
  | 'Allocated'
  | 'Scheduled'
  | 'In Progress'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Completed'
  | 'On Hold'
  | 'Revisit Required'
  | 'Rejected'
  | 'Cancelled';

export interface Client {
  id: string;
  clientId: string; // e.g. JSS-CLI-001
  name: string;
  clientType: 'MNC' | 'Big Four Firm' | 'CA Firm' | 'Corporate' | 'Manufacturing' | 'Retail' | 'Pharmaceutical' | 'Financial Institution' | 'Other';
  pan: string;
  gstin: string;
  registeredAddress: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  paymentTermsDays: number;
  tdsRatePercent: number; // e.g., 2% or 10%
  creditLimit: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  projectId: string; // e.g. JSS-2026-0001
  name: string;
  clientId: string;
  clientName: string;
  poNumber: string;
  category: ProjectCategory;
  executionModel: ExecutionModel;
  projectManagerId?: string;
  projectManagerName?: string;
  startDate: string;
  endDate: string;
  totalLocations: number;
  estimatedMandays: number;
  clientRatePerManday: number; // e.g. ₹1500
  billingType: 'Per Manday' | 'Per Location' | 'Fixed Project Amount' | 'Unit Based' | 'Milestone Based';
  gstRatePercent: number; // 18% standard
  budget: number;
  instructions?: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface ProjectLocation {
  id: string;
  projectId: string;
  projectCode: string;
  locationId: string; // e.g. JSS-2026-0001-L001
  clientSiteCode: string;
  siteName: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  plannedVisitDate: string;
  actualVisitDate?: string;
  estimatedMandays: number;
  actualMandays: number;
  assignedType?: 'AUDITOR' | 'VENDOR';
  assignedEntityId?: string;
  assignedEntityName?: string;
  clientBillingRate: number;
  executionCostRate: number;
  status: LocationStatus;
  revisitRemarks?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  vendorId: string; // e.g. JSS-VND-001
  name: string;
  legalName: string;
  contactPerson: string;
  phone: string;
  email: string;
  pan: string;
  gstin: string;
  address: string;
  state: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  msmeRegistered: boolean;
  paymentTermsDays: number;
  defaultDayRate: number;
  rating: number; // 1-5
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Auditor {
  id: string;
  auditorId: string; // e.g. JSS-AUD-001
  name: string;
  email: string;
  phone: string;
  address: string;
  pan: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  skills: string[];
  experienceYears: number;
  preferredStates: string[];
  defaultDayRate: number; // e.g. ₹1000
  travelAllowancePerKm: number;
  dailyFoodAllowance: number;
  isAvailable: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Assignment {
  id: string;
  assignmentId: string; // e.g. JSS-ASN-2026-001
  projectId: string;
  projectName: string;
  locationIds: string[];
  executionType: 'DIRECT' | 'VENDOR' | 'SUB_VENDOR';
  assignedToId: string; // auditorId or vendorId
  assignedToName: string;
  assignedDate: string;
  plannedStartDate: string;
  plannedEndDate: string;
  expectedMandays: number;
  clientRateSnapshot: number; // Rate per manday billed to client
  executionRateSnapshot: number; // Rate agreed with auditor or vendor
  estimatedRevenue: number;
  estimatedCost: number;
  estimatedMargin: number;
  instructions?: string;
  approvalStatus: 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  projectId: string;
  projectName: string;
  locationId: string;
  locationName: string;
  assignmentId: string;
  auditorId?: string;
  auditorName?: string;
  vendorId?: string;
  vendorName?: string;
  workDate: string;
  checkInTime: string;
  checkOutTime: string;
  isHalfDay: boolean;
  mandays: number; // 1.0 or 0.5 or custom decimal
  remarks?: string;
  gpsLocation?: string;
  photoUrl?: string;
  submittedBy: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface WorkReport {
  id: string;
  reportId: string;
  projectId: string;
  projectName: string;
  locationId: string;
  locationName: string;
  category: ProjectCategory;
  submittedBy: string;
  submissionDate: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Revision Required';
  totalAssetsCounted?: number;
  discrepanciesFound?: number;
  physicalConditionNotes?: string;
  photoUrls: string[];
  documentUrl?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  createdAt: string;
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: string; // e.g. JSS/26-27/001
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  billingAddress: string;
  clientGstin: string;
  stateCode: string;
  items: {
    description: string;
    hsnSac: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  taxableAmount: number;
  isInterState: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  tdsDeductedByClient: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Draft' | 'Approved' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  createdAt: string;
}

export interface ClientPaymentReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceNumber: string;
  amountReceived: number;
  tdsDeducted: number;
  paymentMode: 'NEFT/RTGS' | 'Cheque' | 'UPI' | 'Direct Transfer';
  referenceNo: string;
  bankAccount: string;
  remarks?: string;
  createdAt: string;
}

export interface VendorBill {
  id: string;
  billNumber: string; // vendor invoice number
  billDate: string;
  vendorId: string;
  vendorName: string;
  projectId: string;
  projectName: string;
  approvedMandays: number;
  agreedRate: number;
  taxableAmount: number;
  gstAmount: number;
  tdsRatePercent: number; // e.g. 1% or 2% under 194C
  tdsDeduction: number;
  advanceAdjusted: number;
  netPayable: number;
  paidAmount: number;
  outstanding: number;
  paymentStatus: 'Pending' | 'Approved' | 'Partially Paid' | 'Paid';
  paymentDate?: string;
  createdAt: string;
}

export interface AuditorSettlement {
  id: string;
  settlementNumber: string; // e.g. JSS-SET-001
  auditorId: string;
  auditorName: string;
  projectId: string;
  projectName: string;
  approvedMandays: number;
  dailyRate: number;
  mandayPayable: number;
  travelAllowance: number;
  foodAllowance: number;
  hotelAllowance: number;
  otherExpenses: number;
  grossPayable: number;
  advanceDeduction: number;
  tdsDeduction: number;
  netPayable: number;
  paidAmount: number;
  outstanding: number;
  status: 'Pending' | 'Approved' | 'Paid';
  paymentDate?: string;
  paymentRef?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  expenseId: string;
  projectId: string;
  projectName: string;
  locationId?: string;
  submittedBy: string;
  submitterType: 'AUDITOR' | 'VENDOR' | 'STAFF';
  category: 'Travel' | 'Accommodation' | 'Food' | 'Local Conveyance' | 'Printing' | 'Courier' | 'Equipment' | 'Miscellaneous';
  amount: number;
  date: string;
  description: string;
  billReceiptUrl?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  createdAt: string;
}

export interface AccountLedgerEntry {
  accountId: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  debit: number; // in rupees
  credit: number;
}

export interface JournalEntry {
  id: string;
  voucherNo: string; // e.g. JV-2026-001
  date: string;
  narration: string;
  voucherType: 'Journal' | 'Payment' | 'Receipt' | 'Sales' | 'Purchase' | 'Contra';
  lines: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    projectId?: string;
  }[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  postedBy: string;
  createdAt: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
  lastTestedAt?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  read: boolean;
  createdAt: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'DISBURSE'
  | 'POST'
  | 'SECURITY_EVENT'
  | 'CONFIG_CHANGE';

export type AuditEntityType =
  | 'CLIENT'
  | 'PROJECT'
  | 'LOCATION'
  | 'ASSIGNMENT'
  | 'ATTENDANCE'
  | 'REPORT'
  | 'INVOICE'
  | 'RECEIPT'
  | 'VENDOR_BILL'
  | 'AUDITOR_SETTLEMENT'
  | 'EXPENSE'
  | 'JOURNAL_ENTRY'
  | 'SECURITY'
  | 'SMTP';

export type AuditFieldChange = {
  field: string;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
};

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  description: string;
  ipAddress?: string;
  changes?: AuditFieldChange[];
  severity: 'INFO' | 'NOTICE' | 'HIGH' | 'CRITICAL';
}

export type NavTabId =
  | 'dashboard'
  | 'clients'
  | 'projects'
  | 'locations'
  | 'assignments'
  | 'workforce'
  | 'vendors'
  | 'attendance'
  | 'field-ops'
  | 'documents'
  | 'billing'
  | 'vendor-payables'
  | 'auditor-payables'
  | 'expenses'
  | 'accounting'
  | 'gst-tds'
  | 'analytics'
  | 'audit-trail'
  | 'notifications'
  | 'users'
  | 'settings'
  | 'vendor-portal'
  | 'auditor-portal'
  | 'client-portal';

export interface RolePermissionConfig {
  role: UserRole;
  title: string;
  description: string;
  allowedTabs: NavTabId[];
  canAddEdit: boolean;
  canApproveMandays: boolean;
  canDisburseFunds: boolean;
  canManageRoles: boolean;
  canExportFinancials: boolean;
}

