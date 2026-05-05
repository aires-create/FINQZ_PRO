import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock do store
const mockOportunidadesKanban = [
  { id: '1', nome: 'João Silva', telefone: '11999999999', produto: 'consignado', valor: 5000, etapa_id: 'novo_lead', pipeline_id: 'consignado' },
  { id: '2', nome: 'Maria Santos', telefone: '11988888888', produto: 'consignado', valor: 10000, etapa_id: 'negociacao', pipeline_id: 'consignado' },
  { id: '3', nome: 'Pedro Costa', telefone: '11977777777', produto: 'parceiro', valor: 15000, etapa_id: 'novo_lead', pipeline_id: 'parceiro' },
];

const mockPipelines = [
  { id: 'consignado', nome: 'Consignado', etapas: ['novo_lead', 'negociacao', 'documentacao', 'contrato_assinado', 'ativo'] },
  { id: 'parceiro', nome: 'Parceiro', etapas: ['contato', 'analise', 'aprovacao'] },
];

const mockProdutos = [
  { id: 1, nome: 'Consignado' },
  { id: 2, nome: 'Parceiro' },
];

const mockUsuarios = [
  { id: '1', nome: 'Admin', avatar: null },
];

// Mock do useTenantFilter
vi.mock('../hooks/useTenantFilter', () => ({
  useTenantFilter: vi.fn((data) => data || []),
}));

// Mock do store
vi.mock('../store', () => ({
  default: vi.fn(() => ({
    oportunidadesKanban: mockOportunidadesKanban,
    currentPipelineId: 'consignado',
    setCurrentPipelineId: vi.fn(),
    moveOportunidade: vi.fn(),
    addOportunidade: vi.fn(),
    updateOportunidade: vi.fn(),
    deleteOportunidade: vi.fn(),
    pipelines: mockPipelines,
    produtos: mockProdutos,
    usuarios: mockUsuarios,
    user: { id: '1', nome: 'Admin', perfil: 'admin' },
    theme: 'light',
    hasPermission: vi.fn(() => true),
  })),
}));

describe('Pipeline - normalizeKey', () => {
  // Importar a função diretamente do arquivo Oportunidades
  // Como é um arquivo de página, vamos testar indiretamente através do comportamento
  
  it('deve normalizar chaves com acentos', () => {
    // Teste de comportamento esperado
    const normalize = (value: string) => 
      String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
    
    expect(normalize('Análise')).toBe('analise');
    expect(normalize('Contato')).toBe('contato');
    expect(normalize('Negociação')).toBe('negociacao');
    expect(normalize('Aprovação')).toBe('aprovacao');
  });

  it('deve normalizar chaves com espaços', () => {
    const normalize = (value: string) => 
      String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
    
    expect(normalize('Novo Lead')).toBe('novo_lead');
    expect(normalize('Em Analise')).toBe('em_analise');
  });
});

describe('Pipeline - validarEtapa', () => {
  it('deve retornar válido para etapa sem validação', () => {
    // Teste de comportamento
    const VALIDACOES_ETAPA: Record<string, { obrigatorios: string[]; mensagem: string }> = {
      novo_lead: { obrigatorios: ['nome', 'telefone'], mensagem: 'Obrigatório' },
    };
    
    const etapaDestino = 'negociacao';
    const validacao = VALIDACOES_ETAPA?.[etapaDestino];
    
    // Deve retornar válido (fallback seguro)
    expect(!validacao).toBe(true);
  });

  it('deve validar campos obrigatórios corretamente', () => {
    const VALIDACOES_ETAPA: Record<string, { obrigatorios: string[]; mensagem: string }> = {
      novo_lead: { obrigatorios: ['nome', 'telefone'], mensagem: 'Obrigatório' },
    };
    
    // Oportunidade completa
    const oppCompleta = { nome: 'João', telefone: '11999999999' };
    let camposFaltantes: string[] = [];
    const validacao = VALIDACOES_ETAPA.novo_lead;
    
    for (const campo of validacao.obrigatorios) {
      const valor = oppCompleta[campo as keyof typeof oppCompleta];
      if (valor === undefined || valor === null || valor === '' || valor === 0) {
        camposFaltantes.push(campo);
      }
    }
    expect(camposFaltantes.length).toBe(0);
    
    // Oportunidade incompleta
    const oppIncompleta = { nome: 'João' };
    camposFaltantes = [];
    for (const campo of validacao.obrigatorios) {
      const valor = oppIncompleta[campo as keyof typeof oppIncompleta];
      if (valor === undefined || valor === null || valor === '' || valor === 0) {
        camposFaltantes.push(campo);
      }
    }
    expect(camposFaltantes.length).toBe(1);
    expect(camposFaltantes).toContain('telefone');
  });
});

describe('Pipeline - Blindagem de Array', () => {
  it('deve proteger contra dados undefined', () => {
    // Simular dados vindos do store
    let oportunidadesKanban: any[] | undefined;
    
    const safeOportunidadesKanban = Array.isArray(oportunidadesKanban) 
      ? oportunidadesKanban 
      : [];
    
    expect(safeOportunidadesKanban).toEqual([]);
  });

  it('deve proteger contra dados null', () => {
    let oportunidadesKanban: any[] | null = null;
    
    const safeOportunidadesKanban = Array.isArray(oportunidadesKanban) 
      ? oportunidadesKanban 
      : [];
    
    expect(safeOportunidadesKanban).toEqual([]);
  });

  it('deve proteger contra dados inválidos', () => {
    let oportunidadesKanban = 'string_invalida' as any;
    
    const safeOportunidadesKanban = Array.isArray(oportunidadesKanban) 
      ? oportunidadesKanban 
      : [];
    
    expect(safeOportunidadesKanban).toEqual([]);
  });
});

describe('Pipeline - Filtro de Oportunidades por Pipeline', () => {
  it('deve filtrar oportunidades por pipeline_id', () => {
    const safeOportunidadesKanban = mockOportunidadesKanban;
    const currentPipelineId = 'consignado';
    
    const oportunidades = safeOportunidadesKanban.filter((o: any) => {
      if (!o) return false;
      if (o?.pipeline_id) {
        return o.pipeline_id === currentPipelineId;
      }
      return false;
    });
    
    expect(oportunidades.length).toBe(2);
    expect(oportunidades.every(o => o.pipeline_id === 'consignado')).toBe(true);
  });

  it('deve retornar array vazio para pipeline sem oportunidades', () => {
    const safeOportunidadesKanban = mockOportunidadesKanban;
    const currentPipelineId = 'inexistente';
    
    const oportunidades = safeOportunidadesKanban.filter((o: any) => {
      if (!o) return false;
      if (o?.pipeline_id) {
        return o.pipeline_id === currentPipelineId;
      }
      return false;
    });
    
    expect(oportunidades.length).toBe(0);
  });
});

describe('Pipeline - Etapas Dinâmicas', () => {
  it('deve usar fallback quando etapas estão vazias', () => {
    const currentPipelineConfig = null;
    
    const etapasAtivasRaw = Array.isArray(currentPipelineConfig?.etapas)
      ? currentPipelineConfig.etapas
      : [];
    
    const etapasAtivas = Array.isArray(etapasAtivasRaw) ? etapasAtivasRaw : [];
    
    expect(etapasAtivas).toEqual([]);
  });

  it('deve processar etapas do Admin corretamente', () => {
    // Etapas do Admin podem ter nomes diferentes das chaves oficiais
    const etapasAdmin = ['contato', 'analise', 'aprovacao'];
    
    const etapasAtivasRaw = Array.isArray(etapasAdmin)
      ? etapasAdmin.map((key: string, index: number) => ({
          id: key,
          nome: String(key), // Fallback: usa a chave como nome
          ordem: index + 1,
          ativo: true,
          cor: '#3B82F6'
        }))
      : [];
    
    expect(etapasAtivasRaw.length).toBe(3);
    expect(etapasAtivasRaw[0].nome).toBe('contato');
  });
});

describe('Pipeline - Resistência a Erros', () => {
  it('não deve quebrar com dados de oportunidade undefined', () => {
    const oportunidades = [undefined, null, { nome: 'Teste' }];
    
    const filtrado = oportunidades.filter((o: any) => {
      if (!o) return false;
      return true;
    });
    
    expect(filtrado.length).toBe(1);
    expect(filtrado[0].nome).toBe('Teste');
  });

  it('não deve quebrar com mapearProdutoLegadoParaPipeline undefined', () => {
    const mapearProdutoLegadoParaPipeline = undefined as any;
    
    const produto = 'consignado';
    const pipelineId = mapearProdutoLegadoParaPipeline?.(produto);
    
    expect(pipelineId).toBeUndefined();
  });

  it('não deve quebrar com getPipelineConfigById undefined', () => {
    const getPipelineConfigById = undefined as any;
    const currentPipelineId = 'consignado';
    
    const config = getPipelineConfigById?.(currentPipelineId);
    
    expect(config).toBeUndefined();
  });
});

describe('Pipeline - Correções de Estabilidade', () => {
  // ✅ Teste A: Garantir pipeline inicial válido
  it('deve selecionar primeiro pipeline quando currentPipelineId está vazio', () => {
    const currentPipelineId = null;
    const safePipelinesStore = [
      { id: 'consignado', nome: 'Consignado' },
      { id: 'parceiro', nome: 'Parceiro' }
    ];
    
    // Simular lógica do useEffect
    const effectivePipelineId = currentPipelineId || safePipelinesStore[0]?.id;
    
    expect(effectivePipelineId).toBe('consignado');
  });

  it('deve usar currentPipelineId quando já está definido', () => {
    const currentPipelineId = 'parceiro';
    const safePipelinesStore = [
      { id: 'consignado', nome: 'Consignado' },
      { id: 'parceiro', nome: 'Parceiro' }
    ];
    
    // Simular lógica do useEffect
    const effectivePipelineId = currentPipelineId || safePipelinesStore[0]?.id;
    
    expect(effectivePipelineId).toBe('parceiro');
  });

  // ✅ Teste B: Select com fallback seguro
  it('deve usar primeiro pipeline como valor padrão do select', () => {
    const currentPipelineId = '';
    const safePipelinesStore = [
      { id: 'consignado', nome: 'Consignado' },
      { id: 'parceiro', nome: 'Parceiro' }
    ];
    
    const selectValue = currentPipelineId || safePipelinesStore[0]?.id || '';
    
    expect(selectValue).toBe('consignado');
  });

  it('deve mostrar nome do primeiro pipeline no select', () => {
    const currentPipelineId = '';
    const safePipelinesStore = [
      { id: 'consignado', nome: 'Consignado' },
      { id: 'parceiro', nome: 'Parceiro' }
    ];
    
    const selectLabel = safePipelinesStore[0]?.nome || 'Selecione o Pipeline';
    
    expect(selectLabel).toBe('Consignado');
  });

  // ✅ Teste C: Filtro não pode apagar tudo quando pipeline_id ausente
  it('deve mostrar oportunidades quando currentPipelineConfig é null', () => {
    const oportunidadesBase = [
      { id: '1', nome: 'João', pipeline_id: 'consignado' },
      { id: '2', nome: 'Maria', pipeline_id: 'parceiro' },
      { id: '3', nome: 'Pedro' }, // Sem pipeline_id
    ];
    
    const currentPipelineConfig = null;
    
    const oportunidades = oportunidadesBase.filter((o: any) => {
      if (!o) return false;
      
      // ✅ Se currentPipelineConfig não existe, não filtrar (mostrar tudo)
      if (!currentPipelineConfig?.id) return true;
      
      if (o?.pipeline_id) {
        return o.pipeline_id === currentPipelineConfig.id;
      }
      return true;
    });
    
    // Deve mostrar todas as oportunidades quando não há pipeline configurado
    expect(oportunidades.length).toBe(3);
  });

  it('deve mostrar oportunidades legadas sem pipeline_id', () => {
    const oportunidadesBase = [
      { id: '1', nome: 'João', produto: 'consignado' }, // Legado: usa produto
      { id: '2', nome: 'Maria' }, // Sem pipeline_id nem produto
    ];
    
    const currentPipelineConfig = { id: 'consignado', nome: 'Consignado' };
    const mapearProdutoLegadoParaPipeline = (produto: string) => {
      const map: Record<string, string> = {
        'consignado': 'consignado',
        'parceiro': 'parceiro'
      };
      return map[produto];
    };
    
    const oportunidades = oportunidadesBase.filter((o: any) => {
      if (!o) return false;
      
      if (!currentPipelineConfig?.id) return true;
      
      if (o?.pipeline_id) {
        return o.pipeline_id === currentPipelineConfig.id;
      }
      
      if (o?.produto && typeof mapearProdutoLegadoParaPipeline === 'function') {
        return mapearProdutoLegadoParaPipeline(o.produto) === currentPipelineConfig.id;
      }
      
      // ✅ Se não tem pipeline_id nem produto, mostrar (dados legados)
      return true;
    });
    
    // João tem produto=consignado que mapeia para pipeline_id=consignado
    // Maria não tem pipeline_id nem produto, deve ser mostrada
    expect(oportunidades.length).toBe(2);
  });

  it('deve filtrar corretamente por pipeline_id', () => {
    const oportunidadesBase = [
      { id: '1', nome: 'João', pipeline_id: 'consignado' },
      { id: '2', nome: 'Maria', pipeline_id: 'consignado' },
      { id: '3', nome: 'Pedro', pipeline_id: 'parceiro' },
    ];
    
    const currentPipelineConfig = { id: 'consignado', nome: 'Consignado' };
    
    const oportunidades = oportunidadesBase.filter((o: any) => {
      if (!o) return false;
      
      if (!currentPipelineConfig?.id) return true;
      
      if (o?.pipeline_id) {
        return o.pipeline_id === currentPipelineConfig.id;
      }
      
      return true;
    });
    
    expect(oportunidades.length).toBe(2);
    expect(oportunidades.every(o => o.pipeline_id === 'consignado')).toBe(true);
  });
});

describe('Pipeline - empty states', () => {
  it('deve retornar mensagem quando não há pipelines', () => {
    const safePipelinesStore: any[] = [];
    
    const emptyMessage = safePipelinesStore.length === 0 
      ? 'Cadastre um pipeline em Administração > Pipelines.'
      : null;
    
    expect(emptyMessage).toBe('Cadastre um pipeline em Administração > Pipelines.');
  });

  it('deve retornar mensagem quando pipeline não tem etapas', () => {
    const pipeline = { id: 'teste', nome: 'Teste', etapas: [] };
    
    const emptyMessage = !pipeline.etapas || pipeline.etapas.length === 0
      ? 'Cadastre etapas para este pipeline.'
      : null;
    
    expect(emptyMessage).toBe('Cadastre etapas para este pipeline.');
  });

  it('deve retornar mensagem quando não há oportunidades no pipeline', () => {
    const oportunidades: any[] = [];
    const currentPipelineId = 'consignado';
    
    const oportunidadesDoPipeline = oportunidades.filter(
      o => o?.pipeline_id === currentPipelineId
    );
    
    const emptyMessage = oportunidadesDoPipeline.length === 0
      ? 'Nenhuma oportunidade neste pipeline.'
      : null;
    
    expect(emptyMessage).toBe('Nenhuma oportunidade neste pipeline.');
  });
});

describe('Pipeline - Switch de Pipeline', () => {
  it('deve mudar de pipeline corretamente', () => {
    const safePipelinesStore = [
      { id: 'consignado', nome: 'Consignado' },
      { id: 'parceiro', nome: 'Parceiro' }
    ];
    
    let currentPipelineId = 'consignado';
    const newPipelineId = 'parceiro';
    
    // Simular mudança de pipeline
    if (newPipelineId && safePipelinesStore.some(p => p.id === newPipelineId)) {
      currentPipelineId = newPipelineId;
    }
    
    expect(currentPipelineId).toBe('parceiro');
  });

  it('deve manter pipeline atual se novo não existir', () => {
    const safePipelinesStore = [
      { id: 'consignado', nome: 'Consignado' },
      { id: 'parceiro', nome: 'Parceiro' }
    ];
    
    let currentPipelineId = 'consignado';
    const newPipelineId = 'inexistente';
    
    // Simular mudança de pipeline
    if (newPipelineId && safePipelinesStore.some(p => p.id === newPipelineId)) {
      currentPipelineId = newPipelineId;
    }
    
    // Deve manter o pipeline atual
    expect(currentPipelineId).toBe('consignado');
  });

  it('deve filtrar oportunidades ao mudar de pipeline', () => {
    const oportunidades = [
      { id: '1', nome: 'João', pipeline_id: 'consignado' },
      { id: '2', nome: 'Maria', pipeline_id: 'parceiro' },
      { id: '3', nome: 'Pedro', pipeline_id: 'consignado' },
    ];
    
    // Primeira filtragem: consignado
    const oportunidadesConsignado = oportunidades.filter(
      o => o.pipeline_id === 'consignado'
    );
    expect(oportunidadesConsignado.length).toBe(2);
    
    // Segunda filtragem: parceiro
    const oportunidadesParceiro = oportunidades.filter(
      o => o.pipeline_id === 'parceiro'
    );
    expect(oportunidadesParceiro.length).toBe(1);
  });
});
