/**
 * ROOFIO Event Bus
 * Event-driven propagation to all 13 AI roles
 */

import type { RoofioEvent, EventType, RoleId, DocumentType } from '../types';

// ============================================================================
// EVENT PROPAGATION MATRIX
// Which roles receive which events
// ============================================================================

export const EVENT_PROPAGATION_MATRIX: Record<EventType, RoleId[]> = {
  // Document Events
  [EventType.DOCUMENT_UPLOADED]: ['pm', 'accounts'],
  [EventType.DOCUMENT_PARSED]: ['pm', 'estimator', 'detailer', 'accounts'],
  [EventType.DOCUMENT_VERSION_CHANGED]: ['pm', 'estimator', 'detailer', 'superintendent', 'accounts', 'owner'],
  [EventType.DOCUMENT_MISSING]: ['pm', 'accounts'],
  [EventType.DOCUMENT_APPROVED]: ['pm', 'superintendent', 'qc'],

  // Data Events
  [EventType.SOV_UPDATED]: ['accounts', 'pm', 'owner'],
  [EventType.CONTRACT_SUM_CHANGED]: ['estimator', 'pm', 'accounts', 'owner'],
  [EventType.CHANGE_ORDER_APPROVED]: ['estimator', 'pm', 'accounts', 'superintendent', 'detailer', 'owner'],
  [EventType.CHANGE_ORDER_REJECTED]: ['estimator', 'pm', 'superintendent'],
  [EventType.SUBMITTAL_STATUS_CHANGED]: ['pm', 'detailer', 'superintendent', 'qc'],

  // Workflow Events
  [EventType.PAY_APP_SUBMITTED]: ['accounts', 'pm', 'owner'],
  [EventType.PAY_APP_APPROVED]: ['accounts', 'pm', 'owner'],
  [EventType.DAILY_LOG_SUBMITTED]: ['pm', 'superintendent', 'safety', 'hr', 'foreman'],
  [EventType.INSPECTION_COMPLETED]: ['pm', 'superintendent', 'qc', 'owner'],
  [EventType.MOBILIZATION_SCHEDULED]: ['superintendent', 'foreman', 'safety', 'pm'],

  // Alert Events
  [EventType.CONFIDENCE_LOW]: ['pm'],
  [EventType.DATA_MISMATCH]: ['pm', 'accounts', 'estimator'],
  [EventType.DOCUMENT_REQUIRED]: ['pm', 'accounts'],
  [EventType.DEADLINE_APPROACHING]: ['pm', 'superintendent', 'accounts'],
};

// ============================================================================
// DOCUMENT TYPE TO ROLE MAPPING
// Which roles care about which document types
// ============================================================================

export const DOCUMENT_ROLE_MATRIX: Record<DocumentType, RoleId[]> = {
  contract: ['estimator', 'pm', 'accounts', 'owner'],
  scope: ['estimator', 'pm', 'detailer', 'superintendent', 'accounts', 'owner'],
  drawing: ['estimator', 'detailer', 'superintendent', 'qc'],
  specification: ['qc', 'safety', 'detailer', 'pm'],
  assembly_letter: ['pm', 'superintendent', 'qc', 'detailer'],
  submittal: ['pm', 'detailer', 'qc'],
  change_order: ['estimator', 'pm', 'accounts', 'superintendent', 'owner'],
  daily_log: ['superintendent', 'foreman', 'safety', 'pm', 'hr'],
  pay_application: ['accounts', 'pm', 'owner'],
  bond: ['accounts', 'pm'],
  insurance: ['accounts', 'pm', 'safety'],
  msds: ['safety', 'superintendent', 'foreman'],
  warranty: ['warranty', 'pm', 'owner'],
  closeout: ['pm', 'accounts', 'owner'],
};

// ============================================================================
// EVENT BUS CLASS
// ============================================================================

type EventHandler = (event: RoofioEvent) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private roleHandlers: Map<RoleId, Set<EventHandler>> = new Map();
  private eventHistory: RoofioEvent[] = [];
  private maxHistorySize = 1000;

  /**
   * Subscribe to a specific event type
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to all events for a specific role
   */
  onRole(roleId: RoleId, handler: EventHandler): () => void {
    if (!this.roleHandlers.has(roleId)) {
      this.roleHandlers.set(roleId, new Set());
    }
    this.roleHandlers.get(roleId)!.add(handler);

    return () => {
      this.roleHandlers.get(roleId)?.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribers
   */
  async emit(event: RoofioEvent): Promise<void> {
    // Add affected roles based on event type
    const affectedRoles = EVENT_PROPAGATION_MATRIX[event.type] || [];
    event.affectedRoles = [...new Set([...event.affectedRoles, ...affectedRoles])];

    // Store in history
    this.addToHistory(event);

    // Notify event type subscribers
    const typeHandlers = this.handlers.get(event.type) || new Set();
    for (const handler of typeHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error);
      }
    }

    // Notify role subscribers
    for (const roleId of event.affectedRoles) {
      const roleHandlerSet = this.roleHandlers.get(roleId) || new Set();
      for (const handler of roleHandlerSet) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Role handler error for ${roleId}:`, error);
        }
      }
    }

    // Log event
    console.log(`[EVENT] ${event.type} -> Roles: ${event.affectedRoles.join(', ')}`);
  }

  /**
   * Emit document-related event with automatic role detection
   */
  async emitDocumentEvent(
    type: EventType,
    projectId: string,
    documentType: DocumentType,
    documentId: string,
    userId: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    const affectedRoles = DOCUMENT_ROLE_MATRIX[documentType] || [];

    const event: RoofioEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      projectId,
      documentId,
      userId,
      data: { documentType, ...data },
      affectedRoles,
    };

    await this.emit(event);
  }

  /**
   * Get event history for a project
   */
  getHistory(projectId?: string, limit = 100): RoofioEvent[] {
    let events = this.eventHistory;
    if (projectId) {
      events = events.filter((e) => e.projectId === projectId);
    }
    return events.slice(-limit);
  }

  /**
   * Get events for a specific role
   */
  getRoleEvents(roleId: RoleId, projectId?: string, limit = 50): RoofioEvent[] {
    let events = this.eventHistory.filter((e) => e.affectedRoles.includes(roleId));
    if (projectId) {
      events = events.filter((e) => e.projectId === projectId);
    }
    return events.slice(-limit);
  }

  private addToHistory(event: RoofioEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.roleHandlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create and emit a document uploaded event
 */
export async function emitDocumentUploaded(
  projectId: string,
  documentType: DocumentType,
  documentId: string,
  userId: string,
  filename: string
): Promise<void> {
  await eventBus.emitDocumentEvent(
    EventType.DOCUMENT_UPLOADED,
    projectId,
    documentType,
    documentId,
    userId,
    { filename }
  );
}

/**
 * Create and emit a document parsed event
 */
export async function emitDocumentParsed(
  projectId: string,
  documentType: DocumentType,
  documentId: string,
  userId: string,
  confidence: number,
  fieldsExtracted: number
): Promise<void> {
  await eventBus.emitDocumentEvent(
    EventType.DOCUMENT_PARSED,
    projectId,
    documentType,
    documentId,
    userId,
    { confidence, fieldsExtracted }
  );
}

/**
 * Create and emit a version changed event
 */
export async function emitVersionChanged(
  projectId: string,
  documentType: DocumentType,
  documentId: string,
  userId: string,
  oldVersion: string,
  newVersion: string,
  changesSummary: string
): Promise<void> {
  await eventBus.emitDocumentEvent(
    EventType.DOCUMENT_VERSION_CHANGED,
    projectId,
    documentType,
    documentId,
    userId,
    { oldVersion, newVersion, changesSummary }
  );
}

/**
 * Create and emit a change order approved event
 */
export async function emitChangeOrderApproved(
  projectId: string,
  documentId: string,
  userId: string,
  coNumber: number,
  amount: number,
  newContractSum: number
): Promise<void> {
  const event: RoofioEvent = {
    id: crypto.randomUUID(),
    type: EventType.CHANGE_ORDER_APPROVED,
    timestamp: new Date().toISOString(),
    projectId,
    documentId,
    userId,
    data: { coNumber, amount, newContractSum },
    affectedRoles: EVENT_PROPAGATION_MATRIX[EventType.CHANGE_ORDER_APPROVED],
  };

  await eventBus.emit(event);
}

/**
 * Create and emit a missing document alert
 */
export async function emitDocumentMissing(
  projectId: string,
  documentType: DocumentType,
  userId: string,
  requiredFor: string,
  blockedWorkflows: string[]
): Promise<void> {
  const event: RoofioEvent = {
    id: crypto.randomUUID(),
    type: EventType.DOCUMENT_MISSING,
    timestamp: new Date().toISOString(),
    projectId,
    userId,
    data: { documentType, requiredFor, blockedWorkflows },
    affectedRoles: DOCUMENT_ROLE_MATRIX[documentType],
  };

  await eventBus.emit(event);
}
