// FINQZ PRO - Integration Layer
// Camada desacoplada para integrações com APIs externas
// Prepared for: Banco, Assinatura Digital, SPC/Serasa, WhatsApp, E-mail, Webhooks, Automations

import { logAudit, AuditEntry, generateIdempotencyKey } from '../utils/audit';
import { AuthUser } from '../auth/permissions';

// ============================================
// TYPES - Tipos base para integrações
// ============================================

// Status de resposta da integração
export type IntegrationStatus = 
  | 'pending'      // Aguardando processamento
  | 'processing'   // Em processamento
  | 'success'      // Sucesso
  | 'failed'       // Falhou
  | 'retrying'     // Tentando novamente
  | 'cancelled';   // Cancelado

// Tipo de integração
export type IntegrationType =
  | 'bank'              // Integração bancária
  | 'digital_signature' // Assinatura digital
  | 'credit_bureau'    // SPC/Serasa
  | 'whatsapp'         // WhatsApp Business
  | 'email'            // E-mail transacional
  | 'webhook'          // Webhooks
  | 'automation'       // Automações
  | 'payment'          // Pagamentos
  | 'pix'              // PIX
  | 'custom';          // Personalizado

// Interface base para respostas de integração
export interface IntegrationResponse<T = unknown> {
  success: boolean;
  status: IntegrationStatus;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp: number;
  requestId?: string;
  idempotencyKey?: string;
}

// Configuração de retry
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatuses?: number[];
}

// Configuração de timeout
export interface TimeoutConfig {
  requestTimeoutMs: number;
  connectionTimeoutMs: number;
}

// Configuração completa de integração
export interface IntegrationConfig {
  baseUrl: string;
  apiKey?: string;
  authToken?: string;
  retry?: RetryConfig;
  timeout?: TimeoutConfig;
  headers?: Record<string, string>;
}

// ============================================
// BASE ADAPTER - Classe base para adapters
// ============================================

/**
 * Base Adapter para todas as integrações
 * Fornece estrutura comum com retry, timeout, logging e idempotência
 */
export abstract class BaseIntegrationAdapter {
  protected config: IntegrationConfig;
  protected type: IntegrationType;
  protected name: string;

  constructor(type: IntegrationType, name: string, config: IntegrationConfig) {
    this.type = type;
    this.name = name;
    this.config = {
      retry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        ...config.retry,
      },
      timeout: {
        requestTimeoutMs: 30000,
        connectionTimeoutMs: 10000,
        ...config.timeout,
      },
      ...config,
    };
  }

  /**
   * Executa request com retry e timeout
   */
  protected async executeWithRetry<T>(
    request: () => Promise<IntegrationResponse<T>>,
    context?: {
      user?: AuthUser;
      entityId?: string;
      action: string;
      description?: string;
    }
  ): Promise<IntegrationResponse<T>> {
    const retryConfig = this.config.retry!;
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retryConfig.maxRetries) {
      try {
        // Executa a request
        const response = await this.executeWithTimeout<T>(request);
        
        // Se sucesso, registra e retorna
        if (response.success) {
          // Log de sucesso se contexto fornecido
          if (context?.user) {
            logAudit(context.user, 'integration', this.getModuleFromType(), context.action,
              context.description || `Integração ${this.name}: ${context.action}`,
              { entityId: context.entityId, result: 'success' }
            );
          }
          return response;
        }

        // Se erro não é retryable, retorna erro
        if (!this.isRetryableError(response)) {
          if (context?.user) {
            logAudit(context.user, 'integration', this.getModuleFromType(), context.action,
              context.description || `Integração ${this.name}: ${context.action}`,
              { entityId: context.entityId, result: 'failure', errorMessage: response.error }
            );
          }
          return response;
        }

        // Erro retryable, tenta novamente
        lastError = new Error(response.error || 'Unknown error');
        attempt++;
        
        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateBackoff(attempt, retryConfig);
          console.log(`[${this.name}] Retry ${attempt}/${retryConfig.maxRetries} em ${delay}ms`);
          await this.sleep(delay);
        }
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateBackoff(attempt, retryConfig);
          console.log(`[${this.name}] Retry ${attempt}/${retryConfig.maxRetries} em ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    // Todas as tentativas falharam
    const finalError = lastError?.message || 'Erro desconhecido após múltiplas tentativas';
    
    if (context?.user) {
      logAudit(context.user, 'integration', this.getModuleFromType(), context.action,
        context.description || `Integração ${this.name}: ${context.action}`,
        { entityId: context.entityId, result: 'failure', errorMessage: finalError }
      );
    }

    return {
      success: false,
      status: 'failed',
      error: finalError,
      timestamp: Date.now(),
    };
  }

  /**
   * Executa request com timeout
   */
  private async executeWithTimeout<T>(
    request: () => Promise<IntegrationResponse<T>>
  ): Promise<IntegrationResponse<T>> {
    const timeoutConfig = this.config.timeout!;
    
    return Promise.race([
      request(),
      new Promise<IntegrationResponse<T>>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout após ${timeoutConfig.requestTimeoutMs}ms`)),
          timeoutConfig.requestTimeoutMs
        )
      ),
    ]) as Promise<IntegrationResponse<T>>;
  }

  /**
   * Verifica se erro é retryable
   */
  protected isRetryableError(response: IntegrationResponse): boolean {
    if (!response.errorCode) return true;
    const retryableCodes = this.config.retry?.retryableStatuses || [500, 502, 503, 504];
    return retryableCodes.some(code => response.errorCode === code.toString());
  }

  /**
   * Calcula delay exponencial com jitter
   */
  protected calculateBackoff(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, config.maxDelayMs);
  }

  /**
   * Sleep utilitário
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gera headers padrão para requests
   */
  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client': 'FINQZ-PRO',
      'X-Client-Version': '1.0.0',
      'X-Request-Timestamp': new Date().toISOString(),
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }

    return headers;
  }

  /**
   * Converte tipo de integração para módulo de audit
   */
  protected getModuleFromType(): 'clientes' | 'financeiro' | 'oportunidades' | 'configuracoes' {
    switch (this.type) {
      case 'credit_bureau':
        return 'clientes';
      case 'bank':
      case 'payment':
      case 'pix':
        return 'financeiro';
      case 'digital_signature':
        return 'oportunidades';
      default:
        return 'configuracoes';
    }
  }

  /**
   * Método abstrato para health check
   */
  abstract healthCheck(): Promise<IntegrationResponse<boolean>>;
}

// ============================================
// ADAPTERS ESPECÍFICOS
// ============================================

/**
 * Adapter para Integração Bancária
 */
export class BankIntegrationAdapter extends BaseIntegrationAdapter {
  constructor(config: IntegrationConfig) {
    super('bank', 'Bank Integration', config);
  }

  /**
   * Consulta saldo conta
   */
  async getBalance(accountId: string, user: AuthUser): Promise<IntegrationResponse<{ balance: number }>> {
    const idempotencyKey = generateIdempotencyKey(user.id, 'get_balance', accountId);
    
    return this.executeWithTimeout(async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/accounts/${accountId}/balance`, {
          method: 'GET',
          headers: this.getDefaultHeaders(),
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`,
            errorCode: response.status.toString(),
            timestamp: Date.now(),
          };
        }

        const data = await response.json();
        return {
          success: true,
          status: 'success',
          data,
          timestamp: Date.now(),
          idempotencyKey,
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: (error as Error).message,
          timestamp: Date.now(),
        };
      }
    }, {
      user,
      entityId: accountId,
      action: 'bank_balance_query',
      description: `Consulta saldo conta ${accountId}`,
    });
  }

  /**
   * Realiza transferência
   */
  async transfer(
    fromAccount: string,
    toAccount: string,
    amount: number,
    user: AuthUser
  ): Promise<IntegrationResponse<{ transactionId: string }>> {
    const idempotencyKey = generateIdempotencyKey(user.id, 'transfer', `${fromAccount}_${toAccount}_${amount}`);

    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/transfers`, {
          method: 'POST',
          headers: this.getDefaultHeaders(),
          body: JSON.stringify({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`,
            errorCode: response.status.toString(),
            timestamp: Date.now(),
            idempotencyKey,
          };
        }

        const data = await response.json();
        return {
          success: true,
          status: 'success',
          data,
          timestamp: Date.now(),
          idempotencyKey,
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: (error as Error).message,
          timestamp: Date.now(),
          idempotencyKey,
        };
      }
    }, {
      user,
      entityId: fromAccount,
      action: 'bank_transfer',
      description: `Transferência R$ ${amount.toFixed(2)}`,
    });
  }

  async healthCheck(): Promise<IntegrationResponse<boolean>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });
      return {
        success: response.ok,
        status: response.ok ? 'success' : 'failed',
        data: response.ok,
        timestamp: Date.now(),
      };
    } catch {
      return {
        success: false,
        status: 'failed',
        error: 'Health check failed',
        timestamp: Date.now(),
      };
    }
  }
}

/**
 * Adapter para Consulta SPC/Serasa
 */
export class CreditBureauAdapter extends BaseIntegrationAdapter {
  constructor(config: IntegrationConfig, private bureau: 'spc' | 'serasa') {
    super('credit_bureau', `${bureau.toUpperCase()} Integration`, config);
  }

  /**
   * Consulta CPF/CNPJ
   */
  async query(cpfCnpj: string, user: AuthUser): Promise<IntegrationResponse<{
    score: number;
    restrictions: string[];
    updatedAt: string;
  }>> {
    const idempotencyKey = generateIdempotencyKey(user.id, `query_${this.bureau}`, cpfCnpj);

    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/query`, {
          method: 'POST',
          headers: this.getDefaultHeaders(),
          body: JSON.stringify({
            document: cpfCnpj,
            bureau: this.bureau,
            idempotencyKey,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`,
            errorCode: response.status.toString(),
            timestamp: Date.now(),
          };
        }

        const data = await response.json();
        return {
          success: true,
          status: 'success',
          data,
          timestamp: Date.now(),
          idempotencyKey,
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: (error as Error).message,
          timestamp: Date.now(),
        };
      }
    }, {
      user,
      entityId: cpfCnpj,
      action: `query_${this.bureau}`,
      description: `Consulta ${this.bureau.toUpperCase()} para ${cpfCnpj.slice(0, 3)}***`,
    });
  }

  async healthCheck(): Promise<IntegrationResponse<boolean>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/status`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });
      return {
        success: response.ok,
        status: response.ok ? 'success' : 'failed',
        data: response.ok,
        timestamp: Date.now(),
      };
    } catch {
      return {
        success: false,
        status: 'failed',
        error: 'Health check failed',
        timestamp: Date.now(),
      };
    }
  }
}

/**
 * Adapter para Assinatura Digital
 */
export class DigitalSignatureAdapter extends BaseIntegrationAdapter {
  constructor(config: IntegrationConfig, private provider: 'authentic' | 'docusign' | 'clicksign') {
    super('digital_signature', `${provider} Integration`, config);
  }

  /**
   * Envia documento para assinatura
   */
  async sendForSignature(
    documentUrl: string,
    signers: Array<{ email: string; name: string }>,
    user: AuthUser
  ): Promise<IntegrationResponse<{ envelopeId: string; signUrl?: string }>> {
    const idempotencyKey = generateIdempotencyKey(user.id, 'send_signature', documentUrl);

    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/envelopes`, {
          method: 'POST',
          headers: this.getDefaultHeaders(),
          body: JSON.stringify({
            documentUrl,
            signers,
            provider: this.provider,
            idempotencyKey,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`,
            errorCode: response.status.toString(),
            timestamp: Date.now(),
          };
        }

        const data = await response.json();
        return {
          success: true,
          status: 'success',
          data,
          timestamp: Date.now(),
          idempotencyKey,
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: (error as Error).message,
          timestamp: Date.now(),
        };
      }
    }, {
      user,
      entityId: documentUrl,
      action: 'send_for_signature',
      description: `Envio para assinatura: ${signers.length} assinante(s)`,
    });
  }

  /**
   * Verifica status da assinatura
   */
  async getSignatureStatus(envelopeId: string, user: AuthUser): Promise<IntegrationResponse<{
    status: 'pending' | 'signed' | 'rejected' | 'expired';
    signedAt?: string;
  }>> {
    return this.executeWithTimeout(async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/envelopes/${envelopeId}/status`, {
          method: 'GET',
          headers: this.getDefaultHeaders(),
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: Date.now(),
          };
        }

        const data = await response.json();
        return {
          success: true,
          status: 'success',
          data,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: (error as Error).message,
          timestamp: Date.now(),
        };
      }
    }, {
      user,
      entityId: envelopeId,
      action: 'get_signature_status',
      description: `Verificação status assinatura: ${envelopeId}`,
    });
  }

  async healthCheck(): Promise<IntegrationResponse<boolean>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });
      return {
        success: response.ok,
        status: response.ok ? 'success' : 'failed',
        data: response.ok,
        timestamp: Date.now(),
      };
    } catch {
      return {
        success: false,
        status: 'failed',
        error: 'Health check failed',
        timestamp: Date.now(),
      };
    }
  }
}

/**
 * Adapter para Webhook
 */
export class WebhookAdapter extends BaseIntegrationAdapter {
  constructor(config: IntegrationConfig) {
    super('webhook', 'Webhook Integration', config);
  }

  /**
   * Envia webhook
   */
  async send<T>(
    event: string,
    payload: T,
    user?: AuthUser
  ): Promise<IntegrationResponse<{ webhookId: string }>> {
    const idempotencyKey = generateIdempotencyKey(user?.id || 'system', `webhook_${event}`, String(Date.now()));

    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/webhooks`, {
          method: 'POST',
          headers: this.getDefaultHeaders(),
          body: JSON.stringify({
            event,
            payload,
            idempotencyKey,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: Date.now(),
          };
        }

        const data = await response.json();
        return {
          success: true,
          status: 'success',
          data,
          timestamp: Date.now(),
          idempotencyKey,
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: (error as Error).message,
          timestamp: Date.now(),
        };
      }
    });
  }

  async healthCheck(): Promise<IntegrationResponse<boolean>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });
      return {
        success: response.ok,
        status: response.ok ? 'success' : 'failed',
        data: response.ok,
        timestamp: Date.now(),
      };
    } catch {
      return {
        success: false,
        status: 'failed',
        error: 'Health check failed',
        timestamp: Date.now(),
      };
    }
  }
}

// ============================================
// FACTORY - Criação de adapters
// ============================================

/**
 * Factory para criar adapters de integração
 */
export class IntegrationFactory {
  private static adapters: Map<string, BaseIntegrationAdapter> = new Map();

  /**
   * Cria adapter bancário
   */
  static createBankAdapter(config: IntegrationConfig): BankIntegrationAdapter {
    const key = 'bank';
    if (!this.adapters.has(key)) {
      this.adapters.set(key, new BankIntegrationAdapter(config));
    }
    return this.adapters.get(key) as BankIntegrationAdapter;
  }

  /**
   * Cria adapter de bureau de crédito
   */
  static createCreditBureauAdapter(
    bureau: 'spc' | 'serasa',
    config: IntegrationConfig
  ): CreditBureauAdapter {
    const key = `credit_bureau_${bureau}`;
    if (!this.adapters.has(key)) {
      this.adapters.set(key, new CreditBureauAdapter(config, bureau));
    }
    return this.adapters.get(key) as CreditBureauAdapter;
  }

  /**
   * Cria adapter de assinatura digital
   */
  static createDigitalSignatureAdapter(
    provider: 'authentic' | 'docusign' | 'clicksign',
    config: IntegrationConfig
  ): DigitalSignatureAdapter {
    const key = `digital_signature_${provider}`;
    if (!this.adapters.has(key)) {
      this.adapters.set(key, new DigitalSignatureAdapter(config, provider));
    }
    return this.adapters.get(key) as DigitalSignatureAdapter;
  }

  /**
   * Cria adapter de webhook
   */
  static createWebhookAdapter(config: IntegrationConfig): WebhookAdapter {
    const key = 'webhook';
    if (!this.adapters.has(key)) {
      this.adapters.set(key, new WebhookAdapter(config));
    }
    return this.adapters.get(key) as WebhookAdapter;
  }

  /**
   * Limpa todos os adapters (útil para testes)
   */
  static clear(): void {
    this.adapters.clear();
  }
}

export default {
  BaseIntegrationAdapter,
  BankIntegrationAdapter,
  CreditBureauAdapter,
  DigitalSignatureAdapter,
  WebhookAdapter,
  IntegrationFactory,
};
