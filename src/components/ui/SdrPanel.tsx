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
import api from "../../api/client";
import { USE_MOCKS } from "../../config/environment";

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
  interessado: { label: "Interessado", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
  duvida: { label: "Dúvida", color: "bg-yellow-100 text-yellow-700", icon: <HelpCircle className="w-4 h-4" /> },
  preco: { label: "Pergunta sobre Preço", color: "bg-purple-100 text-purple-700", icon: <TrendingUp className="w-4 h-4" /> },
  sem_interesse: { label: "Sem Interesse", color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
  quer_humano: { label: "Quer Humano", color: "bg-orange-100 text-orange-700", icon: <User className="w-4 h-4" /> },
  dados_insuficientes: { label: "Dados Insuficientes", color: "bg-gray-100 text-gray-700", icon: <AlertTriangle className="w-4 h-4" /> },
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

      const response = await api.post("/api/sdr/analyze", {
        message: lastMessage,
        conversationId,
        leadId,
        leadNome,
        leadCelular,
        campaignName,
        history: conversationHistory,
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
    } catch (err: any) {
      console.error("[SDR] Analysis error:", err);
      setError(err.message || "Erro ao analisar mensagem");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Escalar para humano
  const handleEscalate = async () => {
    try {
      await api.post("/api/sdr/escalate", {
        conversationId,
        reason: decision?.intent || "Escalado pelo usuário",
      });
      onEscalate?.();
    } catch (err) {
      console.error("[SDR] Escalate error:", err);
    }
  };

  // Criar oportunidade
  const handleCreateOpportunity = async () => {
    try {
      const response = await api.post("/api/sdr/opportunity", {
        conversationId,
        leadId,
        leadNome,
        leadCelular,
        observation: `Oportunidade criada via SDR IA - Intent: ${decision?.intent}`,
      });

      if (response.data.success) {
        onCreateOpportunity?.();
      } else {
        setError(response.data.error || "Erro ao criar oportunidade");
      }
    } catch (err: any) {
      console.error("[SDR] Create opportunity error:", err);
      setError(err.message || "Erro ao criar oportunidade");
    }
  };

  const intentInfo = decision ? intentLabels[decision.intent] : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className="p-3 bg-gradient-to-r from-[#000dff] to-[#3388d9] text-white flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">SDR IA</span>
          {decision && (
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${intentInfo?.color || "bg-gray-100 text-gray-700"}`}
                  >
                    {intentInfo?.icon}
                    {intentInfo?.label || decision.intent}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Confiança:{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.round(decision.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Barra de confiança */}
              <div className="w-full bg-gray-200 rounded-full h-2">
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
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Ação Recomendada</div>
                <div className="text-sm font-medium text-gray-800">
                  {actionLabels[decision.recommended_action] || decision.recommended_action}
                </div>
              </div>

              {/* Resposta sugerida */}
              {decision.response_text && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Resposta Sugerida
                  </div>
                  <div className="text-sm text-gray-700">{decision.response_text}</div>
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
            <div className="text-center py-4 text-gray-500">
              <Brain className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                Clique em "Analisar Mensagem" para obter insights do SDR IA
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
