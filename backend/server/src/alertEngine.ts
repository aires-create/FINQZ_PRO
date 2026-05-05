// ============================================
// ALERT ENGINE - Sistema Centralizado de Alertas
// ============================================
// Engine de alertas baseado em regras centralizadas
// Processa logs de auditoria e gera alertas automaticamente

import { eq, and, gte, sql } from "drizzle-orm";

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertRule {
  name: string;
  type: string;
  deduplicationWindow: number;
  // Função que verifica se a regra deve ser disparada
  check: (context: AlertContext) => Promise<AlertResult | null>;
}

export interface AlertContext {
  usuarioId: string;
  acao: string;
  modulo: string;
  dadosAntes?: any;
  dadosDepois?: any;
  timestamp: number;
}

export interface AlertResult {
  tipo: string;
  severity: Severity;
  mensagem: string;
  dadosExtras?: any;
}

// ============================================
// FACTORY - Criar regras do sistema
// ============================================

export const createAlertRules = (db: any, tables: any): AlertRule[] => {
  return [
    // ============================================
    // REGRAS CRÍTICAS
    // ============================================
    
    // Mais de 3 deletes em 2 minutos
    {
      name: 'Excessive Deletes',
      type: 'EXCESSIVE_DELETES',
      deduplicationWindow: 5 * 60 * 1000, // 5 min
      check: async (context: AlertContext) => {
        if (context.acao !== 'DELETE') return null;
        
        const twoMinutesAgo = context.timestamp - 2 * 60 * 1000;
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.logsAcoes)
          .where(and(
            eq(tables.logsAcoes.usuarioId, context.usuarioId),
            eq(tables.logsAcoes.acao, 'DELETE'),
            gte(tables.logsAcoes.createdAt, twoMinutesAgo)
          ));

        if (result[0]?.count >= 3) {
          return {
            tipo: 'EXCESSIVE_DELETES',
            severity: 'critical',
            mensagem: `⚠️ ATENÇÃO: ${result[0].count} exclusões detectadas nos últimos 2 minutos!`,
            dadosExtras: { acao: context.acao, modulo: context.modulo, count: result[0].count, window: '2 min' }
          };
        }
        return null;
      }
    },

    // Alteração de roles/permissões
    {
      name: 'Role Change',
      type: 'ROLE_CHANGE',
      deduplicationWindow: 10 * 60 * 1000, // 10 min
      check: async (context: AlertContext) => {
        if (context.acao !== 'UPDATE' || context.modulo !== 'usuarios_perfis') return null;
        
        const oldRole = context.dadosAntes?.perfil;
        const newRole = context.dadosDepois?.perfil;
        
        if (oldRole && newRole && oldRole !== newRole) {
          return {
            tipo: 'ROLE_CHANGE',
            severity: 'critical',
            mensagem: `🔐 Alteração de permissão: ${oldRole} → ${newRole}`,
            dadosExtras: { dadosAntes: context.dadosAntes, dadosDepois: context.dadosDepois }
          };
        }
        return null;
      }
    },

    // Exportação de dados financeiros
    {
      name: 'Financial Export',
      type: 'FINANCIAL_EXPORT',
      deduplicationWindow: 10 * 60 * 1000, // 10 min
      check: async (context: AlertContext) => {
        if (context.acao !== 'EXPORT') return null;
        
        // Verifica se é exportação de dados sensíveis
        const dadosDepoisStr = JSON.stringify(context.dadosDepois || {});
        const isFinancialExport = dadosDepoisStr.includes('valor') || 
                                dadosDepoisStr.includes('comissao') ||
                                dadosDepoisStr.includes('financeiro');

        if (isFinancialExport || context.modulo === 'financeiro' || context.modulo === 'relatorios') {
          return {
            tipo: 'FINANCIAL_EXPORT',
            severity: 'critical',
            mensagem: `📊 Exportação de dados financeiros detectada`,
            dadosExtras: { acao: context.acao, modulo: context.modulo, dados: context.dadosDepois }
          };
        }
        return null;
      }
    },

    // ============================================
    // REGRAS MÉDIAS
    // ============================================

    // Mais de 5 edições em 5 minutos
    {
      name: 'Excessive Updates',
      type: 'EXCESSIVE_UPDATES',
      deduplicationWindow: 30 * 60 * 1000, // 30 min
      check: async (context: AlertContext) => {
        if (context.acao !== 'UPDATE') return null;
        
        const fiveMinutesAgo = context.timestamp - 5 * 60 * 1000;
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.logsAcoes)
          .where(and(
            eq(tables.logsAcoes.usuarioId, context.usuarioId),
            eq(tables.logsAcoes.acao, 'UPDATE'),
            gte(tables.logsAcoes.createdAt, fiveMinutesAgo)
          ));

        if (result[0]?.count >= 5) {
          return {
            tipo: 'EXCESSIVE_UPDATES',
            severity: 'medium',
            mensagem: `📝 ${result[0].count} edições realizadas nos últimos 5 minutos`,
            dadosExtras: { acao: context.acao, modulo: context.modulo, count: result[0].count }
          };
        }
        return null;
      }
    },

    // Alta frequência de ações (10+ em 1 minuto)
    {
      name: 'Rapid Actions',
      type: 'RAPID_ACTIONS',
      deduplicationWindow: 30 * 60 * 1000, // 30 min
      check: async (context: AlertContext) => {
        const oneMinuteAgo = context.timestamp - 60 * 1000;
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.logsAcoes)
          .where(and(
            eq(tables.logsAcoes.usuarioId, context.usuarioId),
            gte(tables.logsAcoes.createdAt, oneMinuteAgo)
          ));

        if (result[0]?.count >= 10) {
          return {
            tipo: 'RAPID_ACTIONS',
            severity: 'medium',
            mensagem: `⚡ Alta frequência de ações: ${result[0].count} ações em 1 minuto`,
            dadosExtras: { count: result[0].count }
          };
        }
        return null;
      }
    },

    // ============================================
    // REGRAS DE INFO
    // ============================================

    // Login bem-sucedido
    {
      name: 'User Login',
      type: 'USER_LOGIN',
      deduplicationWindow: 60 * 60 * 1000, // 60 min
      check: async (context: AlertContext) => {
        if (context.acao === 'LOGIN') {
          return {
            tipo: 'USER_LOGIN',
            severity: 'low',
            mensagem: `👤 Usuário realizou login no sistema`,
            dadosExtras: { acao: context.acao, modulo: context.modulo }
          };
        }
        return null;
      }
    },

    // Múltiplos logins falhos
    {
      name: 'Multiple Login Failures',
      type: 'MULTIPLE_LOGIN_FAILURES',
      deduplicationWindow: 10 * 60 * 1000, // 10 min
      check: async (context: AlertContext) => {
        if (context.acao !== 'LOGIN_FAILED') return null;
        
        const tenMinutesAgo = context.timestamp - 10 * 60 * 1000;
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(tables.logsAcoes)
          .where(and(
            eq(tables.logsAcoes.acao, 'LOGIN_FAILED'),
            gte(tables.logsAcoes.createdAt, tenMinutesAgo)
          ));

        if (result[0]?.count >= 3) {
          return {
            tipo: 'MULTIPLE_LOGIN_FAILURES',
            severity: 'high',
            mensagem: `🚨 ${result[0].count} tentativas de login falhas nos últimos 10 minutos`,
            dadosExtras: { count: result[0].count }
          };
        }
        return null;
      }
    },
  ];
};

// ============================================
// ALERT ENGINE - Classe Principal
// ============================================

export class AlertEngine {
  private rules: AlertRule[];
  private db: any;
  private tables: any;

  constructor(db: any, tables: any) {
    this.db = db;
    this.tables = tables;
    this.rules = createAlertRules(db, tables);
  }

  // Processa um log de auditoria e verifica todas as regras
  async processLog(context: AlertContext): Promise<void> {
    for (const rule of this.rules) {
      try {
        const result = await rule.check(context);
        
        if (result) {
          await this.checkAndCreateAlert(rule, result, context.usuarioId);
        }
      } catch (error) {
        console.error(`[AlertEngine] Erro ao processar regra ${rule.name}:`, error);
      }
    }
  }

  // Verifica se deve criar alerta (deduplicação)
  private async checkAndCreateAlert(rule: AlertRule, result: AlertResult, usuarioId: string): Promise<void> {
    try {
      // Verifica deduplicação
      const existingAlert = await this.db
        .select()
        .from(this.tables.alertasSeguranca)
        .where(and(
          eq(this.tables.alertasSeguranca.tipo, result.tipo),
          eq(this.tables.alertasSeguranca.resolved, 0),
          gte(this.tables.alertasSeguranca.createdAt, Date.now() - rule.deduplicationWindow)
        ))
        .limit(1);

      if (existingAlert.length > 0) {
        console.log(`[AlertEngine] Alerta duplicado ignorado: ${result.tipo}`);
        return;
      }

      // Cria o alerta
      await this.db.insert(this.tables.alertasSeguranca).values({
        tipo: result.tipo,
        usuarioId: usuarioId || null,
        severity: result.severity,
        mensagem: result.mensagem,
        dadosExtras: result.dadosExtras ? JSON.stringify(result.dadosExtras) : null,
        resolved: 0,
      });

      console.log(`[AlertEngine] Alerta criado: ${result.severity.toUpperCase()} - ${result.tipo}`);
    } catch (error) {
      console.error(`[AlertEngine] Erro ao criar alerta:`, error);
    }
  }

  // Adiciona uma nova regra dinamicamente
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
    console.log(`[AlertEngine] Nova regra adicionada: ${rule.name}`);
  }

  // Remove uma regra
  removeRule(type: string): void {
    this.rules = this.rules.filter(r => r.type !== type);
    console.log(`[AlertEngine] Regra removida: ${type}`);
  }

  // Lista todas as regras
  getRules(): AlertRule[] {
    return this.rules;
  }
}
