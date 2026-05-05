// FINQZ PRO - API Response Types
// Tipos padronizados para respostas da API

import { Role, Permission, Scope } from '../types';

// ============================================
// TENANT TYPES - Campos de isolamento multi-tenant
// ============================================

/**
 * Interface base para entidades com suporte a multi-tenant
 * Todos os registros devem incluir esses campos para isolamento de dados
 */
export interface TenantAware {
  /** ID do tenant (empresa/franquia principal) */
  tenant_id?: string;
  /** ID do proprietário/responsável pelo registro */
  owner_id?: string;
  /** ID da franquia (se aplicável) */
  franquia_id?: number;
  /** ID do franqueado (se aplicável) */
  franqueado_id?: number;
}

// ============================================
// BASE RESPONSE TYPES
// ============================================

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

/**
 * Resposta de erro da API
 */
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, string[]>;
  timestamp?: string;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Parâmetros de filtros
 */
export interface FilterParams {
  search?: string;
  status?: string;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  [key: string]: string | undefined;
}

// ============================================
// AUTH RESPONSE TYPES
// ============================================

/**
 * Dados do usuário autenticado
 */
export interface AuthUserData {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'parceiro';
  role?: Role;
  scope?: Scope;
  /** ID do tenant do usuário */
  tenant_id?: string;
  parceiroId?: number;
  codigo?: number;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Resposta de login
 */
export interface LoginResponse {
  user: AuthUserData;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Resposta de refresh token
 */
export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

// ============================================
// ENTITY RESPONSE TYPES
// ============================================

/**
 * Cliente
 */
export interface ClienteResponse extends TenantAware {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: 'ativo' | 'inativo' | 'nao_perturbe';
  observacao?: string;
  profissao?: string;
  estado_civil?: string;
  responsavel_legal?: string;
  cpf_responsavel?: string;
  sexo?: 'masculino' | 'feminino' | 'outro' | 'nao_informar';
  bankData?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: 'corrente' | 'poupanca';
    titular?: string;
    pixTipo?: string;
    pixChave?: string;
  };
  created_at: number;
  updated_at: number;
}

/**
 * Oportunidade
 */
export interface OportunidadeResponse extends TenantAware {
  id: number;
  nome: string;
  telefone: string;
  produto?: string;
  valor?: number;
  pipeline_id?: string;
  coluna_id?: string;
  etapa?: string;
  cliente_nome?: string;
  observacoes?: string;
  tags?: string[];
  documentos?: string;
  parceiro_id?: number;
  status?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Parceiro
 */
export interface ParceiroResponse extends TenantAware {
  id: number;
  nome: string;
  tipo: 'company' | 'franquia' | 'franqueado';
  cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  codigo?: number;
  created_at: number;
  updated_at: number;
}

/**
 * Usuário
 */
export interface UsuarioResponse extends TenantAware {
  id: number;
  nome: string;
  email: string;
  login?: string;
  role: Role;
  scope?: Scope;
  status?: 'ativo' | 'inativo';
  created_at: number;
  updated_at: number;
}

/**
 * Produto
 */
export interface ProdutoResponse {
  id: number;
  nome: string;
  descricao?: string;
  pipeline?: string;
  documentos?: string;
  ativo: number;
  categoria?: string;
  taxa_juros?: number;
  prazo_minimo?: number;
  prazo_maximo?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  comissao?: number;
  created_at: number;
  updated_at: number;
}

/**
 * Transação Financeira
 */
export interface TransacaoFinanceiraResponse extends TenantAware {
  id: number;
  tipo: 'credito' | 'debito' | 'estorno_credito' | 'estorno_debito' | 'taxa' | 'juros' | 'multa' | 'cashback' | 'campanha' | 'bonificacao' | 'ajuste';
  categoria: string;
  valor: number;
  descricao?: string;
  parceiro_id?: number;
  oportunidade_id?: number;
  forma_pagamento?: string;
  status?: 'pendente' | 'confirmado' | 'cancelado';
  data: number;
  created_at: number;
}

/**
 * Movimento de Conta Corrente
 */
export interface ContaCorrenteMovimentoResponse extends TenantAware {
  id: number;
  parceiro_id: number;
  tipo: 'credito' | 'debito' | 'estorno';
  categoria: string;
  valor: number;
  descricao?: string;
  origem?: string;
  status: 'pendente' | 'disponivel' | 'reservado' | 'solicitado' | 'transferido';
  data: number;
  created_at: number;
}

/**
 * Automação
 */
export interface AutomacaoResponse {
  id: number;
  nome: string;
  descricao?: string;
  trigger_tipo: string;
  trigger_condicao?: string;
  acao_tipo: string;
  acao_parametros?: string;
  ativo: number;
  created_at: number;
  updated_at: number;
}

/**
 * Estrutura Comercial
 */
export interface EstruturaComercialResponse {
  id: number;
  parent_id?: number;
  nivel: string;
  nome: string;
  descricao?: string;
  ativo: number;
  created_at: number;
  updated_at: number;
}

/**
 * Roteiro Operacional
 */
export interface RoteiroOperacionalResponse {
  id: number;
  titulo: string;
  conteudo?: string;
  formato?: string;
  categoria?: string;
  nivel?: string;
  ativo: number;
  created_at: number;
  updated_at: number;
}

// ============================================
// DASHBOARD RESPONSE TYPES
// ============================================

/**
 * KPIs do Dashboard
 */
export interface DashboardKPIsResponse {
  totalClientes: number;
  clientesAtivos: number;
  totalOportunidades: number;
  oportunidadesAbertas: number;
  valorTotalOportunidades: number;
  taxaConversao: number;
  valorComissao: number;
  ranking: Array<{
    nome: string;
    valor: number;
    conversao: number;
  }>;
}

/**
 * Dados de Produção
 */
export interface DashboardProducaoResponse {
  periodo: string;
  producao: Array<{
    mes: string;
    valor: number;
    meta: number;
  }>;
  comparacao: {
    anterior: number;
    atual: number;
    variacao: number;
  };
}

/**
 * Dados do Funil
 */
export interface DashboardFunilResponse {
  etapas: Array<{
    nome: string;
    quantidade: number;
    valor: number;
    taxa: number;
  }>;
}

// ============================================
// ERROR RESPONSE TYPES
// ============================================

/**
 * Erro de validação (422)
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Resposta de erro formatada
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    status: number;
    details?: ValidationError[];
    timestamp?: string;
  };
}

/**
 * Tipo para resultado de operação
 */
export type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

/**
 * Tipo para resultado de operação assíncrona
 */
export type AsyncResult<T> = Promise<Result<T>>;

// ============================================
// EXPORTS
// ============================================

export type {
  // Re-export from types
  Role,
  Permission,
  Scope,
};
