// FINQZ PRO - Automation Types
// Tipos para o módulo de automações

import type { Scope } from '../types';

// ============================================
// AUTOMATION TYPES
// ============================================

/**
 * Status da automação
 */
export type AutomationStatus = 
  | 'ativa'
  | 'pausada'
  | 'erro'
  | 'pendente_config';

/**
 * Tipo de trigger
 */
export type AutomationTrigger = 
  | 'cliente_criado'
  | 'oportunidade_criada'
  | 'mudanca_etapa'
  | 'mudanca_status'
  | 'pendencia_criada'
  | 'proposta_integrada'
  | 'proposta_aprovada'
  | 'proposta_perdida'
  | 'aniversario'
  | 'webhook_recebido'
  | 'cron';

/**
 * Tipo de ação
 */
export type AutomationAction = 
  | 'enviar_email'
  | 'enviar_whatsapp'
  | 'criar_notificacao'
  | 'criar_tarefa'
  | 'mover_etapa'
  | 'chamar_webhook'
  | 'atualizar_campo'
  | 'enviar_sms';

/**
 * Escopo da automação
 */
export type AutomationScope = 
  | 'cliente'
  | 'oportunidade'
  | 'pendencia'
  | 'global';

/**
 * Operador de condição
 */
export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'starts_with'
  | 'ends_with';

/**
 * Condição de automação
 */
export interface AutomationCondition {
  campo: string;
  operador: ConditionOperator;
  valor: string | number | boolean;
}

/**
 * Parâmetros de ação
 */
export interface ActionParameters {
  // Email
  destinatario?: string;
  assunto?: string;
  corpo?: string;
  template?: string;
  
  // WhatsApp
  telefone?: string;
  mensagem?: string;
  templateId?: string;
  
  // Notificação
  titulo?: string;
  descricao?: string;
  tipo?: 'info' | 'sucesso' | 'erro' | 'aviso';
  
  // Tarefa
  tarefaTitulo?: string;
  tarefaDescricao?: string;
  tarefaResponsavel?: string;
  tarefaPrazo?: string;
  
  // Mover etapa
  novaEtapa?: string;
  
  // Webhook
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT';
  webhookHeaders?: Record<string, string>;
  webhookBody?: string;
  
  // Atualizar campo
  campoAtualizar?: string;
  novoValor?: string | number | boolean;
}

/**
 * Automação
 */
export interface Automation {
  id: number;
  nome: string;
  descricao?: string;
  trigger: AutomationTrigger;
  triggerParams?: Record<string, any>;
  
  // Condições
  condicoes?: AutomationCondition[];
  condicaoLogica?: 'AND' | 'OR'; // AND = todas as condições, OR = qualquer condição
  
  // Ação
  acao: AutomationAction;
  acaoParametros?: ActionParameters;
  
  // Configuração
  ativo: boolean;
  status: AutomationStatus;
  escopo: AutomationScope;
  
  // Dados
  createdAt: number;
  updatedAt: number;
  createdBy?: number;
  
  // Execução
  ultimaExecucao?: number;
  proximaExecucao?: number;
  totalExecucoes?: number;
  totalSucessos?: number;
  totalFalhas?: number;
}

/**
 * Log de automação
 */
export interface AutomationLog {
  id: number;
  automacaoId: number;
  automacaoNome: string;
  
  // Entidade afetada
  entidadeTipo: 'cliente' | 'oportunidade' | 'pendencia' | 'webhook';
  entidadeId: number;
  entidadeNome?: string;
  
  // Execução
  status: 'sucesso' | 'falha' | 'erro' | 'skipped';
  erro?: string;
  tentativa: number;
  
  // Dados
  dadosEntrada?: Record<string, any>;
  dadosSaida?: Record<string, any>;
  
  // Timestamp
  timestamp: number;
  duracaoMs?: number;
}

/**
 * Payload para backend executar automação
 */
export interface AutomationExecutionPayload {
  trigger: AutomationTrigger;
  entidadeTipo: 'cliente' | 'oportunidade' | 'pendencia';
  entidadeId: number;
  dados: Record<string, any>;
  usuarioId?: number;
}

/**
 * Resposta de automação
 */
export interface AutomationResponse {
  automacao: Automation;
  logs: AutomationLog[];
  totalExecucoes: number;
  totalSucessos: number;
  totalFalhas: number;
  taxaSucesso: number;
}

/**
 * Validação de automação
 */
export interface AutomationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// AUTOMATION CONFIG
// ============================================

/**
 * Configuração de triggers
 */
export const TRIGGER_CONFIG = {
  // Triggers disponíveis
  TRIGGERS: [
    { 
      id: 'cliente_criado', 
      label: 'Cliente Criado', 
      descricao: 'Dispara quando um novo cliente é cadastrado',
      icon: 'UserPlus',
      entidade: 'cliente' as const
    },
    { 
      id: 'oportunidade_criada', 
      label: 'Oportunidade Criada', 
      descricao: 'Dispara quando uma nova oportunidade é criada',
      icon: 'PlusCircle',
      entidade: 'oportunidade' as const
    },
    { 
      id: 'mudanca_etapa', 
      label: 'Mudança de Etapa', 
      descricao: 'Dispara quando uma oportunidade muda de etapa',
      icon: 'ArrowRight',
      entidade: 'oportunidade' as const
    },
    { 
      id: 'mudanca_status', 
      label: 'Mudança de Status', 
      descricao: 'Dispara quando o status muda',
      icon: 'RefreshCw',
      entidade: 'oportunidade' as const
    },
    { 
      id: 'pendencia_criada', 
      label: 'Pendência Criada', 
      descricao: 'Dispara quando uma pendência é criada',
      icon: 'AlertCircle',
      entidade: 'pendencia' as const
    },
    { 
      id: 'proposta_integrada', 
      label: 'Proposta Integrada', 
      descricao: 'Dispara quando uma proposta é integrada ao banco',
      icon: 'Link',
      entidade: 'oportunidade' as const
    },
    { 
      id: 'proposta_aprovada', 
      label: 'Proposta Aprovada', 
      descricao: 'Dispara quando uma proposta é aprovada',
      icon: 'CheckCircle',
      entidade: 'oportunidade' as const
    },
    { 
      id: 'proposta_perdida', 
      label: 'Proposta Perdida', 
      descricao: 'Dispara quando uma proposta é perdida',
      icon: 'XCircle',
      entidade: 'oportunidade' as const
    },
    { 
      id: 'aniversario', 
      label: 'Aniversário', 
      descricao: 'Dispara no aniversário do cliente',
      icon: 'Cake',
      entidade: 'cliente' as const
    },
    { 
      id: 'webhook_recebido', 
      label: 'Webhook Recebido', 
      descricao: 'Dispara quando um webhook externo é recebido',
      icon: 'Webhook',
      entidade: 'webhook' as const
    },
    { 
      id: 'cron', 
      label: 'Agendamento (Cron)', 
      descricao: 'Dispara em horários/programações específicas',
      icon: 'Clock',
      entidade: 'global' as const
    },
  ] as const,
  
  // Ações disponíveis
  ACTIONS: [
    { 
      id: 'enviar_email', 
      label: 'Enviar E-mail', 
      descricao: 'Envia um e-mail para o cliente',
      icon: 'Mail',
      precisaConfirmacao: true,
      parametrosObrigatorios: ['destinatario', 'assunto'],
    },
    { 
      id: 'enviar_whatsapp', 
      label: 'Enviar WhatsApp', 
      descricao: 'Envia mensagem via WhatsApp',
      icon: 'MessageCircle',
      precisaConfirmacao: true,
      parametrosObrigatorios: ['telefone', 'mensagem'],
    },
    { 
      id: 'criar_notificacao', 
      label: 'Criar Notificação', 
      descricao: 'Cria uma notificação no sistema',
      icon: 'Bell',
      precisaConfirmacao: false,
      parametrosObrigatorios: ['titulo'],
    },
    { 
      id: 'criar_tarefa', 
      label: 'Criar Tarefa', 
      descricao: 'Cria uma tarefa para acompanhamento',
      icon: 'CheckSquare',
      precisaConfirmacao: false,
      parametrosObrigatorios: ['tarefaTitulo'],
    },
    { 
      id: 'mover_etapa', 
      label: 'Mover Etapa', 
      descricao: 'Move a oportunidade para outra etapa',
      icon: 'ArrowRight',
      precisaConfirmacao: true,
      parametrosObrigatorios: ['novaEtapa'],
    },
    { 
      id: 'chamar_webhook', 
      label: 'Chamar Webhook', 
      descricao: 'Chama um endpoint externo',
      icon: 'ExternalLink',
      precisaConfirmacao: true,
      parametrosObrigatorios: ['webhookUrl'],
    },
    { 
      id: 'atualizar_campo', 
      label: 'Atualizar Campo', 
      descricao: 'Atualiza um campo da entidade',
      icon: 'Edit',
      precisaConfirmacao: true,
      parametrosObrigatorios: ['campoAtualizar', 'novoValor'],
    },
    { 
      id: 'enviar_sms', 
      label: 'Enviar SMS', 
      descricao: 'Envia mensagem SMS',
      icon: 'Smartphone',
      precisaConfirmacao: true,
      parametrosObrigatorios: ['telefone', 'mensagem'],
    },
  ] as const,
  
  // Operadores de condição
  OPERATORS: [
    { id: 'equals', label: 'Igual a', symbol: '=' },
    { id: 'not_equals', label: 'Diferente de', symbol: '≠' },
    { id: 'contains', label: 'Contém', symbol: '~' },
    { id: 'not_contains', label: 'Não contém', symbol: '!~' },
    { id: 'greater_than', label: 'Maior que', symbol: '>' },
    { id: 'less_than', label: 'Menor que', symbol: '<' },
    { id: 'is_empty', label: 'Vazio', symbol: '∅' },
    { id: 'is_not_empty', label: 'Não vazio', symbol: '∅!' },
    { id: 'starts_with', label: 'Começa com', symbol: '^' },
    { id: 'ends_with', label: 'Termina com', symbol: '$' },
  ] as const,
  
  // Campos disponíveis para condições (por entidade)
  CONDITION_FIELDS: {
    cliente: [
      { id: 'nome', label: 'Nome', type: 'string' },
      { id: 'cpf_cnpj', label: 'CPF/CNPJ', type: 'string' },
      { id: 'email', label: 'E-mail', type: 'string' },
      { id: 'telefone', label: 'Telefone', type: 'string' },
      { id: 'status', label: 'Status', type: 'select' },
      { id: 'created_at', label: 'Data de Criação', type: 'date' },
    ],
    oportunidade: [
      { id: 'nome', label: 'Nome', type: 'string' },
      { id: 'produto', label: 'Produto', type: 'string' },
      { id: 'valor', label: 'Valor', type: 'number' },
      { id: 'etapa', label: 'Etapa', type: 'select' },
      { id: 'status', label: 'Status', type: 'select' },
      { id: 'parceiro_id', label: 'Parceiro', type: 'number' },
      { id: 'created_at', label: 'Data de Criação', type: 'date' },
    ],
    pendencia: [
      { id: 'titulo', label: 'Título', type: 'string' },
      { id: 'tipo', label: 'Tipo', type: 'select' },
      { id: 'prazo', label: 'Prazo', type: 'date' },
      { id: 'status', label: 'Status', type: 'select' },
    ],
  },
  
  // Status visual
  STATUS_CONFIG: {
    ativa: { label: 'Ativa', color: '#22c55e', bg: '#dcfce7' },
    pausada: { label: 'Pausada', color: '#f59e0b', bg: '#fef3c7' },
    erro: { label: 'Com Erro', color: '#ef4444', bg: '#fee2e2' },
    pendente_config: { label: 'Pendente', color: '#6b7280', bg: '#f3f4f6' },
  },
};

// ============================================
// EXPORTS
// ============================================

export default TRIGGER_CONFIG;
