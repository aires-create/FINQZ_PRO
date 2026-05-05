// FINQZ PRO - Eventos Page
// Página de visualização de eventos do sistema para administração e debugging

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  RefreshCw,
  AlertTriangle,
  Clock,
  Activity,
  X,
} from "lucide-react";
import api from "../api/client";
import { Button, Card as DSCard, Select, Badge, Input } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";

// ============================================
// TYPES - Todos opcionais para resiliência
// ============================================

interface Event {
  id?: number | string;
  tipo?: string;
  dados?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  tenantId?: string;
  usuarioId?: string | null;
  source?: string | null;
  resource?: string | null;
  resourceId?: number | string | null;
  campanhaId?: number | string | null;
  conversaId?: number | string | null;
  oportunidadeId?: number | string | null;
  clienteId?: number | string | null;
  messageId?: number | string | null;
  createdAt?: number | string | null;
}

interface EventStats {
  total?: number;
  byType?: Record<string, number>;
  bySource?: Record<string, number>;
}

interface EventsResponse {
  events?: Event[];
  total?: number;
  page?: number;
  limit?: number;
}

// ============================================
// CONSTANTS
// ============================================

const EVENT_TYPES = [
  { value: "", label: "Todos os tipos" },
  { value: "cliente_created", label: "Cliente criado" },
  { value: "cliente_updated", label: "Cliente atualizado" },
  { value: "cliente_deleted", label: "Cliente excluído" },
  { value: "opportunity_created", label: "Oportunidade criada" },
  { value: "opportunity_updated", label: "Oportunidade atualizada" },
  { value: "opportunity_moved", label: "Oportunidade movida" },
  { value: "opportunity_deleted", label: "Oportunidade excluída" },
  { value: "campaign_created", label: "Campanha criada" },
  { value: "campaign_updated", label: "Campanha atualizada" },
  { value: "campaign_started", label: "Campanha iniciada" },
  { value: "campaign_finished", label: "Campanha finalizada" },
  { value: "campaign_failed", label: "Campanha falhou" },
  { value: "campaign_deleted", label: "Campanha excluída" },
  { value: "message_sent", label: "Mensagem enviada" },
  { value: "message_failed", label: "Mensagem falhou" },
  { value: "message_delivered", label: "Mensagem entregue" },
  { value: "message_received", label: "Mensagem recebida" },
  { value: "user_login", label: "Login" },
  { value: "user_logout", label: "Logout" },
  { value: "role_changed", label: "Role alterada" },
  { value: "permission_changed", label: "Permissão alterada" },
  { value: "delete_performed", label: "Exclusão realizada" },
  { value: "export_completed", label: "Exportação concluída" },
];

const EVENT_SOURCES = [
  { value: "", label: "Todas as fontes" },
  { value: "api", label: "API" },
  { value: "webhook", label: "Webhook" },
  { value: "system", label: "Sistema" },
  { value: "automation", label: "Automação" },
  { value: "import", label: "Importação" },
];

const PERIODOS_OPTIONS = [
  { value: "", label: "Todo o período" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Última semana" },
  { value: "mes", label: "Último mês" },
];

// ============================================
// HELPER FUNCTIONS - Todos com fallbacks seguros
// ============================================

const getEventTypeLabel = (tipo: unknown): string => {
  if (!tipo) return "-";
  const tipoStr = String(tipo);
  const found = EVENT_TYPES.find(e => e.value === tipoStr);
  return found?.label || tipoStr;
};

const getEventTypeColor = (tipo: unknown): string => {
  if (!tipo) return "bg-gray-100 text-gray-200";
  const tipoStr = String(tipo);
  if (tipoStr.includes("created") || tipoStr.includes("started") || tipoStr.includes("finished")) {
    return "bg-green-100 text-green-800";
  }
  if (tipoStr.includes("updated") || tipoStr.includes("changed") || tipoStr.includes("moved")) {
    return "bg-blue-100 text-blue-800";
  }
  if (tipoStr.includes("deleted") || tipoStr.includes("failed")) {
    return "bg-red-100 text-red-800";
  }
  if (tipoStr.includes("login") || tipoStr.includes("logout")) {
    return "bg-purple-100 text-purple-800";
  }
  return "bg-gray-100 text-gray-200";
};

// Safe JSON stringify
const safeJson = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "-";
  }
};

// Safe date format - aceita number, string, Date, null
const formatDate = (timestamp: unknown): string => {
  if (timestamp === null || timestamp === undefined) return "-";
  try {
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Eventos() {
  // State com valores iniciais seguros
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [periodoFilter, setPeriodoFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Get date range from periodo
  const getDateRange = useCallback((): { startDate?: number; endDate?: number } => {
    const now = Date.now();
    switch (periodoFilter) {
      case "hoje":
        return { startDate: new Date(now).setHours(0, 0, 0, 0), endDate: now };
      case "semana":
        return { startDate: now - 7 * 24 * 60 * 60 * 1000, endDate: now };
      case "mes":
        return { startDate: now - 30 * 24 * 60 * 60 * 1000, endDate: now };
      default:
        return {};
    }
  }, [periodoFilter]);

  // Fetch events - 100% seguro
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateRange = getDateRange();
      
      // Verificar se o método existe
      if (typeof (api as Record<string, unknown>).getEventos !== "function") {
        console.warn("[EVENTOS] API getEventos não disponível, usando mock");
        setEvents([]);
        setTotal(0);
        return;
      }

      const response = await (api as Record<string, unknown>).getEventos({
        page,
        limit,
        type: tipoFilter || undefined,
        source: sourceFilter || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }) as unknown as EventsResponse | undefined;
      
      // Normalizar resposta
      setEvents(Array.isArray(response?.events) ? response.events : []);
      setTotal(typeof response?.total === "number" ? response.total : 0);
    } catch (err) {
      console.error("[EVENTOS] Erro ao carregar eventos:", err);
      setEvents([]);
      setTotal(0);
      setError("Erro ao carregar eventos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, tipoFilter, sourceFilter, periodoFilter, getDateRange]);

  // Fetch stats - 100% seguro
  const fetchStats = useCallback(async () => {
    try {
      const dateRange = getDateRange();
      
      // Verificar se o método existe
      if (typeof (api as Record<string, unknown>).getEventosStats !== "function") {
        console.warn("[EVENTOS] API getEventosStats não disponível, usando mock");
        setStats({ total: 0, byType: {}, bySource: {} });
        return;
      }

      const response = await (api as Record<string, unknown>).getEventosStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }) as unknown as EventStats | undefined;
      
      // Normalizar resposta
      setStats({
        total: typeof response?.total === "number" ? response.total : 0,
        byType: response?.byType || {},
        bySource: response?.bySource || {},
      });
    } catch (err) {
      console.error("[EVENTOS] Erro ao carregar estatísticas:", err);
      setStats({ total: 0, byType: {}, bySource: {} });
    }
  }, [getDateRange]);

  // Initial load
  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [fetchEvents, fetchStats]);

  // Filter events by search term - seguro
  const filteredEvents = useMemo(() => {
    const eventsArr = Array.isArray(events) ? events : [];
    if (!searchTerm) return eventsArr;
    const term = String(searchTerm).toLowerCase();
    
    return eventsArr.filter(e => 
      String(e.tipo || "").toLowerCase().includes(term) ||
      String(e.resource || "").toLowerCase().includes(term) ||
      String(e.usuarioId || "").toLowerCase().includes(term)
    );
  }, [events, searchTerm]);

  const totalPages = Math.ceil(total / limit);

  // Handlers
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  // Safe render helpers
  const renderStatsTotal = () => {
    try {
      return stats?.total ?? 0;
    } catch {
      return 0;
    }
  };

  const renderByTypeCount = () => {
    try {
      return Object.keys(stats?.byType ?? {}).length;
    } catch {
      return 0;
    }
  };

  const renderBySourceApi = () => {
    try {
      return stats?.bySource?.api ?? 0;
    } catch {
      return 0;
    }
  };

  const renderBySourceSystem = () => {
    try {
      return stats?.bySource?.system ?? 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#00010b]">
      <PageHeader
        title="Eventos"
        subtitle="Visualize todos os eventos do sistema para auditoria e debugging"
        icon={<Activity className="w-5 h-5" />}
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DSCard className="p-4">
            <div className="text-sm text-gray-500">Total de Eventos</div>
            <div className="text-2xl font-bold text-white">{renderStatsTotal()}</div>
          </DSCard>
          <DSCard className="p-4">
            <div className="text-sm text-gray-500">Tipos de Eventos</div>
            <div className="text-2xl font-bold text-white">{renderByTypeCount()}</div>
          </DSCard>
          <DSCard className="p-4">
            <div className="text-sm text-gray-500">Eventos via API</div>
            <div className="text-2xl font-bold text-white">{renderBySourceApi()}</div>
          </DSCard>
          <DSCard className="p-4">
            <div className="text-sm text-gray-500">Eventos do Sistema</div>
            <div className="text-2xl font-bold text-white">{renderBySourceSystem()}</div>
          </DSCard>
        </div>

        {/* Filters */}
        <DSCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
              <Select
                options={EVENT_TYPES}
                value={tipoFilter}
                onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fonte</label>
              <Select
                options={EVENT_SOURCES}
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Período</label>
              <Select
                options={PERIODOS_OPTIONS}
                value={periodoFilter}
                onChange={(e) => { setPeriodoFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Buscar</label>
              <Input
                type="text"
                placeholder="Buscar por tipo, recurso ou usuário"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => { fetchEvents(); fetchStats(); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <div className="text-sm text-gray-500">
              Mostrando {filteredEvents.length} de {total} eventos
            </div>
          </div>
        </DSCard>

        {/* Events Table */}
        <DSCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-[#1f2937]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fonte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando eventos...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="text-red-500 mb-2">
                        <AlertTriangle className="w-6 h-6 mx-auto" />
                      </div>
                      <p className="text-gray-500">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => { setError(null); fetchEvents(); }}
                      >
                        Tentar novamente
                      </Button>
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhum evento encontrado
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event, index) => (
                    <tr key={event?.id ?? index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDate(event?.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={getEventTypeColor(event?.tipo)}>
                          {getEventTypeLabel(event?.tipo)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {event?.source ?? "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        {event?.resource ? (
                          <span>
                            {event.resource}
                            {event.resourceId && <span className="text-gray-400"> #{String(event.resourceId)}</span>}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {event?.usuarioId ? (
                          <span>{String(event.usuarioId).substring(0, 8)}...</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && filteredEvents.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1f2937]">
              <div className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </DSCard>
      </div>

      {/* Simple Modal - inline para evitar problemas de contrato */}
      {showModal && selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-[#111827] rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937]">
              <h2 className="text-lg font-semibold text-white">Detalhes do Evento</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data/Hora</label>
                  <p className="text-white">{formatDate(selectedEvent.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <p className="text-white">{getEventTypeLabel(selectedEvent.tipo)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fonte</label>
                  <p className="text-white">{selectedEvent.source ?? "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recurso</label>
                  <p className="text-white">
                    {selectedEvent.resource ?? "-"}
                    {selectedEvent.resourceId && ` (#${selectedEvent.resourceId})`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Usuário</label>
                  <p className="text-white">{selectedEvent.usuarioId ?? "Sistema"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dados</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                    {safeJson(selectedEvent.dados)}
                  </pre>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Metadata</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                    {safeJson(selectedEvent.metadata)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-[#1f2937]">
              <Button variant="outline" onClick={handleCloseModal}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
