/**
 * FINQZ PRO - Event System
 * Centralized event tracking for campaigns, conversations, opportunities, and audit
 */

// ============================================
// EVENT TYPES - Complete list
// ============================================

// Campaign events
export type CampaignEventType = 
  | 'campaign_created'
  | 'campaign_updated'
  | 'campaign_started'
  | 'campaign_finished'
  | 'campaign_failed'
  | 'campaign_deleted';

// Message events
export type MessageEventType = 
  | 'message_queued'
  | 'message_sent'
  | 'message_delivered'
  | 'message_failed'
  | 'message_received'
  | 'message_retried';

// Conversation events
export type ConversationEventType = 
  | 'conversation_opened'
  | 'conversation_assigned'
  | 'conversation_status_changed'
  | 'conversation_closed'
  | 'conversation_message_added';

// Client/Lead events
export type ClientEventType = 
  | 'cliente_created'
  | 'cliente_updated'
  | 'cliente_deleted'
  | 'lead_imported'
  | 'lead_updated';

// Opportunity events
export type OpportunityEventType = 
  | 'opportunity_created'
  | 'opportunity_updated'
  | 'opportunity_moved'
  | 'opportunity_deleted';

// User/Security events
export type UserEventType = 
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'role_changed'
  | 'permission_changed';

// Export/Delete events
export type AuditEventType = 
  | 'export_started'
  | 'export_completed'
  | 'delete_performed';

// All event types
export type EventType = 
  | CampaignEventType 
  | MessageEventType 
  | ConversationEventType 
  | ClientEventType 
  | OpportunityEventType 
  | UserEventType
  | AuditEventType;

// Event sources
export type EventSource = 
  | 'api'
  | 'webhook'
  | 'system'
  | 'automation'
  | 'import';

// ============================================
// EVENT TYPE CONSTANTS - Centralized
// ============================================

export const EVENT_TYPES = {
  // Campaign
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_UPDATED: 'campaign_updated',
  CAMPAIGN_STARTED: 'campaign_started',
  CAMPAIGN_FINISHED: 'campaign_finished',
  CAMPAIGN_FAILED: 'campaign_failed',
  CAMPAIGN_DELETED: 'campaign_deleted',

  // Message
  MESSAGE_QUEUED: 'message_queued',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_FAILED: 'message_failed',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_RETRY: 'message_retried',

  // Conversation
  CONVERSATION_OPENED: 'conversation_opened',
  CONVERSATION_ASSIGNED: 'conversation_assigned',
  CONVERSATION_STATUS_CHANGED: 'conversation_status_changed',
  CONVERSATION_CLOSED: 'conversation_closed',
  CONVERSATION_MESSAGE_ADDED: 'conversation_message_added',

  // Client/Lead
  CLIENTE_CREATED: 'cliente_created',
  CLIENTE_UPDATED: 'cliente_updated',
  CLIENTE_DELETED: 'cliente_deleted',
  LEAD_IMPORTED: 'lead_imported',
  LEAD_UPDATED: 'lead_updated',

  // Opportunity
  OPPORTUNITY_CREATED: 'opportunity_created',
  OPPORTUNITY_UPDATED: 'opportunity_updated',
  OPPORTUNITY_MOVED: 'opportunity_moved',
  OPPORTUNITY_DELETED: 'opportunity_deleted',

  // User/Security
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  ROLE_CHANGED: 'role_changed',
  PERMISSION_CHANGED: 'permission_changed',

  // Audit
  EXPORT_STARTED: 'export_started',
  EXPORT_COMPLETED: 'export_completed',
  DELETE_PERFORMED: 'delete_performed',
} as const;

// ============================================
// EVENT TYPE VALIDATION
// ============================================

const VALID_EVENT_TYPES: EventType[] = [
  // Campaign
  'campaign_created', 'campaign_updated', 'campaign_started', 'campaign_finished', 'campaign_failed', 'campaign_deleted',
  // Message
  'message_queued', 'message_sent', 'message_delivered', 'message_failed', 'message_received', 'message_retried',
  // Conversation
  'conversation_opened', 'conversation_assigned', 'conversation_status_changed', 'conversation_closed', 'conversation_message_added',
  // Client/Lead
  'cliente_created', 'cliente_updated', 'cliente_deleted', 'lead_imported', 'lead_updated',
  // Opportunity
  'opportunity_created', 'opportunity_updated', 'opportunity_moved', 'opportunity_deleted',
  // User/Security
  'user_login', 'user_logout', 'user_created', 'user_updated', 'user_deleted', 'password_reset_requested', 'password_reset_completed', 'role_changed', 'permission_changed',
  // Audit
  'export_started', 'export_completed', 'delete_performed',
];

export function isValidEventType(type: string): type is EventType {
  return VALID_EVENT_TYPES.includes(type as EventType);
}

// ============================================
// SENSITIVE FIELDS TO SANITIZE
// ============================================

const SENSITIVE_FIELDS = [
  'senha', 'password', 'token', 'access_token', 'refresh_token',
  'api_key', 'apikey', 'secret', 'credential', 'authorization',
  'cookie', 'private_key', 'cpf', 'cnpj', 'credit_card', 'card_number',
  'authorization', 'bearer', 'jwt', 'session', 'auth'
];

const SENSITIVE_PATTERNS = [
  /password/i, /senha/i, /token/i, /secret/i, /credential/i,
  /api[_-]?key/i, /private[_-]?key/i, /authorization/i, /bearer/i,
  /jwt/i, /session/i, /auth/i
];

export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key matches any sensitive pattern
    const isSensitive = SENSITIVE_FIELDS.some(f => lowerKey.includes(f.toLowerCase())) ||
                       SENSITIVE_PATTERNS.some(p => p.test(key));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        (item && typeof item === 'object') 
          ? sanitizePayload(item as Record<string, unknown>) 
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// ============================================
// MAX PAYLOAD SIZE (10KB)
// ============================================

const MAX_PAYLOAD_SIZE = 10 * 1024;

export function truncatePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const json = JSON.stringify(payload);
  if (json.length > MAX_PAYLOAD_SIZE) {
    return {
      ...payload,
      _truncated: true,
      _originalSize: json.length,
      _note: 'Payload truncated to 10KB'
    };
  }
  return payload;
}

// ============================================
// IDEMPOTENCY KEY GENERATOR
// ============================================

export function generateIdempotencyKey(
  eventType: string,
  tenantId: string,
  options: {
    campaignId?: number;
    messageId?: number;
    clienteId?: number;
    oportunidadeId?: number;
    conversaId?: number;
  }
): string {
  const parts = [eventType, tenantId];
  
  if (options.campaignId) parts.push(`campaign:${options.campaignId}`);
  if (options.messageId) parts.push(`message:${options.messageId}`);
  if (options.clienteId) parts.push(`cliente:${options.clienteId}`);
  if (options.oportunidadeId) parts.push(`oportunidade:${options.oportunidadeId}`);
  if (options.conversaId) parts.push(`conversa:${options.conversaId}`);
  
  return parts.join(':').toLowerCase();
}

// ============================================
// SANITIZE FOR UI DISPLAY
// ============================================

export function sanitizeForDisplay(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  
  // Apply sanitization and also remove internal fields
  const sanitized = sanitizePayload(payload);
  
  // Remove internal fields that shouldn't be displayed
  const { _truncated, _originalSize, _note, ...displayPayload } = sanitized as any;
  
  return displayPayload;
}
