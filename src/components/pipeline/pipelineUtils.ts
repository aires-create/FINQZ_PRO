/**
 * Pipeline Utilities
 * 
 * Funções utilitárias para manipulação de dados de pipeline.
 */

// Normalizar chave de etapa
export const normalizeKey = (value: any): string => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

// Converter etapa para chave normalizada
export const toStageKey = (stage: any): string => {
  if (typeof stage === 'string') return normalizeKey(stage);
  return normalizeKey(stage?.id || stage?.key || stage?.nome || stage?.label);
};

// Converter etapa para label legível
export const toStageLabel = (stage: any): string => {
  if (typeof stage === 'string') return stage;
  return String(stage?.nome || stage?.label || stage?.id || stage?.key || 'Etapa');
};

// Obter cor padrão para etapa
export const getStageColor = (stageId: string): string => {
  const colors: Record<string, string> = {
    novo_lead: '#3B82F6',
    contato: '#8B5CF6',
    negociacao: '#F59E0B',
    documentacao: '#10B981',
    aceite: '#6366F1',
    contrato_enviado: '#EC4899',
    aguardando_assinatura: '#F97316',
    contrato_assinado: '#14B8A6',
    ativo: '#22C55E',
    formalizacao: '#0EA5E9',
    integrado: '#10B981',
    pendencia: '#EF4444',
    perdido: '#6B7280',
  };
  return colors[normalizeKey(stageId)] || '#6B7280';
};

// Formatar valor monetário
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Filtrar oportunidades por pipeline
export const filterOportunitiesByPipeline = (
  oportunidades: any[],
  pipelineId: string,
  currentPipelineConfig: any
): any[] => {
  if (!Array.isArray(oportunidades)) return [];
  
  return oportunidades.filter((o: any) => {
    if (!o) return false;
    
    // Se currentPipelineConfig não existe, não filtrar
    if (!currentPipelineConfig?.id) return true;
    
    // Se tem pipeline_id, usar ele
    if (o?.pipeline_id) {
      return o.pipeline_id === currentPipelineConfig.id;
    }
    
    // Se tem produto, tentar mapear
    if (o?.produto) {
      const LEGACY_PRODUCT_TO_PIPELINE: Record<string, string> = {
        'Empréstimo Pessoal': 'emprestimo_pessoal',
        'Crédito Consignado': 'credito_consignado',
        'Empréstimo com Garantia': 'emprestimo_com_garantia',
        'Financiamento de Veículo': 'financiamento_veiculo',
        'Assinatura de Veículos': 'assinatura_veiculos',
        'Energia por Assinatura - GD': 'energia_gd',
        'Mercado Livre de Energia - ML': 'mercado_livre_energia',
      };
      const pipelineId = LEGACY_PRODUCT_TO_PIPELINE[o.produto];
      return pipelineId === currentPipelineConfig.id;
    }
    
    // Mostrar dados legados
    return true;
  });
};

// Agrupar oportunidades por etapa
export const groupOportunitiesByStage = (
  oportunidades: any[],
  etapas: any[]
): Record<string, any[]> => {
  const resultado: Record<string, any[]> = {};
  
  for (const etapa of etapas) {
    resultado[etapa.id] = oportunidades.filter(
      op => op?.etapa_id === etapa.id || op?.etapa === etapa.id
    );
  }
  
  return resultado;
};

// Calcular total por etapa
export const calculateTotalsByStage = (
  oportunidadesPorEtapa: Record<string, any[]>
): Record<string, number> => {
  const resultado: Record<string, number> = {};
  
  for (const [etapaId, ops] of Object.entries(oportunidadesPorEtapa)) {
    resultado[etapaId] = ops.reduce((acc, o) => acc + (o.valor || 0), 0);
  }
  
  return resultado;
};
