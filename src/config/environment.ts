// FINQZ PRO - Environment Configuration
// Configurações de ambiente para desenvolvimento e produção

// ============================================
// ENVIRONMENT FLAGS
// ============================================

// SECURITY: Modo de desenvolvimento controlado por variável de ambiente
// Em produção, FORçar uso de API real (não mocks)
export const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// SECURITY: Validar API_BASE_URL obrigatória em produção
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Se variável de ambiente está definida, usá-la
  if (envUrl) {
    return envUrl;
  }
  
  // Em produção, mostrar warning mas não quebrar (fallback para ambiente Youware)
  if (import.meta.env.PROD) {
    console.warn('WARNING: VITE_API_BASE_URL não definida em produção, usando fallback Youware');
    // Fallback para ambiente Youware - não quebra a aplicação
    return 'https://staging--81irdofnlgfsx9dqddsk.youbase.cloud';
  }
  
  // Em desenvolvimento, usar fallback local
  console.warn('DEV: VITE_API_BASE_URL não definida, usando fallback de desenvolvimento');
  return 'http://localhost:8787';
};

// Use mocks/data local when API is not available (APENAS em modo DEV explícito)
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' && IS_DEV_MODE;

// Base URL da API
export const API_BASE_URL = getApiBaseUrl();

// Modo de desenvolvimento
export const IS_DEV = import.meta.env.DEV;

// Modo de produção
export const IS_PROD = import.meta.env.PROD;

// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  // Timeout em ms para requisições
  TIMEOUT: 30000,
  
  // Número de tentativas em caso de erro
  RETRY_ATTEMPTS: 3,
  
  // Intervalo entre tentativas (ms)
  RETRY_DELAY: 1000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// ============================================
// ENDPOINTS
// ============================================

// Helper para gerar endpoints com ID
const getEndpoint = (base: string, id: number) => `${base}/${id}`;

export const ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // Dashboard
  DASHBOARD: {
    KPIs: '/api/dashboard/kpis',
    PRODUCAO: '/api/dashboard/producao',
    FUNIL: '/api/dashboard/funil',
    ESTATISTICAS: '/api/dashboard/estatisticas',
  },
  
  // Clientes
  CLIENTES: {
    LIST: '/api/clientes',
    GET: (id: number) => getEndpoint('/api/clientes', id),
    CREATE: '/api/clientes',
    UPDATE: (id: number) => getEndpoint('/api/clientes', id),
    DELETE: (id: number) => getEndpoint('/api/clientes', id),
    SEARCH: '/api/clientes/search',
  },
  
  // Oportunidades
  OPORTUNIDADES: {
    LIST: '/api/oportunidades',
    GET: (id: number) => getEndpoint('/api/oportunidades', id),
    CREATE: '/api/oportunidades',
    UPDATE: (id: number) => getEndpoint('/api/oportunidades', id),
    DELETE: (id: number) => getEndpoint('/api/oportunidades', id),
    PIPELINE: '/api/oportunidades/pipeline',
    MOVER: (id: number) => `${getEndpoint('/api/oportunidades', id)}/mover`,
    DOCUMENTOS: (id: number) => getEndpoint('/api/documentos', id),
  },
  
  // Parceiros
  PARCEIROS: {
    LIST: '/api/parceiros',
    GET: (id: number) => getEndpoint('/api/parceiros', id),
    CREATE: '/api/parceiros',
    UPDATE: (id: number) => getEndpoint('/api/parceiros', id),
    DELETE: (id: number) => getEndpoint('/api/parceiros', id),
    RESET_SENHA: (id: number) => `${getEndpoint('/api/parceiros', id)}/reset-senha`,
    TOGGLE_STATUS: (id: number) => `${getEndpoint('/api/parceiros', id)}/toggle-status`,
  },
  
  // Usuários
  USUARIOS: {
    LIST: '/api/usuarios',
    GET: (id: number) => getEndpoint('/api/usuarios', id),
    CREATE: '/api/usuarios',
    UPDATE: (id: number) => getEndpoint('/api/usuarios', id),
    DELETE: (id: number) => getEndpoint('/api/usuarios', id),
    TOGGLE_STATUS: (id: number) => `${getEndpoint('/api/usuarios', id)}/toggle-status`,
  },
  
  // Produtos
  PRODUTOS: {
    LIST: '/api/produtos',
    GET: (id: number) => getEndpoint('/api/produtos', id),
    CREATE: '/api/produtos',
    UPDATE: (id: number) => getEndpoint('/api/produtos', id),
    DELETE: (id: number) => getEndpoint('/api/produtos', id),
  },
  
  // Financeiro
  FINANCEIRO: {
    TRANSACOES: '/api/financeiro/transacoes',
    SALDO: '/api/financeiro/saldo',
    EXTRATO: '/api/financeiro/extrato',
    CREATE_TRANSACAO: '/api/financeiro/transacoes',
    UPDATE_TRANSACAO: (id: number) => getEndpoint('/api/financeiro/transacoes', id),
  },
  
  // Comissões
  COMISSOES: {
    LIST: '/api/comissoes',
    RESUMO: '/api/comissoes/resumo',
    UPDATE: (id: number) => getEndpoint('/api/comissoes', id),
  },
  
  // Conta Corrente
  CONTA_CORRENTE: {
    MOVIMENTOS: '/api/conta-corrente/movimentos',
    SALDO: '/api/conta-corrente/saldo',
  },
  
  // Automações
  AUTOMACOES: {
    LIST: '/api/automacoes',
    GET: (id: number) => getEndpoint('/api/automacoes', id),
    CREATE: '/api/automacoes',
    UPDATE: (id: number) => getEndpoint('/api/automacoes', id),
    DELETE: (id: number) => getEndpoint('/api/automacoes', id),
    TOGGLE: (id: number) => `${getEndpoint('/api/automacoes', id)}/toggle-status`,
    EXECUTE: (id: number) => `${getEndpoint('/api/automacoes', id)}/execute`,
  },
  
  // Estrutura Comercial
  ESTRUTURA_COMERCIAL: {
    LIST: '/api/estrutura-comercial',
    GET: (id: number) => getEndpoint('/api/estrutura-comercial', id),
    CREATE: '/api/estrutura-comercial',
    UPDATE: (id: number) => getEndpoint('/api/estrutura-comercial', id),
    DELETE: (id: number) => getEndpoint('/api/estrutura-comercial', id),
  },
  
  // Roteiros Operacionais
  ROTEIROS: {
    LIST: '/api/roteiros-operacionais',
    GET: (id: number) => getEndpoint('/api/roteiros-operacionais', id),
    CREATE: '/api/roteiros-operacionais',
    UPDATE: (id: number) => getEndpoint('/api/roteiros-operacionais', id),
    DELETE: (id: number) => getEndpoint('/api/roteiros-operacionais', id),
  },
  
  // Relatórios
  RELATORIOS: {
    PRODUCAO: '/api/relatorios/producao',
    COMISSOES: '/api/relatorios/comissoes',
    CONSOLIDADO: '/api/relatorios/consolidado',
    ANALITICO: '/api/relatorios/analitico',
  },
  
  // Configurações
  CONFIGURACOES: {
    PIPELINES: '/api/configuracoes/pipelines',
    TAGS: '/api/configuracoes/tags',
    CAMPOS: '/api/configuracoes/campos',
  },
};

// ============================================
// INTEGRATION CONFIG (Future)
// ============================================

export const INTEGRATIONS = {
  // Bancos
  BANCOS: {
    enabled: false,
    endpoints: {
      consulta: '/api/integracoes/bancos/consulta',
      transferencia: '/api/integracoes/bancos/transferencia',
      extrato: '/api/integracoes/bancos/extrato',
    },
  },
  
  // Promotoras
  PROMOTORAS: {
    enabled: false,
    endpoints: {
      consulta: '/api/integracoes/promotoras/consulta',
      simulacao: '/api/integracoes/promotoras/simulacao',
      contratacao: '/api/integracoes/promotoras/contratacao',
    },
  },
  
  // WhatsApp
  WHATSAPP: {
    enabled: false,
    provider: 'zenvia',
    endpoints: {
      send: '/api/integracoes/whatsapp/send',
      status: '/api/integracoes/whatsapp/status',
      template: '/api/integracoes/whatsapp/template',
    },
  },
  
  // Email
  EMAIL: {
    enabled: false,
    provider: 'smtp',
    endpoints: {
      send: '/api/integracoes/email/send',
      template: '/api/integracoes/email/template',
    },
  },
  
  // Webhooks
  WEBHOOKS: {
    enabled: false,
    endpoints: {
      register: '/api/integracoes/webhooks/register',
      events: '/api/integracoes/webhooks/events',
    },
  },
  
  // Automações
  AUTOMACOES: {
    enabled: false,
    endpoints: {
      trigger: '/api/integracoes/automacoes/trigger',
      history: '/api/integracoes/automacoes/history',
    },
  },
  
  // BI / Relatórios
  BI: {
    enabled: false,
    endpoints: {
      query: '/api/integracoes/bi/query',
      export: '/api/integracoes/bi/export',
      dashboard: '/api/integracoes/bi/dashboard',
    },
  },
};

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  USER: 'finqz_user',
  TOKEN: 'finqz_token',
  REFRESH_TOKEN: 'finqz_refresh_token',
  THEME: 'finqz_theme',
  SIDEBAR: 'finqz_sidebar',
  FILTERS: 'finqz_filters',
};

// ============================================
// EXPORTS
// ============================================

export default {
  USE_MOCKS,
  API_BASE_URL,
  IS_DEV,
  IS_PROD,
  API_CONFIG,
  ENDPOINTS,
  INTEGRATIONS,
  STORAGE_KEYS,
};
