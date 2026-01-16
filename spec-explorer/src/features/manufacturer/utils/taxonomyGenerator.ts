/**
 * Manufacturer Taxonomy Generator
 * Creates LDS.json compliant taxonomy files for any construction product
 * Outputs ready-to-use AI commands and exportable data formats
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  TaxonomyLayer,
  DNASequence,
  DNASequenceData,
  TaxonomyFile,
  TaxonomySource,
  ProductCategory,
  ExportFormat,
} from '@/types';

// 20-Layer Taxonomy Key Template
export const TAXONOMY_LAYERS: Record<TaxonomyLayer, { name: string; description: string; format: string }> = {
  GEO: { name: 'Geographic Region', description: 'EU, NA, AS, ME, AF, OC', format: '^[A-Z]{2}$' },
  IND: { name: 'Industry Sector', description: 'AEC, MFG, ENE, TRN', format: '^[A-Z]{3}$' },
  CLS: { name: 'Uniclass Code', description: '2-digit classification', format: '^[0-9]{2}$' },
  CDE: { name: 'Product Code', description: '6-digit CPV/HS code', format: '^[0-9]{6}$' },
  MFG: { name: 'Manufacturer ID', description: '3-letter code', format: '^[A-Z]{3}$' },
  DIV: { name: 'Division/Brand', description: '2-3 letter code', format: '^[A-Z]{2,3}$' },
  FAM: { name: 'Product Family', description: '2-3 letter code', format: '^[A-Z]{2,3}$' },
  SYS: { name: 'System/Series', description: '3-digit identifier', format: '^[0-9]{3}$' },
  MAT: { name: 'Material Type', description: 'SW, MW, GF, CF, etc', format: '^[A-Z]{2}$' },
  SUB: { name: 'Substrate', description: 'STL, CON, WOD, etc', format: '^[A-Z]{3}$' },
  ELE: { name: 'Element Type', description: 'GEN, BEM, COL, etc', format: '^[A-Z]{3}$' },
  PRF: { name: 'Profile', description: 'I, H, C, L, O, R, etc', format: '^[A-Z]$' },
  EXP: { name: 'Exposure', description: '3S, 4S (3 or 4 sided)', format: '^[34]S$' },
  FIX: { name: 'Fixing Method', description: 'SCR, PIN, ADH, MEC', format: '^[A-Z]{3}$' },
  CRT: { name: 'Certification', description: 'EN13381, ASTM, etc', format: '^[A-Z0-9]+$' },
  RAT: { name: 'Rating', description: 'R30, R60, etc', format: '^R[0-9]+$' },
  TMP: { name: 'Temperature', description: '###C format', format: '^[0-9]{3}C$' },
  THK: { name: 'Thickness', description: '### in mm', format: '^[0-9]{3}$' },
  ACC: { name: 'Accessory', description: 'SCR, PIN, NON', format: '^[A-Z]{3}$' },
  SRC: { name: 'Source Ref', description: 'PG## format', format: '^PG[0-9]{2}$' },
};

export interface ManufacturerConfig {
  name: string;
  code: string;           // 3-letter MFG code
  division?: string;      // DIV code
  family?: string;        // FAM code
  region?: string;        // GEO code (default: EU)
  industry?: string;      // IND code (default: AEC)
  uniclass?: string;      // CLS code
  productCode?: string;   // CDE code
}

export interface ProductConfig {
  system: string;
  systemCode: string;     // 3-digit SYS code
  material: string;       // MAT code
  category: ProductCategory;
  certification?: string;
  sourceDocument?: string;
}

export interface VariantConfig {
  substrates: string[];        // SUB codes
  elements: string[];          // ELE codes
  profiles: string[];          // PRF codes
  exposures: string[];         // EXP codes
  fixings: string[];           // FIX codes
  ratings: string[];           // RAT values
  temperatures: number[];      // TMP values (in C)
  thicknesses: number[];       // THK values (in mm)
  accessories: string[];       // ACC codes
  dataMatrix?: Record<string, Record<string, number>>; // rating -> temp -> max_section_factor
  sourcePages?: Record<string, string>; // rating -> page number
}

/**
 * Generate a complete DNA sequence ID
 */
function generateDNAId(
  manufacturer: ManufacturerConfig,
  product: ProductConfig,
  variant: {
    substrate: string;
    element: string;
    profile: string;
    exposure: string;
    fixing: string;
    rating: string;
    temperature: number;
    thickness: number;
    accessory: string;
    sourcePage: string;
  }
): string {
  const parts = [
    manufacturer.region || 'EU',
    manufacturer.industry || 'AEC',
    manufacturer.uniclass || '23',
    manufacturer.productCode || '078100',
    manufacturer.code,
    manufacturer.division || manufacturer.code.slice(0, 2),
    manufacturer.family || product.system.slice(0, 2).toUpperCase(),
    product.systemCode,
    product.material,
    variant.substrate,
    variant.element,
    variant.profile,
    variant.exposure,
    variant.fixing,
    product.certification || 'EN13381',
    variant.rating,
    `${variant.temperature}C`,
    String(variant.thickness).padStart(3, '0'),
    variant.accessory,
    variant.sourcePage,
  ];

  return parts.join('-');
}

/**
 * Generate all DNA sequences for a product based on variant combinations
 */
export function generateTaxonomySequences(
  manufacturer: ManufacturerConfig,
  product: ProductConfig,
  variants: VariantConfig
): DNASequence[] {
  const sequences: DNASequence[] = [];

  for (const substrate of variants.substrates) {
    for (const element of variants.elements) {
      for (const profile of variants.profiles) {
        for (const exposure of variants.exposures) {
          for (const fixing of variants.fixings) {
            for (const rating of variants.ratings) {
              for (const temperature of variants.temperatures) {
                for (const thickness of variants.thicknesses) {
                  // Get max section factor from data matrix if available
                  const maxSectionFactor = variants.dataMatrix?.[rating]?.[String(temperature)] || 0;

                  // Skip invalid combinations (no data)
                  if (variants.dataMatrix && maxSectionFactor === 0) continue;

                  const accessory = variants.accessories[0] || 'NON';
                  const sourcePage = variants.sourcePages?.[rating] || 'PG00';

                  const id = generateDNAId(manufacturer, product, {
                    substrate,
                    element,
                    profile,
                    exposure,
                    fixing,
                    rating,
                    temperature,
                    thickness,
                    accessory,
                    sourcePage,
                  });

                  const data: DNASequenceData = {
                    rating,
                    crit_temp_C: temperature,
                    thickness_mm: thickness,
                    max_section_factor: maxSectionFactor,
                    exposure: exposure as '3S' | '4S',
                    fixing,
                  };

                  sequences.push({
                    id,
                    data,
                    meta: {
                      manufacturer: manufacturer.name,
                      product_name: product.system,
                      system: product.systemCode,
                      compliance: product.certification,
                      source_page: sourcePage,
                    },
                    created_at: new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return sequences;
}

/**
 * Generate a complete taxonomy file
 */
export function generateTaxonomyFile(
  manufacturer: ManufacturerConfig,
  product: ProductConfig,
  variants: VariantConfig
): TaxonomyFile {
  const sequences = generateTaxonomySequences(manufacturer, product, variants);

  // Generate summary statistics
  const ratingCounts: Record<string, number> = {};
  const thicknessCounts: Record<string, number> = {};
  const tempCounts: Record<string, number> = {};

  for (const seq of sequences) {
    const rating = seq.data.rating || 'unknown';
    const thickness = String(seq.data.thickness_mm);
    const temp = String(seq.data.crit_temp_C);

    ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    thicknessCounts[thickness] = (thicknessCounts[thickness] || 0) + 1;
    tempCounts[temp] = (tempCounts[temp] || 0) + 1;
  }

  return {
    batch_id: `${manufacturer.code}-${product.systemCode}-${Date.now()}`,
    taxonomy_depth: 20,
    version: '1.0.0',
    meta: {
      system: `${manufacturer.name} ${product.system}`,
      compliance: product.certification,
      source_document: product.sourceDocument,
      total_sequences: sequences.length,
    },
    dna_sequences: sequences,
    summary: {
      total_dna_sequences: sequences.length,
      ratings: ratingCounts,
      thicknesses: thicknessCounts,
      temperatures: tempCounts,
    },
  };
}

/**
 * Generate an AI command template for creating a new manufacturer taxonomy
 * This is the .lds.json command the user can give to AI
 */
export function generateAICommandTemplate(
  manufacturer: Partial<ManufacturerConfig>,
  product: Partial<ProductConfig>,
  category: ProductCategory
): string {
  const template = `
════════════════════════════════════════════════════════════════════════════════
L0 AUTHORITATIVE COMMAND: ${manufacturer.name?.toUpperCase() || '[MANUFACTURER]'} TAXONOMY BUILD
════════════════════════════════════════════════════════════════════════════════
MODE: FULL EXTRACTION | 20-LAYER DNA TAXONOMY | LDS.JSON OUTPUT
PRODUCT CATEGORY: ${category.toUpperCase().replace('_', ' ')}
════════════════════════════════════════════════════════════════════════════════

MANUFACTURER CONFIGURATION:
{
  "name": "${manufacturer.name || '[Full Manufacturer Name]'}",
  "code": "${manufacturer.code || '[3-LETTER CODE]'}",
  "division": "${manufacturer.division || '[DIVISION CODE]'}",
  "family": "${manufacturer.family || '[FAMILY CODE]'}",
  "region": "${manufacturer.region || 'EU'}",
  "industry": "${manufacturer.industry || 'AEC'}",
  "uniclass": "${manufacturer.uniclass || '23'}",
  "productCode": "${manufacturer.productCode || '000000'}"
}

PRODUCT CONFIGURATION:
{
  "system": "${product.system || '[Product System Name]'}",
  "systemCode": "${product.systemCode || '000'}",
  "material": "${product.material || '[MAT CODE]'}",
  "category": "${category}",
  "certification": "${product.certification || '[CERTIFICATION STANDARD]'}",
  "sourceDocument": "${product.sourceDocument || '[Source Document Name]'}"
}

════════════════════════════════════════════════════════════════════════════════
20-LAYER DNA TAXONOMY KEY:
════════════════════════════════════════════════════════════════════════════════
${Object.entries(TAXONOMY_LAYERS)
  .map(([key, val], i) => `L${String(i + 1).padStart(2, '0')} ${key}: ${val.name} (${val.description})`)
  .join('\n')}

════════════════════════════════════════════════════════════════════════════════
VARIANT EXTRACTION REQUIREMENTS:
════════════════════════════════════════════════════════════════════════════════

Extract all permutations of:
- SUBSTRATES: [List all substrate types, e.g., STL, CON, WOD]
- ELEMENTS: [List element types, e.g., GEN, BEM, COL]
- PROFILES: [List profile shapes, e.g., I, H, C, L]
- EXPOSURES: [3S, 4S]
- FIXINGS: [List fixing methods, e.g., SCR, PIN, MEC]
- RATINGS: [List all ratings, e.g., R30, R45, R60, R90, R120, R180]
- TEMPERATURES: [List critical temps in °C]
- THICKNESSES: [List thicknesses in mm]

════════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (LDS.JSON):
════════════════════════════════════════════════════════════════════════════════

{
  "batch_id": "${manufacturer.code || 'MFG'}-${product.systemCode || '000'}-COMPLETE",
  "taxonomy_depth": 20,
  "version": "1.0.0",
  "meta": {
    "system": "${manufacturer.name || 'Manufacturer'} ${product.system || 'Product'}",
    "compliance": "${product.certification || 'Certification'}",
    "source_document": "${product.sourceDocument || 'Source'}"
  },
  "dna_sequences": [
    {
      "id": "[20-LAYER-DNA-ID]",
      "data": {
        "rating": "[RATING]",
        "crit_temp_C": [TEMP],
        "thickness_mm": [THICKNESS],
        "max_section_factor": [VALUE],
        "exposure": "[3S|4S]",
        "fixing": "[FIXING]"
      },
      "meta": {
        "manufacturer": "${manufacturer.name || 'Manufacturer'}",
        "product_name": "${product.system || 'Product'}",
        "source_page": "[PAGE REF]"
      }
    }
  ],
  "summary": {
    "total_dna_sequences": [COUNT],
    "ratings": { "[RATING]": [COUNT] },
    "thicknesses": { "[THICKNESS]": [COUNT] }
  }
}

════════════════════════════════════════════════════════════════════════════════
EXECUTION: Extract ALL data points. Generate COMPLETE DNA sequences.
OUTPUT: Single JSON file with full taxonomy.
════════════════════════════════════════════════════════════════════════════════
`;

  return template.trim();
}

/**
 * Export taxonomy to various formats
 */
export function exportTaxonomy(
  taxonomy: TaxonomyFile,
  format: ExportFormat
): string | Blob {
  switch (format) {
    case 'json':
    case 'lds.json':
      return JSON.stringify(taxonomy, null, 2);

    case 'csv':
      return convertToCSV(taxonomy.dna_sequences);

    default:
      return JSON.stringify(taxonomy, null, 2);
  }
}

function convertToCSV(sequences: DNASequence[]): string {
  const headers = [
    'DNA_ID',
    'Rating',
    'Critical_Temp_C',
    'Thickness_mm',
    'Max_Section_Factor',
    'Exposure',
    'Fixing',
    'Manufacturer',
    'Product',
    'Source_Page',
  ];

  const rows = sequences.map((seq) => [
    seq.id,
    seq.data.rating || '',
    seq.data.crit_temp_C || '',
    seq.data.thickness_mm || '',
    seq.data.max_section_factor || '',
    seq.data.exposure || '',
    seq.data.fixing || '',
    seq.meta?.manufacturer || '',
    seq.meta?.product_name || '',
    seq.meta?.source_page || '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

/**
 * Create a TaxonomySource record for database storage
 */
export function createTaxonomySource(
  tenantId: string,
  manufacturer: ManufacturerConfig,
  product: ProductConfig,
  sequenceCount: number
): TaxonomySource {
  return {
    id: uuidv4(),
    tenant_id: tenantId,
    name: `${manufacturer.name} ${product.system}`,
    manufacturer: manufacturer.name,
    version: '1.0.0',
    product_category: product.category,
    meta: {
      system: product.system,
      compliance: product.certification,
      source_document: product.sourceDocument,
      total_sequences: sequenceCount,
      batch_id: `${manufacturer.code}-${product.systemCode}`,
    },
    created_at: new Date().toISOString(),
  };
}

// Pre-configured templates for common product categories
export const PRODUCT_CATEGORY_TEMPLATES: Record<ProductCategory, Partial<VariantConfig>> = {
  fire_protection: {
    ratings: ['R30', 'R45', 'R60', 'R90', 'R120', 'R180'],
    temperatures: [450, 500, 550, 600, 650, 700],
    exposures: ['3S', '4S'],
    fixings: ['SCR', 'PIN', 'MEC'],
  },
  insulation: {
    thicknesses: [20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200],
  },
  structural: {
    profiles: ['I', 'H', 'C', 'L', 'T', 'O', 'R'],
    elements: ['BEM', 'COL', 'GIR', 'TRS'],
  },
  cladding: {
    exposures: ['EXT', 'INT'],
    fixings: ['MEC', 'ADH', 'CLI'],
  },
  roofing: {
    elements: ['FLT', 'PIT', 'CRV'],
    fixings: ['MEC', 'ADH', 'BAL'],
  },
  flooring: {
    elements: ['SLB', 'DEC', 'RSD'],
    substrates: ['CON', 'STL', 'WOD', 'COM'],
  },
  glazing: {
    elements: ['WIN', 'CWT', 'SKY', 'ATR'],
    ratings: ['E30', 'E60', 'E90', 'EI30', 'EI60', 'EI90'],
  },
  doors_windows: {
    elements: ['SDR', 'DDR', 'SLD', 'RVL'],
    ratings: ['E30', 'E60', 'E90', 'EI30', 'EI60'],
  },
  hvac: {
    elements: ['DUC', 'DAM', 'DIF', 'GRI'],
  },
  plumbing: {
    elements: ['PIP', 'FIT', 'VLV', 'FIX'],
    substrates: ['COP', 'PVC', 'STL', 'PEX'],
  },
  electrical: {
    elements: ['CAB', 'TRY', 'CON', 'SWT'],
  },
  finishes: {
    elements: ['PNT', 'CLG', 'WLL', 'FLR'],
  },
  other: {},
};
