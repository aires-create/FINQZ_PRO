// FINQZ PRO - Helper Functions
// Funções utilitárias reutilizáveis para formatação e manipulação de dados

// ============================================
// FORMATTERS
// ============================================

/**
 * Formata um valor para moeda brasileira (BRL)
 * @param value - Valor número ou string
 * @returns String formatada ex: "R$ 1.234,56"
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) 
    : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

/**
 * Formata uma data para o padrão brasileiro
 * @param date - Timestamp, Date ou string
 * @param includeTime - Se true, inclui horário
 * @returns String formatada ex: "25/04/2026" ou "25/04/2026 14:30"
 */
export const formatDate = (
  date: number | Date | string | null | undefined,
  includeTime: boolean = false
): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'number' 
    ? new Date(date) 
    : new Date(date);
  
  if (isNaN(dateObj.getTime())) return '-';
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('pt-BR', options);
};

/**
 * Formata um CPF com máscara
 * @param cpf - String com números do CPF
 * @returns String formatada ex: "123.456.789-00"
 */
export const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return cpf;
  
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata um CNPJ com máscara
 * @param cnpj - String com números do CNPJ
 * @returns String formatada ex: "12.345.678/0001-90"
 */
export const formatCNPJ = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '';
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return cnpj;
  
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata um telefone brasileiro com máscara
 * @param phone - String com números do telefone
 * @returns String formatada ex: "(11) 99999-9999" ou "(11) 9999-9999"
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const digits = onlyDigits(phone);
  
  if (digits.length === 11) {
    // Celular: (11) 99999-9999
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 10) {
    // Fixo: (11) 9999-9999
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formata CEP brasileiro
 * @param cep - String com números do CEP
 * @returns String formatada ex: "12345-678"
 */
export const formatCEP = (cep: string | null | undefined): string => {
  if (!cep) return '';
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return cep;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// ============================================
// PARSERS / CONVERTERS
// ============================================

/**
 * Extrai apenas dígitos de uma string
 * @param value - String com números e caracteres
 * @returns Apenas os dígitos
 */
export const onlyDigits = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Converte string de data para timestamp
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Timestamp em milissegundos
 */
export const dateStringToTimestamp = (dateString: string | null | undefined): number => {
  if (!dateString) return 0;
  return new Date(dateString).getTime();
};

/**
 * Converte timestamp para string de data API
 * @param timestamp - Timestamp em milissegundos
 * @returns String no formato YYYY-MM-DD
 */
export const timestampToDateString = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

// ============================================
// SAFE HELPERS
// ============================================

/**
 * Garante que o valor seja um array
 * @param value - Valor que pode ser array ou não
 * @returns Array ou array vazio
 */
export const safeArray = <T>(value: T[] | null | undefined | any): T[] => {
  if (Array.isArray(value)) return value;
  return [];
};

/**
 * Garante que o valor seja um objeto
 * @param value - Valor que pode ser objeto ou não
 * @returns Objeto ou objeto vazio
 */
export const safeObject = <T extends object>(value: T | null | undefined | any): T => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {} as T;
};

/**
 * Retorna valor padrão se o valor for null/undefined
 * @param value - Valor a ser verificado
 * @param defaultValue - Valor padrão
 * @returns O valor ou o padrão
 */
export const orDefault = <T>(value: T | null | undefined, defaultValue: T): T => {
  return value ?? defaultValue;
};

/**
 * Retorna o primeiro item ou padrão
 * @param array - Array de itens
 * @param defaultValue - Valor padrão se array vazio
 * @returns Primeiro item ou padrão
 */
export const firstOrDefault = <T>(array: T[] | null | undefined, defaultValue: T): T => {
  const arr = safeArray(array);
  return arr.length > 0 ? arr[0] : defaultValue;
};

// ============================================
// VALIDATORS
// ============================================

/**
 * Valida CPF
 * @param cpf - String do CPF
 * @returns true se válido
 */
export const isValidCPF = (cpf: string | null | undefined): boolean => {
  if (!cpf) return false;
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  if (parseInt(digits[9]) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(digits[10]) === digit2;
};

/**
 * Valida CNPJ
 * @param cnpj - String do CNPJ
 * @returns true se válido
 */
export const isValidCNPJ = (cnpj: string | null | undefined): boolean => {
  if (!cnpj) return false;
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Validação simplificada - apenas dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const calcDigit = (cnpj: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(cnpj[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  
  return (
    calcDigit(digits, weights1) === parseInt(digits[12]) &&
    calcDigit(digits, weights2) === parseInt(digits[13])
  );
};

/**
 * Valida email
 * @param email - String do email
 * @returns true se válido
 */
export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida telefone brasileiro
 * @param phone - String do telefone
 * @returns true se válido (10 ou 11 dígitos)
 */
export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const digits = onlyDigits(phone);
  return digits.length >= 10 && digits.length <= 11;
};

// ============================================
// UI HELPERS
// ============================================

/**
 * Gera cor aleatória em hex
 * @returns Cor em formato hex
 */
export const randomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Trunca texto com reticências
 * @param text - Texto original
 * @param maxLength - Tamanho máximo
 * @returns Texto truncado
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Gera iniciais de nome
 * @param name - Nome completo
 * @returns Iniciais (ex: "João Silva" -> "JS")
 */
export const getInitials = (name: string | null | undefined): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Capitaliza primeira letra de cada palavra
 * @param text - Texto original
 * @returns Texto capitalizado
 */
export const capitalizeWords = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formata status para exibição
 * @param status - Status em snake_case
 * @returns Status formatado (ex: "nao_perturbe" -> "Não Perturbe")
 */
export const formatStatus = (status: string | null | undefined): string => {
  if (!status) return '';
  const statusMap: Record<string, string> = {
    'ativo': 'Ativo',
    'inativo': 'Inativo',
    'pendente': 'Pendente',
    'aprovado': 'Aprovado',
    'reprovado': 'Reprovado',
    'cancelado': 'Cancelado',
    'encerrado': 'Encerrado',
    'nao_perturbe': 'Não Perturbe',
    'novo_lead': 'Novo Lead',
    'negociacao': 'Negociação',
    'aguardando_assinatura': 'Aguardando Assinatura',
    'pendencia': 'Pendência',
    'formalizacao': 'Formalização',
    'integrado': 'Integrado',
    'perdido': 'Perdido',
    'triagem': 'Triagem',
    'analise': 'Análise',
    'aprovacao': 'Aprovação',
    'documentacao': 'Documentação',
    'liberacao': 'Liberação',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// ============================================
// OBJECT HELPERS
// ============================================

/**
 * Remove propriedades undefined de um objeto
 * @param obj - Objeto original
 * @returns Objeto sem propriedades undefined
 */
export const removeUndefined = <T extends object>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Clona objeto profundamente
 * @param obj - Objeto a clonar
 * @returns Clone do objeto
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Mescla objetos (obj2 sobrescreve obj1)
 * @param obj1 - Objeto base
 * @param obj2 - Objeto com sobrescritas
 * @returns Objeto mesclado
 */
export const mergeObjects = <T extends object>(obj1: T, obj2: Partial<T>): T => {
  return { ...obj1, ...obj2 };
};
