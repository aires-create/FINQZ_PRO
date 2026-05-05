// ============================================
// QUEUE SYSTEM - Sistema de Filas Baseado em DB
// ============================================
// Implementa filas de processamento assíncrono
// Adequado para ambientes serverless sem Redis

import { eq, and, gte, lt, desc, sql } from "drizzle-orm";

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry';

export interface QueueJob {
  id?: number;
  queue: string;
  payload: any;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QueueConfig {
  db: any;
  tables: any;
  maxConcurrent?: number;
  pollInterval?: number;
}

// ============================================
// QUEUE MANAGER
// ============================================

export class QueueManager {
  private db: any;
  private tables: any;
  private maxConcurrent: number;
  private pollInterval: number;
  private running: boolean = false;
  private processors: Map<string, (job: QueueJob) => Promise<void>> = new Map();

  constructor(config: QueueConfig) {
    this.db = config.db;
    this.tables = config.tables;
    this.maxConcurrent = config.maxConcurrent || 5;
    this.pollInterval = config.pollInterval || 5000;
  }

  // Registra um processador para uma fila
  registerProcessor(queue: string, processor: (job: QueueJob) => Promise<void>): void {
    this.processors.set(queue, processor);
    console.log(`[Queue] Processador registrado para fila: ${queue}`);
  }

  // Adiciona um job à fila
  async enqueue(queue: string, payload: any, options?: { scheduledAt?: number; maxAttempts?: number }): Promise<number> {
    const now = Date.now();
    
    const result = await this.db.insert(this.tables.queueJobs).values({
      queue,
      payload: JSON.stringify(payload),
      status: 'pending',
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      scheduledAt: options?.scheduledAt || now,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[Queue] Job enfileirado: ${queue}`, payload);
    return result.lastInsertRowid;
  }

  // Processa jobs de uma fila específica
  async processQueue(queue: string): Promise<void> {
    const processor = this.processors.get(queue);
    if (!processor) {
      console.warn(`[Queue] Nenhum processador registrado para: ${queue}`);
      return;
    }

    // Busca jobs pendentes
    const jobs = await this.db
      .select()
      .from(this.tables.queueJobs)
      .where(and(
        eq(this.tables.queueJobs.queue, queue),
        eq(this.tables.queueJobs.status, 'pending'),
        gte(this.tables.queueJobs.scheduledAt, Date.now())
      ))
      .limit(this.maxConcurrent);

    if (jobs.length === 0) return;

    console.log(`[Queue] Processando ${jobs.length} jobs da fila: ${queue}`);

    for (const job of jobs) {
      await this.processJob(job, processor);
    }
  }

  // Processa um job individual
  private async processJob(job: any, processor: (job: QueueJob) => Promise<void>): Promise<void> {
    try {
      // Marca como processando
      await this.db
        .update(this.tables.queueJobs)
        .set({ 
          status: 'processing', 
          startedAt: Date.now(),
          updatedAt: Date.now()
        })
        .where(eq(this.tables.queueJobs.id, job.id));

      // Executa o processador
      const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
      await processor({
        ...job,
        payload
      });

      // Marca como concluído
      await this.db
        .update(this.tables.queueJobs)
        .set({ 
          status: 'completed', 
          completedAt: Date.now(),
          updatedAt: Date.now()
        })
        .where(eq(this.tables.queueJobs.id, job.id));

      console.log(`[Queue] Job concluído: ${job.id}`);
    } catch (error: any) {
      const newAttempts = job.attempts + 1;
      
      if (newAttempts >= job.maxAttempts) {
        // Falhou definitivamente
        await this.db
          .update(this.tables.queueJobs)
          .set({ 
            status: 'failed', 
            error: error.message,
            updatedAt: Date.now()
          })
          .where(eq(this.tables.queueJobs.id, job.id));
        
        console.error(`[Queue] Job falhou definitivamente: ${job.id}`, error);
      } else {
        // Agenda retry
        const retryDelay = Math.pow(2, newAttempts) * 60000; // Exponential backoff
        await this.db
          .update(this.tables.queueJobs)
          .set({ 
            status: 'retry',
            attempts: newAttempts,
            scheduledAt: Date.now() + retryDelay,
            error: error.message,
            updatedAt: Date.now()
          })
          .where(eq(this.tables.queueJobs.id, job.id));
        
        console.log(`[Queue] Job agendado para retry: ${job.id}, tentativa ${newAttempts}`);
      }
    }
  }

  // Inicia o loop de processamento
  start(): void {
    if (this.running) return;
    this.running = true;
    
    const loop = async () => {
      if (!this.running) return;
      
      try {
        for (const [queue] of this.processors) {
          await this.processQueue(queue);
        }
      } catch (error) {
        console.error('[Queue] Erro no loop de processamento:', error);
      }
      
      setTimeout(loop, this.pollInterval);
    };
    
    loop();
    console.log('[Queue] Sistema de filas iniciado');
  }

  // Para o loop de processamento
  stop(): void {
    this.running = false;
    console.log('[Queue] Sistema de filas parado');
  }

  // Pega estatísticas da fila
  async getStats(queue?: string): Promise<any> {
    const whereClause = queue 
      ? eq(this.tables.queueJobs.queue, queue)
      : undefined;

    const [pending, processing, completed, failed] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(this.tables.queueJobs).where(and(whereClause, eq(this.tables.queueJobs.status, 'pending'))),
      this.db.select({ count: sql<number>`count(*)` }).from(this.tables.queueJobs).where(and(whereClause, eq(this.tables.queueJobs.status, 'processing'))),
      this.db.select({ count: sql<number>`count(*)` }).from(this.tables.queueJobs).where(and(whereClause, eq(this.tables.queueJobs.status, 'completed'))),
      this.db.select({ count: sql<number>`count(*)` }).from(this.tables.queueJobs).where(and(whereClause, eq(this.tables.queueJobs.status, 'failed'))),
    ]);

    return {
      pending: pending[0]?.count || 0,
      processing: processing[0]?.count || 0,
      completed: completed[0]?.count || 0,
      failed: failed[0]?.count || 0,
    };
  }
}

// ============================================
// RATE LIMITER
// ============================================

export class RateLimiter {
  private limits: Map<string, { count: number; resetAt: number }> = new Map();
  
  // Verifica se a ação está dentro do limite
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.limits.get(key);
    
    if (!record || record.resetAt < now) {
      // Novo período
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    
    if (record.count >= limit) {
      // Limite excedido
      return false;
    }
    
    record.count++;
    return true;
  }

  // Espera até poder executar a ação
  async waitFor(key: string, limit: number, windowMs: number): Promise<void> {
    while (!this.check(key, limit, windowMs)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Reseta o limite
  reset(key: string): void {
    this.limits.delete(key);
  }

  // Limpa todos os limites
  clear(): void {
    this.limits.clear();
  }
}

// ============================================
// EVENT SYSTEM
// ============================================

export type EventType = 
  | 'lead_created'
  | 'lead_updated'
  | 'message_sent'
  | 'message_failed'
  | 'campaign_started'
  | 'campaign_completed'
  | 'campaign_paused'
  | 'integration_connected'
  | 'integration_error';

export interface Event {
  id?: number;
  type: EventType;
  data: any;
  tenantId?: string;
  userId?: string;
  createdAt: number;
}

type EventHandler = (event: Event) => Promise<void> | void;

export class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private eventLog: any;
  private tables: any;

  constructor(eventLog?: any, tables?: any) {
    this.eventLog = eventLog;
    this.tables = tables;
  }

  // Registra um handler para um tipo de evento
  on(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
    console.log(`[EventBus] Handler registrado para: ${type}`);
  }

  // Remove um handler
  off(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(type, handlers);
    }
  }

  // Emite um evento
  async emit(type: EventType, data: any, options?: { tenantId?: string; userId?: string }): Promise<void> {
    const event: Event = {
      type,
      data,
      tenantId: options?.tenantId,
      userId: options?.userId,
      createdAt: Date.now(),
    };

    // Persiste o evento
    if (this.eventLog && this.tables) {
      try {
        await this.eventLog.insert(this.tables.eventos).values({
          tipo: type,
          dados: JSON.stringify(data),
          tenantId: options?.tenantId || null,
          usuarioId: options?.userId || null,
          createdAt: event.createdAt,
        });
      } catch (error) {
        console.error('[EventBus] Erro ao persistir evento:', error);
      }
    }

    // Executa os handlers
    const handlers = this.handlers.get(type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Erro no handler de ${type}:`, error);
      }
    }

    console.log(`[EventBus] Evento emitido: ${type}`, data);
  }

  // Busca eventos por tipo
  async getEvents(type?: EventType, limit: number = 100): Promise<Event[]> {
    if (!this.eventLog || !this.tables) return [];
    
    const where = type 
      ? eq(this.tables.eventos.tipo, type)
      : undefined;

    const events = await this.eventLog
      .select()
      .from(this.tables.eventos)
      .where(where)
      .orderBy(desc(this.tables.eventos.createdAt))
      .limit(limit);

    return events.map((e: any) => ({
      id: e.id,
      type: e.tipo,
      data: e.dados ? JSON.parse(e.dados) : null,
      tenantId: e.tenantId,
      userId: e.usuarioId,
      createdAt: e.createdAt,
    }));
  }
}
