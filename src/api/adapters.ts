// FINQZ PRO - Data Adapter
// Adapter para compatibilidade entre dados da API e localStorage
// Usado como fallback quando API não está disponível

import { USE_MOCKS, STORAGE_KEYS } from '../config/environment';
import type { 
  ClienteResponse, 
  OportunidadeResponse, 
  ParceiroResponse, 
  ProdutoResponse,
  UsuarioResponse,
  AutomacaoResponse,
  TransacaoFinanceiraResponse
} from '../types/api';

// ============================================
// STORAGE ADAPTER
// ============================================

/**
 * Obtém dados do localStorage com fallback para array vazio
 */
const getFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : defaultValue;
    }
  } catch (error) {
    console.error(`[Storage] Erro ao ler ${key}:`, error);
  }
  return defaultValue;
};

/**
 * Salva dados no localStorage
 */
const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`[Storage] Erro ao salvar ${key}:`, error);
  }
};

// ============================================
// ENTITY STORAGE KEYS
// ============================================

const STORAGE_ENTITY_KEYS = {
  clientes: 'finqz_clientes',
  oportunidades: 'finqz_oportunidades',
  oportunidadesKanban: 'finqz_oportunidades_kanban',
  parceiros: 'finqz_parceiros',
  usuarios: 'finqz_usuarios',
  produtos: 'finqz_produtos',
  transacoesFinanceiras: 'finqz_transacoes_financeiras',
  automacoes: 'finqz_automacoes',
  estruturaComercial: 'finqz_estrutura_comercial',
  roteirosOperacionais: 'finqz_roteiros_operacionais',
};

// ============================================
// DEFAULT DATA
// ============================================

const defaultClientes: ClienteResponse[] = [
  { id: 1, nome: "João Silva", cpf_cnpj: "12345678901", email: "joao@email.com", telefone: "11999999999", status: "ativo", created_at: Date.now(), updated_at: Date.now() },
  { id: 2, nome: "Maria Santos", cpf_cnpj: "23456789012", email: "maria@email.com", telefone: "11988888888", status: "ativo", created_at: Date.now(), updated_at: Date.now() },
  { id: 3, nome: "Pedro Costa", cpf_cnpj: "34567890123", email: "pedro@email.com", telefone: "11977777777", status: "ativo", created_at: Date.now(), updated_at: Date.now() },
];

const defaultOportunidades: OportunidadeResponse[] = [
  { id: 1, nome: "João Silva", telefone: "11999999999", produto: "Empréstimo Pessoal", valor: 15000, etapa: "novo_lead", created_at: Date.now(), updated_at: Date.now() },
  { id: 2, nome: "Maria Santos", telefone: "11988888888", produto: "Crédito Consignado", valor: 25000, etapa: "negociacao", created_at: Date.now(), updated_at: Date.now() },
  { id: 3, nome: "Pedro Costa", telefone: "11977777777", produto: "Empréstimo Pessoal", valor: 10000, etapa: "pendencia", created_at: Date.now(), updated_at: Date.now() },
];

const defaultProdutos: ProdutoResponse[] = [
  { id: 1, nome: "Empréstimo Pessoal", descricao: "Empréstimo sem garantia", pipeline: "default", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 2, nome: "Crédito Consignado", descricao: "Crédito com desconto em folha", pipeline: "default", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 3, nome: "Cartão de Crédito", descricao: "Cartão sem anuidade", pipeline: "default", ativo: 1, created_at: Date.now(), updated_at: Date.now() },
];

// ============================================
// DATA ADAPTER
// ============================================

/**
 * Adapter para dados de Clientes
 */
export const clientesAdapter = {
  getAll: (): ClienteResponse[] => {
    if (USE_MOCKS) {
      return getFromStorage<ClienteResponse>(STORAGE_ENTITY_KEYS.clientes, defaultClientes);
    }
    return defaultClientes;
  },
  
  getById: (id: number): ClienteResponse | undefined => {
    const items = clientesAdapter.getAll();
    return items.find(c => c.id === id);
  },
  
  save: (data: ClienteResponse[]): void => {
    saveToStorage(STORAGE_ENTITY_KEYS.clientes, data);
  },
  
  create: (cliente: Omit<ClienteResponse, 'id' | 'created_at' | 'updated_at'>): ClienteResponse => {
    const items = clientesAdapter.getAll();
    const newCliente: ClienteResponse = {
      ...cliente,
      id: Math.max(0, ...items.map(c => c.id)) + 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    items.push(newCliente);
    clientesAdapter.save(items);
    return newCliente;
  },
  
  update: (id: number, data: Partial<ClienteResponse>): ClienteResponse | undefined => {
    const items = clientesAdapter.getAll();
    const index = items.findIndex(c => c.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data, updated_at: Date.now() };
      clientesAdapter.save(items);
      return items[index];
    }
    return undefined;
  },
  
  delete: (id: number): boolean => {
    const items = clientesAdapter.getAll();
    const filtered = items.filter(c => c.id !== id);
    if (filtered.length !== items.length) {
      clientesAdapter.save(filtered);
      return true;
    }
    return false;
  },
};

/**
 * Adapter para dados de Oportunidades
 */
export const oportunidadesAdapter = {
  getAll: (): OportunidadeResponse[] => {
    if (USE_MOCKS) {
      return getFromStorage<OportunidadeResponse>(STORAGE_ENTITY_KEYS.oportunidades, defaultOportunidades);
    }
    return defaultOportunidades;
  },
  
  getById: (id: number): OportunidadeResponse | undefined => {
    const items = oportunidadesAdapter.getAll();
    return items.find(o => o.id === id);
  },
  
  save: (data: OportunidadeResponse[]): void => {
    saveToStorage(STORAGE_ENTITY_KEYS.oportunidades, data);
  },
  
  create: (data: Omit<OportunidadeResponse, 'id' | 'created_at' | 'updated_at'>): OportunidadeResponse => {
    const items = oportunidadesAdapter.getAll();
    const newItem: OportunidadeResponse = {
      ...data,
      id: Math.max(0, ...items.map(o => o.id)) + 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    items.push(newItem);
    oportunidadesAdapter.save(items);
    return newItem;
  },
  
  update: (id: number, data: Partial<OportunidadeResponse>): OportunidadeResponse | undefined => {
    const items = oportunidadesAdapter.getAll();
    const index = items.findIndex(o => o.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data, updated_at: Date.now() };
      oportunidadesAdapter.save(items);
      return items[index];
    }
    return undefined;
  },
  
  delete: (id: number): boolean => {
    const items = oportunidadesAdapter.getAll();
    const filtered = items.filter(o => o.id !== id);
    if (filtered.length !== items.length) {
      oportunidadesAdapter.save(filtered);
      return true;
    }
    return false;
  },
};

/**
 * Adapter para dados de Produtos
 */
export const produtosAdapter = {
  getAll: (): ProdutoResponse[] => {
    if (USE_MOCKS) {
      return getFromStorage<ProdutoResponse>(STORAGE_ENTITY_KEYS.produtos, defaultProdutos);
    }
    return defaultProdutos;
  },
  
  getById: (id: number): ProdutoResponse | undefined => {
    const items = produtosAdapter.getAll();
    return items.find(p => p.id === id);
  },
  
  save: (data: ProdutoResponse[]): void => {
    saveToStorage(STORAGE_ENTITY_KEYS.produtos, data);
  },
  
  create: (data: Omit<ProdutoResponse, 'id' | 'created_at' | 'updated_at'>): ProdutoResponse => {
    const items = produtosAdapter.getAll();
    const newItem: ProdutoResponse = {
      ...data,
      id: Math.max(0, ...items.map(p => p.id)) + 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    items.push(newItem);
    produtosAdapter.save(items);
    return newItem;
  },
  
  update: (id: number, data: Partial<ProdutoResponse>): ProdutoResponse | undefined => {
    const items = produtosAdapter.getAll();
    const index = items.findIndex(p => p.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data, updated_at: Date.now() };
      produtosAdapter.save(items);
      return items[index];
    }
    return undefined;
  },
  
  delete: (id: number): boolean => {
    const items = produtosAdapter.getAll();
    const filtered = items.filter(p => p.id !== id);
    if (filtered.length !== items.length) {
      produtosAdapter.save(filtered);
      return true;
    }
    return false;
  },
};

// ============================================
// EXPORTS
// ============================================

export default {
  clientes: clientesAdapter,
  oportunidades: oportunidadesAdapter,
  produtos: produtosAdapter,
};
