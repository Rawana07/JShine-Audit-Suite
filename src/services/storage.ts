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
  TaxClient,
} from '../types/erp';

export interface AppState {
  isAuthenticated: boolean;
  currentUser: UserProfile;
  adminPassword: string; // Default: Jshine@2329
  organization: OrganizationProfile;
  users: UserProfile[];
  clients: Client[];
  taxClients: TaxClient[];
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

const STORAGE_KEY = 'jaysoftshine_erp_prod_v5';

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
  {
    id: 'usr_pm',
    name: 'Vikram Seth',
    email: 'vikram.pm@jaysoftshine.com',
    role: 'PROJECT_MANAGER',
    phone: '+91 98202 55667',
    status: 'ACTIVE',
    department: 'Project Operations',
    password: 'Jshine@2329',
    address: 'Mumbai, Maharashtra',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'usr_accounts',
    name: 'CA Anita Joshi',
    email: 'anita.ca@jaysoftshine.com',
    role: 'ACCOUNTS',
    phone: '+91 98203 77889',
    status: 'ACTIVE',
    department: 'Finance & Compliance',
    password: 'Jshine@2329',
    address: 'Pune, Maharashtra',
    createdAt: '2026-01-06T00:00:00Z',
  },
  {
    id: 'usr_vendor_apex',
    name: 'Rajesh Kulkarni',
    email: 'vendor@apexaudit.com',
    role: 'VENDOR',
    phone: '+91 98200 77665',
    status: 'ACTIVE',
    department: 'Apex Audit Solutions LLP',
    linkedEntityId: 'vnd_apex',
    password: 'Jshine@2329',
    address: 'Dadar West, Mumbai',
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: 'usr_auditor_rahul',
    name: 'Rahul Sharma',
    email: 'rahul.auditor@gmail.com',
    role: 'AUDITOR',
    phone: '+91 98200 33445',
    status: 'ACTIVE',
    department: 'Field Audit Associate',
    linkedEntityId: 'aud_rahul',
    password: 'Jshine@2329',
    address: 'Thane West, Maharashtra',
    createdAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 'usr_auditor_priya',
    name: 'Priya Mehta',
    email: 'priya.audit@gmail.com',
    role: 'AUDITOR',
    phone: '+91 98201 99887',
    status: 'ACTIVE',
    department: 'Senior Field Auditor',
    linkedEntityId: 'aud_priya',
    password: 'Jshine@2329',
    address: 'Mansarovar, Jaipur, Rajasthan',
    createdAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'usr_client_tata',
    name: 'Sunil Nair',
    email: 'audit.lead@tataconsumer.com',
    role: 'CLIENT',
    phone: '+91 98200 11223',
    status: 'ACTIVE',
    department: 'Tata Consumer Products Ltd',
    linkedEntityId: 'cli_tata',
    password: 'Jshine@2329',
    address: 'Peninsula Corporate Park, Mumbai',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'usr_client_dmart',
    name: 'Deepak Kothari',
    email: 'dmart.audit@dmartindia.com',
    role: 'CLIENT',
    phone: '+91 98205 12345',
    status: 'ACTIVE',
    department: 'Avenue Supermarts Ltd (D-Mart)',
    linkedEntityId: 'cli_dmart',
    password: 'Jshine@2329',
    address: 'Hiranandani Business Park, Powai, Mumbai',
    createdAt: '2026-01-20T00:00:00Z',
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_tata',
    clientId: 'JSS-CLI-001',
    name: 'Tata Consumer Products Ltd',
    clientType: 'MNC',
    pan: 'AAACT1234A',
    gstin: '27AAACT1234A1Z5',
    registeredAddress: '1 Bombay House, Homi Mody Street, Fort',
    billingAddress: 'Tower B, Peninsula Corporate Park, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    contactPerson: 'Sunil Nair',
    contactEmail: 'audit.lead@tataconsumer.com',
    contactPhone: '+91 98200 11223',
    paymentTermsDays: 30,
    tdsRatePercent: 2,
    creditLimit: 5000000,
    status: 'Active',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'cli_rel',
    clientId: 'JSS-CLI-002',
    name: 'Reliance Retail Logistics Hub',
    clientType: 'Corporate',
    pan: 'AABCR5678B',
    gstin: '27AABCR5678B1Z2',
    registeredAddress: 'Maker Chambers IV, Nariman Point',
    billingAddress: 'Ghansoli Reliance Corporate Park',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400701',
    contactPerson: 'Meera Patel',
    contactEmail: 'meera.patel@relretail.com',
    contactPhone: '+91 98201 44556',
    paymentTermsDays: 45,
    tdsRatePercent: 2,
    creditLimit: 8000000,
    status: 'Active',
    createdAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'cli_dmart',
    clientId: 'JSS-CLI-003',
    name: 'Avenue Supermarts Ltd (D-Mart)',
    clientType: 'Retail',
    pan: 'AABCA1234F',
    gstin: '27AABCA1234F1Z8',
    registeredAddress: 'Anjaneya Co-op Hsg Soc, Orchard Avenue, Powai',
    billingAddress: 'B-Wing, Hiranandani Business Park, Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    contactPerson: 'Deepak Kothari',
    contactEmail: 'dmart.audit@dmartindia.com',
    contactPhone: '+91 98205 12345',
    paymentTermsDays: 30,
    tdsRatePercent: 2,
    creditLimit: 6000000,
    status: 'Active',
    createdAt: '2026-01-20T10:00:00Z',
  },
];

export const INITIAL_TAX_CLIENTS: TaxClient[] = [
  {
    id: 'tax_cli_001',
    sn: 1,
    name: 'Rameshwar Lal Sharma',
    mobile: '+91 98290 11223',
    email: 'rameshwar.sharma@gmail.com',
    pan: 'AABCS1234D',
    password: 'Ramesh#ITR@2025',
    vendorName: 'Apex Audit Solutions LLP',
    serviceType: 'ITR',
    aysFiled: ['AY 2022-23', 'AY 2023-24', 'AY 2024-25', 'AY 2025-26'],
    status: 'Completed',
    filingDate: '2025-07-28',
    ackNumber: 'ITR-7788990012',
    notes: 'Salaried + Capital gains filing completed. Verified on IT portal.',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'tax_cli_002',
    sn: 2,
    name: 'Marwar Handicrafts & Exports',
    mobile: '+91 94140 44556',
    email: 'accounts@marwarexports.in',
    pan: 'AACCM5678K',
    password: 'Gst#Marwar@9988',
    vendorName: 'Direct In-House (JaySoftShine)',
    serviceType: 'BOTH',
    aysFiled: ['AY 2023-24', 'AY 2024-25', 'AY 2025-26'],
    gstin: '08AACCM5678K1Z3',
    status: 'Active',
    filingDate: '2025-10-14',
    ackNumber: 'GSTR-3B-OCT25-991',
    notes: 'Monthly GSTR-1 & 3B compliance + Corporate ITR-6 filing.',
    createdAt: '2026-01-15T11:30:00Z',
  },
  {
    id: 'tax_cli_003',
    sn: 3,
    name: 'Pooja Agarwal (Prop. Agarwal Trading)',
    mobile: '+91 97850 77889',
    email: 'pooja.agarwal.tax@yahoo.com',
    pan: 'BKPPA8899P',
    password: 'Pooja@Tax#4432',
    vendorName: 'Zenith Audit Services',
    serviceType: 'ITR',
    aysFiled: ['AY 2024-25', 'AY 2025-26'],
    status: 'Completed',
    filingDate: '2025-07-19',
    ackNumber: 'ITR-3344556677',
    notes: 'Business 44AD presumptive taxation filed.',
    createdAt: '2026-02-01T09:15:00Z',
  },
  {
    id: 'tax_cli_004',
    sn: 4,
    name: 'Kothari Logistics & Warehousing',
    mobile: '+91 98201 33221',
    email: 'finance@kotharilogistics.com',
    pan: 'AAACK9901M',
    password: 'Kothari#GST!77',
    vendorName: 'Apex Audit Solutions LLP',
    serviceType: 'GST',
    aysFiled: ['AY 2023-24', 'AY 2024-25'],
    gstin: '08AAACK9901M1ZF',
    status: 'Pending Filing',
    notes: 'GSTR-9 Annual Return preparation in progress.',
    createdAt: '2026-02-10T14:00:00Z',
  },
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd_apex',
    vendorId: 'JSS-VND-001',
    name: 'Apex Audit Solutions LLP',
    legalName: 'Apex Audit & Compliance Services LLP',
    contactPerson: 'Rajesh Kulkarni',
    phone: '+91 98200 77665',
    email: 'vendor@apexaudit.com',
    pan: 'AAXFA9876C',
    gstin: '27AAXFA9876C1ZB',
    address: '402, Trade Square, Senapati Bapat Marg, Dadar West',
    state: 'Maharashtra',
    bankName: 'HDFC Bank Ltd',
    bankAccount: '50200034981122',
    bankIfsc: 'HDFC0000240',
    msmeRegistered: true,
    paymentTermsDays: 15,
    defaultDayRate: 1200,
    rating: 4.8,
    status: 'Active',
    createdAt: '2026-01-12T09:00:00Z',
  },
  {
    id: 'vnd_south',
    vendorId: 'JSS-VND-002',
    name: 'South India Verifiers Pvt Ltd',
    legalName: 'South India Verifiers & Surveyors Private Limited',
    contactPerson: 'K. Balasubramanian',
    phone: '+91 94440 12345',
    email: 'operations@siverifiers.in',
    pan: 'AALCS3456D',
    gstin: '33AALCS3456D1Z4',
    address: '15, Anna Salai, Thousand Lights',
    state: 'Tamil Nadu',
    bankName: 'ICICI Bank',
    bankAccount: '000105029384',
    bankIfsc: 'ICIC0000001',
    msmeRegistered: false,
    paymentTermsDays: 20,
    defaultDayRate: 1250,
    rating: 4.6,
    status: 'Active',
    createdAt: '2026-01-20T10:00:00Z',
  },
];

export const INITIAL_AUDITORS: Auditor[] = [
  {
    id: 'aud_rahul',
    auditorId: 'JSS-AUD-001',
    name: 'Rahul Sharma',
    email: 'rahul.auditor@gmail.com',
    phone: '+91 98200 33445',
    address: 'Flat 304, Gokul Heights, Thane West',
    city: 'Thane',
    state: 'Maharashtra',
    pan: 'BHPPS4567M',
    bankName: 'State Bank of India',
    bankAccount: '30987654321',
    bankIfsc: 'SBIN0000456',
    skills: ['Physical Verification', 'Stock Audit', 'Asset Tagging'],
    experienceYears: 4,
    preferredStates: ['Maharashtra', 'Gujarat'],
    defaultDayRate: 1000,
    travelAllowancePerKm: 5,
    dailyFoodAllowance: 300,
    isAvailable: true,
    status: 'Active',
    createdAt: '2026-01-14T08:00:00Z',
  },
  {
    id: 'aud_nitin',
    auditorId: 'JSS-AUD-002',
    name: 'Nitin Gadkari Jr.',
    email: 'nitin.audit@gmail.com',
    phone: '+91 98220 66778',
    address: 'Plot 12, Shivaji Nagar, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    pan: 'CKMPG7890N',
    bankName: 'Bank of Baroda',
    bankAccount: '123401009876',
    bankIfsc: 'BARB0POONAX',
    skills: ['Fixed Asset Verification', 'Internal Audit'],
    experienceYears: 6,
    preferredStates: ['Maharashtra', 'Goa'],
    defaultDayRate: 1100,
    travelAllowancePerKm: 5,
    dailyFoodAllowance: 350,
    isAvailable: true,
    status: 'Active',
    createdAt: '2026-01-18T09:30:00Z',
  },
  {
    id: 'aud_priya',
    auditorId: 'JSS-AUD-003',
    name: 'Priya Mehta',
    email: 'priya.audit@gmail.com',
    phone: '+91 98201 99887',
    address: 'Sector 5, Mansarovar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pan: 'AWZPM8910R',
    bankName: 'HDFC Bank',
    bankAccount: '50100492817263',
    bankIfsc: 'HDFC0000123',
    skills: ['Inventory Verification', 'Stock Audit', 'Retail Compliance'],
    experienceYears: 5,
    preferredStates: ['Rajasthan', 'Delhi NCR', 'Gujarat'],
    defaultDayRate: 1050,
    travelAllowancePerKm: 5,
    dailyFoodAllowance: 300,
    isAvailable: true,
    status: 'Active',
    createdAt: '2026-01-16T10:00:00Z',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_tata_fy26',
    projectId: 'JSS-2026-0001',
    name: 'Tata Consumer - Annual Stock Audit FY26',
    clientId: 'cli_tata',
    clientName: 'Tata Consumer Products Ltd',
    poNumber: 'PO-TCPL-2026-908',
    category: 'Stock Audit',
    executionModel: 'HYBRID',
    projectManagerId: 'usr_pm',
    projectManagerName: 'Vikram Seth',
    startDate: '2026-02-01',
    endDate: '2026-03-31',
    totalLocations: 4,
    estimatedMandays: 12,
    clientRatePerManday: 1800,
    billingType: 'Per Manday',
    gstRatePercent: 18,
    budget: 21600,
    instructions: '100% count of tea & coffee stocks, verify warehouse stock registers, get counter-signatures.',
    status: 'Active',
    createdAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 'proj_rel_logistics',
    projectId: 'JSS-2026-0002',
    name: 'Reliance Retail - Warehouse Verification',
    clientId: 'cli_rel',
    clientName: 'Reliance Retail Logistics Hub',
    poNumber: 'PO-RRL-4401',
    category: 'Physical Verification',
    executionModel: 'VENDOR',
    projectManagerId: 'usr_pm',
    projectManagerName: 'Vikram Seth',
    startDate: '2026-02-15',
    endDate: '2026-04-15',
    totalLocations: 6,
    estimatedMandays: 18,
    clientRatePerManday: 2000,
    billingType: 'Per Manday',
    gstRatePercent: 18,
    budget: 36000,
    instructions: 'FMCG stock verification across regional fulfillment nodes.',
    status: 'Active',
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'proj_dmart_assets',
    projectId: 'JSS-2026-0003',
    name: 'D-Mart - Fixed Asset Tagging & Verification',
    clientId: 'cli_dmart',
    clientName: 'Avenue Supermarts Ltd (D-Mart)',
    poNumber: 'PO-ASL-2026-1120',
    category: 'Fixed Asset Verification',
    executionModel: 'DIRECT',
    projectManagerId: 'usr_pm',
    projectManagerName: 'Vikram Seth',
    startDate: '2026-02-20',
    endDate: '2026-04-20',
    totalLocations: 3,
    estimatedMandays: 9,
    clientRatePerManday: 1900,
    billingType: 'Per Manday',
    gstRatePercent: 18,
    budget: 17100,
    instructions: 'Barcode tagging and physical count of all fixtures, chilling units, and IT assets.',
    status: 'Active',
    createdAt: '2026-02-10T09:00:00Z',
  },
];

export const INITIAL_LOCATIONS: ProjectLocation[] = [
  // Tata Consumer Locations (4 sites)
  {
    id: 'loc_tata_01',
    projectId: 'proj_tata_fy26',
    projectCode: 'JSS-2026-0001',
    locationId: 'JSS-2026-0001-L001',
    clientSiteCode: 'TCPL-WH-BHIWANDI',
    siteName: 'Bhiwandi Central Fulfillment Depot',
    address: 'Survey 142/2, Mumbai-Nashik Highway, Bhiwandi',
    city: 'Bhiwandi',
    district: 'Thane',
    state: 'Maharashtra',
    pincode: '421302',
    contactPerson: 'Kailash Joshi (Warehouse Mgr)',
    contactPhone: '+91 98200 44332',
    plannedVisitDate: '2026-02-10',
    actualVisitDate: '2026-02-10',
    estimatedMandays: 3,
    actualMandays: 3,
    assignedType: 'AUDITOR',
    assignedEntityId: 'aud_rahul',
    assignedEntityName: 'Rahul Sharma',
    clientBillingRate: 1800,
    executionCostRate: 1000,
    status: 'Completed',
    createdAt: '2026-01-26T10:00:00Z',
  },
  {
    id: 'loc_tata_02',
    projectId: 'proj_tata_fy26',
    projectCode: 'JSS-2026-0001',
    locationId: 'JSS-2026-0001-L002',
    clientSiteCode: 'TCPL-DC-PUNE',
    siteName: 'Chakan Industrial Logistics Park',
    address: 'Phase 2, Chakan MIDC',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '410501',
    contactPerson: 'Sachin Shinde',
    contactPhone: '+91 98220 11998',
    plannedVisitDate: '2026-02-18',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 1800,
    executionCostRate: 1200,
    status: 'Scheduled',
    createdAt: '2026-01-26T10:00:00Z',
  },
  {
    id: 'loc_tata_03',
    projectId: 'proj_tata_fy26',
    projectCode: 'JSS-2026-0001',
    locationId: 'JSS-2026-0001-L003',
    clientSiteCode: 'TCPL-DC-AHM',
    siteName: 'Sanand Distribution Depot',
    address: 'Plot 45, GIDC Industrial Estate, Sanand',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382110',
    contactPerson: 'Paresh Trivedi',
    contactPhone: '+91 98250 88771',
    plannedVisitDate: '2026-02-24',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 1800,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-01-26T10:00:00Z',
  },
  {
    id: 'loc_tata_04',
    projectId: 'proj_tata_fy26',
    projectCode: 'JSS-2026-0001',
    locationId: 'JSS-2026-0001-L004',
    clientSiteCode: 'TCPL-DC-BLR',
    siteName: 'Whitefield Regional Logistics Depot',
    address: 'Survey 88, ITPL Main Road, Whitefield',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560066',
    contactPerson: 'S. Ramanathan',
    contactPhone: '+91 98450 66221',
    plannedVisitDate: '2026-03-05',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_south',
    assignedEntityName: 'South India Verifiers Pvt Ltd',
    clientBillingRate: 1800,
    executionCostRate: 1250,
    status: 'Allocated',
    createdAt: '2026-01-26T10:00:00Z',
  },

  // Reliance Retail Locations (6 sites)
  {
    id: 'loc_rel_01',
    projectId: 'proj_rel_logistics',
    projectCode: 'JSS-2026-0002',
    locationId: 'JSS-2026-0002-L001',
    clientSiteCode: 'RRL-PANVEL-01',
    siteName: 'Reliance Logistics Hub - Panvel',
    address: 'Sector 19, Kalamboli Warehousing Complex, Panvel',
    city: 'Navi Mumbai',
    district: 'Raigad',
    state: 'Maharashtra',
    pincode: '410218',
    contactPerson: 'Mahesh Deshmukh',
    contactPhone: '+91 98204 11223',
    plannedVisitDate: '2026-02-20',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 2000,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'loc_rel_02',
    projectId: 'proj_rel_logistics',
    projectCode: 'JSS-2026-0002',
    locationId: 'JSS-2026-0002-L002',
    clientSiteCode: 'RRL-BHIW-02',
    siteName: 'Reliance Retail DC - Mankoli Bhiwandi',
    address: 'Building B3, Indian Logistics Hub, Mankoli',
    city: 'Bhiwandi',
    district: 'Thane',
    state: 'Maharashtra',
    pincode: '421302',
    contactPerson: 'Girish Sawant',
    contactPhone: '+91 98205 22334',
    plannedVisitDate: '2026-02-25',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 2000,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'loc_rel_03',
    projectId: 'proj_rel_logistics',
    projectCode: 'JSS-2026-0002',
    locationId: 'JSS-2026-0002-L003',
    clientSiteCode: 'RRL-AHM-03',
    siteName: 'Reliance Fresh Fulfilment - Changodar',
    address: 'Sarkhej-Bawla Highway, Changodar',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382213',
    contactPerson: 'Ramesh Patel',
    contactPhone: '+91 98251 33445',
    plannedVisitDate: '2026-03-02',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 2000,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'loc_rel_04',
    projectId: 'proj_rel_logistics',
    projectCode: 'JSS-2026-0002',
    locationId: 'JSS-2026-0002-L004',
    clientSiteCode: 'RRL-PUNE-04',
    siteName: 'Reliance Digital Hub - Hinjewadi',
    address: 'Phase 3, Rajiv Gandhi Infotech Park, Hinjewadi',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    contactPerson: 'Amitabh More',
    contactPhone: '+91 98221 44556',
    plannedVisitDate: '2026-03-08',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 2000,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'loc_rel_05',
    projectId: 'proj_rel_logistics',
    projectCode: 'JSS-2026-0002',
    locationId: 'JSS-2026-0002-L005',
    clientSiteCode: 'RRL-JPR-05',
    siteName: 'Reliance Logistics Hub - Sitapura',
    address: 'RIICO Industrial Area, Sitapura',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302022',
    contactPerson: 'Suresh Choudhary',
    contactPhone: '+91 98290 55667',
    plannedVisitDate: '2026-03-14',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 2000,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'loc_rel_06',
    projectId: 'proj_rel_logistics',
    projectCode: 'JSS-2026-0002',
    locationId: 'JSS-2026-0002-L006',
    clientSiteCode: 'RRL-NGP-06',
    siteName: 'Reliance Regional Depot - Butibori',
    address: 'MIDC Industrial Estate, Butibori',
    city: 'Nagpur',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '441108',
    contactPerson: 'Vinod Raut',
    contactPhone: '+91 98232 66778',
    plannedVisitDate: '2026-03-20',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'VENDOR',
    assignedEntityId: 'vnd_apex',
    assignedEntityName: 'Apex Audit Solutions LLP',
    clientBillingRate: 2000,
    executionCostRate: 1200,
    status: 'Allocated',
    createdAt: '2026-02-02T10:00:00Z',
  },

  // D-Mart Locations (3 sites)
  {
    id: 'loc_dmart_01',
    projectId: 'proj_dmart_assets',
    projectCode: 'JSS-2026-0003',
    locationId: 'JSS-2026-0003-L001',
    clientSiteCode: 'DMART-THN-44',
    siteName: 'D-Mart Superstore #44 - Thane West',
    address: 'Ghodbunder Road, Near Waghbil Naka, Thane West',
    city: 'Thane',
    district: 'Thane',
    state: 'Maharashtra',
    pincode: '400607',
    contactPerson: 'Sanjay Salvi (Store Mgr)',
    contactPhone: '+91 98206 77889',
    plannedVisitDate: '2026-02-22',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'AUDITOR',
    assignedEntityId: 'aud_rahul',
    assignedEntityName: 'Rahul Sharma',
    clientBillingRate: 1900,
    executionCostRate: 1000,
    status: 'Allocated',
    createdAt: '2026-02-11T10:00:00Z',
  },
  {
    id: 'loc_dmart_02',
    projectId: 'proj_dmart_assets',
    projectCode: 'JSS-2026-0003',
    locationId: 'JSS-2026-0003-L002',
    clientSiteCode: 'DMART-PUN-12',
    siteName: 'D-Mart Hypermarket - Kothrud',
    address: 'Paud Road, Near Vanaz Corner, Kothrud',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    contactPerson: 'Pradeep Kamat',
    contactPhone: '+91 98222 88990',
    plannedVisitDate: '2026-02-28',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'AUDITOR',
    assignedEntityId: 'aud_nitin',
    assignedEntityName: 'Nitin Gadkari Jr.',
    clientBillingRate: 1900,
    executionCostRate: 1100,
    status: 'Allocated',
    createdAt: '2026-02-11T10:00:00Z',
  },
  {
    id: 'loc_dmart_03',
    projectId: 'proj_dmart_assets',
    projectCode: 'JSS-2026-0003',
    locationId: 'JSS-2026-0003-L003',
    clientSiteCode: 'DMART-JPR-08',
    siteName: 'D-Mart Retail Depot - Mansarovar',
    address: 'Madhyam Marg, Sector 7, Mansarovar',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302020',
    contactPerson: 'Manoj Sharma',
    contactPhone: '+91 98291 99001',
    plannedVisitDate: '2026-03-05',
    estimatedMandays: 3,
    actualMandays: 0,
    assignedType: 'AUDITOR',
    assignedEntityId: 'aud_priya',
    assignedEntityName: 'Priya Mehta',
    clientBillingRate: 1900,
    executionCostRate: 1050,
    status: 'Allocated',
    createdAt: '2026-02-11T10:00:00Z',
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asn_001',
    assignmentId: 'JSS-ASN-2026-001',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    locationIds: ['loc_tata_01'],
    executionType: 'DIRECT',
    assignedToId: 'aud_rahul',
    assignedToName: 'Rahul Sharma',
    assignedDate: '2026-01-28',
    plannedStartDate: '2026-02-10',
    plannedEndDate: '2026-02-12',
    expectedMandays: 3,
    clientRateSnapshot: 1800,
    executionRateSnapshot: 1000,
    estimatedRevenue: 5400,
    estimatedCost: 3000,
    estimatedMargin: 2400,
    approvalStatus: 'Completed',
    instructions: '100% itemized verification with photo evidence of batch numbers.',
    createdAt: '2026-01-28T09:00:00Z',
  },
  {
    id: 'asn_002',
    assignmentId: 'JSS-ASN-2026-002',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    locationIds: ['loc_tata_02', 'loc_tata_03'],
    executionType: 'VENDOR',
    assignedToId: 'vnd_apex',
    assignedToName: 'Apex Audit Solutions LLP',
    assignedDate: '2026-02-01',
    plannedStartDate: '2026-02-18',
    plannedEndDate: '2026-02-28',
    expectedMandays: 6,
    clientRateSnapshot: 1800,
    executionRateSnapshot: 1200,
    estimatedRevenue: 10800,
    estimatedCost: 7200,
    estimatedMargin: 3600,
    approvalStatus: 'Approved',
    instructions: 'Deploy 2 qualified audit executives for Chakan and Sanand depots.',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'asn_003',
    assignmentId: 'JSS-ASN-2026-003',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    locationIds: ['loc_tata_04'],
    executionType: 'VENDOR',
    assignedToId: 'vnd_south',
    assignedToName: 'South India Verifiers Pvt Ltd',
    assignedDate: '2026-02-05',
    plannedStartDate: '2026-03-05',
    plannedEndDate: '2026-03-08',
    expectedMandays: 3,
    clientRateSnapshot: 1800,
    executionRateSnapshot: 1250,
    estimatedRevenue: 5400,
    estimatedCost: 3750,
    estimatedMargin: 1650,
    approvalStatus: 'Approved',
    instructions: 'Deploy South region audit team for Whitefield hub.',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'asn_004',
    assignmentId: 'JSS-ASN-2026-004',
    projectId: 'proj_rel_logistics',
    projectName: 'Reliance Retail - Warehouse Verification',
    locationIds: ['loc_rel_01', 'loc_rel_02', 'loc_rel_03', 'loc_rel_04', 'loc_rel_05', 'loc_rel_06'],
    executionType: 'VENDOR',
    assignedToId: 'vnd_apex',
    assignedToName: 'Apex Audit Solutions LLP',
    assignedDate: '2026-02-02',
    plannedStartDate: '2026-02-20',
    plannedEndDate: '2026-03-25',
    expectedMandays: 18,
    clientRateSnapshot: 2000,
    executionRateSnapshot: 1200,
    estimatedRevenue: 36000,
    estimatedCost: 21600,
    estimatedMargin: 14400,
    approvalStatus: 'Approved',
    instructions: 'Comprehensive multi-node stock verification for Pan-India logistics cluster.',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'asn_005',
    assignmentId: 'JSS-ASN-2026-005',
    projectId: 'proj_dmart_assets',
    projectName: 'D-Mart - Fixed Asset Tagging & Verification',
    locationIds: ['loc_dmart_01', 'loc_dmart_02', 'loc_dmart_03'],
    executionType: 'DIRECT',
    assignedToId: 'aud_rahul',
    assignedToName: 'Rahul Sharma',
    assignedDate: '2026-02-12',
    plannedStartDate: '2026-02-22',
    plannedEndDate: '2026-03-10',
    expectedMandays: 9,
    clientRateSnapshot: 1900,
    executionRateSnapshot: 1050,
    estimatedRevenue: 17100,
    estimatedCost: 9450,
    estimatedMargin: 7650,
    approvalStatus: 'Approved',
    instructions: 'Deploy internal audit seniors for high-value asset tagging and fixture count.',
    createdAt: '2026-02-12T10:00:00Z',
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_001',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    locationId: 'loc_tata_01',
    locationName: 'Bhiwandi Central Fulfillment Depot',
    assignmentId: 'asn_001',
    auditorId: 'aud_rahul',
    auditorName: 'Rahul Sharma',
    workDate: '2026-02-10',
    checkInTime: '09:15',
    checkOutTime: '18:30',
    isHalfDay: false,
    mandays: 1.0,
    gpsLocation: '19.2969, 73.0631 (Bhiwandi Depot)',
    approvalStatus: 'Approved',
    approvedBy: 'Vikram Seth',
    submittedBy: 'Rahul Sharma',
    createdAt: '2026-02-10T18:35:00Z',
  },
];

export const INITIAL_REPORTS: WorkReport[] = [
  {
    id: 'rep_001',
    reportId: 'JSS-REP-2026-001',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    locationId: 'loc_tata_01',
    locationName: 'Bhiwandi Central Fulfillment Depot',
    category: 'Stock Audit',
    submittedBy: 'Rahul Sharma',
    submissionDate: '2026-02-12',
    totalAssetsCounted: 44920,
    discrepanciesFound: 80,
    physicalConditionNotes: 'Variance of 80 tea boxes identified as transit water damage. Counter-signed.',
    photoUrls: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
    status: 'Approved',
    createdAt: '2026-02-12T16:00:00Z',
  },
];

export const INITIAL_INVOICES: ClientInvoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'JSS/25-26/INV-0101',
    invoiceDate: '2026-02-15',
    dueDate: '2026-03-17',
    clientId: 'cli_tata',
    clientName: 'Tata Consumer Products Ltd',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    billingAddress: 'Tower B, Peninsula Corporate Park, Lower Parel',
    clientGstin: '27AAACT1234A1Z5',
    stateCode: '27 (Maharashtra)',
    items: [
      {
        description: 'Physical Verification & Stock Audit Charges',
        hsnSac: '998311',
        quantity: 9,
        rate: 1800,
        amount: 16200,
      },
    ],
    taxableAmount: 16200,
    isInterState: false,
    cgstAmount: 1458,
    sgstAmount: 1458,
    igstAmount: 0,
    totalAmount: 19116,
    tdsDeductedByClient: 324,
    paidAmount: 0,
    balanceDue: 19116,
    status: 'Approved',
    createdAt: '2026-02-15T11:00:00Z',
  },
];

export const INITIAL_RECEIPTS: ClientPaymentReceipt[] = [];

export const INITIAL_VENDOR_BILLS: VendorBill[] = [
  {
    id: 'vbill_001',
    billNumber: 'APEX/2026/089',
    billDate: '2026-02-18',
    vendorId: 'vnd_apex',
    vendorName: 'Apex Audit Solutions LLP',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    approvedMandays: 3,
    agreedRate: 1200,
    taxableAmount: 3600,
    gstAmount: 0,
    tdsRatePercent: 2,
    tdsDeduction: 72,
    advanceAdjusted: 0,
    netPayable: 3528,
    paidAmount: 0,
    outstanding: 3528,
    paymentStatus: 'Pending',
    createdAt: '2026-02-18T14:00:00Z',
  },
];

export const INITIAL_AUDITOR_SETTLEMENTS: AuditorSettlement[] = [
  {
    id: 'aset_001',
    settlementNumber: 'JSS/SET/2026/001',
    auditorId: 'aud_rahul',
    auditorName: 'Rahul Sharma',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    approvedMandays: 3,
    dailyRate: 1000,
    mandayPayable: 3000,
    travelAllowance: 450,
    foodAllowance: 900,
    hotelAllowance: 0,
    otherExpenses: 0,
    grossPayable: 4350,
    advanceDeduction: 0,
    tdsDeduction: 0,
    netPayable: 4350,
    paidAmount: 0,
    outstanding: 4350,
    status: 'Approved',
    createdAt: '2026-02-14T17:00:00Z',
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_001',
    expenseId: 'EXP-2026-001',
    projectId: 'proj_tata_fy26',
    projectName: 'Tata Consumer - Annual Stock Audit FY26',
    category: 'Travel',
    amount: 350,
    submittedBy: 'Rahul Sharma (Auditor)',
    submitterType: 'AUDITOR',
    description: 'Local taxi transit from Thane station to Bhiwandi logistics cluster',
    date: '2026-02-10',
    approvalStatus: 'Approved',
    createdAt: '2026-02-10T19:00:00Z',
  },
];

export const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 'jrn_001',
    voucherNo: 'JV-2026-0001',
    date: '2026-02-15',
    narration: 'Revenue recognized for Tata Consumer Products Ltd audit visit (INV-0101)',
    voucherType: 'Sales',
    totalDebit: 19116,
    totalCredit: 19116,
    isPosted: true,
    postedBy: 'CA Anita Joshi',
    lines: [
      { accountCode: '1100', accountName: 'Accounts Receivable (Tata Consumer)', debit: 19116, credit: 0 },
      { accountCode: '4000', accountName: 'Audit & Physical Verification Revenue', debit: 0, credit: 16200 },
      { accountCode: '2210', accountName: 'Output CGST Liability (9%)', debit: 0, credit: 1458 },
      { accountCode: '2220', accountName: 'Output SGST Liability (9%)', debit: 0, credit: 1458 },
    ],
    createdAt: '2026-02-15T11:30:00Z',
  },
];

export const INITIAL_SMTP: SmtpConfig = {
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  username: 'resend',
  password: 're_H5oTPCSP_NFHME4D7pwvm2jTGak4YjYoe',
  fromEmail: 'noreply@jaysoftshine.com',
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
    description: 'Unrestricted full access across all modules, tax client management, user rights, master password resets, double-entry books, and statutory filings.',
    allowedTabs: [
      'dashboard',
      'clients',
      'tax-clients',
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
    description: 'Operational coordinator. Can manage clients, ITR/GST clients, projects, site schedules, and auditor allocations. Excluded from confidential accounts, bank disbursement, and audit trail logs.',
    allowedTabs: [
      'dashboard',
      'clients',
      'tax-clients',
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
    description: 'Financial ledger authority. ITR & GST clients utility, billed client invoicing, vendor bill clearances, auditor settlement payouts, GST registers, and double-entry trial balance.',
    allowedTabs: [
      'dashboard',
      'tax-clients',
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
  // Clear any legacy test data from prior revisions
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('jaysoftshine_erp_v1');
    localStorage.removeItem('jaysoftshine_erp_prod_v1');
    localStorage.removeItem('jaysoftshine_erp_prod_v2');
    localStorage.removeItem('jaysoftshine_erp_prod_v3');
    localStorage.removeItem('jaysoftshine_erp_prod_v4');
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
      } else {
        parsed.organization.name = 'JaySoftShine';
        parsed.organization.gstin = '08BKDPV7945P1Z2';
        parsed.organization.pan = 'BKDPV7945P';
        if (parsed.organization.bankDetails) {
          parsed.organization.bankDetails.pan = 'BKDPV7945P';
        }
      }
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = INITIAL_USERS;
      }
      if (!parsed.clients || parsed.clients.length === 0) {
        parsed.clients = INITIAL_CLIENTS;
      }
      if (!parsed.taxClients || parsed.taxClients.length === 0) {
        parsed.taxClients = INITIAL_TAX_CLIENTS;
      }
      if (!parsed.vendors || parsed.vendors.length === 0) {
        parsed.vendors = INITIAL_VENDORS;
      }
      if (!parsed.auditors || parsed.auditors.length === 0) {
        parsed.auditors = INITIAL_AUDITORS;
      }
      if (!parsed.projects || parsed.projects.length === 0) {
        parsed.projects = INITIAL_PROJECTS;
      }
      if (!parsed.locations || parsed.locations.length === 0) {
        parsed.locations = INITIAL_LOCATIONS;
      }
      if (!parsed.assignments || parsed.assignments.length === 0) {
        parsed.assignments = INITIAL_ASSIGNMENTS;
      }
      if (!parsed.invoices || parsed.invoices.length === 0) {
        parsed.invoices = INITIAL_INVOICES;
      }
      if (!parsed.vendorBills || parsed.vendorBills.length === 0) {
        parsed.vendorBills = INITIAL_VENDOR_BILLS;
      }
      if (!parsed.auditorSettlements || parsed.auditorSettlements.length === 0) {
        parsed.auditorSettlements = INITIAL_AUDITOR_SETTLEMENTS;
      }
      if (!parsed.auditLogs || parsed.auditLogs.length === 0) {
        parsed.auditLogs = INITIAL_AUDIT_LOGS;
      }

      // Auto-heal: Ensure every vendor, auditor, and client has an active UserProfile for seamless login
      const currentUsers: UserProfile[] = parsed.users || [];
      const updatedUsers = [...currentUsers];

      // 1. Sync Vendors into Users
      for (const v of parsed.vendors || []) {
        const hasUser = updatedUsers.some(
          (u) =>
            u.linkedEntityId === v.id ||
            u.linkedEntityId === v.vendorId ||
            (u.email && v.email && u.email.toLowerCase() === v.email.toLowerCase())
        );
        if (!hasUser) {
          updatedUsers.push({
            id: `usr_${v.vendorId || v.id}`,
            name: v.contactPerson || v.name,
            email: v.email,
            role: 'VENDOR',
            phone: v.phone,
            linkedEntityId: v.id,
            status: 'ACTIVE',
            department: v.name,
            password: 'Jshine@2329',
            createdAt: v.createdAt || new Date().toISOString(),
          });
        }
      }

      // 2. Sync Auditors into Users
      for (const a of parsed.auditors || []) {
        const hasUser = updatedUsers.some(
          (u) =>
            u.linkedEntityId === a.id ||
            u.linkedEntityId === a.auditorId ||
            (u.email && a.email && u.email.toLowerCase() === a.email.toLowerCase())
        );
        if (!hasUser) {
          updatedUsers.push({
            id: `usr_${a.auditorId || a.id}`,
            name: a.name,
            email: a.email,
            role: 'AUDITOR',
            phone: a.phone,
            linkedEntityId: a.id,
            status: 'ACTIVE',
            department: 'Field Audit Associate',
            password: 'Jshine@2329',
            createdAt: a.createdAt || new Date().toISOString(),
          });
        }
      }

      // 3. Sync Clients into Users
      for (const c of parsed.clients || []) {
        const cEmail = c.contactEmail || c.email || `${c.clientId.toLowerCase()}@clientportal.com`;
        const hasUser = updatedUsers.some(
          (u) =>
            u.linkedEntityId === c.id ||
            u.linkedEntityId === c.clientId ||
            (u.email && cEmail && u.email.toLowerCase() === cEmail.toLowerCase())
        );
        if (!hasUser) {
          updatedUsers.push({
            id: `usr_${c.clientId || c.id}`,
            name: c.contactPerson || c.name,
            email: cEmail,
            role: 'CLIENT',
            phone: c.contactPhone || c.phone,
            linkedEntityId: c.id,
            status: 'ACTIVE',
            department: c.name,
            password: 'Jshine@2329',
            createdAt: c.createdAt || new Date().toISOString(),
          });
        }
      }
      parsed.users = updatedUsers;

      if (!parsed.rolePermissions || parsed.rolePermissions.length === 0) {
        parsed.rolePermissions = DEFAULT_ROLE_PERMISSIONS;
      } else {
        // Ensure new modules like tax-clients are available to admin and accounts roles
        parsed.rolePermissions = parsed.rolePermissions.map((rp: any) => {
          if (
            ['SUPER_ADMIN', 'ADMIN', 'OFFICE_ADMIN', 'ACCOUNTS'].includes(rp.role) &&
            !rp.allowedTabs.includes('tax-clients')
          ) {
            return {
              ...rp,
              allowedTabs: [...rp.allowedTabs, 'tax-clients'],
            };
          }
          return rp;
        });
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
    taxClients: INITIAL_TAX_CLIENTS,
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
