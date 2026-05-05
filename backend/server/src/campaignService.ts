// ============================================
// CAMPAIGN MODELS - Modelos para Campanhas de Disparo
// ============================================
// Define a estrutura de dados para campanhas, mensagens e entrega

import { eq, and, gte, lt, desc, asc, sql } from "drizzle-orm";

// ============================================
// TYPES
// ============================================

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'whatsapp' | 'sms' | 'email' | 'mixed';
export type MessageStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export interface Campaign {
  id?: number;
  nome: string;
  descricao?: string;
  tipo: CampaignType;
  status: CampaignStatus;
  
  // Conteúdo
  conteudo?: string;
  templateId?: number;
  
  // Agendamento
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  
  // Controle
  totalEnvios?: number;
  enviosSucesso?: number;
  enviosFalha?: number;
  
  // Configurações
  intervaloMinutos?: number;
  maxEnviosDia?: number;
  
  // Filtros
  filtros?: any;
  
  // Owner
  tenantId?: string;
  userId?: string;
  
  createdAt: number;
  updatedAt: number;
}

export interface CampaignMessage {
  id?: number;
  campaignId: number;
  leadId?: number;
  contatoId?: number;
  
  // Destinatário
  to: string;
  provider: 'whatsapp' | 'sms' | 'email';
  content: string;
  mediaUrl?: string;
  
  // Status
  status: MessageStatus;
  externalId?: string;
  error?: string;
  
  // Timing
  scheduledAt?: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  
  // Retry
  attempts?: number;
  maxAttempts?: number;
  
  createdAt: number;
  updatedAt: number;
}

export interface CampaignStats {
  total: number;
  pending: number;
  sending: number;
  sent: number;
  delivered: number;
  failed: number;
  cancelled: number;
  
  successRate: number;
  deliveryRate: number;
}

// ============================================
// CAMPAIGN SERVICE
// ============================================

export class CampaignService {
  private db: any;
  private tables: any;
  private queueManager: any;
  private messagingEngine: any;
  private eventBus: any;

  constructor(config: { db: any; tables: any; queueManager?: any; messagingEngine?: any; eventBus?: any }) {
    this.db = config.db;
    this.tables = config.tables;
    this.queueManager = config.queueManager;
    this.messagingEngine = config.messagingEngine;
    this.eventBus = config.eventBus;
  }

  // Cria uma nova campanha
  async create(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = Date.now();
    
    const result = await this.db.insert(this.tables.campanhas).values({
      nome: campaign.nome,
      descricao: campaign.descricao || null,
      tipo: campaign.tipo,
      status: campaign.status || 'draft',
      conteudo: campaign.conteudo || null,
      templateId: campaign.templateId || null,
      scheduledAt: campaign.scheduledAt || null,
      intervaloMinutos: campaign.intervaloMinutos || 5,
      maxEnviosDia: campaign.maxEnviosDia || 500,
      filtros: campaign.filtros ? JSON.stringify(campaign.filtros) : null,
      tenantId: campaign.tenantId || null,
      userId: campaign.userId || null,
      createdAt: now,
      updatedAt: now,
    });

    const campaignId = result.lastInsertRowid;
    
    // Emite evento
    if (this.eventBus) {
      await this.eventBus.emit('campaign_created', { campaignId, nome: campaign.nome });
    }

    return campaignId;
  }

  // Atualiza campanha
  async update(id: number, data: Partial<Campaign>): Promise<void> {
    const updates: any = { ...data, updatedAt: Date.now() };
    
    if (data.filtros) {
      updates.filtros = JSON.stringify(data.filtros);
    }

    await this.db
      .update(this.tables.campanhas)
      .set(updates)
      .where(eq(this.tables.campanhas.id, id));
  }

  // Inicia campanha
  async start(id: number): Promise<void> {
    const campaign = await this.db
      .select()
      .from(this.tables.campanhas)
      .where(eq(this.tables.campanhas.id, id))
      .limit(1);

    if (!campaign.length) {
      throw new Error('Campanha não encontrada');
    }

    if (campaign[0].status !== 'draft' && campaign[0].status !== 'scheduled') {
      throw new Error('Campanha não pode ser iniciada');
    }

    await this.db
      .update(this.tables.campanhas)
      .set({ status: 'running', startedAt: Date.now(), updatedAt: Date.now() })
      .where(eq(this.tables.campanhas.id, id));

    // Registra job na fila para processar a campanha
    if (this.queueManager) {
      await this.queueManager.enqueue('campaign_processor', { campaignId: id }, {
        scheduledAt: campaign[0].scheduledAt || Date.now()
      });
    }

    // Emite evento
    if (this.eventBus) {
      await this.eventBus.emit('campaign_started', { campaignId: id, nome: campaign[0].nome });
    }
  }

  // Pausa campanha
  async pause(id: number): Promise<void> {
    await this.db
      .update(this.tables.campanhas)
      .set({ status: 'paused', updatedAt: Date.now() })
      .where(eq(this.tables.campanhas.id, id));

    // Cancela mensagens pendentes
    await this.db
      .update(this.tables.mensagensCampanha)
      .set({ status: 'cancelled', updatedAt: Date.now() })
      .where(and(
        eq(this.tables.mensagensCampanha.campaignId, id),
        eq(this.tables.mensagensCampanha.status, 'pending')
      ));

    if (this.eventBus) {
      await this.eventBus.emit('campaign_paused', { campaignId: id });
    }
  }

  // Completa campanha
  async complete(id: number): Promise<void> {
    const stats = await this.getStats(id);
    
    await this.db
      .update(this.tables.campanhas)
      .set({ 
        status: 'completed', 
        completedAt: Date.now(),
        totalEnvios: stats.total,
        enviosSucesso: stats.sent,
        enviosFalha: stats.failed,
        updatedAt: Date.now()
      })
      .where(eq(this.tables.campanhas.id, id));

    if (this.eventBus) {
      await this.eventBus.emit('campaign_completed', { campaignId: id, stats });
    }
  }

  // Adiciona mensagens à campanha
  async addMessages(
    campaignId: number, 
    messages: Array<{ to: string; content: string; provider?: 'whatsapp' | 'sms' | 'email'; leadId?: number; contatoId?: number }>
  ): Promise<number> {
    const campaign = await this.db
      .select()
      .from(this.tables.campanhas)
      .where(eq(this.tables.campanhas.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      throw new Error('Campanha não encontrada');
    }

    const now = Date.now();
    const values = messages.map(msg => ({
      campaignId,
      leadId: msg.leadId || null,
      contatoId: msg.contatoId || null,
      recipient: msg.to,  // SQL reserved word fix
      provider: msg.provider || 'whatsapp',
      content: msg.content || campaign[0].conteudo || '',
      status: 'pending' as MessageStatus,
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.insert(this.tables.mensagensCampanha).values(values);
    
    return messages.length;
  }

  // Processa mensagens pendentes da campanha
  async processMessages(campaignId: number, limit: number = 50): Promise<void> {
    const campaign = await this.db
      .select()
      .from(this.tables.campanhas)
      .where(eq(this.tables.campanhas.id, campaignId))
      .limit(1);

    if (!campaign.length || campaign[0].status !== 'running') {
      return;
    }

    // Busca mensagens pendentes
    const pending = await this.db
      .select()
      .from(this.tables.mensagensCampanha)
      .where(and(
        eq(this.tables.mensagensCampanha.campaignId, campaignId),
        eq(this.tables.mensagensCampanha.status, 'pending')
      ))
      .limit(limit);

    for (const msg of pending) {
      try {
        // Atualiza para sending
        await this.db
          .update(this.tables.mensagensCampanha)
          .set({ status: 'sending', updatedAt: Date.now() })
          .where(eq(this.tables.mensagensCampanha.id, msg.id));

        // Envia via messaging engine
        if (this.messagingEngine) {
          const result = await this.messagingEngine.send(msg.to, msg.content, {
            provider: msg.provider,
            mediaUrl: msg.mediaUrl || undefined,
            campaignId,
            db: this.db,
            tables: this.tables,
          });

          // Atualiza status
          await this.db
            .update(this.tables.mensagensCampanha)
            .set({
              status: result.success ? 'sent' : 'failed',
              externalId: result.externalId || null,
              error: result.error || null,
              sentAt: result.success ? Date.now() : null,
              updatedAt: Date.now(),
            })
            .where(eq(this.tables.mensagensCampanha.id, msg.id));

          // Emite evento
          if (this.eventBus) {
            await this.eventBus.emit(
              result.success ? 'message_sent' : 'message_failed',
              { messageId: msg.id, campaignId, to: msg.to, provider: msg.provider }
            );
          }
        }
      } catch (error: any) {
        await this.db
          .update(this.tables.mensagensCampanha)
          .set({ 
            status: 'failed', 
            error: error.message,
            updatedAt: Date.now() 
          })
          .where(eq(this.tables.mensagensCampanha.id, msg.id));
      }

      // Rate limiting entre envios
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verifica se completou
    const remaining = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.tables.mensagensCampanha)
      .where(and(
        eq(this.tables.mensagensCampanha.campaignId, campaignId),
        eq(this.tables.mensagensCampanha.status, 'pending')
      ));

    if ((remaining[0]?.count || 0) === 0) {
      await this.complete(campaignId);
    }
  }

  // Pega estatísticas da campanha
  async getStats(campaignId: number): Promise<CampaignStats> {
    const [stats] = await this.db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`sum(case when ${this.tables.mensagensCampanha.status} = 'pending' then 1 else 0 end)`,
        sending: sql<number>`sum(case when ${this.tables.mensagensCampanha.status} = 'sending' then 1 else 0 end)`,
        sent: sql<number>`sum(case when ${this.tables.mensagensCampanha.status} = 'sent' then 1 else 0 end)`,
        delivered: sql<number>`sum(case when ${this.tables.mensagensCampanha.status} = 'delivered' then 1 else 0 end)`,
        failed: sql<number>`sum(case when ${this.tables.mensagensCampanha.status} = 'failed' then 1 else 0 end)`,
        cancelled: sql<number>`sum(case when ${this.tables.mensagensCampanha.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(this.tables.mensagensCampanha)
      .where(eq(this.tables.mensagensCampanha.campaignId, campaignId));

    const total = stats?.total || 0;
    const sent = (stats?.sent || 0) as number;
    const delivered = (stats?.delivered || 0) as number;
    const failed = (stats?.failed || 0) as number;

    return {
      total,
      pending: (stats?.pending || 0) as number,
      sending: (stats?.sending || 0) as number,
      sent,
      delivered,
      failed,
      cancelled: (stats?.cancelled || 0) as number,
      successRate: total > 0 ? (sent / total) * 100 : 0,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    };
  }

  // Lista campanhas
  async list(tenantId?: string, status?: CampaignStatus, limit: number = 50): Promise<Campaign[]> {
    const where = [
      tenantId ? eq(this.tables.campanhas.tenantId, tenantId) : undefined,
      status ? eq(this.tables.campanhas.status, status) : undefined,
    ].filter(Boolean);

    const campaigns = await this.db
      .select()
      .from(this.tables.campanhas)
      .where(where.length > 0 ? and(...where) : undefined)
      .orderBy(desc(this.tables.campanhas.createdAt))
      .limit(limit);

    return campaigns.map((c: any) => ({
      ...c,
      filtros: c.filtros ? JSON.parse(c.filtros) : null,
    }));
  }

  // Pega campanha por ID
  async getById(id: number): Promise<Campaign | null> {
    const [campaign] = await this.db
      .select()
      .from(this.tables.campanhas)
      .where(eq(this.tables.campanhas.id, id))
      .limit(1);

    if (!campaign) return null;

    return {
      ...campaign,
      filtros: campaign.filtros ? JSON.parse(campaign.filtros) : null,
    };
  }
}
