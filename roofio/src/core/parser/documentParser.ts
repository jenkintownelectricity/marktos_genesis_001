/**
 * ROOFIO AI Document Parser
 * Extracts structured data from construction documents
 */

import type { Document, DocumentType, ExtractedData } from '../types';

// ============================================================================
// EXTRACTION SCHEMAS - What to extract from each document type
// ============================================================================

export const EXTRACTION_SCHEMAS: Record<DocumentType, ExtractionSchema> = {
  contract: {
    fields: [
      { name: 'contract_sum', type: 'currency', required: true },
      { name: 'owner_name', type: 'string', required: true },
      { name: 'project_address', type: 'address', required: true },
      { name: 'contract_date', type: 'date', required: true },
      { name: 'substantial_completion', type: 'date', required: false },
      { name: 'final_completion', type: 'date', required: false },
      { name: 'retainage_percent', type: 'percentage', required: false },
      { name: 'liquidated_damages', type: 'currency', required: false },
    ],
    feedsRoles: ['estimator', 'pm', 'accounts', 'owner'],
  },

  scope: {
    fields: [
      { name: 'total_square_footage', type: 'number', required: true },
      { name: 'roof_type', type: 'enum', values: ['TPO', 'EPDM', 'PVC', 'BUR', 'Mod Bit', 'Metal'], required: true },
      { name: 'insulation_type', type: 'string', required: false },
      { name: 'insulation_r_value', type: 'string', required: false },
      { name: 'warranty_years', type: 'number', required: false },
      { name: 'warranty_type', type: 'enum', values: ['NDL', 'Material Only', 'Labor & Material'], required: false },
      { name: 'alternates', type: 'array', required: false },
      { name: 'exclusions', type: 'array', required: false },
      { name: 'allowances', type: 'array', required: false },
    ],
    feedsRoles: ['estimator', 'pm', 'detailer', 'superintendent', 'qc'],
  },

  drawing: {
    fields: [
      { name: 'drawing_number', type: 'string', required: true },
      { name: 'sheet_title', type: 'string', required: true },
      { name: 'revision', type: 'string', required: false },
      { name: 'scale', type: 'string', required: false },
      { name: 'building_dimensions', type: 'dimensions', required: false },
      { name: 'roof_areas', type: 'array', required: false },
      { name: 'penetrations', type: 'array', required: false },
      { name: 'drains', type: 'number', required: false },
      { name: 'curbs', type: 'number', required: false },
      { name: 'slope', type: 'string', required: false },
    ],
    feedsRoles: ['estimator', 'detailer', 'superintendent', 'qc'],
  },

  specification: {
    fields: [
      { name: 'section_number', type: 'string', required: true },
      { name: 'section_title', type: 'string', required: true },
      { name: 'manufacturer', type: 'string', required: false },
      { name: 'product_name', type: 'string', required: false },
      { name: 'installation_method', type: 'string', required: false },
      { name: 'quality_standards', type: 'array', required: false },
      { name: 'submittals_required', type: 'array', required: false },
      { name: 'warranty_requirements', type: 'string', required: false },
    ],
    feedsRoles: ['qc', 'safety', 'detailer', 'pm'],
  },

  assembly_letter: {
    fields: [
      { name: 'manufacturer', type: 'string', required: true },
      { name: 'system_name', type: 'string', required: true },
      { name: 'warranty_number', type: 'string', required: false },
      { name: 'components', type: 'array', required: true },
      { name: 'installation_sequence', type: 'array', required: false },
      { name: 'warranty_conditions', type: 'array', required: false },
      { name: 'approved_contractors', type: 'array', required: false },
    ],
    feedsRoles: ['pm', 'superintendent', 'qc', 'detailer'],
  },

  submittal: {
    fields: [
      { name: 'submittal_number', type: 'string', required: true },
      { name: 'spec_section', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'manufacturer', type: 'string', required: false },
      { name: 'product', type: 'string', required: false },
      { name: 'status', type: 'enum', values: ['Pending', 'Approved', 'Approved as Noted', 'Revise & Resubmit', 'Rejected'], required: false },
      { name: 'reviewed_by', type: 'string', required: false },
      { name: 'review_date', type: 'date', required: false },
    ],
    feedsRoles: ['pm', 'detailer', 'qc'],
  },

  change_order: {
    fields: [
      { name: 'co_number', type: 'number', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'reason', type: 'string', required: false },
      { name: 'amount', type: 'currency', required: true },
      { name: 'schedule_impact_days', type: 'number', required: false },
      { name: 'status', type: 'enum', values: ['Pending', 'Approved', 'Rejected'], required: false },
    ],
    feedsRoles: ['estimator', 'pm', 'accounts', 'superintendent', 'owner'],
  },

  daily_log: {
    fields: [
      { name: 'date', type: 'date', required: true },
      { name: 'weather', type: 'string', required: true },
      { name: 'temperature_high', type: 'number', required: false },
      { name: 'temperature_low', type: 'number', required: false },
      { name: 'crew_count', type: 'number', required: true },
      { name: 'work_performed', type: 'string', required: true },
      { name: 'materials_received', type: 'array', required: false },
      { name: 'visitors', type: 'array', required: false },
      { name: 'safety_incidents', type: 'array', required: false },
      { name: 'delays', type: 'array', required: false },
    ],
    feedsRoles: ['superintendent', 'foreman', 'safety', 'pm', 'hr'],
  },

  pay_application: {
    fields: [
      { name: 'application_number', type: 'number', required: true },
      { name: 'period_to', type: 'date', required: true },
      { name: 'original_contract_sum', type: 'currency', required: true },
      { name: 'net_change_orders', type: 'currency', required: true },
      { name: 'contract_sum_to_date', type: 'currency', required: true },
      { name: 'total_completed_stored', type: 'currency', required: true },
      { name: 'retainage', type: 'currency', required: true },
      { name: 'current_payment_due', type: 'currency', required: true },
    ],
    feedsRoles: ['accounts', 'pm', 'owner'],
  },

  bond: {
    fields: [
      { name: 'bond_type', type: 'enum', values: ['Performance', 'Payment', 'Bid'], required: true },
      { name: 'bond_amount', type: 'currency', required: true },
      { name: 'surety_company', type: 'string', required: true },
      { name: 'bond_number', type: 'string', required: true },
      { name: 'effective_date', type: 'date', required: true },
    ],
    feedsRoles: ['accounts', 'pm'],
  },

  insurance: {
    fields: [
      { name: 'policy_type', type: 'string', required: true },
      { name: 'carrier', type: 'string', required: true },
      { name: 'policy_number', type: 'string', required: true },
      { name: 'coverage_amount', type: 'currency', required: true },
      { name: 'expiration_date', type: 'date', required: true },
      { name: 'additional_insured', type: 'array', required: false },
    ],
    feedsRoles: ['accounts', 'pm', 'safety'],
  },

  msds: {
    fields: [
      { name: 'product_name', type: 'string', required: true },
      { name: 'manufacturer', type: 'string', required: true },
      { name: 'hazard_classification', type: 'string', required: true },
      { name: 'ppe_required', type: 'array', required: false },
      { name: 'first_aid', type: 'string', required: false },
      { name: 'storage_requirements', type: 'string', required: false },
    ],
    feedsRoles: ['safety', 'superintendent', 'foreman'],
  },

  warranty: {
    fields: [
      { name: 'warranty_number', type: 'string', required: true },
      { name: 'manufacturer', type: 'string', required: true },
      { name: 'warranty_type', type: 'string', required: true },
      { name: 'term_years', type: 'number', required: true },
      { name: 'start_date', type: 'date', required: true },
      { name: 'end_date', type: 'date', required: true },
      { name: 'coverage', type: 'string', required: false },
      { name: 'exclusions', type: 'array', required: false },
    ],
    feedsRoles: ['warranty', 'pm', 'owner'],
  },

  closeout: {
    fields: [
      { name: 'document_type', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'received', type: 'boolean', required: true },
      { name: 'received_date', type: 'date', required: false },
    ],
    feedsRoles: ['pm', 'accounts', 'owner'],
  },
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExtractionSchema {
  fields: ExtractionField[];
  feedsRoles: string[];
}

export interface ExtractionField {
  name: string;
  type: FieldType;
  required: boolean;
  values?: string[];
}

export type FieldType =
  | 'string'
  | 'number'
  | 'currency'
  | 'date'
  | 'percentage'
  | 'boolean'
  | 'array'
  | 'address'
  | 'dimensions'
  | 'enum';

export interface ParseResult {
  documentId: string;
  success: boolean;
  extractedData: ExtractedData[];
  overallConfidence: number;
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface ParseError {
  field: string;
  message: string;
}

export interface ParseWarning {
  field: string;
  message: string;
  confidence: number;
}

// ============================================================================
// PARSER CLASS
// ============================================================================

export class DocumentParser {
  private aiProvider: 'claude' | 'groq' | 'openai' = 'claude';

  constructor(provider?: 'claude' | 'groq' | 'openai') {
    if (provider) this.aiProvider = provider;
  }

  /**
   * Parse a document and extract structured data
   */
  async parse(document: Document, fileContent: string | Buffer): Promise<ParseResult> {
    const schema = EXTRACTION_SCHEMAS[document.type];
    if (!schema) {
      return {
        documentId: document.id,
        success: false,
        extractedData: [],
        overallConfidence: 0,
        errors: [{ field: '', message: `No extraction schema for document type: ${document.type}` }],
        warnings: [],
      };
    }

    // Build extraction prompt
    const prompt = this.buildExtractionPrompt(document.type, schema, fileContent);

    // Call AI for extraction
    const aiResponse = await this.callAI(prompt);

    // Parse AI response
    const extractedData = this.parseAIResponse(aiResponse, schema, document.id);

    // Calculate overall confidence
    const overallConfidence = this.calculateConfidence(extractedData);

    return {
      documentId: document.id,
      success: true,
      extractedData,
      overallConfidence,
      errors: [],
      warnings: this.generateWarnings(extractedData, schema),
    };
  }

  private buildExtractionPrompt(
    docType: DocumentType,
    schema: ExtractionSchema,
    content: string | Buffer
  ): string {
    const fieldList = schema.fields
      .map((f) => `- ${f.name} (${f.type}${f.required ? ', REQUIRED' : ''})`)
      .join('\n');

    return `
You are a construction document parser. Extract the following fields from this ${docType} document.

FIELDS TO EXTRACT:
${fieldList}

DOCUMENT CONTENT:
${typeof content === 'string' ? content : '[Binary content - use OCR]'}

OUTPUT FORMAT (JSON):
{
  "fields": [
    {"name": "field_name", "value": "extracted_value", "confidence": 0.95, "source_page": 1}
  ]
}

Extract all fields. If a field is not found, set value to null and confidence to 0.
Be precise with numbers, dates, and currency values.
`;
  }

  private async callAI(prompt: string): Promise<string> {
    // Placeholder - implement actual AI API call
    // This would call Claude, Groq, or OpenAI based on this.aiProvider
    console.log(`[${this.aiProvider}] Parsing document...`);
    return '{"fields": []}';
  }

  private parseAIResponse(
    response: string,
    schema: ExtractionSchema,
    documentId: string
  ): ExtractedData[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.fields.map((f: any, index: number) => ({
        id: `${documentId}-field-${index}`,
        documentId,
        fieldName: f.name,
        fieldValue: f.value,
        confidence: f.confidence || 0.5,
        sourcePage: f.source_page,
        sourceLocation: f.source_location,
      }));
    } catch {
      return [];
    }
  }

  private calculateConfidence(data: ExtractedData[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + d.confidence, 0);
    return sum / data.length;
  }

  private generateWarnings(data: ExtractedData[], schema: ExtractionSchema): ParseWarning[] {
    const warnings: ParseWarning[] = [];

    // Check for low confidence fields
    for (const d of data) {
      if (d.confidence < 0.7) {
        warnings.push({
          field: d.fieldName,
          message: `Low confidence extraction (${(d.confidence * 100).toFixed(0)}%)`,
          confidence: d.confidence,
        });
      }
    }

    // Check for missing required fields
    for (const field of schema.fields) {
      if (field.required) {
        const found = data.find((d) => d.fieldName === field.name && d.fieldValue !== null);
        if (!found) {
          warnings.push({
            field: field.name,
            message: 'Required field not found',
            confidence: 0,
          });
        }
      }
    }

    return warnings;
  }
}

export const documentParser = new DocumentParser();
