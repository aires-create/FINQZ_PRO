// FINQZ PRO - Audit Log System
// Sistema de auditoria para ações críticas
// Prepared for backend implementation

import { AuthUser } from '../auth/permissions';

// ============================================
// TYPES - Tipos para Audit Trail
// ============================================

// Categorias de ações auditadas
export type AuditCategory =
  | 'authentication'    // Login, logout, MFA
  | 'data_access'        // Consulta de dados sensíveis
  | 'data_modification' // Criação, edição, exclusão
  | 'financial'          // Transações financeiras
  | 'permission'         // Alteração de permissões
  | 'document'          // Upload, download, assinatura
  | 'export'            // Exportação de dados
  | 'integration'        // Integrações externas (SPC, Serasa, etc.)
  | 'security'          // Alterações de segurança
  | 'configuration';     // Alterações de configuração

// Módulos do sistema
export type AuditModule =
  | 'auth'
  | 'clientes'
  | 'oportunidades'
  | 'parceiros'
  | 'usuarios'
  | 'produtos'
  | 'estrutura_comercial'
  | 'roteiros_operacionais'
  | 'financeiro'
  | 'conta_corrente'
  | 'relatorios'
  | 'automacoes'
  | 'configuracoes';

// Resultado da ação
export type AuditResult = 'success' | 'failure' | 'partial';

// Interface de entrada para criar um audit log
export interface AuditEntryInput {
  // Identificação
  category: AuditCategory;
  module: AuditModule;
  action: string;
  description: string;
  
  // Entidade afetada
  entityType?: string;
  entityId?: string;
  entityName?: string;
  
  // Dados antes/depois (para modificações)
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  
  // Resultado
  result: AuditResult;
  errorMessage?: string;
  
  // Metadata adicional
  metadata?: Record<string, unknown>;
}

// Interface completa do audit log
export interface AuditEntry extends AuditEntryInput {
  // Identificação única
  id: string;
  auditId?: string; // ID para correlação com backend
  
  // Contexto do usuário
  userId: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  
  // Contexto multi-tenant
  tenantId?: string;
  companyId?: number;
  parceiroId?: number;
  franquiaId?: number;
  
  // Contexto de rede
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  timestamp: number;
  timestampISO: string;
  
  // Integração
  sourceModule?: string;
  sourceId?: string;
  idempotencyKey?: string;
}

// ============================================
// CONSTANTS - Categorias de ações críticas
// ============================================

// Ações que DEVEM ser auditadas
export const CRITICAL_ACTIONS: Record<AuditCategory, string[]> = {
  authentication: [
    'login',
    'logout',
    'login_failed',
    'password_change',
    'password_reset',
    'mfa_enable',
    'mfa_disable',
    'mfa_setup',
    'session_expired',
    'token_refresh',
  ],
  data_access: [
    'view_sensitive',
    'search_sensitive',
    'export_sensitive',
    'view_financial_data',
    'view_client_pii',
    'query_spc',
    'query_serasa',
  ],
  data_modification: [
    'create',
    'update',
    'delete',
    'bulk_create',
    'bulk_update',
    'bulk_delete',
    'restore',
    'archive',
  ],
  financial: [
    'transaction_create',
    'transaction_update',
    'transaction_delete',
    'transaction_reverse',
    'transaction_approve',
    'transaction_reject',
    'balance_adjustment',
    'ledger_entry',
    'payment_initiate',
    'payment_complete',
    'payment_failed',
    'refund',
    'chargeback',
  ],
  permission: [
    'role_assign',
    'role_revoke',
    'permission_grant',
    'permission_revoke',
    'access_grant',
    'access_revoke',
  ],
  document: [
    'upload',
    'download',
    'delete',
    'sign_request',
    'sign_complete',
    'sign_reject',
    'sign_expire',
  ],
  export: [
    'export_csv',
    'export_pdf',
    'export_excel',
    'bulk_export',
  ],
  integration: [
    'api_call',
    'webhook_receive',
    'webhook_send',
    'external_sync',
    'external_auth',
  ],
  security: [
    'api_key_create',
    'api_key_revoke',
    'ip_whitelist_update',
    'security_settings_change',
    'suspicious_activity',
  ],
  configuration: [
    'settings_update',
    'pipeline_update',
    'workflow_update',
    'automation_update',
  ],
};

// ============================================
// UTILITIES - Funções auxiliares
// ============================================

/**
 * Gera um ID único para o audit log
 */
export const generateAuditId = (): string => {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gera uma chave de idempotência para evitar duplicatas
 */
export const generateIdempotencyKey = (
  userId: string,
  action: string,
  entityId?: string
): string => {
  const parts = [userId, action, entityId || 'none', Date.now().toString(36)];
  return parts.join('_');
};

/**
 * Verifica se uma ação é crítica e deve ser auditada
 */
export const isCriticalAction = (
  category: AuditCategory,
  action: string
): boolean => {
  const criticalActions = CRITICAL_ACTIONS[category];
  return criticalActions?.includes(action) ?? false;
};

// ============================================
// AUDIT LOG CREATION
// ============================================

/**
 * Cria uma entrada de audit log
 * 
 * NOTA: Esta função cria o log no frontend.
 * O backend deve persistir e validar todos os logs de auditoria.
 * Não confiar em logs client-side para compliance real.
 */
export const createAuditEntry = (
  user: AuthUser | null,
  input: AuditEntryInput
): AuditEntry | null => {
  // Se não há usuário, não criar log (mas registrar no console)
  if (!user) {
    console.warn('[AUDIT] Tentativa de criar audit log sem usuário autenticado', input);
    return null;
  }

  const now = Date.now();
  
  const entry: AuditEntry = {
    // Identificação
    id: generateAuditId(),
    category: input.category,
    module: input.module,
    action: input.action,
    description: input.description,
    
    // Entidade
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    
    // Estado
    beforeState: input.beforeState,
    afterState: input.afterState,
    
    // Resultado
    result: input.result,
    errorMessage: input.errorMessage,
    
    // Metadata
    metadata: {
      ...input.metadata,
      // Adicionar flags de segurança
      clientSideOnly: true, // Flag indicando que é log client-side
      requiresBackendValidation: true,
    },
    
    // Usuário
    userId: user.id,
    userEmail: user.email,
    userName: user.nome,
    userRole: user.role,
    
    // Tenant (preparado para backend)
    tenantId: user.parceiroId ? `tenant_${user.parceiroId}` : undefined,
    companyId: undefined, // Preenchido pelo backend
    parceiroId: user.parceiroId,
    franquiaId: undefined, // Preenchido pelo backend
    
    // Rede
    ipAddress: undefined, // Preenchido pelo backend
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    
    // Timestamp
    timestamp: now,
    timestampISO: new Date(now).toISOString(),
  };

  // Log no console para desenvolvimento
  console.log(`[AUDIT] ${entry.category}/${entry.action}:`, {
    user: entry.userEmail,
    entity: entry.entityId,
    result: entry.result,
    timestamp: entry.timestampISO,
  });

  return entry;
};

/**
 * Registra ação de auditoria simplificada
 */
export const logAudit = (
  user: AuthUser | null,
  category: AuditCategory,
  module: AuditModule,
  action: string,
  description: string,
  options?: {
    entityType?: string;
    entityId?: string;
    entityName?: string;
    result?: AuditResult;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): AuditEntry | null => {
  return createAuditEntry(user, {
    category,
    module,
    action,
    description,
    entityType: options?.entityType,
    entityId: options?.entityId,
    entityName: options?.entityName,
    result: options?.result || 'success',
    errorMessage: options?.errorMessage,
    metadata: options?.metadata,
  });
};

// ============================================
// PREDEFINED AUDIT HELPERS
// ============================================

/**
 * Registra login bem-sucedido
 */
export const logLogin = (user: AuthUser, ipAddress?: string) => {
  return logAudit(user, 'authentication', 'auth', 'login', 'Usuário realizou login', {
    metadata: { ipAddress },
  });
};

/**
 * Registra tentativa de login falhada
 */
export const logLoginFailed = (
  email: string,
  reason?: string
) => {
  console.warn(`[AUDIT] Login falhado: ${email}`, { reason });
  // Retorna entrada sem usuário (para caso de tentativas externas)
  return null;
};

/**
 * Registra criação de transação financeira
 */
export const logFinancialTransaction = (
  user: AuthUser,
  action: 'transaction_create' | 'transaction_update' | 'transaction_reverse',
  transactionId: string,
  amount: number,
  beforeState?: Record<string, unknown>,
  afterState?: Record<string, unknown>,
  result: AuditResult = 'success',
  errorMessage?: string
) => {
  return createAuditEntry(user, {
    category: 'financial',
    module: 'financeiro',
    action,
    description: `Transação financeira: ${action} - R$ ${amount.toFixed(2)}`,
    entityType: 'transaction',
    entityId: transactionId,
    beforeState,
    afterState,
    result,
    errorMessage,
    metadata: { amount },
  });
};

/**
 * Registra alteração de permissão
 */
export const logPermissionChange = (
  user: AuthUser,
  targetUserId: string,
  targetEmail: string,
  action: 'role_assign' | 'role_revoke' | 'permission_grant' | 'permission_revoke',
  roleOrPermission: string,
  result: AuditResult = 'success'
) => {
  return createAuditEntry(user, {
    category: 'permission',
    module: 'usuarios',
    action,
    description: `${action}: ${roleOrPermission} para ${targetEmail}`,
    entityType: 'user',
    entityId: targetUserId,
    entityName: targetEmail,
    result,
    metadata: { roleOrPermission },
  });
};

/**
 * Registra consulta SPC/Serasa
 */
export const logCreditBureauQuery = (
  user: AuthUser,
  cpfCnpj: string,
  bureau: 'spc' | 'serasa',
  result: AuditResult
) => {
  return logAudit(user, 'data_access', 'clientes', `query_${bureau}`, 
    `Consulta ${bureau.toUpperCase()} para CPF/CNPJ: ${cpfCnpj.slice(0, 3)}***`,
    {
      entityType: 'credit_query',
      entityId: cpfCnpj,
      result,
      metadata: { bureau },
    }
  );
};

/**
 * Registra exportação de dados
 */
export const logDataExport = (
  user: AuthUser,
  module: AuditModule,
  format: 'csv' | 'pdf' | 'excel',
  recordCount: number,
  filters?: Record<string, unknown>
) => {
  return logAudit(user, 'export', module, `export_${format}`,
    `Exportação de ${recordCount} registros em formato ${format.toUpperCase()}`,
    {
      metadata: { format, recordCount, filters },
    }
  );
};

// ============================================
// EXPORT FOR BACKEND
// ============================================

/**
 * Interface para envio ao backend
 * Preparado para integração futura com API de audit
 */
export interface AuditBatchEntry {
  // Identificação
  auditId: string;
  
  // Contexto
  userId: string;
  userEmail: string;
  userRole?: string;
  
  // Tenant
  tenantId?: string;
  companyId?: number;
  parceiroId?: number;
  franquiaId?: number;
  
  // Ação
  category: AuditCategory;
  module: AuditModule;
  action: string;
  description: string;
  
  // Entidade
  entityType?: string;
  entityId?: string;
  entityName?: string;
  
  // Estado
  beforeState?: string; // JSON stringified
  afterState?: string; // JSON stringified
  
  // Resultado
  result: AuditResult;
  errorMessage?: string;
  
  // Rede
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  timestamp: number;
  
  // Integração
  idempotencyKey?: string;
  sourceModule?: string;
  sourceId?: string;
}

/**
 * Converte AuditEntry para formato de envio ao backend
 */
export const toBackendFormat = (entry: AuditEntry): AuditBatchEntry => {
  return {
    auditId: entry.id,
    userId: entry.userId,
    userEmail: entry.userEmail,
    userRole: entry.userRole,
    tenantId: entry.tenantId,
    companyId: entry.companyId,
    parceiroId: entry.parceiroId,
    franquiaId: entry.franquiaId,
    category: entry.category,
    module: entry.module,
    action: entry.action,
    description: entry.description,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityName: entry.entityName,
    beforeState: entry.beforeState ? JSON.stringify(entry.beforeState) : undefined,
    afterState: entry.afterState ? JSON.stringify(entry.afterState) : undefined,
    result: entry.result,
    errorMessage: entry.errorMessage,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    timestamp: entry.timestamp,
    idempotencyKey: entry.idempotencyKey,
    sourceModule: entry.sourceModule,
    sourceId: entry.sourceId,
  };
};

export default {
  createAuditEntry,
  logAudit,
  logLogin,
  logLoginFailed,
  logFinancialTransaction,
  logPermissionChange,
  logCreditBureauQuery,
  logDataExport,
  toBackendFormat,
  generateAuditId,
  generateIdempotencyKey,
  isCriticalAction,
  CRITICAL_ACTIONS,
};
