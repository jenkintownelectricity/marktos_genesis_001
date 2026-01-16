-- ============================================================================
-- ROOFIO DATA CENTRAL - Role-Based Views
-- Each role sees ONLY what they need
-- ============================================================================

-- ============================================================================
-- PROJECT MANAGER VIEW
-- ============================================================================

CREATE OR REPLACE VIEW pm_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,
  p.location,
  p.contract_sum,
  p.original_contract_sum,
  p.status,
  p.start_date,
  p.substantial_completion,

  -- Key Metrics
  (SELECT COUNT(*) FROM submittals s WHERE s.project_id = p.id AND s.status = 'pending') as pending_submittals,
  (SELECT COUNT(*) FROM change_orders co WHERE co.project_id = p.id AND co.status = 'pending') as pending_cos,
  (SELECT COALESCE(SUM(amount), 0) FROM change_orders co WHERE co.project_id = p.id AND co.status = 'approved') as approved_co_total,

  -- Document Status
  (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id AND d.is_current = TRUE) as total_documents,
  (SELECT EXISTS(SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.type = 'scope' AND d.is_current = TRUE)) as has_scope,
  (SELECT EXISTS(SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.type = 'assembly_letter' AND d.is_current = TRUE)) as has_assembly_letter,
  (SELECT EXISTS(SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.type = 'bond' AND d.is_current = TRUE)) as has_bond,

  -- Priority Documents
  (SELECT json_agg(json_build_object(
    'id', d.id,
    'type', d.type,
    'filename', d.filename,
    'version', d.version,
    'uploaded_at', d.created_at
  )) FROM documents d
  WHERE d.project_id = p.id
  AND d.type IN ('scope', 'assembly_letter', 'submittal', 'change_order')
  AND d.is_current = TRUE) as priority_documents,

  -- Recent Events
  (SELECT json_agg(json_build_object(
    'type', e.event_type,
    'data', e.data,
    'created_at', e.created_at
  ) ORDER BY e.created_at DESC)
  FROM (SELECT * FROM events WHERE project_id = p.id AND 'pm' = ANY(affected_roles) ORDER BY created_at DESC LIMIT 10) e) as recent_events

FROM projects p;

-- ============================================================================
-- ACCOUNTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW accounts_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,
  p.contract_sum,
  p.original_contract_sum,
  p.retainage_pct,

  -- Financial Summary
  (SELECT COALESCE(SUM(amount), 0) FROM change_orders co WHERE co.project_id = p.id AND co.status = 'approved') as approved_cos,
  (SELECT COALESCE(SUM(current_payment_due), 0) FROM pay_applications pa WHERE pa.project_id = p.id AND pa.status = 'paid') as total_paid,
  (SELECT COALESCE(SUM(retainage), 0) FROM pay_applications pa WHERE pa.project_id = p.id) as total_retainage,

  -- Billing Status
  (SELECT MAX(application_number) FROM pay_applications pa WHERE pa.project_id = p.id) as last_pay_app,
  (SELECT status FROM pay_applications pa WHERE pa.project_id = p.id ORDER BY application_number DESC LIMIT 1) as last_pay_app_status,

  -- SOV Summary
  (SELECT json_agg(json_build_object(
    'line_number', sov.line_number,
    'description', sov.description,
    'scheduled_value', sov.scheduled_value,
    'total_completed', sov.total_completed,
    'percent_complete', sov.percent_complete,
    'balance_to_finish', sov.balance_to_finish
  ) ORDER BY sov.line_number) FROM schedule_of_values sov WHERE sov.project_id = p.id) as sov_lines,

  -- SOV Totals
  (SELECT COALESCE(SUM(scheduled_value), 0) FROM schedule_of_values sov WHERE sov.project_id = p.id) as sov_total,
  (SELECT COALESCE(SUM(total_completed), 0) FROM schedule_of_values sov WHERE sov.project_id = p.id) as sov_completed,

  -- Blockers
  (SELECT NOT EXISTS(SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.type = 'bond' AND d.is_current = TRUE)) as bond_missing,
  (SELECT NOT EXISTS(SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.type = 'insurance' AND d.is_current = TRUE)) as insurance_missing

FROM projects p;

-- ============================================================================
-- ESTIMATOR VIEW
-- ============================================================================

CREATE OR REPLACE VIEW estimator_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,
  p.contract_sum,
  p.original_contract_sum,

  -- Scope Data (from parsed documents)
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'scope' AND d.is_current = TRUE
   AND ed.field_name = 'total_square_footage' LIMIT 1) as square_footage,

  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'scope' AND d.is_current = TRUE
   AND ed.field_name = 'roof_type' LIMIT 1) as roof_type,

  -- Budget Analysis
  p.contract_sum - p.original_contract_sum as total_co_impact,
  CASE WHEN p.original_contract_sum > 0
       THEN ROUND((p.contract_sum - p.original_contract_sum) / p.original_contract_sum * 100, 2)
       ELSE 0 END as co_percent_change,

  -- Change Orders
  (SELECT json_agg(json_build_object(
    'co_number', co.co_number,
    'description', co.description,
    'amount', co.amount,
    'status', co.status
  ) ORDER BY co.co_number) FROM change_orders co WHERE co.project_id = p.id) as change_orders

FROM projects p;

-- ============================================================================
-- DETAILER VIEW
-- ============================================================================

CREATE OR REPLACE VIEW detailer_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,

  -- Drawing Data
  (SELECT json_agg(json_build_object(
    'id', d.id,
    'filename', d.filename,
    'version', d.version,
    'drawing_number', (SELECT ed.field_value FROM extracted_data ed WHERE ed.document_id = d.id AND ed.field_name = 'drawing_number'),
    'sheet_title', (SELECT ed.field_value FROM extracted_data ed WHERE ed.document_id = d.id AND ed.field_name = 'sheet_title')
  )) FROM documents d
  WHERE d.project_id = p.id AND d.type = 'drawing' AND d.is_current = TRUE) as drawings,

  -- Extracted Dimensions
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type IN ('scope', 'drawing') AND d.is_current = TRUE
   AND ed.field_name = 'total_square_footage' LIMIT 1) as total_sf,

  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'drawing' AND d.is_current = TRUE
   AND ed.field_name = 'penetrations' LIMIT 1) as penetrations,

  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'drawing' AND d.is_current = TRUE
   AND ed.field_name = 'drains' LIMIT 1) as drains,

  -- Version Changes
  (SELECT json_agg(json_build_object(
    'old_version', dd.old_version,
    'new_version', dd.new_version,
    'summary', dd.summary,
    'changes', dd.changes
  ) ORDER BY dd.created_at DESC)
  FROM document_diffs dd
  JOIN documents d ON d.id = dd.new_document_id
  WHERE d.project_id = p.id AND d.type = 'drawing') as version_changes

FROM projects p;

-- ============================================================================
-- SUPERINTENDENT VIEW
-- ============================================================================

CREATE OR REPLACE VIEW superintendent_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,
  p.location,
  p.start_date,
  p.substantial_completion,

  -- Spec Data
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'scope' AND d.is_current = TRUE
   AND ed.field_name = 'roof_type' LIMIT 1) as roof_system,

  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'scope' AND d.is_current = TRUE
   AND ed.field_name = 'insulation_r_value' LIMIT 1) as insulation_spec,

  -- Assembly Requirements
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'assembly_letter' AND d.is_current = TRUE
   AND ed.field_name = 'installation_sequence' LIMIT 1) as install_sequence,

  -- Recent Daily Logs
  (SELECT json_agg(json_build_object(
    'date', dl.log_date,
    'crew_count', dl.crew_count,
    'weather', dl.weather,
    'work_performed', dl.work_performed
  ) ORDER BY dl.log_date DESC)
  FROM (SELECT * FROM daily_logs WHERE project_id = p.id ORDER BY log_date DESC LIMIT 7) dl) as recent_logs,

  -- Approved Submittals
  (SELECT json_agg(json_build_object(
    'submittal_number', s.submittal_number,
    'description', s.description,
    'manufacturer', s.manufacturer,
    'product', s.product
  )) FROM submittals s WHERE s.project_id = p.id AND s.status IN ('approved', 'approved_as_noted')) as approved_submittals

FROM projects p;

-- ============================================================================
-- SAFETY OFFICER VIEW
-- ============================================================================

CREATE OR REPLACE VIEW safety_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,
  p.location,

  -- Material Safety Data
  (SELECT json_agg(json_build_object(
    'product_name', ed.field_value->>'product_name',
    'hazard_classification', ed.field_value->>'hazard_classification',
    'ppe_required', ed.field_value->'ppe_required'
  )) FROM extracted_data ed
  JOIN documents d ON d.id = ed.document_id
  WHERE d.project_id = p.id AND d.type = 'msds' AND d.is_current = TRUE) as msds_data,

  -- Roof System (for fire rating)
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'scope' AND d.is_current = TRUE
   AND ed.field_name = 'roof_type' LIMIT 1) as roof_type,

  -- Safety Incidents from Daily Logs
  (SELECT json_agg(json_build_object(
    'date', dl.log_date,
    'incidents', dl.safety_incidents
  )) FROM daily_logs dl
  WHERE dl.project_id = p.id AND dl.safety_incidents IS NOT NULL AND jsonb_array_length(dl.safety_incidents) > 0) as safety_incidents,

  -- Insurance Status
  (SELECT EXISTS(SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.type = 'insurance' AND d.is_current = TRUE)) as has_insurance

FROM projects p;

-- ============================================================================
-- QC VIEW
-- ============================================================================

CREATE OR REPLACE VIEW qc_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,

  -- Spec Requirements
  (SELECT json_agg(json_build_object(
    'section', ed.field_value->>'section_number',
    'title', ed.field_value->>'section_title',
    'manufacturer', ed.field_value->>'manufacturer',
    'product', ed.field_value->>'product_name',
    'quality_standards', ed.field_value->'quality_standards'
  )) FROM extracted_data ed
  JOIN documents d ON d.id = ed.document_id
  WHERE d.project_id = p.id AND d.type = 'specification' AND d.is_current = TRUE) as spec_requirements,

  -- Assembly Letter Components
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'assembly_letter' AND d.is_current = TRUE
   AND ed.field_name = 'components' LIMIT 1) as required_components,

  -- Submittal Status
  (SELECT json_agg(json_build_object(
    'submittal_number', s.submittal_number,
    'description', s.description,
    'status', s.status,
    'manufacturer', s.manufacturer
  )) FROM submittals s WHERE s.project_id = p.id) as submittals,

  -- Inspection checklist (derived from assembly letter)
  (SELECT ed.field_value FROM extracted_data ed
   JOIN documents d ON d.id = ed.document_id
   WHERE d.project_id = p.id AND d.type = 'assembly_letter' AND d.is_current = TRUE
   AND ed.field_name = 'warranty_conditions' LIMIT 1) as warranty_conditions

FROM projects p;

-- ============================================================================
-- OWNER EXECUTIVE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW owner_project_view AS
SELECT
  p.id,
  p.name,
  p.project_number,
  p.location,
  p.status,
  p.contract_sum,
  p.original_contract_sum,
  p.start_date,
  p.substantial_completion,

  -- Financial Summary
  p.contract_sum - p.original_contract_sum as change_order_total,
  CASE WHEN p.original_contract_sum > 0
       THEN ROUND((p.contract_sum - p.original_contract_sum) / p.original_contract_sum * 100, 2)
       ELSE 0 END as budget_variance_pct,

  -- Billing Summary
  (SELECT COALESCE(SUM(total_completed_stored), 0) FROM pay_applications pa WHERE pa.project_id = p.id) as total_billed,
  (SELECT COALESCE(SUM(current_payment_due), 0) FROM pay_applications pa WHERE pa.project_id = p.id AND pa.status = 'paid') as total_paid,
  p.contract_sum - COALESCE((SELECT SUM(total_completed_stored) FROM pay_applications pa WHERE pa.project_id = p.id), 0) as remaining_value,

  -- Percent Complete
  CASE WHEN p.contract_sum > 0
       THEN ROUND(COALESCE((SELECT SUM(total_completed_stored) FROM pay_applications pa WHERE pa.project_id = p.id), 0) / p.contract_sum * 100, 2)
       ELSE 0 END as percent_complete,

  -- Schedule Status
  CASE
    WHEN p.substantial_completion IS NULL THEN 'Not Set'
    WHEN p.substantial_completion < CURRENT_DATE AND p.status != 'complete' THEN 'Behind Schedule'
    WHEN p.substantial_completion <= CURRENT_DATE + INTERVAL '30 days' THEN 'On Track'
    ELSE 'Ahead'
  END as schedule_status,

  -- Key Dates
  p.substantial_completion - CURRENT_DATE as days_to_completion

FROM projects p;
