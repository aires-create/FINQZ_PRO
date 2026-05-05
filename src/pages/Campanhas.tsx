// FINQZ PRO - Campanhas Page
import React, { useEffect, useState } from "react";
import { Plus, Search, Play, Pause, Trash2, X, Send, Clock, CheckCircle, XCircle, AlertCircle, Eye, BarChart3 } from "lucide-react";
import api from "../api/client";
import useAppStore from "../store";
import { Button, Card as DSCard, Input, Select, Badge, StatusBadge, EmptyState, LoadingState, Modal, TextArea } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { USE_MOCKS } from "../config/environment";

// Tipos
interface Campanha {
  id: number;
  nome: string;
  descricao?: string;
  tipo: 'whatsapp' | 'sms' | 'email' | 'mixed';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  conteudo?: string;
  totalEnvios?: number;
  enviosSucesso?: number;
  enviosFalha?: number;
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface CampaignStats {
  total: number;
  pending: number;
  sending: number;
  sent: number;
  delivered: number;
  failed: number;
  successRate: number;
  deliveryRate: number;
}

// Seed inicial para modo mock
const initialCampanhasSeed: Campanha[] = [
  { id: 1, nome: "Boas-vindas 2024", descricao: "Mensagem de boas-vindas para novos clientes", tipo: "whatsapp", status: "completed", conteudo: "Olá {{nome}}! Seja bem-vindo(a) à FinQz Pro!", totalEnvios: 150, enviosSucesso: 145, enviosFalha: 5, createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 5 },
  { id: 2, nome: "Promoção Dia do Cliente", descricao: "Desconto especial para clientes ativos", tipo: "whatsapp", status: "running", conteudo: "Olá {{nome}}! Você ganhou 20% de desconto!", totalEnvios: 500, enviosSucesso: 320, enviosFalha: 10, createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() },
  { id: 3, nome: "Lembrete de Renovação", descricao: "Aviso de contrato próximo do vencimento", tipo: "email", status: "draft", conteudo: "Olá {{nome}}, seu contrato vence em 30 dias.", totalEnvios: 0, enviosSucesso: 0, enviosFalha: 0, createdAt: Date.now() - 86400000, updatedAt: Date.now() },
];

export default function Campanhas() {
  const { tenantId } = useAppStore();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "whatsapp" as const,
    conteudo: "",
    scheduledAt: "",
    intervaloMinutos: 5,
    maxEnviosDia: 500,
    filtros: {} as any,
    contatos: [] as any[],
  });

  // Carregar campanhas
  useEffect(() => {
    loadCampanhas();
    if (USE_MOCKS) {
      loadClientesMock();
    } else {
      loadClientes();
    }
  }, [tenantId]);

  const loadCampanhas = async () => {
    try {
      setLoading(true);
      if (USE_MOCKS) {
        const saved = localStorage.getItem('finqz_pro_campanhas');
        const parsed = saved ? JSON.parse(saved) : null;
        setCampanhas(parsed || initialCampanhasSeed);
      } else {
        const response = await api.get("/api/campanhas");
        setCampanhas(response.data.campanhas || []);
      }
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      setCampanhas(initialCampanhasSeed);
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await api.get("/api/clientes");
      setClientes(response.data.clientes || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const loadClientesMock = () => {
    setClientes([
      { id: 1, nome: "João Silva", celular: "11999999999" },
      { id: 2, nome: "Maria Santos", celular: "11988888888" },
      { id: 3, nome: "Pedro Costa", celular: "11977777777" },
    ]);
  };

  const saveCampanhas = (data: Campanha[]) => {
    localStorage.setItem('finqz_pro_campanhas', JSON.stringify(data));
    setCampanhas(data);
  };

  // Criar campanha
  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).getTime() : null,
      };

      if (USE_MOCKS) {
        const newCampanha: Campanha = {
          id: Date.now(),
          ...payload,
          status: 'draft',
          totalEnvios: formData.contatos.length,
          enviosSucesso: 0,
          enviosFalha: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveCampanhas([newCampanha, ...campanhas]);
      } else {
        await api.post("/api/campanhas", payload);
        await loadCampanhas();
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
    }
  };

  // Executar campanha
  const handleExecutar = async (campanha: Campanha) => {
    try {
      if (USE_MOCKS) {
        // Simula execução
        const updated = campanhas.map(c => {
          if (c.id === campanha.id) {
            return {
              ...c,
              status: 'running' as const,
              enviosSucesso: Math.floor((c.totalEnvios || 0) * 0.9),
              enviosFalha: Math.floor((c.totalEnvios || 0) * 0.1),
              startedAt: Date.now(),
              completedAt: Date.now(),
            };
          }
          return c;
        });
        saveCampanhas(updated);
      } else {
        await api.post(`/api/campanhas/${campanha.id}/executar`, {});
        await loadCampanhas();
      }
    } catch (error) {
      console.error("Erro ao executar campanha:", error);
    }
  };

  // Deletar campanha
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;
    
    try {
      if (USE_MOCKS) {
        saveCampanhas(campanhas.filter(c => c.id !== id));
      } else {
        await api.delete(`/api/campanhas/${id}`);
        await loadCampanhas();
      }
    } catch (error) {
      console.error("Erro ao deletar campanha:", error);
    }
  };

  // Ver estatísticas
  const handleViewStats = async (campanha: Campanha) => {
    setSelectedCampanha(campanha);
    try {
      if (USE_MOCKS) {
        setStats({
          total: campanha.totalEnvios || 0,
          pending: 0,
          sending: 0,
          sent: campanha.enviosSucesso || 0,
          delivered: Math.floor((campanha.enviosSucesso || 0) * 0.7),
          failed: campanha.enviosFalha || 0,
          successRate: campanha.totalEnvios ? ((campanha.enviosSucesso || 0) / campanha.totalEnvios) * 100 : 0,
          deliveryRate: campanha.totalEnvios ? ((campanha.enviosSucesso || 0) * 0.7 / campanha.totalEnvios) * 100 : 0,
        });
      } else {
        const response = await api.get(`/api/campanhas/${campanha.id}/stats`);
        setStats(response.data);
      }
      setShowStatsModal(true);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      tipo: "whatsapp",
      conteudo: "",
      scheduledAt: "",
      intervaloMinutos: 5,
      maxEnviosDia: 500,
      filtros: {},
      contatos: [],
    });
  };

  // Toggle contato selecionado
  const toggleContato = (contato: any) => {
    const exists = formData.contatos.find(c => c.id === contato.id);
    if (exists) {
      setFormData({
        ...formData,
        contatos: formData.contatos.filter(c => c.id !== contato.id),
      });
    } else {
      setFormData({
        ...formData,
        contatos: [...formData.contatos, contato],
      });
    }
  };

  // Preview com variáveis substituídas
  const getPreview = (conteudo: string, nome: string = "Cliente") => {
    return conteudo.replace(/\{\{nome\}\}/g, nome);
  };

  // Filtrar campanhas
  const filteredCampanhas = campanhas.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      draft: { color: "gray", label: "Rascunho" },
      scheduled: { color: "blue", label: "Agendada" },
      running: { color: "yellow", label: "Em execução" },
      paused: { color: "orange", label: "Pausada" },
      completed: { color: "green", label: "Concluída" },
      cancelled: { color: "red", label: "Cancelada" },
    };
    return config[status] || { color: "gray", label: status };
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Campanhas"
        subtitle="Gerencie suas campanhas de disparo em massa"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendada</option>
            <option value="running">Em execução</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </Select>
        </div>

        {/* Lista de Campanhas */}
        {filteredCampanhas.length === 0 ? (
          <EmptyState
            title="Nenhuma campanha encontrada"
            description="Crie sua primeira campanha de disparo"
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredCampanhas.map((campanha) => {
              const statusConfig = getStatusBadge(campanha.status);
              const successRate = campanha.totalEnvios 
                ? ((campanha.enviosSucesso || 0) / campanha.totalEnvios) * 100 
                : 0;

              return (
                <DSCard key={campanha.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{campanha.nome}</h3>
                        <Badge color={statusConfig.color as any}>{statusConfig.label}</Badge>
                        <Badge color={campanha.tipo === 'whatsapp' ? 'green' : campanha.tipo === 'sms' ? 'blue' : 'purple'}>
                          {campanha.tipo.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{campanha.descricao}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          {campanha.totalEnvios || 0} envios
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {campanha.enviosSucesso || 0} sucesso
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          {campanha.enviosFalha || 0} falha
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {successRate.toFixed(1)}% taxa
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {campanha.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleExecutar(campanha)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Executar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStats(campanha)}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(campanha.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </DSCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Nova Campanha */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Nova Campanha"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Campanha</label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Boas-vindas 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <Input
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Mensagem para novos clientes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Mensagem</label>
              <Select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">E-mail</option>
                <option value="mixed">Misto</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Agendar para</label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mensagem 
              <span className="text-gray-400 font-normal ml-2">(Use {'{{nome}}'} para variável)</span>
            </label>
            <TextArea
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Olá {{nome}}! Seja bem-vindo(a)..."
              rows={4}
            />
          </div>

          {/* Preview */}
          {formData.conteudo && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <p className="text-sm">{getPreview(formData.conteudo, "João Silva")}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Selecionar Contatos ({formData.contatos.length} selecionados)
            </label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {clientes.map((contato) => (
                <label
                  key={contato.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!formData.contatos.find(c => c.id === contato.id)}
                    onChange={() => toggleContato(contato)}
                    className="rounded"
                  />
                  <span>{contato.nome}</span>
                  <span className="text-gray-400 text-sm">{contato.celular}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.nome || !formData.conteudo}>
              Criar Campanha
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Estatísticas */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => { setShowStatsModal(false); setSelectedCampanha(null); }}
        title={`Estatísticas - ${selectedCampanha?.nome}`}
        size="md"
      >
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total de Mensagens</p>
              </div>
              <div className="bg-green-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-green-600">Taxa de Sucesso</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Pendentes
                </span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  Enviadas
                </span>
                <span className="font-medium">{stats.sent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Entregues
                </span>
                <span className="font-medium">{stats.delivered}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Falhas
                </span>
                <span className="font-medium">{stats.failed}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
