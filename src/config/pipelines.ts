// FINQZ PRO - Configuração de Pipelines
import { Pipeline, Etapa, PipelineConfig, PipelineTipo } from "../types";

// 🎯 PIPELINES CONFIGURÁVEIS - Ordem Alfabética
export const PIPELINES: PipelineConfig[] = [
  {
    id: "assinatura_veiculos",
    nome: "Assinatura de Veículos",
    tipo: "veiculo",
    descricao: "Pipeline para assinatura de veículos",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
  },
  {
    id: "colaborador_finqz",
    nome: "Colaborador FINQZ",
    tipo: "onboarding_colaborador",
    descricao: "Pipeline para contratação de colaboradores PF ou PJ",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
    assinaturaDigital: true,
    documentosObrigatorios: ["rg_cnh", "cpf", "comprovante_endereco", "dados_bancarios", "curriculo", "contrato_assinado"],
  },
  {
    id: "credito_consignado",
    nome: "Crédito Consignado",
    tipo: "credito",
    descricao: "Pipeline de crédito consignado",
    etapas: ["novo_lead", "negociacao", "aguardando_assinatura", "pendencia", "formalizacao", "integrado", "perdido"],
  },
  {
    id: "emprestimo_com_garantia",
    nome: "Empréstimo com Garantia",
    tipo: "credito",
    descricao: "Pipeline de empréstimo com garantia",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
  },
  {
    id: "emprestimo_pessoal",
    nome: "Empréstimo Pessoal",
    tipo: "credito",
    descricao: "Pipeline de empréstimo pessoal",
    etapas: ["novo_lead", "negociacao", "aguardando_assinatura", "pendencia", "formalizacao", "integrado", "perdido"],
  },
  {
    id: "energia_gd",
    nome: "Energia por Assinatura - GD",
    tipo: "energia",
    descricao: "Pipeline de energia por assinatura (Geração Distribuída)",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
  },
  {
    id: "financiamento_veiculo",
    nome: "Financiamento de Veículo",
    tipo: "veiculo",
    descricao: "Pipeline de financiamento de veículo",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
  },
  {
    id: "mercado_livre_energia",
    nome: "Mercado Livre de Energia - ML",
    tipo: "energia",
    descricao: "Pipeline de Mercado Livre de Energia",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
  },
  {
    id: "parceiros_comerciais",
    nome: "Parceiros Comerciais",
    tipo: "onboarding_parceiro",
    descricao: "Pipeline para cadastro de parceiros comerciais (Company, Franquia, Franqueado)",
    etapas: ["novo_lead", "negociacao", "documentacao", "aceite", "contrato_enviado", "aguardando_assinatura", "contrato_assinado", "ativo", "pendencia", "perdido"],
    assinaturaDigital: true,
    documentosObrigatorios: ["documento_identificacao", "cpf", "comprovante_endereco", "dados_bancarios"],
  },
];

// Função para obter pipeline por ID
export function getPipelineConfigById(id: string): PipelineConfig | undefined {
  return PIPELINES.find((p) => p.id === id);
}

// Função para obter pipelines ordenados alfabeticamente
export function getPipelinesOrdenados(): PipelineConfig[] {
  return [...PIPELINES].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// Função para verificar se o pipeline requer documentos obrigatórios
export function pipelineRequerDocumentosObrigatorios(pipelineId: string): boolean {
  const pipeline = getPipelineConfigById(pipelineId);
  return pipeline?.assinaturaDigital === true;
}

// Função para verificar se o pipeline requer assinatura digital
export function pipelineRequerAssinaturaDigital(pipelineId: string): boolean {
  const pipeline = getPipelineConfigById(pipelineId);
  return pipeline?.assinaturaDigital === true;
}

// Função para obter documentos obrigatórios de um pipeline
export function getDocumentosObrigatorios(pipelineId: string): string[] {
  const pipeline = getPipelineConfigById(pipelineId);
  return pipeline?.documentosObrigatorios || [];
}

// Função para mapear produto legado para pipeline
export function mapearProdutoLegadoParaPipeline(produto: string): string | undefined {
  const mapping: Record<string, string> = {
    'Empréstimo Pessoal': 'emprestimo_pessoal',
    'Crédito Consignado': 'credito_consignado',
    'Empréstimo com Garantia': 'emprestimo_com_garantia',
    'Financiamento de Veículo': 'financiamento_veiculo',
    'Assinatura de Veículos': 'assinatura_veiculos',
    'Energia por Assinatura - GD': 'energia_gd',
    'Mercado Livre de Energia - ML': 'mercado_livre_energia',
    'Parceiros Comerciais': 'parceiros_comerciais',
    'Colaborador FINQZ': 'colaborador_finqz',
  };
  return mapping[produto];
}

// Função para verificar se é pipeline de onboarding
export function isPipelineOnboarding(pipelineId: string): boolean {
  const pipeline = getPipelineConfigById(pipelineId);
  return pipeline?.tipo === 'onboarding_parceiro' || pipeline?.tipo === 'onboarding_colaborador';
}

// Função para verificar se é pipeline de parceiro comercial
export function isPipelineParceiro(pipelineId: string): boolean {
  const pipeline = getPipelineConfigById(pipelineId);
  return pipeline?.tipo === 'onboarding_parceiro';
}

// Função para verificar se é pipeline de colaborador
export function isPipelineColaborador(pipelineId: string): boolean {
  const pipeline = getPipelineConfigById(pipelineId);
  return pipeline?.tipo === 'onboarding_colaborador';
}

// Função para obter label de exibição do tipo de pipeline
export function getPipelineTipoLabel(tipo: PipelineTipo): string {
  const labels: Record<PipelineTipo, string> = {
    'credito': 'Crédito',
    'energia': 'Energia',
    'veiculo': 'Veículo',
    'onboarding_colaborador': 'Colaborador FINQZ',
    'onboarding_parceiro': 'Parceiro Comercial',
  };
  return labels[tipo] || tipo;
}

// Pipelines legados (manter para compatibilidade)
export const pipelines: Pipeline[] = [
  {
    id: "consignado",
    nome: "Consignado",
    produto: "consignado",
    ativo: true,
    etapas: [
      {
        id: "novo_lead",
        nome: "Novo Lead",
        ordem: 1,
        ativo: true,
        tags: ["novo", "quente"],
      },
      {
        id: "contato",
        nome: "Contato",
        ordem: 2,
        ativo: true,
      },
      {
        id: "analise",
        nome: "Análise",
        ordem: 3,
        ativo: true,
        obrigatorios: ["cpf"],
        tags: ["documentos", "cpf"],
      },
      {
        id: "aprovacao",
        nome: "Aprovação",
        ordem: 4,
        ativo: true,
        obrigatorios: ["dados_bancarios"],
        tags: ["banco", "renda"],
      },
      {
        id: "formalizacao",
        nome: "Formalização",
        ordem: 5,
        ativo: true,
        obrigatorios: ["documentos"],
        tags: ["contrato", "assinatura"],
      },
      {
        id: "encerrado",
        nome: "Encerrado",
        ordem: 6,
        ativo: true,
      },
    ],
  },
  {
    id: "personalizado",
    nome: "Crédito Pessoal",
    produto: "credito_pessoal",
    ativo: true,
    etapas: [
      {
        id: "novo_lead",
        nome: "Novo Lead",
        ordem: 1,
        ativo: true,
      },
      {
        id: "avaliacao",
        nome: "Avaliação",
        ordem: 2,
        ativo: true,
        obrigatorios: ["cpf", "renda"],
      },
      {
        id: "aprovacao",
        nome: "Aprovação",
        ordem: 3,
        ativo: true,
      },
      {
        id: "liberação",
        nome: "Liberação",
        ordem: 4,
        ativo: true,
        obrigatorios: ["conta_bancaria"],
      },
    ],
  },
];

// Funções utilitárias para manipulação de pipelines
export function getPipelineById(id: string): Pipeline | undefined {
  return pipelines.find((p) => p.id === id);
}

export function getEtapasAtivas(pipelineId: string): Etapa[] {
  const pipeline = getPipelineById(pipelineId);
  if (!pipeline?.etapas) return [];
  return pipeline.etapas
    .filter((e) => e.ativo)
    .sort((a, b) => a.ordem - b.ordem);
}

export function podeAvancar(
  etapaAtualId: string,
  etapaDestinoId: string,
  pipelineId: string,
  leadData: Record<string, any>
): { pode: boolean; missing: string[] } {
  const pipeline = getPipelineById(pipelineId);
  if (!pipeline?.etapas) return { pode: true, missing: [] };

  const etapaDestino = pipeline.etapas.find((e) => e.id === etapaDestinoId);
  if (!etapaDestino?.obrigatorios) return { pode: true, missing: [] };

  // Import dynamically to avoid circular dependency
  const { getCampoByKey, CAMPOS_SISTEMA } = require('./campos');

  const missing: string[] = [];
  
  // Check each required field (where value is true)
  Object.entries(etapaDestino.obrigatorios)
    .filter(([_, isRequired]) => isRequired)
    .forEach(([campo]) => {
      const hasValue = leadData[campo] || leadData.metadata?.[campo];
      if (!hasValue) {
        const campoInfo = getCampoByKey(campo);
        missing.push(campoInfo?.label || campo);
      }
    });

  return { pode: missing.length === 0, missing };
}
