// FINQZ PRO - SDR Panel Component
// Painel de análise SDR IA para conversas

import React, { useState } from "react";
import { 
  Bot, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  TrendingUp,
  User,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap
} from "lucide-react";
import { Button } from "../../design-system/components/Button";
import { apiFetch } from "../../api/http";

interface SdrDecision {
  id: number;
  intent: string;
  confidence: number;
  recommended_action: string;
  response_text?: string;
  createdAt: number;
}

interface SdrPanelProps {
  conversationId: number;
  leadId?: number;
  leadNome?: string;
  leadCelular?: string;
  campaignName?: string;
  lastMessage?: string;
  messages?: Array<{
    direction: 'inbound' | 'outbound';
    content: string;
    createdAt: number;
  }>;
  onEscalate?: () => void;
  onCreateOpportunity?: () => void;
  onUseResponse?: (responseText: string) => void;
}

const intentLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  interessado: { label: "Interessado", color: "bg-green-500/10 text-green-600 dark:text-green-300 border border-green-500/20", icon: <CheckCircle className="w-4 h-4" /> },
  duvida: { label: "Dúvida", color: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20", icon: <HelpCircle className="w-4 h-4" /> },
  preco: { label: "Preço", color: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20", icon: <TrendingUp className="w-4 h-4" /> },
  sem_interesse: { label: "Sem Interesse", color: "bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20", icon: <XCircle className="w-4 h-4" /> },
  quer_humano: { label: "Quer Humano", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border border-orange-500/20", icon: <User className="w-4 h-4" /> },
  dados_insuficientes: { label: "Dados Insuficientes", color: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-muted)]", icon: <AlertTriangle className="w-4 h-4" /> },
};

const actionLabels: Record<string, string> = {
  responder: "Responder automaticamente",
  escalar_humano: "Escalar para humano",
  criar_oportunidade: "Criar oportunidade",
  aguardar: "Aguardar interação",
  encerrar: "Encerrar conversa",
};

export function SdrPanel({
  conversationId,
  leadId,
  leadNome,
  leadCelular,
  campaignName,
  lastMessage,
  messages = [],
  onEscalate,
  onCreateOpportunity,
  onUseResponse,
}: SdrPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decision, setDecision] = useState<SdrDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Analisar última mensagem
  const handleAnalyze = async () => {
    if (!lastMessage) {
      setError("Nenhuma mensagem para analisar");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Preparar histórico da conversa
      const conversationHistory = messages.slice(-5).map((msg) => ({
        direction: msg.direction,
        content: msg.content,
      }));

      const response = await apiFetch("/api/sdr/analyze", {
        method: "POST",
        body: JSON.stringify({
          message: lastMessage,
          conversationId,
          leadId,
          leadNome,
          leadCelular,
          campaignName,
          history: conversationHistory,
        }),
      });

      if (response.data.success) {
        setDecision({
          id: 0,
          intent: response.data.intent,
          confidence: response.data.confidence,
          recommended_action: response.data.recommended_action,
          response_text: response.data.response_text,
          createdAt: Date.now()
        });
      } else {
        setError(response.data.error || "Erro ao analisar mensagem");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao analisar mensagem");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Escalar para humano
  const handleEscalate = async () => {
    try {
      await apiFetch("/api/sdr/escalate", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          reason: decision?.intent || "Escalado pelo usuário",
        }),
      });
      onEscalate?.();
    } catch {
      setError("Erro ao escalar atendimento");
    }
  };

  // Criar oportunidade
  const handleCreateOpportunity = async () => {
    try {
      const response = await apiFetch("/api/sdr/opportunity", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          leadId,
          leadNome,
          leadCelular,
          observation: `Oportunidade criada via SDR IA - Intent: ${decision?.intent}`,
        }),
      });

      if (response.data.success) {
        onCreateOpportunity?.();
      } else {
        setError(response.data.error || "Erro ao criar oportunidade");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar oportunidade");
    }
  };

  const intentInfo = decision ? intentLabels[decision.intent] : null;

  return (
    <div className="sdr-context-panel overflow-hidden">
      {/* Header */}
      <div
        className="sdr-context-header p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">SDR IA</span>
          {decision && (
            <span className="rounded border border-[var(--border-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
              {intentInfo?.label || decision.intent}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Botão de análise */}
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !lastMessage}
              className="flex-1 flex items-center justify-center gap-2"
              variant={decision ? "outline" : "primary"}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {decision ? "Reanalisar" : "Analisar Mensagem"}
                </>
              )}
            </Button>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Resultado da análise */}
          {decision && (
            <div className="space-y-3">
              {/* Intent e Confiança */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${intentInfo?.color || "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-muted)]"}`}
                  >
                    {intentInfo?.icon}
                    {intentInfo?.label || decision.intent}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  Confiança:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {Math.round(decision.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Barra de confiança */}
              <div className="w-full bg-[var(--bg-surface-strong)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    decision.confidence >= 0.7
                      ? "bg-green-500"
                      : decision.confidence >= 0.4
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${decision.confidence * 100}%` }}
                />
              </div>

              {/* Ação recomendada */}
              <div className="p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-muted)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">Ação Recomendada</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {actionLabels[decision.recommended_action] || decision.recommended_action}
                </div>
              </div>

              {/* Resposta sugerida */}
              {decision.response_text && (
                <div className="p-3 bg-[var(--color-primary-faint)] border border-[var(--border-default)] rounded-lg">
                  <div className="text-xs text-[var(--color-primary-soft)] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Resposta Sugerida
                  </div>
                  <div className="text-sm text-[var(--text-primary)]">{decision.response_text}</div>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-2">
                {/* Botão Usar Resposta - preenche o campo de mensagem */}
                {decision.response_text && (
                  <Button
                    onClick={() => onUseResponse?.(decision.response_text!)}
                    className="flex-1 flex items-center justify-center gap-1"
                    variant="primary"
                  >
                    <Sparkles className="w-4 h-4" />
                    Usar Resposta
                  </Button>
                )}

                {decision.recommended_action === "criar_oportunidade" && (
                  <Button
                    onClick={handleCreateOpportunity}
                    className="flex-1 flex items-center justify-center gap-1"
                    variant="secondary"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Criar Oportunidade
                  </Button>
                )}

                {decision.recommended_action === "escalar_humano" && (
                  <Button
                    onClick={handleEscalate}
                    className="flex-1 flex items-center justify-center gap-1"
                    variant="danger"
                  >
                    <User className="w-4 h-4" />
                    Escalar para Humano
                  </Button>
                )}

                {/* Sempre mostrar botão Escalar como opção */}
                {decision.recommended_action !== "escalar_humano" && (
                  <Button
                    onClick={handleEscalate}
                    className="flex-1 flex items-center justify-center gap-1"
                    variant="outline"
                  >
                    <User className="w-4 h-4" />
                    Escalar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Estado inicial */}
          {!decision && !error && !isAnalyzing && (
            <div className="text-center py-4 text-[var(--text-muted)]">
              <Brain className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
              <p className="text-sm">
                Analise a mensagem quando houver ação operacional.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
