// FINQZ PRO - Parceiros API Module
// Endpoints para gerenciamento de parceiros

import { apiCall, buildQueryString, ApiResult } from './base';
import type { PartnerType, PartnerStatus, Partner, PartnerFilter } from '../../types';

// ============================================
// TYPES
// ============================================

// Filtros para listagem de parceiros
export interface ParceiroFilters extends PartnerFilter {
  includeChildren?: boolean;
}

// Payload para criar parceiro
export interface CreateParceiroPayload {
  nome: string;
  tipo: PartnerType;
  cnpj?: string;
  responsavel?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: PartnerStatus;
  parent_id?: number;
  codigo?: string;
}

// Payload para atualizar parceiro
export interface UpdateParceiroPayload extends Partial<CreateParceiroPayload> {}

// ============================================
// API FUNCTIONS
// ============================================

export const parceirosApi = {
  /**
   * Get all parceiros with optional filters
   * Suporta filtro hierárquico com includeChildren
   */
  async getAll(filters?: ParceiroFilters): Promise<Partner[]> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : '';
    return apiCall<Partner[]>(`/api/parceiros${query}`);
  },

  /**
   * Get single parceiro by ID
   */
  async getById(id: number): Promise<Partner> {
    return apiCall<Partner>(`/api/parceiros/${id}`);
  },

  /**
   * Get parceiros em formato de árvore hierárquica
   */
  async getTree(): Promise<Partner[]> {
    return apiCall<Partner[]>('/api/parceiros/tree');
  },

  /**
   * Get parceiros por tipo (COMPANY, FRANQUIA, FRANQUEADO)
   */
  async getByType(tipo: PartnerType): Promise<Partner[]> {
    return apiCall<Partner[]>(`/api/parceiros?tipo=${tipo}`);
  },

  /**
   * Get filhos de um parceiro específico
   */
  async getChildren(parentId: number): Promise<Partner[]> {
    return apiCall<Partner[]>(`/api/parceiros?parent_id=${parentId}`);
  },

  /**
   * Create new parceiro
   * Valida parent_id conforme tipo:
   * - COMPANY: não pode ter parent_id
   * - FRANQUIA: parent_id deve ser COMPANY
   * - FRANQUEADO: parent_id deve ser FRANQUIA
   */
  async create(data: CreateParceiroPayload): Promise<Partner> {
    // Validação de hierarquia
    if (data.tipo === 'COMPANY' && data.parent_id) {
      throw new Error('Empresa matriz não pode ter parceiro pai');
    }
    if (data.tipo === 'FRANQUIA' && data.parent_id) {
      // O parent deve ser validado no backend
    }
    
    return apiCall<Partner>('/api/parceiros', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing parceiro
   */
  async update(id: number, data: UpdateParceiroPayload): Promise<Partner> {
    return apiCall<Partner>(`/api/parceiros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete parceiro
   * Não permite exclusão se houver filhos
   */
  async delete(id: number): Promise<void> {
    return apiCall<void>(`/api/parceiros/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get parceiros ativos para selects/filtros
   */
  async getAtivos(): Promise<Partner[]> {
    return apiCall<Partner[]>('/api/parceiros?status=ativo');
  },

  /**
   * Get parceiros por escopo do usuário
   * Retorna parceiros que o usuário pode acessar
   */
  async getByScope(scope: string, scopePartnerId?: number): Promise<Partner[]> {
    let query = '';
    if (scope === 'GLOBAL') {
      query = '';
    } else if (scope === 'COMPANY' && scopePartnerId) {
      query = `?includeChildren=true&parent_id=${scopePartnerId}`;
    } else if (scope === 'FRANQUIA' && scopePartnerId) {
      query = `?parent_id=${scopePartnerId}`;
    } else if (scope === 'FRANQUEADO' && scopePartnerId) {
      query = `?id=${scopePartnerId}`;
    }
    return apiCall<Partner[]>(`/api/parceiros${query}`);
  },
};
