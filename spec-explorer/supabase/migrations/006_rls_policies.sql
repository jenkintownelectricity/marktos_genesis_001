-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = ANY(required_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Tenants policies
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

CREATE POLICY "Owners and admins can update tenant"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id() AND user_has_role(ARRAY['owner', 'admin']));

-- Users policies
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Owners and admins can manage users"
  ON users FOR ALL
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin'])
  );

-- Taxonomy sources policies
CREATE POLICY "Users can view taxonomy sources in their tenant"
  ON taxonomy_sources FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Editors and above can create taxonomy sources"
  ON taxonomy_sources FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "Editors and above can update taxonomy sources"
  ON taxonomy_sources FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "Admins and above can delete taxonomy sources"
  ON taxonomy_sources FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin'])
  );

-- DNA sequences policies
CREATE POLICY "Users can view DNA sequences in their tenant"
  ON dna_sequences FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Editors and above can manage DNA sequences"
  ON dna_sequences FOR ALL
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin', 'editor'])
  );

-- Projects policies
CREATE POLICY "Users can view projects in their tenant"
  ON projects FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Editors and above can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "Editors and above can update projects"
  ON projects FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "Admins and above can delete projects"
  ON projects FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin'])
  );

-- Project items policies
CREATE POLICY "Users can view project items in their tenant's projects"
  ON project_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_items.project_id
      AND projects.tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Editors and above can manage project items"
  ON project_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_items.project_id
      AND projects.tenant_id = get_user_tenant_id()
    )
    AND user_has_role(ARRAY['owner', 'admin', 'editor'])
  );

-- Audit logs policies
CREATE POLICY "Users with audit_view permission can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role(ARRAY['owner', 'admin'])
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());
