// FINQZ PRO - Data Service
// Serviço unificado para acesso a dados
// Usa API real quando disponível, fallback local apenas em desenvolvimento

import { USE_MOCKS } from '../config/environment';
import { api } from '../api/client';
import adapters from '../api/adapters';
import type {
  ClienteResponse,
  OportunidadeResponse,
  ParceiroResponse,
  ProdutoResponse,
  AutomacaoResponse,
  TransacaoFinanceiraResponse,
  DashboardKPIsResponse,
  DashboardProducaoResponse,
  DashboardFunilResponse,
  ApiResponse,
  PaginatedResponse,
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
 * Alterna entre API real e dados locais baseado na configuração
 */
export const dataService = {
  // ========================================
  // CLIENTES
  // ========================================
  
  clientes: {
    list: async (params?: FilterParams): Promise<ClienteResponse[]> => {
      if (USE_MOCKS) {
        return adapters.clientes.getAll();
      }
      const query = buildParams(params);
      const response = await api.getClientes(query);
      return response.data || [];
    },
    
    getById: async (id: number): Promise<ClienteResponse | null> => {
      if (USE_MOCKS) {
        return adapters.clientes.getById(id) || null;
      }
      return api.getCliente(id);
    },
    
    create: async (data: Omit<ClienteResponse, 'id' | 'created_at' | 'updated_at'>): Promise<ClienteResponse> => {
      if (USE_MOCKS) {
        return adapters.clientes.create(data);
      }
      return api.createCliente(data);
    },
    
    update: async (id: number, data: Partial<ClienteResponse>): Promise<ClienteResponse> => {
      if (USE_MOCKS) {
        const updated = adapters.clientes.update(id, data);
        if (!updated) throw new Error('Cliente não encontrado');
        return updated;
      }
      return api.updateCliente(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      if (USE_MOCKS) {
        adapters.clientes.delete(id);
        return;
      }
      return api.deleteCliente(id);
    },
  },

  // ========================================
  // OPORTUNIDADES
  // ========================================
  
  oportunidades: {
    list: async (params?: FilterParams): Promise<OportunidadeResponse[]> => {
      if (USE_MOCKS) {
        return adapters.oportunidades.getAll();
      }
      const response = await api.getOportunidades(params);
      return response.data || [];
    },
    
    getById: async (id: number): Promise<OportunidadeResponse | null> => {
      if (USE_MOCKS) {
        return adapters.oportunidades.getById(id) || null;
      }
      return api.getOportunidade(id);
    },
    
    create: async (data: Omit<OportunidadeResponse, 'id' | 'created_at' | 'updated_at'>): Promise<OportunidadeResponse> => {
      if (USE_MOCKS) {
        return adapters.oportunidades.create(data);
      }
      return api.createOportunidade(data);
    },
    
    update: async (id: number, data: Partial<OportunidadeResponse>): Promise<OportunidadeResponse> => {
      if (USE_MOCKS) {
        const updated = adapters.oportunidades.update(id, data);
        if (!updated) throw new Error('Oportunidade não encontrada');
        return updated;
      }
      return api.updateOportunidade(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      if (USE_MOCKS) {
        adapters.oportunidades.delete(id);
        return;
      }
      return api.deleteOportunidade(id);
    },
    
    getPipeline: async (produtoId?: string): Promise<any> => {
      if (USE_MOCKS) {
        return { etapas: [], colunas: [] };
      }
      return api.getOportunidadesPipeline(produtoId);
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
  // PRODUTOS
  // ========================================
  
  produtos: {
    list: async (): Promise<ProdutoResponse[]> => {
      if (USE_MOCKS) {
        return adapters.produtos.getAll();
      }
      return api.getProdutos();
    },
    
    getById: async (id: number): Promise<ProdutoResponse | null> => {
      if (USE_MOCKS) {
        return adapters.produtos.getById(id) || null;
      }
      return api.getProduto(id);
    },
    
    create: async (data: Omit<ProdutoResponse, 'id' | 'created_at' | 'updated_at'>): Promise<ProdutoResponse> => {
      if (USE_MOCKS) {
        return adapters.produtos.create(data);
      }
      return api.createProduto(data);
    },
    
    update: async (id: number, data: Partial<ProdutoResponse>): Promise<ProdutoResponse> => {
      if (USE_MOCKS) {
        const updated = adapters.produtos.update(id, data);
        if (!updated) throw new Error('Produto não encontrado');
        return updated;
      }
      return api.updateProduto(id, data);
    },
    
    delete: async (id: number): Promise<void> => {
      if (USE_MOCKS) {
        adapters.produtos.delete(id);
        return;
      }
      return api.deleteProduto(id);
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
