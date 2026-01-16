/**
 * 20-Layer DNA Taxonomy Type Definitions
 * Supports construction product specifications across all manufacturers
 */

// The 20 taxonomy layers
export type TaxonomyLayer =
  | 'GEO'  // Geographic Region (EU, NA, AS, etc.)
  | 'IND'  // Industry Sector (AEC, MFG, etc.)
  | 'CLS'  // Uniclass Classification
  | 'CDE'  // Product Code (CPV/HS)
  | 'MFG'  // Manufacturer ID
  | 'DIV'  // Division/Brand
  | 'FAM'  // Product Family
  | 'SYS'  // System/Series
  | 'MAT'  // Material Type
  | 'SUB'  // Substrate/Application
  | 'ELE'  // Element Type
  | 'PRF'  // Profile/Shape
  | 'EXP'  // Exposure Type
  | 'FIX'  // Fixing Method
  | 'CRT'  // Certification Standard
  | 'RAT'  // Fire Rating
  | 'TMP'  // Critical Temperature
  | 'THK'  // Thickness
  | 'ACC'  // Accessory/Attachment
  | 'SRC'; // Source Reference

export interface TaxonomyLayerDefinition {
  code: TaxonomyLayer;
  name: string;
  description: string;
  position: number;
  format: string; // Regex pattern
  examples: string[];
}

export interface DNASequence {
  id: string;  // Full 20-layer DNA ID
  data: DNASequenceData;
  meta?: DNASequenceMeta;
  searchable_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DNASequenceData {
  // Fire protection specific
  rating?: string;          // R30, R45, R60, R90, R120, R180
  crit_temp_C?: number;     // 450, 500, 550, 600, 650, 700
  thickness_mm?: number;    // 20, 25, 30, 40, 50, 60, 70, 80, 90, 100
  max_section_factor?: number;
  exposure?: '3S' | '4S';
  fixing?: string;

  // Generic product data
  [key: string]: unknown;
}

export interface DNASequenceMeta {
  manufacturer?: string;
  product_name?: string;
  system?: string;
  compliance?: string;
  source_page?: string;
  notes?: string;
}

export interface TaxonomySource {
  id: string;
  tenant_id: string;
  name: string;
  manufacturer: string;
  version: string;
  product_category: ProductCategory;
  meta: TaxonomySourceMeta;
  created_at: string;
  updated_at?: string;
}

export interface TaxonomySourceMeta {
  system?: string;
  compliance?: string;
  max_section_factor?: number;
  source_document?: string;
  data_pages?: string;
  total_sequences?: number;
  batch_id?: string;
}

export type ProductCategory =
  | 'fire_protection'
  | 'insulation'
  | 'structural'
  | 'cladding'
  | 'roofing'
  | 'flooring'
  | 'glazing'
  | 'doors_windows'
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'finishes'
  | 'other';

export interface TaxonomyFile {
  batch_id: string;
  taxonomy_depth: number;
  version?: string;
  meta: TaxonomySourceMeta;
  taxonomy_key?: Record<TaxonomyLayer, TaxonomyLayerDefinition>;
  dna_sequences: DNASequence[];
  summary: TaxonomySummary;
}

export interface TaxonomySummary {
  total_dna_sequences: number;
  ratings?: Record<string, number>;
  thicknesses?: Record<string, number>;
  temperatures?: Record<string, number>;
  exposures?: Record<string, number>;
  [key: string]: unknown;
}

// Filter types for the UI
export interface TaxonomyFilters {
  ratings?: string[];
  temperatures?: number[];
  thicknesses?: number[];
  exposures?: string[];
  fixings?: string[];
  manufacturers?: string[];
  search?: string;
}

// Export format options
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf' | 'lds.json';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  selectedIds?: string[];
  filters?: TaxonomyFilters;
  filename?: string;
}
