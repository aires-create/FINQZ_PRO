// FINQZ PRO - Auditoria Page
// Página de visualização de logs de auditoria e alertas de segurança

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Trash2,
  Download,
  LogIn,
  LogOut,
  Edit,
  Plus,
  X,
  Clock,
  User,
  FileText,
  RefreshCw,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import useAppStore from "../store";
import { Button, Card as DSCard, Select, Badge, Input, Modal } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { auditoriaApi, type AuditLog, type AuditLogUsuario, type AuditLogsResponse, type AuditFilters } from "../api/modules/auditoria.api";
import { alertasApi, type Alert } from "../api/modules/alertas.api";

// ============================================
// CONSTANTS
// ============================================

const ACOES_OPTIONS = [
  { value: "", label: "Todas as ações" },
  { value: "CREATE", label: "Criar" },
  { value: "UPDATE", label: "Editar" },
  { value: "DELETE", label: "Excluir" },
  { value: "EXPORT", label: "Exportar" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "LOGIN_FAILED", label: "Login falhou" },
  { value: "RESET_SENHA", label: "Resetar senha" },
];

const MODULOS_OPTIONS = [
  { value: "", label: "Todos os módulos" },
  { value: "clientes", label: "Clientes" },
  { value: "produtos", label: "Produtos" },
  { value: "parceiros", label: "Parceiros" },
  { value: "oportunidades", label: "Oportunidades" },
  { value: "documentos", label: "Documentos" },
  { value: "comissoes", label: "Comissões" },
  { value: "usuarios_perfis", label: "Perfis de usuário" },
  { value: "automacoes", label: "Automações" },
  { value: "relatorios", label: "Relatórios" },
  { value: "auth", label: "Autenticação" },
];

const PERIODOS_OPTIONS = [
  { value: "", label: "Todo o período" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Última semana" },
  { value: "mes", label: "Último mês" },
  { value: "ano", label: "Último ano" },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getAcaoLabel = (acao: string): string => {
  const labels: Record<string, string> = {
    CREATE: "Criar",
    UPDATE: "Editar",
    DELETE: "Excluir",
    EXPORT: "Exportar",
    LOGIN: "Login",
    LOGOUT: "Logout",
    LOGIN_FAILED: "Login falhou",
    RESET_SENHA: "Resetar senha",
    MOVE: "Mover",
  };
  return labels[acao] || acao;
};

const getAcaoIcon = (acao: string): React.ReactNode => {
  switch (acao) {
    case "DELETE":
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case "EXPORT":
      return <Download className="w-4 h-4 text-orange-500" />;
    case "LOGIN":
    case "LOGOUT":
      return <LogIn className="w-4 h-4 text-blue-500" />;
    case "CREATE":
      return <Plus className="w-4 h-4 text-green-500" />;
    case "UPDATE":
      return <Edit className="w-4 h-4 text-yellow-500" />;
    default:
      return <FileText className="w-4 h-4 text-slate-500" />;
  }
};

const isAcaoCritica = (acao: string): boolean => {
  return ["DELETE", "EXPORT", "LOGIN", "LOGOUT", "LOGIN_FAILED", "RESET_SENHA"].includes(acao);
};

const formatDate = (timestamp: number | null): string => {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getModuloLabel = (modulo: string): string => {
  const labels: Record<string, string> = {
    clientes: "Clientes",
    produtos: "Produtos",
    parceiros: "Parceiros",
    oportunidades: "Oportunidades",
    documentos: "Documentos",
    comissoes: "Comissões",
    usuarios_perfis: "Perfis de Usuário",
    automacoes: "Automações",
    relatorios: "Relatórios",
    auth: "Autenticação",
  };
  return labels[modulo] || modulo;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Auditoria() {
  const { user } = useAppStore();

  // State
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usuarios, setUsuarios] = useState<AuditLogUsuario[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: 20,
    periodo: "",
    usuario: "",
    acao: "",
    modulo: "",
  });

  // Modal de detalhe
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Verifica se o usuário tem acesso
  const hasAccess = user?.role === "ADMIN_SISTEMA" || user?.role === "ADMIN_FRANQUIA" || user?.role === "ROLE_ADMIN_SISTEMA";

  // Carrega dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsResult, usuariosResult] = await Promise.all([
        auditoriaApi.getLogs(filters),
        auditoriaApi.getUsuarios(),
      ]);

      if (logsResult.success && logsResult.data) {
        setLogs(logsResult.data.logs);
        setPagination(logsResult.data.pagination);
      }

      if (usuariosResult.success && usuariosResult.data) {
        setUsuarios(usuariosResult.data.usuarios);
      }
    } catch (error) {
      console.error("[Auditoria] Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (hasAccess) {
      loadData();
      loadAlerts();
    }
  }, [hasAccess, loadData]);

  // State de alertas
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(true);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const result = await alertasApi.getAlertas({ unresolved: showUnresolvedOnly });
      if (result.success && result.data) {
        setAlerts(result.data.alertas);
      }
    } catch (error) {
      console.error("[Auditoria] Erro ao carregar alertas:", error);
    } finally {
      setAlertsLoading(false);
    }
  }, [showUnresolvedOnly]);

  useEffect(() => {
    if (hasAccess) {
      loadAlerts();
    }
  }, [hasAccess, loadAlerts]);

  const handleResolveAlert = async (alertId: number) => {
    const result = await alertasApi.resolveAlert(alertId);
    if (result.success) {
      loadAlerts();
    }
  };

  // Handlers
  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Se não tem acesso
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Auditoria"
          subtitle="Logs de ações do sistema"
        />
        <div className="p-6">
          <DSCard className="p-12 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Acesso Negado
            </h2>
            <p className="text-slate-600">
              Você não tem permissão para acessar os logs de auditoria.
              <br />
              Apenas administradores podem visualizar estas informações.
            </p>
          </DSCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Auditoria"
        subtitle="Logs de ações e alterações no sistema"
      />

      {/* Filtros */}
      <div className="p-6">
        <DSCard className="p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Período
              </label>
              <Select
                value={filters.periodo || ""}
                onChange={(e) => handleFilterChange("periodo", e.target.value)}
                options={PERIODOS_OPTIONS}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Usuário
              </label>
              <Select
                value={filters.usuario || ""}
                onChange={(e) => handleFilterChange("usuario", e.target.value)}
                options={[
                  { value: "", label: "Todos os usuários" },
                  ...usuarios.map((u) => ({
                    value: u.id,
                    label: u.nome || u.email || u.id,
                  })),
                ]}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Ação
              </label>
              <Select
                value={filters.acao || ""}
                onChange={(e) => handleFilterChange("acao", e.target.value)}
                options={ACOES_OPTIONS}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Módulo
              </label>
              <Select
                value={filters.modulo || ""}
                onChange={(e) => handleFilterChange("modulo", e.target.value)}
                options={MODULOS_OPTIONS}
              />
            </div>

            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 20,
                  periodo: "",
                  usuario: "",
                  acao: "",
                  modulo: "",
                })
              }
            >
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>

            <Button variant="primary" onClick={loadData}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </DSCard>

        {/* Seção de Alertas de Segurança */}
        <DSCard className="p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-white">Alertas de Segurança</h3>
              {alerts.filter(a => !a.resolved).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.filter(a => !a.resolved).length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={showUnresolvedOnly}
                  onChange={(e) => setShowUnresolvedOnly(e.target.checked)}
                  className="mr-2"
                />
                Apenas não resolvidos
              </label>
              <Button variant="outline" size="sm" onClick={loadAlerts}>
                <RefreshCw className={`w-4 h-4 ${alertsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {alertsLoading ? (
            <div className="p-4 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p>Nenhum alerta de segurança</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    alert.severidade === 'critical' ? 'bg-red-100 border border-red-300' :
                    alert.severidade === 'high' ? 'bg-orange-100 border border-orange-300' :
                    alert.severidade === 'medium' ? 'bg-yellow-100 border border-yellow-300' :
                    'bg-gray-100 border border-[#1f2937]'
                  }`}
                >
                  <div className="flex items-center">
                    <AlertCircle className={`w-5 h-5 mr-3 ${
                      alert.severidade === 'critical' ? 'text-red-600' :
                      alert.severidade === 'high' ? 'text-orange-600' :
                      alert.severidade === 'medium' ? 'text-yellow-600' :
                      'text-slate-600'
                    }`} />
                    <div>
                      <p className="font-medium text-white">{alert.mensagem}</p>
                      <p className="text-sm text-slate-500">
                        {alert.usuarioId || 'Sistema'} • {formatDate(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      alert.severidade === 'critical' ? 'destructive' :
                      alert.severidade === 'high' ? 'warning' :
                      'outline'
                    }>
                      {alert.severidade.toUpperCase()}
                    </Badge>
                    {!alert.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DSCard>

        {/* Lista de Logs */}
        <DSCard className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-slate-600">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum log encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <>
              {/* Tabela */}
              <Table
                columns={[
                  {
                    key: "createdAt",
                    header: "Data/Hora",
                    render: (value) => (
                      <div className="flex items-center text-sm text-slate-900 dark:text-slate-100">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        {formatDate(value)}
                      </div>
                    ),
                    width: "180px"
                  },
                  {
                    key: "usuarioId",
                    header: "Usuário",
                    render: (value) => (
                      <div className="flex items-center text-sm text-slate-900 dark:text-slate-100">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        {value || "Sistema"}
                      </div>
                    )
                  },
                  {
                    key: "acao",
                    header: "Ação",
                    render: (value) => (
                      <div className="flex items-center">
                        {getAcaoIcon(value)}
                        <span className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {getAcaoLabel(value)}
                        </span>
                      </div>
                    )
                  },
                  {
                    key: "modulo",
                    header: "Módulo",
                    render: (value) => (
                      <Badge variant="outline">
                        {getModuloLabel(value)}
                      </Badge>
                    ),
                    width: "120px"
                  },
                  {
                    key: "registroId",
                    header: "ID Registro",
                    render: (value) => (
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {value || "-"}
                      </span>
                    ),
                    width: "120px"
                  },
                  {
                    key: "actions",
                    header: "Ações",
                    render: (value, row) => (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(row);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ),
                    width: "80px",
                    align: "right"
                  }
                ]}
                data={logs}
                density="normal"
                striped={true}
                hoverable={true}
                onRowClick={(row) => handleViewDetail(row)}
              />

              {/* Paginação */}
              <TablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={handlePageChange}
                showPageSizeSelector={true}
                onPageSizeChange={(newSize) => {
                  // Implementar mudança de pageSize se necessário
                  console.log('Page size changed to:', newSize);
                }}
              />
            </>
          )}
        </DSCard>
      </div>

      {/* Modal de Detalhe */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalhes do Log"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-500">
                  Data/Hora
                </label>
                <p className="text-white">
                  {formatDate(selectedLog.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500">
                  Usuário ID
                </label>
                <p className="text-white">{selectedLog.usuarioId || "Sistema"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500">
                  Ação
                </label>
                <div className="flex items-center mt-1">
                  {getAcaoIcon(selectedLog.acao)}
                  <span className="ml-2 font-medium">
                    {getAcaoLabel(selectedLog.acao)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500">
                  Módulo
                </label>
                <p className="text-white">
                  {getModuloLabel(selectedLog.modulo)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500">
                  ID do Registro
                </label>
                <p className="text-white">
                  {selectedLog.registroId || "-"}
                </p>
              </div>
            </div>

            {/* Dados Antes */}
            {selectedLog.dadosAntes && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Dados Anteriores
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-auto">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.dadosAntes, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Dados Depois */}
            {selectedLog.dadosDepois && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Dados Posteriores
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-auto">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.dadosDepois, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!selectedLog.dadosAntes && !selectedLog.dadosDepois && (
              <p className="text-slate-500 text-sm italic">
                Este log não contém dados detalhados.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
