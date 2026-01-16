-- ============================================================================
-- ROOFIO DATA CENTRAL - Core Database Schema
-- Documents ARE the data. Single source of truth.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CONTACTS
-- ============================================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('owner', 'architect', 'gc', 'subcontractor', 'supplier', 'inspector')),
  company TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_company ON contacts(company);

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  project_number TEXT UNIQUE,
  location TEXT,
  address TEXT,
  owner_id UUID REFERENCES contacts(id),
  architect_id UUID REFERENCES contacts(id),
  gc_id UUID REFERENCES contacts(id),
  contract_sum DECIMAL(12,2) DEFAULT 0,
  original_contract_sum DECIMAL(12,2) DEFAULT 0,
  retainage_pct DECIMAL(5,2) DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('bidding', 'awarded', 'active', 'complete', 'warranty', 'closed')),
  start_date DATE,
  substantial_completion DATE,
  final_completion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);

-- ============================================================================
-- USERS & ROLES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'estimator', 'pm', 'detailer', 'superintendent', 'safety', 'qc',
    'accounts', 'hr', 'foreman', 'sales', 'marketing', 'warranty', 'owner', 'admin'
  )),
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- User project assignments
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id, role)
);

-- ============================================================================
-- DOCUMENTS (Source of Truth)
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'contract', 'scope', 'drawing', 'specification', 'assembly_letter',
    'submittal', 'change_order', 'daily_log', 'pay_application',
    'bond', 'insurance', 'msds', 'warranty', 'closeout'
  )),
  filename TEXT NOT NULL,
  version TEXT DEFAULT '1',
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  parsed_at TIMESTAMPTZ,
  parse_confidence DECIMAL(5,4),
  is_current BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_current ON documents(project_id, type, is_current) WHERE is_current = TRUE;

-- ============================================================================
-- EXTRACTED DATA (AI Parsed Fields)
-- ============================================================================

CREATE TABLE extracted_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value JSONB,
  field_type TEXT, -- 'string', 'number', 'currency', 'date', etc.
  confidence DECIMAL(5,4) DEFAULT 0,
  source_page INTEGER,
  source_location TEXT, -- bounding box or text snippet reference
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extracted_data_document ON extracted_data(document_id);
CREATE INDEX idx_extracted_data_field ON extracted_data(field_name);
CREATE INDEX idx_extracted_data_confidence ON extracted_data(confidence) WHERE confidence < 0.7;

-- ============================================================================
-- VERSION DIFFS
-- ============================================================================

CREATE TABLE document_diffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  old_document_id UUID REFERENCES documents(id),
  new_document_id UUID REFERENCES documents(id),
  old_version TEXT,
  new_version TEXT,
  changes JSONB NOT NULL, -- array of Change objects
  summary TEXT,
  affected_roles TEXT[],
  confidence DECIMAL(5,4),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diffs_project ON document_diffs(project_id);
CREATE INDEX idx_diffs_new_doc ON document_diffs(new_document_id);

-- ============================================================================
-- EVENTS (Audit Trail)
-- ============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  document_id UUID REFERENCES documents(id),
  user_id UUID REFERENCES users(id),
  data JSONB,
  affected_roles TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_project ON events(project_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_roles ON events USING GIN(affected_roles);

-- ============================================================================
-- SCHEDULE OF VALUES
-- ============================================================================

CREATE TABLE schedule_of_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  scheduled_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  from_previous DECIMAL(12,2) DEFAULT 0,
  this_period DECIMAL(12,2) DEFAULT 0,
  materials_stored DECIMAL(12,2) DEFAULT 0,
  total_completed DECIMAL(12,2) GENERATED ALWAYS AS (from_previous + this_period + materials_stored) STORED,
  percent_complete DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN scheduled_value > 0
    THEN ROUND((from_previous + this_period + materials_stored) / scheduled_value * 100, 2)
    ELSE 0 END
  ) STORED,
  balance_to_finish DECIMAL(12,2) GENERATED ALWAYS AS (
    scheduled_value - (from_previous + this_period + materials_stored)
  ) STORED,
  retainage DECIMAL(12,2) DEFAULT 0,
  source_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, line_number)
);

CREATE INDEX idx_sov_project ON schedule_of_values(project_id);

-- ============================================================================
-- CHANGE ORDERS
-- ============================================================================

CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  co_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  reason TEXT CHECK (reason IN (
    'owner_request', 'design_change', 'unforeseen_condition',
    'code_compliance', 'value_engineering'
  )),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  schedule_impact_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, co_number)
);

CREATE INDEX idx_co_project ON change_orders(project_id);
CREATE INDEX idx_co_status ON change_orders(status);

-- ============================================================================
-- PAY APPLICATIONS
-- ============================================================================

CREATE TABLE pay_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  application_number INTEGER NOT NULL,
  period_to DATE NOT NULL,
  original_contract_sum DECIMAL(12,2) NOT NULL,
  net_change_orders DECIMAL(12,2) DEFAULT 0,
  contract_sum_to_date DECIMAL(12,2) GENERATED ALWAYS AS (original_contract_sum + net_change_orders) STORED,
  total_completed_stored DECIMAL(12,2) DEFAULT 0,
  retainage DECIMAL(12,2) DEFAULT 0,
  total_earned_less_retainage DECIMAL(12,2) GENERATED ALWAYS AS (total_completed_stored - retainage) STORED,
  previous_certified_payment DECIMAL(12,2) DEFAULT 0,
  current_payment_due DECIMAL(12,2) GENERATED ALWAYS AS (
    total_completed_stored - retainage - previous_certified_payment
  ) STORED,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, application_number)
);

CREATE INDEX idx_payapp_project ON pay_applications(project_id);
CREATE INDEX idx_payapp_status ON pay_applications(status);

-- ============================================================================
-- SUBMITTALS
-- ============================================================================

CREATE TABLE submittals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  submittal_number TEXT NOT NULL,
  spec_section TEXT,
  description TEXT NOT NULL,
  manufacturer TEXT,
  product TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected'
  )),
  submitted_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, submittal_number)
);

CREATE INDEX idx_submittals_project ON submittals(project_id);
CREATE INDEX idx_submittals_status ON submittals(status);

-- ============================================================================
-- DAILY LOGS
-- ============================================================================

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weather TEXT,
  temperature_high INTEGER,
  temperature_low INTEGER,
  crew_count INTEGER DEFAULT 0,
  work_performed TEXT,
  materials_received JSONB, -- array of materials
  visitors JSONB, -- array of visitor entries
  safety_incidents JSONB, -- array of incidents
  delays JSONB, -- array of delay entries
  photos JSONB, -- array of photo URLs
  submitted_by UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, log_date)
);

CREATE INDEX idx_dailylogs_project ON daily_logs(project_id);
CREATE INDEX idx_dailylogs_date ON daily_logs(log_date DESC);

-- ============================================================================
-- DOCUMENT REQUIREMENTS (What's needed for each workflow)
-- ============================================================================

CREATE TABLE document_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL,
  required_for TEXT[] NOT NULL, -- workflow steps
  blocked_roles TEXT[] NOT NULL,
  alert_level TEXT DEFAULT 'warning' CHECK (alert_level IN ('critical', 'warning', 'info')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed document requirements
INSERT INTO document_requirements (document_type, required_for, blocked_roles, alert_level, description) VALUES
('bond', ARRAY['pay_app_1', 'contract_execution'], ARRAY['accounts'], 'critical', 'Bond required before first pay application'),
('insurance', ARRAY['mobilization', 'site_access'], ARRAY['superintendent', 'foreman'], 'critical', 'Insurance certificate required for site access'),
('assembly_letter', ARRAY['submittal_package', 'procurement'], ARRAY['pm'], 'warning', 'Assembly letter needed for warranty'),
('scope', ARRAY['estimating', 'detailing'], ARRAY['estimator', 'detailer'], 'warning', 'Scope document needed for takeoff');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update project contract sum when COs are approved
CREATE OR REPLACE FUNCTION update_project_contract_sum()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE projects
    SET contract_sum = original_contract_sum + (
      SELECT COALESCE(SUM(amount), 0)
      FROM change_orders
      WHERE project_id = NEW.project_id AND status = 'approved'
    ),
    updated_at = NOW()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_co_approved
AFTER INSERT OR UPDATE ON change_orders
FOR EACH ROW EXECUTE FUNCTION update_project_contract_sum();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_projects_updated
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sov_updated
BEFORE UPDATE ON schedule_of_values
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_co_updated
BEFORE UPDATE ON change_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
