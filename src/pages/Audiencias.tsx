// FINQZ PRO - Audiências Page
import React, { useEffect, useState, useRef } from "react";
import { Search, Plus, Trash2, Users, Upload, FileText, X, Check, AlertCircle, Download, Filter, RefreshCw } from "lucide-react";
import api from "../api/client";
import useAppStore from "../store";
import { Button, Input, Badge, StatusBadge, EmptyState, LoadingState, Modal, TextArea } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { USE_MOCKS } from "../config/environment";

// Tipos
interface AudienceFilter {
  field: string;
  operator: string;
  value: string;
}

interface Audience {
  id: number;
  name: string;
  description?: string;
  type: 'manual' | 'dynamic';
  filters?: string;
  totalContacts: number;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

interface AudienceMember {
  id: number;
  audienceId: number;
  clienteId: number;
  status: 'active' | 'unsubscribed' | 'bounced';
  cliente?: {
    id: number;
    nome: string;
    celular?: string;
    email?: string;
  };
}

// Campos disponíveis para filtro
const FILTER_FIELDS = [
  { value: 'nome', label: 'Nome', type: 'text' },
  { value: 'celular', label: 'Celular', type: 'text' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'cpfCnpj', label: 'CPF/CNPJ', type: 'text' },
  { value: 'cidade', label: 'Cidade', type: 'text' },
  { value: 'estado', label: 'Estado', type: 'text' },
  { value: 'status', label: 'Status', type: 'select', options: ['lead', 'cliente', 'perdido'] },
  { value: 'origem', label: 'Origem', type: 'select', options: ['campanha', 'manual', 'import', 'site', 'indicacao'] },
  { value: 'etapa_funil', label: 'Etapa do Funil', type: 'text' },
  { value: 'updatedAt', label: 'Última Atualização', type: 'date' },
  { value: 'createdAt', label: 'Data de Criação', type: 'date' },
  { value: 'ultima_interacao_at', label: 'Última Interação', type: 'date' },
];

// Operadores disponíveis
const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_eq', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'is_empty', label: 'Vazio' },
  { value: 'is_not_empty', label: 'Não vazio' },
  { value: 'last_interaction_hours', label: 'Ativo nas últimas (horas)' },
];

export default function Audiencias() {
  const { tenantId } = useAppStore();
  const [audiencias, setAudiencias] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDynamicModal, setShowDynamicModal] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [members, setMembers] = useState<AudienceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Form states
  const [newAudienceName, setNewAudienceName] = useState("");
  const [newAudienceDesc, setNewAudienceDesc] = useState("");
  const [csvData, setCsvData] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Dynamic audience states
  const [filters, setFilters] = useState<AudienceFilter[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const [previewContacts, setPreviewContacts] = useState<any[]>([]);
  const [viewingAllContacts, setViewingAllContacts] = useState(false);
  const [allContactsPage, setAllContactsPage] = useState(0);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loadingAllContacts, setLoadingAllContacts] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar audiências
  useEffect(() => {
    loadAudiencias();
  }, [tenantId]);

  const loadAudiencias = async () => {
    try {
      setLoading(true);
      if (USE_MOCKS) {
        setAudiencias([
          { id: 1, name: "Leads Janeiro", description: "Importado do formulário", type: 'manual', totalContacts: 150, status: 'active', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 },
          { id: 2, name: "Clientes VIP", description: "Clientes com compras acima de R$1000", type: 'dynamic', filters: JSON.stringify({ minValue: 1000 }), totalContacts: 45, status: 'active', createdAt: Date.now() - 86400000 * 14, updatedAt: Date.now() - 86400000 * 2 },
          { id: 3, name: "Newsletter", description: "Inscritos na newsletter", type: 'manual', totalContacts: 320, status: 'active', createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000 * 5 },
        ]);
      } else {
        const response = await api.get("/api/audiences");
        setAudiencias(response.data.audiences || []);
      }
    } catch (error) {
      console.error("Erro ao carregar audiências:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (audienceId: number) => {
    try {
      setLoadingMembers(true);
      if (USE_MOCKS) {
        setMembers([
          { id: 1, audienceId, clienteId: 1, status: 'active', cliente: { id: 1, nome: "João Silva", celular: "11999999999", email: "joao@email.com" } },
          { id: 2, audienceId, clienteId: 2, status: 'active', cliente: { id: 2, nome: "Maria Santos", celular: "11988888888", email: "maria@email.com" } },
          { id: 3, audienceId, clienteId: 3, status: 'active', cliente: { id: 3, nome: "Pedro Costa", celular: "11977777777", email: "pedro@email.com" } },
        ]);
      } else {
        const response = await api.get(`/api/audiences/${audienceId}`);
        setMembers(response.data.members || []);
      }
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateAudience = async () => {
    if (!newAudienceName.trim()) return;

    try {
      if (USE_MOCKS) {
        const newAudience: Audience = {
          id: Date.now(),
          name: newAudienceName,
          description: newAudienceDesc,
          type: 'manual',
          totalContacts: 0,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setAudiencias([newAudience, ...audiencias]);
      } else {
        await api.post("/api/audiences", {
          name: newAudienceName,
          description: newAudienceDesc,
          type: 'manual',
        });
        loadAudiencias();
      }
      setShowModal(false);
      setNewAudienceName("");
      setNewAudienceDesc("");
    } catch (error) {
      console.error("Erro ao criar audiência:", error);
    }
  };

  // Filter builder functions
  const addFilter = () => {
    setFilters([...filters, { field: 'nome', operator: 'contains', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: keyof AudienceFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  // Calculate dynamic audience
  const handleCalculateDynamic = async () => {
    if (filters.length === 0) return;

    try {
      setCalculating(true);
      if (USE_MOCKS) {
        // Simulate calculation
        setCalculatedTotal(Math.floor(Math.random() * 500) + 50);
        setPreviewContacts([
          { id: 1, nome: "João Silva", celular: "11999999999" },
          { id: 2, nome: "Maria Santos", celular: "11988888888" },
        ]);
      } else {
        const response = await api.post("/api/audiences/calculate", { filters });
        setCalculatedTotal(response.data.total);
        setPreviewContacts(response.data.contacts || []);
      }
    } catch (error) {
      console.error("Erro ao calcular audiência:", error);
    } finally {
      setCalculating(false);
    }
  };

  // Load all contacts with pagination for "Ver todos" feature
  const handleViewAllContacts = async (page = 0) => {
    if (filters.length === 0) return;
    
    try {
      setLoadingAllContacts(true);
      const pageSize = 20;
      
      if (USE_MOCKS) {
        // Simulate pagination
        const mockContacts = Array.from({ length: 20 }, (_, i) => ({
          id: page * pageSize + i + 1,
          nome: `Contato ${page * pageSize + i + 1}`,
          celular: `119${String(page * pageSize + i + 1).padStart(8, '0')}`,
          status: 'lead'
        }));
        setAllContacts(mockContacts);
      } else {
        const response = await api.post("/api/audiences/calculate", { 
          filters,
          page,
          pageSize
        });
        setAllContacts(response.data.contacts || []);
      }
      setAllContactsPage(page);
      setViewingAllContacts(true);
    } catch (error) {
      console.error("Erro ao carregar todos os contatos:", error);
    } finally {
      setLoadingAllContacts(false);
    }
  };

  // Create dynamic audience
  const handleCreateDynamicAudience = async () => {
    if (!newAudienceName.trim() || filters.length === 0) return;

    try {
      if (USE_MOCKS) {
        const newAudience: Audience = {
          id: Date.now(),
          name: newAudienceName,
          description: newAudienceDesc,
          type: 'dynamic',
          filters: JSON.stringify(filters),
          totalContacts: calculatedTotal || 0,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setAudiencias([newAudience, ...audiencias]);
      } else {
        await api.post("/api/audiences", {
          name: newAudienceName,
          description: newAudienceDesc,
          type: 'dynamic',
          filters: JSON.stringify(filters),
        });
        loadAudiencias();
      }
      setShowDynamicModal(false);
      setNewAudienceName("");
      setNewAudienceDesc("");
      setFilters([]);
      setCalculatedTotal(null);
      setPreviewContacts([]);
    } catch (error) {
      console.error("Erro ao criar audiência dinâmica:", error);
    }
  };

  const handleDeleteAudience = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta audiência?")) return;

    try {
      if (!USE_MOCKS) {
        await api.delete(`/api/audiences/${id}`);
      }
      setAudiencias(audiencias.filter(a => a.id !== id));
      if (selectedAudience?.id === id) {
        setSelectedAudience(null);
        setMembers([]);
      }
    } catch (error) {
      console.error("Erro ao excluir audiência:", error);
    }
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const contact: any = {};
      
      headers.forEach((header, index) => {
        if (header.includes('nome') || header.includes('name')) contact.nome = values[index];
        if (header.includes('telefone') || header.includes('phone') || header.includes('celular')) contact.telefone = values[index];
        if (header.includes('email')) contact.email = values[index];
      });
      
      if (contact.nome || contact.telefone) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  };

  const handleImportCSV = async () => {
    if (!csvData.trim()) return;

    setImporting(true);
    setImportResult(null);

    try {
      const contacts = parseCSV(csvData);
      
      if (contacts.length === 0) {
        setImportResult({ error: "Nenhum contato válido encontrado no CSV" });
        return;
      }

      if (USE_MOCKS) {
        setImportResult({ success: true, totalContacts: contacts.length, audienceName: newAudienceName || "Nova Audiência" });
        loadAudiencias();
      } else {
        const response = await api.post("/api/audiences/import-csv", {
          name: newAudienceName || `Audiência ${new Date().toLocaleDateString()}`,
          description: newAudienceDesc,
          contacts,
        });
        setImportResult({
          success: true,
          totalContacts: response.data.totalContacts,
          audienceName: response.data.audienceName,
          skipped: response.data.skipped,
        });
        loadAudiencias();
      }
      
      setShowImportModal(false);
      setCsvData("");
      setNewAudienceName("");
      setNewAudienceDesc("");
    } catch (error: any) {
      setImportResult({ error: error.message || "Erro ao importar CSV" });
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    reader.readAsText(file);
  };

  const handleSelectAudience = (audience: Audience) => {
    setSelectedAudience(audience);
    loadMembers(audience.id);
  };

  // Filtrar audiências
  const filteredAudiencias = audiencias.filter(aud =>
    aud.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aud.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Audiências" 
        subtitle="Gerencie suas listas de contatos para campanhas"
      />

      <div className="p-6">
        {/* Header com ações */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar audiências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff] focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </button>
            <button
              onClick={() => setShowDynamicModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Audiência Dinâmica
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#000dff] text-white rounded-lg hover:bg-[#000dff]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Audiência
            </button>
          </div>
        </div>

        {/* Resultado de importação */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {importResult.success ? (
              <div className="flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span>
                  Audiência "{importResult.audienceName}" criada com {importResult.totalContacts} contatos!
                  {importResult.skipped > 0 && ` (${importResult.skipped} duplicados ignorados)`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{importResult.error}</span>
              </div>
            )}
          </div>
        )}

        {/* Grid de audiências */}
        {loading ? (
          <LoadingState />
        ) : filteredAudiencias.length === 0 ? (
          <EmptyState 
            title="Nenhuma audiência encontrada"
            description="Crie uma nova audiência ou importe contatos via CSV"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAudiencias.map((audience) => (
              <div
                key={audience.id}
                onClick={() => handleSelectAudience(audience)}
                className={`bg-[#111827] rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                  selectedAudience?.id === audience.id ? 'border-[#000dff] ring-2 ring-[#000dff]/20' : 'border-[#1f2937]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#000dff]/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#000dff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{audience.name}</h3>
                      <p className="text-xs text-slate-500">
                        {audience.type === 'dynamic' ? '🔄 Dinâmico' : '📋 Manual'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAudience(audience.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {audience.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{audience.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#000dff]">{audience.totalContacts}</span>
                    <span className="text-sm text-slate-500">contatos</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(audience.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de criar audiência */}
        {showModal && (
          <Modal onClose={() => setShowModal(false)} title="Nova Audiência">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={newAudienceName}
                  onChange={(e) => setNewAudienceName(e.target.value)}
                  placeholder="Ex: Leads Janeiro 2024"
                  className="w-full px-3 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <textarea
                  value={newAudienceDesc}
                  onChange={(e) => setNewAudienceDesc(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateAudience} className="flex-1">
                  Criar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de importação CSV */}
        {showImportModal && (
          <Modal onClose={() => setShowImportModal(false)} title="Importar CSV" size="lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Audiência</label>
                <input
                  type="text"
                  value={newAudienceName}
                  onChange={(e) => setNewAudienceName(e.target.value)}
                  placeholder="Ex: Leads Janeiro 2024"
                  className="w-full px-3 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <textarea
                  value={newAudienceDesc}
                  onChange={(e) => setNewAudienceDesc(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Arquivo CSV</label>
                <div className="border-2 border-dashed border-[#1f2937] rounded-lg p-6 text-center hover:border-[#000dff] transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-2">Clique para selecionar ou arraste o arquivo</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-[#000dff] hover:underline"
                  >
                    Selecionar arquivo
                  </button>
                  {csvData && (
                    <p className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Arquivo carregado
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Formato esperado:</h4>
                <code className="text-xs text-slate-600">
                  nome,telefone,email<br/>
                  João Silva,11999999999,joao@email.com<br/>
                  Maria Santos,11988888888,maria@email.com
                </code>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowImportModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImportCSV} 
                  disabled={!csvData || importing}
                  className="flex-1"
                >
                  {importing ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Dynamic Audience Modal */}
        {showDynamicModal && (
          <Modal onClose={() => setShowDynamicModal(false)} title="Criar Audiência Dinâmica" size="lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Audiência</label>
                <input
                  type="text"
                  value={newAudienceName}
                  onChange={(e) => setNewAudienceName(e.target.value)}
                  placeholder="Ex: Clientes Ativos"
                  className="w-full px-3 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <textarea
                  value={newAudienceDesc}
                  onChange={(e) => setNewAudienceDesc(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                />
              </div>

              {/* Filter Builder */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Filtros</label>
                  <button
                    onClick={addFilter}
                    className="text-sm text-[#000dff] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Adicionar filtro
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                        className="px-2 py-1.5 border border-[#1f2937] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                      >
                        {FILTER_FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        className="px-2 py-1.5 border border-[#1f2937] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                      >
                        {OPERATORS.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                      
                      {!['is_empty', 'is_not_empty', 'last_interaction_hours'].includes(filter.operator) && (
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          placeholder="Valor..."
                          className="flex-1 px-2 py-1.5 border border-[#1f2937] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                        />
                      )}
                      
                      {filter.operator === 'last_interaction_hours' && (
                        <input
                          type="number"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          placeholder="Horas..."
                          className="w-20 px-2 py-1.5 border border-[#1f2937] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]"
                        />
                      )}
                      
                      <button
                        onClick={() => removeFilter(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {filters.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Nenhum filtro adicionado. Clique em "Adicionar filtro" para começar.
                    </p>
                  )}
                </div>
              </div>

              {/* Calculate Button */}
              {filters.length > 0 && (
                <button
                  onClick={handleCalculateDynamic}
                  disabled={calculating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {calculating ? (
                    <>Calculando...</>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Calcular Audiência
                    </>
                  )}
                </button>
              )}

              {/* Results */}
              {calculatedTotal !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-700 font-medium">Total de contatos:</span>
                    <span className="text-2xl font-bold text-green-600">{calculatedTotal}</span>
                  </div>
                  
                  {calculating ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-sm text-slate-500">Calculando...</span>
                    </div>
                  ) : (
                    <>
                      {previewContacts.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600 mb-1">Preview (primeiros {previewContacts.length}):</p>
                          <div className="space-y-1">
                            {previewContacts.map(c => (
                              <p key={c.id} className="text-sm text-slate-600">• {c.nome || 'Sem nome'} - {c.celular || 'Sem telefone'}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {calculatedTotal > 0 && (
                        <button
                          onClick={() => handleViewAllContacts(0)}
                          className="mt-3 text-sm text-[#000dff] hover:underline font-medium"
                        >
                          Ver todos ({calculatedTotal} contatos)
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowDynamicModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateDynamicAudience} 
                  disabled={!newAudienceName.trim() || filters.length === 0 || calculatedTotal === null}
                  className="flex-1"
                >
                  Criar Audiência Dinâmica
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* View All Contacts Modal */}
        {viewingAllContacts && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingAllContacts(false)}>
            <div 
              className="bg-[#111827] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Todos os Contatos</h3>
                <button onClick={() => setViewingAllContacts(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {loadingAllContacts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000dff]"></div>
                    <span className="ml-2 text-slate-500">Carregando...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {allContacts.map((c: any) => (
                        <div key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{c.nome || 'Sem nome'}</p>
                            <p className="text-sm text-slate-500">{c.celular || 'Sem telefone'}</p>
                          </div>
                          {c.status && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              c.status === 'cliente' ? 'bg-green-100 text-green-700' :
                              c.status === 'lead' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {c.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {calculatedTotal && calculatedTotal > 20 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <button
                          onClick={() => handleViewAllContacts(allContactsPage - 1)}
                          disabled={allContactsPage === 0}
                          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-1">Página {allContactsPage + 1}</span>
                        <button
                          onClick={() => handleViewAllContacts(allContactsPage + 1)}
                          disabled={(allContactsPage + 1) * 20 >= calculatedTotal}
                          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {selectedAudience && (
          <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={() => setSelectedAudience(null)}>
            <div 
              className="w-full max-w-md bg-[#111827] h-full overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">{selectedAudience.name}</h2>
                  <button onClick={() => setSelectedAudience(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedAudience.description && (
                  <p className="text-slate-600 mb-4">{selectedAudience.description}</p>
                )}

                <div className="flex gap-4 mb-6">
                  <div className="bg-[#000dff]/10 rounded-lg p-3 text-center flex-1">
                    <span className="text-2xl font-bold text-[#000dff]">{selectedAudience.totalContacts}</span>
                    <p className="text-xs text-slate-600">Contatos</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center flex-1">
                    <span className="text-2xl font-bold text-green-600">{members.filter(m => m.status === 'active').length}</span>
                    <p className="text-xs text-slate-600">Ativos</p>
                  </div>
                </div>

                <h3 className="font-medium text-slate-200 mb-3">Membros</h3>
                
                {loadingMembers ? (
                  <div className="text-center py-8 text-slate-500">Carregando...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Nenhum membro ainda</div>
                ) : (
                  <div className="space-y-2">
                    {members.slice(0, 20).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-200">{member.cliente?.nome}</p>
                          <p className="text-sm text-slate-500">{member.cliente?.celular}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-600'
                        }`}>
                          {member.status === 'active' ? 'Ativo' : member.status}
                        </span>
                      </div>
                    ))}
                    {members.length > 20 && (
                      <p className="text-center text-sm text-slate-500 py-2">
                        +{members.length - 20} outros membros
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
