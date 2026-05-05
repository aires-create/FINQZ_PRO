// FINQZ PRO - Financial Ledger System
// Sistema de ledger imutável para transações financeiras
// Prepared for backend implementation

import { AuthUser } from '../auth/permissions';
import { logFinancialTransaction } from './audit';

// ============================================
// TYPES - Tipos financeiros
// ============================================

// Tipo de transação
export type TransactionType =
  | 'credit'        // Crédito (entrada)
  | 'debit'          // Débito (saída)
  | 'adjustment'    // Ajuste
  | 'reversal'      // Estorno
  | 'refund';       // Reembolso

// Status da transação
export type TransactionStatus =
  | 'pending'       // Pendente
  | 'processing'   // Processando
  | 'confirmed'    // Confirmada
  | 'failed'       // Falhou
  | 'cancelled'    // Cancelada
  | 'reversed';    // Estornada

// Categoria da transação
export type TransactionCategory =
  | 'commission'        // Comissão
  | 'payment'          // Pagamento
  | 'receipt'          // Recebimento
  | 'transfer'         // Transferência
  | 'adjustment'       // Ajuste
  | 'fee'              // Taxa
  | 'bonus'            // Bônus
  | 'other';           // Outro

// Método de pagamento
export type PaymentMethod =
  | 'pix'
  | 'ted'
  | 'doc'
  | 'boleto'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'internal';

// ============================================
// FINANCIAL ENTRY - Entrada do ledger
// ============================================

export interface FinancialEntry {
  // Identificação única
  id: string;
  entryId: string;           // ID para rastreamento
  idempotencyKey: string;    // Chave de idempotência
  
  // Tipo e status
  type: TransactionType;
  status: TransactionStatus;
  category: TransactionCategory;
  
  // Valores
  amount: number;            // Valor em centavos
  amountFormatted: string;  // Valor formatado
  currency: string;          // Moeda (BRL)
  
  // Partes envolvidas
  fromAccountId?: string;   // Conta de origem
  toAccountId?: string;     // Conta de destino
  fromPartnerId?: number;   // Parceiro de origem
  toPartnerId?: number;     // Parceiro de destino
  
  // Informações de pagamento
  paymentMethod?: PaymentMethod;
  pixKey?: string;
  bankCode?: string;
  agency?: string;
  account?: string;
  
  // Referência
  referenceType?: string;   // Tipo de referência (opportunity, contract, etc.)
  referenceId?: string;    // ID da referência
  description?: string;
  
  // Datas
  effectiveDate: string;    // Data de efetivação
  scheduledDate?: string;   // Data agendada
  processedAt?: string;     // Data de processamento
  cancelledAt?: string;     // Data de cancelamento
  
  // Aprovação
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvalLevel?: 'auto' | 'manager' | 'director' | 'finance';
  
  // Reversão
  reversedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
  originalEntryId?: string;  // ID da entrada original (para estornos)
  
  // Contexto multi-tenant
  tenantId?: string;
  companyId?: number;
  franquiaId?: number;
  franqueadoId?: number;
  
  // Auditoria
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt?: string;
  
  // Source
  sourceModule?: string;
  sourceId?: string;
  
  // Metadata adicional
  metadata?: Record<string, unknown>;
}

// ============================================
// ACCOUNT - Conta corrente
// ============================================

export interface Account {
  // Identificação
  id: string;
  accountId: string;
  accountType: 'company' | 'franquia' | 'franqueado' | 'internal';
  
  // Proprietário
  ownerId: string;
  ownerName: string;
  ownerDocument: string;  // CPF ou CNPJ
  
  // Saldo (calculado a partir do ledger, não editável)
  balance: number;              // Saldo atual em centavos
  balanceFormatted: string;
  pendingBalance: number;        // Saldo pendente
  availableBalance: number;     // Saldo disponível
  
  // Limites
  creditLimit?: number;
  dailyLimit?: number;
  
  // Banco
  bankCode?: string;
  agency?: string;
  account?: string;
  accountDigit?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  
  // Status
  status: 'active' | 'inactive' | 'blocked' | 'closed';
  
  // Contexto multi-tenant
  tenantId?: string;
  companyId?: number;
  franquiaId?: number;
  
  // Auditoria
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// TRANSACTION REQUEST - Request para criar transação
// ============================================

export interface CreateTransactionRequest {
  // Tipo
  type: TransactionType;
  category: TransactionCategory;
  
  // Valores
  amount: number;
  description?: string;
  
  // Partes
  toPartnerId?: number;
  toAccountId?: string;
  
  // Pagamento
  paymentMethod?: PaymentMethod;
  pixKey?: string;
  bankCode?: string;
  agency?: string;
  account?: string;
  
  // Referência
  referenceType?: string;
  referenceId?: string;
  
  // Agendamento
  scheduledDate?: string;
  
  // Aprovação
  approvalLevel?: 'auto' | 'manager' | 'director' | 'finance';
  
  // Idempotência
  idempotencyKey?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valida se uma transação pode ser criada/modificada
 */
export const validateTransaction = (
  user: AuthUser | null,
  transaction: CreateTransactionRequest
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!user) {
    errors.push('Usuário não autenticado');
  }
  
  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Valor deve ser maior que zero');
  }
  
  if (transaction.amount > 100000000) { // 1 milhão em centavos
    errors.push('Valor excede limite máximo');
  }
  
  if (!transaction.category) {
    errors.push('Categoria é obrigatória');
  }
  
  if (!transaction.type) {
    errors.push('Tipo de transação é obrigatório');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Verifica se transação requer aprovação
 */
export const requiresApproval = (
  amount: number,
  userRole?: string
): { required: boolean; level: 'auto' | 'manager' | 'director' | 'finance' } => {
  // Limites por nível
  const limits = {
    auto: 100000,        // R$ 1.000
    manager: 500000,   // R$ 5.000
    director: 2000000, // R$ 20.000
    finance: Infinity, // Acima de R$ 20.000
  };
  
  if (userRole === 'ROLE_ADMIN_SISTEMA' || userRole === 'ROLE_DIRETOR_FINANCEIRO') {
    return { required: false, level: 'auto' };
  }
  
  if (amount <= limits.auto) {
    return { required: false, level: 'auto' };
  }
  
  if (amount <= limits.manager) {
    return { required: true, level: 'manager' };
  }
  
  if (amount <= limits.director) {
    return { required: true, level: 'director' };
  }
  
  return { required: true, level: 'finance' };
};

/**
 * Gera ID único para entrada financeira
 */
export const generateEntryId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `fin_${timestamp}_${random}`;
};

/**
 * Gera chave de idempotência para transação
 */
export const generateTransactionKey = (
  type: TransactionType,
  amount: number,
  toPartnerId?: number,
  referenceId?: string
): string => {
  const parts = [
    type,
    amount.toString(),
    toPartnerId?.toString() || 'none',
    referenceId || 'none',
    Date.now().toString(36),
  ];
  return `txn_${parts.join('_')}`;
};

/**
 * Formata valor em centavos para string
 */
export const formatAmount = (cents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

/**
 * Converte string para centavos
 */
export const parseToCents = (value: string | number): number => {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
};

// ============================================
// LEDGER OPERATIONS
// ============================================

/**
 * Cria entrada no ledger (preparado para backend)
 * 
 * NOTA: Esta função prepara os dados para envio ao backend.
 * O backend deve persistir a entrada e calcular o saldo.
 * Transações confirmadas NÃO devem ser editadas diretamente.
 */
export const createLedgerEntry = (
  user: AuthUser | null,
  request: CreateTransactionRequest
): Omit<FinancialEntry, 'id'> => {
  // Valida transação
  const validation = validateTransaction(user, request);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Verifica necessidade de aprovação
  const { required, level } = requiresApproval(request.amount, user?.role);
  
  // Gera IDs
  const entryId = generateEntryId();
  const idempotencyKey = request.idempotencyKey || generateTransactionKey(
    request.type,
    request.amount,
    request.toPartnerId,
    request.referenceId
  );
  
  const entry: Omit<FinancialEntry, 'id'> = {
    entryId,
    idempotencyKey,
    
    type: request.type,
    status: required ? 'pending' : 'processing',
    category: request.category,
    
    amount: request.amount,
    amountFormatted: formatAmount(request.amount),
    currency: 'BRL',
    
    toPartnerId: request.toPartnerId,
    toAccountId: request.toAccountId,
    
    paymentMethod: request.paymentMethod,
    pixKey: request.pixKey,
    bankCode: request.bankCode,
    agency: request.agency,
    account: request.account,
    
    referenceType: request.referenceType,
    referenceId: request.referenceId,
    description: request.description,
    
    effectiveDate: request.scheduledDate || new Date().toISOString(),
    scheduledDate: request.scheduledDate,
    
    requiresApproval: required,
    approvalLevel: level,
    
    createdBy: user?.id || 'system',
    createdByEmail: user?.email || 'system@finqz.com',
    createdAt: new Date().toISOString(),
    
    sourceModule: 'frontend',
    metadata: request.metadata,
  };
  
  // Log de auditoria
  if (user) {
    logFinancialTransaction(
      user,
      'transaction_create',
      entryId,
      request.amount / 100, // Converter para reais para log
      undefined,
      entry as Record<string, unknown>,
      'success'
    );
  }
  
  return entry;
};

/**
 * Cria estorno de transação
 */
export const createReversal = (
  user: AuthUser | null,
  originalEntry: FinancialEntry,
  reason: string
): Omit<FinancialEntry, 'id'> => {
  // Valida que a transação original pode ser estornada
  if (originalEntry.status === 'reversed') {
    throw new Error('Transação já foi estornada');
  }
  
  if (originalEntry.status === 'pending') {
    throw new Error('Transação pendente não pode ser estornada');
  }
  
  if (originalEntry.status === 'failed' || originalEntry.status === 'cancelled') {
    throw new Error('Transação falhou ou cancelada não pode ser estornada');
  }
  
  const entryId = generateEntryId();
  const idempotencyKey = generateTransactionKey(
    'reversal',
    originalEntry.amount,
    originalEntry.toPartnerId,
    originalEntry.entryId
  );
  
  const reversal: Omit<FinancialEntry, 'id'> = {
    entryId,
    idempotencyKey,
    
    type: 'reversal',
    status: 'processing',
    category: originalEntry.category,
    
    amount: originalEntry.amount,
    amountFormatted: formatAmount(originalEntry.amount),
    currency: 'BRL',
    
    toPartnerId: originalEntry.fromPartnerId,
    fromPartnerId: originalEntry.toPartnerId,
    
    description: `Estorno: ${reason}`,
    
    effectiveDate: new Date().toISOString(),
    
    requiresApproval: false,
    approvedBy: user?.id,
    approvedAt: new Date().toISOString(),
    
    reversedBy: user?.id,
    reversedAt: new Date().toISOString(),
    reversalReason: reason,
    originalEntryId: originalEntry.entryId,
    
    createdBy: user?.id || 'system',
    createdByEmail: user?.email || 'system@finqz.com',
    createdAt: new Date().toISOString(),
    
    sourceModule: 'frontend',
  };
  
  // Log de auditoria
  if (user) {
    logFinancialTransaction(
      user,
      'transaction_reverse',
      entryId,
      originalEntry.amount / 100,
      originalEntry as unknown as Record<string, unknown>,
      reversal as Record<string, unknown>,
      'success'
    );
  }
  
  return reversal;
};

/**
 * Calcula saldo da conta a partir do ledger
 * (Função de demonstração - backend deve calcular)
 */
export const calculateBalance = (entries: FinancialEntry[]): {
  balance: number;
  pendingBalance: number;
  availableBalance: number;
} => {
  let balance = 0;
  let pendingBalance = 0;
  
  for (const entry of entries) {
    if (entry.status === 'confirmed' || entry.status === 'reversed') {
      // Soma/diminui do saldo confirmado
      if (entry.type === 'credit' || entry.type === 'refund') {
        balance += entry.amount;
      } else if (entry.type === 'debit' || entry.type === 'reversal') {
        balance -= entry.amount;
      }
    } else if (entry.status === 'pending' || entry.status === 'processing') {
      // Soma ao saldo pendente
      if (entry.type === 'credit' || entry.type === 'refund') {
        pendingBalance += entry.amount;
      }
    }
  }
  
  return {
    balance,
    pendingBalance,
    availableBalance: balance, // Sem pendentes para disponibilidade
  };
};

// ============================================
// EXPORTS
// ============================================

export default {
  // Types
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  PaymentMethod,
  
  // Entry
  FinancialEntry,
  Account,
  CreateTransactionRequest,
  
  // Operations
  createLedgerEntry,
  createReversal,
  calculateBalance,
  
  // Validation
  validateTransaction,
  requiresApproval,
  
  // Utilities
  generateEntryId,
  generateTransactionKey,
  formatAmount,
  parseToCents,
};
