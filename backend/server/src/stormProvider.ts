/**
 * NOVA PROMOTORA / Storm Integration Provider
 * 
 * Secure integration service for Storm CRM
 * Credentials are stored as environment variables and never exposed in logs/responses
 */

import type { Client } from "@sdk/server-types";
import { tables } from "@generated";
import { eq } from "drizzle-orm";

// ============================================
// TYPES
// ============================================

export interface StormConfig {
  baseUrl: string;
  apiKey: string;
  username: string;
  password: string;
  enabled: boolean;
}

export interface StormProposal {
  id?: string;
  customerName: string;
  customerDocument: string;
  customerEmail: string;
  customerPhone: string;
  productCode: string;
  productName: string;
  premium: number;
  paymentMethod: string;
  beneficiaryName?: string;
  beneficiaryDocument?: string;
}

export interface StormProposalStatus {
  proposalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  statusDate: string;
  observations?: string;
}

export interface StormCredentials {
  apiKey: string;
  username: string;
  password: string;
}

export interface StormTestResult {
  success: boolean;
  provider: string;
  message: string;
  checkedAt: string;
}

// ============================================
// ENVIRONMENT VARIABLES (set via Youbase secrets)
// ============================================

// These are read from process.env in Youbase/EdgeSpark
// ST少: STORM_BASE_URL, STORM_API_KEY, STORM_USERNAME, STORM_PASSWORD, STORM_ENABLED

function getStormConfig(): StormConfig {
  return {
    baseUrl: process.env.STORM_BASE_URL || '',
    apiKey: process.env.STORM_API_KEY || '',
    username: process.env.STORM_USERNAME || '',
    password: process.env.STORM_PASSWORD || '',
    enabled: process.env.STORM_ENABLED === 'true',
  };
}

// ============================================
// LOGGING (SANITIZED - no credentials)
// ============================================

type LogLevel = 'info' | 'warn' | 'error';

function logStormAction(
  edgespark: Client<typeof tables>,
  level: LogLevel,
  action: string,
  details: Record<string, unknown>
) {
  // NEVER log credentials - sanitize all sensitive data
  const sanitizedDetails = {
    ...details,
    // Remove sensitive fields
    apiKey: details.apiKey ? '[REDACTED]' : undefined,
    password: details.password ? '[REDACTED]' : undefined,
    token: details.token ? `[REDACTED:${(details.token as string).slice(0, 8)}...]` : undefined,
    fullToken: undefined,
  };

  const logMessage = `[STORM:${action.toUpperCase()}] ${JSON.stringify(sanitizedDetails)}`;
  
  if (level === 'error') {
    console.error(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  // Optionally emit event for audit trail
  // Note: Don't include sensitive data in events either
}

// ============================================
// SERVICE METHODS
// ============================================

/**
 * Validate credentials format without making API calls
 */
export function validateCredentials(config: StormConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('URL base não configurada');
  }

  if (!config.apiKey) {
    errors.push('Chave API não configurada');
  }

  if (!config.username) {
    errors.push('Usuário não configurado');
  }

  if (!config.password) {
    errors.push('Senha não configurada');
  }

  // Validate URL format
  if (config.baseUrl && !/^https?:\/\/.+/.test(config.baseUrl)) {
    errors.push('URL base inválida');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Authenticate with Storm API and get access token
 * Returns sanitized result - never exposes full token
 */
export async function authenticate(
  edgespark: Client<typeof tables>
): Promise<{ success: boolean; token?: string; message: string }> {
  const config = getStormConfig();

  // Log authentication attempt (sanitized)
  logStormAction(edgespark, 'info', 'authenticate', {
    baseUrl: config.baseUrl,
    username: config.username,
    hasApiKey: !!config.apiKey,
    hasPassword: !!config.password,
  });

  // Check if integration is enabled
  if (!config.enabled) {
    logStormAction(edgespark, 'warn', 'authenticate', {
      message: 'Integração Storm desativada',
    });
    return {
      success: false,
      message: 'Integração Storm desativada',
    };
  }

  // Validate credentials first
  const validation = validateCredentials(config);
  if (!validation.valid) {
    logStormAction(edgespark, 'error', 'authenticate', {
      message: 'Credenciais inválidas',
      errors: validation.errors,
    });
    return {
      success: false,
      message: `Credenciais inválidas: ${validation.errors.join(', ')}`,
    };
  }

  try {
    // Make authentication request
    const authUrl = `${config.baseUrl}/auth/login`;
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStormAction(edgespark, 'error', 'authenticate', {
        status: response.status,
        message: 'Falha na autenticação',
      });
      return {
        success: false,
        message: `Erro na autenticação: ${response.status}`,
      };
    }

    const data = await response.json() as { token?: string; access_token?: string };
    const token = data.token || data.access_token;

    if (!token) {
      logStormAction(edgespark, 'error', 'authenticate', {
        message: 'Token não retornado pela API',
      });
      return {
        success: false,
        message: 'Token não retornado pela API',
      };
    }

    logStormAction(edgespark, 'info', 'authenticate', {
      success: true,
      message: 'Autenticação OK',
    });

    return {
      success: true,
      token,
      message: 'Autenticação realizada com sucesso',
    };
  } catch (error) {
    logStormAction(edgespark, 'error', 'authenticate', {
      message: 'Erro de conexão',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Send proposal to Storm API
 */
export async function sendProposal(
  edgespark: Client<typeof tables>,
  proposal: StormProposal
): Promise<{ success: boolean; proposalId?: string; message: string }> {
  const config = getStormConfig();

  // Log proposal attempt (sanitized)
  logStormAction(edgespark, 'info', 'send_proposal', {
    customerName: proposal.customerName,
    customerDocument: proposal.customerDocument ? `[DOC:${proposal.customerDocument.slice(-4)}]` : undefined,
    productCode: proposal.productCode,
    premium: proposal.premium,
  });

  // Check if integration is enabled - use simulation mode if disabled
  if (!config.enabled) {
    logStormAction(edgespark, 'warn', 'send_proposal', {
      message: 'Modo simulado - integração desativada',
    });
    return {
      success: true,
      proposalId: `SIM-${Date.now()}`,
      message: 'Proposta enviada em modo simulado (Storm desativado)',
    };
  }

  try {
    // First authenticate
    const auth = await authenticate(edgespark);
    if (!auth.success || !auth.token) {
      return {
        success: false,
        message: auth.message,
      };
    }

    // Send proposal
    const proposalUrl = `${config.baseUrl}/proposals`;
    const response = await fetch(proposalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({
        cliente: {
          nome: proposal.customerName,
          cpf_cnpj: proposal.customerDocument,
          email: proposal.customerEmail,
          telefone: proposal.customerPhone,
        },
        produto: {
          codigo: proposal.productCode,
          nome: proposal.productName,
        },
        premio: proposal.premium,
        forma_pagamento: proposal.paymentMethod,
        beneficiario: proposal.beneficiaryName ? {
          nome: proposal.beneficiaryName,
          cpf: proposal.beneficiaryDocument,
        } : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStormAction(edgespark, 'error', 'send_proposal', {
        status: response.status,
        message: 'Falha ao enviar proposta',
      });
      return {
        success: false,
        message: `Erro ao enviar proposta: ${response.status}`,
      };
    }

    const data = await response.json() as { id?: string; proposta?: string };
    const proposalId = data.id || data.proposta || `PROP-${Date.now()}`;

    logStormAction(edgespark, 'info', 'send_proposal', {
      success: true,
      proposalId,
    });

    return {
      success: true,
      proposalId,
      message: 'Proposta enviada com sucesso',
    };
  } catch (error) {
    logStormAction(edgespark, 'error', 'send_proposal', {
      message: 'Erro ao enviar proposta',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      message: `Erro ao enviar proposta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Get proposal status from Storm API
 */
export async function getProposalStatus(
  edgespark: Client<typeof tables>,
  proposalId: string
): Promise<{ success: boolean; status?: StormProposalStatus; message: string }> {
  const config = getStormConfig();

  logStormAction(edgespark, 'info', 'get_proposal_status', {
    proposalId,
  });

  // Check if integration is enabled - use simulation mode if disabled
  if (!config.enabled) {
    logStormAction(edgespark, 'warn', 'get_proposal_status', {
      message: 'Modo simulado - integração desativada',
    });
    return {
      success: true,
      status: {
        proposalId,
        status: 'pending',
        statusDate: new Date().toISOString(),
        observations: 'Modo simulado - Storm desativado',
      },
      message: 'Status consultado em modo simulado',
    };
  }

  try {
    // First authenticate
    const auth = await authenticate(edgespark);
    if (!auth.success || !auth.token) {
      return {
        success: false,
        message: auth.message,
      };
    }

    // Get proposal status
    const statusUrl = `${config.baseUrl}/proposals/${proposalId}/status`;
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      logStormAction(edgespark, 'error', 'get_proposal_status', {
        status: response.status,
        message: 'Falha ao consultar status',
      });
      return {
        success: false,
        message: `Erro ao consultar status: ${response.status}`,
      };
    }

    const data = await response.json() as {
      id: string;
      status: 'pending' | 'approved' | 'rejected' | 'cancelled';
      data_status: string;
      observacoes?: string;
    };

    logStormAction(edgespark, 'info', 'get_proposal_status', {
      success: true,
      status: data.status,
    });

    return {
      success: true,
      status: {
        proposalId: data.id,
        status: data.status,
        statusDate: data.data_status,
        observations: data.observacoes,
      },
      message: 'Status consultado com sucesso',
    };
  } catch (error) {
    logStormAction(edgespark, 'error', 'get_proposal_status', {
      message: 'Erro ao consultar status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      message: `Erro ao consultar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Sync tables from Storm (e.g., products, tables)
 */
export async function syncTables(
  edgespark: Client<typeof tables>,
  tableName: string
): Promise<{ success: boolean; data?: unknown[]; message: string }> {
  const config = getStormConfig();

  logStormAction(edgespark, 'info', 'sync_tables', {
    tableName,
  });

  // Check if integration is enabled - use simulation mode if disabled
  if (!config.enabled) {
    logStormAction(edgespark, 'warn', 'sync_tables', {
      message: 'Modo simulado - integração desativada',
    });
    return {
      success: true,
      data: [],
      message: `Sincronização de ${tableName} em modo simulado (Storm desativado)`,
    };
  }

  try {
    const auth = await authenticate(edgespark);
    if (!auth.success || !auth.token) {
      return {
        success: false,
        message: auth.message,
      };
    }

    const syncUrl = `${config.baseUrl}/sync/${tableName}`;
    const response = await fetch(syncUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      logStormAction(edgespark, 'error', 'sync_tables', {
        status: response.status,
        message: 'Falha ao sincronizar',
      });
      return {
        success: false,
        message: `Erro ao sincronizar: ${response.status}`,
      };
    }

    const data = await response.json() as unknown[];

    logStormAction(edgespark, 'info', 'sync_tables', {
      success: true,
      recordCount: data.length,
    });

    return {
      success: true,
      data,
      message: `${data.length} registros sincronizados`,
    };
  } catch (error) {
    logStormAction(edgespark, 'error', 'sync_tables', {
      message: 'Erro ao sincronizar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      message: `Erro ao sincronizar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Sync commissions from Storm
 */
export async function syncCommissions(
  edgespark: Client<typeof tables>,
  period?: { start: string; end: string }
): Promise<{ success: boolean; data?: unknown[]; message: string }> {
  const config = getStormConfig();

  logStormAction(edgespark, 'info', 'sync_commissions', {
    period,
  });

  // Check if integration is enabled - use simulation mode if disabled
  if (!config.enabled) {
    logStormAction(edgespark, 'warn', 'sync_commissions', {
      message: 'Modo simulado - integração desativada',
    });
    return {
      success: true,
      data: [],
      message: 'Sincronização de comissões em modo simulado (Storm desativado)',
    };
  }

  try {
    const auth = await authenticate(edgespark);
    if (!auth.success || !auth.token) {
      return {
        success: false,
        message: auth.message,
      };
    }

    let commissionsUrl = `${config.baseUrl}/commissions`;
    if (period) {
      commissionsUrl += `?start=${period.start}&end=${period.end}`;
    }

    const response = await fetch(commissionsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      logStormAction(edgespark, 'error', 'sync_commissions', {
        status: response.status,
        message: 'Falha ao sincronizar comissões',
      });
      return {
        success: false,
        message: `Erro ao sincronizar comissões: ${response.status}`,
      };
    }

    const data = await response.json() as unknown[];

    logStormAction(edgespark, 'info', 'sync_commissions', {
      success: true,
      recordCount: data.length,
    });

    return {
      success: true,
      data,
      message: `${data.length} comissões sincronizadas`,
    };
  } catch (error) {
    logStormAction(edgespark, 'error', 'sync_commissions', {
      message: 'Erro ao sincronizar comissões',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      message: `Erro ao sincronizar comissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Test Storm connection - returns sanitized result
 */
export async function testStormConnection(
  edgespark: Client<typeof tables>
): Promise<StormTestResult> {
  const config = getStormConfig();
  const checkedAt = new Date().toISOString();

  // Log test attempt (sanitized)
  logStormAction(edgespark, 'info', 'test_connection', {
    baseUrl: config.baseUrl,
    hasApiKey: !!config.apiKey,
    hasUsername: !!config.username,
    hasPassword: !!config.password,
    enabled: config.enabled,
  });

  // Check if integration is enabled
  if (!config.enabled) {
    logStormAction(edgespark, 'warn', 'test_connection', {
      message: 'Integração Storm desativada',
    });
    return {
      success: false,
      provider: 'storm',
      message: 'Integração Storm desativada. Ative via variáveis de ambiente.',
      checkedAt,
    };
  }

  // Validate credentials format
  const validation = validateCredentials(config);
  if (!validation.valid) {
    logStormAction(edgespark, 'error', 'test_connection', {
      message: 'Credenciais inválidas',
      errors: validation.errors,
    });
    return {
      success: false,
      provider: 'storm',
      message: `Configuração inválida: ${validation.errors.join(', ')}`,
      checkedAt,
    };
  }

  // Try to authenticate
  const auth = await authenticate(edgespark);

  if (auth.success) {
    logStormAction(edgespark, 'info', 'test_connection', {
      success: true,
      message: 'Conexão OK',
    });
    return {
      success: true,
      provider: 'storm',
      message: 'Conexão estabelecida com sucesso',
      checkedAt,
    };
  } else {
    logStormAction(edgespark, 'error', 'test_connection', {
      success: false,
      message: auth.message,
    });
    return {
      success: false,
      provider: 'storm',
      message: auth.message,
      checkedAt,
    };
  }
}
