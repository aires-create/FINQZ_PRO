// FINQZ PRO - Report Types
// Tipos para o módulo de relatórios

import type { Scope, Role } from '../types';

// ============================================
// REPORT TYPES
// ============================================

/**
 * Tipos de relatório disponíveis
 */
export type ReportType = 
  | 'producao'
  | 'comissoes'
  | 'consolidado'
  | 'analitico'
  | 'financeiro'
  | 'parceiros'
  | 'usuarios'
  | 'funil';

/**
 * Período do relatório
 */
export type ReportPeriod = 'semana' | 'mes' | 'trimestre' | 'ano' | 'personalizado';

/**
 * Status da oportunidade
 */
export type OpportunityStatus = 
  | 'novo_lead'
  | 'triagem'
  | 'analise'
  | 'aprovacao'
  | 'documentacao'
  | 'formalizacao'
  | 'liberacao'
  | 'encerrado'
  | 'reprovado'
  | 'cancelado';

/**
 * Status financeiro
 */
export type FinancialStatus = 
  | 'pendente'
  | 'confirmado'
  | 'cancelado'
  | 'estornado';

/**
 * Filtros do relatório
 */
export interface ReportFilters {
  // Período
  periodo: ReportPeriod;
  dataInicio?: string;
  dataFim?: string;
  
  // Entidades
  produto?: string;
  parceiro?: string;
  usuario?: string;
  equipe?: string;
  
  // Status
  status?: OpportunityStatus | FinancialStatus;
  etapa?: string;
  origem?: string;
  regiao?: string;
  
  // Busca
  search?: string;
}

/**
 * KPI do relatório
 */
export interface ReportKPI {
  label: string;
  value: number | string;
  formattedValue: string;
  variation?: number;
  variationLabel?: string;
  icon?: string;
  color?: string;
}

/**
 * Linha do relatório analítico
 */
export interface AnalyticalReportRow {
  id: number;
  cliente: string;
  cpfCnpj: string; // Mascarado
  produto: string;
  parceiro: string;
  responsavel: string;
  etapa: string;
  status: string;
  valor: number;
  comissao: number;
  dataCriacao: string;
  dataIntegracao?: string;
  origem: string;
}

/**
 * Dados consolidados
 */
export interface ConsolidatedReportRow {
  chave: string;
  label: string;
  quantidade: number;
  valorTotal: number;
  comissaoTotal: number;
  taxaConversao?: number;
  ticketMedio?: number;
}

/**
 * Dados do funil
 */
export interface FunnelReportRow {
  etapa: string;
  quantidade: number;
  valor: number;
  taxa: number;
  taxaConversaoAnterior?: number;
}

/**
 * Dados de comissão
 */
export interface CommissionReportRow {
  id: number;
  oportunidadeId: number;
  cliente: string;
  produto: string;
  parceiro: string;
  responsavel: string;
  valor: number;
  taxaComissao: number;
  valorComissao: number;
  status: FinancialStatus;
  dataPagamento?: string;
  dataPrevista?: string;
}

/**
 * Dados financeiros
 */
export interface FinancialReportRow {
  id: number;
  tipo: 'credito' | 'debito' | 'estorno' | 'taxa' | 'juros' | 'multa';
  categoria: string;
  valor: number;
  descricao?: string;
  parceiroId?: number;
  parceiroNome?: string;
  oportunidadeId?: number;
  status: FinancialStatus;
  data: string;
}

/**
 * Resposta do relatório
 */
export interface ReportResponse<T> {
  data: T[];
  total: number;
  kpis: ReportKPI[];
  filtros: ReportFilters;
  agrupadoPor?: string;
  periodo?: {
    inicio: string;
    fim: string;
  };
}

/**
 * Opção de agrupamento
 */
export type GroupByOption = 
  | 'produto'
  | 'parceiro'
  | 'usuario'
  | 'etapa'
  | 'status'
  | 'mes'
  | 'origem'
  | 'regiao';

/**
 * Permissões de relatório
 */
export interface ReportPermissions {
  podeVerProducao: boolean;
  podeVerComissoes: boolean;
  podeVerFinanceiro: boolean;
  podeVerParceiros: boolean;
  podeVerUsuarios: boolean;
  podeExportar: boolean;
  podeVerDadosConsolidados: boolean;
}

// ============================================
// REPORT CONFIG
// ============================================

/**
 * Configuração dos relatórios
 */
export const REPORT_CONFIG = {
  // Tipos de relatório
  TYPES: [
    { id: 'producao', label: 'Produção', icon: 'TrendingUp' },
    { id: 'comissoes', label: 'Comissões', icon: 'DollarSign' },
    { id: 'consolidado', label: 'Consolidado', icon: 'PieChart' },
    { id: 'analitico', label: 'Analítico', icon: 'List' },
    { id: 'financeiro', label: 'Financeiro', icon: 'Wallet' },
    { id: 'parceiros', label: 'Parceiros', icon: 'Users' },
    { id: 'usuarios', label: 'Usuários', icon: 'UserCheck' },
    { id: 'funil', label: 'Funil', icon: 'Filter' },
  ] as const,
  
  // Períodos
  PERIODS: [
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'trimestre', label: 'Este Trimestre' },
    { id: 'ano', label: 'Este Ano' },
    { id: 'personalizado', label: 'Personalizado' },
  ] as const,
  
  // Opções de agrupamento
  GROUP_BY: [
    { id: 'produto', label: 'Produto' },
    { id: 'parceiro', label: 'Parceiro' },
    { id: 'usuario', label: 'Usuário' },
    { id: 'etapa', label: 'Etapa' },
    { id: 'status', label: 'Status' },
    { id: 'mes', label: 'Mês' },
    { id: 'origem', label: 'Origem' },
  ] as const,
  
  // Status de oportunidade
  OPPORTUNITY_STATUS: [
    { id: 'novo_lead', label: 'Novo Lead', color: '#6b7280' },
    { id: 'triagem', label: 'Triagem', color: '#8b5cf6' },
    { id: 'analise', label: 'Em Análise', color: '#a855f7' },
    { id: 'aprovacao', label: 'Aprovação', color: '#f59e0b' },
    { id: 'documentacao', label: 'Documentação', color: '#06b6d4' },
    { id: 'formalizacao', label: 'Formalização', color: '#0ea5e9' },
    { id: 'liberacao', label: 'Liberação', color: '#22c55e' },
    { id: 'encerrado', label: 'Encerrado', color: '#10b981' },
    { id: 'reprovado', label: 'Reprovado', color: '#ef4444' },
    { id: 'cancelado', label: 'Cancelado', color: '#dc2626' },
  ] as const,
  
  // Status financeiro
  FINANCIAL_STATUS: [
    { id: 'pendente', label: 'Pendente', color: '#f59e0b' },
    { id: 'confirmado', label: 'Confirmado', color: '#22c55e' },
    { id: 'cancelado', label: 'Cancelado', color: '#ef4444' },
    { id: 'estornado', label: 'Estornado', color: '#dc2626' },
  ] as const,
};

// ============================================
// EXPORTS
// ============================================

export default REPORT_CONFIG;
