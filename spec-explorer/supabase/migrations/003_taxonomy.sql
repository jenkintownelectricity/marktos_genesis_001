-- Create taxonomy_sources table
CREATE TABLE IF NOT EXISTS taxonomy_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  version TEXT DEFAULT '1.0.0',
  product_category TEXT CHECK (product_category IN (
    'fire_protection', 'insulation', 'structural', 'cladding', 'roofing',
    'flooring', 'glazing', 'doors_windows', 'hvac', 'plumbing', 'electrical',
    'finishes', 'other'
  )),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_taxonomy_sources_tenant ON taxonomy_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_sources_manufacturer ON taxonomy_sources(manufacturer);
CREATE INDEX IF NOT EXISTS idx_taxonomy_sources_category ON taxonomy_sources(product_category);

-- Create dna_sequences table
CREATE TABLE IF NOT EXISTS dna_sequences (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES taxonomy_sources(id) ON DELETE CASCADE,
  rating TEXT,
  crit_temp_c INTEGER CHECK (crit_temp_c >= 0 AND crit_temp_c <= 1200),
  thickness_mm INTEGER CHECK (thickness_mm >= 0 AND thickness_mm <= 500),
  max_section_factor INTEGER CHECK (max_section_factor >= 0 AND max_section_factor <= 1000),
  exposure TEXT CHECK (exposure IN ('3S', '4S')),
  fixing TEXT,
  data JSONB DEFAULT '{}',
  searchable_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dna_tenant ON dna_sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dna_source ON dna_sequences(source_id);
CREATE INDEX IF NOT EXISTS idx_dna_rating ON dna_sequences(rating);
CREATE INDEX IF NOT EXISTS idx_dna_temp ON dna_sequences(crit_temp_c);
CREATE INDEX IF NOT EXISTS idx_dna_thickness ON dna_sequences(thickness_mm);
CREATE INDEX IF NOT EXISTS idx_dna_section_factor ON dna_sequences(max_section_factor);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_dna_search ON dna_sequences USING gin(to_tsvector('english', searchable_text));

-- Trigger to update taxonomy_sources.updated_at
CREATE TRIGGER update_taxonomy_sources_updated_at
  BEFORE UPDATE ON taxonomy_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
