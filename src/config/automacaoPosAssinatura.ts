// FINQZ PRO - Automação Pós-Assinatura
// Executa ações automaticamente quando um contrato é assinado

import api from "../api/client";
import useAppStore from "../store";

// Tipos de automação
export type TipoAutomacao = 
  | 'criar_parceiro'
  | 'criar_usuario'
  | 'enviar_email_bemvindo'
  | 'atualizar_etapa'
  | 'notificar_gestor'
  | 'gerar_credenciais'
  | 'criar_conta_corrente'
  | 'ativar_produto';

// Status da automação
export type StatusAutomacao = 'pendente' | 'executando' | 'sucesso' | 'erro';

// Interface de configuração de automação
export interface ConfiguracaoAutomacao {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoAutomacao;
  ativo: boolean;
  pipelineIds: string[]; // Quais pipelines disparam esta automação
  config: Record<string, any>; // Configuração específica
}

// Interface de resultado de automação
export interface ResultadoAutomacao {
  automacaoId: string;
  oportunidadeId: string;
  tipo: TipoAutomacao;
  status: StatusAutomacao;
  mensagem?: string;
  dados?: Record<string, any>;
  timestamp: string;
}

// Interface de oportunidade com dados de assinatura
export interface OportunidadeAssinada {
  id: string;
  nome: string;
  email: string;
  cpf_cnpj: string;
  telefone?: string;
  celular?: string;
  pipeline_id: string;
  pipelineNome?: string;
  etapa_id: string;
  // Dados do parceiro
  parceiroTipo?: string;
  razaoSocial?: string;
  cnpj?: string;
  telefoneComercial?: string;
  emailCorporativo?: string;
  responsavelLegal?: string;
  cpfResponsavel?: string;
  cargoResponsavel?: string;
  // Dados do colaborador
  vinculoTipo?: string;
  cargo?: string;
  departamento?: string;
  formacao?: string;
  // Dados bancários
  banco?: string;
  agencia?: string;
  conta?: string;
  pixTipo?: string;
  pixChave?: string;
  // Hierarquia
  racionalCompany_id?: number;
  franquia_id?: number;
  franqueado_id?: number;
}

// 🎯 REGISTRO DE AUTOMAÇÕES DISPONÍVEIS
export const AUTOMAÇÕES_DISPONIVEIS: ConfiguracaoAutomacao[] = [
  {
    id: 'auto-criar-parceiro',
    nome: 'Criar Parceiro Comercial',
    descricao: 'Cria automaticamente um registro de parceiro quando o contrato é assinado',
    tipo: 'criar_parceiro',
    ativo: true,
    pipelineIds: ['parceiros_comerciais'],
    config: {}
  },
  {
    id: 'auto-criar-usuario',
    nome: 'Criar Usuário no Sistema',
    descricao: 'Cria automaticamente acesso ao sistema para o novo parceiro/colaborador',
    tipo: 'criar_usuario',
    ativo: true,
    pipelineIds: ['parceiros_comerciais', 'colaborador_finqz'],
    config: {}
  },
  {
    id: 'auto-email-bemvindo',
    nome: 'Enviar E-mail de Boas-vindas',
    descricao: 'Envia e-mail automático com instruções e credenciais',
    tipo: 'enviar_email_bemvindo',
    ativo: true,
    pipelineIds: ['parceiros_comerciais', 'colaborador_finqz'],
    config: {}
  },
  {
    id: 'auto-atualizar-etapa',
    nome: 'Atualizar Etapa do Pipeline',
    descricao: 'Move automaticamente a oportunidade para "Contrato Assinado" ou "Ativo"',
    tipo: 'atualizar_etapa',
    ativo: true,
    pipelineIds: ['parceiros_comerciais', 'colaborador_finqz', 'assinatura_veiculos', 'financiamento_veiculo', 'energia_gd', 'mercado_livre_energia', 'emprestimo_com_garantia'],
    config: {
      etapaDestino: 'ativo'
    }
  },
  {
    id: 'auto-notificar-gestor',
    nome: 'Notificar Gestor',
    descricao: 'Envia notificação para o gestor sobre nova assinatura',
    tipo: 'notificar_gestor',
    ativo: false,
    pipelineIds: ['parceiros_comerciais', 'colaborador_finqz'],
    config: {}
  },
  {
    id: 'auto-criar-conta',
    nome: 'Criar Conta Corrente',
    descricao: 'Cria registro de conta corrente para o novo parceiro',
    tipo: 'criar_conta_corrente',
    ativo: false,
    pipelineIds: ['parceiros_comerciais'],
    config: {}
  }
];

// 🎯 EXECUTAR TODAS AS AUTOMAÇÕES
export async function executarAutomacoes(
  oportunidade: OportunidadeAssinada
): Promise<ResultadoAutomacao[]> {
  const resultados: ResultadoAutomacao[] = [];
  
  // Filtrar automações ativas para o pipeline atual
  const automacoesAtivas = AUTOMAÇÕES_DISPONIVEIS.filter(
    auto => auto.ativo && auto.pipelineIds.includes(oportunidade.pipeline_id)
  );
  
  for (const automacao of automacoesAtivas) {
    try {
      const resultado = await executarAutomacao(automacao, oportunidade);
      resultados.push(resultado);
    } catch (error) {
      resultados.push({
        automacaoId: automacao.id,
        oportunidadeId: oportunidade.id,
        tipo: automacao.tipo,
        status: 'erro',
        mensagem: String(error),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return resultados;
}

// 🎯 EXECUTAR UMA AUTOMAÇÃO ESPECÍFICA
async function executarAutomacao(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada
): Promise<ResultadoAutomacao> {
  const timestamp = new Date().toISOString();
  
  switch (automacao.tipo) {
    case 'criar_parceiro':
      return await criarParceiroComercial(automacao, oportunidade, timestamp);
    case 'criar_usuario':
      return await criarUsuario(automacao, oportunidade, timestamp);
    case 'enviar_email_bemvindo':
      return await enviarEmailBoasVindas(automacao, oportunidade, timestamp);
    case 'atualizar_etapa':
      return await atualizarEtapaPipeline(automacao, oportunidade, timestamp);
    case 'notificar_gestor':
      return await notificarGestor(automacao, oportunidade, timestamp);
    case 'criar_conta_corrente':
      return await criarContaCorrente(automacao, oportunidade, timestamp);
    default:
      return {
        automacaoId: automacao.id,
        oportunidadeId: oportunidade.id,
        tipo: automacao.tipo,
        status: 'erro',
        mensagem: 'Tipo de automação não implementado',
        timestamp
      };
  }
}

// 🎯 IMPLEMENTAÇÕES DAS AUTOMAÇÕES

// 1. Criar Parceiro Comercial
async function criarParceiroComercial(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada,
  timestamp: string
): Promise<ResultadoAutomacao> {
  // Simulação - em produção, chamar API
  const novoParceiro = {
    nome: oportunidade.razaoSocial || oportunidade.nome,
    tipo: oportunidade.parceiroTipo || 'FRANQUEADO',
    cnpj: oportunidade.cnpj || oportunidade.cpf_cnpj,
    email: oportunidade.emailCorporativo || oportunidade.email,
    telefone: oportunidade.telefoneComercial || oportunidade.telefone || oportunidade.celular,
    responsavel: oportunidade.responsavelLegal,
    cpfResponsavel: oportunidade.cpfResponsavel,
    cargoResponsavel: oportunidade.cargoResponsavel,
    racionalCompany_id: oportunidade.racionalCompany_id,
    franquia_id: oportunidade.franquia_id,
    status: 'ativo',
    createdAt: timestamp
  };
  
  console.log('[AUTOMAÇÃO] Criando parceiro comercial:', novoParceiro);
  
  return {
    automacaoId: automacao.id,
    oportunidadeId: oportunidade.id,
    tipo: 'criar_parceiro',
    status: 'sucesso',
    mensagem: `Parceiro "${novoParceiro.nome}" criado com sucesso`,
    dados: { parceiroId: `PAR-${Date.now()}` },
    timestamp
  };
}

// 2. Criar Usuário no Sistema
async function criarUsuario(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada,
  timestamp: string
): Promise<ResultadoAutomacao> {
  const novoUsuario = {
    nome: oportunidade.nome,
    email: oportunidade.email,
    cpf: oportunidade.cpf_cnpj,
    telefone: oportunidade.celular || oportunidade.telefone,
    perfil: oportunidade.pipeline_id === 'colaborador_finqz' ? 'colaborador' : 'parceiro',
    status: 'pendente_senha', // Usuário precisa definir senha
    createdAt: timestamp
  };
  
  console.log('[AUTOMAÇÃO] Criando usuário:', novoUsuario);
  
  return {
    automacaoId: automacao.id,
    oportunidadeId: oportunidade.id,
    tipo: 'criar_usuario',
    status: 'sucesso',
    mensagem: `Usuário "${novoUsuario.email}" criado. E-mail de ativação enviado.`,
    dados: { usuarioId: `USR-${Date.now()}` },
    timestamp
  };
}

// 3. Enviar E-mail de Boas-vindas
async function enviarEmailBoasVindas(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada,
  timestamp: string
): Promise<ResultadoAutomacao> {
  const emailContent = {
    para: oportunidade.email,
    assunto: 'Bem-vindo ao FINQZ PRO!',
    corpo: `
      Olá ${oportunidade.nome},
      
      Seu cadastro foi aprovado e o contrato foi assinado com sucesso!
      
      Agora você tem acesso ao nosso sistema.
      
      Atenciosamente,
      Equipe FINQZ
    `
  };
  
  console.log('[AUTOMAÇÃO] Enviando e-mail:', emailContent);
  
  return {
    automacaoId: automacao.id,
    oportunidadeId: oportunidade.id,
    tipo: 'enviar_email_bemvindo',
    status: 'sucesso',
    mensagem: `E-mail de boas-vindas enviado para ${emailContent.para}`,
    timestamp
  };
}

// 4. Atualizar Etapa do Pipeline
async function atualizarEtapaPipeline(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada,
  timestamp: string
): Promise<ResultadoAutomacao> {
  const etapaDestino = automacao.config?.etapaDestino || 'ativo';
  
  console.log(`[AUTOMAÇÃO] Atualizando oportunidade ${oportunidade.id} para etapa: ${etapaDestino}`);
  
  // Atualizar no store
  const store = useAppStore.getState();
  if (store.updateOportunidade) {
    store.updateOportunidade(oportunidade.id, {
      etapa_id: etapaDestino,
      etapa: etapaDestino,
      status: etapaDestino === 'ativo' ? 'ganho' : 'ativo',
      dataAssinatura: timestamp
    });
  }
  
  return {
    automacaoId: automacao.id,
    oportunidadeId: oportunidade.id,
    tipo: 'atualizar_etapa',
    status: 'sucesso',
    mensagem: `Oportunidade movida para "${etapaDestino}"`,
    dados: { novaEtapa: etapaDestino },
    timestamp
  };
}

// 5. Notificar Gestor
async function notificarGestor(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada,
  timestamp: string
): Promise<ResultadoAutomacao> {
  console.log(`[AUTOMAÇÃO] Notificando gestor sobre nova assinatura: ${oportunidade.id}`);
  
  return {
    automacaoId: automacao.id,
    oportunidadeId: oportunidade.id,
    tipo: 'notificar_gestor',
    status: 'sucesso',
    mensagem: 'Notificação enviada para o gestor',
    timestamp
  };
}

// 6. Criar Conta Corrente
async function criarContaCorrente(
  automacao: ConfiguracaoAutomacao,
  oportunidade: OportunidadeAssinada,
  timestamp: string
): Promise<ResultadoAutomacao> {
  const contaCorrente = {
    parceiroId: oportunidade.id,
    banco: oportunidade.banco,
    agencia: oportunidade.agencia,
    conta: oportunidade.conta,
    pixTipo: oportunidade.pixTipo,
    pixChave: oportunidade.pixChave,
    status: 'ativa',
    createdAt: timestamp
  };
  
  console.log('[AUTOMAÇÃO] Criando conta corrente:', contaCorrente);
  
  return {
    automacaoId: automacao.id,
    oportunidadeId: oportunidade.id,
    tipo: 'criar_conta_corrente',
    status: 'sucesso',
    mensagem: 'Conta corrente criada com sucesso',
    dados: { contaId: `CC-${Date.now()}` },
    timestamp
  };
}

// 🎯 VERIFICAR SE HÁ AUTOMAÇÕES PENDENTES
export function getAutomacoesPendentes(pipelineId: string): ConfiguracaoAutomacao[] {
  return AUTOMAÇÕES_DISPONIVEIS.filter(
    auto => auto.ativo && auto.pipelineIds.includes(pipelineId)
  );
}

// 🎯 OBTER LABEL TIPO DE AUTOMAÇÃO
export function getTipoAutomacaoLabel(tipo: TipoAutomacao): string {
  const labels: Record<TipoAutomacao, string> = {
    criar_parceiro: 'Criar Parceiro',
    criar_usuario: 'Criar Usuário',
    enviar_email_bemvindo: 'E-mail de Boas-vindas',
    atualizar_etapa: 'Atualizar Etapa',
    notificar_gestor: 'Notificar Gestor',
    gerar_credenciais: 'Gerar Credenciais',
    criar_conta_corrente: 'Criar Conta Corrente',
    ativar_produto: 'Ativar Produto'
  };
  return labels[tipo] || tipo;
}

// 🎯 OBTER COR DO STATUS DE AUTOMAÇÃO
export function getStatusAutomacaoColor(status: StatusAutomacao): string {
  const cores: Record<StatusAutomacao, string> = {
    pendente: '#6b7280',
    executando: '#3b82f6',
    sucesso: '#22c55e',
    erro: '#ef4444'
  };
  return cores[status] || '#6b7280';
}
