// FINQZ PRO - Relatórios Page
// Página profissional de relatórios com múltiplas visões

import React, { useState, useMemo, useCallback } from "react";
import {
  FileBarChart,
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  List,
  Wallet,
  UserCheck,
  Filter as FilterIcon,
  ChevronDown,
  Calendar,
  X,
  Loader2,
  FileText,
  FileSpreadsheet,
  BarChart,
  LineChart,
  Activity,
  Target,
  Award,
  Zap
} from "lucide-react";
import useAppStore from "../store";
import { Button, Card as DSCard, Select, Badge, Input } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { FilterDrawer, FilterField } from "../components/layout/FilterDrawer";
import { REPORT_CONFIG } from "../types/reports";
import type { ReportType, ReportPeriod, ReportFilters, GroupByOption } from "../types/reports";
import * as reportUtils from "../utils/reports";

// ============================================
// TYPES
// ============================================

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  variation?: string;
  onClick?: () => void;
  variant?: "blue" | "green" | "purple" | "orange" | "cyan";
}

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Card de KPI Premium
 */
const KPICard: React.FC<KPICardProps> = ({ label, value, icon, color, variation, onClick, variant = "blue" }) => {
  const variantStyles = {
    blue: {
      gradient: "from-blue-500/20 via-blue-600/10 to-blue-700/5",
      glow: "shadow-blue-500/25",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-300"
    },
    green: {
      gradient: "from-emerald-500/20 via-emerald-600/10 to-emerald-700/5",
      glow: "shadow-emerald-500/25",
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-300"
    },
    purple: {
      gradient: "from-purple-500/20 via-purple-600/10 to-purple-700/5",
      glow: "shadow-purple-500/25",
      border: "border-purple-500/20",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-300"
    },
    orange: {
      gradient: "from-orange-500/20 via-orange-600/10 to-orange-700/5",
      glow: "shadow-orange-500/25",
      border: "border-orange-500/20",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-300"
    },
    cyan: {
      gradient: "from-cyan-500/20 via-cyan-600/10 to-cyan-700/5",
      glow: "shadow-cyan-500/25",
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-300"
    }
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${styles.gradient}
        border ${styles.border}
        backdrop-blur-xl
        p-6
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        hover:shadow-2xl hover:${styles.glow}
        hover:border-white/30
        cursor-pointer
        min-h-[140px]
      `}
      onClick={onClick}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:bg-white/10 group-hover:scale-110" />
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-white/5 blur-xl transition-all duration-500 group-hover:bg-white/8" />

      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            {icon && (
              <div className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                ${styles.iconBg} ${styles.iconColor}
                transition-all duration-300 group-hover:scale-110
              `}>
                {icon}
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
              {label}
            </p>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 group-hover:scale-105 transition-transform duration-300">
            {value}
          </h2>

          {variation && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                {variation}
              </p>
            </div>
          )}
        </div>

        {/* Decorative Element */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-sm" />
        </div>
      </div>
    </div>
  )
};

/**
 * Estado vazio premium
 */
const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="relative mb-8">
      <div className="w-24 h-24 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
        {icon || <FileText className="w-12 h-12 text-slate-400" />}
      </div>
      <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl -z-10" />
    </div>

    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
      {title}
    </h3>

    <p className="text-slate-400 max-w-md leading-relaxed mb-6">
      {message}
    </p>

    {action && (
      <div className="mt-4">
        {action}
      </div>
    )}
  </div>
);

/**
 * Loading state premium
 */
const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative mb-8">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
      <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl -z-10 animate-pulse" />
    </div>

    <div className="text-center">
      <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
        Carregando dados...
      </h3>
      <p className="text-slate-400 text-sm">
        Estamos processando suas informações
      </p>
    </div>

    <div className="mt-6 flex space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

/**
 * Filtros do relatório premium
 */
const ReportFilters: React.FC<{
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  produtos: { id: string; nome: string }[];
  parceiros: { id: string; nome: string }[];
}> = ({ filters, onChange, produtos, parceiros }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePeriodChange = (periodo: ReportPeriod) => {
    onChange({ ...filters, periodo, dataInicio: undefined, dataFim: undefined });
  };

  const handleDateChange = (field: 'dataInicio' | 'dataFim', value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/80 to-[#1E293B]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl shadow-black/20 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Período */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 tracking-wide">
            Período
          </label>
          <select
            value={filters.periodo}
            onChange={(e) => handlePeriodChange(e.target.value as ReportPeriod)}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
          >
            {REPORT_CONFIG.PERIODS.map(period => (
              <option key={period.id} value={period.id}>{period.label}</option>
            ))}
          </select>
        </div>

        {/* Período Personalizado */}
        {filters.periodo === 'personalizado' && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 tracking-wide">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dataInicio || ''}
                onChange={(e) => handleDateChange('dataInicio', e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 tracking-wide">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) => handleDateChange('dataFim', e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
              />
            </div>
          </>
        )}

        {/* Produto */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 tracking-wide">
            Produto
          </label>
          <select
            value={filters.produto || 'todos'}
            onChange={(e) => onChange({ ...filters, produto: e.target.value })}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
          >
            <option value="todos">Todos os Produtos</option>
            {produtos.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.nome}</option>
            ))}
          </select>
        </div>

        {/* Parceiro */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 tracking-wide">
            Parceiro
          </label>
          <select
            value={filters.parceiro || 'todos'}
            onChange={(e) => onChange({ ...filters, parceiro: e.target.value })}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
          >
            <option value="todos">Todos os Parceiros</option>
            {parceiros.map(partner => (
              <option key={partner.id} value={partner.id}>{partner.nome}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 tracking-wide">
            Status
          </label>
          <select
            value={filters.status || 'todos'}
            onChange={(e) => onChange({ ...filters, status: (e.target.value as any) })}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
          >
            <option value="todos">Todos os Status</option>
            {REPORT_CONFIG.OPPORTUNITY_STATUS.map(status => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>
        </div>

        {/* Busca */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300 tracking-wide">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white placeholder-slate-500 focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const RelatoriosPage: React.FC = () => {
  // Store
  const { produtos, oportunidadesKanban, clientes, parceiros, transacoesFinanceiras } = useAppStore();
  
  // State
  const [reportType, setReportType] = useState<ReportType>('producao');
  const [groupBy, setGroupBy] = useState<GroupByOption>('produto');
  const [filters, setFilters] = useState<ReportFilters>({
    periodo: 'mes',
    search: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estado do FilterDrawer
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

  // Computed data
  const data = useMemo(() => {
    let filtered = [...oportunidadesKanban];
    
    // Apply filters
    filtered = reportUtils.filterByPeriod(filtered, filters);
    filtered = reportUtils.filterByProduct(filtered, filters.produto);
    filtered = reportUtils.filterByPartner(filtered, filters.parceiro);
    filtered = reportUtils.filterByStatus(filtered, filters.status);
    filtered = reportUtils.filterBySearch(filtered, filters.search);
    
    return filtered;
  }, [oportunidadesKanban, filters]);

  // KPIs calculation
  const kpis = useMemo(() => {
    return reportUtils.calculateProductionKPIs(data);
  }, [data]);

  // Consolidated data
  const consolidatedData = useMemo(() => {
    const grouped = reportUtils.groupBy(data, groupBy);
    return reportUtils.toConsolidatedData(grouped, groupBy);
  }, [data, groupBy]);

  // Analytical data
  const analyticalData = useMemo(() => {
    return data.map(op => ({
      id: op.id,
      cliente: op.cliente_nome || op.nome || '',
      cpfCnpj: reportUtils.maskDocument(op.cpf_cnpj || ''),
      produto: op.produto || '',
      parceiro: op.parceiro_nome || 'FINQZ',
      responsavel: op.responsavel || '',
      etapa: op.coluna_id || '',
      status: op.status || 'ativo',
      valor: op.valor || 0,
      comissao: (op.valor || 0) * 0.05, // Exemplo: 5% de comissão
      dataCriacao: reportUtils.formatDate(op.created_at || Date.now()),
      dataIntegracao: op.etapa === 'encerrado' ? reportUtils.formatDate(Date.now()) : undefined,
      origem: op.origem || 'Direto',
    }));
  }, [data]);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const exportData = reportType === 'analitico' 
      ? analyticalData 
      : consolidatedData.map(item => ({
          label: item.label,
          quantidade: item.quantidade,
          valorTotal: item.valorTotal,
          comissaoTotal: item.comissaoTotal,
          ticketMedio: item.ticketMedio,
        }));
    
    reportUtils.exportToCSV(exportData as any[], `relatorio_${reportType}`);
    
    reportUtils.exportToXLSX(exportData, `relatorio_${reportType}`);
  }, [reportType, analyticalData, consolidatedData]);

  // Get report title
  const getReportTitle = () => {
    const titles: Record<ReportType, string> = {
      producao: 'Relatório de Produção',
      comissoes: 'Relatório de Comissões',
      consolidado: 'Relatório Consolidado',
      analitico: 'Relatório Analítico',
      financeiro: 'Relatório Financeiro',
      parceiros: 'Relatório de Parceiros',
      usuarios: 'Relatório de Usuários',
      funil: 'Análise de Funil',
    };
    return titles[reportType];
  };

  // Render report content
  const renderReportContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (data.length === 0) {
      return (
        <EmptyState
          title={reportUtils.getEmptyStateTitle(reportType)}
          message={reportUtils.getEmptyStateMessage(reportType)}
        />
      );
    }

    switch (reportType) {
      case 'producao':
      case 'comissoes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.slice(0, 4).map((kpi, index) => (
              <KPICard
                key={index}
                label={kpi.label}
                value={kpi.formattedValue}
                icon={<TrendingUp className="w-5 h-5" style={{ color: kpi.color }} />}
                color={kpi.color || '#3b82f6'}
                variation={kpi.variationLabel}
              />
            ))}
          </div>
        );

      case 'consolidado':
        return (
          <div className="overflow-x-auto">
            <div className="bg-gradient-to-br from-[#0F172A]/80 to-[#1E293B]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Agrupamento
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-300">
                      Quantidade
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-300">
                      Valor Total
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-300">
                      Comissão
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-300">
                      Ticket Médio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {consolidatedData.map((row, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-white font-medium">{row.label}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 text-right font-mono">{reportUtils.formatNumber(row.quantidade)}</td>
                      <td className="px-6 py-4 text-sm text-white text-right font-semibold font-mono">{reportUtils.formatCurrency(row.valorTotal)}</td>
                      <td className="px-6 py-4 text-sm text-emerald-400 text-right font-mono font-medium">{reportUtils.formatCurrency(row.comissaoTotal)}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 text-right font-mono">{reportUtils.formatCurrency(row.ticketMedio || 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20 bg-gradient-to-r from-[#0F172A]/50 to-[#1E293B]/50">
                    <td className="px-6 py-4 text-sm text-white font-bold">Total</td>
                    <td className="px-6 py-4 text-sm text-white text-right font-bold font-mono">{reportUtils.formatNumber(consolidatedData.reduce((sum, r) => sum + r.quantidade, 0))}</td>
                    <td className="px-6 py-4 text-sm text-white text-right font-bold font-mono">{reportUtils.formatCurrency(consolidatedData.reduce((sum, r) => sum + r.valorTotal, 0))}</td>
                    <td className="px-6 py-4 text-sm text-emerald-400 text-right font-bold font-mono">{reportUtils.formatCurrency(consolidatedData.reduce((sum, r) => sum + r.comissaoTotal, 0))}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 text-right font-mono">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );

      case 'analitico':
        return (
          <div className="overflow-x-auto">
            <div className="bg-gradient-to-br from-[#0F172A]/80 to-[#1E293B]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      CPF/CNPJ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Produto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Parceiro
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Etapa
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-300">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-300">
                      Comissão
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Criação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analyticalData.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-white font-medium">{row.cliente}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">{row.cpfCnpj}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{row.produto}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{row.parceiro}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                          ${['encerrado', 'liberacao'].includes(row.etapa) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            ['aprovacao', 'formalizacao'].includes(row.etapa) ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            ['analise', 'documentacao'].includes(row.etapa) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-500/20 text-slate-300 border border-slate-500/30'}
                        `}>
                          {row.etapa}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white text-right font-semibold font-mono">{reportUtils.formatCurrency(row.valor)}</td>
                      <td className="px-6 py-4 text-sm text-emerald-400 text-right font-mono font-medium">{reportUtils.formatCurrency(row.comissao)}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{row.dataCriacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'funil':
        const etapas = ['entrada', 'triagem', 'analise', 'aprovacao', 'documentacao', 'formalizacao', 'liberacao', 'encerrado'];
        const total = data.length;

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Análise de Funil de Vendas</h3>
              <p className="text-slate-400">Conversão por etapa do processo</p>
            </div>

            {etapas.map((etapa, index) => {
              const count = data.filter(d => d.coluna_id === etapa).length;
              const taxa = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={etapa} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-3 h-3 rounded-full transition-all duration-300
                        ${index === etapas.length - 1 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' :
                          index >= 4 ? 'bg-blue-400 shadow-lg shadow-blue-400/50' :
                          index >= 2 ? 'bg-amber-400 shadow-lg shadow-amber-400/50' :
                          'bg-slate-400 shadow-lg shadow-slate-400/50'}
                      `} />
                      <span className="text-sm font-semibold text-white capitalize group-hover:text-blue-300 transition-colors">
                        {etapa}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400 font-mono">{count}</span>
                      <span className="text-white font-bold font-mono">{taxa.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="h-4 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`
                          h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden
                          ${index === etapas.length - 1 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30' :
                            index >= 4 ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' :
                            index >= 2 ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30' :
                            'bg-gradient-to-r from-slate-500 to-slate-600 shadow-lg shadow-slate-500/30'}
                        `}
                        style={{ width: `${taxa}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-1">Taxa de Conversão Total</p>
                <p className="text-2xl font-bold text-white">
                  {total > 0 ? ((data.filter(d => d.coluna_id === 'encerrado').length / total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <EmptyState
            title="Em Desenvolvimento"
            message="Este relatório está em desenvolvimento e em breve estará disponível."
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#0F172A] to-[#1E293B] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER SECTION */}
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent tracking-tight">
            📊 Relatórios
          </h1>
          <p className="text-slate-400 text-sm lg:text-base">
            Análises detalhadas e insights do seu negócio
          </p>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/80 to-[#1E293B]/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-500/5 overflow-hidden">

          {/* Abas de tipo de relatório premium */}
          <div className="border-b border-white/10 p-6">
            <div className="flex flex-wrap gap-3">
              {REPORT_CONFIG.TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as ReportType)}
                  className={`
                    group relative px-6 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-300
                    ${reportType === type.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      p-1.5 rounded-lg transition-all duration-300
                      ${reportType === type.id
                        ? 'bg-white/20'
                        : 'bg-white/10 group-hover:bg-white/20'
                      }
                    `}>
                      {type.id === 'producao' && <BarChart className="w-4 h-4" />}
                      {type.id === 'comissoes' && <DollarSign className="w-4 h-4" />}
                      {type.id === 'consolidado' && <Activity className="w-4 h-4" />}
                      {type.id === 'analitico' && <List className="w-4 h-4" />}
                      {type.id === 'financeiro' && <Wallet className="w-4 h-4" />}
                      {type.id === 'parceiros' && <UserCheck className="w-4 h-4" />}
                      {type.id === 'usuarios' && <Users className="w-4 h-4" />}
                      {type.id === 'funil' && <Target className="w-4 h-4" />}
                    </div>
                    {type.label}
                  </div>

                  {reportType === type.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Toolbar premium */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {['consolidado', 'analitico'].includes(reportType) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-300">Agrupar por:</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                      className="px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-xl text-white text-sm focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-all duration-200"
                    >
                      {REPORT_CONFIG.GROUP_BY.map(option => (
                        <option key={option.id} value={option.id}>Agrupar por {option.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setOpenFilterDrawer(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>

                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Filtros aplicados */}
            {(filters.periodo !== 'mes' || filters.produto || filters.parceiro || filters.status || filters.search) && (
              <ReportFilters
                filters={filters}
                onChange={setFilters}
                produtos={produtos}
                parceiros={parceiros}
              />
            )}

            {/* KPIs */}
            {['producao', 'comissoes'].includes(reportType) && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => (
                  <KPICard
                    key={index}
                    label={kpi.label}
                    value={kpi.formattedValue}
                    icon={
                      index === 0 ? <Users className="w-5 h-5" /> :
                      index === 1 ? <FileBarChart className="w-5 h-5" /> :
                      index === 2 ? <TrendingUp className="w-5 h-5" /> :
                      <DollarSign className="w-5 h-5" />
                    }
                    color={kpi.color || '#3b82f6'}
                    variation={kpi.variationLabel}
                    variant={
                      index === 0 ? "blue" :
                      index === 1 ? "green" :
                      index === 2 ? "purple" :
                      "cyan"
                    }
                  />
                ))}
              </div>
            )}

            {/* Report Content */}
            <div className="bg-gradient-to-br from-[#0F172A]/50 to-[#1E293B]/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              {renderReportContent()}
            </div>

          </div>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          fields={[
            { key: 'periodo', label: 'Período', type: 'select', options: [
              { label: 'Últimos 7 dias', value: '7dias' },
              { label: 'Últimos 30 dias', value: '30dias' },
              { label: 'Últimos 90 dias', value: '90dias' },
              { label: 'Este ano', value: 'ano' },
              { label: 'Personalizado', value: 'personalizado' },
            ], placeholder: 'Selecione o período' },
            { key: 'dataInicio', label: 'Data Início', type: 'date' },
            { key: 'dataFim', label: 'Data Fim', type: 'date' },
            { key: 'produto', label: 'Produto', type: 'select', options: [
              { label: 'Todos', value: 'todos' },
            ], placeholder: 'Todos os produtos' },
            { key: 'parceiro', label: 'Parceiro', type: 'select', options: [
              { label: 'Todos', value: 'todos' },
            ], placeholder: 'Todos os parceiros' },
          ]}
          values={filters as any}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => setOpenFilterDrawer(false)}
          onClear={() => setFilters({
            periodo: 'mes',
            dataInicio: undefined,
            dataFim: undefined,
            produto: undefined,
            parceiro: undefined,
            status: undefined,
            etapa: undefined,
            origem: undefined,
            usuario: undefined,
            equipe: undefined,
            search: '',
          } as any)}
        />
      </div>
    </div>
  );
};

export default RelatoriosPage;
