/**
 * Catálogo de Crédito PF - Repository/Serviço
 * Camada de adaptação local para futura integração com API
 * 
 * Atualmente retorna dados do creditPfCatalog local
 * Futuramente pode ser substituído por chamada real via fetch/axios
 */

import {
  creditPfCatalog,
  CreditProduct,
  Subproduct,
  getActiveProducts,
  getPipelineOptions,
  getProductOptions,
  getSubproductsByProductId,
  getModalitiesByProductAndSubproduct,
  getProductById,
  getProductByCode,
  getSubproductById,
  getPipelineByProductId,
  getModalityLabel
} from './creditPfCatalog';

// ============================================
// REPOSITÓRIO DE CATÁLOGO
// ============================================

/**
 * Lista todos os produtos de crédito ativos
 * Futura API: GET /api/catalog/credit-products
 */
export const listCreditProducts = async (): Promise<CreditProduct[]> => {
  // TODO: Substituir por chamada API futura
  // const response = await fetch('/api/catalog/credit-products');
  // return response.json();
  
  return getActiveProducts();
};

/**
 * Lista todas as opções de pipeline
 * Futura API: GET /api/catalog/pipelines
 */
export const listPipelines = async () => {
  // TODO: Substituir por chamada API futura
  // const response = await fetch('/api/catalog/pipelines');
  // return response.json();
  
  return getPipelineOptions();
};

/**
 * Obtém produto por ID
 * Futura API: GET /api/catalog/products/:productId
 */
export const getProductByIdAsync = async (productId: string): Promise<CreditProduct | undefined> => {
  // TODO: Substituir por chamada API futura
  // const response = await fetch(`/api/catalog/products/${productId}`);
  // return response.json();
  
  return getProductById(productId);
};

/**
 * Lista subprodutos de um produto
 * Futura API: GET /api/catalog/products/:productId/subproducts
 */
export const getSubproducts = async (productId: string): Promise<Subproduct[]> => {
  // TODO: Substituir por chamada API futura
  // const response = await fetch(`/api/catalog/products/${productId}/subproducts`);
  // return response.json();
  
  return getSubproductsByProductId(productId);
};

/**
 * Lista modalidades de um subproduto
 * Futura API: GET /api/catalog/products/:productId/subproducts/:subproductId/modalities
 */
export const getModalities = async (productId: string, subproductId: string): Promise<string[]> => {
  // TODO: Substituir por chamada API futura
  // const response = await fetch(`/api/catalog/products/${productId}/subproducts/${subproductId}/modalities`);
  // return response.json();
  
  return getModalitiesByProductAndSubproduct(productId, subproductId);
};

// ============================================
// EMISSOR DE EVENTOS PARA AUTOMAÇÕES
// ============================================

export interface OpportunityEventPayload {
  eventName: string;
  opportunityId: string;
  productCode: string;
  subproductCode?: string;
  modality?: string;
  pipelineCode: string;
  catalogVersion: number;
  createdAt: string;
  // Campos adicionais para uso futuro
  productId?: string;
  subproductId?: string;
  partnerId?: string;
  userId?: string;
}

/**
 * Emite evento para automações futuras
 * Por enquanto é uma função segura/no-op
 * 
 * Futura implementação pode enviar para um barramento de eventos,
 * webhook, ou sistema de automação como Zapier, Make, etc.
 */
export const emitOpportunityEvent = (
  eventName: string,
  payload: OpportunityEventPayload
): void => {
  void eventName;
  void payload;
  
  // TODO: Implementar envio para sistema de eventos futuro
  // Exemplos de implementação futura:
  // 
  // 1. Envio para webhook
  // await fetch('/api/webhooks/automation', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ event: eventName, data: payload })
  // });
  //
  // 2. Envio para barramento de eventos (Kafka, RabbitMQ, etc.)
  // await eventBus.publish('opportunity.events', { eventName, payload });
  //
  // 3. Envio para serviço de automação externo
  // await automationService.trigger(eventName, payload);
};

/**
 * Cria payload padrão para eventos de oportunidade
 */
export const createOpportunityEventPayload = (
  eventName: string,
  opportunityId: string,
  productCode: string,
  pipelineCode: string,
  additionalFields?: Partial<OpportunityEventPayload>
): OpportunityEventPayload => {
  return {
    eventName,
    opportunityId,
    productCode,
    pipelineCode,
    catalogVersion: 1, // Versão atual do catálogo
    createdAt: new Date().toISOString(),
    ...additionalFields
  };
};

// ============================================
// EXPORTS
// ============================================

// ============================================
// ETAPAS PADRÃO POR PIPELINE (PF Credit)
// ============================================

/**
 * Etapas padrão para cada pipeline PF Credit
 * Usado como fallback quando não há configuração salva
 */
export const defaultPipelineStages: Record<string, string[]> = {
  "pipeline-consignado": [
    "Novo Lead",
    "Contato",
    "Consulta Margem",
    "Análise",
    "Aprovação",
    "Formalização",
    "Averbação",
    "Liberação",
    "Encerrado"
  ],
  "pipeline-credito-pessoal-cdc": [
    "Novo Lead",
    "Contato",
    "Análise de Crédito",
    "Aprovação",
    "Formalização",
    "Liberação",
    "Encerrado"
  ],
  "pipeline-emprestimo-com-garantia": [
    "Novo Lead",
    "Contato",
    "Análise de Crédito",
    "Avaliação da Garantia",
    "Aprovação",
    "Formalização",
    "Registro",
    "Liberação",
    "Encerrado"
  ],
  "pipeline-financiamento": [
    "Novo Lead",
    "Contato",
    "Análise de Crédito",
    "Avaliação do Bem",
    "Aprovação",
    "Formalização",
    "Liberação",
    "Encerrado"
  ],
  "pipeline-cartao": [
    "Novo Lead",
    "Contato",
    "Análise de Limite",
    "Aprovação",
    "Emissão",
    "Ativação",
    "Encerrado"
  ],
  "pipeline-antecipacao": [
    "Novo Lead",
    "Contato",
    "Consulta Elegibilidade",
    "Aprovação",
    "Formalização",
    "Liberação",
    "Encerrado"
  ],
  "pipeline-energia": [
    "Novo Lead",
    "Contato",
    "Simulação",
    "Análise",
    "Proposta",
    "Formalização",
    "Ativação",
    "Encerrado"
  ],
  "pipeline-seguro": [
    "Novo Lead",
    "Contato",
    "Cotação",
    "Proposta",
    "Emissão da Apólice",
    "Encerrado"
  ],
  "pipeline-consorcio": [
    "Novo Lead",
    "Contato",
    "Simulação",
    "Proposta",
    "Formalização",
    "Cota Ativa",
    "Encerrado"
  ]
};

// ============================================
// PERSISTÊNCIA DE CONFIGURAÇÕES DE PIPELINE
// ============================================

const PIPELINE_SETTINGS_KEY = 'finqz_pipeline_settings';

export interface PipelineSettings {
  pipelineId: string;
  pipelineCode: string;
  pipelineName: string;
  active: boolean;
  stages: string[];
  updatedAt: string;
}

/**
 * Carrega configurações de pipeline do localStorage
 * Com fallback seguro para defaultPipelineStages
 */
export const loadPipelineSettings = (): Record<string, PipelineSettings> => {
  try {
    const stored = localStorage.getItem(PIPELINE_SETTINGS_KEY);
    if (!stored) {
      return getDefaultPipelineSettings();
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      console.warn('[pipeline-settings] localStorage corrompido, usando padrão');
      localStorage.removeItem(PIPELINE_SETTINGS_KEY);
      return getDefaultPipelineSettings();
    }
    return parsed;
  } catch (error) {
    console.error('[pipeline-settings] Erro ao carregar, usando padrão:', error);
    return getDefaultPipelineSettings();
  }
};

/**
 * Salva configurações de pipeline no localStorage
 */
export const savePipelineSettings = (settings: Record<string, PipelineSettings>): void => {
  try {
    localStorage.setItem(PIPELINE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[pipeline-settings] Erro ao salvar:', error);
  }
};

/**
 * Gera configurações padrão a partir do catálogo
 */
export const getDefaultPipelineSettings = (): Record<string, PipelineSettings> => {
  const pipelineOptions = getPipelineOptions();
  const settings: Record<string, PipelineSettings> = {};

  pipelineOptions.forEach((option) => {
    if (!option.id || !option.code || !option.name) return;
    
    // Filtrar pipelines legados/duplicados
    if (['FINQZ Auto', 'FINQZ Consignado', 'FGTS'].includes(option.name)) return;

    const defaultStages = defaultPipelineStages[option.id] || [
      "Novo Lead",
      "Contato",
      "Análise",
      "Aprovação",
      "Encerrado"
    ];

    settings[option.id] = {
      pipelineId: option.id,
      pipelineCode: option.code,
      pipelineName: option.name,
      active: true,
      stages: defaultStages,
      updatedAt: new Date().toISOString()
    };
  });

  return settings;
};

/**
 * Obtém as etapas de um pipeline específico
 * Primeiro tenta do localStorage, depois usa padrão
 */
export const getPipelineStages = (pipelineId: string): string[] => {
  const settings = loadPipelineSettings();
  if (settings[pipelineId]?.stages?.length > 0) {
    return settings[pipelineId].stages;
  }
  return defaultPipelineStages[pipelineId] || [
    "Novo Lead",
    "Contato",
    "Análise",
    "Aprovação",
    "Encerrado"
  ];
};

// ============================================
// EXPORTS
// ============================================

export {
  creditPfCatalog,
  getActiveProducts,
  getPipelineOptions,
  getProductOptions,
  getSubproductsByProductId,
  getModalitiesByProductAndSubproduct,
  getProductById,
  getProductByCode,
  getSubproductById,
  getPipelineByProductId,
  getModalityLabel
};
