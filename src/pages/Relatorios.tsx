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
  FileSpreadsheet
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
}

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Card de KPI
 */
const KPICard: React.FC<KPICardProps> = ({ label, value, icon, color, variation, onClick }) => (
  <div 
    className="bg-[#111827] rounded-lg border border-[#1f2937] p-4 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-xl font-semibold" style={{ color }}>
          {value}
        </p>
        {variation && (
          <p className={`text-xs mt-1 ${variation.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {variation} vs período anterior
          </p>
        )}
      </div>
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
    </div>
  </div>
);

/**
 * Estado vazio
 */
const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {icon || <FileText className="w-8 h-8 text-slate-400" />}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-slate-500 max-w-md">{message}</p>
  </div>
);

/**
 * Loading state
 */
const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
    <p className="text-slate-500">Carregando dados...</p>
  </div>
);

/**
 * Filtros do relatório
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
    <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Período */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Período</label>
          <select
            value={filters.periodo}
            onChange={(e) => handlePeriodChange(e.target.value as ReportPeriod)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {REPORT_CONFIG.PERIODS.map(period => (
              <option key={period.id} value={period.id}>{period.label}</option>
            ))}
          </select>
        </div>

        {/* Período Personalizado */}
        {filters.periodo === 'personalizado' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.dataInicio || ''}
                onChange={(e) => handleDateChange('dataInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) => handleDateChange('dataFim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Produto */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Produto</label>
          <select
            value={filters.produto || 'todos'}
            onChange={(e) => onChange({ ...filters, produto: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos os Produtos</option>
            {produtos.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.nome}</option>
            ))}
          </select>
        </div>

        {/* Parceiro */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Parceiro</label>
          <select
            value={filters.parceiro || 'todos'}
            onChange={(e) => onChange({ ...filters, parceiro: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos os Parceiros</option>
            {parceiros.map(partner => (
              <option key={partner.id} value={partner.id}>{partner.nome}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
          <select
            value={filters.status || 'todos'}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos os Status</option>
            {REPORT_CONFIG.OPPORTUNITY_STATUS.map(status => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>
        </div>

        {/* Busca */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    
    reportUtils.exportToCSV(exportData, `relatorio_${reportType}`);
  }, [reportType, analyticalData, consolidatedData]);

  const handleExportXLSX = useCallback(() => {
    const exportData = reportType === 'analitico'
      ? analyticalData
      : consolidatedData.map(item => ({
          label: item.label,
          quantidade: item.quantidade,
          valorTotal: item.valorTotal,
          comissaoTotal: item.comissaoTotal,
          ticketMedio: item.ticketMedio,
        }));
    
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
            <table className="w-full bg-[#111827] border border-[#1f2937] rounded-lg">
              <thead>
                <tr className="bg-gray-50 border-b border-[#1f2937]">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Agrupamento</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Quantidade</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Valor Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Comissão</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-white">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">{reportUtils.formatNumber(row.quantidade)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right font-medium">{reportUtils.formatCurrency(row.valorTotal)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right">{reportUtils.formatCurrency(row.comissaoTotal)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">{reportUtils.formatCurrency(row.ticketMedio || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-white">Total</td>
                  <td className="px-4 py-3 text-sm text-white text-right">{reportUtils.formatNumber(consolidatedData.reduce((sum, r) => sum + r.quantidade, 0))}</td>
                  <td className="px-4 py-3 text-sm text-white text-right">{reportUtils.formatCurrency(consolidatedData.reduce((sum, r) => sum + r.valorTotal, 0))}</td>
                  <td className="px-4 py-3 text-sm text-green-600 text-right">{reportUtils.formatCurrency(consolidatedData.reduce((sum, r) => sum + r.comissaoTotal, 0))}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'analitico':
        return (
          <div className="overflow-x-auto">
            <table className="w-full bg-[#111827] border border-[#1f2937] rounded-lg">
              <thead>
                <tr className="bg-gray-50 border-b border-[#1f2937]">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">CPF/CNPJ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Produto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Parceiro</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Etapa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Valor</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Comissão</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Criação</th>
                </tr>
              </thead>
              <tbody>
                {analyticalData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-white">{row.cliente}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{row.cpfCnpj}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.produto}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.parceiro}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ['encerrado', 'liberacao'].includes(row.etapa) ? 'bg-green-100 text-green-800' :
                        ['aprovacao', 'formalizacao'].includes(row.etapa) ? 'bg-blue-100 text-blue-800' :
                        ['analise', 'documentacao'].includes(row.etapa) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-slate-200'
                      }`}>
                        {row.etapa}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-right font-medium">{reportUtils.formatCurrency(row.valor)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right">{reportUtils.formatCurrency(row.comissao)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.dataCriacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'funil':
        const etapas = ['entrada', 'triagem', 'analise', 'aprovacao', 'documentacao', 'formalizacao', 'liberacao', 'encerrado'];
        const total = data.length;
        
        return (
          <div className="space-y-4">
            {etapas.map((etapa, index) => {
              const count = data.filter(d => d.coluna_id === etapa).length;
              const taxa = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={etapa} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600 capitalize">{etapa}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${taxa}%`,
                        backgroundColor: index === etapas.length - 1 ? '#22c55e' : 
                          index >= 4 ? '#3b82f6' : 
                          index >= 2 ? '#f59e0b' : '#8b5cf6'
                      }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm font-medium">{count}</div>
                  <div className="w-16 text-right text-sm text-slate-500">{taxa.toFixed(1)}%</div>
                </div>
              );
            })}
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
    <div className="space-y-5">
      {/* Header Padronizado */}
      <PageHeader
        title="Relatórios"
        subtitle="Visão geral dos relatórios"
        onRefresh={() => {}}
        onOpenFilters={() => setOpenFilterDrawer(true)}
        importLabel="Importar Base"
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="relatorios"
      />

      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-6">
        {/* Abas de tipo de relatório */}
        <div className="flex flex-wrap gap-2 mb-6">
          {REPORT_CONFIG.TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as ReportType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportType === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111827] text-slate-300 border border-[#1f2937] hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {['consolidado', 'analitico'].includes(reportType) && (
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {REPORT_CONFIG.GROUP_BY.map(option => (
                  <option key={option.id} value={option.id}>Agrupar por {option.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* KPIs */}
        {['producao', 'comissoes'].includes(reportType) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, index) => (
              <KPICard
                key={index}
                label={kpi.label}
                value={kpi.formattedValue}
                icon={
                  index === 0 ? <Users className="w-5 h-5" style={{ color: kpi.color }} /> :
                  index === 1 ? <FileBarChart className="w-5 h-5" style={{ color: kpi.color }} /> :
                  index === 2 ? <TrendingUp className="w-5 h-5" style={{ color: kpi.color }} /> :
                  <DollarSign className="w-5 h-5" style={{ color: kpi.color }} />
                }
                color={kpi.color || '#3b82f6'}
                variation={kpi.variationLabel}
              />
            ))}
          </div>
        )}

        {/* Report Content */}
        <DSCard className="p-6">
          {renderReportContent()}
        </DSCard>
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
        values={filters}
        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        onApply={() => setOpenFilterDrawer(false)}
        onClear={() => setFilters({
          periodo: '30dias',
          dataInicio: undefined,
          dataFim: undefined,
          produto: 'todos',
          parceiro: 'todos',
          status: 'todos',
          search: '',
        })}
      />
    </div>
  );
};

export default RelatoriosPage;
