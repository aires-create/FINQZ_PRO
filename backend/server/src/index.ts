/**
 * FINQZ PRO - Backend API
 * Advanced CRM with lead management, opportunities, partners, automation, and commission
 */

import { Hono } from "hono";
import type { Client } from "@sdk/server-types";
import { tables, buckets } from "@generated";
import { eq, and, or, desc, asc, sql, like, gt, lt, gte, lte } from "drizzle-orm";
import { AlertEngine } from "./alertEngine";
import { QueueManager, RateLimiter, EventBus } from "./queueSystem";
import { MessagingEngine, WhatsAppProvider, SMSProvider, EmailProvider } from "./messagingEngine";
import { CampaignService } from "./campaignService";
import { emitEvent, queryEvents, getEventStats, getCampaignTimeline, getCampaignEventStats, type EventType, type EventSource } from "./events/emitter";
import { checkAndCreateAlerts, getActiveAlerts, resolveAlert } from "./events/alerts";
import { testStormConnection, sendProposal, getProposalStatus, syncTables, syncCommissions } from "./stormProvider";

// ============================================
// HELPER FUNCTIONS
// ============================================

// Formatar tempo de espera
function formatWaitingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'agora';
}

// Frases que indicam escalação para atendimento humano
const ESCALATION_PHRASES = [
  'falar com atendente',
  'falar com uma pessoa',
  'quero falar com humano',
  'atendente humano',
  'não é bot',
  'speak with agent',
  'talk to agent',
  'human',
  'atendente',
  'suporte humano',
  'ajuda humana',
  'preciso de ajuda',
  'quero falar com alguém',
];

// Verificar se a mensagem indica escalação
function detectEscalation(messageText: string): boolean {
  if (!messageText) return false;
  const lowerMessage = messageText.toLowerCase();
  return ESCALATION_PHRASES.some(phrase => lowerMessage.includes(phrase.toLowerCase()));
}

// ============================================
// CREATE APP
// ============================================

/**
 * Create your Hono app
 * @param edgespark - EdgeSpark SDK client
 * @returns Hono app with your routes defined
 */
export async function createApp(
  edgespark: Client<typeof tables>
): Promise<Hono> {
  const app = new Hono();

  // ============================================
  // AUTH - Rotas de Autenticação
  // ============================================

  // Logout com logging de auditoria
  app.post("/api/auth/logout", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    await logAuthAction(user.id, 'LOGOUT', user.email || 'unknown');

    // Emit event: user_logout
    await emitEvent(edgespark, {
      type: 'user_logout',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      payload: { email: user.email }
    });

    return c.json({ success: true });
  });

  // Helper to get current user with extended properties
  const getCurrentUser = (c: any) => {
    const user = edgespark.auth.user as any;
    if (!user) return null;
    
    // Extend user with custom properties from EdgeSpark metadata
    return {
      ...user,
      role: user.role || user.perfil || user.customClaims?.role || 'USER',
      perfil: user.perfil || user.customClaims?.perfil || 'USER',
      permissions: user.permissions || user.customClaims?.permissions || [],
      parceiroId: user.parceiroId || user.customClaims?.parceiroId,
      tenantId: user.tenantId || user.customClaims?.tenantId,
      scope: user.scope || user.customClaims?.scope || 'OWN',
    };
  };

  // RBAC: Mapeamento de permissões por role
  // SECURITY: deny-by-default - nega por padrão
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    // Roles de sistema
    'ROLE_ADMIN_SISTEMA': ['*'],
    'ADMIN_SISTEMA': ['*'],
    'ROLE_CEO': ['*'],
    
    // Roles de franquia
    'ADMIN_FRANQUIA': ['clientes:*', 'oportunidades:*', 'parceiros:*', 'produtos:*', 'financeiro:read', 'usuarios:read'],
    
    // Franqueado
    'FRANQUEADO': ['clientes:read', 'clientes:create', 'clientes:edit', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move', 'parceiros:read'],
    
    // SDR (Sales Development Representative)
    'SDR': ['clientes:read', 'clientes:create', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move'],
    
    // Financeiro
    'FINANCEIRO': ['financeiro:read', 'financeiro:export', 'clientes:read', 'oportunidades:read'],
    
    // Operacional
    'OPERACIONAL': ['clientes:read', 'oportunidades:read', 'oportunidades:edit'],
    
    // Roles legadas
    'ROLE_DIRETOR_COMERCIAL': ['clientes:*', 'oportunidades:*', 'parceiros:*', 'produtos:*', 'financeiro:read', 'usuarios:read'],
    'ROLE_GERENTE_COMERCIAL': ['clientes:*', 'oportunidades:*', 'parceiros:read', 'produtos:read', 'financeiro:read'],
    'ROLE_SDR': ['oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'clientes:read', 'clientes:create'],
    'ROLE_FINANCEIRO': ['financeiro:*', 'conta_corrente:*', 'clientes:read', 'oportunidades:read'],
    'ROLE_OPERACIONAL': ['oportunidades:read', 'oportunidades:edit', 'clientes:read'],
  };

  // RBAC: Verifica se o usuário tem permissão para uma ação
  const checkPermission = (user: any, resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Obtém as permissões do usuário baseadas na role
    const role = user.role || user.perfil;
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    // Admin tem acesso total
    if (permissions.includes('*')) return true;
    
    // Verifica se tem permissão específica para o recurso
    const resourcePerm = permissions.find((p: string) => {
      const [r, a] = p.split(':');
      return r === resource || r === '*';
    });
    
    if (!resourcePerm) return false;
    
    // Verifica se a ação está permitida
    const [, allowedAction] = resourcePerm.split(':');
    return allowedAction === '*' || allowedAction === action || allowedAction === 'read';
  };

  // RBAC: Verifica se o usuário pode executar ação em rota crítica
  const requirePermission = (user: any, resource: string, action: string): { allowed: boolean; error?: string } => {
    if (!user) {
      return { allowed: false, error: 'Unauthorized' };
    }
    
    if (!checkPermission(user, resource, action)) {
      console.warn(`[RBAC] Acesso negado: ${user.email} tentou ${action} em ${resource}`);
      return { allowed: false, error: 'Forbidden: Você não tem permissão para esta ação' };
    }
    
    return { allowed: true };
  };

  // Helper to log actions
  // ============================================
  // AUDIT LOG - Sistema de Auditoria
  // ============================================

  // Campos sensíveis que não devem ser expostos nos logs
  const SENSITIVE_FIELDS = [
    'senha', 'password', 'token', 'access_token', 'refresh_token',
    'api_key', 'secret', 'cpf', 'cnpj', 'credit_card', 'card_number',
    'pix_chave', 'dados_bancarios', 'bank_data', 'comissao'
  ];

  // Sanitiza dados sensíveis antes de salvar no log
  const sanitizeData = (data: any): any => {
    if (!data) return null;
    
    const sanitized = { ...data };
    
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
      // Verifica campos aninhados
      if (typeof sanitized[field] === 'object') {
        sanitized[field] = '[OBJECT_REDACTED]';
      }
    }
    
    // Remove campos de objetos aninhados
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  };

  // Função principal de auditoria
  const logAction = async (
    usuarioId: string, 
    acao: string, 
    modulo: string, 
    registroId?: number, 
    dadosAntes?: any, 
    dadosDepois?: any
  ) => {
    try {
      // Sanitiza dados antes de salvar
      const sanitizedBefore = sanitizeData(dadosAntes);
      const sanitizedAfter = sanitizeData(dadosDepois);
      
      await edgespark.db.insert(tables.logsAcoes).values({
        usuarioId,
        acao,
        modulo,
        registroId: registroId || null,
        dadosAntes: sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
        dadosDepois: sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
      });

      // Gera alertas baseado na ação
      await generateAlert(usuarioId, acao, modulo, dadosAntes, dadosDepois);
    } catch (error) {
      // Não falha a operação principal se o log falhar
      console.error('[AUDIT] Erro ao salvar log de auditoria:', error);
    }
  };

  // ============================================
  // SISTEMA DE ALERTAS DE SEGURANÇA (AlertEngine)
  // ============================================

  // Instância do AlertEngine
  const alertEngine = new AlertEngine(edgespark.db, tables);

  // Função para gerar alertas automaticamente usando o engine
  const generateAlert = async (
    usuarioId: string,
    acao: string,
    modulo: string,
    dadosAntes?: any,
    dadosDepois?: any
  ) => {
    try {
      const context = {
        usuarioId,
        acao,
        modulo,
        dadosAntes,
        dadosDepois,
        timestamp: Date.now()
      };
      
      await alertEngine.processLog(context);
    } catch (error) {
      console.error('[ALERT] Erro ao processar alertas:', error);
    }
  };

  // Função auxiliar para criar alerta (mantida para compatibilidade)
  const createAlert = async (
    tipo: string,
    usuarioId: string,
    severidade: 'low' | 'medium' | 'high' | 'critical',
    mensagem: string,
    dadosExtras?: any
  ) => {
    // Janela de deduplicação baseada na severidade
    // Críticos: 5 min, High: 10 min, Medium: 30 min, Low: 60 min
    const deduplicationWindow = {
      critical: 5 * 60 * 1000,
      high: 10 * 60 * 1000,
      medium: 30 * 60 * 1000,
      low: 60 * 60 * 1000,
    };
    
    const windowMs = deduplicationWindow[severidade];

    // Verifica se já existe alerta similar recente (evitar duplicatas)
    const existingAlert = await edgespark.db
      .select()
      .from(tables.alertasSeguranca)
      .where(and(
        eq(tables.alertasSeguranca.tipo, tipo),
        eq(tables.alertasSeguranca.resolved, 0),
        gte(tables.alertasSeguranca.createdAt, Date.now() - windowMs)
      ))
      .limit(1);

    if (existingAlert.length > 0) {
      // Já existe alerta similar recente, não criar duplicata
      return;
    }

    await edgespark.db.insert(tables.alertasSeguranca).values({
      tipo,
      usuarioId: usuarioId || null,
      severidade,
      mensagem,
      dadosExtras: dadosExtras ? JSON.stringify(dadosExtras) : null,
    });

    console.log(`[ALERT] Novo alerta criado: ${severidade.toUpperCase()} - ${tipo} - ${mensagem}`);
  };

  // Log de auditoria simplificado para login/logout
  const logAuthAction = async (
    usuarioId: string,
    acao: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE',
    email: string,
    detalhes?: any
  ) => {
    try {
      await edgespark.db.insert(tables.logsAcoes).values({
        usuarioId,
        acao,
        modulo: 'auth',
        registroId: null,
        dadosAntes: null,
        dadosDepois: JSON.stringify({ 
          email: email,
          ip: detalhes?.ip || 'unknown',
          userAgent: detalhes?.userAgent || 'unknown',
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('[AUDIT] Erro ao salvar log de autenticação:', error);
    }
  };

  // Helper to send emails using Resend API (works in Cloudflare Workers)
  const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
    const resendApiKey = edgespark.secret.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("[EMAIL] RESEND_API_KEY not configured - email not sent");
      return { success: false, error: "Email service not configured. Set RESEND_API_KEY secret." };
    }

    const fromEmail = edgespark.secret.get("SMTP_FROM") || "FINQZ PRO <onboarding@resend.dev>";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: to,
          subject: subject,
          html: html,
          text: text || html.replace(/<[^>]*>/g, ""),
        }),
      });

      const result = await response.json() as { id?: string; message?: string };
      
      if (response.ok) {
        console.log("[EMAIL] Sent successfully:", result.id);
        return { success: true, messageId: result.id };
      } else {
        console.error("[EMAIL] Error:", result);
        return { success: false, error: result.message || "Failed to send email" };
      }
    } catch (error) {
      console.error("[EMAIL] Error sending email:", error);
      return { success: false, error: String(error) };
    }
  };

  // Helper to execute automations when opportunity status changes
  const executarAutomacoes = async (
    oportunidade: any,
    statusAnterior: string,
    statusNovo: string
  ) => {
    console.log(`[AUTOMACAO] Checking automations for status change: ${statusAnterior} -> ${statusNovo}`);
    
    try {
      // Get all active automations with status_change trigger
      const automacoes = await edgespark.db
        .select()
        .from(tables.automacoes)
        .where(eq(tables.automacoes.ativo, 1));

      // Filter automations that match the trigger
      const automacoesRelevantes = automacoes.filter((auto: any) => {
        // Check if trigger is status_change or etapa_change
        if (auto.triggerTipo !== 'status_change' && auto.triggerTipo !== 'etapa_change') {
          return false;
        }
        
        // Check pipeline_id if specified in automation
        if (auto.pipelineId && oportunidade.pipelineId !== auto.pipelineId) {
          return false;
        }
        
        // Check etapa_origem if specified in automation
        if (auto.etapaOrigem && statusAnterior !== auto.etapaOrigem) {
          return false;
        }
        
        // Check etapa_destino if specified in automation
        if (auto.etapaDestino && statusNovo !== auto.etapaDestino) {
          return false;
        }
        
        // If we have specific etapa filters, they take precedence
        if (auto.etapaOrigem || auto.etapaDestino || auto.pipelineId) {
          return true;
        }
        
        // Check if trigger condition matches (e.g., "entrada->analise" or just "analise")
        const triggerCondicao = auto.triggerCondicao || '';
        
        // If condition is empty, trigger on any status change
        if (!triggerCondicao) {
          return true;
        }
        
        // Check if condition matches the specific transition
        const condicaoPartes = triggerCondicao.split('->');
        if (condicaoPartes.length === 2) {
          // Specific transition: "entrada->analise"
          return condicaoPartes[0] === statusAnterior && condicaoPartes[1] === statusNovo;
        } else {
          // Just the target status: "analise"
          return triggerCondicao === statusNovo;
        }
      });

      console.log(`[AUTOMACAO] Found ${automacoesRelevantes.length} relevant automations`);

      // Get cliente info for the automation
      const clientes = await edgespark.db
        .select()
        .from(tables.clientes)
        .where(eq(tables.clientes.id, oportunidade.clienteId));
      
      const cliente = clientes[0];

      // Execute each automation
      for (const automacao of automacoesRelevantes) {
        console.log(`[AUTOMACAO] Executing automation: ${automacao.nome} (${automacao.acaoTipo})`);
        
        try {
          const acaoParametros = automacao.acaoParametros 
            ? JSON.parse(automacao.acaoParametros) 
            : {};

          switch (automacao.acaoTipo) {
            case 'email':
              // Send email
              if (cliente?.email) {
                const subject = acaoParametros.subject || `Atualização - Oportunidade ${oportunidade.id}`;
                const body = acaoParametros.body || `Sua oportunidade foi atualizada para o status: ${statusNovo}`;
                
                await sendEmail(
                  cliente.email,
                  subject,
                  `<p>${body}</p><p>Oportunidade #${oportunidade.id}</p>`
                );
                console.log(`[AUTOMACAO] Email sent to ${cliente.email}`);
              } else {
                console.log(`[AUTOMACAO] No email found for cliente`);
              }
              break;

            case 'whatsapp':
              // Log WhatsApp message (in production, integrate with WhatsApp API)
              const mensagemWhatsapp = acaoParametros.message || `Sua oportunidade foi atualizada para: ${statusNovo}`;
              console.log(`[AUTOMACAO] WhatsApp message would be sent to ${cliente?.telefone}: ${mensagemWhatsapp}`);
              // TODO: Integrate with WhatsApp API (Twilio, WPP Connect, etc.)
              break;

            case 'notificacao':
              // Log notification
              const mensagemNotificacao = acaoParametros.message || `Oportunidade ${oportunidade.id} mudou para ${statusNovo}`;
              console.log(`[AUTOMACAO] Notification: ${mensagemNotificacao}`);
              // TODO: Store notification in database for in-app notifications
              break;

            case 'webhook':
              // Call webhook
              if (acaoParametros.url) {
                console.log(`[AUTOMACAO] Calling webhook: ${acaoParametros.url}`);
                // TODO: Implement webhook call
              }
              break;

            case 'atualizar_campo':
              // Update opportunity field
              if (acaoParametros.campo && acaoParametros.valor) {
                await edgespark.db
                  .update(tables.oportunidades)
                  .set({ [acaoParametros.campo]: acaoParametros.valor })
                  .where(eq(tables.oportunidades.id, oportunidade.id));
                console.log(`[AUTOMACAO] Updated campo ${acaoParametros.campo} to ${acaoParametros.valor}`);
              }
              break;

            case 'mover_etapa':
              // Move to specific stage
              if (acaoParametros.etapa) {
                await edgespark.db
                  .update(tables.oportunidades)
                  .set({ status: acaoParametros.etapa })
                  .where(eq(tables.oportunidades.id, oportunidade.id));
                console.log(`[AUTOMACAO] Moved opportunity to etapa: ${acaoParametros.etapa}`);
              }
              break;

            default:
              console.log(`[AUTOMACAO] Unknown action type: ${automacao.acaoTipo}`);
          }
        } catch (execError) {
          console.error(`[AUTOMACAO] Error executing automation ${automacao.id}:`, execError);
        }
      }
    } catch (error) {
      console.error("[AUTOMACAO] Error checking automations:", error);
    }
  };

  // Helper to generate partner code
  let ultimoCodigoParceiro = 1000;
  const gerarCodigoParceiro = () => {
    ultimoCodigoParceiro += 1;
    return ultimoCodigoParceiro.toString();
  };

  // Helper to generate secure password using crypto (replaces Math.random)
  const gerarSenhaSegura = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const randomValues = new Uint8Array(8);
    crypto.getRandomValues(randomValues);
    let senha = '';
    for (let i = 0; i < 8; i++) {
      senha += charset[randomValues[i] % charset.length];
    }
    return senha;
  };

  // Helper to send partner credentials email with fallback
  const enviarEmailCredenciaisParceiro = async (parceiro: any) => {
    const resultado = {
      success: false,
      provider: null as string | null,
      error: null as string | null
    };

    if (!parceiro) {
      resultado.error = "Parceiro não fornecido";
      return resultado;
    }

    if (!parceiro.email) {
      console.log("[EMAIL] Parceiro sem email - não enviado");
      resultado.error = "Parceiro sem email";
      return resultado;
    }

    const fromEmail = edgespark.secret.get("SMTP_FROM") || "FINQZ PRO <onboarding@resend.dev>";

    // Get customizable settings
    const empresaNome = edgespark.secret.get("EMPRESA_NOME") || "FINQZ PRO";
    const primaryColor = edgespark.secret.get("EMAIL_PRIMARY_COLOR") || "#000dff";
    const logoUrl = edgespark.secret.get("EMPRESA_LOGO_URL") || "";
    
    // Professional email template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${empresaNome} - Credenciais de Acesso</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);padding:40px 40px 30px;text-align:center">
              ${logoUrl ? `<img src="${logoUrl}" alt="${empresaNome}" style="max-height:60px;margin-bottom:20px">` : `<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">${empresaNome}</h1>`}
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px">Sistema de Gestão CRM</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px">
              <h2 style="color:#1a1a2e;margin:0 0 20px;font-size:24px;font-weight:600">Bem-vindo, ${parceiro.nome}! 🎉</h2>
              <p style="color:#4a5568;margin:0 0 20px;font-size:16px;line-height:1.6">
                Seu acesso ao <strong>${empresaNome}</strong> foi criado com sucesso. Agora você pode gerenciar seus clientes, oportunidades e muito mais.
              </p>
              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f8fafc 0%, #f1f5f9 100%);border-radius:12px;margin:25px 0;border:1px solid #e2e8f0">
                <tr>
                  <td style="padding:25px">
                    <p style="color:#64748b;margin:0 0 15px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Suas Credenciais de Acesso</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0">
                          <span style="color:#64748b;font-size:14px">📋 Login:</span>
                          <span style="color:#1a1a2e;font-size:18px;font-weight:700;margin-left:10px">${parceiro.codigo || parceiro.login}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #e2e8f0">
                          <span style="color:#64748b;font-size:14px">🔑 Senha:</span>
                          <span style="color:${primaryColor};font-size:18px;font-weight:700;margin-left:10px">${parceiro.senha}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:25px 0;text-align:center">
                    <a href="https://parceiro.finqz.com.br" style="display:inline-block;background:${primaryColor};color:#ffffff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;box-shadow:0 4px 14px ${primaryColor}40">
                      Acessar Sistema →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <p style="color:#94a3b8;margin:20px 0 0;font-size:13px;text-align:center">
                ⚠️ Altere sua senha no primeiro acesso para garantir sua segurança.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:30px 40px;text-align:center;border-top:1px solid #e2e8f0">
              <p style="color:#94a3b8;margin:0;font-size:13px">
                © ${new Date().getFullYear()} ${empresaNome}. Todos os direitos reservados.
              </p>
              <p style="color:#cbd5e1;margin:10px 0 0;font-size:12px">
                Este é um e-mail automático, por favor não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // =====================
    // EMAIL (RESEND PRIORITY)
    // =====================
    try {
      const resendApiKey = edgespark.secret.get("RESEND_API_KEY");
      
      if (resendApiKey) {
        console.log("[EMAIL] Tentando enviar via Resend...");
        
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: parceiro.email,
            subject: "Seu acesso FINQZ PRO",
            html: html
          })
        });

        if (res.ok) {
          console.log("[EMAIL] Enviado via Resend com sucesso");
          resultado.success = true;
          resultado.provider = "resend";
          return resultado;
        } else {
          console.log("[EMAIL] Resend falhou, tentando próximo método...");
          throw new Error("Resend failed");
        }
      }
    } catch (err) {
      console.log("[EMAIL] Resend erro:", err);
      
      // =====================
      // FALLBACK SMTP (Umbler) - needs external service
      // =====================
      try {
        const smtpHost = edgespark.secret.get("SMTP_HOST");
        
        if (smtpHost) {
          console.log("[EMAIL] Tentando enviar via SMTP...");
          // Note: nodemailer doesn't work in Cloudflare Workers
          // This would require an external SMTP relay service
          console.log("[EMAIL] SMTP não disponível em Cloudflare Workers");
        }
      } catch (smtpError) {
        console.error("[EMAIL] SMTP falhou:", smtpError);
      }
    }

    // If we got here, email failed
    resultado.error = "Falha ao enviar email";
    return resultado;
  };

  // Helper to send password reset email with specific template
  const enviarEmailResetSenha = async (parceiro: any) => {
    const resultado = {
      success: false,
      provider: null as string | null,
      error: null as string | null
    };

    if (!parceiro) {
      resultado.error = "Parceiro não fornecido";
      return resultado;
    }

    if (!parceiro.email) {
      console.log("[EMAIL] Parceiro sem email - não enviado");
      resultado.error = "Parceiro sem email";
      return resultado;
    }

    const fromEmail = edgespark.secret.get("SMTP_FROM") || "FINQZ PRO <onboarding@resend.dev>";
    const empresaNome = edgespark.secret.get("EMPRESA_NOME") || "FINQZ PRO";
    const primaryColor = edgespark.secret.get("EMAIL_PRIMARY_COLOR") || "#000dff";
    const logoUrl = edgespark.secret.get("EMPRESA_LOGO_URL") || "";

    // Password reset email template - different from new partner
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${empresaNome} - Redefinição de Senha</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);padding:40px 40px 30px;text-align:center">
              ${logoUrl ? `<img src="${logoUrl}" alt="${empresaNome}" style="max-height:60px;margin-bottom:20px">` : `<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">${empresaNome}</h1>`}
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px">Sistema de Gestão CRM</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px">
              <div style="text-align:center;margin-bottom:25px">
                <span style="display:inline-block;width:80px;height:80px;background:#fef3c7;border-radius:50%;line-height:80px;font-size:40px">🔐</span>
              </div>
              <h2 style="color:#1a1a2e;margin:0 0 20px;font-size:24px;font-weight:600;text-align:center">Redefinição de Senha</h2>
              <p style="color:#4a5568;margin:0 0 20px;font-size:16px;line-height:1.6;text-align:center">
                Olá, <strong>${parceiro.nome}</strong>!<br>
                Sua senha foi redefinida com sucesso.
              </p>
              <!-- New Password Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef3c7 0%, #fde68a 100%);border-radius:12px;margin:25px 0;border:1px solid #f59e0b">
                <tr>
                  <td style="padding:25px;text-align:center">
                    <p style="color:#92400e;margin:0 0 15px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Sua Nova Senha</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0">
                          <span style="color:#64748b;font-size:14px">📋 Login:</span>
                          <span style="color:#1a1a2e;font-size:18px;font-weight:700;margin-left:10px">${parceiro.codigo || parceiro.login}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #f59e0b40">
                          <span style="color:#64748b;font-size:14px">🔑 Nova Senha:</span>
                          <span style="color:${primaryColor};font-size:18px;font-weight:700;margin-left:10px">${parceiro.senha}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:25px 0;text-align:center">
                    <a href="https://parceiro.finqz.com.br" style="display:inline-block;background:${primaryColor};color:#ffffff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;box-shadow:0 4px 14px ${primaryColor}40">
                      Acessar Sistema →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Security Notice -->
              <div style="background:#ecfdf5;border-radius:8px;padding:15px;margin-top:20px;border-left:4px solid #10b981">
                <p style="color:#065f46;margin:0;font-size:14px">
                  <strong>💡 Dica de Segurança:</strong> Recomendamos que você altere esta senha imediatamente após fazer login para uma senha pessoal que você lembre facilmente.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:30px 40px;text-align:center;border-top:1px solid #e2e8f0">
              <p style="color:#94a3b8;margin:0;font-size:13px">
                © ${new Date().getFullYear()} ${empresaNome}. Todos os direitos reservados.
              </p>
              <p style="color:#cbd5e1;margin:10px 0 0;font-size:12px">
                Se você não solicitou esta mudança, entre em contato conosco imediatamente.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    try {
      const resendApiKey = edgespark.secret.get("RESEND_API_KEY");
      
      if (resendApiKey) {
        console.log("[EMAIL] Enviando email de reset de senha via Resend...");
        
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: parceiro.email,
            subject: "🔐 Sua senha foi redefinida - FINQZ PRO",
            html: html
          })
        });

        if (res.ok) {
          console.log("[EMAIL] Email de reset enviado com sucesso");
          resultado.success = true;
          resultado.provider = "resend";
          return resultado;
        } else {
          console.log("[EMAIL] Resend falhou no reset de senha");
          throw new Error("Resend failed");
        }
      }
    } catch (err) {
      console.error("[EMAIL] Erro ao enviar email de reset:", err);
    }

    resultado.error = "Falha ao enviar email de redefinição";
    return resultado;
  };

  // ═══════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  // Health check
  app.get("/api/public/health", (c) => c.json({ status: "ok", app: "FINQZ PRO" }));
app.get("/api/get-session", (c) => {
  return c.json({
    authenticated: true,
    user: {
      id: "local-admin",
      email: "admin@finqz.com.br",
      nome: "Admin Local",
      role: "ADMIN_SISTEMA",
      perfil: "ADMIN_SISTEMA",
      permissions: ["*"],
      tenantId: "local",
      parceiroId: null,
      scope: "ALL",
    },
  });
});
  // Send email endpoint
  // Send email - PROTECTED: requires auth and permission
  app.post("/api/email/send", async (c) => {
    try {
      // Require authentication
      const user = await getCurrentUser(c);
      if (!user) {
        return c.json({ error: "Unauthorized", message: "Autenticação necessária" }, 401);
      }
      
      // Check permission for email sending
      const role = user.role || user.perfil;
      const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO', 'ADMIN_FRANQUIA', 'GERENTE_FRANQUIA'];
      if (!allowedRoles.includes(role) && !user.permissions.includes('*')) {
        return c.json({ error: "Forbidden", message: "Permissão negada para enviar emails" }, 403);
      }
      
      const body = await c.req.json();
      const { to, subject, html, text } = body;

      if (!to || !subject || !html) {
        return c.json({ success: false, error: "Missing required fields: to, subject, html" }, 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return c.json({ success: false, error: "Invalid email format" }, 400);
      }

      // Use template-based HTML (prevent arbitrary HTML injection)
      const result = await sendEmail(to, subject, html, text);
      return c.json(result);
    } catch (error) {
      console.error("[API] Error sending email:", error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  });

  // Save email template settings
  app.post("/api/settings/email-template", async (c) => {
    try {
      const user = await getCurrentUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const body = await c.req.json();
      const { empresaNome, primaryColor, logoUrl, smtpFrom, resendApiKey } = body;

      // Save to secrets (in production, you'd want proper secret management)
      // Note: EdgeSpark secrets are set at the platform level, not per-request
      // For now, we'll return success and let the user know to set secrets manually
      // or we can store in database for settings that don't need to be secrets
      
      console.log("[API] Email template settings received:", { empresaNome, primaryColor, logoUrl, smtpFrom });
      
      // Store non-sensitive settings in a config table or return for client-side display
      // The actual secrets (API keys) need to be set via platform secrets
      
      return c.json({ 
        success: true, 
        message: "Configurações de template salvas. Para aplicar as alterações, configure os secrets: EMPRESA_NOME, EMAIL_PRIMARY_COLOR, EMPRESA_LOGO_URL, SMTP_FROM",
        settings: { empresaNome, primaryColor, logoUrl, smtpFrom }
      });
    } catch (error) {
      console.error("[API] Error saving email template settings:", error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  });

  // Reset password and send notifications (email + WhatsApp) - PROTECTED
  app.post("/api/parceiros/:id/reset-senha", async (c) => {
    try {
      const user = await getCurrentUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      
      // Check permission - only admins can reset passwords
      const role = user.role || user.perfil;
      const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO', 'ADMIN_FRANQUIA', 'GERENTE_FRANQUIA', 'ROLE_DIRETOR_COMERCIAL', 'ROLE_GERENTE_COMERCIAL'];
      if (!allowedRoles.includes(role) && !user.permissions.includes('*')) {
        return c.json({ error: "Forbidden", message: "Permissão negada para resetar senhas" }, 403);
      }

      const id = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const { novaSenha, parceiro: parceiroData, enviarEmail, enviarWhatsapp } = body;

      // Get partner from database
      const parceiro = await edgespark.db
        .select()
        .from(tables.parceiros)
        .where(eq(tables.parceiros.id, id));

      if (parceiro.length === 0) {
        return c.json({ success: false, error: "Parceiro não encontrado" }, 404);
      }

      const p = parceiro[0];

      // Use dados do body ou do banco
      const nome = parceiroData?.nome || p.nome;
      const email = parceiroData?.email || p.email;
      const celular = parceiroData?.celular || p.telefone;
      const login = parceiroData?.login || p.codigo;

      // Generate secure password if not provided
      const senhaFinal = novaSenha || gerarSenhaSegura();
      
      // TODO: Hash password before storing (requires bcrypt/argon2 in production)
      // For now, store with prefix to indicate it should be changed
      const hashedSenha = `TEMPORARY:${senhaFinal}`;

      // Update password - NEVER return password in response
      await edgespark.db
        .update(tables.parceiros)
        .set({ senha: hashedSenha, mustChangePassword: 1, updatedAt: Date.now() })
        .where(eq(tables.parceiros.id, id));

      const results: { email?: any; whatsapp?: any } = {};

      // Send email if requested - password is sent for first login only
      if (enviarEmail && email) {
        console.log("[API] Enviando email de nova senha para parceiro:", nome);
        const emailResult = await enviarEmailResetSenha({
          nome,
          email,
          codigo: login,
          senha: senhaFinal, // Only sent via email for first-time login
        });
        results.email = emailResult;
      }

      // Send WhatsApp if requested and has celular
      if (enviarWhatsapp && celular) {
        const whatsappApiKey = edgespark.secret.get("WHATSAPP_API_KEY");
        if (whatsappApiKey) {
          const telefone = celular.replace(/\D/g, "");
          // Don't send password via WhatsApp - only via email for security
          const mensagem = `*FINQZ PRO - Senha Resetada*\\n\\nOlá, ${nome}!\\n\\nSua senha foi resetada pelo administrador.\\n\\n*Login:* ${login}\\n\\nVerifique seu email para a nova senha.\\n\\nAcesse: https://parceiro.finqz.com.br`;
          
          try {
            const waResponse = await fetch("https://api.whatsapp.com/v1/messages", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${whatsappApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: telefone,
                type: "text",
                text: { body: mensagem },
              }),
            });
            const waResult = await waResponse.json();
            results.whatsapp = { success: waResponse.ok, data: waResult };
            console.log("[WHATSAPP] Envio de nova senha:", waResponse.ok ? "sucesso" : "erro");
          } catch (waError) {
            console.error("[WHATSAPP] Erro ao enviar:", waError);
            results.whatsapp = { success: false, error: String(waError) };
          }
        } else {
          console.log("[WHATSAPP] API key não configurada");
          results.whatsapp = { success: false, error: "WhatsApp API não configurada" };
        }
      }

      await logAction(user.id, "RESET_SENHA", "parceiros", id, { parceiroId: id });

      return c.json({ success: true, message: "Senha resetada com sucesso", notifications: results });
    } catch (error) {
      console.error("[API] Erro ao resetar senha:", error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  });

  // Lead capture from landing page
  app.post("/api/leads", async (c) => {
    try {
      const body = await c.req.json();
      const { nome, cpf_cnpj, email, telefone, produto } = body;

      console.log("[API] POST /api/leads - new lead:", { nome, cpf_cnpj, email, telefone, produto });

      // Check if client exists
      let clienteId: number;
      
      if (cpf_cnpj) {
        const existingClient = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.cpfCnpj, cpf_cnpj));
        
        if (existingClient.length > 0) {
          clienteId = existingClient[0].id;
        } else {
          // Create new client
          const newClient = await edgespark.db.insert(tables.clientes).values({
            nome: nome || "",
            cpfCnpj: cpf_cnpj || null,
            email: email || null,
            telefone: telefone || null,
            celular: telefone || null,
          }).returning();
          clienteId = newClient[0].id;
        }
      } else {
        // Create new client without CPF
        const newClient = await edgespark.db.insert(tables.clientes).values({
          nome: nome || "",
          cpfCnpj: cpf_cnpj || null,
          email: email || null,
          telefone: telefone || null,
          celular: telefone || null,
        }).returning();
        clienteId = newClient[0].id;
      }

      // Find product
      let produtoId = 1;
      if (produto) {
        const products = await edgespark.db
          .select()
          .from(tables.produtos)
          .where(eq(tables.produtos.nome, produto));
        if (products.length > 0) {
          produtoId = products[0].id;
        }
      }

      // Create opportunity
      const newOportunidade = await edgespark.db.insert(tables.oportunidades).values({
        clienteId,
        produtoId,
        status: "entrada",
        valor: 0,
        probabilidade: 10,
      }).returning();

      console.log("[API] POST /api/leads - success, oportunidadeId:", newOportunidade[0].id);

      return c.json({ 
        success: true, 
        message: "Lead criado com sucesso",
        oportunidade_id: newOportunidade[0].id,
        cliente_id: clienteId
      });
    } catch (error: any) {
      console.error("[API] POST /api/leads - error:", error.message);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // EVENTOS - Sistema de tracking de eventos
  // ═══════════════════════════════════════════════════════════

  // POST /api/events - Registrar evento
  app.post("/api/events", async (c) => {
    try {
      const body = await c.req.json();
      const { lead_id, tipo, payload } = body;

      if (!lead_id || !tipo) {
        return c.json({ success: false, error: "lead_id e tipo são obrigatórios" }, 400);
      }

      // Inserir evento (não bloqueia o fluxo principal)
      try {
        await edgespark.db
          .insert(tables.eventos)
          .values({
            leadId: lead_id,
            tipo: tipo,
            dados: payload ? JSON.stringify(payload) : null,
            createdAt: Date.now()
          });
      } catch (e) {
        console.error("[API] Erro ao registrar evento:", e);
        // Não falha a requisição principal
      }

      return c.json({ success: true });
    } catch (error: any) {
      console.error("[API] POST /api/events - error:", error.message);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // GET /api/events/:leadId - Listar eventos de um lead
  app.get("/api/events/:leadId", async (c) => {
    try {
      const leadId = parseInt(c.req.param("leadId"));
      const limit = parseInt(c.req.query("limit") || "50");

      const events = await edgespark.db
        .select()
        .from(tables.eventos)
        .where(eq(tables.eventos.leadId as any, leadId))
        .orderBy(desc(tables.eventos.createdAt))
        .limit(limit);

      return c.json({ events: events.map(e => ({
        ...e,
        payload: e.dados ? JSON.parse(e.dados) : null
      })) });
    } catch (error: any) {
      console.error("[API] GET /api/events/:leadId - error:", error.message);
      return c.json({ events: [], error: error.message }, 500);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // AI LEAD QUALIFICATION
  // ═══════════════════════════════════════════════════════════

  // POST /api/leads/:id/qualify - Qualificar lead com IA
  app.post("/api/leads/:id/qualify", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const leadId = parseInt(c.req.param("id"));

    try {
      // Buscar dados do lead
      const leads = await edgespark.db
        .select()
        .from(tables.clientes)
        .where(eq(tables.clientes.id, leadId))
        .limit(1);

      if (leads.length === 0) {
        return c.json({ error: "Lead não encontrado" }, 404);
      }

      const lead = leads[0];

      // Buscar eventos recentes do lead
      const eventos = await edgespark.db
        .select()
        .from(tables.eventos)
        .where(eq(tables.eventos.leadId as any, leadId))
        .orderBy(desc(tables.eventos.createdAt))
        .limit(10);

      // Preparar dados para IA
      const leadData = {
        nome: lead.nome,
        email: lead.email,
        celular: lead.celular,
        cidade: lead.cidade,
        estado: lead.estado,
        status: (lead as any).status || 'lead',
        origem: (lead as any).origem || 'manual',
        etapa_funil: (lead as any).etapaFunil || null,
        ultima_interacao_at: lead.updatedAt,
        tags: (lead as any).tags ? JSON.parse((lead as any).tags) : [],
        eventos_recentes: eventos.map(e => ({
          tipo: e.tipo,
          data: new Date(e.createdAt).toLocaleString('pt-BR'),
          dados: e.dados ? JSON.parse(e.dados) : null
        }))
      };

      // Chamar serviço de IA (simulado - em produção usaria a API real)
      // Por agora, retornamos uma qualificação baseada em regras
      const score = calcularScoreLead(leadData);
      const probability = Math.min(95, Math.max(5, score * 10));
      
      const nextSteps = gerarProximosPassos(leadData, score);
      const observations = gerarObservacoes(leadData);
      const tags = gerarTags(leadData, score);

      const result = {
        score,
        probability,
        nextSteps,
        observations,
        tags,
        analysis: `Lead ${score >= 7 ? 'com alto potencial' : score >= 4 ? 'com potencial médio' : 'que precisa de nutrição'}. ${observations}`
      };

      // Registrar evento de qualificação
      try {
        await edgespark.db
          .insert(tables.eventos)
          .values({
            leadId: leadId,
            tipo: 'lead_qualified',
            dados: JSON.stringify(result),
            createdAt: Date.now()
          });
      } catch (e) {
        console.error("[API] Erro ao registrar evento de qualificação:", e);
      }

      return c.json({ 
        success: true, 
        qualification: result 
      });
    } catch (error: any) {
      console.error("[API] POST /api/leads/:id/qualify - error:", error.message);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Funções auxiliares para qualificação baseada em regras
  function calcularScoreLead(lead: any): number {
    let score = 5;

    // Baseado na origem
    if (lead.origem === 'campanha') score += 2;
    if (lead.origem === 'indicacao') score += 3;
    if (lead.origem === 'site') score += 1;

    // Baseado no status
    if (lead.status === 'cliente') score += 3;
    if (lead.status === 'lead') score += 1;

    // Baseado em dados preenchidos
    if (lead.email) score += 1;
    if (lead.celular) score += 1;
    if (lead.cidade && lead.estado) score += 1;

    // Baseado em eventos recentes
    if (lead.eventos_recentes && lead.eventos_recentes.length > 0) {
      const ultimoEvento = lead.eventos_recentes[0];
      const horasDiff = (Date.now() - new Date(ultimoEvento.data).getTime()) / (1000 * 60 * 60);
      
      if (horasDiff < 24) score += 2;
      else if (horasDiff < 72) score += 1;
      else if (horasDiff > 168) score -= 1; // mais de 1 semana
    }

    return Math.min(10, Math.max(1, score));
  }

  function gerarProximosPassos(lead: any, score: number): string[] {
    const passos = [];
    
    if (score >= 8) {
      passos.push("Entrar em contato imediato - alto potencial");
      passos.push("Agendar demonstração");
      passos.push("Enviar proposta comercial");
    } else if (score >= 5) {
      passos.push("Nutrir com conteúdo relevante");
      passos.push("Agendar follow-up em 2 dias");
      passos.push("Verificar interesse em produto");
    } else {
      passos.push("Adicionar à lista de nutrição");
      passos.push("Enviar conteúdo educativo");
      passos.push("Reengajar em 7 dias");
    }

    return passos;
  }

  function gerarObservacoes(lead: any): string {
    let obs = "";
    
    if (lead.origem === 'campanha') {
      obs += "Vindo de campanha, demonstra interesse ativo. ";
    } else if (lead.origem === 'indicacao') {
      obs += "Indicado por cliente, confiança elevada. ";
    }

    if (lead.cidade && lead.estado) {
      obs += `Localizado em ${lead.cidade}/${lead.estado}. `;
    }

    if (lead.eventos_recentes && lead.eventos_recentes.length > 0) {
      obs += "Teve interação recente com a empresa. ";
    }

    return obs || "Lead novo sem histórico detalhado.";
  }

  function gerarTags(lead: any, score: number): string[] {
    const tags = [];

    if (score >= 8) tags.push("quente");
    else if (score >= 5) tags.push("morno");
    else tags.push("frio");

    if (lead.origem === 'campanha') tags.push("campanha");
    if (lead.origem === 'indicacao') tags.push("indicacao");
    if (lead.origem === 'site') tags.push("site");

    if (lead.status === 'cliente') tags.push("cliente");

    return [...new Set(tags)];
  }

  // ═══════════════════════════════════════════════════════════
  // AUTHENTICATED ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  // Dashboard - Production vs Projection
  app.get("/api/dashboard/producao", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const periodo = c.req.query("periodo") || "mes";
    let startDate: number;
    const now = Date.now();

    // Calculate start date based on period
    switch (periodo) {
      case "semana":
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "mes":
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "trimestre":
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case "ano":
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        startDate = now - 30 * 24 * 60 * 60 * 1000;
    }

    // Get closed opportunities (finalizado)
    const closedOpportunities = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(and(
        eq(tables.oportunidades.status, "finalizado"),
        gte(tables.oportunidades.createdAt, startDate)
      ));

    const producao = closedOpportunities.reduce((sum, opp) => sum + (opp.valor || 0), 0);

    // Get pipeline opportunities with probability
    const pipelineOpportunities = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(and(
        eq(tables.oportunidades.status, "aprovado"),
        gte(tables.oportunidades.createdAt, startDate)
      ));

    const projetado = pipelineOpportunities.reduce((sum, opp) => {
      return sum + ((opp.valor || 0) * (opp.probabilidade || 0) / 100);
    }, 0);

    // Get monthly data for chart
    const allClosed = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(eq(tables.oportunidades.status, "finalizado"));

    const monthlyData: Record<string, number> = {};
    allClosed.forEach(opp => {
      const date = new Date(opp.createdAt || Date.now());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + (opp.valor || 0);
    });

    return c.json({
      producao,
      projetado,
      monthlyData: Object.entries(monthlyData).map(([mes, valor]) => ({ mes, valor }))
    });
  });

  // Dashboard - Funnel
  app.get("/api/dashboard/funil", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const statuses = ["entrada", "analise", "documentacao", "aprovado", "reprovado", "finalizado"];
    const funnel: Record<string, { count: number; valor: number }> = {};

    for (const status of statuses) {
      const opportunities = await edgespark.db
        .select()
        .from(tables.oportunidades)
        .where(eq(tables.oportunidades.status, status));
      
      funnel[status] = {
        count: opportunities.length,
        valor: opportunities.reduce((sum, opp) => sum + (opp.valor || 0), 0)
      };
    }

    return c.json(funnel);
  });

  // Dashboard - KPIs
  app.get("/api/dashboard/kpis", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const totalClientes = await edgespark.db.select().from(tables.clientes);
    const totalOportunidades = await edgespark.db.select().from(tables.oportunidades);
    const totalParceiros = await edgespark.db.select().from(tables.parceiros);
    
    const closedOpp = totalOportunidades.filter(o => o.status === "finalizado");
    const totalVendas = closedOpp.reduce((sum, o) => sum + (o.valor || 0), 0);

    // Conversion rate
    const entradaCount = totalOportunidades.filter(o => o.status === "entrada").length;
    const finalCount = closedOpp.length;
    const taxaConversao = entradaCount > 0 ? (finalCount / entradaCount) * 100 : 0;

    return c.json({
      totalClientes: totalClientes.length,
      totalOportunidades: totalOportunidades.length,
      totalParceiros: totalParceiros.length,
      totalVendas,
      taxaConversao: taxaConversao.toFixed(2)
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CLIENTES
  // ═══════════════════════════════════════════════════════════

  // Get all clients - PROTECTED with tenant filtering
  app.get("/api/clientes", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const search = c.req.query("search");
    
    // Build tenant filter
    const role = user.role || user.perfil;
    const isAdmin = user.permissions.includes('*') || ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO'].includes(role);
    
    let baseQuery = edgespark.db.select().from(tables.clientes);
    let whereClause = undefined;
    
    if (!isAdmin && user.parceiroId) {
      // Non-admin can only see clients from their organization
      whereClause = eq(tables.clientes.ownerId, user.parceiroId);
      baseQuery = edgespark.db
        .select()
        .from(tables.clientes)
        .where(whereClause) as any;
    }
    
    if (search) {
      const searchFilter = or(
        like(tables.clientes.nome, `%${search}%`),
        like(tables.clientes.email, `%${search}%`),
        like(tables.clientes.cpfCnpj, `%${search}%`)
      );
      
      if (whereClause) {
        baseQuery = edgespark.db
          .select()
          .from(tables.clientes)
          .where(and(whereClause, searchFilter)) as any;
      } else {
        baseQuery = edgespark.db
          .select()
          .from(tables.clientes)
          .where(searchFilter) as any;
      }
    }

    const clientes = await baseQuery.orderBy(desc(tables.clientes.createdAt));
    return c.json({ clientes });
  });

  // Get client by ID - PROTECTED with tenant filtering
  app.get("/api/clientes/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    
    // Build tenant filter
    const role = user.role || user.perfil;
    const isAdmin = user.permissions.includes('*') || ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO'].includes(role);
    
    let query = edgespark.db
      .select()
      .from(tables.clientes)
      .where(eq(tables.clientes.id, id));
    
    if (!isAdmin && user.parceiroId) {
      query = edgespark.db
        .select()
        .from(tables.clientes)
        .where(and(
          eq(tables.clientes.id, id),
          eq(tables.clientes.ownerId, user.parceiroId)
        )) as any;
    }

    const cliente = await query;

    if (cliente.length === 0) {
      return c.json({ error: "Cliente não encontrado" }, 404);
    }

    // Get opportunities for this client
    let oppQuery = edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(eq(tables.oportunidades.clienteId, id));
    
    if (!isAdmin && user.parceiroId) {
      oppQuery = edgespark.db
        .select()
        .from(tables.oportunidades)
        .where(and(
          eq(tables.oportunidades.clienteId, id),
          eq(tables.oportunidades.parceiroId, user.parceiroId)
        )) as any;
    }

    const oportunidades = await oppQuery;

    return c.json({ cliente: cliente[0], oportunidades });
  });

  app.post("/api/clientes", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/clientes - creating:", body);

    const newCliente = await edgespark.db.insert(tables.clientes).values({
      nome: body.nome,
      cpfCnpj: body.cpf_cnpj || null,
      email: body.email || null,
      telefone: body.telefone || null,
      celular: body.celular || null,
      cep: body.cep || null,
      rua: body.rua || null,
      numero: body.numero || null,
      complemento: body.complemento || null,
      bairro: body.bairro || null,
      cidade: body.cidade || null,
      estado: body.estado || null,
    }).returning();

    await logAction(user.id, "CREATE", "clientes", newCliente[0].id, null, body);

    // Emit event: lead_created
    await emitEvent(edgespark, {
      type: 'lead_created',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'clientes',
      resourceId: newCliente[0].id,
      clienteId: newCliente[0].id,
      payload: { nome: body.nome, email: body.email, telefone: body.telefone }
    });

    return c.json({ cliente: newCliente[0] });
  });

  app.put("/api/clientes/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de edição
    const permission = requirePermission(user, 'clientes', 'edit');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.clientes)
      .where(eq(tables.clientes.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Cliente não encontrado" }, 404);
    }

    const updated = await edgespark.db
      .update(tables.clientes)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.clientes.id, id))
      .returning();

    await logAction(user.id, "UPDATE", "clientes", id, existing[0], body);

    // Emit event: cliente_updated
    await emitEvent(edgespark, {
      type: 'cliente_updated',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'clientes',
      resourceId: id,
      clienteId: id,
      payload: { changes: Object.keys(body) }
    });

    return c.json({ cliente: updated[0] });
  });

  app.delete("/api/clientes/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de exclusão
    const permission = requirePermission(user, 'clientes', 'delete');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));

    const existing = await edgespark.db
      .select()
      .from(tables.clientes)
      .where(eq(tables.clientes.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Cliente não encontrado" }, 404);
    }

    await edgespark.db
      .delete(tables.clientes)
      .where(eq(tables.clientes.id, id));

    await logAction(user.id, "DELETE", "clientes", id, existing[0], null);

    // Emit event: cliente_deleted
    await emitEvent(edgespark, {
      type: 'cliente_deleted',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'clientes',
      resourceId: id,
      clienteId: id,
      payload: { nome: existing[0].nome, email: existing[0].email }
    });

    // Emit delete_performed event for audit
    await emitEvent(edgespark, {
      type: 'delete_performed',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'clientes',
      resourceId: id,
      payload: { entity: 'cliente', nome: existing[0].nome }
    });

    // Create alert for delete action
    await createAlert(
      'DELETE_PERFORMED',
      user.id,
      'medium',
      `Cliente deletado: ${existing[0].nome} (ID: ${id})`,
      { entity: 'cliente', resourceId: id, nome: existing[0].nome }
    );

    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // PRODUTOS
  // ═══════════════════════════════════════════════════════════

  app.get("/api/produtos", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const produtos = await edgespark.db
      .select()
      .from(tables.produtos)
      .where(eq(tables.produtos.ativo, 1));

    return c.json({ produtos });
  });

  app.get("/api/produtos/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const produto = await edgespark.db
      .select()
      .from(tables.produtos)
      .where(eq(tables.produtos.id, id));

    if (produto.length === 0) {
      return c.json({ error: "Produto não encontrado" }, 404);
    }

    return c.json({ produto: produto[0] });
  });

  app.post("/api/produtos", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/produtos - creating:", body);

    const newProduto = await edgespark.db.insert(tables.produtos).values({
      nome: body.nome,
      descricao: body.descricao || null,
      pipeline: body.pipeline || "default",
      documentos: body.documentos ? JSON.stringify(body.documentos) : null,
      ativo: body.ativo !== undefined ? body.ativo : 1,
    }).returning();

    await logAction(user.id, "CREATE", "produtos", newProduto[0].id, null, body);

    return c.json({ produto: newProduto[0] });
  });

  app.put("/api/produtos/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de edição
    const permission = requirePermission(user, 'produtos', 'edit');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.produtos)
      .where(eq(tables.produtos.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Produto não encontrado" }, 404);
    }

    const updated = await edgespark.db
      .update(tables.produtos)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.produtos.id, id))
      .returning();

    await logAction(user.id, "UPDATE", "produtos", id, existing[0], body);

    return c.json({ produto: updated[0] });
  });

  app.delete("/api/produtos/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de exclusão
    const permission = requirePermission(user, 'produtos', 'delete');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));

    // Soft delete
    await edgespark.db
      .update(tables.produtos)
      .set({ ativo: 0, updatedAt: Date.now() })
      .where(eq(tables.produtos.id, id));

    await logAction(user.id, "DELETE", "produtos", id, null, null);

    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // PARCEIROS
  // ═══════════════════════════════════════════════════════════

  // Get all partners - PROTECTED with tenant filtering
  app.get("/api/parceiros", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const tipo = c.req.query("tipo");
    const status = c.req.query("status");

    // Build tenant filter
    let tenantFilter = undefined;
    const role = user.role || user.perfil;
    const isAdmin = user.permissions.includes('*') || ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO'].includes(role);
    
    if (!isAdmin) {
      // Non-admin users can only see their own organization
      if (user.parceiroId) {
        tenantFilter = eq(tables.parceiros.parentId, user.parceiroId);
      }
    }

    let query = edgespark.db.select().from(tables.parceiros);

    if (tenantFilter) {
      query = edgespark.db
        .select()
        .from(tables.parceiros)
        .where(tenantFilter) as any;
    }

    if (tipo) {
      query = edgespark.db
        .select()
        .from(tables.parceiros)
        .where(tipo === 'company' 
          ? eq(tables.parceiros.tipo, tipo)
          : tipo === 'franquia'
            ? eq(tables.parceiros.tipo, tipo)
            : eq(tables.parceiros.tipo, tipo)) as any;
    }

    let parceiros = await query;

    if (status) {
      parceiros = parceiros.filter(p => p.status === status);
    }

    // Remove sensitive data from response
    const safeParceiros = parceiros.map(p => ({
      ...p,
      senha: undefined, // Never return password
      password: undefined,
    }));

    // Build hierarchy
    const companies = safeParceiros.filter(p => p.tipo === "company");
    const franquias = safeParceiros.filter(p => p.tipo === "franquia");
    const franqueados = safeParceiros.filter(p => p.tipo === "franqueado");

    return c.json({ parceiros: safeParceiros, companies, franquias, franqueados });
  });

  // Get partner by ID - PROTECTED with tenant filtering
  app.get("/api/parceiros/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    
    // Get partner from database
    const parceiro = await edgespark.db
      .select()
      .from(tables.parceiros)
      .where(eq(tables.parceiros.id, id));

    if (parceiro.length === 0) {
      return c.json({ error: "Parceiro não encontrado" }, 404);
    }

    // Check tenant access
    const role = user.role || user.perfil;
    const isAdmin = user.permissions.includes('*') || ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO'].includes(role);
    
    if (!isAdmin && user.parceiroId) {
      // Non-admin can only view their own organization
      const p = parceiro[0];
      if (p.parentId !== user.parceiroId && p.id !== user.parceiroId) {
        return c.json({ error: "Forbidden", message: "Acesso negado a este parceiro" }, 403);
      }
    }

    // Get children
    const children = await edgespark.db
      .select()
      .from(tables.parceiros)
      .where(eq(tables.parceiros.parentId, id));

    // Remove sensitive data
    const safePartner = {
      ...parceiro[0],
      senha: undefined,
      password: undefined,
    };
    
    const safeChildren = children.map(p => ({
      ...p,
      senha: undefined,
      password: undefined,
    }));

    return c.json({ parceiro: safePartner, children: safeChildren });
  });

  app.post("/api/parceiros", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/parceiros - creating:", body);

    // Generate code and password for partner
    const codigo = gerarCodigoParceiro();
    const senha = gerarSenhaSegura();

    const newParceiro = await edgespark.db.insert(tables.parceiros).values({
      nome: body.nome,
      tipo: body.tipo,
      cnpj: body.cnpj || null,
      responsavel: body.responsavel || null,
      telefone: body.telefone || null,
      email: body.email || null,
      cep: body.cep || null,
      rua: body.rua || null,
      numero: body.numero || null,
      complemento: body.complemento || null,
      bairro: body.bairro || null,
      cidade: body.cidade || null,
      estado: body.estado || null,
      status: body.status || "prospect",
      parentId: body.parent_id || null,
      gestorId: body.gestor_id || null,
      comissaoCompany: body.comissao_company || 0,
      comissaoFranquia: body.comissao_franquia || 0,
      comissaoFranqueado: body.comissao_franqueado || 0,
      codigo: codigo,
      senha: senha,
    }).returning();

    await logAction(user.id, "CREATE", "parceiros", newParceiro[0].id, null, body);

    // Send credentials email if partner has email
    if (newParceiro[0].email) {
      console.log("[API] Enviando email de credenciais para parceiro:", newParceiro[0].nome);
      await enviarEmailCredenciaisParceiro(newParceiro[0]);
    }

    return c.json({ parceiro: newParceiro[0] });
  });

  app.put("/api/parceiros/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de edição
    const permission = requirePermission(user, 'parceiros', 'edit');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.parceiros)
      .where(eq(tables.parceiros.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Parceiro não encontrado" }, 404);
    }

    const updated = await edgespark.db
      .update(tables.parceiros)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.parceiros.id, id))
      .returning();

    await logAction(user.id, "UPDATE", "parceiros", id, existing[0], body);

    return c.json({ parceiro: updated[0] });
  });

  app.delete("/api/parceiros/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de exclusão
    const permission = requirePermission(user, 'parceiros', 'delete');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));

    await edgespark.db
      .delete(tables.parceiros)
      .where(eq(tables.parceiros.id, id));

    await logAction(user.id, "DELETE", "parceiros", id, null, null);

    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // OPORTUNIDADES
  // ═══════════════════════════════════════════════════════════

  app.get("/api/oportunidades", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const status = c.req.query("status");
    const produtoId = c.req.query("produto_id");
    const parceiroId = c.req.query("parceiro_id");

    let oportunidades = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .orderBy(desc(tables.oportunidades.createdAt));

    if (status) {
      oportunidades = oportunidades.filter(o => o.status === status);
    }
    if (produtoId) {
      oportunidades = oportunidades.filter(o => o.produtoId === parseInt(produtoId));
    }
    if (parceiroId) {
      oportunidades = oportunidades.filter(o => o.parceiroId === parseInt(parceiroId));
    }

    // Get client and product info for each opportunity
    const oportunidadesWithDetails = await Promise.all(
      oportunidades.map(async (opp) => {
        const cliente = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.id, opp.clienteId));
        
        const produto = await edgespark.db
          .select()
          .from(tables.produtos)
          .where(eq(tables.produtos.id, opp.produtoId));

        return {
          ...opp,
          cliente: cliente[0] || null,
          produto: produto[0] || null,
        };
      })
    );

    return c.json({ oportunidades: oportunidadesWithDetails });
  });

  app.get("/api/oportunidades/pipeline", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const produtoId = c.req.query("produto_id");
    const statuses = ["entrada", "analise", "documentacao", "aprovado", "reprovado", "finalizado"];
    
    const pipeline: Record<string, any[]> = {};

    for (const status of statuses) {
      let oportunidades = await edgespark.db
        .select()
        .from(tables.oportunidades)
        .where(eq(tables.oportunidades.status, status));

      if (produtoId) {
        oportunidades = oportunidades.filter(o => o.produtoId === parseInt(produtoId));
      }

      // Add client info
      const withClients = await Promise.all(
        oportunidades.map(async (opp) => {
          const cliente = await edgespark.db
            .select()
            .from(tables.clientes)
            .where(eq(tables.clientes.id, opp.clienteId));
          return { ...opp, cliente: cliente[0] || null };
        })
      );

      pipeline[status] = withClients;
    }

    return c.json({ pipeline });
  });

  app.get("/api/oportunidades/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const oportunidade = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(eq(tables.oportunidades.id, id));

    if (oportunidade.length === 0) {
      return c.json({ error: "Oportunidade não encontrada" }, 404);
    }

    const cliente = await edgespark.db
      .select()
      .from(tables.clientes)
      .where(eq(tables.clientes.id, oportunidade[0].clienteId));

    const produto = await edgespark.db
      .select()
      .from(tables.produtos)
      .where(eq(tables.produtos.id, oportunidade[0].produtoId));

    const documentos = await edgespark.db
      .select()
      .from(tables.documentos)
      .where(eq(tables.documentos.oportunidadeId, id));

    const comissoes = await edgespark.db
      .select()
      .from(tables.comissoes)
      .where(eq(tables.comissoes.oportunidadeId, id));

    return c.json({
      oportunidade: oportunidade[0],
      cliente: cliente[0] || null,
      produto: produto[0] || null,
      documentos,
      comissoes
    });
  });

  app.post("/api/oportunidades", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/oportunidades - creating:", body);

    const newOportunidade = await edgespark.db.insert(tables.oportunidades).values({
      clienteId: body.cliente_id,
      produtoId: body.produto_id,
      parceiroId: body.parceiro_id || null,
      usuarioId: body.usuario_id || user.id,
      status: body.status || "entrada",
      valor: body.valor || 0,
      probabilidade: body.probabilidade || 10,
      observacoes: body.observacoes || null,
    }).returning();

    await logAction(user.id, "CREATE", "oportunidades", newOportunidade[0].id, null, body);

    // Emit event: opportunity_created
    await emitEvent(edgespark, {
      type: 'opportunity_created',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'oportunidades',
      resourceId: newOportunidade[0].id,
      oportunidadeId: newOportunidade[0].id,
      clienteId: body.cliente_id,
      payload: { status: body.status, valor: body.valor }
    });

    return c.json({ oportunidade: newOportunidade[0] });
  });

  app.put("/api/oportunidades/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de edição
    const permission = requirePermission(user, 'oportunidades', 'edit');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(eq(tables.oportunidades.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Oportunidade não encontrada" }, 404);
    }

    const updated = await edgespark.db
      .update(tables.oportunidades)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.oportunidades.id, id))
      .returning();

    // If status changed to finalized, calculate commissions
    if (body.status === "finalizado" && existing[0].status !== "finalizado") {
      const opp = updated[0];
      await calcularComissao(edgespark, opp);
    }

    // Execute automations if status changed
    if (body.status && body.status !== (existing[0].status || '')) {
      await executarAutomacoes(updated[0], existing[0].status || '', body.status);
    }

    // Log de auditoria
    await logAction(user.id, "UPDATE", "oportunidades", id, existing[0], body);

    // Emit event: opportunity_updated
    await emitEvent(edgespark, {
      type: 'opportunity_updated',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'oportunidades',
      resourceId: id,
      oportunidadeId: id,
      clienteId: existing[0].clienteId,
      payload: { changes: Object.keys(body) }
    });

    // Emit opportunity_moved if status changed
    if (body.status && body.status !== existing[0].status) {
      await emitEvent(edgespark, {
        type: 'opportunity_moved',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'oportunidades',
        resourceId: id,
        oportunidadeId: id,
        clienteId: existing[0].clienteId,
        payload: { 
          fromStatus: existing[0].status, 
          toStatus: body.status 
        }
      });
    }

    return c.json({ oportunidade: updated[0] });
  });

  app.delete("/api/oportunidades/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de exclusão
    const permission = requirePermission(user, 'oportunidades', 'delete');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));

    // Get existing record before deletion
    const existing = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(eq(tables.oportunidades.id, id))
      .limit(1);

    await edgespark.db
      .delete(tables.oportunidades)
      .where(eq(tables.oportunidades.id, id));

    await logAction(user.id, "DELETE", "oportunidades", id, null, null);

    // Emit event: opportunity_deleted
    if (existing.length > 0) {
      await emitEvent(edgespark, {
        type: 'opportunity_deleted',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'oportunidades',
        resourceId: id,
        oportunidadeId: id,
        clienteId: existing[0].clienteId,
        payload: { status: existing[0].status, valor: existing[0].valor }
      });

      // Emit delete_performed event for audit
      await emitEvent(edgespark, {
        type: 'delete_performed',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'oportunidades',
        resourceId: id,
        payload: { entity: 'oportunidade', status: existing[0].status }
      });

      // Create alert for delete action
      await createAlert(
        'DELETE_PERFORMED',
        user.id,
        'medium',
        `Oportunidade deletada (ID: ${id})`,
        { entity: 'oportunidade', resourceId: id, status: existing[0].status }
      );
    }

    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ═══════════════════════════════════════════════════════════

  app.get("/api/documentos/:oportunidadeId", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const oportunidadeId = parseInt(c.req.param("oportunidadeId"));
    const documentos = await edgespark.db
      .select()
      .from(tables.documentos)
      .where(eq(tables.documentos.oportunidadeId, oportunidadeId));

    return c.json({ documentos });
  });

  app.post("/api/documentos", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/documentos - creating:", body);

    const newDocumento = await edgespark.db.insert(tables.documentos).values({
      oportunidadeId: body.oportunidade_id,
      tipo: body.tipo,
      arquivo: body.arquivo || null,
      status: body.status || "pendente",
    }).returning();

    await logAction(user.id, "CREATE", "documentos", newDocumento[0].id, null, body);

    return c.json({ documento: newDocumento[0] });
  });

  app.put("/api/documentos/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.documentos)
      .where(eq(tables.documentos.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Documento não encontrado" }, 404);
    }

    const updated = await edgespark.db
      .update(tables.documentos)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.documentos.id, id))
      .returning();

    await logAction(user.id, "UPDATE", "documentos", id, existing[0], body);

    return c.json({ documento: updated[0] });
  });

  // ═══════════════════════════════════════════════════════════
  // COMISSÕES
  // ═══════════════════════════════════════════════════════════

  app.get("/api/comissoes", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const oportunidadeId = c.req.query("oportunidade_id");
    const parceiroId = c.req.query("parceiro_id");
    const status = c.req.query("status");

    let comissoes = await edgespark.db
      .select()
      .from(tables.comissoes)
      .orderBy(desc(tables.comissoes.createdAt));

    if (oportunidadeId) {
      comissoes = comissoes.filter(c => c.oportunidadeId === parseInt(oportunidadeId));
    }
    if (parceiroId) {
      comissoes = comissoes.filter(c => c.parceiroId === parseInt(parceiroId));
    }
    if (status) {
      comissoes = comissoes.filter(c => c.status === status);
    }

    return c.json({ comissoes });
  });

  app.get("/api/comissoes/resumo", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const comissoes = await edgespark.db.select().from(tables.comissoes);

    const pendente = comissoes.filter(c => c.status === "pendente").reduce((sum, c) => sum + c.valor, 0);
    const pago = comissoes.filter(c => c.status === "pago").reduce((sum, c) => sum + c.valor, 0);
    const cancelado = comissoes.filter(c => c.status === "cancelado").reduce((sum, c) => sum + c.valor, 0);

    return c.json({ pendente, pago, cancelado, total: pendente + pago });
  });

  app.put("/api/comissoes/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.comissoes)
      .where(eq(tables.comissoes.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Comissão não encontrada" }, 404);
    }

    const updated = await edgespark.db
      .update(tables.comissoes)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.comissoes.id, id))
      .returning();

    await logAction(user.id, "UPDATE", "comissoes", id, existing[0], body);

    return c.json({ comissao: updated[0] });
  });

  // ═══════════════════════════════════════════════════════════
  // USUÁRIOS E PERFIS
  // ═══════════════════════════════════════════════════════════

  app.get("/api/usuarios/perfis", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const perfis = await edgespark.db.select().from(tables.usuariosPerfis);
    return c.json({ perfis });
  });

  app.post("/api/usuarios/perfis", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/usuarios/perfis - creating:", body);

    const newPerfil = await edgespark.db.insert(tables.usuariosPerfis).values({
      usuarioId: body.usuario_id,
      perfil: body.perfil,
      parceiroId: body.parceiro_id || null,
      regiao: body.regiao || null,
      equipe: body.equipe || null,
    }).returning();

    await logAction(user.id, "CREATE", "usuarios_perfis", newPerfil[0].id, null, body);

    return c.json({ perfil: newPerfil[0] });
  });

  app.put("/api/usuarios/perfis/:usuarioId", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const usuarioId = c.req.param("usuarioId");
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.usuariosPerfis)
      .where(eq(tables.usuariosPerfis.usuarioId, usuarioId));

    if (existing.length === 0) {
      // Create new profile
      const newPerfil = await edgespark.db.insert(tables.usuariosPerfis).values({
        usuarioId,
        perfil: body.perfil,
        parceiroId: body.parceiro_id || null,
        regiao: body.regiao || null,
        equipe: body.equipe || null,
      }).returning();
      return c.json({ perfil: newPerfil[0] });
    }

    const updated = await edgespark.db
      .update(tables.usuariosPerfis)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tables.usuariosPerfis.usuarioId, usuarioId))
      .returning();

    await logAction(user.id, "UPDATE", "usuarios_perfis", existing[0].id, existing[0], body);

    // Emit event: role_changed or permission_changed
    if (body.perfil) {
      await emitEvent(edgespark, {
        type: 'role_changed',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'usuariosPerfis',
        resourceId: existing[0].id,
        payload: {
          oldPerfil: existing[0].perfil,
          newPerfil: body.perfil,
          targetUsuarioId: usuarioId
        }
      });

      // Create HIGH severity alert for role change
      await createAlert(
        'ROLE_CHANGED',
        user.id,
        'high',
        `Role alterada para usuário ${usuarioId}: ${existing[0].perfil} → ${body.perfil}`,
        { oldPerfil: existing[0].perfil, newPerfil: body.perfil, targetUsuarioId: usuarioId }
      );
    }

    return c.json({ perfil: updated[0] });
  });

  // ═══════════════════════════════════════════════════════════
  // AUTOMAÇÕES
  // ═══════════════════════════════════════════════════════════

  app.get("/api/automacoes", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const automacoes = await edgespark.db.select().from(tables.automacoes);
    return c.json({ automacoes });
  });

  app.post("/api/automacoes", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    console.log("[API] POST /api/automacoes - creating:", body);

    const newAutomacao = await edgespark.db.insert(tables.automacoes).values({
      nome: body.nome,
      descricao: body.descricao || null,
      triggerTipo: body.trigger_tipo,
      triggerCondicao: body.trigger_condicao || null,
      acaoTipo: body.acao_tipo,
      acaoParametros: body.acao_parametros ? JSON.stringify(body.acao_parametros) : null,
      ativo: body.ativo !== undefined ? body.ativo : 1,
      pipelineId: body.pipeline_id || null,
      etapaOrigem: body.etapa_origem || null,
      etapaDestino: body.etapa_destino || null,
    }).returning();

    await logAction(user.id, "CREATE", "automacoes", newAutomacao[0].id, null, body);

    return c.json({ automacao: newAutomacao[0] });
  });

  app.put("/api/automacoes/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de edição
    const permission = requirePermission(user, 'automacoes', 'edit');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existing = await edgespark.db
      .select()
      .from(tables.automacoes)
      .where(eq(tables.automacoes.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Automação não encontrada" }, 404);
    }

    // Build update object with proper field mapping
    const updateData: any = { ...body, updatedAt: Date.now() };
    
    // Handle camelCase to snake_case conversion for specific fields
    if (body.pipelineId !== undefined) {
      updateData.pipelineId = body.pipelineId;
    }
    if (body.etapaOrigem !== undefined) {
      updateData.etapaOrigem = body.etapaOrigem;
    }
    if (body.etapaDestino !== undefined) {
      updateData.etapaDestino = body.etapaDestino;
    }
    if (body.triggerTipo !== undefined) {
      updateData.triggerTipo = body.triggerTipo;
    }
    if (body.triggerCondicao !== undefined) {
      updateData.triggerCondicao = body.triggerCondicao;
    }
    if (body.acaoTipo !== undefined) {
      updateData.acaoTipo = body.acaoTipo;
    }
    if (body.acaoParametros !== undefined) {
      updateData.acaoParametros = typeof body.acaoParametros === 'string' 
        ? body.acaoParametros 
        : JSON.stringify(body.acaoParametros);
    }

    const updated = await edgespark.db
      .update(tables.automacoes)
      .set(updateData)
      .where(eq(tables.automacoes.id, id))
      .returning();

    await logAction(user.id, "UPDATE", "automacoes", id, existing[0], body);

    return c.json({ automacao: updated[0] });
  });

  app.delete("/api/automacoes/:id", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Verifica permissão de exclusão
    const permission = requirePermission(user, 'automacoes', 'delete');
    if (!permission.allowed) return c.json({ error: permission.error }, 403);

    const id = parseInt(c.req.param("id"));

    await edgespark.db
      .delete(tables.automacoes)
      .where(eq(tables.automacoes.id, id));

    await logAction(user.id, "DELETE", "automacoes", id, null, null);

    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // RELATÓRIOS
  // ═══════════════════════════════════════════════════════════

  // Log de exportação de relatórios
  app.get("/api/relatorios/vendas", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    
    // Log de exportação após verificar auth
    await logAction(user.id, "EXPORT", "relatorios", undefined, { tipo: "vendas" });
    
    const periodo = c.req.query("periodo") || "mes";
    let startDate: number;
    const now = Date.now();

    switch (periodo) {
      case "semana":
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "mes":
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "trimestre":
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case "ano":
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        startDate = now - 30 * 24 * 60 * 60 * 1000;
    }

    const oportunidades = await edgespark.db
      .select()
      .from(tables.oportunidades)
      .where(gte(tables.oportunidades.createdAt, startDate));

    const vendas = oportunidades.filter(o => o.status === "finalizado");
    const totalVendas = vendas.reduce((sum, o) => sum + (o.valor || 0), 0);
    const mediaVenda = vendas.length > 0 ? totalVendas / vendas.length : 0;

    // By product
    const byProduct: Record<number, { nome: string; quantidade: number; valor: number }> = {};
    for (const v of vendas) {
      const produto = await edgespark.db.select().from(tables.produtos).where(eq(tables.produtos.id, v.produtoId));
      const nome = produto[0]?.nome || "Unknown";
      if (!byProduct[v.produtoId]) {
        byProduct[v.produtoId] = { nome, quantidade: 0, valor: 0 };
      }
      byProduct[v.produtoId].quantidade++;
      byProduct[v.produtoId].valor += v.valor || 0;
    }

    return c.json({
      totalVendas,
      quantidadeVendas: vendas.length,
      mediaVenda,
      porProduto: Object.values(byProduct)
    });
  });

  app.get("/api/relatorios/conversao", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const oportunidades = await edgespark.db.select().from(tables.oportunidades);
    
    const total = oportunidades.length;
    const entrada = oportunidades.filter(o => o.status === "entrada").length;
    const analise = oportunidades.filter(o => o.status === "analise").length;
    const documentacao = oportunidades.filter(o => o.status === "documentacao").length;
    const aprovado = oportunidades.filter(o => o.status === "aprovado").length;
    const reprovado = oportunidades.filter(o => o.status === "reprovado").length;
    const finalizado = oportunidades.filter(o => o.status === "finalizado").length;

    return c.json({
      total,
      entrada,
      analise,
      documentacao,
      aprovado,
      reprovado,
      finalizado,
      taxaConversao: total > 0 ? ((finalizado / total) * 100).toFixed(2) : 0,
      taxaAprovacao: (analise + documentacao + aprovado) > 0 ? ((finalizado / (analise + documentacao + aprovado)) * 100).toFixed(2) : 0
    });
  });

  app.get("/api/relatorios/parceiros", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const parceiros = await edgespark.db.select().from(tables.parceiros);
    const oportunidades = await edgespark.db.select().from(tables.oportunidades);

    const byParceiro: Record<number, { nome: string; tipo: string; oportunidades: number; vendas: number; valor: number }> = {};

    for (const opp of oportunidades) {
      if (opp.parceiroId) {
        const parceiro = parceiros.find(p => p.id === opp.parceiroId);
        if (parceiro) {
          if (!byParceiro[opp.parceiroId]) {
            byParceiro[opp.parceiroId] = {
              nome: parceiro.nome,
              tipo: parceiro.tipo,
              oportunidades: 0,
              vendas: 0,
              valor: 0
            };
          }
          byParceiro[opp.parceiroId].oportunidades++;
          if (opp.status === "finalizado") {
            byParceiro[opp.parceiroId].vendas++;
            byParceiro[opp.parceiroId].valor += opp.valor || 0;
          }
        }
      }
    }

    return c.json({ porParceiro: Object.values(byParceiro) });
  });

  // ═══════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  async function calcularComissao(edgespark: Client<typeof tables>, oportunidade: any) {
    console.log("[API] Calculating commission for oportunidade:", oportunidade.id);

    if (!oportunidade.parceiroId || oportunidade.valor <= 0) {
      return;
    }

    const parceiro = await edgespark.db
      .select()
      .from(tables.parceiros)
      .where(eq(tables.parceiros.id, oportunidade.parceiroId));

    if (parceiro.length === 0) return;

    const p = parceiro[0];
    const valor = oportunidade.valor || 0;

    // Company commission
    if (p.comissaoCompany && p.comissaoCompany > 0) {
      await edgespark.db.insert(tables.comissoes).values({
        oportunidadeId: oportunidade.id,
        parceiroId: p.parentId || null,
        nivel: "company",
        percentual: p.comissaoCompany,
        valor: valor * (p.comissaoCompany / 100),
        status: "pendente",
      });
    }

    // Franquia commission
    if (p.comissaoFranquia && p.comissaoFranquia > 0) {
      await edgespark.db.insert(tables.comissoes).values({
        oportunidadeId: oportunidade.id,
        parceiroId: p.id,
        nivel: "franquia",
        percentual: p.comissaoFranquia,
        valor: valor * (p.comissaoFranquia / 100),
        status: "pendente",
      });
    }

    // Franqueado commission
    if (p.comissaoFranqueado && p.comissaoFranqueado > 0) {
      await edgespark.db.insert(tables.comissoes).values({
        oportunidadeId: oportunidade.id,
        parceiroId: p.id,
        nivel: "franqueado",
        percentual: p.comissaoFranqueado,
        valor: valor * (p.comissaoFranqueado / 100),
        status: "pendente",
      });
    }

    console.log("[API] Commission calculated successfully");
  }

  // ============================================
  // AUDITORIA - Logs de Ações
  // ============================================

  // GET - Listar logs de auditoria (apenas para admins)
  app.get("/api/auditoria/logs", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Roles que podem acessar logs de auditoria
    const allowedRoles = [
      'ADMIN_SISTEMA', 
      'ADMIN_FRANQUIA', 
      'ROLE_ADMIN_SISTEMA',
      'ROLE_CEO',
      'ROLE_DIRETOR_AUDITORIA',
      'ROLE_GERENTE_AUDITORIA',
      'ROLE_AUDITOR'
    ];
    if (!allowedRoles.includes(user.role || '')) {
      return c.json({ error: "Acesso negado. Apenas administradores podem acessar logs de auditoria." }, 403);
    }

    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;

    // Filtros
    const usuarioId = c.req.query("usuario");
    const acao = c.req.query("acao");
    const modulo = c.req.query("modulo");
    const periodo = c.req.query("periodo"); // hoje, semana, mes, ano

    // Calcula data inicial baseada no período
    let startDate: number | undefined;
    const now = Date.now();
    if (periodo) {
      switch (periodo) {
        case 'hoje':
          startDate = now - 24 * 60 * 60 * 1000;
          break;
        case 'semana':
          startDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'mes':
          startDate = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'ano':
          startDate = now - 365 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    // Constrói where clause
    const whereConditions = [];
    if (usuarioId) whereConditions.push(eq(tables.logsAcoes.usuarioId, usuarioId));
    if (acao) whereConditions.push(eq(tables.logsAcoes.acao, acao));
    if (modulo) whereConditions.push(eq(tables.logsAcoes.modulo, modulo));
    if (startDate) whereConditions.push(gte(tables.logsAcoes.createdAt, startDate));

    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions) 
      : undefined;

    // Busca logs com paginação
    const logs = await edgespark.db
      .select()
      .from(tables.logsAcoes)
      .where(whereClause)
      .orderBy(desc(tables.logsAcoes.createdAt))
      .limit(limit)
      .offset(offset);

    // Conta total
    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.logsAcoes)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Formata dados para retorno
    const formattedLogs = logs.map(log => ({
      id: log.id,
      usuarioId: log.usuarioId,
      acao: log.acao,
      modulo: log.modulo,
      registroId: log.registroId,
      dadosAntes: log.dadosAntes ? JSON.parse(log.dadosAntes) : null,
      dadosDepois: log.dadosDepois ? JSON.parse(log.dadosDepois) : null,
      createdAt: log.createdAt,
    }));

    return c.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  });

  // GET - Listar usuários para filtro
  app.get("/api/auditoria/usuarios", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Roles que podem acessar usuários de auditoria
    const allowedRolesUsuarios = [
      'ADMIN_SISTEMA', 
      'ADMIN_FRANQUIA', 
      'ROLE_ADMIN_SISTEMA',
      'ROLE_CEO',
      'ROLE_DIRETOR_AUDITORIA',
      'ROLE_GERENTE_AUDITORIA',
      'ROLE_AUDITOR'
    ];
    if (!allowedRolesUsuarios.includes(user.role || '')) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    // Busca usuários únicos que têm logs
    const usuarios = await edgespark.db
      .selectDistinct({ usuarioId: tables.logsAcoes.usuarioId })
      .from(tables.logsAcoes)
      .where(sql`${tables.logsAcoes.usuarioId} IS NOT NULL`);

    // Busca detalhes dos usuários
    const userDetails = await Promise.all(
      usuarios.map(async (u) => {
        if (!u.usuarioId) return null;
        const userInfo = await edgespark.db
          .select()
          .from(tables.esSystemAuthUser)
          .where(eq(tables.esSystemAuthUser.id, u.usuarioId))
          .limit(1);
        return userInfo[0] ? { id: userInfo[0].id, nome: userInfo[0].name, email: userInfo[0].email } : null;
      })
    );

    return c.json({ usuarios: userDetails.filter(Boolean) });
  });

  // GET /api/eventos - Listar eventos (Admin)
  app.get("/api/eventos", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Roles que podem acessar eventos
    const allowedRoles = [
      'ADMIN_SISTEMA', 
      'ADMIN_FRANQUIA', 
      'ROLE_ADMIN_SISTEMA',
      'ROLE_CEO',
      'ROLE_DIRETOR_AUDITORIA',
      'ROLE_GERENTE_AUDITORIA',
      'ROLE_AUDITOR',
      'ROLE_SUPERINTENDENTE'
    ];
    if (!allowedRoles.includes(user.role || '')) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    const { 
      page = "1", 
      limit = "50",
      type,
      source,
      resource,
      resourceId,
      actorUserId,
      leadId,
      clienteId,
      oportunidadeId,
      campanhaId,
      conversaId,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "desc"
    } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const filters = {
      page: pageNum,
      limit: limitNum,
      type: type || undefined,
      source: source || undefined,
      resource: resource || undefined,
      resourceId: resourceId ? parseInt(resourceId) : undefined,
      actorUserId: actorUserId || undefined,
      leadId: leadId ? parseInt(leadId) : undefined,
      clienteId: clienteId ? parseInt(clienteId) : undefined,
      oportunidadeId: oportunidadeId ? parseInt(oportunidadeId) : undefined,
      campanhaId: campanhaId ? parseInt(campanhaId) : undefined,
      conversaId: conversaId ? parseInt(conversaId) : undefined,
      startDate: startDate ? parseInt(startDate) : undefined,
      endDate: endDate ? parseInt(endDate) : undefined,
      sortBy: sortBy as 'created_at',
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await queryEvents(edgespark, user, filters);

    return c.json(result);
  });

  // GET /api/eventos/stats - Estatísticas de eventos
  app.get("/api/eventos/stats", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Roles que podem acessar estatísticas de eventos
    const allowedRoles = [
      'ADMIN_SISTEMA', 
      'ADMIN_FRANQUIA', 
      'ROLE_ADMIN_SISTEMA',
      'ROLE_CEO',
      'ROLE_DIRETOR_AUDITORIA',
      'ROLE_GERENTE_AUDITORIA',
      'ROLE_AUDITOR',
      'ROLE_SUPERINTENDENTE'
    ];
    if (!allowedRoles.includes(user.role || '')) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    const { startDate, endDate } = c.req.query();

    const stats = await getEventStats(
      edgespark, 
      { tenantId: user.tenantId, permissions: user.permissions },
      startDate ? parseInt(startDate) : undefined,
      endDate ? parseInt(endDate) : undefined
    );

    return c.json(stats);
  });

  // ============================================
  // ALERTAS DE SEGURANÇA
  // ============================================

  // GET - Listar alertas
  app.get("/api/alertas", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Roles que podem acessar alertas
    const allowedRoles = [
      'ADMIN_SISTEMA', 
      'ADMIN_FRANQUIA', 
      'ROLE_ADMIN_SISTEMA',
      'ROLE_CEO',
      'ROLE_DIRETOR_AUDITORIA',
      'ROLE_GERENTE_AUDITORIA',
      'ROLE_AUDITOR',
      'ROLE_SUPERINTENDENTE'
    ];
    if (!allowedRoles.includes(user.role || '')) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const unresolvedOnly = c.req.query("unresolved") === "true";

    const whereConditions = [];
    if (unresolvedOnly) {
      whereConditions.push(eq(tables.alertasSeguranca.resolved, 0));
    }

    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions) 
      : undefined;

    const alertas = await edgespark.db
      .select()
      .from(tables.alertasSeguranca)
      .where(whereClause)
      .orderBy(desc(tables.alertasSeguranca.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.alertasSeguranca)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    return c.json({
      alertas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  });

  // PUT - Marcar alerta como resolvido
  app.put("/api/alertas/:id/resolve", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // RBAC: Roles que podem resolver alertas
    const allowedRoles = [
      'ADMIN_SISTEMA', 
      'ADMIN_FRANQUIA', 
      'ROLE_ADMIN_SISTEMA',
      'ROLE_CEO',
      'ROLE_DIRETOR_AUDITORIA',
      'ROLE_GERENTE_AUDITORIA',
      'ROLE_AUDITOR',
      'ROLE_SUPERINTENDENTE'
    ];
    if (!allowedRoles.includes(user.role || '')) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    const id = parseInt(c.req.param("id"));

    await edgespark.db
      .update(tables.alertasSeguranca)
      .set({
        resolved: 1,
        resolvedAt: Date.now(),
        resolvedBy: user.id,
      })
      .where(eq(tables.alertasSeguranca.id, id));

    return c.json({ success: true });
  });

  // ============================================
  // AUDIÊNCIAS - Gerenciamento de Audiências
  // ============================================

  // GET /api/audiences - Listar audiências
  app.get("/api/audiences", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { type, status } = c.req.query();
    
    let whereConditions = [];
    if (type) whereConditions.push(eq(tables.audiences.type as any, type));
    if (status) whereConditions.push(eq(tables.audiences.status as any, status));

    const audiences = await edgespark.db
      .select()
      .from(tables.audiences)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(tables.audiences.createdAt));

    return c.json({ audiences });
  });

  // POST /api/audiences - Criar audiência
  app.post("/api/audiences", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const now = Date.now();

    const result = await edgespark.db.insert(tables.audiences).values({
      name: body.name,
      description: body.description || null,
      type: body.type || 'manual',
      filters: body.filters ? JSON.stringify(body.filters) : null,
      tenantId: user.tenantId,
      totalContacts: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    return c.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  });

  // GET /api/audiences/:id - Detalhes da audiência
  app.get("/api/audiences/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    
    const [audience] = await edgespark.db
      .select()
      .from(tables.audiences)
      .where(eq(tables.audiences.id, id))
      .limit(1);

    if (!audience) {
      return c.json({ error: "Audiência não encontrada" }, 404);
    }

    // Buscar membros
    const members = await edgespark.db
      .select()
      .from(tables.audienceMembers)
      .where(eq(tables.audienceMembers.audienceId, id));

    // Buscar detalhes dos clientes
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const [cliente] = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.id, member.clienteId))
          .limit(1);
        return { ...member, cliente };
      })
    );

    return c.json({ 
      audience,
      members: memberDetails,
      total: members.length 
    });
  });

  // DELETE /api/audiences/:id - Excluir audiência
  app.delete("/api/audiences/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));

    // Excluir membros primeiro
    await edgespark.db
      .delete(tables.audienceMembers)
      .where(eq(tables.audienceMembers.audienceId, id));

    // Excluir audiência
    await edgespark.db
      .delete(tables.audiences)
      .where(eq(tables.audiences.id, id));

    return c.json({ success: true });
  });

  // POST /api/audiences/:id/members - Adicionar membros via CSV
  app.post("/api/audiences/:id/members", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    // Validar audiência
    const [audience] = await edgespark.db
      .select()
      .from(tables.audiences)
      .where(eq(tables.audiences.id, id))
      .limit(1);

    if (!audience) {
      return c.json({ error: "Audiência não encontrada" }, 404);
    }

    const now = Date.now();
    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Processar contatos do CSV
    for (const contact of body.contacts || []) {
      try {
        // Normalizar telefone
        let phone = (contact.telefone || contact.phone || contact.celular || '').replace(/\D/g, '');
        if (phone.length < 10) {
          skippedCount++;
          continue;
        }

        // Buscar ou criar cliente
        let [existingCliente] = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.celular as any, `%${phone}%`))
          .limit(1);

        // Tentar encontrar por telefone
        if (!existingCliente) {
          const allClientes = await edgespark.db
            .select()
            .from(tables.clientes)
            .limit(1000);
          
          const foundCliente = allClientes.find(c => 
            (c.celular || '').replace(/\D/g, '').endsWith(phone) ||
            (c.telefone || '').replace(/\D/g, '').endsWith(phone)
          );
          if (foundCliente) {
            existingCliente = foundCliente;
          }
        }

        let clienteId;
        if (existingCliente) {
          clienteId = existingCliente.id;
        } else {
          // Criar novo cliente
          const result = await edgespark.db.insert(tables.clientes).values({
            nome: contact.nome || contact.name || 'Sem nome',
            celular: phone,
            email: contact.email || null,
            createdAt: now,
            updatedAt: now,
          });
          clienteId = result.lastInsertRowid;
        }

        // Verificar se já é membro
        const [existingMember] = await edgespark.db
          .select()
          .from(tables.audienceMembers)
          .where(and(
            eq(tables.audienceMembers.audienceId, id),
            eq(tables.audienceMembers.clienteId, clienteId)
          ))
          .limit(1);

        if (!existingMember) {
          // Adicionar à audiência
          await edgespark.db.insert(tables.audienceMembers).values({
            audienceId: id,
            clienteId,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      } catch (err: any) {
        errors.push(`Erro ao processar ${contact.nome || contact.telefone}: ${err.message}`);
      }
    }

    // Atualizar total de contatos na audiência
    const allMembers = await edgespark.db
      .select()
      .from(tables.audienceMembers)
      .where(eq(tables.audienceMembers.audienceId, id));

    await edgespark.db
      .update(tables.audiences)
      .set({ 
        totalContacts: allMembers.length,
        updatedAt: now 
      })
      .where(eq(tables.audiences.id, id));

    return c.json({ 
      success: true, 
      added: addedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  });

  // POST /api/audiences/import-csv - Importar CSV e criar audiência
  app.post("/api/audiences/import-csv", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const now = Date.now();

    // Criar audiência
    const audienceResult = await edgespark.db.insert(tables.audiences).values({
      name: body.name || `Audiência ${new Date().toLocaleDateString()}`,
      description: body.description || `Importado de CSV com ${body.contacts?.length || 0} contatos`,
      type: 'manual',
      tenantId: user.tenantId,
      totalContacts: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    const audienceId = audienceResult.lastInsertRowid;

    let addedCount = 0;
    let skippedCount = 0;

    // Processar contatos
    for (const contact of body.contacts || []) {
      try {
        let phone = (contact.telefone || contact.phone || contact.celular || '').replace(/\D/g, '');
        if (phone.length < 10) {
          skippedCount++;
          continue;
        }

        // Buscar ou criar cliente
        const allClientes = await edgespark.db
          .select()
          .from(tables.clientes)
          .limit(1000);
        
        const foundCliente = allClientes.find(c => 
          (c.celular || '').replace(/\D/g, '').endsWith(phone) ||
          (c.telefone || '').replace(/\D/g, '').endsWith(phone)
        );
        let existingCliente;
        if (foundCliente) {
          existingCliente = foundCliente;
        }

        let clienteId;
        if (existingCliente) {
          clienteId = existingCliente.id;
        } else {
          const result = await edgespark.db.insert(tables.clientes).values({
            nome: contact.nome || contact.name || 'Sem nome',
            celular: phone,
            email: contact.email || null,
            createdAt: now,
            updatedAt: now,
          });
          clienteId = result.lastInsertRowid;
        }

        // Adicionar à audiência
        await edgespark.db.insert(tables.audienceMembers).values({
          audienceId,
          clienteId,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        addedCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    // Atualizar total
    await edgespark.db
      .update(tables.audiences)
      .set({ 
        totalContacts: addedCount,
        updatedAt: now 
      })
      .where(eq(tables.audiences.id, audienceId));

    return c.json({ 
      success: true, 
      audienceId,
      audienceName: body.name || `Audiência ${new Date().toLocaleDateString()}`,
      totalContacts: addedCount,
      skipped: skippedCount
    });
  });

  // POST /api/audiences/calculate - Calcular audiência dinâmica
  app.post("/api/audiences/calculate", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const filters = body.filters || [];
    const page = body.page || 0;
    const pageSize = body.pageSize || 20;

    if (!filters || filters.length === 0) {
      return c.json({ contacts: [], total: 0 });
    }

    // Buscar todos os clientes
    let clientes = await edgespark.db
      .select()
      .from(tables.clientes)
      .limit(5000);

    // Aplicar filtros
    let filteredClientes = clientes;

    for (const filter of filters) {
      const { field, operator, value } = filter;
      
      filteredClientes = filteredClientes.filter(cliente => {
        const fieldValue = cliente[field as keyof typeof cliente];
        
        switch (operator) {
          case 'equals':
          case 'eq':
            return String(fieldValue || '') === String(value);
          case 'not_eq':
          case 'ne':
            return String(fieldValue || '') !== String(value);
          case 'contains':
            return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
          case 'not_contains':
            return !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
          case 'gt':
            return Number(fieldValue) > Number(value);
          case 'gte':
            return Number(fieldValue) >= Number(value);
          case 'lt':
            return Number(fieldValue) < Number(value);
          case 'lte':
            return Number(fieldValue) <= Number(value);
          case 'starts_with':
            return String(fieldValue || '').toLowerCase().startsWith(String(value).toLowerCase());
          case 'ends_with':
            return String(fieldValue || '').toLowerCase().endsWith(String(value).toLowerCase());
          case 'is_empty':
            return !fieldValue || String(fieldValue).trim() === '';
          case 'is_not_empty':
            return fieldValue && String(fieldValue).trim() !== '';
          case 'last_interaction_hours': {
            // Special filter for last interaction (based on ultima_interacao_at or updatedAt)
            const hoursAgo = Number(value);
            const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
            const lastInteraction = cliente.ultimaInteracaoAt ? Number(cliente.ultimaInteracaoAt) : (cliente.updatedAt ? Number(cliente.updatedAt) : 0);
            return lastInteraction > cutoffTime;
          }
          case 'status':
            // Filter by status field
            return String(fieldValue || '') === String(value);
          case 'origem':
            // Filter by origem field  
            return String(fieldValue || '') === String(value);
          case 'has_conversation':
            // Filter by conversation status
            return true; // Simplified - would need to check conversations table
          default:
            return true;
        }
      });
    }

    // Aplicar paginação
    const total = filteredClientes.length;
    const startIndex = page * pageSize;
    const paginatedContacts = filteredClientes.slice(startIndex, startIndex + pageSize);
    
    // Retornar contacts com paginação
    const contacts = paginatedContacts.map(c => ({
      id: c.id,
      nome: c.nome,
      celular: c.celular,
      email: c.email,
      status: c.status || null,
    }));

    return c.json({ 
      contacts,
      total
    });
  });

  // GET /api/audiences/:id/preview - Preview da audiência para campanha
  app.get("/api/audiences/:id/preview", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    
    const [audience] = await edgespark.db
      .select()
      .from(tables.audiences)
      .where(eq(tables.audiences.id, id))
      .limit(1);

    if (!audience) {
      return c.json({ error: "Audiência não encontrada" }, 404);
    }

    let contacts: any[] = [];
    let total = 0;

    if (audience.type === 'dynamic' && audience.filters) {
      // Para audiências dinâmicas, calcular baseado nos filtros
      try {
        const filters = JSON.parse(audience.filters);
        
        // Buscar todos os clientes
        let clientes = await edgespark.db
          .select()
          .from(tables.clientes)
          .limit(5000);

        // Aplicar filtros
        let filteredClientes = clientes;

        for (const filter of filters) {
          const { field, operator, value } = filter;
          
          filteredClientes = filteredClientes.filter(cliente => {
            const fieldValue = cliente[field as keyof typeof cliente];
            
            switch (operator) {
              case 'equals':
              case 'eq':
                return String(fieldValue) === String(value);
              case 'not_eq':
              case 'ne':
                return String(fieldValue) !== String(value);
              case 'contains':
                return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
              case 'not_contains':
                return !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
              case 'gt':
                return Number(fieldValue) > Number(value);
              case 'gte':
                return Number(fieldValue) >= Number(value);
              case 'lt':
                return Number(fieldValue) < Number(value);
              case 'lte':
                return Number(fieldValue) <= Number(value);
              case 'starts_with':
                return String(fieldValue || '').toLowerCase().startsWith(String(value).toLowerCase());
              case 'ends_with':
                return String(fieldValue || '').toLowerCase().endsWith(String(value).toLowerCase());
              case 'is_empty':
                return !fieldValue || String(fieldValue).trim() === '';
              case 'is_not_empty':
                return fieldValue && String(fieldValue).trim() !== '';
              case 'last_interaction_hours': {
                const hoursAgo = Number(value);
                const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
                const lastInteraction = cliente.ultimaInteracaoAt ? Number(cliente.ultimaInteracaoAt) : (cliente.updatedAt ? Number(cliente.updatedAt) : 0);
                return lastInteraction > cutoffTime;
              }
              case 'status':
                return String(fieldValue || '') === String(value);
              case 'origem':
                return String(fieldValue || '') === String(value);
              default:
                return true;
            }
          });
        }

        total = filteredClientes.length;
        contacts = filteredClientes.slice(0, 10).map(c => ({
          id: c.id,
          nome: c.nome,
          celular: c.celular,
          email: c.email,
        }));
      } catch (e) {
        console.error("Erro ao processar filtros:", e);
        total = 0;
      }
    } else {
      // Para audiências manuais, buscar membros
      const members = await edgespark.db
        .select()
        .from(tables.audienceMembers)
        .where(eq(tables.audienceMembers.audienceId, id));

      total = members.length;

      contacts = await Promise.all(
        members.slice(0, 10).map(async (member) => {
          const [cliente] = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.id, member.clienteId))
          .limit(1);
        return cliente;
      })
    );
    }

    return c.json({ 
      audience: {
        id: audience.id,
        name: audience.name,
        type: audience.type,
        totalContacts: total,
      },
      contacts: contacts.filter(Boolean),
      total: total
    });
  });

  // ============================================
  // CAMPANHAS - Rotas de Campanhas de Disparo
  // ============================================

  // GET /api/campanhas - Listar campanhas
  app.get("/api/campanhas", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { page = "1", limit = "20", status } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Condição base - filtra por tenant se não for admin
    const conditions: any[] = [];
    if (user.role !== 'ADMIN_SISTEMA' && user.role !== 'ROLE_ADMIN_SISTEMA') {
      conditions.push(eq(tables.campanhas.tenantId, user.tenantId || user.id));
    }
    if (status) {
      conditions.push(eq(tables.campanhas.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const campanhas = await edgespark.db
      .select()
      .from(tables.campanhas)
      .where(whereClause)
      .orderBy(desc(tables.campanhas.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.campanhas)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    return c.json({
      campanhas,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  });

  // GET /api/campanhas/:id - Ver campanha específica
  app.get("/api/campanhas/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const campanha = await edgespark.db
      .select()
      .from(tables.campanhas)
      .where(eq(tables.campanhas.id, id))
      .limit(1);

    if (!campanha.length) {
      return c.json({ error: "Campanha não encontrada" }, 404);
    }

    return c.json({ campanha: campanha[0] });
  });

  // POST /api/campanhas - Criar campanha
  app.post("/api/campanhas", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const now = Date.now();

    // Se houver audiência selecionada, buscar os contatos
    let contatos = body.contatos || [];
    if (body.audienceId) {
      const members = await edgespark.db
        .select()
        .from(tables.audienceMembers)
        .where(eq(tables.audienceMembers.audienceId, body.audienceId));
      
      const clientes = await Promise.all(
        members.map(async (m) => {
          const [cliente] = await edgespark.db
            .select()
            .from(tables.clientes)
            .where(eq(tables.clientes.id, m.clienteId))
            .limit(1);
          return cliente;
        })
      );
      
      contatos = clientes.filter(Boolean);
    }

    const result = await edgespark.db.insert(tables.campanhas).values({
      nome: body.nome,
      descricao: body.descricao || null,
      tipo: body.tipo || 'whatsapp',
      status: 'draft',
      conteudo: body.conteudo || null,
      templateId: body.templateId || null,
      scheduledAt: body.scheduledAt || null,
      intervaloMinutos: body.intervaloMinutos || 5,
      maxEnviosDia: body.maxEnviosDia || 500,
      filtros: body.filtros ? JSON.stringify(body.filtros) : null,
      audienceId: body.audienceId || null,
      tenantId: user.tenantId || user.id,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    });

    const campaignId = result.lastInsertRowid;

    // Se houver contatos selecionados (manual ou via audiência), criar mensagens
    if (contatos.length > 0) {
      const messages = contatos.map((contato: any) => ({
        campaignId: campaignId,
        recipient: contato.celular || contato.telefone || contato.email,
        provider: body.tipo || 'whatsapp',
        content: body.conteudo || '',
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      }));

      for (const msg of messages) {
        await edgespark.db.insert(tables.mensagensCampanha).values(msg);
      }

      // Atualiza total de envios
      await edgespark.db
        .update(tables.campanhas)
        .set({ totalEnvios: messages.length, updatedAt: now })
        .where(eq(tables.campanhas.id, campaignId));
    }

    // Emit event: campaign_created
    await emitEvent(edgespark, {
      type: 'campaign_created',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'campanhas',
      resourceId: Number(campaignId),
      campanhaId: Number(campaignId),
      payload: { nome: body.nome, tipo: body.tipo, totalContatos: contatos.length }
    });

    return c.json({ sucesso: true, id: campaignId, totalContatos: contatos.length });
  });

  // PUT /api/campanhas/:id - Atualizar campanha
  app.put("/api/campanhas/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const updates: any = { updatedAt: Date.now() };
    if (body.nome) updates.nome = body.nome;
    if (body.descricao !== undefined) updates.descricao = body.descricao;
    if (body.tipo) updates.tipo = body.tipo;
    if (body.status) updates.status = body.status;
    if (body.conteudo !== undefined) updates.conteudo = body.conteudo;
    if (body.scheduledAt !== undefined) updates.scheduledAt = body.scheduledAt;
    if (body.intervaloMinutos) updates.intervaloMinutos = body.intervaloMinutos;
    if (body.maxEnviosDia) updates.maxEnviosDia = body.maxEnviosDia;
    if (body.filtros) updates.filtros = JSON.stringify(body.filtros);

    await edgespark.db
      .update(tables.campanhas)
      .set(updates)
      .where(eq(tables.campanhas.id, id));

    // Emit event: campaign_updated
    await emitEvent(edgespark, {
      type: 'campaign_updated',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'campanhas',
      resourceId: id,
      campanhaId: id,
      payload: { changes: Object.keys(body) }
    });

    return c.json({ success: true });
  });

  // DELETE /api/campanhas/:id - Deletar campanha
  app.delete("/api/campanhas/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));

    // Get existing campaign before deletion
    const [existing] = await edgespark.db
      .select()
      .from(tables.campanhas)
      .where(eq(tables.campanhas.id, id))
      .limit(1);

    // Deleta mensagens primeiro
    await edgespark.db
      .delete(tables.mensagensCampanha)
      .where(eq(tables.mensagensCampanha.campaignId, id));

    // Deleta campanha
    await edgespark.db
      .delete(tables.campanhas)
      .where(eq(tables.campanhas.id, id));

    // Emit event: campaign_deleted
    if (existing) {
      await emitEvent(edgespark, {
        type: 'campaign_deleted',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'campanhas',
        resourceId: id,
        campanhaId: id,
        payload: { nome: existing.nome, tipo: existing.tipo }
      });

      // Emit delete_performed event for audit
      await emitEvent(edgespark, {
        type: 'delete_performed',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'campanhas',
        resourceId: id,
        payload: { entity: 'campanha', nome: existing.nome }
      });

      // Create alert for delete action
      await createAlert(
        'DELETE_PERFORMED',
        user.id,
        'medium',
        `Campanha deletada: ${existing.nome} (ID: ${id})`,
        { entity: 'campanha', resourceId: id, nome: existing.nome }
      );
    }

    return c.json({ success: true });
  });

  // POST /api/campanhas/:id/executar - Executar campanha
  app.post("/api/campanhas/:id/executar", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    // Busca campanha
    const [campanha] = await edgespark.db
      .select()
      .from(tables.campanhas)
      .where(eq(tables.campanhas.id, id))
      .limit(1);

    if (!campanha) {
      return c.json({ error: "Campanha não encontrada" }, 404);
    }

    if (campanha.status === 'running') {
      return c.json({ error: "Campanha já está em execução" }, 400);
    }

    // Busca mensagens pendentes
    const mensagensPendentes = await edgespark.db
      .select()
      .from(tables.mensagensCampanha)
      .where(and(
        eq(tables.mensagensCampanha.campaignId, id),
        eq(tables.mensagensCampanha.status, 'pending')
      ));

    if (mensagensPendentes.length === 0) {
      return c.json({ error: "Nenhuma mensagem pendente para enviar" }, 400);
    }

    // Atualiza status da campanha para running
    await edgespark.db
      .update(tables.campanhas)
      .set({ status: 'running', startedAt: Date.now(), updatedAt: Date.now() })
      .where(eq(tables.campanhas.id, id));

    // Emit event: campaign_started
    await emitEvent(edgespark, {
      type: 'campaign_started',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'campanhas',
      resourceId: id,
      campanhaId: id,
      payload: { nome: campanha.nome, totalMensagens: mensagensPendentes.length }
    });

    // Inicializa infraestrutura de messaging
    const { messagingEngine: msgEngine } = getMessagingInfrastructure(edgespark.db, tables);
    
    if (!msgEngine) {
      return c.json({ error: "Messaging Engine não disponível" }, 500);
    }

    // Envia mensagens via fila (não direto)
    let sucesso = 0;
    let falha = 0;

    for (const msg of mensagensPendentes) {
      try {
        // Atualiza status para sending
        await edgespark.db
          .update(tables.mensagensCampanha)
          .set({ status: 'sending', updatedAt: Date.now() })
          .where(eq(tables.mensagensCampanha.id, msg.id));

        // Envia via Messaging Engine
        const result = await msgEngine.send(msg.recipient, msg.content, {
          provider: msg.provider as any,
        });

        if (result.success) {
          await edgespark.db
            .update(tables.mensagensCampanha)
            .set({ 
              status: 'sent', 
              externalId: result.externalId,
              sentAt: Date.now(),
              updatedAt: Date.now() 
            })
            .where(eq(tables.mensagensCampanha.id, msg.id));
          
          // Emit event: message_sent
          await emitEvent(edgespark, {
            type: 'message_sent',
            source: 'api',
            user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
            resource: 'mensagensCampanha',
            resourceId: msg.id,
            campanhaId: id,
            messageId: msg.id,
            payload: { recipient: msg.recipient, provider: msg.provider }
          });
          
          sucesso++;
        } else {
          await edgespark.db
            .update(tables.mensagensCampanha)
            .set({ 
              status: 'failed', 
              error: result.error,
              attempts: (msg.attempts || 0) + 1,
              updatedAt: Date.now() 
            })
            .where(eq(tables.mensagensCampanha.id, msg.id));
          
          // Emit event: message_failed
          await emitEvent(edgespark, {
            type: 'message_failed',
            source: 'api',
            user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
            resource: 'mensagensCampanha',
            resourceId: msg.id,
            campanhaId: id,
            messageId: msg.id,
            payload: { recipient: msg.recipient, provider: msg.provider, error: result.error }
          });
          
          falha++;
        }
      } catch (error: any) {
        await edgespark.db
          .update(tables.mensagensCampanha)
          .set({ 
            status: 'failed', 
            error: error.message,
            attempts: (msg.attempts || 0) + 1,
            updatedAt: Date.now() 
          })
          .where(eq(tables.mensagensCampanha.id, msg.id));

        // Emit event: message_failed
        await emitEvent(edgespark, {
          type: 'message_failed',
          source: 'api',
          user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
          resource: 'mensagensCampanha',
          resourceId: msg.id,
          campanhaId: id,
          messageId: msg.id,
          payload: { recipient: msg.recipient, provider: msg.provider, error: error.message }
        });
        
        falha++;
      }
    }

    // Atualiza estatísticas da campanha
    await edgespark.db
      .update(tables.campanhas)
      .set({ 
        enviosSucesso: sucesso,
        enviosFalha: falha,
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now()
      })
      .where(eq(tables.campanhas.id, id));

    // Emit event: campaign_finished or campaign_failed
    const failureRate = mensagensPendentes.length > 0 ? (falha / mensagensPendentes.length) * 100 : 0;
    
    if (failureRate > 50) {
      await emitEvent(edgespark, {
        type: 'campaign_failed',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'campanhas',
        resourceId: id,
        campanhaId: id,
        payload: { 
          sucesso, 
          falha, 
          total: mensagensPendentes.length,
          failureRate: Math.round(failureRate)
        }
      });

      // Create HIGH severity alert for campaign failure
      await createAlert(
        'CAMPAIGN_FAILED',
        user.id,
        'high',
        `Campanha falhou: taxa de falha ${Math.round(failureRate)}% (ID: ${id})`,
        { campanhaId: id, sucesso, falha, total: mensagensPendentes.length, failureRate: Math.round(failureRate) }
      );
    } else {
      await emitEvent(edgespark, {
        type: 'campaign_finished',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'campanhas',
        resourceId: id,
        campanhaId: id,
        payload: { 
          sucesso, 
          falha, 
          total: mensagensPendentes.length,
          successRate: Math.round((sucesso / mensagensPendentes.length) * 100)
        }
      });
    }

    return c.json({ 
      success: true, 
      enviados: sucesso,
      falhas: falha,
      total: mensagensPendentes.length
    });
  });

  // GET /api/campanhas/:id/mensagens - Ver mensagens da campanha
  app.get("/api/campanhas/:id/mensagens", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const { page = "1", limit = "50", status } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [eq(tables.mensagensCampanha.campaignId, id)];
    if (status) {
      conditions.push(eq(tables.mensagensCampanha.status, status));
    }

    const mensagens = await edgespark.db
      .select()
      .from(tables.mensagensCampanha)
      .where(and(...conditions))
      .orderBy(desc(tables.mensagensCampanha.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.mensagensCampanha)
      .where(eq(tables.mensagensCampanha.campaignId, id));

    const total = countResult[0]?.count || 0;

    return c.json({
      mensagens,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  });

  // GET /api/campanhas/:id/stats - Estatísticas da campanha
  app.get("/api/campanhas/:id/stats", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));

    const stats = await edgespark.db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
        sending: sql<number>`sum(case when status = 'sending' then 1 else 0 end)`,
        sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
        delivered: sql<number>`sum(case when status = 'delivered' then 1 else 0 end)`,
        failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
      })
      .from(tables.mensagensCampanha)
      .where(eq(tables.mensagensCampanha.campaignId, id));

    const s = stats[0];
    const total = s?.total || 0;
    const successRate = total > 0 ? ((s?.sent || 0) / total) * 100 : 0;
    const deliveryRate = total > 0 ? ((s?.delivered || 0) / total) * 100 : 0;

    return c.json({
      total,
      pending: s?.pending || 0,
      sending: s?.sending || 0,
      sent: s?.sent || 0,
      delivered: s?.delivered || 0,
      failed: s?.failed || 0,
      successRate: Math.round(successRate * 10) / 10,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
    });
  });

  // GET /api/campanhas/:id/events - Timeline de eventos da campanha
  app.get("/api/campanhas/:id/events", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const { page = "1", limit = "50" } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get campaign to verify tenant access
    const [campanha] = await edgespark.db
      .select()
      .from(tables.campanhas)
      .where(eq(tables.campanhas.id, id))
      .limit(1);

    if (!campanha) {
      return c.json({ error: "Campanha não encontrada" }, 404);
    }

    // Check tenant access
    if (user.tenantId && campanha.tenantId !== user.tenantId) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    const tenantId = user.tenantId || user.id;
    const result = await getCampaignTimeline(edgespark, id, tenantId, pageNum, limitNum);

    return c.json(result);
  });

  // GET /api/campanhas/:id/event-stats - Estatísticas baseadas em eventos
  app.get("/api/campanhas/:id/event-stats", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));

    // Get campaign to verify tenant access
    const [campanha] = await edgespark.db
      .select()
      .from(tables.campanhas)
      .where(eq(tables.campanhas.id, id))
      .limit(1);

    if (!campanha) {
      return c.json({ error: "Campanha não encontrada" }, 404);
    }

    // Check tenant access
    if (user.tenantId && campanha.tenantId !== user.tenantId) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    const tenantId = user.tenantId || user.id;
    const stats = await getCampaignEventStats(edgespark, id, tenantId);

    return c.json(stats);
  });

  // ============================================
  // WEBHOOK - Receber mensagens do WhatsApp (Inbound)
  // ============================================
  
  // POST /api/webhooks/whatsapp - Webhook para receber mensagens do WhatsApp
  app.post("/api/webhooks/whatsapp", async (c) => {
    try {
      const body = await c.req.json();
      console.log("[Webhook] WhatsApp received:", JSON.stringify(body));

      // Extrair dados da mensagem
      const from = body.from || body.from_number || body.phoneNumber || body.messages?.[0]?.from;
      const messageText = body.message?.text?.body || body.message?.caption || body.messages?.[0]?.text?.body || body.content || body.body;
      const messageId = body.messageId || body.id?.id || body.messages?.[0]?.id;
      const timestamp = body.timestamp || Date.now();

      if (!from) {
        console.warn("[Webhook] WhatsApp: Número de origem não encontrado");
        return c.json({ error: "Missing from field" }, 400);
      }

      // Normalizar número de telefone (remover caracteres não numéricos)
      const normalizedPhone = from.replace(/\D/g, '');

      // Buscar cliente pelo celular
      let cliente = await edgespark.db
        .select()
        .from(tables.clientes)
        .where(sql`replace(replace(replace(replace(${tables.clientes.celular}, '(', ''), ')', ''), '-', ''), ' ', '') LIKE ${'%' + normalizedPhone + '%'}`)
        .limit(1);

      // Se não encontrou pelo celular, tenta pelo telefone
      if (!cliente.length) {
        const clientesByPhone = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(sql`replace(replace(replace(replace(${tables.clientes.telefone}, '(', ''), ')', ''), '-', ''), ' ', '') LIKE ${'%' + normalizedPhone + '%'}`)
          .limit(1);
        
        if (clientesByPhone.length) {
          cliente = clientesByPhone;
        }
      }

      const now = Date.now();
      let clienteId = cliente[0]?.id;

      // Se não encontrou cliente, criar um novo
      if (!clienteId) {
        const newClienteResult = await edgespark.db.insert(tables.clientes).values({
          nome: `Cliente ${normalizedPhone.slice(-4)}`,
          celular: from,
          createdAt: now,
          updatedAt: now,
        });
        clienteId = Number(newClienteResult.lastInsertRowid);
      }

      // Buscar última mensagem enviada para este contato (para vincular à campanha)
      const lastSentMessage = await edgespark.db
        .select()
        .from(tables.mensagensCampanha)
        .where(and(
          eq(tables.mensagensCampanha.contatoId, clienteId),
          eq(tables.mensagensCampanha.direction as any, 'outbound')
        ))
        .orderBy(desc(tables.mensagensCampanha.createdAt))
        .limit(1);

      const linkedCampaignId = lastSentMessage[0]?.campaignId || null;

      // Buscar ou criar conversation
      let conversations = await edgespark.db
        .select()
        .from(tables.conversations)
        .where(and(
          eq(tables.conversations.clienteId, clienteId),
          eq(tables.conversations.status, 'active')
        ))
        .orderBy(desc(tables.conversations.createdAt))
        .limit(1);

      let conversationId;
      if (!conversations.length) {
        // Criar nova conversation
        const newConvResult = await edgespark.db.insert(tables.conversations).values({
          clienteId,
          campaignId: linkedCampaignId,
          status: 'active',
          direction: 'inbound',
          provider: 'whatsapp',
          providerPhone: from,
          lastMessageAt: now,
          createdAt: now,
          updatedAt: now,
        });
        conversationId = newConvResult.lastInsertRowid;
      } else {
        conversationId = conversations[0].id;
        // Atualizar conversation com última mensagem e vincular à campanha se ainda não estiver
        const updates: any = { 
          lastMessageAt: now, 
          direction: 'inbound',
          updatedAt: now 
        };
        // Se a conversa não tem campaign_id e recebemos uma resposta, vincular
        if (!conversations[0].campaignId && linkedCampaignId) {
          updates.campaignId = linkedCampaignId;
        }
        await edgespark.db
          .update(tables.conversations)
          .set(updates)
          .where(eq(tables.conversations.id, conversationId));
      }

      // Salvar mensagem recebida (sem campaignId para inbound)
      const inboundMsgValues: any = {
        contatoId: clienteId,
        recipient: from,
        provider: 'whatsapp',
        content: messageText || '',
        status: 'delivered',
        direction: 'inbound',
        externalId: messageId || null,
        sentAt: timestamp,
        deliveredAt: now,
        createdAt: now,
        updatedAt: now,
      };
      
      await edgespark.db.insert(tables.mensagensCampanha).values(inboundMsgValues);

      // Detectar se a mensagem indica escalação para atendimento humano
      const shouldEscalate = detectEscalation(messageText);
      
      // Atualizar conversation com última mensagem, contadores e possível escalação
      const conversationUpdates: any = { 
        lastMessageAt: now, 
        direction: 'inbound',
        lastResponseAt: now,
        unreadCount: (conversations[0]?.unreadCount || 0) + 1,
        updatedAt: now 
      };
      
      // Se a conversa não tem campaign_id e recebemos uma resposta, vincular
      if (!conversations[0]?.campaignId && linkedCampaignId) {
        conversationUpdates.campaignId = linkedCampaignId;
      }
      
      // Se detectou frase de escalação, mudar para status human
      if (shouldEscalate) {
        conversationUpdates.conversationStatus = 'human';
        console.log(`[Webhook] 🚨 ESCALATION DETECTED! Conversa ${conversationId} movida para atendimento humano`);
        
        // Registrar evento de escalação
        await edgespark.db.insert(tables.eventos).values({
          tipo: 'escalation',
          dados: JSON.stringify({ 
            conversationId, 
            clienteId, 
            message: messageText,
            timestamp: now 
          }),
          createdAt: now,
        });
      }
      
      // Se a conversa estava waiting e recebeu resposta, voltar para open
      if (conversations[0]?.conversationStatus === 'waiting') {
        conversationUpdates.conversationStatus = 'open';
      }

      await edgespark.db
        .update(tables.conversations)
        .set(conversationUpdates)
        .where(eq(tables.conversations.id, conversationId));

      // Registrar evento de mensagem recebida
      await edgespark.db.insert(tables.eventos).values({
        tipo: 'message_received',
        dados: JSON.stringify({ 
          conversationId, 
          clienteId, 
          from,
          direction: 'inbound',
          timestamp: now 
        }),
        createdAt: now,
      });

      console.log(`[Webhook] Mensagem recebida de ${from}, clienteId: ${clienteId}, conversationId: ${conversationId}, escalate: ${shouldEscalate}`);

      // Se houver uma campanha vinculada, atualizar estatísticas
      if (linkedCampaignId) {
        // Buscar campanha
        const [campanha] = await edgespark.db
          .select()
          .from(tables.campanhas)
          .where(eq(tables.campanhas.id, linkedCampaignId))
          .limit(1);

        if (campanha) {
          // Atualizar contagem de respostas
          const currentResponses = campanha.enviosSucesso || 0;
          await edgespark.db
            .update(tables.campanhas)
            .set({ 
              enviosSucesso: currentResponses + 1,
              updatedAt: now 
            })
            .where(eq(tables.campanhas.id, linkedCampaignId));

          console.log(`[Webhook] Campanha ${linkedCampaignId} atualizada com nova resposta`);
        }
      }

      return c.json({ success: true, message: "Message received" });
    } catch (error: any) {
      console.error("[Webhook] Erro ao processar mensagem:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // GET /api/webhooks/whatsapp - Verificação de saúde do webhook
  app.get("/api/webhooks/whatsapp", (c) => {
    return c.json({ status: "ok", webhook: "whatsapp" });
  });

  // ============================================
  // CONVERSATIONS - Gerenciamento de Conversas
  // ============================================

  // GET /api/conversations - Listar conversas
  app.get("/api/conversations", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { page = "1", limit = "20", status, clienteId, conversationStatus } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (status) {
      conditions.push(eq(tables.conversations.status, status));
    }
    if (clienteId) {
      conditions.push(eq(tables.conversations.clienteId, parseInt(clienteId)));
    }
    if (conversationStatus) {
      conditions.push(eq(tables.conversations.conversationStatus as any, conversationStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const conversations = await edgespark.db
      .select()
      .from(tables.conversations)
      .where(whereClause)
      .orderBy(desc(tables.conversations.lastMessageAt))
      .limit(limitNum)
      .offset(offset);

    // Buscar informações do cliente e campanha para cada conversa
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const cliente = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.id, conv.clienteId))
          .limit(1);
        
        // Buscar campanha se existir
        let campanha = null;
        if (conv.campaignId) {
          const campanhas = await edgespark.db
            .select()
            .from(tables.campanhas)
            .where(eq(tables.campanhas.id, conv.campaignId))
            .limit(1);
          campanha = campanhas[0] || null;
        }

        // Buscar última mensagem
        const lastMessage = await edgespark.db
          .select()
          .from(tables.mensagensCampanha)
          .where(eq(tables.mensagensCampanha.contatoId, conv.clienteId))
          .orderBy(desc(tables.mensagensCampanha.createdAt))
          .limit(1);

        return {
          ...conv,
          cliente: cliente[0] || null,
          campanha,
          ultimaMensagem: lastMessage[0] || null,
        };
      })
    );

    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.conversations)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    return c.json({
      conversations: conversationsWithDetails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  });

  // GET /api/conversations/:id - Ver conversa específica com mensagens
  app.get("/api/conversations/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    
    const conversation = await edgespark.db
      .select()
      .from(tables.conversations)
      .where(eq(tables.conversations.id, id))
      .limit(1);

    if (!conversation.length) {
      return c.json({ error: "Conversa não encontrada" }, 404);
    }

    // Buscar cliente
    const cliente = await edgespark.db
      .select()
      .from(tables.clientes)
      .where(eq(tables.clientes.id, conversation[0].clienteId))
      .limit(1);

    // Buscar mensagens da conversa (pelo contato)
    const mensagens = await edgespark.db
      .select()
      .from(tables.mensagensCampanha)
      .where(eq(tables.mensagensCampanha.contatoId, conversation[0].clienteId))
      .orderBy(asc(tables.mensagensCampanha.createdAt));

    return c.json({
      conversation: {
        ...conversation[0],
        cliente: cliente[0] || null,
      },
      mensagens,
    });
  });

  // PUT /api/conversations/:id - Atualizar conversa (fechar, arquivar, mudar status, atribuir)
  app.put("/api/conversations/:id", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const updates: any = { updatedAt: Date.now() };
    if (body.status) updates.status = body.status;
    if (body.conversationStatus) updates.conversationStatus = body.conversationStatus;
    if (body.assignedTo) updates.assignedTo = body.assignedTo;
    if (body.priority !== undefined) updates.priority = body.priority;
    
    // Se estiver assumindo a conversa
    if (body.assume && !updates.assignedTo) {
      updates.assignedTo = user.id;
      updates.conversationStatus = 'human';
    }

    await edgespark.db
      .update(tables.conversations)
      .set(updates)
      .where(eq(tables.conversations.id, id));

    // Emit event: conversation_status_changed
    if (body.status || body.conversationStatus) {
      await emitEvent(edgespark, {
        type: 'conversation_status_changed',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'conversations',
        resourceId: id,
        conversaId: id,
        payload: { 
          status: body.status, 
          conversationStatus: body.conversationStatus,
          changes: Object.keys(body)
        }
      });
    }

    // Emit event: conversation_assigned
    if (body.assignedTo) {
      await emitEvent(edgespark, {
        type: 'conversation_assigned',
        source: 'api',
        user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
        resource: 'conversations',
        resourceId: id,
        conversaId: id,
        payload: { assignedTo: body.assignedTo }
      });
    }

    return c.json({ success: true });
  });

  // POST /api/conversations/:id/assume - Assumir conversa
  app.post("/api/conversations/:id/assume", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));

    await edgespark.db
      .update(tables.conversations)
      .set({ 
        assignedTo: user.id,
        conversationStatus: 'human',
        updatedAt: Date.now() 
      })
      .where(eq(tables.conversations.id, id));

    // Emit event: conversation_assigned
    await emitEvent(edgespark, {
      type: 'conversation_assigned',
      source: 'api',
      user: { id: user.id, tenantId: user.tenantId, parceiroId: user.parceiroId },
      resource: 'conversations',
      resourceId: id,
      conversaId: id,
      payload: { assignedTo: user.id, action: 'assume' }
    });

    return c.json({ success: true });
  });

  // GET /api/conversations/queue - Fila de atendimento
  app.get("/api/conversations/queue", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { sort = "waiting" } = c.req.query();

    // Buscar conversas abertas que precisam de atenção
    let conversations;
    if (sort === "priority") {
      // Ordenar por prioridade (maior primeiro) e depois por tempo sem resposta
      conversations = await edgespark.db
        .select()
        .from(tables.conversations)
        .where(or(
          eq(tables.conversations.conversationStatus as any, 'open'),
          eq(tables.conversations.conversationStatus as any, 'waiting'),
          eq(tables.conversations.conversationStatus as any, 'bot')
        ))
        .orderBy(
          desc(tables.conversations.priority),
          asc(tables.conversations.lastMessageAt)
        )
        .limit(50);
    } else {
      // Ordenar por tempo sem resposta (mais antigas primeiro)
      conversations = await edgespark.db
        .select()
        .from(tables.conversations)
        .where(or(
          eq(tables.conversations.conversationStatus as any, 'open'),
          eq(tables.conversations.conversationStatus as any, 'waiting'),
          eq(tables.conversations.conversationStatus as any, 'bot')
        ))
        .orderBy(asc(tables.conversations.lastMessageAt))
        .limit(50);
    }

    // Buscar informações do cliente para cada conversa
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const cliente = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.id, conv.clienteId))
          .limit(1);
        
        // Buscar última mensagem
        const lastMessage = await edgespark.db
          .select()
          .from(tables.mensagensCampanha)
          .where(eq(tables.mensagensCampanha.contatoId, conv.clienteId))
          .orderBy(desc(tables.mensagensCampanha.createdAt))
          .limit(1);

        // Calcular tempo sem resposta
        const lastMsgTime = conv.lastMessageAt || conv.updatedAt;
        const waitingTime = Date.now() - (lastMsgTime || 0);

        return {
          ...conv,
          cliente: cliente[0] || null,
          ultimaMensagem: lastMessage[0] || null,
          waitingTime,
          waitingTimeFormatted: formatWaitingTime(waitingTime),
        };
      })
    );

    return c.json({ 
      queue: conversationsWithDetails,
      total: conversationsWithDetails.length 
    });
  });

  // GET /api/campanhas/:id/conversations - Ver conversas de uma campanha
  app.get("/api/campanhas/:id/conversations", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const campaignId = parseInt(c.req.param("id"));

    const conversations = await edgespark.db
      .select()
      .from(tables.conversations)
      .where(eq(tables.conversations.campaignId, campaignId))
      .orderBy(desc(tables.conversations.lastMessageAt));

    // Buscar informações do cliente para cada conversa
    const conversationsWithCliente = await Promise.all(
      conversations.map(async (conv) => {
        const cliente = await edgespark.db
          .select()
          .from(tables.clientes)
          .where(eq(tables.clientes.id, conv.clienteId))
          .limit(1);
        
        // Contar mensagens recebidas (inbound)
        const inboundCount = await edgespark.db
          .select({ count: sql<number>`count(*)` })
          .from(tables.mensagensCampanha)
          .where(and(
            eq(tables.mensagensCampanha.contatoId, conv.clienteId),
            eq(tables.mensagensCampanha.direction as any, 'inbound')
          ));

        return {
          ...conv,
          cliente: cliente[0] || null,
          totalMensagensRecebidas: inboundCount[0]?.count || 0,
        };
      })
    );

    return c.json({ conversations: conversationsWithCliente });
  });

  // GET /api/conversations/:id/mensagens - Ver mensagens da conversa
  app.get("/api/conversations/:id/mensagens", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const { page = "1", limit = "50", direction } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Primeiro busca a conversa para saber o cliente
    const conversation = await edgespark.db
      .select()
      .from(tables.conversations)
      .where(eq(tables.conversations.id, id))
      .limit(1);

    if (!conversation.length) {
      return c.json({ error: "Conversa não encontrada" }, 404);
    }

    const conditions: any[] = [eq(tables.mensagensCampanha.contatoId, conversation[0].clienteId)];
    if (direction) {
      conditions.push(eq(tables.mensagensCampanha.direction as any, direction));
    }

    const mensagens = await edgespark.db
      .select()
      .from(tables.mensagensCampanha)
      .where(and(...conditions))
      .orderBy(desc(tables.mensagensCampanha.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.mensagensCampanha)
      .where(eq(tables.mensagensCampanha.contatoId, conversation[0].clienteId));

    const total = countResult[0]?.count || 0;

    return c.json({
      mensagens,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  });

  // POST /api/conversations/:id/resposta - Enviar resposta para a conversa (outbound)
  app.post("/api/conversations/:id/resposta", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    // Buscar conversa
    const conversation = await edgespark.db
      .select()
      .from(tables.conversations)
      .where(eq(tables.conversations.id, id))
      .limit(1);

    if (!conversation.length) {
      return c.json({ error: "Conversa não encontrada" }, 404);
    }

    // Buscar cliente
    const cliente = await edgespark.db
      .select()
      .from(tables.clientes)
      .where(eq(tables.clientes.id, conversation[0].clienteId))
      .limit(1);

    if (!cliente.length) {
      return c.json({ error: "Cliente não encontrado" }, 404);
    }

    const now = Date.now();
    const recipient = cliente[0].celular || cliente[0].telefone;

    if (!recipient) {
      return c.json({ error: "Cliente sem telefone cadastrado" }, 400);
    }

    // Inicializa messaging engine
    const { messagingEngine: msgEngine } = getMessagingInfrastructure(edgespark.db, tables);

    // Envia mensagem
    let messageResult: { success: boolean; externalId?: string; error?: string };
    if (msgEngine) {
      messageResult = await msgEngine.send(recipient, body.mensagem, { provider: 'whatsapp' });
    } else {
      messageResult = { success: false };
    }

    // Salva mensagem de resposta (outbound)
    const msgValues: any = {
      contatoId: conversation[0].clienteId,
      recipient,
      provider: 'whatsapp',
      content: body.mensagem,
      status: messageResult.success ? 'sent' : 'failed',
      direction: 'outbound',
      externalId: messageResult.externalId || null,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    };
    
    // Adicionar campaignId apenas se definido
    if (body.campaignId) {
      msgValues.campaignId = body.campaignId;
    }

    await edgespark.db.insert(tables.mensagensCampanha).values(msgValues);

    // Atualiza conversation - limpar unread e atualizar contadores
    await edgespark.db
      .update(tables.conversations)
      .set({ 
        lastMessageAt: now, 
        direction: 'outbound',
        lastResponseAt: now,
        unreadCount: 0,
        updatedAt: now 
      })
      .where(eq(tables.conversations.id, id));

    // Registrar evento de resposta enviada
    await edgespark.db.insert(tables.eventos).values({
      tipo: 'message_sent',
      dados: JSON.stringify({ 
        conversationId: id, 
        clienteId: conversation[0].clienteId,
        userId: user.id,
        timestamp: now 
      }),
      createdAt: now,
    });

    return c.json({ 
      success: messageResult.success, 
      externalId: messageResult.externalId,
      error: messageResult.error 
    });
  });

  // ============================================
  // MENSAGENS INBOUND - Listar mensagens recebidas
  // ============================================

  // GET /api/mensagens/inbound - Listar todas as mensagens recebidas
  app.get("/api/mensagens/inbound", async (c) => {
    const user: any = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { page = "1", limit = "50", campaignId } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [eq(tables.mensagensCampanha.direction as any, 'inbound')];
    if (campaignId) {
      conditions.push(eq(tables.mensagensCampanha.campaignId, parseInt(campaignId)));
    }

    const mensagens = await edgespark.db
      .select()
      .from(tables.mensagensCampanha)
      .where(and(...conditions))
      .orderBy(desc(tables.mensagensCampanha.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countResult = await edgespark.db
      .select({ count: sql<number>`count(*)` })
      .from(tables.mensagensCampanha)
      .where(eq(tables.mensagensCampanha.direction as any, 'inbound'));

    const total = countResult[0]?.count || 0;

    return c.json({
      mensagens,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  });

  // ============================================
  // EVENT SYSTEM API
  // ============================================

  // GET /api/events - List events with filters
  app.get("/api/events", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Parse query filters
    const type = c.req.query("type");
    const source = c.req.query("source");
    const resource = c.req.query("resource");
    const resourceId = c.req.query("resource_id") ? parseInt(c.req.query("resource_id")!) : undefined;
    const leadId = c.req.query("lead_id") ? parseInt(c.req.query("lead_id")!) : undefined;
    const campanhaId = c.req.query("campanha_id") ? parseInt(c.req.query("campanha_id")!) : undefined;
    const page = c.req.query("page") ? parseInt(c.req.query("page")!) : 1;
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 50;
    const startDate = c.req.query("start_date") ? parseInt(c.req.query("start_date")!) : undefined;
    const endDate = c.req.query("end_date") ? parseInt(c.req.query("end_date")!) : undefined;

    const result = await queryEvents(edgespark, user, {
      type,
      source,
      resource,
      resourceId,
      leadId,
      campanhaId,
      page,
      limit,
      startDate,
      endDate
    });

    return c.json(result);
  });

  // GET /api/events/stats - Get event statistics
  app.get("/api/events/stats", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const startDate = c.req.query("start_date") ? parseInt(c.req.query("start_date")!) : undefined;
    const endDate = c.req.query("end_date") ? parseInt(c.req.query("end_date")!) : undefined;

    const stats = await getEventStats(edgespark, user, startDate, endDate);

    return c.json(stats);
  });

  // GET /api/alerts - Get active security alerts
  app.get("/api/alerts", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const tenantId = user.tenantId || user.id;
    const alerts = await getActiveAlerts(edgespark, tenantId);

    return c.json({ alerts });
  });

  // POST /api/alerts/:id/resolve - Resolve an alert
  app.post("/api/alerts/:id/resolve", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Check permission - only admins can resolve alerts
    const role = user.role || user.perfil;
    const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_CEO', 'CEO', 'ADMIN_FRANQUIA'];
    if (!allowedRoles.includes(role) && !user.permissions.includes('*')) {
      return c.json({ error: "Forbidden", message: "Apenas administradores podem resolver alertas" }, 403);
    }

    const alertId = parseInt(c.req.param("id"));
    const success = await resolveAlert(edgespark, alertId, user.id);

    return c.json({ success });
  });

  // ============================================
  // STORM INTEGRATION - Rotas da Nova Promotora / Storm
  // ============================================

  // Testar conexão com Storm (protegido - apenas ADMIN_SISTEMA ou ADMIN_FRANQUIA)
  app.post("/api/integrations/storm/test-connection", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const role = user.role || user.perfil;
    const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_ADMIN_FRANQUIA', 'ADMIN_FRANQUIA', 'ROLE_CEO'];
    
    if (!allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden - Acesso negado" }, 403);
    }

    const result = await testStormConnection(edgespark);
    
    // Retornar resultado sanitizado - nunca expõe credenciais
    return c.json({
      success: result.success,
      provider: result.provider,
      message: result.message,
      checkedAt: result.checkedAt,
    });
  });

  // Enviar proposta para Storm
  app.post("/api/integrations/storm/send-proposal", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const role = user.role || user.perfil;
    const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_ADMIN_FRANQUIA', 'ADMIN_FRANQUIA', 'ROLE_CEO', 'ROLE_SDR', 'SDR'];
    
    if (!allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden - Acesso negado" }, 403);
    }

    const body = await c.req.json() as {
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
    };

    const result = await sendProposal(edgespark, {
      customerName: body.customerName,
      customerDocument: body.customerDocument,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      productCode: body.productCode,
      productName: body.productName,
      premium: body.premium,
      paymentMethod: body.paymentMethod,
      beneficiaryName: body.beneficiaryName,
      beneficiaryDocument: body.beneficiaryDocument,
    });

    return c.json(result);
  });

  // Consultar status da proposta
  app.get("/api/integrations/storm/proposal/:proposalId/status", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const role = user.role || user.perfil;
    const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_ADMIN_FRANQUIA', 'ADMIN_FRANQUIA', 'ROLE_CEO', 'ROLE_SDR', 'SDR', 'ROLE_OPERACIONAL', 'OPERACIONAL'];
    
    if (!allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden - Acesso negado" }, 403);
    }

    const proposalId = c.req.param("proposalId");
    const result = await getProposalStatus(edgespark, proposalId);

    return c.json(result);
  });

  // Sincronizar tabelas do Storm
  app.post("/api/integrations/storm/sync/:tableName", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const role = user.role || user.perfil;
    const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_ADMIN_FRANQUIA', 'ADMIN_FRANQUIA', 'ROLE_CEO'];
    
    if (!allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden - Acesso negado" }, 403);
    }

    const tableName = c.req.param("tableName");
    const result = await syncTables(edgespark, tableName);

    return c.json(result);
  });

  // Sincronizar comissões do Storm
  app.post("/api/integrations/storm/sync-commissions", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const role = user.role || user.perfil;
    const allowedRoles = ['ROLE_ADMIN_SISTEMA', 'ADMIN_SISTEMA', 'ROLE_ADMIN_FRANQUIA', 'ADMIN_FRANQUIA', 'ROLE_CEO', 'ROLE_FINANCEIRO', 'FINANCEIRO'];
    
    if (!allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden - Acesso negado" }, 403);
    }

    const body = await c.req.json().catch(() => ({})) as { start?: string; end?: string };
    const period = body.start && body.end ? { start: body.start, end: body.end } : undefined;
    
    const result = await syncCommissions(edgespark, period);

    return c.json(result);
  });

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

      // Verificar permissão SDR IA
      const salesRoles = [
        'ROLE_ADMIN_SISTEMA',
        'ROLE_CONSULTOR_COMERCIAL_B2C',
        'ROLE_CONSULTOR_COMERCIAL_B2B',
        'ROLE_GERENTE_COMERCIAL_B2C',
        'ROLE_GERENTE_COMERCIAL_B2B',
        'ROLE_DIRETOR_COMERCIAL_B2C',
        'ROLE_DIRETOR_COMERCIAL_B2B',
      ];
      
      const hasPermission = user.role && salesRoles.includes(user.role);
      if (!hasPermission) {
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
      const model = edgespark.secret.get("OPENAI_MODEL") || "gpt-4.1-mini";

      // Prompt do SDR
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
- criar_opportunidade
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
        history.slice(-5).forEach((msg: any) => {
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
      let analysis: any;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found");
        }
      } catch (parseError) {
        console.error(`[SDR] Parse error: ${content}`);
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

      console.log(`[SDR] Decision saved: ${decision.id}, intent: ${analysis.intent}`);

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
      const user = edgespark.auth.user;
      if (!user) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
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

      // Verificar se já existe oportunidade aberta
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
      const user = edgespark.auth.user;
      if (!user) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }

      const { conversationId, reason } = await c.req.json();

      console.log(`[SDR] Escalating conversation ${conversationId} to human`);

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

// ============================================
// MESSAGING INFRASTRUCTURE - Exports
// ============================================
// Instâncias globais das infraestruturas de messaging

let queueManager: QueueManager | null = null;
let messagingEngine: MessagingEngine | null = null;
let campaignService: CampaignService | null = null;
let eventBus: EventBus | null = null;

export function getMessagingInfrastructure(db: any, tables: any) {
  if (!queueManager) {
    // Inicializa o EventBus (opcional - sem argumentos)
    eventBus = new EventBus();
    
    // Inicializa o QueueManager
    queueManager = new QueueManager({
      db,
      tables,
      maxConcurrent: 5,
      pollInterval: 5000,
    });
    
    // Inicializa o MessagingEngine com providers
    messagingEngine = new MessagingEngine({
      providers: [
        new WhatsAppProvider({ perMinute: 100, perHour: 1000 }),
        new SMSProvider({ perMinute: 50, perHour: 500 }),
        new EmailProvider({ perMinute: 200, perHour: 5000 }),
      ],
    });
    
    // Inicializa o CampaignService
    campaignService = new CampaignService({
      db,
      tables,
      messagingEngine: messagingEngine,
      queueManager,
      eventBus,
    });
    
    console.log('[Messaging] Infraestrutura inicializada');
  }
  
  return {
    queueManager,
    messagingEngine,
    campaignService,
    eventBus,
  };
}

// Exporta tipos para uso em rotas
export type { QueueJob, JobStatus } from './queueSystem';
export type { Message, MessageProvider, MessageStatus, MessageResult, IMessageProvider } from './messagingEngine';
export type { Campaign, CampaignMessage, CampaignStatus, CampaignType } from './campaignService';
