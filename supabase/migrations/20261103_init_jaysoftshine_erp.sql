-- JAYSOFTSHINE AUDIT & OPERATIONS ERP
-- Production PostgreSQL Migration Schema
-- Organization: JaySoftShine (Single Organization)
-- Currency: INR (Stored in Paise/Rupees)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TYPE user_role_enum AS ENUM (
  'SUPER_ADMIN', 'ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS', 'VENDOR', 'SUB_VENDOR', 'AUDITOR', 'CLIENT'
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role_enum NOT NULL DEFAULT 'AUDITOR',
  linked_entity_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLIENTS (CRM)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id_code TEXT UNIQUE NOT NULL, -- e.g. JSS-CLI-001
  name TEXT NOT NULL,
  client_type TEXT NOT NULL,
  pan TEXT NOT NULL,
  gstin TEXT NOT NULL,
  registered_address TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  payment_terms_days INTEGER DEFAULT 30,
  tds_rate_percent NUMERIC(5,2) DEFAULT 2.00,
  credit_limit NUMERIC(15,2) DEFAULT 1000000.00,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VENDORS
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id_code TEXT UNIQUE NOT NULL, -- e.g. JSS-VND-001
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  pan TEXT NOT NULL,
  gstin TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  bank_ifsc TEXT NOT NULL,
  msme_registered BOOLEAN DEFAULT FALSE,
  payment_terms_days INTEGER DEFAULT 15,
  default_day_rate NUMERIC(12,2) DEFAULT 1200.00,
  rating NUMERIC(3,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AUDITORS
CREATE TABLE auditors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auditor_id_code TEXT UNIQUE NOT NULL, -- e.g. JSS-AUD-001
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  pan TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  bank_ifsc TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 1,
  preferred_states TEXT[] DEFAULT '{}',
  default_day_rate NUMERIC(12,2) DEFAULT 1000.00,
  travel_allowance_per_km NUMERIC(8,2) DEFAULT 5.00,
  daily_food_allowance NUMERIC(8,2) DEFAULT 300.00,
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROJECTS
CREATE TYPE execution_model_enum AS ENUM ('DIRECT', 'VENDOR', 'HYBRID');
CREATE TYPE project_status_enum AS ENUM ('Draft', 'Active', 'On Hold', 'Completed', 'Cancelled');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id_code TEXT UNIQUE NOT NULL, -- e.g. JSS-2026-0001
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  po_number TEXT,
  category TEXT NOT NULL,
  execution_model execution_model_enum NOT NULL DEFAULT 'DIRECT',
  project_manager_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_locations INTEGER DEFAULT 1,
  estimated_mandays NUMERIC(10,2) DEFAULT 1,
  client_rate_per_manday NUMERIC(12,2) NOT NULL DEFAULT 1500.00,
  billing_type TEXT DEFAULT 'Per Manday',
  gst_rate_percent NUMERIC(5,2) DEFAULT 18.00,
  budget NUMERIC(15,2) DEFAULT 0.00,
  instructions TEXT,
  status project_status_enum DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LOCATIONS
CREATE TYPE location_status_enum AS ENUM (
  'Unallocated', 'Allocated', 'Scheduled', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Completed', 'On Hold', 'Revisit Required', 'Rejected', 'Cancelled'
);

CREATE TABLE project_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  location_id_code TEXT NOT NULL, -- e.g. JSS-2026-0001-L001
  client_site_code TEXT,
  site_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  contact_person TEXT,
  contact_phone TEXT,
  planned_visit_date DATE,
  actual_visit_date DATE,
  estimated_mandays NUMERIC(6,2) DEFAULT 1.0,
  actual_mandays NUMERIC(6,2) DEFAULT 0.0,
  assigned_type TEXT, -- 'AUDITOR' or 'VENDOR'
  assigned_entity_id UUID,
  client_billing_rate NUMERIC(12,2) DEFAULT 1500.00,
  execution_cost_rate NUMERIC(12,2) DEFAULT 1000.00,
  status location_status_enum DEFAULT 'Unallocated',
  revisit_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, location_id_code)
);

-- 7. ASSIGNMENTS
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id_code TEXT UNIQUE NOT NULL, -- e.g. JSS-ASN-2026-001
  project_id UUID NOT NULL REFERENCES projects(id),
  execution_type TEXT NOT NULL, -- 'DIRECT', 'VENDOR', 'SUB_VENDOR'
  assigned_to_id UUID NOT NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  expected_mandays NUMERIC(8,2) DEFAULT 1.0,
  client_rate_snapshot NUMERIC(12,2) NOT NULL,
  execution_rate_snapshot NUMERIC(12,2) NOT NULL,
  estimated_revenue NUMERIC(15,2) DEFAULT 0.0,
  estimated_cost NUMERIC(15,2) DEFAULT 0.0,
  estimated_margin NUMERIC(15,2) DEFAULT 0.0,
  instructions TEXT,
  approval_status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ATTENDANCE & MANDAYS
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  location_id UUID NOT NULL REFERENCES project_locations(id),
  assignment_id UUID REFERENCES assignments(id),
  auditor_id UUID REFERENCES auditors(id),
  vendor_id UUID REFERENCES vendors(id),
  work_date DATE NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  is_half_day BOOLEAN DEFAULT FALSE,
  mandays NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  remarks TEXT,
  gps_location TEXT,
  photo_url TEXT,
  submitted_by TEXT NOT NULL,
  approval_status TEXT DEFAULT 'Pending',
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WORK REPORTS
CREATE TABLE work_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id_code TEXT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  location_id UUID NOT NULL REFERENCES project_locations(id),
  category TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Submitted',
  total_assets_counted INTEGER DEFAULT 0,
  discrepancies_found INTEGER DEFAULT 0,
  physical_condition_notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  document_url TEXT,
  verified_by TEXT,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CLIENT INVOICES & RECEIVABLES
CREATE TABLE client_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL, -- e.g. JSS/26-27/001
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  billing_address TEXT NOT NULL,
  client_gstin TEXT NOT NULL,
  taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  is_inter_state BOOLEAN DEFAULT FALSE,
  cgst_amount NUMERIC(15,2) DEFAULT 0.00,
  sgst_amount NUMERIC(15,2) DEFAULT 0.00,
  igst_amount NUMERIC(15,2) DEFAULT 0.00,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  tds_deducted_by_client NUMERIC(15,2) DEFAULT 0.00,
  paid_amount NUMERIC(15,2) DEFAULT 0.00,
  balance_due NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. VENDOR BILLS & AUDITOR SETTLEMENTS
CREATE TABLE vendor_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT NOT NULL,
  bill_date DATE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  approved_mandays NUMERIC(8,2) NOT NULL,
  agreed_rate NUMERIC(12,2) NOT NULL,
  taxable_amount NUMERIC(15,2) NOT NULL,
  gst_amount NUMERIC(15,2) DEFAULT 0.00,
  tds_rate_percent NUMERIC(5,2) DEFAULT 2.00,
  tds_deduction NUMERIC(15,2) DEFAULT 0.00,
  advance_adjusted NUMERIC(15,2) DEFAULT 0.00,
  net_payable NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) DEFAULT 0.00,
  outstanding NUMERIC(15,2) NOT NULL,
  payment_status TEXT DEFAULT 'Pending',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auditor_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_number TEXT UNIQUE NOT NULL,
  auditor_id UUID NOT NULL REFERENCES auditors(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  approved_mandays NUMERIC(8,2) NOT NULL,
  daily_rate NUMERIC(12,2) NOT NULL,
  manday_payable NUMERIC(15,2) NOT NULL,
  travel_allowance NUMERIC(12,2) DEFAULT 0.00,
  food_allowance NUMERIC(12,2) DEFAULT 0.00,
  hotel_allowance NUMERIC(12,2) DEFAULT 0.00,
  other_expenses NUMERIC(12,2) DEFAULT 0.00,
  gross_payable NUMERIC(15,2) NOT NULL,
  advance_deduction NUMERIC(15,2) DEFAULT 0.00,
  tds_deduction NUMERIC(15,2) DEFAULT 0.00,
  net_payable NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) DEFAULT 0.00,
  outstanding NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'Pending',
  payment_date DATE,
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DOUBLE ENTRY ACCOUNTING (JOURNALS & ACCOUNTS)
CREATE TABLE chart_of_accounts (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Asset', 'Liability', 'Equity', 'Income', 'Expense'
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_no TEXT UNIQUE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  narration TEXT NOT NULL,
  voucher_type TEXT NOT NULL,
  total_debit NUMERIC(15,2) NOT NULL,
  total_credit NUMERIC(15,2) NOT NULL,
  is_posted BOOLEAN DEFAULT TRUE,
  posted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_journal_balanced CHECK (total_debit = total_credit)
);

-- RLS POLICIES ENABLED
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditor_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX idx_locations_project ON project_locations(project_id);
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_attendance_project ON attendance(project_id);
CREATE INDEX idx_attendance_date ON attendance(work_date);
CREATE INDEX idx_invoices_client ON client_invoices(client_id);
