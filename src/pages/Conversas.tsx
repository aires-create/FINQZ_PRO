// FINQZ PRO - Conversas Page
import React, { useEffect, useState, useRef } from "react";
import { Search, Send, X, Phone, MessageCircle, Bot, User, CheckCircle, Clock, ArrowLeft, MoreVertical, Users, AlertCircle, Filter } from "lucide-react";
import api from "../api/client";
import useAppStore from "../store";
import { Button, Input, Badge, StatusBadge, EmptyState, LoadingState, Modal, TextArea } from "../components/ui";
import { SdrPanel } from "../components/ui/SdrPanel";
import { PageHeader } from "../components/layout/PageHeader";
import { USE_MOCKS } from "../config/environment";
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

// Seed para modo mock
const initialConversasSeed: Conversation[] = [
  { id: 1, clienteId: 1, status: 'active', conversationStatus: 'open', direction: 'outbound', provider: 'whatsapp', providerPhone: '11999999999', lastMessageAt: Date.now() - 3600000, createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 3600000, cliente: { id: 1, nome: 'João Silva', celular: '11999999999' }, ultimaMensagem: { id: 1, contatoId: 1, recipient: '11999999999', provider: 'whatsapp', content: 'Olá João! Gostaria de conhecer nosso plano Premium?', status: 'delivered', direction: 'outbound', createdAt: Date.now() - 86400000, updatedAt: Date.now() } },
  { id: 2, clienteId: 2, status: 'active', conversationStatus: 'waiting', direction: 'inbound', provider: 'whatsapp', providerPhone: '11988888888', lastMessageAt: Date.now() - 1800000, createdAt: Date.now() - 86400000, updatedAt: Date.now() - 1800000, cliente: { id: 2, nome: 'Maria Santos', celular: '11988888888' }, ultimaMensagem: { id: 2, contatoId: 2, recipient: '11988888888', provider: 'whatsapp', content: 'Tenho interesse! Qual o valor?', status: 'delivered', direction: 'inbound', createdAt: Date.now() - 1800000, updatedAt: Date.now() } },
  { id: 3, clienteId: 3, status: 'active', conversationStatus: 'human', direction: 'inbound', provider: 'whatsapp', providerPhone: '11977777777', lastMessageAt: Date.now() - 7200000, createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 7200000, cliente: { id: 3, nome: 'Pedro Costa', celular: '11977777777' }, ultimaMensagem: { id: 3, contatoId: 3, recipient: '11977777777', provider: 'whatsapp', content: 'Quero falar com um atendente', status: 'delivered', direction: 'inbound', createdAt: Date.now() - 7200000, updatedAt: Date.now() } },
  { id: 4, clienteId: 4, status: 'closed', conversationStatus: 'closed', direction: 'outbound', provider: 'whatsapp', providerPhone: '11966666666', lastMessageAt: Date.now() - 86400000, createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000, cliente: { id: 4, nome: 'Ana Oliveira', celular: '11966666666' }, ultimaMensagem: { id: 4, contatoId: 4, recipient: '11966666666', provider: 'whatsapp', content: 'Obrigado pela preferência!', status: 'delivered', direction: 'outbound', createdAt: Date.now() - 86400000, updatedAt: Date.now() } },
];

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
      if (USE_MOCKS) {
        setConversas(initialConversasSeed);
      } else {
        const params = new URLSearchParams();
        if (statusFilter) params.append('conversationStatus', statusFilter);
        
        const response = await api.get(`/api/conversations?${params.toString()}`);
        setConversas(response.data.conversations || []);
      }
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
      setConversas(initialConversasSeed);
    } finally {
      setLoading(false);
    }
  };

  const loadMensagens = async (conversationId: number) => {
    try {
      setLoadingMensagens(true);
      if (USE_MOCKS) {
        // Simular mensagens
        const msgs: Mensagem[] = [
          { id: 1, contatoId: selectedConversation?.clienteId || 1, recipient: '11999999999', provider: 'whatsapp', content: 'Olá! Gostaria de conhecer seu produto.', status: 'delivered', direction: 'inbound', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000 },
          { id: 2, contatoId: selectedConversation?.clienteId || 1, recipient: '11999999999', provider: 'whatsapp', content: 'Olá João! Claro, vou te enviar mais informações.', status: 'delivered', direction: 'outbound', createdAt: Date.now() - 86000000, updatedAt: Date.now() - 86000000 },
          { id: 3, contatoId: selectedConversation?.clienteId || 1, recipient: '11999999999', provider: 'whatsapp', content: selectedConversation?.ultimaMensagem?.content || 'Obrigado!', status: 'delivered', direction: selectedConversation?.direction as 'inbound' | 'outbound' || 'outbound', createdAt: Date.now() - 3600000, updatedAt: Date.now() - 3600000 },
        ];
        setMensagens(msgs);
      } else {
        const response = await api.get(`/api/conversations/${conversationId}/mensagens`);
        setMensagens(response.data.mensagens || []);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
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
      if (USE_MOCKS) {
        const newMsg: Mensagem = {
          id: Date.now(),
          contatoId: selectedConversation.clienteId,
          recipient: selectedConversation.cliente?.celular || '',
          provider: 'whatsapp',
          content: novaMensagem,
          status: 'sent',
          direction: 'outbound',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setMensagens([...mensagens, newMsg]);
      } else {
        await api.post(`/api/conversations/${selectedConversation.id}/resposta`, {
          mensagem: novaMensagem,
        });
        await loadMensagens(selectedConversation.id);
      }
      setNovaMensagem("");
      loadConversas(); // Atualiza lista
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (conversationStatus: string) => {
    if (!selectedConversation) return;

    try {
      if (!USE_MOCKS) {
        await api.put(`/api/conversations/${selectedConversation.id}`, {
          conversationStatus,
        });
      }
      setSelectedConversation({ ...selectedConversation, conversationStatus: conversationStatus as any });
      loadConversas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  // Carregar fila de atendimento
  const loadQueue = async () => {
    try {
      setLoadingQueue(true);
      if (USE_MOCKS) {
        // Simular fila de atendimento
        setQueueConversas(initialConversasSeed.filter(c => 
          c.conversationStatus !== 'closed'
        ).map(c => ({
          ...c,
          waitingTime: Date.now() - (c.lastMessageAt || Date.now()),
          waitingTimeFormatted: '5m',
          unreadCount: c.conversationStatus === 'inbound' ? 1 : 0,
        })));
      } else {
        const response = await api.get(`/api/conversations/queue?sort=${queueFilter}`);
        setQueueConversas(response.data.queue || []);
      }
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
    } finally {
      setLoadingQueue(false);
    }
  };

  // Assumir conversa
  const handleAssumeConversation = async (conv: Conversation) => {
    try {
      if (!USE_MOCKS) {
        await api.post(`/api/conversations/${conv.id}/assume`);
      }
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
      if (!USE_MOCKS) {
        await api.put(`/api/conversations/${conv.id}`, { priority });
      }
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
        return <Badge variant="success">Aberta</Badge>;
      case 'waiting':
        return <Badge variant="warning">Aguardando</Badge>;
      case 'bot':
        return <Badge variant="info">Bot</Badge>;
      case 'human':
        return <Badge variant="primary">Humano</Badge>;
      case 'closed':
        return <Badge variant="default">Fechada</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Conversas" 
        subtitle="Gerencie conversas com clientes"
      />

      <div className="p-6">
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
                className="w-full pl-10 pr-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
            >
              <option value="">Todos os status</option>
              <option value="open">Aberta</option>
              <option value="waiting">Aguardando</option>
              <option value="bot">Bot</option>
              <option value="human">Humano</option>
              <option value="closed">Fechada</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showQueue 
                ? 'bg-[#000dff] text-white' 
                : 'bg-[#111827] border border-[#1f2937] text-slate-300 hover:bg-gray-50'
            }`}
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
          <div className="mb-6 bg-[#111827] rounded-xl border border-[#1f2937] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Fila de Atendimento
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setQueueFilter("waiting")}
                  className={`px-3 py-1 rounded text-sm ${
                    queueFilter === "waiting" ? "bg-[#000dff] text-white" : "bg-gray-100 text-slate-600"
                  }`}
                >
                  Aguardando
                </button>
                <button
                  onClick={() => setQueueFilter("priority")}
                  className={`px-3 py-1 rounded text-sm ${
                    queueFilter === "priority" ? "bg-[#000dff] text-white" : "bg-gray-100 text-slate-600"
                  }`}
                >
                  Prioridade
                </button>
                <button
                  onClick={() => loadQueue()}
                  className="px-3 py-1 rounded text-sm bg-gray-100 text-slate-600 hover:bg-gray-200"
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
              <div className="divide-y divide-gray-100">
                {queueConversas.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      handleSelectConversation(conv);
                      setShowQueue(false);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#000dff]/10 flex items-center justify-center">
                        <span className="text-[#000dff] font-medium">
                          {conv.cliente?.nome?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{conv.cliente?.nome || 'Cliente'}</p>
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
                          className="px-3 py-1.5 bg-[#000dff] text-white text-sm rounded-lg hover:bg-[#000dff]/90"
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
              <div className="bg-[#111827] rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredConversas.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-[#000dff]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">
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
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          📢 {conv.campanha.nome}
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
            <div className="flex-1 bg-[#111827] rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-220px)]">
              {/* Header do Chat */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseChat}
                    className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedConversation.cliente?.nome?.[0]?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
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
                      className="text-xs bg-[#000dff] text-white px-3 py-1.5 rounded-lg hover:bg-[#000dff]/90 flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      Assumir
                    </button>
                  )}
                  
                  {/* Status selector */}
                  <select
                    value={selectedConversation.conversationStatus || 'open'}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="text-sm border border-[#1f2937] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                  >
                    <option value="open">🟢 Aberta</option>
                    <option value="waiting">🟡 Aguardando</option>
                    <option value="bot">🤖 Bot</option>
                    <option value="human">👤 Humano</option>
                    <option value="closed">⚪ Fechada</option>
                  </select>
                  {selectedConversation.campanha && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      📢 {selectedConversation.campanha.nome}
                    </span>
                  )}
                  
                  {/* SDR Panel Toggle - só mostra se tiver permissão */}
                  {hasSdrIaPermission() && (
                    <button
                      onClick={() => setShowSdrPanel(!showSdrPanel)}
                      className={`p-2 rounded-lg transition-colors ${
                        showSdrPanel 
                          ? 'bg-[#000dff] text-white' 
                          : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
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
                <div className="border-b border-gray-100">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            ? 'bg-[#000dff] text-white rounded-br-md'
                            : 'bg-gray-100 text-white rounded-bl-md'
                        }`}
                      >
                        {/* Indicador de direção */}
                        <div className={`text-xs mb-1 ${
                          msg.direction === 'outbound' ? 'text-blue-200' : 'text-green-600'
                        }`}>
                          {msg.direction === 'outbound' ? '📤 Você' : '📥 Cliente'}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.direction === 'outbound' ? 'text-blue-200' : 'text-slate-400'
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
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!novaMensagem.trim() || sendingMessage}
                    className="px-4"
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
