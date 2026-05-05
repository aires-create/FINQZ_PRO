// FINQZ PRO - Report Utilities
// Funções puras para cálculos e transformações de relatórios

import type {
  ReportFilters,
  ReportKPI,
  AnalyticalReportRow,
  ConsolidatedReportRow,
  FunnelReportRow,
  CommissionReportRow,
  FinancialReportRow,
  GroupByOption,
  OpportunityStatus,
  FinancialStatus,
} from '../types/reports';

// ============================================
// DATE HELPERS
// ============================================

/**
 * Obtém data de início do período
 */
export const getPeriodStartDate = (periodo: string): Date => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (periodo) {
    case 'semana':
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(today.setDate(diff));
    
    case 'mes':
      return new Date(today.getFullYear(), today.getMonth(), 1);
    
    case 'trimestre':
      const quarter = Math.floor(today.getMonth() / 3);
      return new Date(today.getFullYear(), quarter * 3, 1);
    
    case 'ano':
      return new Date(today.getFullYear(), 0, 1);
    
    default:
      return new Date(today.getFullYear(), today.getMonth(), 1);
  }
};

/**
 * Formata data para string
 */
export const formatDate = (date: Date | number | string): string => {
  const d = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Formata data para ISO
 */
export const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Obtém período formatado
 */
export const getPeriodLabel = (filters: ReportFilters): string => {
  if (filters.periodo === 'personalizado' && filters.dataInicio && filters.dataFim) {
    return `${formatDate(filters.dataInicio)} - ${formatDate(filters.dataFim)}`;
  }
  
  const labels: Record<string, string> = {
    semana: 'Esta Semana',
    mes: 'Este Mês',
    trimestre: 'Este Trimestre',
    ano: 'Este Ano',
  };
  
  return labels[filters.periodo] || 'Período';
};

// ============================================
// CURRENCY HELPERS
// ============================================

/**
 * Formata valor monetário
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) 
    : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

/**
 * Formata número com separador de milhar
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formata percentual
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// ============================================
// MASK HELPERS (LGPD)
// ============================================

/**
 * Mascara CPF
 */
export const maskCPF = (cpf: string): string => {
  if (!cpf || cpf.length < 11) return cpf;
  return `${cpf.slice(0, 3)}.***.${cpf.slice(-4)}`;
};

/**
 * Mascara CNPJ
 */
export const maskCNPJ = (cnpj: string): string => {
  if (!cnpj || cnpj.length < 14) return cnpj;
  return `${cnpj.slice(0, 2)}.***.${cnpj.slice(-4)}`;
};

/**
 * Mascara documento (CPF ou CNPJ)
 */
export const maskDocument = (document: string): string => {
  if (!document) return '';
  const cleanDoc = document.replace(/\D/g, '');
  return cleanDoc.length <= 11 ? maskCPF(cleanDoc) : maskCNPJ(cleanDoc);
};

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calcula taxa de conversão
 */
export const calculateConversionRate = (converted: number, total: number): number => {
  if (total === 0) return 0;
  return (converted / total) * 100;
};

/**
 * Calcula ticket médio
 */
export const calculateAverageTicket = (totalValue: number, quantity: number): number => {
  if (quantity === 0) return 0;
  return totalValue / quantity;
};

/**
 * Calcula comissão
 */
export const calculateCommission = (value: number, rate: number): number => {
  return value * (rate / 100);
};

/**
 * Calcula variação percentual
 */
export const calculateVariation = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ============================================
// FILTER FUNCTIONS
// ============================================

/**
 * Filtra dados por período
 */
export const filterByPeriod = <T extends { created_at?: number; data?: number; dataCriacao?: string }>(
  data: T[],
  filters: ReportFilters
): T[] => {
  const startDate = filters.dataInicio 
    ? new Date(filters.dataInicio).getTime()
    : getPeriodStartDate(filters.periodo).getTime();
  
  const endDate = filters.dataFim 
    ? new Date(filters.dataFim).getTime()
    : Date.now();
  
  return data.filter(item => {
    const itemDate = item.created_at || item.data || 0;
    return itemDate >= startDate && itemDate <= endDate;
  });
};

/**
 * Filtra dados por produto
 */
export const filterByProduct = <T extends { produto?: string }>(
  data: T[],
  produto?: string
): T[] => {
  if (!produto || produto === 'todos') return data;
  return data.filter(item => item.produto === produto);
};

/**
 * Filtra dados por parceiro
 */
export const filterByPartner = <T extends { parceiro_id?: number; parceiro?: string }>(
  data: T[],
  parceiroId?: string
): T[] => {
  if (!parceiroId || parceiroId === 'todos') return data;
  return data.filter(item => String(item.parceiro_id) === parceiroId);
};

/**
 * Filtra dados por status
 */
export const filterByStatus = <T extends { status?: string }>(
  data: T[],
  status?: string
): T[] => {
  if (!status || status === 'todos') return data;
  return data.filter(item => item.status === status);
};

/**
 * Filtra dados por busca
 */
export const filterBySearch = <T extends { nome?: string; cliente_nome?: string }>(
  data: T[],
  search?: string
): T[] => {
  if (!search || search.trim() === '') return data;
  const searchLower = search.toLowerCase();
  return data.filter(item => 
    item.nome?.toLowerCase().includes(searchLower) ||
    item.cliente_nome?.toLowerCase().includes(searchLower)
  );
};

// ============================================
// GROUPING FUNCTIONS
// ============================================

/**
 * Agrupa dados por campo
 */
export const groupBy = <T extends Record<string, any>>(
  data: T[],
  field: GroupByOption
): Record<string, T[]> => {
  return data.reduce((acc, item) => {
    let key: string;
    
    switch (field) {
      case 'produto':
        key = item.produto || 'Sem Produto';
        break;
      case 'parceiro':
        key = item.parceiro || item.parceiro_nome || 'Sem Parceiro';
        break;
      case 'usuario':
      case 'responsavel':
        key = item.responsavel || item.usuario || 'Sem Usuário';
        break;
      case 'etapa':
        key = item.etapa || item.coluna_id || 'Sem Etapa';
        break;
      case 'status':
        key = item.status || 'Sem Status';
        break;
      case 'mes':
        const date = item.created_at ? new Date(item.created_at) : new Date();
        key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        break;
      case 'origem':
        key = item.origem || 'Direto';
        break;
      default:
        key = 'Outros';
    }
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Converte grupo em dados consolidados
 */
export const toConsolidatedData = (
  grouped: Record<string, any[]>,
  groupByField: GroupByOption
): ConsolidatedReportRow[] => {
  return Object.entries(grouped).map(([key, items]) => {
    const valorTotal = items.reduce((sum, item) => sum + (item.valor || 0), 0);
    const comissaoTotal = items.reduce((sum, item) => sum + (item.comissao || 0), 0);
    
    return {
      chave: key,
      label: formatGroupLabel(key, groupByField),
      quantidade: items.length,
      valorTotal,
      comissaoTotal,
      ticketMedio: calculateAverageTicket(valorTotal, items.length),
    };
  });
};

/**
 * Formata label do grupo
 */
export const formatGroupLabel = (key: string, groupBy: GroupByOption): string => {
  const labels: Record<string, Record<string, string>> = {
    produto: {
      'Empréstimo Pessoal': 'Empréstimo Pessoal',
      'Crédito Consignado': 'Crédito Consignado',
    },
    etapa: {
      'entrada': 'Entrada',
      'triagem': 'Triagem',
      'analise': 'Análise',
      'aprovacao': 'Aprovação',
      'documentacao': 'Documentação',
      'formalizacao': 'Formalização',
      'liberacao': 'Liberação',
      'encerrado': 'Encerrado',
    },
    status: {
      'novo_lead': 'Novo Lead',
      'triagem': 'Triagem',
      'analise': 'Em Análise',
      'aprovacao': 'Aprovação',
      'encerrado': 'Encerrado',
      'reprovado': 'Reprovado',
    },
  };
  
  return labels[groupBy]?.[key] || key;
};

// ============================================
// KPI CALCULATION
// ============================================

/**
 * Calcula KPIs do relatório de produção
 */
export const calculateProductionKPIs = (
  data: any[],
  previousData?: any[]
): ReportKPI[] => {
  const totalLeads = data.length;
  const propostasIntegradas = data.filter(d => 
    ['aprovacao', 'documentacao', 'formalizacao', 'liberacao', 'encerrado'].includes(d.etapa)
  ).length;
  const propostasAprovadas = data.filter(d => 
    d.status === 'aprovado' || d.etapa === 'encerrado'
  ).length;
  const propostasPerdidas = data.filter(d => 
    d.status === 'reprovado' || d.status === 'cancelado'
  ).length;
  
  const valorTotal = data.reduce((sum, d) => sum + (d.valor || 0), 0);
  const comissaoPrevista = data.reduce((sum, d) => sum + (d.comissao || 0), 0);
  
  const taxaConversao = calculateConversionRate(propostasAprovadas, totalLeads);
  const ticketMedio = calculateAverageTicket(valorTotal, totalLeads);
  
  let variation: number | undefined;
  if (previousData && previousData.length > 0) {
    const prevTotal = previousData.reduce((sum, d) => sum + (d.valor || 0), 0);
    variation = calculateVariation(valorTotal, prevTotal);
  }
  
  return [
    {
      label: 'Total de Leads',
      value: totalLeads,
      formattedValue: formatNumber(totalLeads),
      icon: 'Users',
      color: '#3b82f6',
    },
    {
      label: 'Propostas Integradas',
      value: propostasIntegradas,
      formattedValue: formatNumber(propostasIntegradas),
      icon: 'FileCheck',
      color: '#22c55e',
    },
    {
      label: 'Propostas Aprovadas',
      value: propostasAprovadas,
      formattedValue: formatNumber(propostasAprovadas),
      icon: 'CheckCircle',
      color: '#10b981',
    },
    {
      label: 'Propostas Perdidas',
      value: propostasPerdidas,
      formattedValue: formatNumber(propostasPerdidas),
      icon: 'XCircle',
      color: '#ef4444',
    },
    {
      label: 'Taxa de Conversão',
      value: taxaConversao,
      formattedValue: formatPercent(taxaConversao),
      icon: 'TrendingUp',
      color: '#8b5cf6',
    },
    {
      label: 'Ticket Médio',
      value: ticketMedio,
      formattedValue: formatCurrency(ticketMedio),
      icon: 'DollarSign',
      color: '#f59e0b',
    },
    {
      label: 'Valor Total Produzido',
      value: valorTotal,
      formattedValue: formatCurrency(valorTotal),
      variation,
      variationLabel: variation !== undefined ? formatPercent(Math.abs(variation)) : undefined,
      icon: 'Wallet',
      color: '#06b6d4',
    },
    {
      label: 'Comissão Prevista',
      value: comissaoPrevista,
      formattedValue: formatCurrency(comissaoPrevista),
      icon: 'Percent',
      color: '#a855f7',
    },
  ];
};

/**
 * Calcula KPIs do relatório financeiro
 */
export const calculateFinancialKPIs = (
  creditos: FinancialReportRow[],
  debitos: FinancialReportRow[]
): ReportKPI[] => {
  const totalCreditos = creditos
    .filter(c => c.status === 'confirmado')
    .reduce((sum, c) => sum + c.valor, 0);
  
  const totalDebitos = debitos
    .filter(d => d.status === 'confirmado')
    .reduce((sum, d) => sum + d.valor, 0);
  
  const saldoPendente = creditos
    .filter(c => c.status === 'pendente')
    .reduce((sum, c) => sum + c.valor, 0);
  
  const saldoDisponivel = totalCreditos - totalDebitos;
  
  return [
    {
      label: 'Total de Créditos',
      value: totalCreditos,
      formattedValue: formatCurrency(totalCreditos),
      icon: 'ArrowUpCircle',
      color: '#22c55e',
    },
    {
      label: 'Total de Débitos',
      value: totalDebitos,
      formattedValue: formatCurrency(totalDebitos),
      icon: 'ArrowDownCircle',
      color: '#ef4444',
    },
    {
      label: 'Saldo Disponível',
      value: saldoDisponivel,
      formattedValue: formatCurrency(saldoDisponivel),
      icon: 'Wallet',
      color: saldoDisponivel >= 0 ? '#10b981' : '#dc2626',
    },
    {
      label: 'Saldo Pendente',
      value: saldoPendente,
      formattedValue: formatCurrency(saldoPendente),
      icon: 'Clock',
      color: '#f59e0b',
    },
  ];
};

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Exporta dados para CSV
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void => {
  if (data.length === 0) return;
  
  const defaultHeaders = Object.keys(data[0]);
  const headerKeys = headers || Object.fromEntries(defaultHeaders.map(k => [k, k]));
  const headerNames = Object.values(headerKeys);
  
  const csvRows = [
    headerNames.join(';'),
    ...data.map(row => 
      defaultHeaders.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(';')) {
          return `"${value}"`;
        }
        return String(value);
      }).join(';')
    )
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Exporta dados para XLSX (usando HTML table)
 */
export const exportToXLSX = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Relatório'
): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:Worksheet ss:Name="${sheetName}">
              <x:Range>
                <x:Formula>="${sheetName}"</x:Formula>
              </x:Range>
            </x:Worksheet>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" style="border-collapse: collapse;">
          <tr style="background-color: #f3f4f6;">
            ${headers.map(h => `<th style="padding: 8px; border: 1px solid #d1d5db;">${h}</th>`).join('')}
          </tr>
          ${data.map(row => `
            <tr>
              ${headers.map(h => {
                const value = row[h];
                const cellValue = value === null || value === undefined ? '' : String(value);
                return `<td style="padding: 8px; border: 1px solid #d1d5db;">${cellValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ============================================
// EMPTY STATE & LOADING
// ============================================

/**
 * Mensagem de estado vazio
 */
export const getEmptyStateMessage = (reportType: string): string => {
  const messages: Record<string, string> = {
    producao: 'Nenhuma produção encontrada para o período selecionado.',
    comissoes: 'Nenhuma comissão encontrada para o período selecionado.',
    consolidado: 'Nenhum dado consolidado para exibir.',
    analitico: 'Nenhum registro encontrado para os filtros selecionados.',
    financeiro: 'Nenhuma transação financeira encontrada.',
    parceiros: 'Nenhum parceiro encontrado.',
    usuarios: 'Nenhum usuário encontrado.',
    funil: 'Nenhum dado de funil para exibir.',
  };
  
  return messages[reportType] || 'Nenhum dado encontrado.';
};

/**
 * Título do estado vazio
 */
export const getEmptyStateTitle = (reportType: string): string => {
  const titles: Record<string, string> = {
    producao: 'Sem Produção',
    comissoes: 'Sem Comissões',
    consolidado: 'Sem Dados Consolidados',
    analitico: 'Nenhum Resultado',
    financeiro: 'Sem Transações',
    parceiros: 'Sem Parceiros',
    usuarios: 'Sem Usuários',
    funil: 'Funil Vazio',
  };
  
  return titles[reportType] || 'Sem Dados';
};

export default {
  getPeriodStartDate,
  formatDate,
  formatCurrency,
  formatNumber,
  formatPercent,
  maskCPF,
  maskCNPJ,
  maskDocument,
  calculateConversionRate,
  calculateAverageTicket,
  calculateCommission,
  calculateVariation,
  filterByPeriod,
  filterByProduct,
  filterByPartner,
  filterByStatus,
  filterBySearch,
  groupBy,
  toConsolidatedData,
  calculateProductionKPIs,
  calculateFinancialKPIs,
  exportToCSV,
  exportToXLSX,
  getEmptyStateMessage,
  getEmptyStateTitle,
};
