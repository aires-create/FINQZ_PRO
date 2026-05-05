// FINQZ PRO - Conta Corrente Page
// - Extrato de conta corrente dos parceiros
// - Visual estilo banco/fintech moderno

import React, { useMemo, useState } from "react";
import { useTenantFilter } from "../hooks/useTenantFilter";
import {
  Search,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Building2,
  Filter,
  X,
  Eye,
  Send,
  RefreshCw,
  PiggyBank,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Smartphone,
  Repeat,
  HelpCircle,
  FileText,
  ChevronRight,
} from "lucide-react";

import useAppStore from "../store";
import type { 
  ContaCorrenteMovimento, 
  ContaCorrenteSaldo,
  MovimentoTipo, 
  MovimentoCategoria, 
  MovimentoStatus,
  MovimentoOrigem
} from "../types";

import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Modal,
  TextArea,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { FilterDrawer, FilterField } from "../components/layout/FilterDrawer";

// Constantes
const TIPOS_MOVIMENTO: { value: MovimentoTipo; label: string; color: string }[] = [
  { value: "credito", label: "Crédito", color: "green" },
  { value: "debito", label: "Débito", color: "red" },
  { value: "estorno", label: "Estorno", color: "orange" },
];

const CATEGORIAS: { value: MovimentoCategoria; label: string }[] = [
  { value: "recebimento", label: "Recebimento" },
  { value: "comissao", label: "Comissão" },
  { value: "repasse", label: "Repasse" },
  { value: "taxa", label: "Taxa" },
  { value: "cashback", label: "Cashback" },
  { value: "bonificacao", label: "Bonificação" },
  { value: "estorno", label: "Estorno" },
  { value: "ajuste", label: "Ajuste" },
  { value: "taxa_administrativa", label: "Taxa Administrativa" },
  { value: "mensalidade", label: "Mensalidade" },
];

const STATUS: { value: MovimentoStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "yellow" },
  { value: "disponivel", label: "Disponível", color: "green" },
  { value: "reservado", label: "Reservado", color: "blue" },
  { value: "solicitado", label: "Solicitado", color: "purple" },
  { value: "transferido", label: "Transferido", color: "green" },
  { value: "cancelado", label: "Cancelado", color: "red" },
];

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getStatusColor = (status: MovimentoStatus) => {
  switch (status) {
    case "disponivel": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "pendente": return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    case "reservado": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "solicitado": return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    case "transferido": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "cancelado": return "bg-red-500/20 text-red-400 border border-red-500/30";
    default: return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  }
};

const getTipoIcon = (tipo: MovimentoTipo) => {
  switch (tipo) {
    case "credito": return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
    case "debito": return <ArrowUpRight className="w-5 h-5 text-red-400" />;
    case "estorno": return <RefreshCw className="w-5 h-5 text-orange-400" />;
    default: return <DollarSign className="w-5 h-5 text-slate-400" />;
  }
};

export const ContaCorrentePage: React.FC = () => {
  const store = useAppStore();
  const movimentosContaCorrente = store.movimentosContaCorrente || [];
  const parceiros = store.parceiros || [];
  const solicitarSaque = store.solicitarSaque;

  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [parceiroSearch, setParceiroSearch] = useState("");
  const [parceiroSelecionado, setParceiroSelecionado] = useState<number | null>(null);
  const [showSaqueModal, setShowSaqueModal] = useState(false);
  const [showDetalheModal, setShowDetalheModal] = useState(false);
  const [movimentoSelecionado, setMovimentoSelecionado] = useState<ContaCorrenteMovimento | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Form saque
  const [saqueValor, setSaqueValor] = useState(0);
  const [saqueForma, setSaqueForma] = useState("pix");
  const [saqueBanco, setSaqueBanco] = useState("");
  const [saqueAgencia, setSaqueAgencia] = useState("");
  const [saqueConta, setSaqueConta] = useState("");
  const [saqueChavePix, setSaqueChavePix] = useState("");

  // Filtrar dados por parceiro
  // APLICAR FILTRAGEM DE TENANT PRIMEIRO (segurança multi-tenant)
  const tenantFilteredData = useTenantFilter(movimentosContaCorrente);
  
  const filteredData = useMemo(() => {
    let data = [...tenantFilteredData];

    if (parceiroSelecionado) {
      data = data.filter((m) => m.parceiro_id === parceiroSelecionado);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.codigo?.toLowerCase().includes(query) ||
        item.descricao?.toLowerCase().includes(query) ||
        item.cliente_nome?.toLowerCase().includes(query) ||
        item.produto_nome?.toLowerCase().includes(query)
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
      data = data.filter((item) => item.data_movimento >= filtroDataInicio);
    }
    if (filtroDataFim) {
      data = data.filter((item) => item.data_movimento <= filtroDataFim);
    }

    return data.sort((a, b) => new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime());
  }, [movimentosContaCorrente, parceiroSelecionado, searchQuery, filtroTipo, filtroCategoria, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Calcular saldo do parceiro selecionado
  const saldoParceiro = useMemo(() => {
    const movimentos = parceiroSelecionado 
      ? movimentosContaCorrente.filter((m) => m.parceiro_id === parceiroSelecionado)
      : movimentosContaCorrente;

    const disponivel = movimentos
      .filter((m) => m.status === "disponivel" && m.tipo === "credito")
      .reduce((acc, m) => acc + (m.valor_liquido || m.valor), 0) -
      movimentos
        .filter((m) => m.status !== "cancelado" && m.tipo === "debito")
        .reduce((acc, m) => acc + m.valor, 0);

    const pendente = movimentos
      .filter((m) => m.status === "pendente" && m.tipo === "credito")
      .reduce((acc, m) => acc + m.valor, 0);

    const reservado = movimentos
      .filter((m) => m.status === "reservado")
      .reduce((acc, m) => acc + m.valor, 0);

    const totalCreditos = movimentos
      .filter((m) => m.tipo === "credito")
      .reduce((acc, m) => acc + m.valor, 0);

    const totalDebitos = movimentos
      .filter((m) => m.tipo === "debito")
      .reduce((acc, m) => acc + m.valor, 0);

    return {
      disponivel,
      pendente,
      reservado,
      total: disponivel + pendente,
      totalCreditos,
      totalDebitos,
    };
  }, [movimentosContaCorrente, parceiroSelecionado]);

  // Parceiros filtrados por busca
  const parceirosFiltrados = useMemo(() => {
    if (!parceiroSearch) return parceiros;
    const search = parceiroSearch.toLowerCase();
    return parceiros.filter(p => 
      p.nome?.toLowerCase().includes(search) || 
      p.email?.toLowerCase().includes(search) ||
      p.cnpj?.includes(search)
    );
  }, [parceiros, parceiroSearch]);

  // Calcular saldo de cada parceiro para exibir no card
  const saldoPorParceiro = useMemo(() => {
    const saldos: Record<number, { disponivel: number; pendente: number; reservado: number }> = {};
    parceiros.forEach(p => {
      const movimentos = movimentosContaCorrente.filter(m => m.parceiro_id === p.id);
      const disponivel = movimentos
        .filter(m => m.status === "disponivel" && m.tipo === "credito")
        .reduce((acc, m) => acc + (m.valor_liquido || m.valor), 0) -
        movimentos.filter(m => m.status !== "cancelado" && m.tipo === "debito").reduce((acc, m) => acc + m.valor, 0);
      const pendente = movimentos.filter(m => m.status === "pendente" && m.tipo === "credito").reduce((acc, m) => acc + m.valor, 0);
      const reservado = movimentos.filter(m => m.status === "reservado").reduce((acc, m) => acc + m.valor, 0);
      saldos[p.id] = { disponivel, pendente, reservado };
    });
    return saldos;
  }, [parceiros, movimentosContaCorrente]);

  // Handlers
  const handleDetalhe = (movimento: ContaCorrenteMovimento) => {
    setMovimentoSelecionado(movimento);
    setShowDetalheModal(true);
  };

  const handleSaque = () => {
    if (!parceiroSelecionado || saqueValor <= 0 || saqueValor > saldoParceiro.disponivel) return;

    solicitarSaque(parceiroSelecionado, saqueValor, saqueForma, {
      banco: saqueBanco,
      agencia: saqueAgencia,
      conta: saqueConta,
      chavePix: saqueChavePix,
    });

    setShowSaqueModal(false);
    setSaqueValor(0);
    setSaqueForma("pix");
    setSaqueBanco("");
    setSaqueAgencia("");
    setSaqueConta("");
    setSaqueChavePix("");
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

  // Exportar
  const handleExport = () => {
    if (!filteredData.length) return;

    const headers = ["Código", "Tipo", "Categoria", "Status", "Valor", "Data", "Descrição"];
    const rows = filteredData.map((m) => [
      m.codigo, m.tipo, m.categoria, m.status, m.valor.toString(), m.data_movimento, m.descricao
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conta_corrente_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #0F1A33 0%, #121F3A 100%)'
    }}>
      {/* Halo decorativo no topo */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      
      {/* PageHeader Padronizado */}
      <PageHeader
        title="Conta Corrente"
        subtitle="Gerencie o saldo e movimentações dos parceiros"
        onSearch={() => {}}
        onRefresh={() => {}}
        onOpenFilters={() => setShowFiltros(!showFiltros)}
        importLabel="Importar Movimentos"
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="conta_corrente"
      />

      {/* Header escuro premium com glow */}
      <div className="px-6 py-6 relative">
        {/* Glow azul atrás do card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Card Principal de Saldo com glass effect */}
          <div className="bg-[#111827]/[0.04] backdrop-blur-xl border border-white/8 rounded-2xl p-6 mb-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-50">Saldo Total</h1>
                <p className="text-slate-400 text-sm mt-1">Visão geral dos parceiros</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25">
                  <RefreshCw size={16} /> Atualizar
                </button>
                <button className="px-4 py-2 bg-[#111827]/10 hover:bg-[#111827]/20 border border-white/10 text-slate-200 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                  <Download size={16} /> Exportar
                </button>
              </div>
            </div>

            {/* Seletor de Parceiro com glass */}
            <div className="bg-[#111827]/[0.04] backdrop-blur-md rounded-xl p-4 border border-white/8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-slate-300 text-sm font-medium">Selecione o Parceiro</label>
                <span className="text-slate-500 text-xs">{parceirosFiltrados.length} parceiros</span>
              </div>
              
              {/* Busca de parceiros */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou CNPJ..."
                  value={parceiroSearch}
                  onChange={(e) => setParceiroSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111827]/5 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all text-sm"
                />
              </div>

              {/* Lista de parceiros com scroll */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {parceirosFiltrados.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    Nenhum parceiro encontrado
                  </div>
                ) : (
                  parceirosFiltrados.map((parceiro) => {
                    const saldo = saldoPorParceiro[parceiro.id] || { disponivel: 0, pendente: 0, reservado: 0 };
                    const isSelected = parceiroSelecionado === parceiro.id;
                    
                    return (
                      <button
                        key={parceiro.id}
                        onClick={() => setParceiroSelecionado(parceiro.id)}
                        className={`w-full p-2.5 rounded-lg text-left transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-600/20 border border-blue-500/30 text-slate-100"
                            : "bg-[#111827]/5 hover:bg-[#111827]/10 border border-transparent text-slate-300"
                        }`}
                      >
                        {/* Avatar com iniciais */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isSelected 
                            ? "bg-blue-500 text-white" 
                            : "bg-[#111827]/10 text-slate-300"
                        }`}>
                          {parceiro.nome?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                        </div>
                        
                        {/* Info do parceiro */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{parceiro.nome}</div>
                          <div className={`text-xs truncate ${isSelected ? "text-blue-300" : "text-slate-500"}`}>
                            {parceiro.email}
                          </div>
                        </div>
                        
                        {/* Saldo preview */}
                        <div className="text-right">
                          <div className={`font-bold text-sm ${isSelected ? "text-blue-400" : "text-slate-200"}`}>
                            {formatCurrency(saldo.disponivel)}
                          </div>
                          <div className={`text-xs ${isSelected ? "text-blue-400/70" : "text-slate-500"}`}>
                            disponível
                          </div>
                        </div>
                        
                        {/* Indicador de seleção */}
                        {isSelected && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-2">
        {/* Card Principal de Saldo - Estilo Banco */}
        {parceiroSelecionado ? (
          <div className="space-y-6">
            {/* Hero Card de Saldo - Visual Premium escuro */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl border border-blue-500/20 p-6 shadow-[0_0_80px_rgba(37,99,235,0.35)]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-blue-300 text-sm font-medium mb-1">Saldo disponível</p>
                  <h2 className="text-4xl font-bold text-slate-50">{formatCurrency(saldoParceiro.disponivel)}</h2>
                </div>
                <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3">
                  <Wallet className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              {/* Quick Actions estilo banco */}
              <div className="grid grid-cols-4 gap-3 mt-6">
                <button 
                  onClick={() => setShowSaqueModal(true)}
                  className="bg-[#111827]/5 hover:bg-[#111827]/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-2 transition-all border border-white/10"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Sacar</span>
                </button>
                <button className="bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl p-3 flex flex-col items-center gap-2 transition-all shadow-lg shadow-blue-500/30 border border-blue-400/30">
                  <div className="w-10 h-10 bg-[#111827]/20 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">Pix</span>
                </button>
                <button className="bg-[#111827]/5 hover:bg-[#111827]/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-2 transition-all border border-white/10">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Depositar</span>
                </button>
                <button className="bg-[#111827]/5 hover:bg-[#111827]/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-2 transition-all border border-white/10">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Transferir</span>
                </button>
              </div>
            </div>

            {/* Cards de Saldo Secundários com glass effect */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111827]/[0.04] backdrop-blur-md border border-white/8 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-slate-300 font-medium">Pendente</span>
                </div>
                <p className="text-2xl font-bold text-slate-50">{formatCurrency(saldoParceiro.pendente)}</p>
                <p className="text-sm text-slate-500 mt-1">A receber</p>
              </div>
              
              <div className="bg-[#111827]/[0.04] backdrop-blur-md border border-white/8 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium">Reservado</span>
                </div>
                <p className="text-2xl font-bold text-slate-50">{formatCurrency(saldoParceiro.reservado)}</p>
                <p className="text-sm text-slate-500 mt-1">Bloqueado</p>
              </div>
              
              <div className="bg-[#111827]/[0.04] backdrop-blur-md border border-white/8 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium">Resultado</span>
                </div>
                <p className="text-2xl font-bold text-slate-50">{formatCurrency(saldoParceiro.total)}</p>
                <p className="text-sm text-slate-500 mt-1">Saldo total</p>
              </div>
            </div>

            {/* Filtros com glass effect */}
            {showFiltros && (
              <div className="bg-[#111827]/[0.04] backdrop-blur-md border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-200">Filtros</h3>
                  <button onClick={clearFilters} className="text-sm text-blue-400 hover:text-blue-300">
                    Limpar tudo
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Tipo</label>
                    <select 
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111827]/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                    >
                      <option value="">Todos</option>
                      <option value="credito">Crédito</option>
                      <option value="debito">Débito</option>
                      <option value="estorno">Estorno</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Categoria</label>
                    <select 
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111827]/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                    >
                      <option value="">Todas</option>
                      {CATEGORIAS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Status</label>
                    <select 
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111827]/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                    >
                      <option value="">Todos</option>
                      {STATUS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Data Início</label>
                    <input 
                      type="date" 
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111827]/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Data Fim</label>
                    <input 
                      type="date" 
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111827]/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar movimentação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-[#020617] border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>

            {/* Lista de Movimentações com glass effect */}
            <div className="bg-[#111827]/[0.04] backdrop-blur-md border border-white/8 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/8">
                <h3 className="font-semibold text-slate-200">Extrato</h3>
              </div>
              
              {filteredData.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-[#111827]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500">Nenhuma movimentação encontrada</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredData.map((movimento) => (
                    <div 
                      key={movimento.id}
                      onClick={() => handleDetalhe(movimento)}
                      className="p-4 hover:bg-[#111827]/5 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          movimento.tipo === 'credito' ? 'bg-green-500/20' : 
                          movimento.tipo === 'debito' ? 'bg-red-500/20' : 'bg-orange-500/20'
                        }`}>
                          {getTipoIcon(movimento.tipo)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{movimento.descricao}</p>
                          <p className="text-sm text-slate-500">
                            {movimento.codigo} • {movimento.data_movimento}
                            {movimento.cliente_nome && ` • ${movimento.cliente_nome}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          movimento.tipo === 'credito' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {movimento.tipo === 'credito' ? '+' : '-'}{formatCurrency(movimento.valor)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(movimento.status)}`}>
                          {STATUS.find(s => s.value === movimento.status)?.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Estado vazio - Selecione um parceiro com glass effect
          <div className="bg-[#111827]/[0.04] backdrop-blur-md border border-white/8 rounded-2xl p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-2">Selecione um Parceiro</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Escolha um parceiro acima para visualizar o extrato da conta corrente e gerenciar movimentações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Saque */}
      <Modal
        isOpen={showSaqueModal}
        onClose={() => setShowSaqueModal(false)}
        title="Solicitar Saque"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Valor do Saque</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
              <input
                type="number"
                value={saqueValor || ""}
                onChange={(e) => setSaqueValor(Number(e.target.value))}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-3 bg-[#111827]/5 border border-white/10 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Saldo disponível: {formatCurrency(saldoParceiro.disponivel)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Forma de Recebimento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSaqueForma("pix")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  saqueForma === "pix" 
                    ? "border-blue-500 bg-blue-500/20" 
                    : "border-white/10 hover:border-white/20 bg-[#111827]/5"
                }`}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="font-medium text-slate-300">PIX</p>
              </button>
              <button
                onClick={() => setSaqueForma("transferencia")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  saqueForma === "transferencia" 
                    ? "border-blue-500 bg-blue-500/20" 
                    : "border-white/10 hover:border-white/20 bg-[#111827]/5"
                }`}
              >
                <Banknote className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="font-medium text-slate-300">Transferência</p>
              </button>
            </div>
          </div>

          {saqueForma === "pix" ? (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Chave PIX</label>
              <input
                type="text"
                value={saqueChavePix}
                onChange={(e) => setSaqueChavePix(e.target.value)}
                placeholder="CPF, CNPJ, email ou telefone"
                className="w-full px-4 py-3 bg-[#111827]/5 border border-white/10 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Banco</label>
                <input
                  type="text"
                  value={saqueBanco}
                  onChange={(e) => setSaqueBanco(e.target.value)}
                  placeholder="Nome do banco"
                  className="w-full px-4 py-3 bg-[#111827]/5 border border-white/10 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Agência</label>
                  <input
                    type="text"
                    value={saqueAgencia}
                    onChange={(e) => setSaqueAgencia(e.target.value)}
                    placeholder="0000"
                    className="w-full px-4 py-3 bg-[#111827]/5 border border-white/10 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Conta</label>
                  <input
                    type="text"
                    value={saqueConta}
                    onChange={(e) => setSaqueConta(e.target.value)}
                    placeholder="00000-0"
                    className="w-full px-4 py-3 bg-[#111827]/5 border border-white/10 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowSaqueModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaque} 
              disabled={!saqueValor || saqueValor <= 0 || saqueValor > saldoParceiro.disponivel}
              className="flex-1"
            >
              Confirmar Saque
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={showDetalheModal}
        onClose={() => setShowDetalheModal(false)}
        title="Detalhes da Movimentação"
      >
        {movimentoSelecionado && (
          <div className="space-y-4">
            <div className="bg-[#111827]/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  movimentoSelecionado.tipo === 'credito' ? 'bg-green-500/20' : 
                  movimentoSelecionado.tipo === 'debito' ? 'bg-red-500/20' : 'bg-orange-500/20'
                }`}>
                  {getTipoIcon(movimentoSelecionado.tipo)}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    movimentoSelecionado.tipo === 'credito' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {movimentoSelecionado.tipo === 'credito' ? '+' : '-'}{formatCurrency(movimentoSelecionado.valor)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(movimentoSelecionado.status)}`}>
                    {STATUS.find(s => s.value === movimentoSelecionado.status)?.label}
                  </span>
                </div>
              </div>
              <p className="font-semibold text-slate-200">{movimentoSelecionado.descricao}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Código</p>
                <p className="font-medium text-slate-300">{movimentoSelecionado.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Data</p>
                <p className="font-medium text-slate-300">{movimentoSelecionado.data_movimento}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tipo</p>
                <p className="font-medium text-slate-300 capitalize">{movimentoSelecionado.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Categoria</p>
                <p className="font-medium text-slate-300">
                  {CATEGORIAS.find(c => c.value === movimentoSelecionado.categoria)?.label}
                </p>
              </div>
              {movimentoSelecionado.cliente_nome && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Cliente</p>
                  <p className="font-medium text-slate-300">{movimentoSelecionado.cliente_nome}</p>
                </div>
              )}
              {movimentoSelecionado.produto_nome && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Produto</p>
                  <p className="font-medium text-slate-300">{movimentoSelecionado.produto_nome}</p>
                </div>
              )}
            </div>

            <Button variant="secondary" onClick={() => setShowDetalheModal(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </Modal>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFiltros}
        onClose={() => setShowFiltros(false)}
        fields={[
          { key: 'tipo', label: 'Tipo', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Crédito', value: 'credito' },
            { label: 'Débito', value: 'debito' },
          ], placeholder: 'Todos os tipos' },
          { key: 'categoria', label: 'Categoria', type: 'select', options: [
            { label: 'Todas', value: '' },
            { label: 'Recebimento', value: 'recebimento' },
            { label: 'Pagamento', value: 'pagamento' },
            { label: 'Taxa', value: 'taxa' },
            { label: 'Ajuste', value: 'ajuste' },
            { label: 'Saque', value: 'saque' },
            { label: 'Depósito', value: 'deposito' },
          ], placeholder: 'Todas as categorias' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Disponível', value: 'disponivel' },
            { label: 'Pendente', value: 'pendente' },
            { label: 'Reservado', value: 'reservado' },
            { label: 'Cancelado', value: 'cancelado' },
          ], placeholder: 'Todos os status' },
          { key: 'dataInicio', label: 'Data Início', type: 'date', placeholder: 'Selecione' },
          { key: 'dataFim', label: 'Data Fim', type: 'date', placeholder: 'Selecione' },
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
        onApply={() => setShowFiltros(false)}
        onClear={clearFilters}
      />
    </div>
  );
};

export default ContaCorrentePage;
