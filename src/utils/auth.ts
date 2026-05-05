// FINQZ PRO - Auth Utilities
// Funções auxiliares para autenticação segura

import { AuthUser } from './permissions';

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  USER_SESSION: 'finqz_user_session',
  AUTH_TOKEN: 'finqz_auth_token',
  TENANT_ID: 'finqz_tenant_id',
} as const;

// ============================================
// SESSION VALIDATION
// ============================================

/**
 * Valida a estrutura básica de um usuário
 */
const isValidUserShape = (user: unknown): user is AuthUser => {
  if (!user || typeof user !== 'object') return false;
  
  const u = user as Record<string, unknown>;
  
  // Campos obrigatórios
  if (typeof u.id !== 'string' && typeof u.id !== 'number') return false;
  if (typeof u.nome !== 'string') return false;
  if (typeof u.email !== 'string') return false;
  
  // Perfil deve ser válido
  if (u.perfil && !['admin', 'parceiro'].includes(u.perfil as string)) {
    return false;
  }
  
  return true;
};

/**
 * Normaliza e valida sessão do usuário do localStorage
 * SECURITY: Não confia em dados do localStorage diretamente
 */
export const normalizeUserSession = (stored: unknown): AuthUser | null => {
  // SECURITY: Validar shape antes de restaurar sessão
  if (!isValidUserShape(stored)) {
    console.warn('SESSION: Sessão inválida detectada, limpando storage');
    clearUserSession();
    return null;
  }
  
  // Criar objeto normalizado
  const normalized: AuthUser = {
    id: String(stored.id),
    nome: stored.nome,
    email: stored.email,
    perfil: stored.perfil || 'parceiro',
    role: stored.role,
    scope: stored.scope,
    parceiroId: stored.parceiroId,
    codigo: stored.codigo,
    permissions: stored.permissions,
  };
  
  // SECURITY: Em produção, não restaurar sessão com dados incompletos
  const isDev = import.meta.env.DEV;
  if (!isDev && (!normalized.id || !normalized.email)) {
    console.warn('SESSION: Sessão incompleta em produção, limpando storage');
    clearUserSession();
    return null;
  }
  
  return normalized;
};

/**
 * Limpa sessão do usuário
 */
export const clearUserSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
  } catch (error) {
    console.error('SESSION: Erro ao limpar sessão', error);
  }
};

/**
 * Salva sessão do usuário de forma segura
 */
export const saveUserSession = (user: AuthUser): void => {
  try {
    // SECURITY: Não salvar senha em localStorage
    const safeUser = { ...user };
    delete (safeUser as Record<string, unknown>).senha;
    
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(safeUser));
  } catch (error) {
    console.error('SESSION: Erro ao salvar sessão', error);
  }
};

/**
 * Restaura sessão do usuário do localStorage
 */
export const restoreUserSession = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return normalizeUserSession(parsed);
  } catch (error) {
    console.error('SESSION: Erro ao restaurar sessão', error);
    clearUserSession();
    return null;
  }
};

// ============================================
// CRYPTO UTILITIES (ETAPA 5)
// ============================================

/**
 * Gera token seguro usando crypto API
 * SECURITY: Substitui Math.random() por crypto.getRandomValues
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  // Converter para hex
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Gera senha temporária segura
 * SECURITY: Substitui Math.random() por crypto.getRandomValues
 */
export const generateSecurePassword = (length: number = 8): string => {
  const letras = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numeros = "0123456789";
  const todos = letras + numeros;
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let senha = '';
  
  // Garantir pelo menos uma letra e um número
  senha += letras[array[0] % letras.length];
  senha += numeros[array[1] % numeros.length];
  
  // Preencher o resto
  for (let i = 2; i < length; i++) {
    senha += todos[array[i] % todos.length];
  }
  
  return senha;
};

// ============================================
// LOGIN VALIDATION
// ============================================

/**
 * Valida identificador de login (email ou código)
 */
export const isValidLoginIdentifier = (identifier: string): boolean => {
  if (!identifier || identifier.trim().length < 3) return false;
  
  // Verificar se é email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier)) return true;
  
  // Verificar se é código de parceiro (P-XXXX ou apenas número)
  const codeRegex = /^P-\d{4}$|^\d+$/;
  return codeRegex.test(identifier);
};

/**
 * Retorna mensagem de erro de validação
 */
export const getLoginValidationError = (identifier: string): string | null => {
  if (!identifier || identifier.trim().length === 0) {
    return "Por favor, informe seu código ou e-mail.";
  }
  
  if (identifier.trim().length < 3) {
    return "Código ou e-mail inválido.";
  }
  
  return null;
};

/**
 * Verifica se é código interno (admin)
 */
export const isInternalAccessCode = (identifier: string): boolean => {
  const code = identifier.trim().toUpperCase();
  return /^\d{4,6}$/.test(code);
};

/**
 * Se é código de parceiro
 */
export const isPartnerAccessCode = (identifier: string): boolean => {
  const code = identifier.trim().toUpperCase();
  return /^P-\d{4}$/.test(code);
};

/**
 * Normaliza input de login (remove espaços, converte para minúsculas)
 */
export const normalizeLoginInput = (input: string): string => {
  return input.trim().toLowerCase();
};

/**
 * Verifica se o input é um código de acesso (não email)
 */
export const isAccessCodeInput = (input: string): boolean => {
  const normalized = input.trim();
  // É código se não contém @
  return !normalized.includes('@');
};
