// Dashboard GROW - Painel de Crescimento e Performance
// Generate, Revenue, Optimization, What's Next

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  ArrowRight,
  BarChart3,
  PieChart,
  Network,
  Layers,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Zap,
  Clock,
  Percent,
  Calculator,
  Megaphone,
  Handshake,
  Lightbulb,
  TrendingUp as TrendUp,
  Activity,
} from "lucide-react";

import useAppStore from "../store";

// ============================================
// TIPOS
// ============================================

interface HeroData {
  totalOportunidades: number;
  leadsGerados: number;
  leadsEmRisco: number;
  leadsProximosFechar: number;
  receitaHoje: number;
  receitaProjetada: number;
  taxaConversao: number;
}

interface GeracaoData {
  totalLeads: number;
  leadsDireta: number;
  leadsIndireta: number;
  leadsFinanceiro: number;
  leadsEnergia: number;
}

interface RevenueData {
  receitaTotal: number;
  ticketMedio: number;
  porProduto: { nome: string; valor: number; percentual: number }[];
  porCanal: { tipo: string; valor: number }[];
  porHierarquia: { nivel: string; valor: number; meta: number }[];
}

interface ConversaoData {
  taxaGeral: number;
  porEtapa: { etapa: string; taxa: number }[];
  porEquipe: { equipe: string; taxa: number }[];
  gargalo?: string;
}

interface ProjecaoData {
  receitaPrevista: number;
  leadsProximos: number;
  pipelineQuente: number;
}

interface Alerta {
  tipo: 'perigo' | 'aviso' | 'oportunidade';
  titulo: string;
  descricao: string;
  acao: string;
  valor?: number;
}

interface Insight {
  tipo: 'comparacao' | 'tendencia' | 'previsao' | 'alerta';
  titulo: string;
  descricao: string;
  impacto?: 'positivo' | 'negativo' | 'neutro';
}

// ============================================
// UTILITÁRIOS
// ============================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompact = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

// ============================================
// HERO - RESUMO EXECUTIVO
// ============================================

interface HeroProps {
  data: HeroData;
}

const HeroSection: React.FC<HeroProps> = ({ data }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-blue-500/20">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Main Value - Largest Typography */}
        <div className="text-center mb-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-lg">
            {formatCurrency(data.totalOportunidades)}
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 font-medium mt-2">
            em oportunidades hoje
          </p>
        </div>

        {/* Subtext */}
        <div className="text-center mb-8">
          <p className="text-lg text-slate-300">
            <span className="text-white font-semibold">{data.leadsGerados} leads gerados</span>
            <span className="mx-3 text-slate-500">•</span>
            <span className="text-red-400 font-semibold">{data.leadsEmRisco} em risco</span>
            <span className="mx-3 text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold">{data.leadsProximosFechar} próximos de fechar</span>
          </p>
        </div>

        {/* Small Indicators Below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {/* Receita Hoje */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Receita Hoje</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(data.receitaHoje)}</p>
          </div>

          {/* Receita Projetada */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Receita Projetada</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(data.receitaProjetada)}</p>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Taxa de Conversão</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.taxaConversao}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SEÇÃO 1: GERAÇÃO
// ============================================

interface GeracaoProps {
  data: GeracaoData;
}

const Geracao: React.FC<GeracaoProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-600/30 p-6 shadow-xl shadow-slate-900/50">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold text-white">Geração</h2>
      </div>

      {/* Total de Leads */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Leads gerados</span>
          <span className="text-2xl font-bold text-white">{data.totalLeads}</span>
        </div>
        <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Por Origem */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-400">Venda Direta</span>
          </div>
          <p className="text-xl font-bold text-white">{data.leadsDireta}</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs text-slate-400">Venda Indireta</span>
          </div>
          <p className="text-xl font-bold text-white">{data.leadsIndireta}</p>
        </div>
      </div>

      {/* Por Produto */}
      <div className="space-y-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Por Produto</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/40 rounded-lg p-3">
            <span className="text-xs text-slate-400">Financeiro</span>
            <p className="text-lg font-bold text-white">{data.leadsFinanceiro}</p>
          </div>
          <div className="bg-slate-900/40 rounded-lg p-3">
            <span className="text-xs text-slate-400">Energia</span>
            <p className="text-lg font-bold text-white">{data.leadsEnergia}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SEÇÃO 2: PRODUÇÃO (REVENUE)
// ============================================

interface RevenueProps {
  data: RevenueData;
}

const Producao: React.FC<RevenueProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-slate-600/40 p-6 shadow-2xl shadow-slate-900/60">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-white">Produção</h2>
      </div>

      {/* Receita Total e Ticket Médio */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/40 rounded-xl p-4">
          <span className="text-xs text-slate-400">Receita Total</span>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.receitaTotal)}</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-4">
          <span className="text-xs text-slate-400">Ticket Médio</span>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.ticketMedio)}</p>
        </div>
      </div>

      {/* Por Produto */}
      <div className="mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-wide block mb-3">Por Produto</span>
        <div className="space-y-2">
          {data.porProduto.map((produto) => (
            <div key={produto.nome} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{produto.nome}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-slate-900/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${produto.percentual}%` }} />
                </div>
                <span className="text-sm font-bold text-white w-20 text-right">{formatCurrency(produto.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por Canal */}
      <div className="mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-wide block mb-3">Por Canal</span>
        <div className="grid grid-cols-2 gap-3">
          {data.porCanal.map((canal) => (
            <div key={canal.tipo} className="bg-slate-900/40 rounded-lg p-3">
              <span className="text-xs text-slate-400 capitalize">{canal.tipo}</span>
              <p className="text-lg font-bold text-white">{formatCurrency(canal.valor)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Por Hierarquia */}
      <div>
        <span className="text-xs text-slate-500 uppercase tracking-wide block mb-3">Por Hierarquia</span>
        <div className="space-y-2">
          {data.porHierarquia.map((item) => {
            const percentual = (item.valor / item.meta) * 100;
            return (
              <div key={item.nivel} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.nivel}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{formatCurrency(item.valor)}</span>
                  <span className={`text-xs ${
                    percentual >= 100 ? 'text-emerald-400' :
                    percentual >= 70 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    ({percentual.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SEÇÃO 3: CONVERSÃO (OPTIMIZATION)
// ============================================

interface ConversaoProps {
  data: ConversaoData;
}

const Conversao: React.FC<ConversaoProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/20 p-5 shadow-lg shadow-slate-900/30">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-bold text-white">Conversão</h2>
      </div>

      {/* Taxa Geral */}
      <div className="bg-slate-900/40 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Taxa de Conversão Geral</span>
          <span className="text-3xl font-black text-purple-400">{data.taxaGeral}%</span>
        </div>
      </div>

      {/* Por Etapa */}
      <div className="mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-wide block mb-3">Por Etapa do Funil</span>
        <div className="space-y-2">
          {data.porEtapa.map((etapa) => (
            <div key={etapa.etapa} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{etapa.etapa}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${etapa.taxa}%`,
                      backgroundColor: etapa.taxa > 50 ? '#10B981' : etapa.taxa > 30 ? '#F59E0B' : '#EF4444'
                    }} 
                  />
                </div>
                <span className={`text-sm font-bold ${
                  etapa.taxa > 50 ? 'text-emerald-400' :
                  etapa.taxa > 30 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {etapa.taxa}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por Equipe */}
      <div className="mb-4">
        <span className="text-xs text-slate-500 uppercase tracking-wide block mb-3">Por Equipe</span>
        <div className="space-y-2">
          {data.porEquipe.map((equipe) => (
            <div key={equipe.equipe} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{equipe.equipe}</span>
              <span className={`text-sm font-bold ${
                equipe.taxa >= 20 ? 'text-emerald-400' :
                equipe.taxa >= 10 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {equipe.taxa}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gargalo Identificado */}
      {data.gargalo && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">Gargalo: {data.gargalo}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SEÇÃO 4: PROJEÇÃO (WHAT'S NEXT)
// ============================================

interface ProjecaoProps {
  data: ProjecaoData;
}

const Projecao: React.FC<ProjecaoProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-600/25 p-5 shadow-lg shadow-slate-900/40">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-cyan-500" />
        <h2 className="text-lg font-bold text-white">Projeção</h2>
      </div>

      <div className="space-y-4">
        {/* Receita Prevista */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
          <span className="text-xs text-cyan-400 uppercase tracking-wide">Receita Prevista</span>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(data.receitaPrevista)}</p>
          <span className="text-xs text-slate-500">Próximos 30 dias</span>
        </div>

        {/* Leads Próximos */}
        <div className="bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Leads Próximos de Fechar</span>
            <span className="text-xl font-bold text-white">{data.leadsProximos}</span>
          </div>
        </div>

        {/* Pipeline Quente */}
        <div className="bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Pipeline Quente</span>
            <span className="text-xl font-bold text-emerald-400">{data.pipelineQuente}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// INSIGHTS INTELIGENTES
// ============================================

interface InsightsProps {
  geracao: GeracaoData;
  revenue: RevenueData;
  conversao: ConversaoData;
  projecao: ProjecaoData;
}

const InsightsInteligentes: React.FC<InsightsProps> = ({ geracao, revenue, conversao, projecao }) => {
  // Gerar insights automaticamente baseados nos dados
  const gerarInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Comparação entre canais
    if (revenue.porCanal.length >= 2) {
      const canalOrdenado = [...revenue.porCanal].sort((a, b) => b.valor - a.valor);
      const melhorCanal = canalOrdenado[0];
      const piorCanal = canalOrdenado[canalOrdenado.length - 1];
      
      if (melhorCanal.valor > piorCanal.valor * 2) {
        insights.push({
          tipo: 'comparacao',
          titulo: `${melhorCanal.tipo} lidera`,
          descricao: `${melhorCanal.tipo} gera ${((melhorCanal.valor / piorCanal.valor)).toFixed(1)}x mais que ${piorCanal.tipo}`,
          impacto: 'positivo'
        });
      }
    }

    // Tendência de conversão
    if (conversao.taxaGeral >= 25) {
      insights.push({
        tipo: 'tendencia',
        titulo: 'Conversão acima da média',
        descricao: `Taxa de ${conversao.taxaGeral}% supera o benchmark do setor`,
        impacto: 'positivo'
      });
    } else if (conversao.taxaGeral < 10) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Conversão abaixo do ideal',
        descricao: 'Considere revisar o processo de qualificação de leads',
        impacto: 'negativo'
      });
    }

    // Previsão de receita
    if (projecao.receitaPrevista > revenue.receitaTotal * 1.2) {
      insights.push({
        tipo: 'previsao',
        titulo: 'Crescimento projetado',
        descricao: `Receita pode crescer ${((projecao.receitaPrevista / revenue.receitaTotal - 1) * 100).toFixed(0)}% nos próximos 30 dias`,
        impacto: 'positivo'
      });
    }

    // Análise de leads por origem
    if (geracao.leadsDireta > geracao.leadsIndireta * 1.5) {
      insights.push({
        tipo: 'comparacao',
        titulo: 'Venda direta em alta',
        descricao: `${geracao.leadsDireta} leads diretos vs ${geracao.leadsIndireta} indiretos`,
        impacto: 'neutro'
      });
    }

    // Análise de produto
    if (revenue.porProduto.length > 0) {
      const produtoPrincipal = revenue.porProduto[0];
      if (produtoPrincipal.percentual >= 60) {
        insights.push({
          tipo: 'tendencia',
          titulo: 'Concentração em produto',
          descricao: `${produtoPrincipal.nome} representa ${produtoPrincipal.percentual}% da receita`,
          impacto: 'neutro'
        });
      }
    }

    // Alerta de leads em risco
    if (geracao.leadsEmRisco > geracao.totalLeads * 0.2) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Atenção aos leads',
        descricao: `${geracao.leadsEmRisco} leads em risco precisam de ação`,
        impacto: 'negativo'
      });
    }

    // Retornar até 3 insights mais relevantes
    return insights.slice(0, 3);
  };

  const insights = gerarInsights();

  const tipoEstilos = {
    comparacao: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', text: 'text-blue-300' },
    tendencia: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-300' },
    previsao: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', text: 'text-purple-300' },
    alerta: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', text: 'text-amber-300' },
  };

  const tipoIcones = {
    comparacao: BarChart3,
    tendencia: TrendUp,
    previsao: Calculator,
    alerta: Activity,
  };

  if (insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-2xl border border-indigo-500/20 p-4 shadow-lg shadow-indigo-500/10">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Insights Inteligentes</h3>
      </div>

      <div className="space-y-2">
        {insights.map((insight, index) => {
          const Icon = tipoIcones[insight.tipo];
          const estilo = tipoEstilos[insight.tipo];
          
          return (
            <div 
              key={index}
              className={`${estilo.bg} ${estilo.border} border rounded-lg p-3 transition-all duration-200 hover:scale-[1.01] cursor-pointer`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 ${estilo.icon} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-xs font-bold ${estilo.text}`}>{insight.titulo}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{insight.descricao}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// ALERTAS E AÇÕES
// ============================================

interface AlertasProps {
  alertas: Alerta[];
  onAcao: (acao: string) => void;
}

const Alertas: React.FC<AlertasProps> = ({ alertas, onAcao }) => {
  const icons = {
    perigo: AlertCircle,
    aviso: Clock,
    oportunidade: Zap,
  };

  const styles = {
    perigo: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10',
    aviso: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
    oportunidade: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
  };

  const iconStyles = {
    perigo: 'text-red-400 bg-red-500/15',
    aviso: 'text-amber-400 bg-amber-500/15',
    oportunidade: 'text-emerald-400 bg-emerald-500/15',
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/20 p-5 shadow-lg shadow-slate-900/30">
      <div className="flex items-center gap-2 mb-4">
        <Handshake className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-white">Ações</h2>
      </div>

      <div className="space-y-3">
        {alertas.map((alerta, index) => {
          const Icon = icons[alerta.tipo];
          return (
            <div 
              key={index}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] cursor-pointer ${styles[alerta.tipo]}`}
              onClick={() => onAcao(alerta.acao)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${iconStyles[alerta.tipo]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{alerta.titulo}</p>
                  <p className="text-xs text-slate-400 mt-1">{alerta.descricao}</p>
                  {alerta.valor && (
                    <p className="text-xs font-bold text-blue-400 mt-2">
                      {formatCurrency(alerta.valor)} em potencial
                    </p>
                  )}
                </div>
                <button 
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcao(alerta.acao);
                  }}
                >
                  {alerta.acao}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD GROW
// ============================================

export default function Dashboard() {
  const navigate = useNavigate();
  const { tenantId } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Estado
  const [heroData, setHeroData] = useState<HeroData>({
    totalOportunidades: 0,
    leadsGerados: 0,
    leadsEmRisco: 0,
    leadsProximosFechar: 0,
    receitaHoje: 0,
    receitaProjetada: 0,
    taxaConversao: 0,
  });
  const [geracao, setGeracao] = useState<GeracaoData>({
    totalLeads: 0,
    leadsDireta: 0,
    leadsIndireta: 0,
    leadsFinanceiro: 0,
    leadsEnergia: 0,
  });
  const [revenue, setRevenue] = useState<RevenueData>({
    receitaTotal: 0,
    ticketMedio: 0,
    porProduto: [],
    porCanal: [],
    porHierarquia: [],
  });
  const [conversao, setConversao] = useState<ConversaoData>({
    taxaGeral: 0,
    porEtapa: [],
    porEquipe: [],
  });
  const [projecao, setProjecao] = useState<ProjecaoData>({
    receitaPrevista: 0,
    leadsProximos: 0,
    pipelineQuente: 0,
  });
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const handleAlertaAcao = (acao: string) => {
    switch (acao) {
      case 'Atacar':
        navigate('/app/hub/sdr-ia');
        break;
      case 'Ver equipe':
        navigate('/app/hub/estrutura-comercial');
        break;
      case 'Fechar':
        navigate('/app/hub/oportunidades?etapa=Fechamento');
        break;
      default:
        navigate('/app/hub/oportunidades');
    }
  };

  useEffect(() => {
    setTimeout(() => {
      // Hero
      setHeroData({
        totalOportunidades: 2450000,
        leadsGerados: 156,
        leadsEmRisco: 23,
        leadsProximosFechar: 8,
        receitaHoje: 185000,
        receitaProjetada: 3250000,
        taxaConversao: 18,
      });

      // Geração
      setGeracao({
        totalLeads: 156,
        leadsDireta: 98,
        leadsIndireta: 58,
        leadsFinanceiro: 89,
        leadsEnergia: 67,
      });

      // Revenue
      setRevenue({
        receitaTotal: 185000,
        ticketMedio: 12500,
        porProduto: [
          { nome: 'Financeiro', valor: 120000, percentual: 65 },
          { nome: 'Energia', valor: 65000, percentual: 35 },
        ],
        porCanal: [
          { tipo: 'direta', valor: 115000 },
          { tipo: 'indireta', valor: 70000 },
        ],
        porHierarquia: [
          { nivel: 'CEO', valor: 85000, meta: 100000 },
          { nivel: 'Gerentes', valor: 55000, meta: 60000 },
          { nivel: 'Vendedores', valor: 35000, meta: 40000 },
          { nivel: 'Franqueados', valor: 10000, meta: 15000 },
        ],
      });

      // Conversão
      setConversao({
        taxaGeral: 18,
        porEtapa: [
          { etapa: 'Lead → Qualificado', taxa: 45 },
          { etapa: 'Qualificado → Proposta', taxa: 32 },
          { etapa: 'Proposta → Fechamento', taxa: 28 },
        ],
        porEquipe: [
          { equipe: 'Equipe A', taxa: 22 },
          { equipe: 'Equipe B', taxa: 15 },
          { equipe: 'Equipe C', taxa: 12 },
        ],
        gargalo: 'Proposta → Fechamento (28%)',
      });

      // Projeção
      setProjecao({
        receitaPrevista: 2500000,
        leadsProximos: 12,
        pipelineQuente: 8,
      });

      // Alertas
      setAlertas([
        {
          tipo: 'perigo',
          titulo: '23 leads sem contato',
          descricao: 'Leads novos sem interação nos últimos 3 dias',
          acao: 'Atacar',
          valor: 450000,
        },
        {
          tipo: 'aviso',
          titulo: 'Equipe C com baixa conversão',
          descricao: 'Conversão 40% abaixo da média',
          acao: 'Ver equipe',
        },
        {
          tipo: 'oportunidade',
          titulo: '8 oportunidades quentes',
          descricao: 'Alta probabilidade de fechamento esta semana',
          acao: 'Fechar',
          valor: 320000,
        },
      ]);

      setLoading(false);
    }, 500);
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <HeroSection data={heroData} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Grid Principal GROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna 1: Geração + Projeção - Bloco de topo do funil */}
          <div className="lg:col-span-3 space-y-6">
            <Geracao data={geracao} />
            <Projecao data={projecao} />
          </div>

          {/* Coluna 2: Produção - Bloco central dominante */}
          <div className="lg:col-span-6">
            <Producao data={revenue} />
          </div>

          {/* Coluna 3: Conversão + Ações - Bloco menor */}
          <div className="lg:col-span-3 space-y-6">
            <Conversao data={conversao} />
            <InsightsInteligentes 
              geracao={geracao} 
              revenue={revenue} 
              conversao={conversao}
              projecao={projecao}
            />
            <Alertas alertas={alertas} onAcao={handleAlertaAcao} />
          </div>
        </div>
      </main>
    </div>
  );
}
