-- JaySoftShine Audit & Operations ERP - Initial Database Seed

-- Organizations
INSERT INTO clients (client_id_code, name, client_type, pan, gstin, registered_address, billing_address, city, state, pincode, contact_person, contact_email, contact_phone, payment_terms_days, tds_rate_percent, credit_limit)
VALUES 
  ('JSS-CLI-001', 'Tata Consumer Products Ltd', 'MNC', 'AAACT1234A', '27AAACT1234A1Z5', '1 Bombay House, Homi Mody Street, Fort', 'Tower B, Peninsula Corporate Park, Lower Parel', 'Mumbai', 'Maharashtra', '400013', 'Sunil Nair', 'audit.lead@tataconsumer.com', '+91 98200 11223', 30, 2.00, 5000000.00),
  ('JSS-CLI-002', 'Reliance Retail Logistics Hub', 'Corporate', 'AABCR5678B', '27AABCR5678B1Z2', 'Maker Chambers IV, Nariman Point', 'Ghansoli Reliance Corporate Park', 'Navi Mumbai', 'Maharashtra', '400701', 'Meera Patel', 'meera.patel@relretail.com', '+91 98201 44556', 45, 2.00, 8000000.00),
  ('JSS-CLI-003', 'KPMG India LLP (Advisory)', 'Big Four Firm', 'AAAFK9012K', '06AAAFK9012K1Z9', 'Building 10, DLF Cyber City', 'Building 10, DLF Cyber City, Sector 24', 'Gurugram', 'Haryana', '122002', 'Anand Roy', 'anandroy@kpmg.com', '+91 98110 99881', 15, 10.00, 3000000.00);

-- Vendors
INSERT INTO vendors (vendor_id_code, name, legal_name, contact_person, phone, email, pan, gstin, address, state, bank_name, bank_account, bank_ifsc, msme_registered, payment_terms_days, default_day_rate)
VALUES
  ('JSS-VND-001', 'Apex Audit Solutions LLP', 'Apex Audit & Compliance Services LLP', 'Rajesh Kulkarni', '+91 98200 77665', 'vendor@apexaudit.com', 'AAXFA9876C', '27AAXFA9876C1ZB', '402, Trade Square, Senapati Bapat Marg, Dadar West', 'Maharashtra', 'HDFC Bank Ltd', '50200034981122', 'HDFC0000240', true, 15, 1200.00),
  ('JSS-VND-002', 'South India Verifiers Pvt Ltd', 'South India Verifiers & Surveyors Private Limited', 'K. Balasubramanian', '+91 94440 12345', 'operations@siverifiers.in', 'AALCS3456D', '33AALCS3456D1Z4', '15, Anna Salai, Thousand Lights', 'Tamil Nadu', 'ICICI Bank', '000105029384', 'ICIC0000001', false, 20, 1250.00);

-- Auditors
INSERT INTO auditors (auditor_id_code, name, email, phone, address, pan, bank_name, bank_account, bank_ifsc, skills, experience_years, preferred_states, default_day_rate, travel_allowance_per_km, daily_food_allowance)
VALUES
  ('JSS-AUD-001', 'Rahul Sharma', 'rahul.auditor@gmail.com', '+91 98200 33445', 'Flat 304, Gokul Heights, Thane West', 'BHPPS4567M', 'State Bank of India', '30987654321', 'SBIN0000456', ARRAY['Physical Verification', 'Stock Audit', 'Asset Tagging'], 4, ARRAY['Maharashtra', 'Gujarat'], 1000.00, 5.00, 300.00),
  ('JSS-AUD-002', 'Nitin Gadkari Jr.', 'nitin.audit@gmail.com', '+91 98220 66778', 'Plot 12, Shivaji Nagar, Pune', 'CKMPG7890N', 'Bank of Baroda', '123401009876', 'BARB0POONAX', ARRAY['Fixed Asset Verification', 'Internal Audit'], 6, ARRAY['Maharashtra', 'Goa'], 1100.00, 5.00, 350.00);

-- Chart of Accounts
INSERT INTO chart_of_accounts (code, name, type) VALUES
  ('1010', 'HDFC Bank Current Account', 'Asset'),
  ('1100', 'Accounts Receivable (Trade Debtors)', 'Asset'),
  ('1200', 'TDS Receivable (Section 194C/J)', 'Asset'),
  ('1310', 'Input CGST (Eligible ITC)', 'Asset'),
  ('1320', 'Input SGST (Eligible ITC)', 'Asset'),
  ('2100', 'Vendor Payables', 'Liability'),
  ('2150', 'Auditor Payables', 'Liability'),
  ('2210', 'Output CGST Liability', 'Liability'),
  ('2220', 'Output SGST Liability', 'Liability'),
  ('3010', 'Partners Capital Account', 'Equity'),
  ('4000', 'Audit & Physical Verification Revenue', 'Income'),
  ('5010', 'Direct Vendor Outsourcing Charges', 'Expense'),
  ('5020', 'Direct Auditor Remuneration', 'Expense');
