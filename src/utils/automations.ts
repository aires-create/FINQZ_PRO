// FINQZ PRO - Automation Utilities
// Funções puras para validação, formatação e preparação de automações

import type {
  Automation,
  AutomationCondition,
  ActionParameters,
  AutomationValidation,
  AutomationExecutionPayload,
  AutomationTrigger,
  AutomationAction,
  AutomationStatus,
  AutomationLog,
} from '../types/automations';
import { TRIGGER_CONFIG } from '../types/automations';

// ============================================
// VALIDATION
// ============================================

/**
 * Valida JSON de parâmetros
 */
export const validateJSON = (jsonString: string): { isValid: boolean; error?: string; parsed?: any } => {
  if (!jsonString || jsonString.trim() === '') {
    return { isValid: true, parsed: {} };
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return { isValid: true, parsed };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'JSON inválido' 
    };
  }
};

/**
 * Valida parâmetros de ação
 */
export const validateActionParameters = (
  action: AutomationAction,
  params: ActionParameters
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const actionConfig = TRIGGER_CONFIG.ACTIONS.find(a => a.id === action);
  if (!actionConfig) {
    errors.push('Ação inválida');
    return { isValid: false, errors };
  }
  
  // Verifica parâmetros obrigatórios
  if (actionConfig.parametrosObrigatorios) {
    for (const param of actionConfig.parametrosObrigatorios) {
      const value = params[param as keyof ActionParameters];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Parâmetro obrigatório não informado: ${param}`);
      }
    }
  }
  
  // Validações específicas por ação
  if (action === 'enviar_email') {
    if (params.destinatario && !isValidEmail(params.destinatario)) {
      errors.push('E-mail inválido');
    }
  }
  
  if (action === 'enviar_whatsapp' || action === 'enviar_sms') {
    if (params.telefone && !isValidPhone(params.telefone)) {
      errors.push('Telefone inválido');
    }
  }
  
  if (action === 'chamar_webhook') {
    if (params.webhookUrl && !isValidUrl(params.webhookUrl)) {
      errors.push('URL do webhook inválida');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Valida automação completa
 */
export const validateAutomation = (automation: Partial<Automation>): AutomationValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Nome obrigatório
  if (!automation.nome || automation.nome.trim() === '') {
    errors.push('Nome é obrigatório');
  }
  
  // Trigger obrigatório
  if (!automation.trigger) {
    errors.push('Trigger é obrigatório');
  }
  
  // Ação obrigatória
  if (!automation.acao) {
    errors.push('Ação é obrigatória');
  }
  
  // Valida trigger
  if (automation.trigger) {
    const triggerConfig = TRIGGER_CONFIG.TRIGGERS.find(t => t.id === automation.trigger);
    if (!triggerConfig) {
      errors.push('Trigger inválido');
    }
  }
  
  // Valida ação
  if (automation.acao) {
    const actionConfig = TRIGGER_CONFIG.ACTIONS.find(a => a.id === automation.acao);
    if (!actionConfig) {
      errors.push('Ação inválida');
    }
    
    // Valida parâmetros da ação
    if (automation.acaoParametros) {
      const paramsValidation = validateActionParameters(automation.acao, automation.acaoParametros);
      errors.push(...paramsValidation.errors);
    }
  }
  
  // Valida condições
  if (automation.condicoes && automation.condicoes.length > 0) {
    for (let i = 0; i < automation.condicoes.length; i++) {
      const cond = automation.condicoes[i];
      if (!cond.campo) {
        errors.push(`Condição ${i + 1}: campo não informado`);
      }
      if (!cond.operador) {
        errors.push(`Condição ${i + 1}: operador não informado`);
      }
    }
  }
  
  // Warnings
  if (automation.acao === 'chamar_webhook' && !automation.acaoParametros?.webhookUrl) {
    warnings.push('Webhook sem URL pode não executar corretamente');
  }
  
  if (automation.condicoes && automation.condicoes.length === 0) {
    warnings.push('Automação sem condições executará para todos os eventos');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Verifica se ação requer confirmação
 */
export const actionRequiresConfirmation = (action: AutomationAction): boolean => {
  const actionConfig = TRIGGER_CONFIG.ACTIONS.find(a => a.id === action);
  return actionConfig?.precisaConfirmacao || false;
};

// ============================================
// FORMAT HELPERS
// ============================================

/**
 * Formata nome do trigger
 */
export const formatTriggerName = (trigger: AutomationTrigger): string => {
  const config = TRIGGER_CONFIG.TRIGGERS.find(t => t.id === trigger);
  return config?.label || trigger;
};

/**
 * Formata nome da ação
 */
export const formatActionName = (action: AutomationAction): string => {
  const config = TRIGGER_CONFIG.ACTIONS.find(a => a.id === action);
  return config?.label || action;
};

/**
 * Formata status
 */
export const formatStatus = (status: AutomationStatus): { label: string; color: string; bg: string } => {
  return TRIGGER_CONFIG.STATUS_CONFIG[status] || { 
    label: status, 
    color: '#6b7280', 
    bg: '#f3f4f6' 
  };
};

/**
 * Formata data de execução
 */
export const formatExecutionDate = (timestamp?: number): string => {
  if (!timestamp) return 'Nunca';
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata taxa de sucesso
 */
export const formatSuccessRate = (sucessos: number, total: number): string => {
  if (total === 0) return '0%';
  const rate = (sucessos / total) * 100;
  return `${rate.toFixed(1)}%`;
};

// ============================================
// PAYLOAD PREPARATION
// ============================================

/**
 * Prepara payload para backend executar automação
 */
export const prepareExecutionPayload = (
  trigger: AutomationTrigger,
  entidadeTipo: 'cliente' | 'oportunidade' | 'pendencia',
  entidadeId: number,
  dados: Record<string, any>,
  usuarioId?: number
): AutomationExecutionPayload => {
  return {
    trigger,
    entidadeTipo,
    entidadeId,
    dados,
    usuarioId,
  };
};

/**
 * Prepara payload de criação de automação para API
 */
export const prepareAutomationForAPI = (automation: Partial<Automation>): Record<string, any> => {
  const payload: Record<string, any> = {
    nome: automation.nome,
    descricao: automation.descricao || '',
    trigger: automation.trigger,
    trigger_params: automation.triggerParams || {},
    acao: automation.acao,
    acao_parametros: automation.acaoParametros || {},
    ativo: automation.ativo ?? true,
    escopo: automation.escopo || 'oportunidade',
    condicoes: automation.condicoes || [],
    condicao_logica: automation.condicaoLogica || 'AND',
  };
  
  return payload;
};

/**
 * Prepara payload de execução de webhook
 */
export const prepareWebhookPayload = (
  automation: Automation,
  entidade: { tipo: string; id: number; dados: Record<string, any> },
  logs: AutomationLog[]
): Record<string, any> => {
  return {
    automation: {
      id: automation.id,
      nome: automation.nome,
      trigger: automation.trigger,
    },
    entidade,
    contexto: {
      timestamp: Date.now(),
      executionId: logs[logs.length - 1]?.id || null,
    },
    // Não incluir dados sensíveis
    dados: sanitizeDataForWebhook(entidade.dados),
  };
};

/**
 * Remove dados sensíveis do payload de webhook
 */
export const sanitizeDataForWebhook = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['senha', 'password', 'token', 'cpf', 'cnpj', 'creditCard'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***';
    }
  }
  
  return sanitized;
};

// ============================================
// CONDITION EVALUATION
// ============================================

/**
 * Avalia uma condição
 */
export const evaluateCondition = (
  condition: AutomationCondition,
  data: Record<string, any>
): boolean => {
  const value = data[condition.campo];
  const targetValue = condition.valor;
  
  switch (condition.operador) {
    case 'equals':
      return value === targetValue;
    
    case 'not_equals':
      return value !== targetValue;
    
    case 'contains':
      return String(value).includes(String(targetValue));
    
    case 'not_contains':
      return !String(value).includes(String(targetValue));
    
    case 'greater_than':
      return Number(value) > Number(targetValue);
    
    case 'less_than':
      return Number(value) < Number(targetValue);
    
    case 'is_empty':
      return !value || value === '' || value === null;
    
    case 'is_not_empty':
      return !!value && value !== '' && value !== null;
    
    case 'starts_with':
      return String(value).startsWith(String(targetValue));
    
    case 'ends_with':
      return String(value).endsWith(String(targetValue));
    
    default:
      return false;
  }
};

/**
 * Avalia todas as condições de uma automação
 */
export const evaluateConditions = (
  conditions: AutomationCondition[],
  logicalOperator: 'AND' | 'OR',
  data: Record<string, any>
): boolean => {
  if (conditions.length === 0) return true;
  
  if (logicalOperator === 'AND') {
    return conditions.every(cond => evaluateCondition(cond, data));
  } else {
    return conditions.some(cond => evaluateCondition(cond, data));
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Valida e-mail
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida telefone
 */
const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Valida URL
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gera ID único para automação
 */
export const generateAutomationId = (): number => {
  return Date.now();
};

/**
 * Clona automação
 */
export const cloneAutomation = (automation: Automation): Automation => {
  return {
    ...automation,
    id: generateAutomationId(),
    nome: `${automation.nome} (cópia)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ultimaExecucao: undefined,
    totalExecucoes: 0,
    totalSucessos: 0,
    totalFalhas: 0,
  };
};

// ============================================
// EXPORTS
// ============================================

export default {
  validateJSON,
  validateActionParameters,
  validateAutomation,
  actionRequiresConfirmation,
  formatTriggerName,
  formatActionName,
  formatStatus,
  formatExecutionDate,
  formatSuccessRate,
  prepareExecutionPayload,
  prepareAutomationForAPI,
  prepareWebhookPayload,
  sanitizeDataForWebhook,
  evaluateCondition,
  evaluateConditions,
  generateAutomationId,
  cloneAutomation,
};
