// FINQZ PRO - Configuração de Automações por Pipeline
// Permite personalizar quais automações executam para cada pipeline

import { PIPELINES, getPipelineConfigById } from './pipelines';
import { TipoAutomacao, StatusAutomacao } from './automacaoPosAssinatura';

// Interface para configuração individual de automação
export interface ConfigAutomacaoPipeline {
  automacaoId: string;
  ativo: boolean;
  ordem: number;
  config?: Record<string, any>;
}

// Interface completa de configuração de pipeline
export interface ConfigPipeline {
  pipelineId: string;
  automacoes: ConfigAutomacaoPipeline[];
}

// 🎯 AUTOMAÇÕES DISPONÍVEIS COM SUAS CONFIGURAÇÕES PADRÃO
export const AUTOMAÇÕES_BASE = [
  {
    id: 'auto-criar-parceiro',
    nome: 'Criar Parceiro Comercial',
    descricao: 'Cria automaticamente um registro de parceiro quando o contrato é assinado',
    tipo: 'criar_parceiro' as TipoAutomacao,
    icone: '🏢',
    cor: '#8b5cf6'
  },
  {
    id: 'auto-criar-usuario',
    nome: 'Criar Usuário no Sistema',
    descricao: 'Cria automaticamente acesso ao sistema para o novo parceiro/colaborador',
    tipo: 'criar_usuario' as TipoAutomacao,
    icone: '👤',
    cor: '#3b82f6'
  },
  {
    id: 'auto-email-bemvindo',
    nome: 'Enviar E-mail de Boas-vindas',
    descricao: 'Envia e-mail automático com instruções e credenciais',
    tipo: 'enviar_email_bemvindo' as TipoAutomacao,
    icone: '📧',
    cor: '#22c55e'
  },
  {
    id: 'auto-atualizar-etapa',
    nome: 'Atualizar Etapa do Pipeline',
    descricao: 'Move automaticamente a oportunidade para "Contrato Assinado" ou "Ativo"',
    tipo: 'atualizar_etapa' as TipoAutomacao,
    icone: '➡️',
    cor: '#f59e0b',
    campos: [
      {
        nome: 'etapaDestino',
        label: 'Etapa de Destino',
        tipo: 'select',
        opcoes: [
          { value: 'contrato_assinado', label: 'Contrato Assinado' },
          { value: 'ativo', label: 'Ativo' }
        ],
        default: 'ativo'
      }
    ]
  },
  {
    id: 'auto-notificar-gestor',
    nome: 'Notificar Gestor',
    descricao: 'Envia notificação para o gestor sobre nova assinatura',
    tipo: 'notificar_gestor' as TipoAutomacao,
    icone: '🔔',
    cor: '#ef4444'
  },
  {
    id: 'auto-criar-conta',
    nome: 'Criar Conta Corrente',
    descricao: 'Cria registro de conta corrente para o novo parceiro',
    tipo: 'criar_conta_corrente' as TipoAutomacao,
    icone: '💳',
    cor: '#06b6d4'
  }
];

// 🎯 CONFIGURAÇÃO PADRÃO POR TIPO DE PIPELINE
export const CONFIG_DEFAULT_POR_TIPO: Record<string, ConfigAutomacaoPipeline[]> = {
  onboarding_parceiro: [
    { automacaoId: 'auto-criar-parceiro', ativo: true, ordem: 1 },
    { automacaoId: 'auto-criar-usuario', ativo: true, ordem: 2 },
    { automacaoId: 'auto-email-bemvindo', ativo: true, ordem: 3 },
    { automacaoId: 'auto-atualizar-etapa', ativo: true, ordem: 4, config: { etapaDestino: 'ativo' } },
    { automacaoId: 'auto-notificar-gestor', ativo: false, ordem: 5 },
    { automacaoId: 'auto-criar-conta', ativo: false, ordem: 6 }
  ],
  onboarding_colaborador: [
    { automacaoId: 'auto-criar-usuario', ativo: true, ordem: 1 },
    { automacaoId: 'auto-email-bemvindo', ativo: true, ordem: 2 },
    { automacaoId: 'auto-atualizar-etapa', ativo: true, ordem: 3, config: { etapaDestino: 'ativo' } },
    { automacaoId: 'auto-notificar-gestor', ativo: true, ordem: 4 }
  ],
  veiculo: [
    { automacaoId: 'auto-atualizar-etapa', ativo: true, ordem: 1, config: { etapaDestino: 'ativo' } },
    { automacaoId: 'auto-email-bemvindo', ativo: true, ordem: 2 }
  ],
  credito: [
    { automacaoId: 'auto-atualizar-etapa', ativo: true, ordem: 1, config: { etapaDestino: 'integrado' } }
  ],
  energia: [
    { automacaoId: 'auto-atualizar-etapa', ativo: true, ordem: 1, config: { etapaDestino: 'ativo' } },
    { automacaoId: 'auto-email-bemvindo', ativo: true, ordem: 2 }
  ]
};

// 🎯 CARREGAR CONFIGURAÇÃO DE UM PIPELINE
export function getConfigPipeline(pipelineId: string): ConfigPipeline {
  const pipeline = getPipelineConfigById(pipelineId);
  const tipo = pipeline?.tipo || 'default';
  
  // Pegar configuração padrão baseada no tipo
  const configBase = CONFIG_DEFAULT_POR_TIPO[tipo] || CONFIG_DEFAULT_POR_TIPO['veiculo'];
  
  return {
    pipelineId,
    automacoes: configBase
  };
}

// 🎯 SALVAR CONFIGURAÇÃO DE UM PIPELINE (simulado - em produção salvar no backend)
let configuracoesSalvas: Record<string, ConfigPipeline> = {};

export function salvarConfigPipeline(config: ConfigPipeline): void {
  configuracoesSalvas[config.pipelineId] = config;
  console.log('[CONFIG] Configuração salva:', config.pipelineId, config);
}

export function getConfigSalva(pipelineId: string): ConfigPipeline | null {
  return configuracoesSalvas[pipelineId] || null;
}

// 🎯 OBTER AUTOMAÇÕES ATIVAS PARA UM PIPELINE
export function getAutomacoesAtivasPipeline(pipelineId: string): ConfigAutomacaoPipeline[] {
  const config = getConfigPipeline(pipelineId);
  return config.automacoes.filter(a => a.ativo).sort((a, b) => a.ordem - b.ordem);
}

// 🎯 OBTER PIPELINES COM AUTOMAÇÃO
export function getPipelinesComAutomacao(): { id: string; nome: string; tipo: string; automacoesAtivas: number }[] {
  return PIPELINES.map(p => ({
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    automacoesAtivas: getAutomacoesAtivasPipeline(p.id).length
  }));
}

// 🎯 TOGGLE AUTOMACAO
export function toggleAutomacaoPipeline(
  pipelineId: string, 
  automacaoId: string, 
  ativo: boolean
): ConfigPipeline {
  const config = getConfigPipeline(pipelineId);
  const automacoes = config.automacoes.map(a => 
    a.automacaoId === automacaoId ? { ...a, ativo } : a
  );
  
  const novoConfig = { ...config, automacoes };
  salvarConfigPipeline(novoConfig);
  
  return novoConfig;
}

// 🎯 REORDENAR AUTOMAÇÕES
export function reordenarAutomacoes(
  pipelineId: string,
  automacaoId: string,
  novaOrdem: number
): ConfigPipeline {
  const config = getConfigPipeline(pipelineId);
  const automacoes = [...config.automacoes];
  
  const idx = automacoes.findIndex(a => a.automacaoId === automacaoId);
  if (idx === -1) return config;
  
  const item = automacoes[idx];
  automacoes.splice(idx, 1);
  automacoes.splice(novaOrdem, 0, item);
  
  // Atualizar ordens
  const automacoesOrdenadas = automacoes.map((a, i) => ({ ...a, ordem: i + 1 }));
  
  const novoConfig = { ...config, automacoes: automacoesOrdenadas };
  salvarConfigPipeline(novoConfig);
  
  return novoConfig;
}

// 🎯 RESETAR PARA PADRÃO
export function resetarConfigPipeline(pipelineId: string): ConfigPipeline {
  const pipeline = getPipelineConfigById(pipelineId);
  const tipo = pipeline?.tipo || 'default';
  const configBase = CONFIG_DEFAULT_POR_TIPO[tipo] || CONFIG_DEFAULT_POR_TIPO['veiculo'];
  
  const novoConfig = {
    pipelineId,
    automacoes: configBase
  };
  
  salvarConfigPipeline(novoConfig);
  return novoConfig;
}

// 🎯 EXPORTAR/IMPORTAR CONFIGURAÇÕES
export function exportarConfiguracoes(): string {
  return JSON.stringify(configuracoesSalvas, null, 2);
}

export function importarConfiguracoes(json: string): boolean {
  try {
    const config = JSON.parse(json);
    configuracoesSalvas = config;
    return true;
  } catch {
    return false;
  }
}

// 🎯 LABELS
export function getTipoPipelineLabel(tipo: string): string {
  const labels: Record<string, string> = {
    onboarding_parceiro: 'Onboarding Parceiro',
    onboarding_colaborador: 'Onboarding Colaborador',
    veiculo: 'Veículo',
    credito: 'Crédito',
    energia: 'Energia'
  };
  return labels[tipo] || tipo;
}

export function getCorTipoPipeline(tipo: string): string {
  const cores: Record<string, string> = {
    onboarding_parceiro: '#8b5cf6',
    onboarding_colaborador: '#22c55e',
    veiculo: '#3b82f6',
    credito: '#f59e0b',
    energia: '#06b6d4'
  };
  return cores[tipo] || '#6b7280';
}
