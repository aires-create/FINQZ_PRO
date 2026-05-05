// FINQZ PRO - TypeScript Types

// ============================================
// PARCEIRO / PARTNER TYPES
// ============================================

// Tipos de Partner (hierarquia)
export type PartnerType = 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

// Status de Partner
export type PartnerStatus = 'prospect' | 'contato' | 'negociacao' | 'ativo' | 'inativo';

// Interface de Partner com suporte a hierarquia
export interface Partner {
  id: number;
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
  status: PartnerStatus;
  parent_id?: number | null;
  gestor_id?: string;
  comissao_company?: number;
  comissao_franquia?: number;
  comissao_franqueado?: number;
  created_at?: number;
  updated_at?: number;
  codigo?: string;
  // Campos calculados para UI
  children?: Partner[];
  fullPath?: string[];
}

// Interface para filtro de parceiros
export interface PartnerFilter {
  tipo?: PartnerType;
  status?: PartnerStatus;
  search?: string;
  parent_id?: number;
  includeChildren?: boolean;
}

// ============================================
// PARTNER HELPER FUNCTIONS
// ============================================

// Labels para tipos de Partner
export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  COMPANY: 'Empresa Matriz',
  FRANQUIA: 'Franquia',
  FRANQUEADO: 'Franqueado',
};

// Labels para status de Partner
export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  prospect: 'Prospect',
  contato: 'Contato',
  negociacao: 'Negociação',
  ativo: 'Ativo',
  inativo: 'Inativo',
};

// Verifica se um partner é raiz (não tem parent)
export const isRootPartner = (partner: Partner): boolean => {
  return !partner.parent_id || partner.parent_id === null;
};

// Verifica se um partner é COMPANY
export const isCompany = (partner: Partner): boolean => {
  return partner.tipo === 'COMPANY';
};

// Verifica se um partner é FRANQUIA
export const isFranquia = (partner: Partner): boolean => {
  return partner.tipo === 'FRANQUIA';
};

// Verifica se um partner é FRANQUEADO
export const isFranqueado = (partner: Partner): boolean => {
  return partner.tipo === 'FRANQUEADO';
};

// Constrói a árvore hierárquica de parceiros
export const buildPartnerTree = (partners: Partner[]): Partner[] => {
  const partnerMap = new Map<number, Partner>();
  const roots: Partner[] = [];

  // Primeiro, cria o mapa de parceiros
  partners.forEach((p) => {
    partnerMap.set(p.id, { ...p, children: [] });
  });

  // Depois, constrói a árvore
  partners.forEach((p) => {
    const partner = partnerMap.get(p.id)!;
    if (p.parent_id && partnerMap.has(p.parent_id)) {
      const parent = partnerMap.get(p.parent_id)!;
      parent.children = parent.children || [];
      parent.children.push(partner);
    } else {
      roots.push(partner);
    }
  });

  return roots;
};

// Obtém todos os IDs de parceiros filhos (recursivo)
export const getAllChildIds = (partner: Partner): number[] => {
  const ids: number[] = [];
  if (partner.children) {
    partner.children.forEach((child) => {
      ids.push(child.id);
      ids.push(...getAllChildIds(child));
    });
  }
  return ids;
};

// Obtém o caminho completo do partner na hierarquia
export const getPartnerPath = (partner: Partner, allPartners: Partner[]): string[] => {
  const path: string[] = [partner.nome];
  let current = partner;

  while (current.parent_id) {
    const parent = allPartners.find((p) => p.id === current.parent_id);
    if (parent) {
      path.unshift(parent.nome);
      current = parent;
    } else {
      break;
    }
  }

  return path;
};

// ============================================
// PIPELINE TYPES
// ============================================

// Tipos de Pipeline
export type PipelineTipo = 'credito' | 'energia' | 'veiculo' | 'onboarding_colaborador' | 'onboarding_parceiro';

// Tipos de PIX
export type PixType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

// Tipos de Provedor de Assinatura
export type ProvedorAssinatura = 'authentic' | 'docusign' | 'clicksign';

// Status da Assinatura Digital
export type StatusAssinatura = 
  | 'contrato_nao_enviado'
  | 'contrato_enviado'
  | 'aguardando_assinatura'
  | 'assinado'
  | 'recusado'
  | 'expirado'
  | 'erro_envio';

// Status do Documento
export type StatusDocumento = 'pendente' | 'enviado' | 'aprovado' | 'recusado';

// Interface de Assinatura Digital
export interface AssinaturaDigital {
  provedor?: ProvedorAssinatura;
  status?: StatusAssinatura;
  envelopeId?: string;
  documentId?: string;
  signUrl?: string;
  sentAt?: number;
  signedAt?: number;
  errorMessage?: string;
}

// Interface de Documento
export interface Documento {
  id: string;
  nome: string;
  tipoDocumento: string;
  arquivo?: string;
  mimeType?: string;
  dataUpload?: number;
  status: StatusDocumento;
  observacao?: string;
  obrigatorio: boolean;
}

// Tipos de Pipeline Configurável
export interface PipelineConfig {
  id: string;
  nome: string;
  tipo: PipelineTipo;
  descricao?: string;
  etapas?: string[];
  camposExtras?: string[];
  documentosObrigatorios?: string[];
  automacoes?: Record<string, any>;
  assinaturaDigital?: boolean;
}

// Mapeamento de produto legado para pipeline
export const LEGACY_PRODUCT_TO_PIPELINE: Record<string, string> = {
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

// Dados Bancários
export interface BankData {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: 'corrente' | 'poupanca';
  titular?: string;
  documentoTitular?: string;
  pixTipo?: PixType;
  pixChave?: string;
}

// Pipeline types
export interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  cor?: string;
  ativo: boolean;
  obrigatorios?: Record<string, boolean>; // { campo_key: true/false }
  tags?: string[];
  bloqueiaAvanco?: boolean;
}

export interface PipelineColumn {
  id: string;
  nome: string;
  ordem: number;
  cor?: string;
}

export interface Pipeline {
  id: string;
  nome: string;
  produto?: string;
  ativo?: boolean;
  colunas: PipelineColumn[];
  etapas?: Etapa[];
}

// Oportunidade com suporte a pipeline dinâmico
export interface OportunidadeKanban {
  id: number;
  nome: string;
  telefone: string;
  produto?: string; // Legado - manter para compatibilidade
  pipeline_id: string;
  pipelineNome?: string;
  pipelineTipo?: PipelineTipo;
  coluna_id: string;
  etapaId?: string;
  valor?: number;
  valorEstimado?: number;
  status?: string;
  origem?: string;
  responsavelId?: number;
  cliente_nome?: string;
  documentos?: string;
  documentosList?: Documento[]; // Nova estrutura de documentos
  tags?: string[]; // IDs das tags
  // Assinatura Digital
  assinaturaDigital?: AssinaturaDigital;
  // Campos de data
  created_at?: string | number; // Data de criação
  updated_at?: string | number; // Data de atualização
  data_integracao?: string | number; // Data de integração/fechamento
  // Campos específicos para onboarding
  tipoParceiro?: 'Company' | 'Franquia' | 'Franqueado';
  tipoColaborador?: 'PF' | 'PJ';
  cpfCnpj?: string;
  email?: string;
  dadosBancarios?: BankData;
  comissaoCompany?: number;
  comissaoFranquia?: number;
  comissaoFranqueado?: number;
  // Dados de colaborador
  cargo?: string;
  area?: string;
  gestorResponsavel?: string;
  dataInicio?: string;
  modeloRemuneracao?: 'fixa' | 'variavel' | 'fixa_variavel';
  valorFixoMensal?: number;
  percentualVariavel?: number;
  regraComissao?: string;
  centroCusto?: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: 'ativo' | 'inativo' | 'nao_perturbe';
  observacao?: string;
  // Novos campos
  codigo?: string;
  code?: string;
  profissao?: string;
  estado_civil?: string;
  responsavel_legal?: string;
  cpf_responsavel?: string;
  sexo?: 'masculino' | 'feminino' | 'outro' | 'nao_informar';
  bankData?: BankData;
  created_at: number;
  updated_at: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  pipeline: string;
  documentos?: string;
  ativo: number;
  // Campos personalizados
  categoria?: string;
  taxa_juros?: number;
  prazo_minimo?: number;
  prazo_maximo?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  comissao?: number;
  requisitos?: string;
  observacoes?: string;
  created_at: number;
  updated_at: number;
}

// Histórico de alterações
export interface HistoricoItem {
  id: number;
  data: number;
  tipo: "criacao" | "edicao" | "ativacao" | "inativacao" | "exclusao" | "importacao" | "integracao" | "automacao";
  usuario?: string;
  campo?: string;
  valor_anterior?: string;
  valor_novo?: string;
  descricao: string;
  metadata?: Record<string, any>;
}

// Estrutura Comercial - Hierarquia completa para API, Integrações, Automações e Financeiro
export type EstruturaComercialNivel = 
  | "vertical"
  | "produto"
  | "subproduto"
  | "fornecedor_originador"
  | "tabela_plano_campanha"
  | "condicao_comercial";

export type FornecedorTipo = 
  | "banco"
  | "promotora"
  | "comercializadora"
  | "seguradora"
  | "administradora_consorcio"
  | "fintech"
  | "correspondente"
  | "parceiro_operacional"
  | "outro";

export interface EstruturaComercial {
  id: number;
  parent_id?: number | null;

  nivel: EstruturaComercialNivel;

  vertical?: string;
  tipo?: string;
  nome: string;
  codigo?: string;
  descricao?: string;

  fornecedor_tipo?: FornecedorTipo;
  fornecedor_nome?: string;
  fornecedor_codigo?: string;
  produto_nome?: string;
  subproduto_nome?: string;

  convenio?: string;
  modalidade?: string;
  canal_venda?: string;

  tabela_nome?: string;
  tabela_codigo?: string;
  plano_nome?: string;
  campanha_nome?: string;

  taxa_juros?: number;
  prazo_minimo?: number;
  prazo_maximo?: number;
  prazo?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  coeficiente?: number;

  comissao_flat?: number;
  comissao_bonus?: number;
  comissao_adiantamento?: number;
  comissao_total?: number;
  comissao_fixa?: number;
  comissao_recorrente?: number;
  regra_comissao?: string;

  desconto_percentual?: number;
  economia_estimada?: number;
  consumo_medio_kwh?: number;
  valor_medio_conta?: number;

  validade_inicio?: string;
  validade_fim?: string;
  ativo: 0 | 1;

  // Histórico de alterações
  historico?: HistoricoItem[];
  
  // Status de vigência
  vigencia_status?: "ativa" | "vencida" | "vencendo" | "nao_iniciada" | "indefinida";

  external_id?: string;
  api_source?: string;
  integration_id?: string;
  sync_status?: "pending" | "synced" | "error" | "disabled";
  last_sync_at?: number | null;

  status_integracao?: string;
  origem_integracao?: string;
  payload_integracao?: Record<string, any>;
  retorno_integracao?: Record<string, any>;
  erro_integracao?: string;
  data_ultima_integracao?: number | null;

  automation_enabled?: boolean;
  automation_rules?: Record<string, any>;
  automation_triggers?: string[];
  automation_actions?: string[];
  next_automation_run?: number | null;
  last_automation_run?: number | null;
  automation_status?: "active" | "paused" | "error" | "disabled";

  financeiro_enabled?: boolean;
  tipo_receita?: "unica" | "recorrente" | "hibrida";
  regra_repasse?: Record<string, any>;
  split_comissao?: Record<string, any>;
  parceiro_repasse_id?: number | null;
  colaborador_repasse_id?: number | null;
  centro_custo?: string;
  conta_contabil?: string;

  import_batch_id?: string;
  import_source?: string;
  imported_at?: number;
  imported_by?: string;
  import_status?: "valid" | "error" | "imported" | "updated" | "ignored";
  import_error?: string;

  metadata?: Record<string, any>;

  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

// Roteiros Operacionais - Módulo de treinamentos, comunicados, scripts e materiais
export type RoteiroOperacionalNivel = 
  | "categoria"
  | "tipo_conteudo"
  | "origem"
  | "roteiro";

export type OrigemTipo = 
  | "finqz_interno"
  | "banco"
  | "promotora"
  | "comercializadora"
  | "seguradora"
  | "administradora_consorcio"
  | "parceiro_operacional"
  | "correspondente"
  | "outro";

export type FormatoConteudo = 
  | "texto"
  | "video"
  | "pdf"
  | "link"
  | "checklist"
  | "faq"
  | "arquivo";

export type VideoProvider = "youtube" | "vimeo" | "loom" | "drive" | "outro";

export type Prioridade = "baixa" | "media" | "alta" | "critica";

export type StatusPublicacao = "rascunho" | "publicado" | "arquivado";

export type SyncStatus = "pending" | "synced" | "error" | "disabled";

export type AutomationStatus = "active" | "paused" | "error" | "disabled";

export interface ChecklistItem {
  texto: string;
  obrigatorio: boolean;
  concluido: boolean;
  ordem: number;
}

export interface FAQItem {
  pergunta: string;
  resposta: string;
  ordem: number;
}

export interface RoteiroOperacional {
  id: number;
  parent_id?: number | null;

  nivel: RoteiroOperacionalNivel;

  nome: string;
  codigo?: string;
  descricao?: string;

  categoria?: string;
  tipo?: string;
  origem_tipo?: OrigemTipo;

  origem_nome?: string;
  origem_codigo?: string;

  conteudo?: string;
  resumo?: string;

  formato_conteudo?: FormatoConteudo;

  url?: string;
  video_url?: string;
  video_provider?: VideoProvider;
  thumbnail_url?: string;
  duracao_segundos?: number;

  arquivo_nome?: string;
  arquivo_url?: string;
  arquivo_tipo?: string;

  tags?: string[];

  relacionado_estrutura_id?: number | null;
  relacionado_vertical?: string;
  relacionado_produto?: string;
  relacionado_subproduto?: string;
  relacionado_fornecedor?: string;
  relacionado_tabela?: string;

  prioridade?: Prioridade;
  publico_alvo?: string[];
  obrigatorio?: boolean;

  validade_inicio?: string;
  validade_fim?: string;

  version?: number;
  status_publicacao?: StatusPublicacao;

  ativo: 0 | 1;

  // Auditoria
  criado_por?: string;
  atualizado_por?: string;
  publicado_em?: number | null;
  arquivado_em?: number | null;

  // API e integração futura
  external_id?: string;
  integration_id?: string;
  api_source?: string;
  sync_status?: SyncStatus;
  last_sync_at?: number | null;

  // Automação futura
  automation_enabled?: boolean;
  automation_rules?: Record<string, any>;
  automation_triggers?: string[];
  automation_actions?: string[];
  automation_status?: AutomationStatus;

  metadata?: Record<string, any>;

  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

// ============================================
// FINANCEIRO - Módulo Financeiro da Empresa
// ============================================

export type TransacaoTipo = 
  | "credito"
  | "debito"
  | "estorno_credito"
  | "estorno_debito"
  | "transferencia"
  | "taxa"
  | "juros"
  | "multa"
  | "cashback"
  | "campanha"
  | "bonificacao"
  | "ajuste";

export type TransacaoCategoria =
  | "comissao"
  | "repasse"
  | "taxa_administrativa"
  | "receita"
  | "despesa"
  | "investimento"
  | "cashback"
  | "campanha"
  | "bonificacao"
  | "estorno"
  | "transferencia"
  | "imposto"
  | "outro";

export type TransacaoStatus = 
  | "pendente"
  | "confirmado"
  | "cancelado"
  | "estornado"
  | "processando";

export type TransacaoFormaPagamento =
  | "dinheiro"
  | "pix"
  | "boleto"
  | "transferencia_bancaria"
  | "debito_conta"
  | "credito_conta"
  | "cheque"
  | "carteira_digital"
  | "outro";

export interface TransacaoFinanceira {
  id: number;
  
  // Identificação
  codigo: string;
  tipo: TransacaoTipo;
  categoria: TransacaoCategoria;
  status: TransacaoStatus;
  
  // Valores
  valor: number;
  valor_original?: number;
  valor_taxa?: number;
  valor_liquido?: number;
  
  // Datas
  data_transacao: string;
  data_vencimento?: string;
  data_pagamento?: string;
  data_confirmacao?: number | null;
  
  // Partes envolvidas
  parceiro_id?: number | null;
  parceiro_nome?: string;
  franqueado_id?: number | null;
  franqueado_nome?: string;
  usuario_id?: string;
  usuario_nome?: string;
  
  // Descrição
  descricao: string;
  observacao?: string;
  
  // Forma de pagamento
  forma_pagamento?: TransacaoFormaPagamento;
  banco_origem?: string;
  banco_destino?: string;
  agencia_origem?: string;
  agencia_destino?: string;
  conta_origem?: string;
  conta_destino?: string;
  
  // Referências
  oportunidade_id?: number | null;
  oportunidade_nome?: string;
  contrato_id?: number | null;
  contrato_codigo?: string;
  
  // Campanha / Cashback
  campanha_id?: number | null;
  campanha_nome?: string;
  cashback_percentual?: number;
  cashback_valor?: number;
  
  // Commission / Repasse
  comissao_percentual?: number;
  comissao_valor?: number;
  repasse_percentual?: number;
  repasse_valor?: number;
  
  // Estorno
  estorno_de?: number | null;
  estorno_motivo?: string;
  
  // Competência
  mes_referencia?: number;
  ano_referencia?: number;
  
  // Tags
  tags?: string[];
  
  // Anexos
  anexo_url?: string;
  anexo_nome?: string;
  
  // Auditoria
  criado_por?: string;
  atualizado_por?: string;
  
  // Integração
  external_id?: string;
  integration_id?: string;
  api_source?: string;
  
  metadata?: Record<string, any>;
  
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

export interface FinanceiroSaldo {
  parceiro_id: number;
  saldo_atual: number;
  saldo_pendente: number;
  total_creditos: number;
  total_debitos: number;
  total_estornos: number;
  total_cashback: number;
  ultima_atualizacao: number;
}

export interface FinanceiroFiltros {
  data_inicio?: string;
  data_fim?: string;
  tipo?: TransacaoTipo;
  categoria?: TransacaoCategoria;
  status?: TransacaoStatus;
  parceiro_id?: number;
  forma_pagamento?: TransacaoFormaPagamento;
  busca?: string;
}

// ============================================
// CONTA CORRENTE - Módulo de Conta Corrente dos Parceiros
// ============================================

export type MovimentoTipo = 
  | "credito"
  | "debito"
  | "estorno";

export type MovimentoCategoria =
  | "recebimento"
  | "comissao"
  | "repasse"
  | "taxa"
  | "cashback"
  | "bonificacao"
  | "estorno"
  | "ajuste"
  | "taxa_administrativa"
  | "mensalidade";

export type MovimentoStatus =
  | "pendente"
  | "disponivel"
  | "reservado"
  | "solicitado"
  | "transferido"
  | "cancelado";

export type MovimentoOrigem =
  | "venda"
  | "comissao"
  | "repasse"
  | "cashback"
  | "estorno"
  | "ajuste"
  | "taxa"
  | "saque"
  | "transferencia";

export interface ContaCorrenteMovimento {
  id: number;
  parceiro_id: number;
  
  // Identificação
  codigo: string;
  tipo: MovimentoTipo;
  categoria: MovimentoCategoria;
  origem: MovimentoOrigem;
  status: MovimentoStatus;
  
  // Valores
  valor: number;
  valor_original?: number;
  valor_taxa?: number;
  valor_liquido?: number;
  
  // Datas
  data_movimento: string;
  data_vencimento?: string;
  data_credito?: string;
  data_disponivel?: string;
  
  // Descrição
  descricao: string;
  observacao?: string;
  
  // Referências
  oportunidade_id?: number | null;
  oportunidade_nome?: string;
  cliente_nome?: string;
  produto_nome?: string;
  contrato_codigo?: string;
  
  // Campanha
  campanha_id?: number | null;
  campanha_nome?: string;
  cashback_percentual?: number;
  cashback_valor?: number;
  
  // Comissão/Repasse
  comissao_percentual?: number;
  comissao_valor?: number;
  taxa_administrativa?: number;
  
  // Saldo
  saldo_anterior?: number;
  saldo_posterior?: number;
  
  // Saque/Transferência
  forma_saque?: "pix" | "transferencia" | "boleto";
  banco_destino?: string;
  agencia_destino?: string;
  conta_destino?: string;
  chave_pix?: string;
  status_saque?: "pendente" | "processando" | "aprovado" | "rejeitado" | "pago";
  
  // Estorno
  estorno_de?: number | null;
  estorno_motivo?: string;
  
  // Competência
  mes_referencia?: number;
  ano_referencia?: number;
  
  // Tags
  tags?: string[];
  
  // Auditoria
  criado_por?: string;
  atualizado_por?: string;
  
  // Integração
  external_id?: string;
  integration_id?: string;
  
  metadata?: Record<string, any>;
  
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

export interface ContaCorrenteSaldo {
  parceiro_id: number;
  parceiro_nome?: string;
  
  // Saldos
  saldo_total: number;
  saldo_disponivel: number;
  saldo_pendente: number;
  saldo_reservado: number;
  saldo_bloqueado: number;
  
  // Totais
  total_creditos: number;
  total_debitos: number;
  total_estornos: number;
  total_cashback: number;
  total_taxas: number;
  total_saques: number;
  
  // Limites
  limite_saque?: number;
  limite_credito?: number;
  
  // Informações bancárias
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
  
  ultima_atualizacao: number;
}

export interface ContaCorrenteExtrato {
  parceiro_id: number;
  data_inicio: string;
  data_fim: string;
  saldo_inicial: number;
  saldo_final: number;
  total_creditos: number;
  total_debitos: number;
  movimentos: ContaCorrenteMovimento[];
}

export interface ContaCorrenteFiltros {
  data_inicio?: string;
  data_fim?: string;
  tipo?: MovimentoTipo;
  categoria?: MovimentoCategoria;
  status?: MovimentoStatus;
  busca?: string;
}

export interface Parceiro {
  id: number;
  codigo: number;
  nome: string;
  tipo: 'company' | 'franquia' | 'franqueado';
  cpf_cnpj?: string;
  responsavel?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: 'prospect' | 'contato' | 'negociacao' | 'ativo' | 'inativo' | 'nao_perturbe';
  // Novos campos baseados em Cliente
  profissao?: string;
  estado_civil?: string;
  responsavel_legal?: string;
  cpf_responsavel?: string;
  sexo?: "" | "masculino" | "feminino" | "outro" | "nao_informar";
  data_nascimento?: string;
  // Dados Bancários
  bankData?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: "" | "corrente" | "poupanca";
    titular?: string;
    documentoTitular?: string;
    pixTipo?: "" | "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
    pixChave?: string;
  };
  // Credenciais de acesso
  login?: string;
  senha?: string;
  // Documentos
  documentos?: Array<{
    nome: string;
    tipo: string;
    arquivo: string;
    data: number;
  }>;
  // Campos existentes
  parent_id?: number;
  gestor_id?: string;
  comissao_company: number;
  comissao_franquia: number;
  comissao_franqueado: number;
  observacao?: string;
  created_at: number;
  updated_at: number;
}

export interface Oportunidade {
  id: number;
  cliente_id: number;
  produto_id: number;
  parceiro_id?: number;
  usuario_id?: string;
  status: 'entrada' | 'analise' | 'documentacao' | 'aprovado' | 'reprovado' | 'finalizado';
  valor: number;
  probabilidade: number;
  observacoes?: string;
  created_at: number;
  updated_at: number;
  cliente?: Cliente;
  produto?: Produto;
}

export interface Documento {
  id: number;
  oportunidade_id: number;
  tipo: 'rg_cnh' | 'comprovante_residencia' | 'comprovante_renda' | 'outros';
  arquivo?: string;
  status: 'pendente' | 'aprovado' | 'reprovado';
  created_at: number;
  updated_at: number;
}

export interface Comissao {
  id: number;
  oportunidade_id: number;
  parceiro_id?: number;
  usuario_id?: string;
  nivel: 'company' | 'franquia' | 'franqueado' | 'vendedor';
  percentual: number;
  valor: number;
  status: 'pendente' | 'pago' | 'cancelado';
  created_at: number;
  updated_at: number;
}

export interface UsuarioPerfil {
  id: number;
  usuario_id: string;
  perfil: 'admin' | 'master' | 'financeiro' | 'comercial_diretoria' | 'regional' | 'gerente' | 'vendedor' | 'bko';
  parceiro_id?: number;
  regiao?: string;
  equipe?: string;
  created_at: number;
  updated_at: number;
}

export interface Automacao {
  id: number;
  nome: string;
  descricao?: string;
  // Campos em snake_case (original)
  trigger_tipo?: string;
  trigger_condicao?: string;
  acao_tipo?: string;
  acao_parametros?: string;
  // Campos em camelCase (do banco de dados)
  triggerTipo?: string;
  triggerCondicao?: string;
  acaoTipo?: string;
  acaoParametros?: string;
  // Campos para automação de etapa
  etapa_origem?: string;
  etapa_destino?: string;
  pipeline_id?: string;
  ativo: number;
  created_at?: number;
  createdAt?: number;
  updated_at?: number;
  updatedAt?: number;
}

// Tipos de trigger para automações
export type TriggerType = 
  | "status_change" 
  | "etapa_change" 
  | "lead_criado" 
  | "tempo_decorrido"
  | "campo_alterado";

// Tipos de ação para automações
export type AcaoType = 
  | "whatsapp" 
  | "email" 
  | "notificacao" 
  | "atualizar_campo"
  | "mover_etapa"
  | "webhook";

export interface DashboardKPIs {
  totalClientes: number;
  totalOportunidades: number;
  totalParceiros: number;
  totalVendas: number;
  taxaConversao: string;
}

export interface DashboardProducao {
  producao: number;
  projetado: number;
  monthlyData: { mes: string; valor: number }[];
}

export interface DashboardFunil {
  entrada: { count: number; valor: number };
  analise: { count: number; valor: number };
  documentacao: { count: number; valor: number };
  aprovado: { count: number; valor: number };
  reprovado: { count: number; valor: number };
  finalizado: { count: number; valor: number };
}

// Pipeline stages
// Pipeline stages - OFICIAL
export const PIPELINE_STAGES = [
  { key: 'novo_lead', label: 'Novo Lead', color: '#59a8f0' },
  { key: 'negociacao', label: 'Negociação', color: '#3388d9' },
  { key: 'aguardando_assinatura', label: 'Aguardando Assinatura', color: '#000dff' },
  { key: 'pendencia', label: 'Pendência', color: '#f59e0b' },
  { key: 'formalizacao', label: 'Formalização', color: '#8b5cf6' },
  { key: 'integrado', label: 'Integrado', color: '#22c55e' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444' },
] as const;

// Partner statuses
export const PARCEIRO_STATUSES = [
  { key: 'prospect', label: 'Prospecção' },
  { key: 'contato', label: 'Contato' },
  { key: 'negociacao', label: 'Negociação' },
  { key: 'ativo', label: 'Ativo' },
  { key: 'inativo', label: 'Inativo' },
] as const;

// User profiles
export const USER_PROFILES = [
  { key: 'admin', label: 'Administrador do Sistema' },
  { key: 'master', label: 'Master' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'comercial_diretoria', label: 'Comercial - Diretoria' },
  { key: 'regional', label: 'Regional' },
  { key: 'gerente', label: 'Gerente' },
  { key: 'vendedor', label: 'Vendedor' },
  { key: 'bko', label: 'BKO' },
] as const;

// Document types
export const DOCUMENTO_TIPOS = [
  { key: 'rg_cnh', label: 'RG/CNH' },
  { key: 'comprovante_residencia', label: 'Comprovante de Residência' },
  { key: 'comprovante_renda', label: 'Comprovante de Renda' },
  { key: 'outros', label: 'Outros' },
] as const;

// ============================================
// PERMISSIONS SYSTEM - Permissões por Ação
// ============================================

// Definição de ações por módulo
export interface ModulePermission {
  key: string;
  label: string;
  description?: string;
}

export interface ModulePermissions {
  module: string;
  label: string;
  actions: ModulePermission[];
}

// Lista de todos os módulos e suas ações
export const MODULE_PERMISSIONS: ModulePermissions[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Acessar o dashboard' },
    ],
  },
  {
    module: 'clientes',
    label: 'Clientes',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista de clientes' },
      { key: 'create', label: 'Criar', description: 'Cadastrar novos clientes' },
      { key: 'edit', label: 'Editar', description: 'Alterar dados de clientes' },
      { key: 'delete', label: 'Excluir', description: 'Remover clientes' },
    ],
  },
  {
    module: 'oportunidades',
    label: 'Oportunidades',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Ver pipeline de oportunidades' },
      { key: 'create', label: 'Criar', description: 'Criar novas oportunidades' },
      { key: 'edit', label: 'Editar', description: 'Editar oportunidades' },
      { key: 'delete', label: 'Excluir', description: 'Excluir oportunidades' },
      { key: 'move_card', label: 'Mover Cards', description: 'Arrastar entre colunas' },
      { key: 'edit_pipeline', label: 'Editar Pipeline', description: 'Criar/editar colunas e pipelines' },
    ],
  },
  {
    module: 'parceiros',
    label: 'Parceiros',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista de parceiros' },
      { key: 'create', label: 'Criar', description: 'Cadastrar novos parceiros' },
      { key: 'edit', label: 'Editar', description: 'Alterar dados de parceiros' },
      { key: 'delete', label: 'Excluir', description: 'Remover parceiros' },
    ],
  },
  {
    module: 'produtos',
    label: 'Produtos',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista de produtos' },
      { key: 'create', label: 'Criar', description: 'Cadastrar novos produtos' },
      { key: 'edit', label: 'Editar', description: 'Alterar dados de produtos' },
      { key: 'delete', label: 'Excluir', description: 'Remover produtos' },
    ],
  },
  {
    module: 'relatorios',
    label: 'Relatórios',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Acessar relatórios' },
      { key: 'export', label: 'Exportar', description: 'Exportar relatórios' },
    ],
  },
  {
    module: 'auditoria',
    label: 'Auditoria',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Acessar logs de auditoria' },
    ],
  },
  {
    module: 'usuarios',
    label: 'Usuários',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista de usuários' },
      { key: 'create', label: 'Criar', description: 'Cadastrar novos usuários' },
      { key: 'edit', label: 'Editar', description: 'Alterar dados de usuários' },
      { key: 'delete', label: 'Excluir', description: 'Remover usuários' },
      { key: 'manage_permissions', label: 'Gerenciar Permissões', description: 'Editar permissões de usuários' },
    ],
  },
  {
    module: 'configuracoes',
    label: 'Configurações',
    actions: [
      { key: 'access', label: 'Acessar', description: 'Acessar configurações do sistema' },
      { key: 'edit', label: 'Editar', description: 'Alterar configurações' },
    ],
  },
  {
    module: 'automacoes',
    label: 'Automações',
    actions: [
      { key: 'view', label: 'Visualizar', description: 'Ver automações' },
      { key: 'create', label: 'Criar', description: 'Criar automações' },
      { key: 'edit', label: 'Editar', description: 'Editar automações' },
      { key: 'delete', label: 'Excluir', description: 'Excluir automações' },
    ],
  },
];

// Tipo para perfil com permissões
export type PermissionKey = string;

// ========================================
// TENANT STRUCTURE
// ========================================

export type TenantType = 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

export interface Tenant {
  id: string;
  nome: string;
  tipo: TenantType;
  cnpj?: string;
  parent_id?: string;
  ativo: boolean;
  created_at: number;
  updated_at: number;
}

// ========================================
// SCOPES (DATA VISIBILITY)
// ========================================

export type Scope = 'OWN' | 'FRANQUEADO' | 'FRANQUIA' | 'COMPANY' | 'GLOBAL';

// ========================================
// PERMISSIONS
// ========================================

export type Permission =
  // SYSTEM
  | 'SYSTEM_VIEW'
  | 'SYSTEM_CONFIG'
  | 'SYSTEM_USERS_MANAGE'
  | 'SYSTEM_ROLES_MANAGE'
  | 'SYSTEM_LOGS_VIEW'
  // FINANCE
  | 'FINANCE_VIEW'
  | 'FINANCE_CREATE'
  | 'FINANCE_EDIT'
  | 'FINANCE_DELETE'
  | 'FINANCE_APPROVE'
  | 'FINANCE_EXPORT'
  // SALES
  | 'SALES_VIEW'
  | 'SALES_CREATE'
  | 'SALES_EDIT'
  | 'SALES_DELETE'
  | 'SALES_EXPORT'
  // CUSTOMER
  | 'CUSTOMER_VIEW'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_EDIT'
  | 'CUSTOMER_DELETE'
  // CONTRACT
  | 'CONTRACT_VIEW'
  | 'CONTRACT_CREATE'
  | 'CONTRACT_EDIT'
  | 'CONTRACT_DELETE'
  | 'CONTRACT_APPROVE'
  // DISPUTE (CONTESTACAO)
  | 'DISPUTE_VIEW'
  | 'DISPUTE_CREATE'
  | 'DISPUTE_EDIT'
  | 'DISPUTE_APPROVE'
  | 'DISPUTE_RESOLVE'
  // AUDIT
  | 'AUDIT_VIEW'
  | 'AUDIT_EXECUTE'
  | 'AUDIT_REPORT'
  // BACKOFFICE
  | 'BACKOFFICE_VIEW'
  | 'BACKOFFICE_EDIT'
  // REPORT
  | 'REPORT_VIEW'
  | 'REPORT_EXPORT'
  // REGIONAL
  | 'REGIONAL_VIEW'
  | 'REGIONAL_MANAGE_SCOPE'
  // DASHBOARD
  | 'DASHBOARD_VIEW'
  // SDR IA
  | 'SDR_IA_USE';

// ========================================
// ROLES
// ========================================

export type Role =
  | 'ROLE_ADMIN_SISTEMA'
  | 'ROLE_CEO'
  | 'ROLE_DIRETOR_AUDITORIA'
  | 'ROLE_GERENTE_AUDITORIA'
  | 'ROLE_AUDITOR'
  | 'ROLE_DIRETOR_FINANCEIRO'
  | 'ROLE_GERENTE_FINANCEIRO'
  | 'ROLE_ANALISTA_FINANCEIRO'
  | 'ROLE_ASSISTENTE_FINANCEIRO'
  | 'ROLE_GERENTE_CONTESTACAO'
  | 'ROLE_ANALISTA_CONTESTACAO'
  | 'ROLE_ASSISTENTE_CONTESTACAO'
  | 'ROLE_SUPERINTENDENTE'
  | 'ROLE_DIRETOR_COMERCIAL_B2C'
  | 'ROLE_GERENTE_COMERCIAL_B2C'
  | 'ROLE_CONSULTOR_COMERCIAL_B2C'
  | 'ROLE_DIRETOR_COMERCIAL_B2B'
  | 'ROLE_GERENTE_COMERCIAL_B2B'
  | 'ROLE_CONSULTOR_COMERCIAL_B2B'
  | 'ROLE_GERENTE_REGIONAL_B2C'
  | 'ROLE_GERENTE_REGIONAL_B2B'
  | 'ROLE_SUPERVISOR_BACKOFFICE'
  | 'ROLE_ASSISTENTE_BACKOFFICE';

// ========================================
// AUTH TYPES - Tipos para autenticação padronizada
// ========================================

// Status do usuário
export type UserStatus = 'ativo' | 'inativo' | 'bloqueado' | 'pendente';

// Escopo de acesso do usuário
export type AccessScope = 'GLOBAL' | 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

// Tipo de código de acesso
export type AccessCodeType = 'INTERNAL' | 'PARTNER';

// Interface de usuário para autenticação
export interface AuthUser {
  id: string;
  access_code: string;
  email: string;
  nome: string;
  role: Role;
  scope: AccessScope;
  partner_id?: number;
  tenant_id?: string;
  status: UserStatus;
  must_change_password: boolean;
  temporary_password_expires_at?: number;
  failed_login_attempts: number;
  locked_until?: number;
  last_login_at?: number;
  mfa_enabled: boolean;
  permissions: string[];
  created_at: number;
  updated_at: number;
}

// Credenciais de login
export interface LoginCredentials {
  access_code_or_email: string;
  senha: string;
}

// Resultado de login
export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  must_change_password?: boolean;
  temporary_password?: string;
  access_code?: string;
}

// Dados para criação de usuário
export interface CreateUserData {
  nome: string;
  email: string;
  role: Role;
  partner_id?: number;
  scope?: AccessScope;
  send_email?: boolean;
}

// ========================================
// ROLE → PERMISSIONS MAPPING
// ========================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // SYSTEM
  ROLE_ADMIN_SISTEMA: [
    'SYSTEM_VIEW', 'SYSTEM_CONFIG', 'SYSTEM_USERS_MANAGE', 'SYSTEM_ROLES_MANAGE', 'SYSTEM_LOGS_VIEW',
    'DASHBOARD_VIEW', 'REPORT_VIEW', 'REPORT_EXPORT', 'SDR_IA_USE'
  ],
  ROLE_CEO: [
    'DASHBOARD_VIEW', 'REPORT_VIEW', 'REPORT_EXPORT', 'AUDIT_VIEW', 'FINANCE_VIEW', 'SALES_VIEW', 'CUSTOMER_VIEW'
  ],
  // AUDIT
  ROLE_DIRETOR_AUDITORIA: ['AUDIT_VIEW', 'AUDIT_EXECUTE', 'AUDIT_REPORT', 'SYSTEM_LOGS_VIEW', 'FINANCE_VIEW', 'SALES_VIEW', 'CUSTOMER_VIEW', 'CONTRACT_VIEW', 'DISPUTE_VIEW'],
  ROLE_GERENTE_AUDITORIA: ['AUDIT_VIEW', 'AUDIT_EXECUTE', 'AUDIT_REPORT', 'SYSTEM_LOGS_VIEW', 'FINANCE_VIEW', 'SALES_VIEW', 'CUSTOMER_VIEW', 'CONTRACT_VIEW', 'DISPUTE_VIEW'],
  ROLE_AUDITOR: ['AUDIT_VIEW', 'AUDIT_EXECUTE', 'AUDIT_REPORT', 'SYSTEM_LOGS_VIEW', 'FINANCE_VIEW', 'SALES_VIEW', 'CUSTOMER_VIEW', 'CONTRACT_VIEW', 'DISPUTE_VIEW'],
  // FINANCE
  ROLE_DIRETOR_FINANCEIRO: ['FINANCE_VIEW', 'FINANCE_CREATE', 'FINANCE_EDIT', 'FINANCE_DELETE', 'FINANCE_APPROVE', 'FINANCE_EXPORT', 'REPORT_VIEW', 'DASHBOARD_VIEW'],
  ROLE_GERENTE_FINANCEIRO: ['FINANCE_VIEW', 'FINANCE_CREATE', 'FINANCE_EDIT', 'FINANCE_APPROVE', 'FINANCE_EXPORT', 'REPORT_VIEW'],
  ROLE_ANALISTA_FINANCEIRO: ['FINANCE_VIEW', 'FINANCE_CREATE', 'FINANCE_EDIT'],
  ROLE_ASSISTENTE_FINANCEIRO: ['FINANCE_VIEW', 'FINANCE_CREATE'],
  // CONTESTACAO
  ROLE_GERENTE_CONTESTACAO: ['DISPUTE_VIEW', 'DISPUTE_CREATE', 'DISPUTE_EDIT', 'DISPUTE_APPROVE', 'DISPUTE_RESOLVE', 'FINANCE_VIEW'],
  ROLE_ANALISTA_CONTESTACAO: ['DISPUTE_VIEW', 'DISPUTE_CREATE', 'DISPUTE_EDIT', 'DISPUTE_RESOLVE'],
  ROLE_ASSISTENTE_CONTESTACAO: ['DISPUTE_VIEW', 'DISPUTE_CREATE'],
  // SUPERINTENDENTE
  ROLE_SUPERINTENDENTE: ['DASHBOARD_VIEW', 'REPORT_VIEW', 'FINANCE_VIEW', 'SALES_VIEW', 'CUSTOMER_VIEW', 'CONTRACT_VIEW', 'BACKOFFICE_VIEW', 'BACKOFFICE_EDIT'],
  // B2B
  ROLE_DIRETOR_COMERCIAL_B2B: ['SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'DASHBOARD_VIEW', 'REPORT_VIEW'],
  ROLE_GERENTE_COMERCIAL_B2B: ['SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE'],
  ROLE_CONSULTOR_COMERCIAL_B2B: ['SALES_VIEW', 'SALES_CREATE', 'SDR_IA_USE'],
  // B2C
  ROLE_DIRETOR_COMERCIAL_B2C: ['SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'DASHBOARD_VIEW', 'REPORT_VIEW'],
  ROLE_GERENTE_COMERCIAL_B2C: ['SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'SDR_IA_USE'],
  ROLE_CONSULTOR_COMERCIAL_B2C: ['SALES_VIEW', 'SALES_CREATE', 'SDR_IA_USE'],
  // REGIONAL
  ROLE_GERENTE_REGIONAL_B2B: ['REGIONAL_VIEW', 'REGIONAL_MANAGE_SCOPE', 'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE'],
  ROLE_GERENTE_REGIONAL_B2C: ['REGIONAL_VIEW', 'REGIONAL_MANAGE_SCOPE', 'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE'],
  // BACKOFFICE
  ROLE_SUPERVISOR_BACKOFFICE: ['BACKOFFICE_VIEW', 'BACKOFFICE_EDIT', 'CUSTOMER_VIEW'],
  ROLE_ASSISTENTE_BACKOFFICE: ['BACKOFFICE_VIEW'],
};

// ========================================
// ROLE → SCOPE MAPPING
// ========================================

export const ROLE_SCOPES: Record<Role, Scope> = {
  ROLE_ADMIN_SISTEMA: 'GLOBAL',
  ROLE_CEO: 'COMPANY',
  ROLE_DIRETOR_AUDITORIA: 'COMPANY',
  ROLE_GERENTE_AUDITORIA: 'COMPANY',
  ROLE_AUDITOR: 'GLOBAL',
  ROLE_DIRETOR_FINANCEIRO: 'COMPANY',
  ROLE_GERENTE_FINANCEIRO: 'COMPANY',
  ROLE_ANALISTA_FINANCEIRO: 'FRANQUIA',
  ROLE_ASSISTENTE_FINANCEIRO: 'FRANQUEADO',
  ROLE_GERENTE_CONTESTACAO: 'COMPANY',
  ROLE_ANALISTA_CONTESTACAO: 'FRANQUIA',
  ROLE_ASSISTENTE_CONTESTACAO: 'FRANQUEADO',
  ROLE_SUPERINTENDENTE: 'COMPANY',
  ROLE_DIRETOR_COMERCIAL_B2B: 'COMPANY',
  ROLE_GERENTE_COMERCIAL_B2B: 'FRANQUIA',
  ROLE_CONSULTOR_COMERCIAL_B2B: 'FRANQUEADO',
  ROLE_DIRETOR_COMERCIAL_B2C: 'COMPANY',
  ROLE_GERENTE_COMERCIAL_B2C: 'FRANQUIA',
  ROLE_CONSULTOR_COMERCIAL_B2C: 'FRANQUEADO',
  ROLE_GERENTE_REGIONAL_B2B: 'FRANQUIA',
  ROLE_GERENTE_REGIONAL_B2C: 'FRANQUIA',
  ROLE_SUPERVISOR_BACKOFFICE: 'COMPANY',
  ROLE_ASSISTENTE_BACKOFFICE: 'FRANQUEADO',
};

// ========================================
// ROLE LABELS
// ========================================

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_ADMIN_SISTEMA: 'Admin Sistema',
  ROLE_CEO: 'CEO',
  ROLE_DIRETOR_AUDITORIA: 'Diretor de Auditoria',
  ROLE_GERENTE_AUDITORIA: 'Gerente de Auditoria',
  ROLE_AUDITOR: 'Auditor',
  ROLE_DIRETOR_FINANCEIRO: 'Diretor Financeiro',
  ROLE_GERENTE_FINANCEIRO: 'Gerente Financeiro',
  ROLE_ANALISTA_FINANCEIRO: 'Analista Financeiro',
  ROLE_ASSISTENTE_FINANCEIRO: 'Assistente Financeiro',
  ROLE_GERENTE_CONTESTACAO: 'Gerente de Contestação',
  ROLE_ANALISTA_CONTESTACAO: 'Analista de Contestação',
  ROLE_ASSISTENTE_CONTESTACAO: 'Assistente de Contestação',
  ROLE_SUPERINTENDENTE: 'Superintendente',
  ROLE_DIRETOR_COMERCIAL_B2B: 'Diretor Comercial B2B',
  ROLE_GERENTE_COMERCIAL_B2B: 'Gerente Comercial B2B',
  ROLE_CONSULTOR_COMERCIAL_B2B: 'Consultor Comercial B2B',
  ROLE_DIRETOR_COMERCIAL_B2C: 'Diretor Comercial B2C',
  ROLE_GERENTE_COMERCIAL_B2C: 'Gerente Comercial B2C',
  ROLE_CONSULTOR_COMERCIAL_B2C: 'Consultor Comercial B2C',
  ROLE_GERENTE_REGIONAL_B2B: 'Gerente Regional B2B',
  ROLE_GERENTE_REGIONAL_B2C: 'Gerente Regional B2C',
  ROLE_SUPERVISOR_BACKOFFICE: 'Supervisor Backoffice',
  ROLE_ASSISTENTE_BACKOFFICE: 'Assistente Backoffice',
};

// ========================================
// PERMISSION LABELS
// ========================================

export const PERMISSION_LABELS: Record<Permission, string> = {
  SYSTEM_VIEW: 'Visualizar Sistema',
  SYSTEM_CONFIG: 'Configurar Sistema',
  SYSTEM_USERS_MANAGE: 'Gerenciar Usuários',
  SYSTEM_ROLES_MANAGE: 'Gerenciar Papéis',
  SYSTEM_LOGS_VIEW: 'Visualizar Logs',
  FINANCE_VIEW: 'Visualizar Financeiro',
  FINANCE_CREATE: 'Criar Financeiro',
  FINANCE_EDIT: 'Editar Financeiro',
  FINANCE_DELETE: 'Excluir Financeiro',
  FINANCE_APPROVE: 'Aprovar Financeiro',
  FINANCE_EXPORT: 'Exportar Financeiro',
  SALES_VIEW: 'Visualizar Vendas',
  SALES_CREATE: 'Criar Vendas',
  SALES_EDIT: 'Editar Vendas',
  SALES_DELETE: 'Excluir Vendas',
  SALES_EXPORT: 'Exportar Vendas',
  CUSTOMER_VIEW: 'Visualizar Clientes',
  CUSTOMER_CREATE: 'Criar Clientes',
  CUSTOMER_EDIT: 'Editar Clientes',
  CUSTOMER_DELETE: 'Excluir Clientes',
  CONTRACT_VIEW: 'Visualizar Contratos',
  CONTRACT_CREATE: 'Criar Contratos',
  CONTRACT_EDIT: 'Editar Contratos',
  CONTRACT_DELETE: 'Excluir Contratos',
  CONTRACT_APPROVE: 'Aprovar Contratos',
  DISPUTE_VIEW: 'Visualizar Contestações',
  DISPUTE_CREATE: 'Criar Contestações',
  DISPUTE_EDIT: 'Editar Contestações',
  DISPUTE_APPROVE: 'Aprovar Contestações',
  DISPUTE_RESOLVE: 'Resolver Contestações',
  AUDIT_VIEW: 'Visualizar Auditoria',
  AUDIT_EXECUTE: 'Executar Auditoria',
  AUDIT_REPORT: 'Relatório de Auditoria',
  BACKOFFICE_VIEW: 'Visualizar Backoffice',
  BACKOFFICE_EDIT: 'Editar Backoffice',
  REPORT_VIEW: 'Visualizar Relatórios',
  REPORT_EXPORT: 'Exportar Relatórios',
  REGIONAL_VIEW: 'Visualizar Regional',
  REGIONAL_MANAGE_SCOPE: 'Gerenciar Escopo Regional',
  DASHBOARD_VIEW: 'Visualizar Dashboard',
};

// ========================================
// SCOPE LABELS
// ========================================

export const SCOPE_LABELS: Record<Scope, string> = {
  OWN: 'Próprio',
  FRANQUEADO: 'Franqueado',
  FRANQUIA: 'Franquia',
  COMPANY: 'Empresa',
  GLOBAL: 'Global',
};

// Mapeamento de permissões por perfil (padrão)
export const PROFILE_PERMISSIONS: Record<string, Record<string, PermissionKey[]>> = {
  admin: {}, // Admin tem acesso total (todas as permissões)
  master: {
    dashboard: ['view'],
    clientes: ['view', 'create', 'edit', 'delete'],
    oportunidades: ['view', 'create', 'edit', 'delete', 'move_card', 'edit_pipeline'],
    parceiros: ['view', 'create', 'edit', 'delete'],
    produtos: ['view', 'create', 'edit', 'delete'],
    relatorios: ['view', 'export'],
    usuarios: ['view', 'create', 'edit', 'delete', 'manage_permissions'],
    configuracoes: ['access', 'edit'],
    automacoes: ['view', 'create', 'edit', 'delete'],
  },
  financeiro: {
    dashboard: ['view'],
    clientes: ['view'],
    oportunidades: ['view', 'edit'],
    parceiros: ['view'],
    produtos: ['view'],
    relatorios: ['view', 'export'],
    usuarios: [],
    configuracoes: [],
    automacoes: [],
  },
  comercial_diretoria: {
    dashboard: ['view'],
    clientes: ['view', 'create', 'edit'],
    oportunidades: ['view', 'create', 'edit', 'move_card', 'edit_pipeline'],
    parceiros: ['view', 'create', 'edit'],
    produtos: ['view'],
    relatorios: ['view', 'export'],
    usuarios: ['view'],
    configuracoes: ['access'],
    automacoes: ['view'],
  },
  regional: {
    dashboard: ['view'],
    clientes: ['view', 'create', 'edit'],
    oportunidades: ['view', 'create', 'edit', 'move_card'],
    parceiros: ['view', 'create', 'edit'],
    produtos: ['view'],
    relatorios: ['view'],
    usuarios: ['view'],
    configuracoes: [],
    automacoes: [],
  },
  gerente: {
    dashboard: ['view'],
    clientes: ['view', 'create', 'edit'],
    oportunidades: ['view', 'create', 'edit', 'move_card', 'edit_pipeline'],
    parceiros: ['view', 'create'],
    produtos: ['view'],
    relatorios: ['view'],
    usuarios: ['view'],
    configuracoes: [],
    automacoes: ['view', 'create', 'edit'],
  },
  vendedor: {
    dashboard: ['view'],
    clientes: ['view', 'create'],
    oportunidades: ['view', 'create', 'edit', 'move_card'],
    parceiros: ['view'],
    produtos: ['view'],
    relatorios: [],
    usuarios: [],
    configuracoes: [],
    automacoes: [],
  },
  bko: {
    dashboard: ['view'],
    clientes: ['view', 'create'],
    oportunidades: ['view', 'create', 'edit'],
    parceiros: [],
    produtos: ['view'],
    relatorios: [],
    usuarios: [],
    configuracoes: [],
    automacoes: [],
  },
  // Roles solicitadas pelo usuário
  ADMIN_SISTEMA: {
    dashboard: ['view'],
    clientes: ['read', 'create', 'edit', 'delete', 'export'],
    oportunidades: ['read', 'create', 'edit', 'delete', 'move', 'export'],
    parceiros: ['read', 'create', 'edit', 'delete'],
    financeiro: ['read', 'export'],
    usuarios: ['read', 'create', 'edit', 'delete'],
    produtos: ['read', 'create', 'edit', 'delete', 'export'],
    automacoes: ['read', 'create', 'edit', 'delete'],
    configuracoes: ['access', 'edit'],
    auditoria: ['view'],
  },
  ADMIN_FRANQUIA: {
    dashboard: ['view'],
    clientes: ['read', 'create', 'edit', 'delete', 'export'],
    oportunidades: ['read', 'create', 'edit', 'delete', 'move', 'export'],
    parceiros: ['read', 'create', 'edit', 'delete'],
    financeiro: ['read', 'export'],
    usuarios: ['read', 'create', 'edit'],
    produtos: ['read', 'create', 'edit'],
    automacoes: ['read', 'create', 'edit'],
    configuracoes: ['access'],
    auditoria: ['view'],
  },
  FRANQUEADO: {
    dashboard: ['view'],
    clientes: ['read', 'create', 'edit'],
    oportunidades: ['read', 'create', 'edit', 'move'],
    parceiros: ['read'],
    financeiro: ['read'],
    usuarios: [],
    produtos: ['read'],
    automacoes: [],
    configuracoes: [],
  },
  SDR: {
    dashboard: ['view'],
    clientes: ['read', 'create'],
    oportunidades: ['read', 'create', 'edit', 'move'],
    parceiros: ['read'],
    financeiro: [],
    usuarios: [],
    produtos: ['read'],
    automacoes: [],
    configuracoes: [],
  },
  FINANCEIRO: {
    dashboard: ['view'],
    clientes: ['read'],
    oportunidades: ['read'],
    parceiros: ['read'],
    financeiro: ['read', 'export'],
    usuarios: [],
    produtos: ['read'],
    automacoes: [],
    configuracoes: [],
  },
  OPERACIONAL: {
    dashboard: ['view'],
    clientes: ['read'],
    oportunidades: ['read', 'edit'],
    parceiros: ['read'],
    financeiro: [],
    usuarios: [],
    produtos: ['read'],
    automacoes: [],
    configuracoes: [],
  },
};

// Tipos de Estrutura Comercial
export type EstruturaComercialNivel = 
  | 'vertical'
  | 'produto'
  | 'subproduto'
  | 'fornecedor_originador'
  | 'tabela_plano_campanha'
  | 'condicao_comercial';

export type FornecedorTipo = 
  | 'banco'
  | 'promotora'
  | 'comercializadora'
  | 'seguradora'
  | 'administradora_consorcio'
  | 'fintech'
  | 'correspondente'
  | 'parceiro_operacional'
  | 'outro';

export interface HistoricoItem {
  data: number;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
}

export interface EstruturaComercial {
  id: number;
  nome: string;
  codigo?: string;
  nivel: EstruturaComercialNivel;
  ativo: boolean;
  
  // Hierarquia
  parent_id?: number;
  children?: EstruturaComercial[];
  
  // Campos específicos por nível
  descricao?: string;
  
  // Para fornecedor_originador
  fornecedor_tipo?: FornecedorTipo;
  cnpj?: string;
  contato?: string;
  telefone?: string;
  email?: string;
  site?: string;
  
  // Para tabela_plano_campanha
  tabela_codigo_externo?: string;
  
  // Para condicao_comercial
  taxa_juros_anual?: number;
  coeficiente?: number;
  parcela_minima?: number;
  parcela_maxima?: number;
  comissao_banco?: number;
  comissao_promotora?: number;
  comissao_total?: number;
  comissao_fixa?: number;
  
  // Validade
  validade_inicio?: string;
  validade_fim?: string;
  
  // Integração
  external_id?: string;
  api_source?: string;
  integration_id?: string;
  sync_status?: 'pending' | 'synced' | 'error' | 'never';
  last_sync_at?: string;
  
  // Automação
  automation_enabled?: boolean;
  automation_rules?: string;
  automation_triggers?: string;
  
  // Status
  status_integracao?: 'ativo' | 'inativo' | 'pendente' | 'erro';
  origem_integracao?: string;
  
  // Observações
  observacao?: string;
  
  // Timestamps
  created_at: number;
  updated_at: number;
}
