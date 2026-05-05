/**
 * FINQZ PRO - Security Alerts Engine
 * Generate alerts based on event patterns
 */

import { tables } from '@generated';
import { eq, and, gte, desc, sql, count } from 'drizzle-orm';
import type { Client } from '@sdk/server-types';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 
  | 'multiple_deletes'
  | 'multiple_exports'
  | 'role_changed'
  | 'permission_changed'
  | 'repeated_send_failures'
  | 'login_failed_repeated'
  | 'campaign_high_failure_rate';

export interface AlertRule {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  threshold: number;
  timeWindowMs: number;
  eventTypes: string[];
}

// Alert rules configuration
const ALERT_RULES: AlertRule[] = [
  {
    type: 'multiple_deletes',
    severity: 'high',
    title: 'Múltiplas exclusões detectadas',
    description: 'Vários registros foram excluídos em curto período',
    threshold: 5,
    timeWindowMs: 5 * 60 * 1000, // 5 minutes
    eventTypes: ['lead_deleted', 'cliente_deleted', 'opportunity_deleted']
  },
  {
    type: 'multiple_exports',
    severity: 'medium',
    title: 'Múltiplas exportações detectadas',
    description: 'Várias exportações foram realizadas em curto período',
    threshold: 3,
    timeWindowMs: 10 * 60 * 1000, // 10 minutes
    eventTypes: ['export', 'clientes_export', 'oportunidades_export']
  },
  {
    type: 'role_changed',
    severity: 'high',
    title: 'Alteração de role detectada',
    description: 'Uma alteração de permissão de usuário foi realizada',
    threshold: 1,
    timeWindowMs: 0,
    eventTypes: ['role_changed', 'permission_changed']
  },
  {
    type: 'repeated_send_failures',
    severity: 'medium',
    title: 'Falhas repetidas de envio',
    description: 'Múltiplas falhas de envio de mensagens detectadas',
    threshold: 10,
    timeWindowMs: 15 * 60 * 1000, // 15 minutes
    eventTypes: ['message_failed']
  },
  {
    type: 'login_failed_repeated',
    severity: 'high',
    title: 'Falhas de login repetidas',
    description: 'Múltiplas tentativas de login falhas detectadas',
    threshold: 5,
    timeWindowMs: 10 * 60 * 1000, // 10 minutes
    eventTypes: ['login_failed']
  },
  {
    type: 'campaign_high_failure_rate',
    severity: 'medium',
    title: 'Alta taxa de falha em campanha',
    description: 'Campanha com taxa de falha superior a 20%',
    threshold: 20,
    timeWindowMs: 0,
    eventTypes: ['campaign_finished']
  }
];

// ============================================
// CHECK AND CREATE ALERTS
// ============================================

export async function checkAndCreateAlerts(
  edgespark: Client<typeof tables>,
  tenantId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<{ alertCreated: boolean; alertId?: number }> {
  try {
    // Find matching rules
    const matchingRules = ALERT_RULES.filter(rule => 
      rule.eventTypes.includes(eventType)
    );

    for (const rule of matchingRules) {
      // For instant alerts (threshold = 1), create immediately
      if (rule.threshold === 1) {
        await createAlert(edgespark, tenantId, rule, eventType, eventData);
        return { alertCreated: true };
      }

      // For threshold-based alerts, count events in time window
      const count = await countEventsInWindow(
        edgespark,
        tenantId,
        rule.eventTypes,
        rule.timeWindowMs
      );

      if (count >= rule.threshold) {
        // Check if alert already exists recently
        const existingAlert = await getRecentAlert(
          edgespark,
          tenantId,
          rule.type
        );

        if (!existingAlert) {
          await createAlert(edgespark, tenantId, rule, eventType, eventData);
          return { alertCreated: true };
        }
      }
    }

    return { alertCreated: false };
  } catch (error) {
    console.error('[ALERT] Error checking alerts:', error);
    return { alertCreated: false };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function countEventsInWindow(
  edgespark: Client<typeof tables>,
  tenantId: string,
  eventTypes: string[],
  timeWindowMs: number
): Promise<number> {
  const since = Date.now() - timeWindowMs;

  const result = await edgespark.db
    .select({ count: count() })
    .from(tables.eventos)
    .where(
      and(
        eq(tables.eventos.tenantId, tenantId),
        gte(tables.eventos.createdAt, since)
      )
    ) as any;

  return result[0]?.count || 0;
}

async function getRecentAlert(
  edgespark: Client<typeof tables>,
  tenantId: string,
  alertType: string
): Promise<any | null> {
  const since = Date.now() - (60 * 60 * 1000); // Last hour

  const alerts = await edgespark.db
    .select()
    .from(tables.alertasSeguranca)
    .where(
      and(
        eq(tables.alertasSeguranca.usuarioId, tenantId),
        eq(tables.alertasSeguranca.tipo, alertType),
        eq(tables.alertasSeguranca.resolved, 0),
        gte(tables.alertasSeguranca.createdAt, since)
      )
    )
    .limit(1);

  return alerts[0] || null;
}

async function createAlert(
  edgespark: Client<typeof tables>,
  tenantId: string,
  rule: AlertRule,
  triggerEventType: string,
  eventData: Record<string, any>
): Promise<number> {
  const result = await edgespark.db
    .insert(tables.alertasSeguranca)
    .values({
      tipo: rule.type,
      severity: rule.severity,
      mensagem: `${rule.description} - Disparado por: ${triggerEventType}`,
      usuarioId: tenantId,
      resolved: 0,
      createdAt: Date.now()
    } as any);

  const alertId = (result as any)?.lastInsertRowid || (result as any)?.id;
  console.log(`[ALERT] Created alert: ${rule.type} (id: ${alertId})`);
  
  return alertId;
}

// ============================================
// RESOLVE ALERT
// ============================================

export async function resolveAlert(
  edgespark: Client<typeof tables>,
  alertId: number,
  resolvedBy: string
): Promise<boolean> {
  try {
    await edgespark.db
      .update(tables.alertasSeguranca)
      .set({
        resolved: 1,
        resolvedBy: resolvedBy,
        resolvedAt: Date.now()
      })
      .where(eq(tables.alertasSeguranca.id, alertId));

    return true;
  } catch (error) {
    console.error('[ALERT] Error resolving alert:', error);
    return false;
  }
}

// ============================================
// GET ACTIVE ALERTS
// ============================================

export async function getActiveAlerts(
  edgespark: Client<typeof tables>,
  tenantId: string
): Promise<any[]> {
  const alerts = await edgespark.db
    .select()
    .from(tables.alertasSeguranca)
    .where(
      and(
        eq(tables.alertasSeguranca.usuarioId, tenantId),
        eq(tables.alertasSeguranca.resolved, 0)
      )
    )
    .orderBy(desc(tables.alertasSeguranca.createdAt));

  return alerts;
}
