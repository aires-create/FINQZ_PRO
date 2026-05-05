// FINQZ PRO - Serviço de Assinatura Digital
// Suporta múltiplos provedores: Authentic, DocuSign, Clicksign

import api from "../api/client";

// Tipos de provedor de assinatura
export type ProvedorAssinatura = 'authentic' | 'docusign' | 'clicksign';

// Status da assinatura
export type StatusAssinatura = 
  | 'pendente' 
  | 'enviado' 
  | 'visualizado' 
  | 'assinado' 
  | 'recusado' 
  | 'expirado' 
  | 'cancelado';

// Interface para configuração do provedor
export interface ConfiguracaoProvedor {
  apiKey: string;
  ambiente: 'sandbox' | 'producao';
  webhookUrl?: string;
}

// Interface para documento a ser assinado
export interface DocumentoAssinatura {
  id: string;
  nome: string;
  tipo: 'contrato' | 'termo' | 'proposta' | 'outro';
  conteudoBase64?: string;
  urlArquivo?: string;
}

// Interface para signatário
export interface Signatario {
  email: string;
  nome: string;
  cpf: string;
  telefone?: string;
  ordem: number; // 1 = primeiro a assinar
}

// Interface para requisição de assinatura
export interface RequisicaoAssinatura {
  oportunidadeId: string;
  documento: DocumentoAssinatura;
  signatarios: Signatario[];
  mensagem?: string;
  diasExpiracao?: number;
  provider: ProvedorAssinatura;
}

// Interface para resposta de assinatura
export interface RespostaAssinatura {
  id: string;
  status: StatusAssinatura;
  urlAssinatura?: string;
  dataEnvio?: string;
  dataAssinatura?: string;
  signatarios: {
    email: string;
    status: StatusAssinatura;
    dataAssinatura?: string;
  }[];
  erro?: string;
}

// Configurações dos provedores (em produção, buscar do backend)
let configuracoes: Record<ProvedorAssinatura, ConfiguracaoProvedor | null> = {
  authentic: null,
  docusign: null,
  clicksign: null
};

// 🎯 CONFIGURAÇÃO DOS PROVEDORES
export function configurarProvedor(
  provedor: ProvedorAssinatura, 
  config: ConfiguracaoProvedor
): void {
  configuracoes[provedor] = config;
}

export function getConfiguracaoProvedor(
  provedor: ProvedorAssinatura
): ConfiguracaoProvedor | null {
  return configuracoes[provedor];
}

// 🎯 CRIAÇÃO DE ENVELOPE DE ASSINATURA
export async function criarEnvelopeAssinatura(
  requisicao: RequisicaoAssinatura
): Promise<RespostaAssinatura> {
  const { provider } = requisicao;
  
  switch (provider) {
    case 'authentic':
      return criarEnvelopeAuthentic(requisicao);
    case 'docusign':
      return criarEnvelopeDocuSign(requisicao);
    case 'clicksign':
      return criarEnvelopeClicksign(requisicao);
    default:
      throw new Error(`Provedor não suportado: ${provider}`);
  }
}

// 🎯 AUTHENTIC - Implementação
async function criarEnvelopeAuthentic(
  requisicao: RequisicaoAssinatura
): Promise<RespostaAssinatura> {
  const config = configuracoes.authentic;
  if (!config) {
    throw new Error('Provedor Authentic não configurado');
  }

  // Simulando resposta (em produção, chamar API real)
  const envelopeId = `AUTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: envelopeId,
    status: 'enviado',
    urlAssinatura: `https://app.autentic.com.br/sign/${envelopeId}`,
    dataEnvio: new Date().toISOString(),
    signatarios: requisicao.signatarios.map(s => ({
      email: s.email,
      status: 'pendente' as StatusAssinatura
    }))
  };
}

// 🎯 DOCUSIGN - Implementação
async function criarEnvelopeDocuSign(
  requisicao: RequisicaoAssinatura
): Promise<RespostaAssinatura> {
  const config = configuracoes.docusign;
  if (!config) {
    throw new Error('Provedor DocuSign não configurado');
  }

  const envelopeId = `DS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: envelopeId,
    status: 'enviado',
    urlAssinatura: `https://demo.docusign.net/Signing/StartInSession.aspx?t=${envelopeId}`,
    dataEnvio: new Date().toISOString(),
    signatarios: requisicao.signatarios.map(s => ({
      email: s.email,
      status: 'pendente' as StatusAssinatura
    }))
  };
}

// 🎯 CLICKSIGN - Implementação
async function criarEnvelopeClicksign(
  requisicao: RequisicaoAssinatura
): Promise<RespostaAssinatura> {
  const config = configuracoes.clicksign;
  if (!config) {
    throw new Error('Provedor Clicksign não configurado');
  }

  const envelopeId = `CS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: envelopeId,
    status: 'enviado',
    urlAssinatura: `https://app.clicksign.com.br/sign/${envelopeId}`,
    dataEnvio: new Date().toISOString(),
    signatarios: requisicao.signatarios.map(s => ({
      email: s.email,
      status: 'pendente' as StatusAssinatura
    }))
  };
}

// 🎯 VERIFICAÇÃO DE STATUS
export async function verificarStatusAssinatura(
  envelopeId: string,
  provider: ProvedorAssinatura
): Promise<RespostaAssinatura> {
  // Em produção, chamar API do provedor para verificar status
  // Por agora, retorna status simulado
  return {
    id: envelopeId,
    status: 'pendente',
    signatarios: []
  };
}

// 🎯 CANCELAMENTO DE ASSINATURA
export async function cancelarAssinatura(
  envelopeId: string,
  provider: ProvedorAssinatura,
  motivo?: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Em produção, chamar API do provedor
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: String(error) };
  }
}

// 🎯 REENVIO DE SOLICITAÇÃO
export async function reenviarSolicitacao(
  envelopeId: string,
  signatarioEmail: string,
  provider: ProvedorAssinatura
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Em produção, chamar API do provedor
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: String(error) };
  }
}

// 🎯 DOWNLOAD DO DOCUMENTO ASSINADO
export async function downloadDocumentoAssinado(
  envelopeId: string,
  provider: ProvedorAssinatura
): Promise<{ url: string; erro?: string }> {
  try {
    // Em produção, chamar API do provedor para obter URL do PDF
    return { 
      url: `https://api.example.com/downloads/${envelopeId}.pdf` 
    };
  } catch (error) {
    return { url: '', erro: String(error) };
  }
}

// 🎯 HELPERS

// Verifica se todos os signatários assinaram
export function todosAssinaram(resposta: RespostaAssinatura): boolean {
  return resposta.signatarios.every(s => s.status === 'assinado');
}

// Verifica se há pendências
export function temPendencia(resposta: RespostaAssinatura): boolean {
  return resposta.signatarios.some(s => 
    s.status === 'pendente' || s.status === 'visualizado'
  );
}

// Obtém status label amigável
export function getStatusLabel(status: StatusAssinatura): string {
  const labels: Record<StatusAssinatura, string> = {
    pendente: 'Pendente',
    enviado: 'Enviado',
    visualizado: 'Visualizado',
    assinado: 'Assinado',
    recusado: 'Recusado',
    expirado: 'Expirado',
    cancelado: 'Cancelado'
  };
  return labels[status] || status;
}

// Obtém cor do status para UI
export function getStatusColor(status: StatusAssinatura): string {
  const cores: Record<StatusAssinatura, string> = {
    pendente: '#6b7280',    // gray
    enviado: '#3b82f6',     // blue
    visualizado: '#f59e0b', // amber
    assinado: '#22c55e',    // green
    recusado: '#ef4444',    // red
    expirado: '#dc2626',    // dark red
    cancelado: '#6b7280'    // gray
  };
  return cores[status] || '#6b7280';
}

// Provedores disponíveis para UI
export const PROVEDORES_DISPONIVEIS = [
  { 
    id: 'authentic', 
    nome: 'Authentic', 
    descricao: 'Plataforma brasileira de assinatura digital',
    logo: '🔐'
  },
  { 
    id: 'docusign', 
    nome: 'DocuSign', 
    descricao: 'Líder global em assinatura eletrônica',
    logo: '📝'
  },
  { 
    id: 'clicksign', 
    nome: 'Clicksign', 
    descricao: 'Assinatura digital fácil e segura',
    logo: '✍️'
  }
] as const;
