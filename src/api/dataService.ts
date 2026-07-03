// FINQZ PRO - Data Service
// Serviço unificado para acesso a dados oficiais e compatibilidade transitória.
import { USE_MOCKS } from '../config/environment';
import { api } from '../api/client';
import { clientesApi } from '../api/modules/clientes.api';
import type {
  ClienteResponse,
  OportunidadeResponse,
  ParceiroResponse,
  AutomacaoResponse,
  TransacaoFinanceiraResponse,
  DashboardKPIsResponse,
  DashboardProducaoResponse,
  DashboardFunilResponse,
  PaginationParams,
  FilterParams,
} from '../types/api';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Converte parâmetros para query string
 */
const buildParams = (params?: PaginationParams & FilterParams): string => {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

// ============================================
// DATA SERVICE
// ============================================

/**
 * Serviço de dados unificado
 * Prioriza contratos oficiais para CRM e Opportunity.
 */
export const dataService = {
  // ========================================
  // CLIENTES
  // ========================================
  
  clientes: {
    list: async (params?: FilterParams): Promise<ClienteResponse[]> => {
      const response = await clientesApi.getAll(params);
      return Array.isArray(response) ? response : [];
    },
    
    getById: async (id: number): Promise<ClienteResponse | null> => {
      return clientesApi.getById(id);
    },
    
    create: async (data: Omit<ClienteResponse, 'id' | 'created_at' | 'updated_at'>): Promise<ClienteResponse> => {
      return clientesApi.create(data);
    },
    
    update: async (id: number, data: Partial<ClienteResponse>): Promise<ClienteResponse> => {
      return clientesApi.update(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      return clientesApi.delete(id);
    },
  },

  // ========================================
  // OPORTUNIDADES
  // ========================================
  
  oportunidades: {
    list: async (params?: FilterParams): Promise<OportunidadeResponse[]> => {
      const response = await api.getOportunidades(params as any);
      return Array.isArray(response?.data) ? response.data : [];
    },
    
    getById: async (id: number): Promise<OportunidadeResponse | null> => {
      return api.getOportunidade(id);
    },
    
    create: async (data: Omit<OportunidadeResponse, 'id' | 'created_at' | 'updated_at'>): Promise<OportunidadeResponse> => {
      return api.createOportunidade(data);
    },
    
    update: async (id: number, data: Partial<OportunidadeResponse>): Promise<OportunidadeResponse> => {
      return api.updateOportunidade(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      return api.deleteOportunidade(id);
    },
  },

  // ========================================
  // PARCEIROS
  // ========================================
  
  parceiros: {
    list: async (params?: FilterParams): Promise<ParceiroResponse[]> => {
      if (USE_MOCKS) {
        return [];
      }
      const query = buildParams(params);
      return api.getParceiros(query);
    },
    
    getById: async (id: number): Promise<ParceiroResponse | null> => {
      if (USE_MOCKS) {
        return null;
      }
      return api.getParceiro(id);
    },
    
    create: async (data: any): Promise<ParceiroResponse> => {
      if (USE_MOCKS) {
        throw new Error('Não disponível em modo mock');
      }
      return api.createParceiro(data);
    },
    
    update: async (id: number, data: any): Promise<ParceiroResponse> => {
      if (USE_MOCKS) {
        throw new Error('Não disponível em modo mock');
      }
      return api.updateParceiro(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      if (USE_MOCKS) {
        throw new Error('Não disponível em modo mock');
      }
      return api.deleteParceiro(id);
    },
  },

  // ========================================
  // AUTOMACOES
  // ========================================
  
  automacoes: {
    list: async (): Promise<AutomacaoResponse[]> => {
      if (USE_MOCKS) {
        return [];
      }
      return api.getAutomacoes();
    },
    
    create: async (data: any): Promise<AutomacaoResponse> => {
      if (USE_MOCKS) {
        throw new Error('Não disponível em modo mock');
      }
      return api.createAutomacao(data);
    },
    
    update: async (id: number, data: any): Promise<AutomacaoResponse> => {
      if (USE_MOCKS) {
        throw new Error('Não disponível em modo mock');
      }
      return api.updateAutomacao(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      if (USE_MOCKS) {
        throw new Error('Não disponível em modo mock');
      }
      return api.deleteAutomacao(id);
    },
  },

  // ========================================
  // DASHBOARD
  // ========================================
  
  dashboard: {
    getKPIs: async (): Promise<DashboardKPIsResponse> => {
      if (USE_MOCKS) {
        return {
          totalClientes: 150,
          clientesAtivos: 120,
          totalOportunidades: 85,
          oportunidadesAbertas: 42,
          valorTotalOportunidades: 1250000,
          taxaConversao: 23.5,
          valorComissao: 87500,
          ranking: [],
        };
      }
      return api.getDashboardKPIs();
    },
    
    getProducao: async (periodo?: string): Promise<DashboardProducaoResponse> => {
      if (USE_MOCKS) {
        return {
          periodo: periodo || 'mes',
          producao: [
            { mes: 'Jan', valor: 150000, meta: 100000 },
            { mes: 'Fev', valor: 180000, meta: 100000 },
            { mes: 'Mar', valor: 220000, meta: 120000 },
          ],
          comparacao: { anterior: 150000, atual: 220000, variacao: 46.6 },
        };
      }
      return api.getDashboardProducao(periodo);
    },
    
    getFunil: async (): Promise<DashboardFunilResponse> => {
      if (USE_MOCKS) {
        return {
          etapas: [
            { nome: 'Novo Lead', quantidade: 50, valor: 0, taxa: 100 },
            { nome: 'Contato', quantidade: 35, valor: 0, taxa: 70 },
            { nome: 'Proposta', quantidade: 20, valor: 500000, taxa: 40 },
            { nome: 'Negociação', quantidade: 10, valor: 300000, taxa: 20 },
            { nome: 'Fechado', quantidade: 5, valor: 150000, taxa: 10 },
          ],
        };
      }
      return api.getDashboardFunil();
    },
  },
};

// ============================================
// EXPORTS
// ============================================

export default dataService;
