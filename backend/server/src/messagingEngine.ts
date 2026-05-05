// ============================================
// MESSAGING ENGINE - Serviço Central de Envio
// ============================================
// Abstrai providers de envio (WhatsApp, SMS, Email)
// Suporta múltiplos provedores com fallback

export type MessageProvider = 'whatsapp' | 'sms' | 'email';
export type MessageStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed';

export interface Message {
  id?: number;
  campaignId?: number;
  provider: MessageProvider;
  to: string;
  content: string;
  mediaUrl?: string;
  status: MessageStatus;
  externalId?: string;
  error?: string;
  sentAt?: number;
  deliveredAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MessageResult {
  success: boolean;
  externalId?: string;
  error?: string;
  provider: MessageProvider;
}

// Interface que todos os providers devem implementar
export interface IMessageProvider {
  name: MessageProvider;
  send(to: string, content: string, options?: { mediaUrl?: string }): Promise<MessageResult>;
  getStatus(externalId: string): Promise<MessageStatus>;
  getRateLimit(): { perMinute: number; perHour: number };
}

// ============================================
// PROVIDERS
// ============================================

// Provider base abstrato
abstract class BaseProvider implements IMessageProvider {
  abstract name: MessageProvider;
  protected rateLimiter: { perMinute: number; perHour: number };

  constructor(rateLimit: { perMinute: number; perHour: number }) {
    this.rateLimiter = rateLimit;
  }

  abstract send(to: string, content: string, options?: { mediaUrl?: string }): Promise<MessageResult>;
  abstract getStatus(externalId: string): Promise<MessageStatus>;
  
  getRateLimit(): { perMinute: number; perHour: number } {
    return this.rateLimiter;
  }
}

// Provider WhatsApp (stub - implementar com API real)
export class WhatsAppProvider extends BaseProvider {
  name: MessageProvider = 'whatsapp';

  constructor(rateLimit?: { perMinute: number; perHour: number }) {
    super(rateLimit || { perMinute: 60, perHour: 1000 }); // Limites do WhatsApp Business
  }

  async send(to: string, content: string, options?: { mediaUrl?: string }): Promise<MessageResult> {
    try {
      // Aqui seria a integração real com WhatsApp API
      // Por agora, simulamos o envio
      console.log(`[WhatsApp] Enviando mensagem para ${to}:`, content.substring(0, 50));
      
      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        externalId: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider: 'whatsapp'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'whatsapp'
      };
    }
  }

  async getStatus(externalId: string): Promise<MessageStatus> {
    // Aqui seria a verificação real de status
    return 'delivered';
  }
}

// Provider SMS (stub - implementar com API real)
export class SMSProvider extends BaseProvider {
  name: MessageProvider = 'sms';

  constructor(rateLimit?: { perMinute: number; perHour: number }) {
    super(rateLimit || { perMinute: 100, perHour: 5000 });
  }

  async send(to: string, content: string, options?: { mediaUrl?: string }): Promise<MessageResult> {
    try {
      console.log(`[SMS] Enviando SMS para ${to}:`, content.substring(0, 50));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        externalId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider: 'sms'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'sms'
      };
    }
  }

  async getStatus(externalId: string): Promise<MessageStatus> {
    return 'delivered';
  }
}

// Provider Email (stub)
export class EmailProvider extends BaseProvider {
  name: MessageProvider = 'email';

  constructor(rateLimit?: { perMinute: number; perHour: number }) {
    super(rateLimit || { perMinute: 300, perHour: 10000 });
  }

  async send(to: string, content: string, options?: { mediaUrl?: string }): Promise<MessageResult> {
    try {
      console.log(`[Email] Enviando email para ${to}:`, content.substring(0, 50));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        externalId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider: 'email'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'email'
      };
    }
  }

  async getStatus(externalId: string): Promise<MessageStatus> {
    return 'delivered';
  }
}

// ============================================
// MESSAGING ENGINE
// ============================================

export class MessagingEngine {
  private providers: Map<MessageProvider, IMessageProvider> = new Map();
  private defaultProvider: MessageProvider = 'whatsapp';
  private fallbackProviders: MessageProvider[] = ['whatsapp', 'sms', 'email'];
  private rateLimiter: Map<MessageProvider, { count: number; resetAt: number }> = new Map();

  constructor(config?: { providers?: IMessageProvider[] }) {
    // Se providers forem passados, registra eles
    if (config?.providers) {
      for (const provider of config.providers) {
        this.registerProvider(provider);
      }
    } else {
      // Registra os providers padrão
      this.registerProvider(new WhatsAppProvider());
      this.registerProvider(new SMSProvider());
      this.registerProvider(new EmailProvider());
    }
  }

  // Registra um provider
  registerProvider(provider: IMessageProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`[Messaging] Provider registrado: ${provider.name}`);
  }

  // Define o provider padrão
  setDefaultProvider(provider: MessageProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider não encontrado: ${provider}`);
    }
    this.defaultProvider = provider;
    console.log(`[Messaging] Provider padrão: ${provider}`);
  }

  // Define ordem de fallback
  setFallbackOrder(providers: MessageProvider[]): void {
    this.fallbackProviders = providers;
  }

  // Envia mensagem com retry automático
  async send(
    to: string, 
    content: string, 
    options?: { 
      provider?: MessageProvider; 
      mediaUrl?: string;
      campaignId?: number;
      db?: any;
      tables?: any;
    }
  ): Promise<MessageResult> {
    const providerName = options?.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      return { success: false, error: `Provider não encontrado: ${providerName}`, provider: providerName };
    }

    // Verifica rate limit
    if (!this.checkRateLimit(providerName)) {
      // Tenta fallback
      return this.sendWithFallback(to, content, options);
    }

    // Incrementa contador de rate limit
    this.incrementRateLimit(providerName);

    // Persiste a mensagem
    let messageId: number | undefined;
    if (options?.db && options?.tables) {
      const result = await options.db.insert(options.tables.mensagensCampanha).values({
        campaignId: options.campaignId || null,
        provider: providerName,
        recipient: to,
        content,
        mediaUrl: options.mediaUrl || null,
        status: 'sending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      messageId = result.lastInsertRowid;
    }

    // Envia a mensagem
    const result = await provider.send(to, content, { mediaUrl: options?.mediaUrl });

    // Atualiza status da mensagem
    if (options?.db && options?.tables && messageId) {
      await options.db
        .update(options.tables.mensagens)
        .set({
          status: result.success ? 'sent' : 'failed',
          externalId: result.externalId || null,
          error: result.error || null,
          sentAt: result.success ? Date.now() : null,
          updatedAt: Date.now(),
        })
        .where(eq(options.tables.mensagens.id, messageId));
    }

    if (!result.success) {
      // Tenta fallback se falhar
      console.warn(`[Messaging] Falha ao enviar com ${providerName}, tentando fallback...`);
      return this.sendWithFallback(to, content, options);
    }

    return result;
  }

  // Envia com fallback automático
  private async sendWithFallback(
    to: string, 
    content: string, 
    options?: { provider?: MessageProvider; mediaUrl?: string; campaignId?: number; db?: any; tables?: any }
  ): Promise<MessageResult> {
    for (const providerName of this.fallbackProviders) {
      if (options?.provider === providerName) continue;
      
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      if (!this.checkRateLimit(providerName)) continue;
      this.incrementRateLimit(providerName);

      try {
        const result = await provider.send(to, content, { mediaUrl: options?.mediaUrl });
        if (result.success) {
          console.log(`[Messaging] Enviado com fallback: ${providerName}`);
          return result;
        }
      } catch (error) {
        console.error(`[Messaging] Erro no fallback ${providerName}:`, error);
      }
    }

    return { success: false, error: 'Todos os providers falharam', provider: 'whatsapp' as MessageProvider };
  }

  // Verifica rate limit
  private checkRateLimit(provider: MessageProvider): boolean {
    const now = Date.now();
    const record = this.rateLimiter.get(provider);
    const providerObj = this.providers.get(provider);
    
    if (!providerObj) return true;
    
    const { perMinute } = providerObj.getRateLimit();

    if (!record || record.resetAt < now) {
      this.rateLimiter.set(provider, { count: 1, resetAt: now + 60000 });
      return true;
    }

    return record.count < perMinute;
  }

  // Incrementa contador de rate limit
  private incrementRateLimit(provider: MessageProvider): void {
    const record = this.rateLimiter.get(provider);
    if (record) {
      record.count++;
    }
  }

  // Envia em lote (para campanhas)
  async sendBatch(
    messages: Array<{ to: string; content: string; provider?: MessageProvider }>,
    options?: { 
      mediaUrl?: string;
      campaignId?: number;
      db?: any;
      tables?: any;
      onProgress?: (sent: number, total: number) => void;
    }
  ): Promise<{ sent: number; failed: number; results: MessageResult[] }> {
    const results: MessageResult[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      // Rate limiting entre envios
      await new Promise(resolve => setTimeout(resolve, 100)); // 10 msg/segundo máx

      const result = await this.send(msg.to, msg.content, {
        provider: msg.provider,
        mediaUrl: options?.mediaUrl,
        campaignId: options?.campaignId,
        db: options?.db,
        tables: options?.tables,
      });

      results.push(result);
      
      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      if (options?.onProgress) {
        options.onProgress(i + 1, messages.length);
      }
    }

    return { sent, failed, results };
  }

  // Get provider info
  getProviderInfo(provider: MessageProvider): any {
    const p = this.providers.get(provider);
    if (!p) return null;
    
    return {
      name: p.name,
      rateLimit: p.getRateLimit(),
    };
  }

  // Lista todos os providers disponíveis
  listProviders(): MessageProvider[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
let messagingEngine: MessagingEngine | null = null;

export const getMessagingEngine = (): MessagingEngine => {
  if (!messagingEngine) {
    messagingEngine = new MessagingEngine();
  }
  return messagingEngine;
};

// Helper para import no Drizzle
import { eq } from "drizzle-orm";
