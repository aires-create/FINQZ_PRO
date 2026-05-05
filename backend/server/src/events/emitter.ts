/**
 * FINQZ PRO - Event Emitter
 * Central helper for emitting events to the Event System
 */

import { tables } from '@generated';
import { eq, and, desc, asc, sql, like, gte, lte, count, isNull } from 'drizzle-orm';
import type { Client } from '@sdk/server-types';
import { isValidEventType, sanitizePayload, truncatePayload, generateIdempotencyKey } from './types';
import type { EventType, EventSource } from './types';

export { isValidEventType, sanitizePayload, truncatePayload, generateIdempotencyKey };
export type { EventType, EventSource };

export interface EmitEventParams {
  // Required
  type: string;
  source: EventSource;
  
  // User context
  user?: {
    id: string;
    tenantId?: string;
    parceiroId?: number;
    role?: string;
    perfil?: string;
  };
  
  // Resource info
  resource?: string;
  resourceId?: number;
  
  // Related entities
  leadId?: number;
  clienteId?: number;
  oportunidadeId?: number;
  campanhaId?: number;
  conversaId?: number;
  messageId?: number;
  
  // Payload
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  
  // Request info (optional)
  request?: {
    ip?: string;
    userAgent?: string;
  };
  
  // Allow system events without tenant
  allowSystemEvent?: boolean;
  
  // Idempotency
  idempotencyKey?: string;
  useIdempotency?: boolean;
}

export interface EventFilter {
  // Time range
  startDate?: number;
  endDate?: number;
  
  // Event filters
  type?: string;
  source?: string;
  resource?: string;
  resourceId?: number;
  
  // Related entities
  actorUserId?: string;
  leadId?: number;
  clienteId?: number;
  oportunidadeId?: number;
  campanhaId?: number;
  conversaId?: number;
  
  // Pagination
  page?: number;
  limit?: number;
  offset?: number;
  
  // Sorting
  sortBy?: 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface EventStats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
}

// ============================================
// EMIT EVENT WITH IDEMPOTENCY
// ============================================

export async function emitEvent(
  edgespark: Client<typeof tables>,
  params: EmitEventParams
): Promise<{ success: boolean; eventId?: number; error?: string; idempotent?: boolean }> {
  const {
    type,
    source,
    user,
    resource,
    resourceId,
    leadId,
    clienteId,
    oportunidadeId,
    campanhaId,
    conversaId,
    messageId,
    payload,
    metadata,
    request,
    allowSystemEvent = false,
    idempotencyKey,
    useIdempotency = false
  } = params;

  try {
    // Validate event type
    if (!isValidEventType(type)) {
      console.error(`[EVENT] Invalid event type: ${type}`);
      return { success: false, error: `Invalid event type: ${type}` };
    }

    // Determine tenant_id
    let tenantId = user?.tenantId;
    
    // If no tenant from user, try to get from resource
    if (!tenantId && resourceId) {
      // Could query the resource table to get tenant_id
      // For now, require tenant from user
    }

    // Require tenant_id unless explicitly allowed (system events)
    if (!tenantId && !allowSystemEvent) {
      console.error('[EVENT] No tenant_id provided and allowSystemEvent is false');
      return { success: false, error: 'tenant_id is required' };
    }

    // Handle idempotency
    let finalIdempotencyKey = idempotencyKey;
    
    if (useIdempotency && !idempotencyKey && tenantId) {
      // Generate idempotency key if not provided
      finalIdempotencyKey = generateIdempotencyKey(type, tenantId, {
        campaignId: campanhaId,
        messageId,
        clienteId,
        oportunidadeId,
        conversaId
      });
    }

    // Check for existing event with same idempotency key
    if (finalIdempotencyKey) {
      const existingEvent = await edgespark.db
        .select({ id: tables.eventos.id })
        .from(tables.eventos)
        .where(eq(tables.eventos.idempotencyKey, finalIdempotencyKey))
        .limit(1)
        .then(rows => rows[0]);

      if (existingEvent) {
        console.log(`[EVENT] Idempotent event already exists: ${type} (id: ${existingEvent.id})`);
        return { success: true, eventId: existingEvent.id, idempotent: true };
      }
    }

    // Sanitize and truncate payload
    const safePayload = payload ? truncatePayload(sanitizePayload(payload)) : undefined;
    const safeMetadata = metadata ? truncatePayload(sanitizePayload(metadata)) : undefined;

    // Insert event with all new fields
    const result = await edgespark.db
      .insert(tables.eventos)
      .values({
        tipo: type,
        dados: safePayload ? JSON.stringify(safePayload) : undefined,
        metadata: safeMetadata ? JSON.stringify(safeMetadata) : undefined,
        tenantId: tenantId || 'system',
        usuarioId: user?.id,
        leadId: leadId || undefined,
        clienteId: clienteId || undefined,
        source: source,
        resource: resource || undefined,
        resourceId: resourceId || undefined,
        campanhaId: campanhaId || undefined,
        conversaId: conversaId || undefined,
        oportunidadeId: oportunidadeId || undefined,
        messageId: messageId || undefined,
        idempotencyKey: finalIdempotencyKey || undefined,
      } as any);

    const eventId = (result as any)?.lastInsertRowid || (result as any)?.id;
    
    console.log(`[EVENT] Emitted: ${type} (id: ${eventId}, tenant: ${tenantId})`);
    
    return { success: true, eventId };
  } catch (error: any) {
    // Check for idempotency key constraint violation
    if (error?.message?.includes('UNIQUE constraint failed') || error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log(`[EVENT] Duplicate event detected (idempotency): ${type}`);
      return { success: true, idempotent: true };
    }
    
    // Log error but don't fail the main operation
    console.error('[EVENT] Failed to emit event:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// QUERY EVENTS
// ============================================

export async function queryEvents(
  edgespark: Client<typeof tables>,
  user: { id: string; tenantId?: string; parceiroId?: number; permissions?: string[] },
  filters: EventFilter
): Promise<{ events: any[]; total: number; page: number; limit: number }> {
  const {
    startDate,
    endDate,
    type,
    source,
    resource,
    resourceId,
    actorUserId,
    leadId,
    clienteId,
    oportunidadeId,
    campanhaId,
    conversaId,
    page = 1,
    limit = 50,
    offset,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Build tenant filter
  const isAdmin = user.permissions?.includes('*');
  let tenantFilter = undefined;
  
  if (!isAdmin && user.tenantId) {
    tenantFilter = eq(tables.eventos.tenantId, user.tenantId);
  } else if (!isAdmin && user.parceiroId) {
    // Non-admin users can only see their organization's events
    // This would need additional filtering based on parceiroId in the data
  }

  // Build query conditions
  const conditions = [];
  
  if (tenantFilter) {
    conditions.push(tenantFilter);
  }
  
  if (type) {
    conditions.push(eq(tables.eventos.tipo, type));
  }

  if (source) {
    conditions.push(eq(tables.eventos.source, source));
  }
  
  if (resource) {
    conditions.push(eq(tables.eventos.resource, resource));
  }

  if (resourceId) {
    conditions.push(eq(tables.eventos.resourceId, resourceId));
  }
  
  if (actorUserId) {
    conditions.push(eq(tables.eventos.usuarioId, actorUserId));
  }
  
  if (startDate) {
    conditions.push(gte(tables.eventos.createdAt, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(tables.eventos.createdAt, endDate));
  }
  
  if (leadId) {
    conditions.push(eq(tables.eventos.leadId, leadId));
  }

  if (clienteId) {
    conditions.push(eq(tables.eventos.clienteId, clienteId));
  }

  if (oportunidadeId) {
    conditions.push(eq(tables.eventos.oportunidadeId, oportunidadeId));
  }

  if (campanhaId) {
    conditions.push(eq(tables.eventos.campanhaId, campanhaId));
  }

  if (conversaId) {
    conditions.push(eq(tables.eventos.conversaId, conversaId));
  }

  // Calculate offset if not provided
  const effectiveOffset = offset ?? ((page - 1) * limit);
  const effectiveLimit = Math.min(limit, 100); // Max 100 per page

  // Build and execute query
  let query = edgespark.db
    .select()
    .from(tables.eventos);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Get total count
  const countQuery = edgespark.db
    .select({ count: count() })
    .from(tables.eventos)
    .where(conditions.length > 0 ? and(...conditions) : undefined) as any;

  const [countResult] = await countQuery;
  const total = countResult?.count || 0;

  // Execute main query with sorting and pagination
  const orderColumn = sortBy === 'created_at' ? tables.eventos.createdAt : tables.eventos.id;
  const orderFn = sortOrder === 'desc' ? desc : asc;

  const events = await query
    .orderBy(orderFn(orderColumn))
    .limit(effectiveLimit)
    .offset(effectiveOffset);

  // Parse JSON dados field
  const parsedEvents = events.map(event => ({
    ...event,
    dados: event.dados ? JSON.parse(event.dados) : null,
    metadata: event.metadata ? JSON.parse(event.metadata) : null
  }));

  return {
    events: parsedEvents,
    total,
    page,
    limit: effectiveLimit
  };
}

// ============================================
// GET CAMPAIGN EVENT STATS
// ============================================

export interface CampaignEventStats {
  totalQueued: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalReceived: number;
  totalRetried: number;
  successRate: number;
  failureRate: number;
  lastEventAt: number | null;
}

export async function getCampaignEventStats(
  edgespark: Client<typeof tables>,
  campaignId: number,
  tenantId: string
): Promise<CampaignEventStats> {
  // Get all message events for this campaign
  const messageEvents = await edgespark.db
    .select({
      tipo: tables.eventos.tipo,
      createdAt: tables.eventos.createdAt
    })
    .from(tables.eventos)
    .where(and(
      eq(tables.eventos.campanhaId, campaignId),
      eq(tables.eventos.tenantId, tenantId)
    )) as any[];

  // Count by type
  let totalQueued = 0;
  let totalSent = 0;
  let totalDelivered = 0;
  let totalFailed = 0;
  let totalReceived = 0;
  let totalRetried = 0;
  let lastEventAt: number | null = null;

  for (const event of messageEvents) {
    switch (event.tipo) {
      case 'message_queued':
        totalQueued++;
        break;
      case 'message_sent':
        totalSent++;
        break;
      case 'message_delivered':
        totalDelivered++;
        break;
      case 'message_failed':
        totalFailed++;
        break;
      case 'message_received':
        totalReceived++;
        break;
      case 'message_retried':
        totalRetried++;
        break;
    }
    
    if (!lastEventAt || event.createdAt > lastEventAt) {
      lastEventAt = event.createdAt;
    }
  }

  const total = totalSent + totalDelivered + totalFailed;
  const successRate = total > 0 ? ((totalSent + totalDelivered) / total) * 100 : 0;
  const failureRate = total > 0 ? (totalFailed / total) * 100 : 0;

  return {
    totalQueued,
    totalSent,
    totalDelivered,
    totalFailed,
    totalReceived,
    totalRetried,
    successRate: Math.round(successRate * 100) / 100,
    failureRate: Math.round(failureRate * 100) / 100,
    lastEventAt
  };
}

// ============================================
// GET EVENT STATS
// ============================================

export async function getEventStats(
  edgespark: Client<typeof tables>,
  user: { tenantId?: string; permissions?: string[] },
  startDate?: number,
  endDate?: number
): Promise<EventStats> {
  const isAdmin = user.permissions?.includes('*');
  let tenantFilter = undefined;
  
  if (!isAdmin && user.tenantId) {
    tenantFilter = eq(tables.eventos.tenantId, user.tenantId);
  }

  const conditions = [];
  if (tenantFilter) conditions.push(tenantFilter);
  if (startDate) conditions.push(gte(tables.eventos.createdAt, startDate));
  if (endDate) conditions.push(lte(tables.eventos.createdAt, endDate));

  // Get total
  const countQuery = edgespark.db
    .select({ count: count() })
    .from(tables.eventos)
    .where(conditions.length > 0 ? and(...conditions) : undefined) as any;

  const [countResult] = await countQuery;
  const total = countResult?.count || 0;

  // Get by type (group by)
  const byTypeQuery = edgespark.db
    .select({
      tipo: tables.eventos.tipo,
      count: count()
    })
    .from(tables.eventos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(tables.eventos.tipo) as any;

  const typeResults = await byTypeQuery;
  const byType: Record<string, number> = {};
  typeResults.forEach((row: any) => {
    byType[row.tipo] = row.count;
  });

  // Get by source (group by)
  const bySourceQuery = edgespark.db
    .select({
      source: tables.eventos.source,
      count: count()
    })
    .from(tables.eventos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(tables.eventos.source) as any;

  const sourceResults = await bySourceQuery;
  const bySource: Record<string, number> = {};
  sourceResults.forEach((row: any) => {
    bySource[row.source || 'unknown'] = row.count;
  });

  return { total, byType, bySource };
}

// ============================================
// GET CAMPAIGN TIMELINE
// ============================================

export async function getCampaignTimeline(
  edgespark: Client<typeof tables>,
  campaignId: number,
  tenantId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ events: any[]; total: number; page: number; limit: number }> {
  const effectiveLimit = Math.min(limit, 100);
  const effectiveOffset = (page - 1) * effectiveLimit;

  // Get events for this campaign
  const conditions = [
    eq(tables.eventos.campanhaId, campaignId),
    eq(tables.eventos.tenantId, tenantId)
  ];

  // Get total count
  const countQuery = edgespark.db
    .select({ count: count() })
    .from(tables.eventos)
    .where(and(...conditions)) as any;

  const [countResult] = await countQuery;
  const total = countResult?.count || 0;

  // Get events
  const events = await edgespark.db
    .select()
    .from(tables.eventos)
    .where(and(...conditions))
    .orderBy(desc(tables.eventos.createdAt))
    .limit(effectiveLimit)
    .offset(effectiveOffset);

  // Parse JSON fields
  const parsedEvents = events.map(event => ({
    ...event,
    dados: event.dados ? JSON.parse(event.dados) : null,
    metadata: event.metadata ? JSON.parse(event.metadata) : null
  }));

  return {
    events: parsedEvents,
    total,
    page,
    limit: effectiveLimit
  };
}
