// FINQZ PRO - SDR IA Backend
// Implementa análise de mensagens com OpenAI para qualificação de leads
// Modo: simulation (não envia automaticamente)

import { Hono } from "hono";
import type { Client } from "@sdk/server-types";
import { tables } from "@generated";
import { eq, desc } from "drizzle-orm";

// ============================================
// TIPOS
// ============================================

interface SdrAnalysisInput {
  message: string;
  conversationId?: number;
  leadId?: number;
  history?: Array<{
    direction: 'inbound' | 'outbound';
    content: string;
  }>;
}

interface SdrAnalysisOutput {
  intent: string;
  confidence: number;
  recommended_action: string;
  response_text: string;
}

interface SdrDecision {
  id: number;
  intent: string;
  confidence: number;
  recommendedAction: string;
  responseText: string | null;
  rawAnalysis: string;
  conversationId: number;
  leadId: number | null;
  leadNome: string | null;
  leadCelular: string | null;
  createdAt: number;
}

// ============================================
// SERVIÇO OPENAI
// ============================================

/**
 * Analisa uma mensagem usando OpenAI
 * Retorna intent, confiança, ação recomendada e resposta sugerida
 */
async function analyzeMessageWithOpenAI(
  openaiKey: string,
  message: string,
  history: SdrAnalysisInput['history'] = [],
  leadNome?: string,
  leadCelular?: string,
  campaignName?: string
): Promise<SdrAnalysisOutput> {
  const model = "gpt-4.1-mini";
  
  const systemPrompt = `Você é um SDR da FINQZ.
Seu objetivo é qualificar leads com educação, clareza e objetividade.
Nunca prometa aprovação.
Nunca informe taxa definitiva sem análise.
Nunca peça dados sensíveis desnecessários.
Quando houver dúvida regulatória, financeira ou jurídica, escale para humano.
Classifique a intenção do lead e sugira a próxima ação.

Intenções permitidas:
- interessado
- duvida
- preco
- sem_interesse
- quer_humano
- dados_insuficientes

Ações permitidas:
- responder
- criar_oportunidade
- escalar_humano
- aguardar
- encerrar

Retorne SOMENTE JSON válido:
{
  "intent": "...",
  "confidence": 0.0,
  "recommended_action": "...",
  "response_text": "..."
}`;

  // Construir contexto
  let contextInfo = "";
  if (leadNome) contextInfo += `Lead: ${leadNome}\n`;
  if (leadCelular) contextInfo += `Celular: ${leadCelular}\n`;
  if (campaignName) contextInfo += `Campanha: ${campaignName}\n`;
  
  if (history && history.length > 0) {
    contextInfo += `\nHistórico recente:\n`;
    history.slice(-5).forEach((msg) => {
      contextInfo += `${msg.direction === 'inbound' ? 'Lead' : 'SDR'}: ${msg.content}\n`;
    });
  }

  const userPrompt = `${contextInfo}\nÚltima mensagem do lead: ${message}`;

  // Chamar OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[SDR] OpenAI error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Parsear JSON da resposta
  let analysis: SdrAnalysisOutput;
  try {
    // Extrair JSON da resposta (pode ter texto antes/depois)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found");
    }
  } catch (parseError) {
    console.error(`[SDR] Parse error: ${content}`);
    // Fallback seguro
    analysis = {
      intent: "dados_insuficientes",
      confidence: 0,
      recommended_action: "escalar_humano",
      response_text: "Não consegui analisar com segurança. Recomendo atendimento humano."
    };
  }

  // Validar campos obrigatórios
  if (!analysis.intent) analysis.intent = "dados_insuficientes";
  if (typeof analysis.confidence !== "number") analysis.confidence = 0.5;
  if (!analysis.recommended_action) analysis.recommended_action = "aguardar";
  if (!analysis.response_text) analysis.response_text = "";

  return analysis;
}

// ============================================
// VERIFICAÇÃO DE PERMISSÃO
// ============================================

/**
 * Verifica se o usuário tem permissão para usar SDR IA
 * Verifica a partir do token JWT ou role do usuário
 */
function hasSdrIaPermission(user: any): boolean {
  if (!user) return false;
  
  // Admin sistema tem acesso total
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  // Consultores e gerentes comerciais têm acesso
  const salesRoles = [
    'ROLE_CONSULTOR_COMERCIAL_B2C',
    'ROLE_CONSULTOR_COMERCIAL_B2B',
    'ROLE_GERENTE_COMERCIAL_B2C',
    'ROLE_GERENTE_COMERCIAL_B2B',
    'ROLE_DIRETOR_COMERCIAL_B2C',
    'ROLE_DIRETOR_COMERCIAL_B2B',
    'ROLE_GERENTE_REGIONAL_B2C',
    'ROLE_GERENTE_REGIONAL_B2B',
  ];
  
  if (user.role && salesRoles.includes(user.role)) return true;
  
  // Verificar permissões customizadas se existirem
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes('SDR_IA_USE');
  }
  
  return false;
}

// ============================================
// ROTAS
// ============================================

export async function createApp(
  edgespark: Client<typeof tables>
): Promise<Hono> {
  const app = new Hono();

  // ============================================
  // SDR IA - Análise de Mensagem
  // POST /api/sdr/analyze
  // ============================================
  app.post('/api/sdr/analyze', async (c) => {
    try {
      // Verificar autenticação
      const user = edgespark.auth.user;
      if (!user) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }

      // Verificar permissão
      if (!hasSdrIaPermission(user)) {
        return c.json({ 
          error: "Você não tem permissão para usar o SDR IA", 
          code: "FORBIDDEN" 
        }, 403);
      }

      // Parse do payload
      const body = await c.req.json();
      const { 
        message,
        conversationId, 
        leadId, 
        leadNome, 
        leadCelular,
        history,
        campaignName 
      } = body;

      // Validar mensagem obrigatória
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return c.json({ 
          error: "Mensagem é obrigatória", 
          code: "INVALID_PAYLOAD" 
        }, 400);
      }

      console.log(`[SDR] Analyzing message for conversation ${conversationId || 'unknown'}`);

      // Verificar API key
      const openaiKey = edgespark.secret.get("OPENAI_API_KEY");
      if (!openaiKey) {
        return c.json({ 
          error: "SDR IA não configurado. Configure OPENAI_API_KEY no backend.", 
          code: "NOT_CONFIGURED" 
        }, 500);
      }

      // Obter modo de operação
      const mode = edgespark.secret.get("SDR_IA_MODE") || "simulation";

      // Registrar evento de análise solicitada
      await edgespark.db.insert(tables.sdrAuditLogs).values({
        eventType: "sdr_analysis_requested",
        conversationId: conversationId || null,
        leadId: leadId || null,
        decisionId: null,
        details: JSON.stringify({ 
          messageLength: message.length,
          mode,
          hasHistory: history ? history.length > 0 : false
        }),
        userId: user.id
      });

      // Analisar mensagem com OpenAI
      const analysis = await analyzeMessageWithOpenAI(
        openaiKey,
        message,
        history || [],
        leadNome,
        leadCelular,
        campaignName
      );

      // Salvar decisão no banco
      const decision = await edgespark.db.insert(tables.sdrDecisions).values({
        conversationId: conversationId || 0,
        leadId: leadId || null,
        leadNome: leadNome || null,
        leadCelular: leadCelular || null,
        intent: analysis.intent,
        confidence: analysis.confidence,
        recommendedAction: analysis.recommended_action,
        responseText: analysis.response_text,
        rawAnalysis: JSON.stringify(analysis)
      }).returning().get();

      // Registrar evento de análise criada
      await edgespark.db.insert(tables.sdrAuditLogs).values({
        eventType: "sdr_analysis_created",
        conversationId: conversationId || null,
        leadId: leadId || null,
        decisionId: decision.id,
        details: JSON.stringify({ 
          intent: analysis.intent, 
          confidence: analysis.confidence,
          recommendedAction: analysis.recommended_action
        }),
        userId: user.id
      });

      console.log(`[SDR] Decision saved: ${decision.id}, intent: ${analysis.intent}, confidence: ${analysis.confidence}`);

      // Retornar resultado
      return c.json({
        success: true,
        intent: analysis.intent,
        confidence: analysis.confidence,
        recommended_action: analysis.recommended_action,
        response_text: analysis.response_text,
        mode
      });

    } catch (error: any) {
      console.error(`[SDR] Error: ${error.message}`);
      
      // Registrar erro
      try {
        const body = await c.req.json().catch(() => ({}));
        await edgespark.db.insert(tables.sdrAuditLogs).values({
          eventType: "sdr_analysis_error",
          conversationId: body.conversationId || null,
          leadId: body.leadId || null,
          decisionId: null,
          details: JSON.stringify({ error: error.message }),
          userId: edgespark.auth.user?.id || null
        });
      } catch (auditError) {
        // Ignorar erro de auditoria
      }
      
      return c.json({ 
        error: error.message || "Erro ao analisar mensagem",
        code: "ANALYSIS_ERROR"
      }, 500);
    }
  });

  // ============================================
  // SDR IA - Obter decisões da conversa
  // GET /api/sdr/decisions/:conversationId
  // ============================================
  app.get('/api/sdr/decisions/:conversationId', async (c) => {
    try {
      const conversationId = parseInt(c.req.param('conversationId'));
      
      if (isNaN(conversationId)) {
        return c.json({ error: "ConversationId inválido", code: "INVALID_ID" }, 400);
      }

      const decisions = await edgespark.db.select()
        .from(tables.sdrDecisions)
        .where(eq(tables.sdrDecisions.conversationId, conversationId))
        .orderBy(desc(tables.sdrDecisions.createdAt))
        .limit(10);

      return c.json({ decisions });
    } catch (error: any) {
      console.error(`[SDR] Error getting decisions: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }
  });

  // ============================================
  // SDR IA - Criar Oportunidade
  // POST /api/sdr/opportunity
  // ============================================
  app.post('/api/sdr/opportunity', async (c) => {
    try {
      // Verificar autenticação
      const user = edgespark.auth.user;
      if (!user) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }

      // Verificar permissão
      if (!hasSdrIaPermission(user)) {
        return c.json({ 
          error: "Você não tem permissão para criar oportunidades", 
          code: "FORBIDDEN" 
        }, 403);
      }

      const { 
        conversationId, 
        leadId, 
        leadNome, 
        leadCelular,
        campaignId,
        observation 
      } = await c.req.json();

      console.log(`[SDR] Creating opportunity for lead ${leadId}`);

      // Verificar se já existe oportunidade aberta para este lead
      if (leadId) {
        const existingOpp = await edgespark.db.select()
          .from(tables.oportunidades)
          .where(eq(tables.oportunidades.clienteId, leadId))
          .where(eq(tables.oportunidades.status, "novo_lead"))
          .get();

        if (existingOpp) {
          return c.json({ 
            success: false, 
            error: "Já existe oportunidade aberta para este lead",
            existingOportunityId: existingOpp.id,
            code: "OPPORTUNITY_EXISTS"
          });
        }
      }

      // Criar oportunidade
      const opportunity = await edgespark.db.insert(tables.oportunidades).values({
        clienteId: leadId,
        nome: leadNome || "Lead SDR IA",
        telefone: leadCelular || null,
        campanhaId: campaignId || null,
        status: "novo_lead",
        etapa: "novo",
        origem: "SDR_IA",
        observacao: observation || "Oportunidade criada automaticamente pelo SDR IA",
        tenantId: user.id
      }).returning().get();

      // Registrar auditoria
      await edgespark.db.insert(tables.sdrAuditLogs).values({
        eventType: "sdr_opportunity_created",
        conversationId,
        leadId,
        decisionId: null,
        details: JSON.stringify({ opportunityId: opportunity.id }),
        userId: user.id
      });

      console.log(`[SDR] Opportunity created: ${opportunity.id}`);

      return c.json({ success: true, opportunity });

    } catch (error: any) {
      console.error(`[SDR] Error creating opportunity: ${error.message}`);
      return c.json({ error: error.message, code: "OPPORTUNITY_ERROR" }, 500);
    }
  });

  // ============================================
  // SDR IA - Escalar para Humano
  // POST /api/sdr/escalate
  // ============================================
  app.post('/api/sdr/escalate', async (c) => {
    try {
      // Verificar autenticação
      const user = edgespark.auth.user;
      if (!user) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }

      const { conversationId, reason } = await c.req.json();

      console.log(`[SDR] Escalating conversation ${conversationId} to human`);

      // Registrar auditoria
      await edgespark.db.insert(tables.sdrAuditLogs).values({
        eventType: "sdr_handoff_to_human",
        conversationId,
        leadId: null,
        decisionId: null,
        details: JSON.stringify({ reason }),
        userId: user.id
      });

      return c.json({ success: true });
    } catch (error: any) {
      console.error(`[SDR] Error escalating: ${error.message}`);
      return c.json({ error: error.message, code: "ESCALATE_ERROR" }, 500);
    }
  });

  // ============================================
  // SDR IA - Obter Configuração
  // GET /api/sdr/config
  // ============================================
  app.get('/api/sdr/config', async (c) => {
    // Obter modo de operação
    const mode = edgespark.secret.get("SDR_IA_MODE") || "simulation";
    const model = edgespark.secret.get("OPENAI_MODEL") || "gpt-4.1-mini";
    const isConfigured = !!edgespark.secret.get("OPENAI_API_KEY");

    return c.json({
      mode,
      model,
      isConfigured,
      available_intents: [
        "interessado",
        "duvida", 
        "preco",
        "sem_interesse",
        "quer_humano",
        "dados_insuficientes"
      ],
      available_actions: [
        "responder",
        "escalar_humano",
        "criar_opportunidade",
        "aguardar",
        "encerrar"
      ]
    });
  });

  return app;
}
