// FINQZ PRO - Financeiro Page
// - Visão geral das finanças da empresa
// - Transações, recebimentos, pagamentos
// - Campanhas e Cashback

import React, { useMemo, useState } from "react";
import { useTenantFilter } from "../hooks/useTenantFilter";
import {
  Plus,
  Search,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  RefreshCw,
  Filter,
  X,
  Eye,
  RotateCcw,
  FileText,
  Calendar,
  Building2,
  Users,
  Wallet,
  Gift,
  Percent,
  Clock,
} from "lucide-react";

import useAppStore from "../store";
import type { 
  TransacaoFinanceira, 
  TransacaoTipo, 
  TransacaoCategoria, 
  TransacaoStatus,
  TransacaoFormaPagamento 
} from "../types";

import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Modal,
  TextArea,
  KpiCard,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { FilterDrawer, FilterField } from "../components/layout/FilterDrawer";

// Constantes
const TIPOS_TRANSACAO: { value: TransacaoTipo; label: string; color: string }[] = [
  { value: "credito", label: "Crédito", color: "green" },
  { value: "debito", label: "Débito", color: "red" },
  { value: "estorno_credito", label: "Estorno Crédito", color: "orange" },
  { value: "estorno_debito", label: "Estorno Débito", color: "orange" },
  { value: "taxa", label: "Taxa", color: "gray" },
  { value: "juros", label: "Juros", color: "yellow" },
  { value: "multa", label: "Multa", color: "red" },
  { value: "cashback", label: "Cashback", color: "purple" },
  { value: "campanha", label: "Campanha", color: "blue" },
  { value: "bonificacao", label: "Bonificação", color: "green" },
  { value: "ajuste", label: "Ajuste", color: "gray" },
];

const CATEGORIAS: { value: TransacaoCategoria; label: string }[] = [
  { value: "comissao", label: "Comissão" },
  { value: "repasse", label: "Repasse" },
  { value: "taxa_administrativa", label: "Taxa Administrativa" },
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
  { value: "investimento", label: "Investimento" },
  { value: "cashback", label: "Cashback" },
  { value: "campanha", label: "Campanha" },
  { value: "bonificacao", label: "Bonificação" },
  { value: "estorno", label: "Estorno" },
  { value: "imposto", label: "Imposto" },
  { value: "outro", label: "Outro" },
];

const STATUS: { value: TransacaoStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "yellow" },
  { value: "confirmado", label: "Confirmado", color: "green" },
  { value: "cancelado", label: "Cancelado", color: "red" },
  { value: "estornado", label: "Estornado", color: "gray" },
  { value: "processando", label: "Processando", color: "blue" },
];

// Helper functions
const getTipoColor = (tipo: TransacaoTipo) => {
  const t = TIPOS_TRANSACAO.find((x) => x.value === tipo);
  return t?.color || "gray";
};

const getStatusColor = (status: TransacaoStatus) => {
  const s = STATUS.find((x) => x.value === status);
  return s?.color || "gray";
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getTypeBadgeVariant = (tipo: TransacaoTipo) => {
  if (tipo === "credito") return "success";
  if (tipo === "debito") return "danger";
  if (tipo.includes("estorno")) return "warning";
  if (tipo === "cashback") return "info";
  if (tipo === "campanha") return "primary";
  return "default";
};

const getStatusBadgeVariant = (status: TransacaoStatus) => {
  if (status === "confirmado") return "success";
  if (status === "pendente") return "warning";
  if (status === "cancelado") return "danger";
  if (status === "estornado") return "default";
  return "info";
};

export const FinanceiroPage: React.FC = () => {
  const store = useAppStore();
  const transacoesFinanceiras = store.transacoesFinanceiras || [];
  const addTransacaoFinanceira = store.addTransacaoFinanceira;
  const updateTransacaoFinanceira = store.updateTransacaoFinanceira;
  const deleteTransacaoFinanceira = store.deleteTransacaoFinanceira;
  const estornarTransacao = store.estornarTransacao;
  const parceiros = store.parceiros || [];

  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TransacaoFinanceira | null>(null);
  const [showEstornoModal, setShowEstornoModal] = useState(false);
  const [estornoId, setEstornoId] = useState<number | null>(null);
  const [estornoMotivo, setEstornoMotivo] = useState("");

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Estado do FilterDrawer
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

  // Form
  const [formData, setFormData] = useState<Partial<TransacaoFinanceira>>({
    tipo: "credito",
    categoria: "receita",
    status: "pendente",
    valor: 0,
    descricao: "",
  });

  // Filtrar dados
  // APLICAR FILTRAGEM DE TENANT PRIMEIRO (segurança multi-tenant)
  const tenantFilteredData = useTenantFilter(transacoesFinanceiras || []);
  
  const filteredData = useMemo(() => {
    if (!tenantFilteredData) return [];
    
    let data = [...tenantFilteredData];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.codigo?.toLowerCase().includes(query) ||
        item.descricao?.toLowerCase().includes(query) ||
        item.parceiro_nome?.toLowerCase().includes(query)
      );
    }

    if (filtroTipo) {
      data = data.filter((item) => item.tipo === filtroTipo);
    }
    if (filtroCategoria) {
      data = data.filter((item) => item.categoria === filtroCategoria);
    }
    if (filtroStatus) {
      data = data.filter((item) => item.status === filtroStatus);
    }
    if (filtroDataInicio) {
      data = data.filter((item) => item.data_transacao >= filtroDataInicio);
    }
    if (filtroDataFim) {
      data = data.filter((item) => item.data_transacao <= filtroDataFim);
    }

    return data.sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
  }, [transacoesFinanceiras, searchQuery, filtroTipo, filtroCategoria, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Cards superiores
  const cards = useMemo(() => {
    if (!transacoesFinanceiras || transacoesFinanceiras.length === 0) {
      return {
        totalCreditos: 0,
        totalDebitos: 0,
        saldo: 0,
        pendentes: 0,
        cashback: 0,
        comissoes: 0,
      };
    }

    const creditos = transacoesFinanceiras
      .filter((t) => t.tipo === "credito" && t.status === "confirmado")
      .reduce((acc, t) => acc + t.valor, 0);

    const debitos = transacoesFinanceiras
      .filter((t) => t.tipo === "debito" && t.status === "confirmado")
      .reduce((acc, t) => acc + t.valor, 0);

    const pendentes = transacoesFinanceiras
      .filter((t) => t.status === "pendente")
      .reduce((acc, t) => acc + t.valor, 0);

    const cashback = transacoesFinanceiras
      .filter((t) => t.categoria === "cashback")
      .reduce((acc, t) => acc + t.valor, 0);

    const comissoes = transacoesFinanceiras
      .filter((t) => t.categoria === "comissao")
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      totalCreditos: creditos,
      totalDebitos: debitos,
      saldo: creditos - debitos,
      pendentes,
      cashback,
      comissoes,
    };
  }, [transacoesFinanceiras]);

  // Handlers
  const handleNew = () => {
    setEditingItem(null);
    setFormData({
      tipo: "credito",
      categoria: "receita",
      status: "pendente",
      valor: 0,
      descricao: "",
      data_transacao: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleEdit = (item: TransacaoFinanceira) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSave = () => {
    const now = Date.now();
    
    if (editingItem) {
      updateTransacaoFinanceira(editingItem.id, {
        ...formData,
        updated_at: now,
      });
    } else {
      const maxId = Math.max(...(transacoesFinanceiras || []).map((t) => t.id), 0);
      addTransacaoFinanceira({
        id: maxId + 1,
        codigo: `FIN-${String(maxId + 1).padStart(4, "0")}`,
        ...formData,
        created_at: now,
        updated_at: now,
      } as TransacaoFinanceira);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteTransacaoFinanceira(id);
    }
  };

  const handleEstorno = () => {
    if (estornoId && estornoMotivo) {
      estornarTransacao(estornoId, estornoMotivo);
      setShowEstornoModal(false);
      setEstornoId(null);
      setEstornoMotivo("");
    }
  };

  const openEstornoModal = (id: number) => {
    setEstornoId(id);
    setEstornoMotivo("");
    setShowEstornoModal(true);
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchQuery("");
    setFiltroTipo("");
    setFiltroCategoria("");
    setFiltroStatus("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
  };

  // Exportar CSV
  const handleExport = () => {
    if (!filteredData.length) return;

    const headers = ["Código", "Tipo", "Categoria", "Status", "Valor", "Data", "Descrição", "Parceiro"];
    const rows = filteredData.map((t) => [
      t.codigo,
      t.tipo,
      t.categoria,
      t.status,
      t.valor.toString(),
      t.data_transacao,
      t.descricao,
      t.parceiro_nome || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Padronizado */}
      <PageHeader
        onSearch={setSearchQuery}
        onRefresh={() => {}}
        onCreate={handleNew}
        createLabel="Novo Lançamento"
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={[
          { label: 'Tipo', key: 'tipo', type: 'select', options: [
            { label: 'Crédito', value: 'credito' },
            { label: 'Débito', value: 'debito' }
          ], placeholder: 'Todos os tipos' },
          { label: 'Categoria', key: 'categoria', type: 'select', options: [
            { label: 'Receita', value: 'receita' },
            { label: 'Despesa', value: 'despesa' },
            { label: 'Comissão', value: 'comissao' },
            { label: 'Cashback', value: 'cashback' }
          ], placeholder: 'Todas as categorias' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Pendente', value: 'pendente' },
            { label: 'Confirmado', value: 'confirmado' },
            { label: 'Cancelado', value: 'cancelado' }
          ], placeholder: 'Todos os status' },
          { label: 'Data Início', key: 'dataInicio', type: 'date' },
          { label: 'Data Fim', key: 'dataFim', type: 'date' },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'tipo') setFiltroTipo(value)
          if (key === 'categoria') setFiltroCategoria(value)
          if (key === 'status') setFiltroStatus(value)
          if (key === 'dataInicio') setFiltroDataInicio(value)
          if (key === 'dataFim') setFiltroDataFim(value)
        }}
        importLabel="Importar Lançamentos"
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="financeiro"
      />

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Receitas"
          value={formatCurrency(cards.totalCreditos)}
          icon={<TrendingUp size={18} />}
          variant="green"
          className="shadow-2xl shadow-emerald-500/10"
        />
        <KpiCard
          label="Despesas"
          value={formatCurrency(cards.totalDebitos)}
          icon={<TrendingDown size={18} />}
          variant="red"
          className="shadow-2xl shadow-red-500/10"
        />
        <KpiCard
          label="Saldo"
          value={formatCurrency(cards.saldo)}
          icon={<Wallet size={18} />}
          variant={cards.saldo >= 0 ? "green" : "red"}
          className="shadow-2xl shadow-blue-500/10"
        />
        <KpiCard
          label="Pendentes"
          value={formatCurrency(cards.pendentes)}
          icon={<Clock size={18} />}
          variant="orange"
          className="shadow-2xl shadow-amber-500/10"
        />
        <KpiCard
          label="Cashback"
          value={formatCurrency(cards.cashback)}
          icon={<Gift size={18} />}
          variant="purple"
          className="shadow-2xl shadow-violet-500/10"
        />
        <KpiCard
          label="Comissões"
          value={formatCurrency(cards.comissoes)}
          icon={<Percent size={18} />}
          variant="orange"
          className="shadow-2xl shadow-orange-500/10"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0F172A]/85 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Painel financeiro</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Fluxo de caixa e baixa de transações</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Filtros aplicados em tempo real para priorizar cobranças, validar recebimentos e mapear oportunidades de capital de giro.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Transações</p>
              <p className="mt-2 text-xl font-semibold text-white">{filteredData.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Última</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {filteredData[0]?.data_transacao || "-"}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Saldo atual</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(cards.saldo)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Transações</p>
            <p className="text-sm text-slate-400">
              {filteredData.length} lançamentos encontrados • ordenado por data mais recente
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0F172A]/80 px-3 py-2 text-sm text-slate-300">
            <Download size={16} className="text-blue-300" />
            Exporte seus dados direto do painel
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gradient-to-r from-slate-950/90 to-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Código</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Tipo</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Categoria</th>
                <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.3em]">Valor</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Data</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Descrição</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Parceiro</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Status</th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12">
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/80 p-10 text-center shadow-2xl shadow-black/20">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300">
                        <Wallet size={24} />
                      </div>
                      <p className="text-lg font-semibold text-white mb-2">Nenhuma transação encontrada</p>
                      <p className="text-sm text-slate-400 max-w-xl mx-auto">
                        Ajuste os filtros ou registre um novo lançamento para começar a visualizar fluxo financeiro e previsões de caixa.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="group border-b border-white/10 transition-colors duration-200 hover:bg-slate-900/80">
                    <td className="px-4 py-4 text-sm font-semibold text-white whitespace-nowrap">{item.codigo}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge
                        variant={getTypeBadgeVariant(item.tipo)}
                        size="sm"
                        className="uppercase tracking-[0.04em]"
                      >
                        {TIPOS_TRANSACAO.find((t) => t.value === item.tipo)?.label || item.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300 whitespace-nowrap">
                      {CATEGORIAS.find((c) => c.value === item.categoria)?.label || item.categoria}
                    </td>
                    <td className={`px-4 py-4 text-right text-sm font-semibold ${item.tipo === "credito" || item.tipo.includes("estorno_debito") ? "text-emerald-300" : "text-red-300"}`}>
                      {item.tipo === "credito" || item.tipo.includes("estorno_debito") ? "+" : "-"}{formatCurrency(item.valor)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400 whitespace-nowrap">{item.data_transacao}</td>
                    <td className="px-4 py-4 text-sm text-slate-300 max-w-[260px] truncate">{item.descricao}</td>
                    <td className="px-4 py-4 text-sm text-slate-300 whitespace-nowrap">{item.parceiro_nome || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge
                        variant={getStatusBadgeVariant(item.status)}
                        size="sm"
                        className="uppercase tracking-[0.04em]"
                      >
                        {STATUS.find((s) => s.value === item.status)?.label || item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#111827]/90 text-slate-300 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
                          title="Editar"
                        >
                          <Eye size={16} />
                        </button>
                        {item.status === "confirmado" && (
                          <button
                            onClick={() => openEstornoModal(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#111827]/90 text-slate-300 transition-all duration-200 hover:border-orange-300 hover:bg-orange-500/10 hover:text-orange-300"
                            title="Estornar"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#111827]/90 text-slate-300 transition-all duration-200 hover:border-red-300 hover:bg-red-500/10 hover:text-red-300"
                          title="Excluir"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de transação */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Editar Transação" : "Nova Transação"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
              <Select
                value={formData.tipo || ""}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TransacaoTipo })}
                options={TIPOS_TRANSACAO.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
              <Select
                value={formData.categoria || ""}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as TransacaoCategoria })}
                options={CATEGORIAS.map((c) => ({ value: c.value, label: c.label }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Valor</label>
              <Input
                type="number"
                value={formData.valor || ""}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data</label>
              <Input
                type="date"
                value={formData.data_transacao || ""}
                onChange={(e) => setFormData({ ...formData, data_transacao: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
            <TextArea
              value={formData.descricao || ""}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da transação"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Parceiro</label>
            <Select
              value={formData.parceiro_id?.toString() || ""}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                const parceiro = parceiros?.find((p) => p.id === id);
                setFormData({ 
                  ...formData, 
                  parceiro_id: isNaN(id) ? undefined : id,
                  parceiro_nome: parceiro?.nome,
                });
              }}
              options={[
                { value: "", label: "Selecione..." },
                ...(parceiros || []).map((p) => ({ value: p.id.toString(), label: p.nome })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
            <Select
              value={formData.status || "pendente"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TransacaoStatus })}
              options={STATUS.map((s) => ({ value: s.value, label: s.label }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal de estorno */}
      <Modal
        isOpen={showEstornoModal}
        onClose={() => setShowEstornoModal(false)}
        title="Estornar Transação"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Ao estornar esta transação, será criada uma nova transação de estorno com valor negativo.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Motivo do estorno *</label>
            <TextArea
              value={estornoMotivo}
              onChange={(e) => setEstornoMotivo(e.target.value)}
              placeholder="Descreva o motivo do estorno..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowEstornoModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleEstorno} disabled={!estornoMotivo}>
              Confirmar Estorno
            </Button>
          </div>
        </div>
      </Modal>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        fields={[
          { key: 'tipo', label: 'Tipo', type: 'select', options: [
            { label: 'Crédito', value: 'credito' },
            { label: 'Débito', value: 'debito' }
          ], placeholder: 'Todos os tipos' },
          { key: 'categoria', label: 'Categoria', type: 'select', options: [
            { label: 'Receita', value: 'receita' },
            { label: 'Despesa', value: 'despesa' },
            { label: 'Comissão', value: 'comissao' },
            { label: 'Cashback', value: 'cashback' }
          ], placeholder: 'Todas as categorias' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { label: 'Pendente', value: 'pendente' },
            { label: 'Confirmado', value: 'confirmado' },
            { label: 'Cancelado', value: 'cancelado' }
          ], placeholder: 'Todos os status' },
          { key: 'dataInicio', label: 'Data Início', type: 'date' },
          { key: 'dataFim', label: 'Data Fim', type: 'date' },
        ]}
        values={{
          tipo: filtroTipo,
          categoria: filtroCategoria,
          status: filtroStatus,
          dataInicio: filtroDataInicio,
          dataFim: filtroDataFim,
        }}
        onChange={(key, value) => {
          if (key === 'tipo') setFiltroTipo(value)
          if (key === 'categoria') setFiltroCategoria(value)
          if (key === 'status') setFiltroStatus(value)
          if (key === 'dataInicio') setFiltroDataInicio(value)
          if (key === 'dataFim') setFiltroDataFim(value)
        }}
        onApply={() => setOpenFilterDrawer(false)}
        onClear={() => {
          setFiltroTipo('')
          setFiltroCategoria('')
          setFiltroStatus('')
          setFiltroDataInicio('')
          setFiltroDataFim('')
        }}
      />
    </div>
  );
};

export default FinanceiroPage;
