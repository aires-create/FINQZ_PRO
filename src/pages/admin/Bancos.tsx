// FINQZ PRO - Bancos/Providers Page
import React, { useState, useMemo } from "react";
import { Building2, Plus, Edit, Trash2, Search, Filter, RefreshCw, Download, Upload, MoreVertical, Check, X } from "lucide-react";
import { Button, Input, Modal, Select } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

// Tipos de fornecedor
type FornecedorTipo = "banco" | "promotora" | "financeira" | "corretora" | "comercializadora";

// Interface para Fornecedor/Banco
interface Fornecedor {
  id: string;
  nome: string;
  nomeFantasia: string;
  cnpj: string;
  tipo: FornecedorTipo;
  codigo?: string;
  telefone?: string;
  email?: string;
  site?: string;
  ativo: boolean;
  created_at: number;
  updated_at: number;
}

// Dados iniciais mockados (serão substituídos por API)
const initialFornecedores: Fornecedor[] = [
  {
    id: "1",
    nome: "Banco do Brasil",
    nomeFantasia: "BB",
    cnpj: "00.000.000/0001-91",
    tipo: "banco",
    codigo: "001",
    telefone: "0800-7290001",
    email: "contato@bb.com.br",
    site: "www.bb.com.br",
    ativo: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: "2",
    nome: "Caixa Econômica Federal",
    nomeFantasia: "Caixa",
    cnpj: "00.360.305/0001-04",
    tipo: "banco",
    codigo: "104",
    telefone: "0800-7260101",
    email: "contato@caixa.gov.br",
    site: "www.caixa.gov.br",
    ativo: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: "3",
    nome: "Santander Brasil",
    nomeFantasia: "Santander",
    cnpj: "90.400.888/0001-42",
    tipo: "banco",
    codigo: "033",
    telefone: "0800-7023533",
    email: "contato@santander.com.br",
    site: "www.santander.com.br",
    ativo: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: "4",
    nome: "Banco C6",
    nomeFantasia: "C6 Bank",
    cnpj: "31.872.495/0001-72",
    tipo: "banco",
    codigo: "336",
    telefone: "0800-606-0006",
    email: "sac@c6bank.com.br",
    site: "www.c6bank.com.br",
    ativo: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: "5",
    nome: "Creditas",
    nomeFantasia: "Creditas",
    cnpj: "17.727.416/0001-74",
    tipo: "financeira",
    codigo: "CT01",
    telefone: "0800-500-0005",
    email: "contato@creditas.com",
    site: "www.creditas.com",
    ativo: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: "6",
    nome: "Icatu Seguros",
    nomeFantasia: "Icatu",
    cnpj: "42.287.424/0001-50",
    tipo: "seguradora",
    codigo: "ICAT",
    telefone: "0800-729-0001",
    email: "contato@icatu.com.br",
    site: "www.icatuseguros.com.br",
    ativo: true,
    created_at: Date.now(),
    updated_at: Date.now()
  }
];

// Labels amigáveis para tipos
const tipoLabels: Record<FornecedorTipo, string> = {
  banco: "Banco",
  promotora: "Promotora",
  financeira: "Financeira",
  corretora: "Corretora",
  comercializadora: "Comercializadora"
};

export const BancosPage: React.FC = () => {
  // Estado
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(initialFornecedores);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FornecedorTipo | "">("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  
  // Formulário
  const [formData, setFormData] = useState({
    nome: "",
    nomeFantasia: "",
    cnpj: "",
    tipo: "banco" as FornecedorTipo,
    codigo: "",
    telefone: "",
    email: "",
    site: "",
    ativo: true
  });

  // Filtrar fornecedores
  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter(f => {
      // Filtro de busca
      const matchesSearch = searchTerm === "" || 
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cnpj.includes(searchTerm) ||
        (f.codigo?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro de tipo
      const matchesTipo = filtroTipo === "" || f.tipo === filtroTipo;
      
      // Filtro de status
      const matchesStatus = 
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && f.ativo) ||
        (filtroStatus === "inativos" && !f.ativo);
      
      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [fornecedores, searchTerm, filtroTipo, filtroStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = fornecedores.length;
    const ativos = fornecedores.filter(f => f.ativo).length;
    const bancos = fornecedores.filter(f => f.tipo === "banco").length;
    const outras = fornecedores.filter(f => f.tipo !== "banco").length;
    return { total, ativos, bancos, outras };
  }, [fornecedores]);

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingFornecedor(null);
    setFormData({
      nome: "",
      nomeFantasia: "",
      cnpj: "",
      tipo: "banco",
      codigo: "",
      telefone: "",
      email: "",
      site: "",
      ativo: true
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome,
      nomeFantasia: fornecedor.nomeFantasia,
      cnpj: fornecedor.cnpj,
      tipo: fornecedor.tipo,
      codigo: fornecedor.codigo || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      site: fornecedor.site || "",
      ativo: fornecedor.ativo
    });
    setIsModalOpen(true);
  };

  // Salvar fornecedor
  const handleSave = () => {
    if (!formData.nome || !formData.cnpj) {
      alert("Preencha o nome e CNPJ");
      return;
    }

    if (editingFornecedor) {
      // Editar existente
      setFornecedores(prev => prev.map(f => 
        f.id === editingFornecedor.id 
          ? { ...f, ...formData, updated_at: Date.now() }
          : f
      ));
    } else {
      // Criar novo
      const newFornecedor: Fornecedor = {
        id: Date.now().toString(),
        ...formData,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      setFornecedores(prev => [...prev, newFornecedor]);
    }

    setIsModalOpen(false);
  };

  // Excluir fornecedor
  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      setFornecedores(prev => prev.filter(f => f.id !== id));
    }
  };

  // Alternar status
  const toggleStatus = (id: string) => {
    setFornecedores(prev => prev.map(f => 
      f.id === id ? { ...f, ativo: !f.ativo, updated_at: Date.now() } : f
    ));
  };

  // Exportar dados
  const handleExport = () => {
    const headers = ["Nome", "Nome Fantasia", "CNPJ", "Tipo", "Código", "Telefone", "Email", "Site", "Status"];
    const rows = filteredFornecedores.map(f => [
      f.nome,
      f.nomeFantasia,
      f.cnpj,
      tipoLabels[f.tipo],
      f.codigo || "",
      f.telefone || "",
      f.email || "",
      f.site || "",
      f.ativo ? "Ativo" : "Inativo"
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fornecedores_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bancos & Providers"
        subtitle="Gerencie bancos, financeiras e outros fornecedores de crédito"
        onRefresh={() => setFornecedores([...fornecedores])}
      />

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Fornecedores</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ativos</p>
              <p className="text-2xl font-bold text-white">{stats.ativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bancos</p>
              <p className="text-2xl font-bold text-white">{stats.bancos}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outros</p>
              <p className="text-2xl font-bold text-white">{stats.outras}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as FornecedorTipo | "")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="banco">Banco</option>
            <option value="promotora">Promotora</option>
            <option value="financeira">Financeira</option>
            <option value="corretora">Corretora</option>
            <option value="comercializadora">Comercializadora</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>

          <Button variant="primary" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>

          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabela de fornecedores */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[#1f2937]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFornecedores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum fornecedor encontrado
                  </td>
                </tr>
              ) : (
                filteredFornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600">{fornecedor.codigo || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{fornecedor.nome}</p>
                        <p className="text-sm text-gray-500">{fornecedor.nomeFantasia}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600">{fornecedor.cnpj}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        fornecedor.tipo === "banco" ? "bg-blue-100 text-blue-700" :
                        fornecedor.tipo === "promotora" ? "bg-purple-100 text-purple-700" :
                        fornecedor.tipo === "financeira" ? "bg-green-100 text-green-700" :
                        fornecedor.tipo === "corretora" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-300"
                      }`}>
                        {tipoLabels[fornecedor.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {fornecedor.email && <p className="text-gray-600">{fornecedor.email}</p>}
                        {fornecedor.telefone && <p className="text-gray-500">{fornecedor.telefone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(fornecedor.id)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          fornecedor.ativo 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {fornecedor.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(fornecedor)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fornecedor.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criar/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Razão Social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nome de exposição"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Código interno"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de Fornecedor
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as FornecedorTipo })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="banco">Banco</option>
              <option value="promotora">Promotora</option>
              <option value="financeira">Financeira</option>
              <option value="corretora">Corretora</option>
              <option value="comercializadora">Comercializadora</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0800-000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website
            </label>
            <input
              type="text"
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="www.empresa.com"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="ativo" className="text-sm text-gray-300">
              Fornecedor ativo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingFornecedor ? "Salvar Alterações" : "Criar Fornecedor"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BancosPage;
