// FINQZ PRO - Conversas Page
import React, { useEffect, useState, useRef } from "react";
import { Search, Send, MessageCircle, Bot, User, ArrowLeft, Users, AlertCircle, Filter } from "lucide-react";
import { apiFetch } from "../api/http";
import useAppStore from "../store";
import { Button, EmptyState, LoadingState } from "../components/ui";
import { SdrPanel } from "../components/ui/SdrPanel";
import { PageHeader } from "../components/layout/PageHeader";
import { ROLE_PERMISSIONS, type Permission } from "../types";

// Tipos
interface Cliente {
  id: number;
  nome: string;
  celular?: string;
  telefone?: string;
  email?: string;
}

interface Campanha {
  id: number;
  nome: string;
}

interface Mensagem {
  id: number;
  campaignId?: number;
  contatoId: number;
  recipient: string;
  provider: string;
  content: string;
  status: string;
  direction: 'inbound' | 'outbound';
  externalId?: string;
  sentAt?: number;
  deliveredAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface Conversation {
  id: number;
  clienteId: number;
  campaignId?: number;
  status: 'active' | 'closed' | 'archived';
  conversationStatus?: 'open' | 'waiting' | 'bot' | 'human' | 'closed';
  direction: 'inbound' | 'outbound';
  provider: string;
  providerPhone?: string;
  assignedTo?: string;
  priority?: number;
  lastMessageAt?: number;
  lastResponseAt?: number;
  unreadCount?: number;
  waitingTime?: number;
  waitingTimeFormatted?: string;
  tenantId?: string;
  createdAt: number;
  updatedAt: number;
  cliente?: Cliente;
  campanha?: Campanha;
  ultimaMensagem?: Mensagem;
}

type ConversationStatus = NonNullable<Conversation["conversationStatus"]>;

const CONVERSATION_STATUSES = new Set<ConversationStatus>(["open", "waiting", "bot", "human", "closed"]);

const parseConversationStatus = (value: string): ConversationStatus | null =>
  CONVERSATION_STATUSES.has(value as ConversationStatus) ? (value as ConversationStatus) : null;

export default function Conversas() {
  const { tenantId, user } = useAppStore();
  const [conversas, setConversas] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Verificar permissão SDR IA
  const hasSdrIaPermission = (): boolean => {
    if (!user?.role) return false;
    const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
    if (!permissions) return false;
    return permissions.includes('SDR_IA_USE' as Permission);
  };
  
  // SDR Panel - só mostra se tiver permissão
  const [showSdrPanel, setShowSdrPanel] = useState(hasSdrIaPermission());

  // Fila de atendimento
  const [showQueue, setShowQueue] = useState(false);
  const [queueFilter, setQueueFilter] = useState<"all" | "waiting" | "priority">("waiting");
  const [queueConversas, setQueueConversas] = useState<Conversation[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Carregar conversas
  useEffect(() => {
    loadConversas();
  }, [tenantId, statusFilter]);

  // Auto-refresh para tempo real
  useEffect(() => {
    if (selectedConversation) {
      loadMensagens(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Carregar fila quando mostrar
  useEffect(() => {
    if (showQueue) {
      loadQueue();
    }
  }, [showQueue, queueFilter]);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const loadConversas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('conversationStatus', statusFilter);

      const data = await apiFetch<{ conversations?: Conversation[] }>(`/api/conversations?${params.toString()}`, {
        preserveApiPrefix: true,
      });
      setConversas(data.conversations || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
      setConversas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMensagens = async (conversationId: number) => {
    try {
      setLoadingMensagens(true);
      const data = await apiFetch<{ mensagens?: Mensagem[] }>(`/api/conversations/${conversationId}/mensagens`, {
        preserveApiPrefix: true,
      });
      setMensagens(data.mensagens || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setMensagens([]);
    } finally {
      setLoadingMensagens(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadMensagens(conv.id);
  };

  const handleSendMessage = async () => {
    if (!novaMensagem.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      await apiFetch(`/api/conversations/${selectedConversation.id}/resposta`, {
        preserveApiPrefix: true,
        method: "POST",
        body: JSON.stringify({ mensagem: novaMensagem }),
      });
      await loadMensagens(selectedConversation.id);
      setNovaMensagem("");
      loadConversas(); // Atualiza lista
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (conversationStatus: ConversationStatus) => {
    if (!selectedConversation) return;

    try {
      await apiFetch(`/api/conversations/${selectedConversation.id}`, {
        preserveApiPrefix: true,
        method: "PUT",
        body: JSON.stringify({ conversationStatus }),
      });
      setSelectedConversation({ ...selectedConversation, conversationStatus });
      loadConversas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  // Carregar fila de atendimento
  const loadQueue = async () => {
    try {
      setLoadingQueue(true);
      const data = await apiFetch<{ queue?: Conversation[] }>(`/api/conversations/queue?sort=${queueFilter}`, {
        preserveApiPrefix: true,
      });
      setQueueConversas(data.queue || []);
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
      setQueueConversas([]);
    } finally {
      setLoadingQueue(false);
    }
  };

  // Assumir conversa
  const handleAssumeConversation = async (conv: Conversation) => {
    try {
      await apiFetch(`/api/conversations/${conv.id}/assume`, {
        preserveApiPrefix: true,
        method: "POST",
      });
      // Atualizar a conversa na lista
      const updatedConv = { ...conv, assignedTo: 'current_user', conversationStatus: 'human' as const };
      setSelectedConversation(updatedConv);
      loadQueue();
      loadConversas();
    } catch (error) {
      console.error("Erro ao assumir conversa:", error);
    }
  };

  // Atualizar prioridade
  const handleUpdatePriority = async (conv: Conversation, priority: number) => {
    try {
      await apiFetch(`/api/conversations/${conv.id}`, {
        preserveApiPrefix: true,
        method: "PUT",
        body: JSON.stringify({ priority }),
      });
      loadQueue();
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
    }
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    setMensagens([]);
  };

  // Filtrar conversas
  const filteredConversas = conversas.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.cliente?.celular?.includes(searchTerm);
    return matchesSearch;
  });

  // Formatar hora
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  // Status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'open':
        return <span className="whatsapp-status-badge whatsapp-status-open">Aberta</span>;
      case 'waiting':
        return <span className="whatsapp-status-badge whatsapp-status-waiting">Aguardando</span>;
      case 'bot':
        return <span className="whatsapp-status-badge whatsapp-status-bot">Robô</span>;
      case 'human':
        return <span className="whatsapp-status-badge whatsapp-status-human">Humano</span>;
      case 'closed':
        return <span className="whatsapp-status-badge whatsapp-status-closed">Fechada</span>;
      default:
        return <span className="whatsapp-status-badge whatsapp-status-closed">{status}</span>;
    }
  };

  return (
    <div className="whatsapp-workspace min-h-screen">
      <PageHeader 
        title="WhatsApp" 
      />

      <div className="whatsapp-page-content p-6">
        {/* Botão de fila de atendimento */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="whatsapp-control w-full pl-10 pr-4 py-2"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="whatsapp-control px-4 py-2"
            >
              <option value="">Todos os status</option>
              <option value="open">Aberta</option>
              <option value="waiting">Aguardando</option>
              <option value="bot">Robô</option>
              <option value="human">Humano</option>
              <option value="closed">Fechada</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`whatsapp-queue-toggle flex items-center gap-2 px-4 py-2 ${showQueue ? 'whatsapp-queue-toggle-active' : ''}`}
          >
            <Users className="w-4 h-4" />
            <span>Fila de Atendimento</span>
            {queueConversas.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {queueConversas.length}
              </span>
            )}
          </button>
        </div>

        {/* Fila de Atendimento */}
        {showQueue && (
          <div className="whatsapp-queue-panel mb-6 overflow-hidden">
            <div className="whatsapp-queue-header p-4 flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Fila de Atendimento
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setQueueFilter("waiting")}
                  className={`px-3 py-1 rounded text-sm ${
                    queueFilter === "waiting" ? "bg-[#128c7e] text-white" : "whatsapp-chip"
                  }`}
                >
                  Aguardando
                </button>
                <button
                  onClick={() => setQueueFilter("priority")}
                  className={`px-3 py-1 rounded text-sm ${
                    queueFilter === "priority" ? "bg-[#128c7e] text-white" : "whatsapp-chip"
                  }`}
                >
                  Prioridade
                </button>
                <button
                  onClick={() => loadQueue()}
                  className="whatsapp-chip px-3 py-1 rounded text-sm"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {loadingQueue ? (
              <div className="p-8 text-center text-slate-500">Carregando fila...</div>
            ) : queueConversas.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhuma conversa na fila</div>
            ) : (
              <div className="divide-y divide-[var(--border-muted)]">
                {queueConversas.map((conv) => (
                  <div
                    key={conv.id}
                    className="whatsapp-conversation-item p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      handleSelectConversation(conv);
                      setShowQueue(false);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#25d366]/15 flex items-center justify-center">
                        <span className="text-[#128c7e] font-medium">
                          {conv.cliente?.nome?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{conv.cliente?.nome || 'Cliente'}</p>
                        <p className="text-sm text-slate-500">{conv.cliente?.celular || conv.providerPhone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          {conv.waitingTimeFormatted || 'agora'}
                        </p>
                        {conv.unreadCount && conv.unreadCount > 0 && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {conv.unreadCount} nova{conv.unreadCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {!conv.assignedTo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssumeConversation(conv);
                          }}
                          className="whatsapp-primary-action px-3 py-1.5 text-sm"
                        >
                          Assumir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-6">
          {/* Lista de Conversas */}
          <div className={`${selectedConversation ? 'w-1/3' : 'w-full'} transition-all`}>
            {loading ? (
              <LoadingState />
            ) : filteredConversas.length === 0 ? (
              <EmptyState 
                title="Nenhuma conversa encontrada"
                description="Conversas com clientes aparecerão aqui"
              />
            ) : (
              <div className="whatsapp-list-card overflow-hidden">
                {filteredConversas.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`whatsapp-conversation-item p-4 border-b cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id ? 'whatsapp-conversation-active' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[var(--text-primary)] truncate">
                            {conv.cliente?.nome || 'Cliente'}
                          </h3>
                          {conv.direction === 'inbound' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ↙ Recebida
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate mt-1">
                          {conv.ultimaMensagem?.content || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-400">
                            {conv.cliente?.celular}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">
                            {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(conv.conversationStatus)}
                        <MessageCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    {conv.campanha && (
                      <div className="mt-2">
                        <span className="text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-muted)] px-2 py-0.5 rounded">
                          {conv.campanha.nome}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Área de Chat */}
          {selectedConversation && (
            <div className="whatsapp-chat-shell flex-1 flex flex-col h-[calc(100vh-220px)]">
              {/* Header do Chat */}
              <div className="whatsapp-chat-header p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseChat}
                    className="p-2 hover:bg-[#25d366]/10 rounded-lg lg:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full border border-[#128c7e]/20 bg-[#25d366]/10 flex items-center justify-center">
                    <span className="text-[#128c7e] font-semibold">
                      {selectedConversation.cliente?.nome?.[0]?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {selectedConversation.cliente?.nome || 'Cliente'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedConversation.cliente?.celular}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Indicador de não lidas */}
                  {selectedConversation.unreadCount && selectedConversation.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {selectedConversation.unreadCount} nova{selectedConversation.unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {/* Indicador de atribuição */}
                  {selectedConversation.assignedTo ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Atribuída
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAssumeConversation(selectedConversation)}
                      className="whatsapp-primary-action text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      Assumir
                    </button>
                  )}
                  
                  {/* Status selector */}
                  <select
                    value={selectedConversation.conversationStatus || 'open'}
                    onChange={(e) => {
                      const nextStatus = parseConversationStatus(e.target.value);
                      if (nextStatus) handleUpdateStatus(nextStatus);
                    }}
                    className="whatsapp-control text-sm px-3 py-1.5"
                  >
                    <option value="open">Aberta</option>
                    <option value="waiting">Aguardando</option>
                    <option value="bot">Robô</option>
                    <option value="human">Humano</option>
                    <option value="closed">Fechada</option>
                  </select>
                  {selectedConversation.campanha && (
                    <span className="text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-muted)] px-2 py-1 rounded">
                      {selectedConversation.campanha.nome}
                    </span>
                  )}
                  
                  {/* SDR Panel Toggle - só mostra se tiver permissão */}
                  {hasSdrIaPermission() && (
                    <button
                      onClick={() => setShowSdrPanel(!showSdrPanel)}
                      className={`p-2 rounded-lg transition-colors ${
                        showSdrPanel 
                          ? 'bg-[#128c7e] text-white' 
                          : 'whatsapp-chip'
                      }`}
                      title={showSdrPanel ? "Ocultar SDR IA" : "Mostrar SDR IA"}
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* SDR Panel - só mostra se tiver permissão */}
              {hasSdrIaPermission() && showSdrPanel && selectedConversation && (
                <div className="border-b border-[var(--border-muted)]">
                  <SdrPanel
                    conversationId={selectedConversation.id}
                    leadId={selectedConversation.clienteId}
                    leadNome={selectedConversation.cliente?.nome}
                    leadCelular={selectedConversation.cliente?.celular}
                    campaignName={selectedConversation.campanha?.nome}
                    lastMessage={mensagens[mensagens.length - 1]?.content}
                    messages={mensagens.map(m => ({
                      direction: m.direction,
                      content: m.content,
                      createdAt: m.createdAt
                    }))}
                    onEscalate={() => handleUpdateStatus('human')}
                    onUseResponse={(responseText) => setNovaMensagem(responseText)}
                  />
                </div>
              )}

              {/* Mensagens */}
              <div className="whatsapp-messages flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMensagens ? (
                  <LoadingState />
                ) : mensagens.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>Nenhuma mensagem nesta conversa</p>
                  </div>
                ) : (
                  mensagens.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.direction === 'outbound'
                            ? 'whatsapp-bubble-out rounded-br-md'
                            : 'whatsapp-bubble-in rounded-bl-md'
                        }`}
                      >
                        {/* Indicador de direção */}
                        <div className={`text-xs mb-1 ${
                          msg.direction === 'outbound' ? 'text-emerald-100' : 'text-[#128c7e]'
                        }`}>
                          {msg.direction === 'outbound' ? 'Você' : 'Cliente'}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.direction === 'outbound' ? 'text-emerald-100' : 'text-slate-500'
                        }`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {msg.direction === 'outbound' && (
                            <span>
                              {msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : '○'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="whatsapp-composer p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="whatsapp-control flex-1 px-4 py-2"
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!novaMensagem.trim() || sendingMessage}
                    className="whatsapp-primary-action px-4"
                  >
                    {sendingMessage ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
