/**
 * ROOFIO DATA CENTRAL - Core Type Definitions
 * Documents ARE the data. Single source of truth.
 */

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export type RoleId =
  | 'estimator'
  | 'pm'
  | 'detailer'
  | 'superintendent'
  | 'safety'
  | 'qc'
  | 'accounts'
  | 'hr'
  | 'foreman'
  | 'sales'
  | 'marketing'
  | 'warranty'
  | 'owner';

export interface Role {
  id: RoleId;
  name: string;
  priorityDocuments: DocumentType[];
  keyMetrics: string[];
  permissions: Permission[];
}

export type Permission =
  | 'documents.upload'
  | 'documents.approve'
  | 'sov.edit'
  | 'pay_apps.submit'
  | 'pay_apps.approve'
  | 'change_orders.create'
  | 'change_orders.approve'
  | 'daily_logs.submit'
  | 'submittals.approve'
  | 'project.admin';

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export type DocumentType =
  | 'contract'
  | 'scope'
  | 'drawing'
  | 'specification'
  | 'assembly_letter'
  | 'submittal'
  | 'change_order'
  | 'daily_log'
  | 'pay_application'
  | 'bond'
  | 'insurance'
  | 'msds'
  | 'warranty'
  | 'closeout';

export interface Document {
  id: string;
  projectId: string;
  type: DocumentType;
  filename: string;
  version: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  parsedAt?: string;
  parseConfidence?: number;
  isCurrent: boolean;
  extractedData?: ExtractedData[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedData {
  id: string;
  documentId: string;
  fieldName: string;
  fieldValue: unknown;
  confidence: number;
  sourcePage?: number;
  sourceLocation?: string;
  validatedBy?: string;
  validatedAt?: string;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  location?: string;
  ownerId?: string;
  architectId?: string;
  contractSum: number;
  originalContractSum: number;
  retainagePct: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'bidding' | 'awarded' | 'active' | 'complete' | 'warranty' | 'closed';

// ============================================================================
// EVENT TYPES
// ============================================================================

export enum EventType {
  // Document Events
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_PARSED = 'document.parsed',
  DOCUMENT_VERSION_CHANGED = 'document.version_changed',
  DOCUMENT_MISSING = 'document.missing',
  DOCUMENT_APPROVED = 'document.approved',

  // Data Events
  SOV_UPDATED = 'sov.updated',
  CONTRACT_SUM_CHANGED = 'contract_sum.changed',
  CHANGE_ORDER_APPROVED = 'change_order.approved',
  CHANGE_ORDER_REJECTED = 'change_order.rejected',
  SUBMITTAL_STATUS_CHANGED = 'submittal.status_changed',

  // Workflow Events
  PAY_APP_SUBMITTED = 'pay_app.submitted',
  PAY_APP_APPROVED = 'pay_app.approved',
  DAILY_LOG_SUBMITTED = 'daily_log.submitted',
  INSPECTION_COMPLETED = 'inspection.completed',
  MOBILIZATION_SCHEDULED = 'mobilization.scheduled',

  // Alert Events
  CONFIDENCE_LOW = 'confidence.low',
  DATA_MISMATCH = 'data.mismatch',
  DOCUMENT_REQUIRED = 'document.required',
  DEADLINE_APPROACHING = 'deadline.approaching',
}

export interface RoofioEvent {
  id: string;
  type: EventType;
  timestamp: string;
  projectId: string;
  documentId?: string;
  userId: string;
  data: Record<string, unknown>;
  affectedRoles: RoleId[];
}

// ============================================================================
// VERSION DIFF TYPES
// ============================================================================

export interface VersionDiff {
  id: string;
  projectId: string;
  oldDocumentId: string;
  newDocumentId: string;
  oldVersion: string;
  newVersion: string;
  changes: Change[];
  summary: string;
  affectedRoles: RoleId[];
  confidence: number;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Change {
  type: 'added' | 'removed' | 'modified';
  field: string;
  oldValue: unknown;
  newValue: unknown;
  impact: 'high' | 'medium' | 'low';
  affectedData: string[];
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export type WorkflowStep =
  | 'contract_execution'
  | 'mobilization'
  | 'site_access'
  | 'pay_app_1'
  | 'submittal_package'
  | 'procurement'
  | 'material_order'
  | 'shop_drawings'
  | 'installation'
  | 'inspection'
  | 'closeout';

export interface DocumentRequirement {
  documentType: DocumentType;
  requiredFor: WorkflowStep[];
  blockedRoles: RoleId[];
  alertLevel: 'critical' | 'warning' | 'info';
}

// ============================================================================
// SCHEDULE OF VALUES
// ============================================================================

export interface SOVLine {
  id: string;
  projectId: string;
  lineNumber: number;
  description: string;
  scheduledValue: number;
  workCompleted: number;
  materialsStored: number;
  totalCompleted: number;
  percentComplete: number;
  balanceToFinish: number;
  retainage: number;
}

// ============================================================================
// CHANGE ORDER
// ============================================================================

export interface ChangeOrder {
  id: string;
  projectId: string;
  number: number;
  description: string;
  reason: ChangeOrderReason;
  amount: number;
  status: ChangeOrderStatus;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  documentId?: string;
}

export type ChangeOrderReason =
  | 'owner_request'
  | 'design_change'
  | 'unforeseen_condition'
  | 'code_compliance'
  | 'value_engineering';

export type ChangeOrderStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

// ============================================================================
// PAY APPLICATION
// ============================================================================

export interface PayApplication {
  id: string;
  projectId: string;
  applicationNumber: number;
  periodTo: string;
  originalContractSum: number;
  netChangeOrders: number;
  contractSumToDate: number;
  totalCompletedStored: number;
  retainage: number;
  totalEarnedLessRetainage: number;
  previousCertifiedPayment: number;
  currentPaymentDue: number;
  status: PayAppStatus;
  submittedAt?: string;
  approvedAt?: string;
}

export type PayAppStatus = 'draft' | 'submitted' | 'approved' | 'paid';

// ============================================================================
// CONTACT TYPES
// ============================================================================

export interface Contact {
  id: string;
  type: ContactType;
  company: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type ContactType = 'owner' | 'architect' | 'gc' | 'subcontractor' | 'supplier' | 'inspector';
