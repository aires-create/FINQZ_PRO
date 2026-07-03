// FINQZ PRO - Auth Utilities
// Funções auxiliares para autenticação segura

// ============================================
// CRYPTO UTILITIES
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
