// FINQZ PRO - Data Adapter
// Camada de compatibilidade temporaria para consumers legados.
// Nao utiliza localStorage nem persiste estado operacional.

import type {
  ClienteResponse,
  OportunidadeResponse,
} from '../types/api';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const clienteSeed: ClienteResponse[] = [];
const oportunidadeSeed: OportunidadeResponse[] = [];

const nextNumericId = (items: Array<{ id: number }>): number =>
  Math.max(0, ...items.map((item) => item.id)) + 1;

export const clientesAdapter = {
  getAll: (): ClienteResponse[] => clone(clienteSeed),
  getById: (id: number): ClienteResponse | undefined => clientesAdapter.getAll().find((cliente) => cliente.id === id),
  save: (data: ClienteResponse[]): void => {
    clienteSeed.splice(0, clienteSeed.length, ...clone(data));
  },
  create: (cliente: Omit<ClienteResponse, 'id' | 'created_at' | 'updated_at'>): ClienteResponse => {
    const newCliente: ClienteResponse = {
      ...cliente,
      id: nextNumericId(clienteSeed),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    clienteSeed.push(clone(newCliente));
    return newCliente;
  },
  update: (id: number, data: Partial<ClienteResponse>): ClienteResponse | undefined => {
    const index = clienteSeed.findIndex((cliente) => cliente.id === id);
    if (index < 0) return undefined;

    const updated = { ...clienteSeed[index], ...data, updated_at: Date.now() };
    clienteSeed[index] = clone(updated);
    return updated;
  },
  delete: (id: number): boolean => {
    const initialLength = clienteSeed.length;
    for (let index = clienteSeed.length - 1; index >= 0; index -= 1) {
      if (clienteSeed[index]?.id === id) {
        clienteSeed.splice(index, 1);
      }
    }
    return clienteSeed.length !== initialLength;
  },
};

export const oportunidadesAdapter = {
  getAll: (): OportunidadeResponse[] => clone(oportunidadeSeed),
  getById: (id: number): OportunidadeResponse | undefined => oportunidadesAdapter.getAll().find((oportunidade) => oportunidade.id === id),
  save: (data: OportunidadeResponse[]): void => {
    oportunidadeSeed.splice(0, oportunidadeSeed.length, ...clone(data));
  },
  create: (data: Omit<OportunidadeResponse, 'id' | 'created_at' | 'updated_at'>): OportunidadeResponse => {
    const newItem: OportunidadeResponse = {
      ...data,
      id: nextNumericId(oportunidadeSeed),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    oportunidadeSeed.push(clone(newItem));
    return newItem;
  },
  update: (id: number, data: Partial<OportunidadeResponse>): OportunidadeResponse | undefined => {
    const index = oportunidadeSeed.findIndex((oportunidade) => oportunidade.id === id);
    if (index < 0) return undefined;

    const updated = { ...oportunidadeSeed[index], ...data, updated_at: Date.now() };
    oportunidadeSeed[index] = clone(updated);
    return updated;
  },
  delete: (id: number): boolean => {
    const initialLength = oportunidadeSeed.length;
    for (let index = oportunidadeSeed.length - 1; index >= 0; index -= 1) {
      if (oportunidadeSeed[index]?.id === id) {
        oportunidadeSeed.splice(index, 1);
      }
    }
    return oportunidadeSeed.length !== initialLength;
  },
};

export default {
  clientes: clientesAdapter,
  oportunidades: oportunidadesAdapter,
};
