import React, { useState, useMemo } from "react";
import useAppStore from "../store";
import api from "../api/client";
import { useTenantFilter } from "../hooks/useTenantFilter";
import { Plus, X, Edit2, Trash2, MoreVertical, MoreHorizontal, Search, RefreshCw, Calendar, Filter, LayoutGrid, List, ChevronDown, MessageCircle, Phone, Mail, Clock, User, Timer, ArrowUpDown, ArrowUp, ArrowDown, ArrowUpDown as SortIcon, FileText, Package, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, XCircle, Tag, Paperclip, History, File, Upload, Send, Check, Circle, FileCheck, FileX, FilePlus, GripVertical, Calculator, DollarSign, Percent, CalendarDays, Wallet, Save, TrendingUp, MapPin, Target, FileSignature, Shield } from "lucide-react";
import { Button, Card as DSCard, Input, Select, PageActions, FilterButton, ExportButtons, PrimaryButton, RefreshButton, StatusBadge, EntityAvatar, EmptyState, LoadingState, KpiCard } from "../components/ui";
import { generateId } from "../utils/idGenerator";
import { PageHeader } from "../components/layout/PageHeader";
import { pipelines, podeAvancar, getPipelineById, PIPELINES, getPipelinesOrdenados, getPipelineConfigById, mapearProdutoLegadoParaPipeline, pipelineRequerAssinaturaDigital, getDocumentosObrigatorios, isPipelineOnboarding, isPipelineParceiro, isPipelineColaborador, getPipelineTipoLabel } from "../config/pipelines";
import { getTagsByIds, listarTags } from "../config/tags";
import { criarEnvelopeAssinatura, verificarStatusAssinatura, configurarProvedor, PROVEDORES_DISPONIVEIS, getStatusLabel, getStatusColor, StatusAssinatura, RequisicaoAssinatura, RespostaAssinatura, ProvedorAssinatura } from "../config/assinaturaDigital";
import { executarAutomacoes, getAutomacoesPendentes, getTipoAutomacaoLabel, getStatusAutomacaoColor, TipoAutomacao, ResultadoAutomacao, OportunidadeAssinada } from "../config/automacaoPosAssinatura";
import { KanbanColumn, PipelineSelect, getStageColor, formatCurrency, filterOportunitiesByPipeline, groupOportunitiesByStage, calculateTotalsByStage } from "../components/pipeline";
import { getPipelineOptions, getProductOptions, getSubproductsByProductId, getModalitiesByProductAndSubproduct, getModalityLabel, getPipelineByProductId, emitOpportunityEvent, createOpportunityEventPayload, getPipelineStages } from "../data/catalogRepository";

// 🔧 UTILITÁRIA: Normalizar chave de etapa para comparação resiliente
const normalizeKey = (value: any): string => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

// 🔧 UTILITÁRIA: Converter etapa para chave normalizada
const toStageKey = (stage: any): string => {
  if (typeof stage === "string") return normalizeKey(stage);
  return normalizeKey(stage?.id || stage?.key || stage?.nome || stage?.label);
};

// 🔧 UTILITÁRIA: Converter etapa para label legível
const toStageLabel = (stage: any): string => {
  if (typeof stage === "string") return stage;
  return String(stage?.nome || stage?.label || stage?.id || stage?.key || "Etapa");
};

// 🎯 LISTA ÚNICA OFICIAL DE ETAPAS DO PIPELINE (inclui etapas de onboarding)
export const OFICIAL_ETAPAS = [
  // Etapas básicas
  { key: "novo_lead", label: "Novo Lead" },
  { key: "negociacao", label: "Negociação" },
  // Etapas de documentação
  { key: "documentacao", label: "Documentação" },
  // Etapas de aceite/contrato
  { key: "aceite", label: "Aceite" },
  { key: "contrato_enviado", label: "Contrato Enviado" },
  { key: "aguardando_assinatura", label: "Aguardando Assinatura" },
  { key: "contrato_assinado", label: "Contrato Assinado" },
  // Etapas de ativação
  { key: "ativo", label: "Ativo" },
  // Etapas de fechamento
  { key: "formalizacao", label: "Formalização" },
  { key: "integrado", label: "Integrado" },
  { key: "pendencia", label: "Pendência" },
  { key: "perdido", label: "Perdido" }
] as const;

export type EtapaKey = typeof OFICIAL_ETAPAS[number]['key'];


// 📋 MOTIVOS DE PENDÊNCIA
export const MOTIVOS_PENDENCIA = [
  { key: "documentacao_pendente", label: "Documentação pendente" },
  { key: "dados_bancarios_pendentes", label: "Dados bancários pendentes" },
  { key: "assinatura_pendente", label: "Assinatura pendente" },
  { key: "divergencia_cadastral", label: "Divergência cadastral" },
  { key: "aguardando_retorno", label: "Aguardando retorno do cliente" },
  { key: "outro", label: "Outro" }
] as const;

// 📋 VALIDAÇÕES DE CAMPOS POR ETAPA
export const VALIDACOES_ETAPA: Partial<Record<EtapaKey, { obrigatorios: string[]; mensagem: string }>> = {
  novo_lead: {
    obrigatorios: ['nome', 'telefone'],
    mensagem: 'Nome e telefone são obrigatórios para criar um lead'
  },
  negociacao: {
    obrigatorios: ['produto', 'valor'],
    mensagem: 'Produto e valor são obrigatórios para avançar para Negociação'
  },
  aguardando_assinatura: {
    obrigatorios: ['produto', 'valor'],
    mensagem: 'Produto e valor são obrigatórios para Aguardar Assinatura'
  },
  pendencia: {
    obrigatorios: ['observacoes'],
    mensagem: 'Observações são obrigatórias para mover para Pendência'
  },
  formalizacao: {
    obrigatorios: ['produto', 'valor'],
    mensagem: 'Produto e valor são obrigatórios para Formalização'
  },
  integrado: {
    obrigatorios: ['produto', 'valor'],
    mensagem: 'Produto e valor são obrigatórios para marcar como Integrado'
  },
  documentacao: {
    obrigatorios: [],
    mensagem: ''
  },
  aceite: {
    obrigatorios: [],
    mensagem: ''
  },
  contrato_enviado: {
    obrigatorios: [],
    mensagem: ''
  },
  contrato_assinado: {
    obrigatorios: [],
    mensagem: ''
  },
  ativo: {
    obrigatorios: [],
    mensagem: ''
  },
  perdido: {
    obrigatorios: [],
    mensagem: ''
  }
};

// Função para validar se a oportunidade pode avançar para uma etapa
export const validarEtapa = (oportunidade: any, etapaDestino: EtapaKey): { valido: boolean; mensagem: string; camposFaltantes: string[] } => {
  // ✅ PROTEÇÃO DE VALIDACOES_ETAPA
  const validacao = VALIDACOES_ETAPA?.[etapaDestino];
  if (!validacao || !Array.isArray(validacao.obrigatorios)) return { valido: true, mensagem: '', camposFaltantes: [] };
  
  const camposFaltantes: string[] = [];
  
  for (const campo of validacao.obrigatorios) {
    const valor = oportunidade[campo];
    if (valor === undefined || valor === null || valor === '' || valor === 0) {
      camposFaltantes.push(campo);
    }
  }
  
  if (camposFaltantes.length > 0) {
    const camposFormatados = camposFaltantes.map(c => {
      const nomes: Record<string, string> = {
        nome: 'Nome',
        telefone: 'Telefone',
        produto: 'Produto',
        valor: 'Valor',
        email: 'E-mail',
        observacoes: 'Observações'
      };
      return nomes[c] || c;
    });
    return {
      valido: false,
      mensagem: `${validacao.mensagem}. Campos faltando: ${camposFormatados.join(', ')}`,
      camposFaltantes
    };
  }
  
  return { valido: true, mensagem: '', camposFaltantes: [] };
};

// 🔵 ETAPAS DINÂMICAS DO PIPELINE - USA CONFIGURAÇÃO OU PADRÃO
const getEtapasAtivas = (pipelineId: string) => {
  // Tenta carregar etapas configuradas em Administração > Pipelines
  const stages = getPipelineStages(pipelineId);
  
  // Mapeia as etapas para o formato esperado pelo Kanban
  return stages.map((nome, index) => ({
    id: normalizeKey(nome),
    nome: nome,
    cor: getCorEtapa(normalizeKey(nome), index)
  }));
};

// Cores para cada etapa
const getCorEtapa = (key: string, index: number): string => {
  const cores: Record<string, string> = {
    // Etapas básicas
    novo_lead: "#3b82f6",      // Blue
    negociacao: "#8b5cf6",     // Purple
    // Etapas de documentação
    documentacao: "#f97316",   // Orange
    // Etapas de aceite/contrato
    aceite: "#eab308",          // Yellow
    contrato_enviado: "#0ea5e9",  // Sky blue
    aguardando_assinatura: "#f59e0b", // Amber
    contrato_assinado: "#14b8a6", // Teal
    // Etapas de ativação
    ativo: "#22c55e",           // Green
    // Etapas de fechamento
    formalizacao: "#06b6d4",    // Cyan
    integrado: "#10b981",        // Emerald
    pendencia: "#ef4444",        // Red
    perdido: "#6b7280"          // Gray
  };
  return cores[key] || "#6b7280";
};

// Fallback para compatibilidade - USA LISTA OFICIAL
const ETAPAS_PIPELINE = OFICIAL_ETAPAS.map((e, index) => ({
  id: e.key,
  nome: e.label,
  cor: getCorEtapa(e.key, index)
}));

const OportunidadesPageInner = () => {
  const { 
    pipelines, 
    oportunidadesKanban, 
    currentPipelineId, 
    setCurrentPipelineId,
    moveOportunidade,
    addOportunidade,
    updateOportunidade,
    deleteOportunidade,
    addPipeline,
    updatePipeline,
    deletePipeline,
    addColumn,
    updateColumn,
    deleteColumn,
    produtos,
    usuarios,
    user,
    theme,
    hasPermission 
  } = useAppStore();

  // ✅ PROTEÇÃO COMPLETA DO STORE - Safe fallbacks para todos os dados
  const safePipelinesStore = Array.isArray(pipelines) ? pipelines : [];
  const safeOportunidadesKanban = Array.isArray(oportunidadesKanban) ? oportunidadesKanban : [];
  const safeProdutos = Array.isArray(produtos) ? produtos : [];
  const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];

  // ✅ Safe currentPipelineId com fallback padrão
  const safeCurrentPipelineId =
    typeof currentPipelineId === "string" && currentPipelineId
      ? currentPipelineId
      : "consignado";

  // ✅ Safe setters e actions do store
  const safeSetCurrentPipelineId =
    typeof setCurrentPipelineId === "function"
      ? setCurrentPipelineId
      : () => {};

  const safeMoveOportunidade =
    typeof moveOportunidade === "function"
      ? moveOportunidade
      : () => {};

  const safeAddOportunidade =
    typeof addOportunidade === "function"
      ? addOportunidade
      : () => {};

  const safeUpdateOportunidade =
    typeof updateOportunidade === "function"
      ? updateOportunidade
      : () => {};

  const safeDeleteOportunidade =
    typeof deleteOportunidade === "function"
      ? deleteOportunidade
      : () => {};

  // ✅ GARANTIR PIPELINE INICIAL VÁLIDO (apenas pipelines do catálogo PF)
  React.useEffect(() => {
    // Pipeline padrão do catálogo PF
    const defaultPipelineId = "pipeline-consignado";
    
    // Se não há pipeline selecionado ou se é um pipeline antigo (legado), usar o padrão
    const isLegacyPipeline = safePipelinesStore.some(p => 
      p.id === currentPipelineId && 
      ["finqz-auto", "finqz-consignado", "fgts"].includes(p.id.toLowerCase())
    );
    
    if (!currentPipelineId || isLegacyPipeline) {
      setCurrentPipelineId(defaultPipelineId);
    }
  }, [currentPipelineId, safePipelinesStore, setCurrentPipelineId]);

  const isDark = theme === "dark";
  // ✅ Fallback seguro para hasPermission - evita erro se store ainda não carregou
  const can = typeof hasPermission === "function" ? hasPermission : () => false;
  
  // 📋 ETAPAS QUE PERMITEM EDIÇÃO LIVRE (até Negociação)
  const ETAPAS_EDICAO_LIVRE = ['novo_lead', 'negociacao'];
  
  // 📋 Função helper para verificar se pode editar (por permissão OU por etapa)
  const canEditOportunidade = (oportunidade: any): boolean => {
    // Se tem permissão, pode editar
    if (can('oportunidades', 'edit')) return true;
    
    // Se não tem permissão, verifica se a etapa permite edição livre
    const etapa = oportunidade?.etapa_id ?? oportunidade?.etapa ?? 'novo_lead';
    return ETAPAS_EDICAO_LIVRE.includes(etapa);
  };
  
  // Toolbar State (visual only - no pipeline logic)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  
  // 🎯 NOVA TAXONOMIA PF - Estado para subproduto e modalidade
  const [selectedSubproductId, setSelectedSubproductId] = useState<string>("");
  const [selectedModality, setSelectedModality] = useState<string>("");
  
  // Opções do catálogo de crédito PF (memoized para performance)
  const catalogPipelineOptions = useMemo(() => getPipelineOptions(), []);
  const catalogProductOptions = useMemo(() => getProductOptions(), []);
  const catalogSubproducts = useMemo(() => 
    selectedProductId ? getSubproductsByProductId(selectedProductId) : [], 
    [selectedProductId]
  );
  const catalogModalities = useMemo(() => 
    selectedProductId && selectedSubproductId 
      ? getModalitiesByProductAndSubproduct(selectedProductId, selectedSubproductId) 
      : [],
    [selectedProductId, selectedSubproductId]
  );
  
  // Ordenação por coluna: { [etapaId]: 'valor_asc' | 'valor_desc' | 'data_asc' | 'data_desc' }
  const [columnSort, setColumnSort] = useState<Record<string, string>>({});
  
  // Drawer states for lead details
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [openLeadDrawer, setOpenLeadDrawer] = useState(false);

  // Handler to open lead drawer
  function handleOpenLead(lead: any) {
    if (!lead) return;
    setSelectedLead(lead);
    setOpenLeadDrawer(false);
    setShowFullscreenModal(true);
  }
  
  // Filter state
  const [filters, setFilters] = useState({
    etapa_id: "",
    responsavel_id: "",
    racionalCompany_id: "",
    franquia_id: "",
    franqueado_id: "",
    dataCriacaoInicio: "",
    dataCriacaoFim: "",
    dataMovimentacaoInicio: "",
    dataMovimentacaoFim: "",
    dataIntegradoInicio: "",
    dataIntegradoFim: ""
  });
  
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      etapa_id: "",
      responsavel_id: "",
      racionalCompany_id: "",
      franquia_id: "",
      franqueado_id: "",
      dataCriacaoInicio: "",
      dataCriacaoFim: "",
      dataMovimentacaoInicio: "",
      dataMovimentacaoFim: "",
      dataIntegradoInicio: "",
      dataIntegradoFim: ""
    });
  };
  
  // Data helper
  const currentDate = useMemo(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('pt-BR', options);
  }, []);
  
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showEditDrawerModal, setShowEditDrawerModal] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<any>(null);
  const [editingPipeline, setEditingPipeline] = useState<any>(null);
  const [editingOportunidade, setEditingOportunidade] = useState<any>(null);
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  
  // Aba ativa no modal fullscreen
  const [activeTab, setActiveTab] = useState<'tarefas' | 'anotacoes' | 'simulador' | 'tags' | 'anexos' | 'historico'>('tarefas');
  
  // Estado do simulador
  const [tipoSimulacao, setTipoSimulacao] = useState('');
  const [simulacaoCalculada, setSimulacaoCalculada] = useState(false);
  const [simulacaoLoading, setSimulacaoLoading] = useState(false);
  
  // Estado dos anexos
  const [anexos, setAnexos] = useState<any[]>([]);
  
  // Função para upload de anexos
  const handleUploadAnexo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const novosAnexos = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      arquivo: file,
      criadoEm: new Date().toISOString()
    }));

    setAnexos((prev) => [...prev, ...novosAnexos]);
  };
  
  // Subprodutos oficiais de Consignado
  const SUBPRODUTOS_CONSIGNADO = [
    { key: 'emprestimo_inss', label: 'Empréstimo Consignado INSS' },
    { key: 'emprestimo_municipal', label: 'Empréstimo Consignado - Municipal' },
    { key: 'emprestimo_estadual', label: 'Empréstimo Consignado - Estadual' },
    { key: 'emprestimo_federal', label: 'Empréstimo Consignado - Federal' },
    { key: 'cartao_rmc', label: 'Cartão RMC' },
    { key: 'cartao_beneficio', label: 'Cartão Benefício' },
  ];
  
  // Estado do subproduto para Consignado
  const [subprodutoConsignado, setSubprodutoConsignado] = useState('');
  const [rendaLiquidaMensal, setRendaLiquidaMensal] = useState(0);
  const [prazoConsignado, setPrazoConsignado] = useState(0);
  const [taxaMensalConsignado, setTaxaMensalConsignado] = useState(0);
  
  // Helper de texto por tipo de simulação
  const getHelperText = (tipo: string) => {
    switch (tipo) {
      case 'emprestimo-garantia': return 'Refinanciamento de auto com veículo quitado ou com saldo devedor.';
      case 'consignado': return 'Use este tipo para funcionários públicos, pensionistas ou inúmerários com margem consignável.';
      case 'fgts': return 'Use este tipo para clientes que desejam antecipar o saque-aniversário do FGTS.';
      case 'clt': return 'Use este tipo para trabalhadores CLT com carteira assinada e margem disponível.';
      case 'emprestimo-pessoal': return 'Empréstimo pessoal sem garantia, com taxa de juros baseada no perfil do cliente.';
      default: return '';
    }
  };
  
  // Estado dos campos do simulador por tipo
  const [simuladorCampos, setSimuladorCampos] = useState({
    // Empréstimo com Garantia (Refinanciamento de Auto)
    valorVeiculo: 0,
    veiculoQuitado: true,
    percentualFinanciavel: 80,
    saldoDevedor: 0,
    taxaMes: 2.5,
    prazo: 24,
    rendaMensal: 0,
    // Consignado (legado - não usado mais)
    margemDisponivel: 35,
    // FGTS
    saldoFGTS: 0,
    parcelasAntecipadas: 2,
    // Empréstimo Pessoal
    valorEmprestimoPessoal: 0,
    taxaJurosPessoal: 4.5,
    prazoPessoal: 24,
    // CLT
    salarioBruto: 0,
    margemPermitida: 35,
  });
  
  // Resultado específico do Consignado
  const [resultadoConsignado, setResultadoConsignado] = useState<{
    subproduto: string;
    margemDisponivelSubproduto: number;
    margemEmprestimo: number;
    margemRMC: number;
    margemCartaoBeneficio: number;
    totalMargemConsignavel: number;
    parcelaEstimada: number;
    valorLiberadoEstimado: number;
    custoTotal: number;
    cetEstimado: number;
    comprometimentoRenda: number;
    status: 'valida' | 'incompleto' | 'inviavel';
    mensagem: string;
  } | null>(null);
  
  // Resultados da simulação
  const [simuladorResultado, setSimuladorResultado] = useState<{
    valorBruto: number;
    parcela: number;
    valorLiberado: number;
    custoTotal: number;
    cetEstimado: number;
    taxaMes: number;
    prazo: number;
    comprometimento: number;
    status: 'valida' | 'atencao' | 'inviavel' | 'incompleto';
    mensagem: string;
  } | null>(null);
  
  // Estado do aceite da simulação
  const [simulationStatus, setSimulationStatus] = useState<'simulada' | 'aceita' | 'recusada' | null>(null);
  const [simulationAcceptedAt, setSimulationAcceptedAt] = useState<number | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [novaFaseAposAceite, setNovaFaseAposAceite] = useState<string>('aguardando_assinatura');
  const [showFaseSelector, setShowFaseSelector] = useState(false);
  
  // Reset simulação quando o tipo muda
  React.useEffect(() => {
    if (tipoSimulacao) {
      setSimulacaoCalculada(false);
      setSimuladorResultado(null);
      setSimulationStatus(null);
      setSimulationAcceptedAt(null);
      setSimulationResult(null);
      setShowFaseSelector(false);
      // Reset campos específicos do Consignado
      if (tipoSimulacao !== 'consignado') {
        setSubprodutoConsignado('');
        setRendaLiquidaMensal(0);
        setPrazoConsignado(0);
        setTaxaMensalConsignado(0);
        setResultadoConsignado(null);
      }
    }
  }, [tipoSimulacao]);
  
  // Reset quando muda subproduto
  React.useEffect(() => {
    if (tipoSimulacao === 'consignado') {
      setSimulacaoCalculada(false);
      setSimuladorResultado(null);
      setSimulationStatus(null);
      setSimulationAcceptedAt(null);
      setSimulationResult(null);
      setShowFaseSelector(false);
    }
  }, [subprodutoConsignado, rendaLiquidaMensal, prazoConsignado, taxaMensalConsignado]);
  
  // Função para calcular simulação
  const calcularSimulacao = () => {
    // Validação inicial
    if (!tipoSimulacao) {
      alert("Selecione um tipo de simulação.");
      return;
    }
    
    const t = tipoSimulacao;
    const c = simuladorCampos;
    
    let resultado = {
      valorBruto: 0,
      parcela: 0,
      valorLiberado: 0,
      custoTotal: 0,
      cetEstimado: 0,
      taxaMes: c.taxaMes || 0,
      prazo: c.prazo || 0,
      comprometimento: 0,
      status: 'incompleto' as const,
      mensagem: '',
    };
    
    if (t === 'emprestimo-garantia') {
      // Validações básicas
      if ((c.valorVeiculo || 0) <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Dados incompletos: informe o valor do veículo';
        setSimuladorResultado(resultado);
        setSimulacaoCalculada(true);
        return;
      }
      if ((c.percentualFinanciavel || 0) <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Dados incompletos: informe o percentual financiável';
        setSimuladorResultado(resultado);
        setSimulacaoCalculada(true);
        return;
      }
      if ((c.prazo || 0) <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Dados incompletos: informe o prazo';
        setSimuladorResultado(resultado);
        setSimulacaoCalculada(true);
        return;
      }
      
      // Se veículo quitado, saldo devedor = 0
      const saldoDevedor = c.veiculoQuitado ? 0 : (c.saldoDevedor || 0);
      
      const valorBruto = (c.valorVeiculo || 0) * ((c.percentualFinanciavel || 0) / 100);
      const valorLiberado = valorBruto - saldoDevedor;
      const taxa = (c.taxaMes || 0) / 100;
      const meses = c.prazo || 1;
      
      resultado.valorBruto = valorBruto;
      
      if (valorLiberado <= 0) {
        resultado.status = 'inviavel';
        resultado.mensagem = 'Simulação inviável: saldo devedor maior que valor financiável';
        resultado.valorLiberado = valorLiberado;
        setSimuladorResultado(resultado);
        setSimulacaoCalculada(true);
        return;
      }
      
      // Cálculo parcela: sistema francês (Tabela Price)
      let parcela = 0;
      if (taxa > 0 && meses > 0) {
        parcela = valorLiberado * (taxa * Math.pow(1 + taxa, meses)) / (Math.pow(1 + taxa, meses) - 1);
      } else if (meses > 0) {
        parcela = valorLiberado / meses;
      }
      
      resultado.parcela = isFinite(parcela) && !isNaN(parcela) ? parcela : 0;
      resultado.valorLiberado = isFinite(valorLiberado) && !isNaN(valorLiberado) ? valorLiberado : 0;
      resultado.custoTotal = isFinite(resultado.parcela * meses) ? resultado.parcela * meses : 0;
      resultado.cetEstimado = (c.taxaMes || 0) + 0.7;
      
      // Comprometimento - com fallbacks para evitar NaN
      if (c.rendaMensal > 0 && resultado.parcela > 0) {
        resultado.comprometimento = isFinite((resultado.parcela / c.rendaMensal) * 100) ? (resultado.parcela / c.rendaMensal) * 100 : 0;
      } else {
        resultado.comprometimento = 0;
      }
      
      // Status
      if (resultado.comprometimento > 50) {
        resultado.status = 'atencao';
        resultado.mensagem = 'Atenção: comprometimento acima de 50%';
      } else {
        resultado.status = 'valida';
        resultado.mensagem = 'Simulação válida';
      }
      
      setSimuladorResultado(resultado);
      setSimulacaoCalculada(true);
      return;
    } else if (t === 'consignado') {
      // Usar os novos campos específicos do Consignado
      const renda = rendaLiquidaMensal || 0;
      const meses = prazoConsignado || 0;
      const taxa = taxaMensalConsignado || 0;
      const subproduto = subprodutoConsignado;
      
      // Cálculo das margens
      const margemEmprestimo = Number.isFinite(renda * 0.35) ? renda * 0.35 : 0;
      const margemRMC = Number.isFinite(renda * 0.05) ? renda * 0.05 : 0;
      const margemCartaoBeneficio = Number.isFinite(renda * 0.05) ? renda * 0.05 : 0;
      const totalMargemConsignavel = Number.isFinite(margemEmprestimo + margemRMC + margemCartaoBeneficio) ? margemEmprestimo + margemRMC + margemCartaoBeneficio : 0;
      
      // Determinar margem disponível e parcela conforme subproduto
      let margemDisponivelSubproduto = 0;
      let parcelaEstimada = 0;
      
      if (subproduto.startsWith('emprestimo')) {
        margemDisponivelSubproduto = Number.isFinite(margemEmprestimo) ? margemEmprestimo : 0;
        parcelaEstimada = Number.isFinite(margemEmprestimo) ? margemEmprestimo : 0;
      } else if (subproduto === 'cartao_rmc') {
        margemDisponivelSubproduto = Number.isFinite(margemRMC) ? margemRMC : 0;
        parcelaEstimada = Number.isFinite(margemRMC) ? margemRMC : 0;
      } else if (subproduto === 'cartao_beneficio') {
        margemDisponivelSubproduto = Number.isFinite(margemCartaoBeneficio) ? margemCartaoBeneficio : 0;
        parcelaEstimada = Number.isFinite(margemCartaoBeneficio) ? margemCartaoBeneficio : 0;
      }
      
      // Validações
      if (renda <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Informe a renda líquida mensal';
      } else if (!subproduto) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Selecione o subproduto';
      } else if (meses <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Informe o prazo';
      } else {
        // Cálculos financeiros
        const valorLiberadoEstimado = Number.isFinite(parcelaEstimada * meses * 0.75) ? parcelaEstimada * meses * 0.75 : 0;
        const custoTotal = Number.isFinite(parcelaEstimada * meses) ? parcelaEstimada * meses : 0;
        const cetEstimado = Number.isFinite(taxa + 0.7) ? taxa + 0.7 : 0;
        const comprometimentoRenda = Number.isFinite(renda > 0 ? (parcelaEstimada / renda) * 100 : 0) ? (parcelaEstimada / renda) * 100 : 0;
        
        // Resultado específico do Consignado
        const resultadoConsignadoObj = {
          subproduto: subproduto,
          margemDisponivelSubproduto: Number.isFinite(margemDisponivelSubproduto) ? margemDisponivelSubproduto : 0,
          margemEmprestimo: Number.isFinite(margemEmprestimo) ? margemEmprestimo : 0,
          margemRMC: Number.isFinite(margemRMC) ? margemRMC : 0,
          margemCartaoBeneficio: Number.isFinite(margemCartaoBeneficio) ? margemCartaoBeneficio : 0,
          totalMargemConsignavel: Number.isFinite(totalMargemConsignavel) ? totalMargemConsignavel : 0,
          parcelaEstimada: Number.isFinite(parcelaEstimada) ? parcelaEstimada : 0,
          valorLiberadoEstimado: Number.isFinite(valorLiberadoEstimado) ? valorLiberadoEstimado : 0,
          custoTotal: Number.isFinite(custoTotal) ? custoTotal : 0,
          cetEstimado: Number.isFinite(cetEstimado) ? cetEstimado : 0,
          comprometimentoRenda: Number.isFinite(comprometimentoRenda) ? comprometimentoRenda : 0,
          status: 'valida' as const,
          mensagem: 'Simulação válida'
        };
        
        setResultadoConsignado(resultadoConsignadoObj);
        
        // Preencher resultado padrão para compatibilidade
        resultado.parcela = Number.isFinite(parcelaEstimada) ? parcelaEstimada : 0;
        resultado.valorLiberado = Number.isFinite(valorLiberadoEstimado) ? valorLiberadoEstimado : 0;
        resultado.custoTotal = Number.isFinite(custoTotal) ? custoTotal : 0;
        resultado.cetEstimado = Number.isFinite(cetEstimado) ? cetEstimado : 0;
        resultado.comprometimento = Number.isFinite(comprometimentoRenda) ? comprometimentoRenda : 0;
        resultado.status = 'valida';
        resultado.mensagem = 'Simulação válida';
      }
    } else if (t === 'fgts') {
      const saldo = c.saldoFGTS || 0;
      const taxa = (c.taxaMes || 0) / 100;
      const parcelas = c.parcelasAntecipadas || 1;
      
      resultado.valorBruto = isFinite(saldo * 0.75) ? saldo * 0.75 : 0;
      resultado.cetEstimado = isFinite(taxa * 100 + 0.7) ? taxa * 100 + 0.7 : 0;
      
      if (saldo <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Informe o saldo do FGTS';
      } else {
        const valorAntecipado = isFinite(saldo * 0.75) ? saldo * 0.75 : 0;
        const custo = isFinite(valorAntecipado * taxa * parcelas) ? valorAntecipado * taxa * parcelas : 0;
        const valorLiquido = valorAntecipado - custo;
        
        if (valorLiquido < 100) {
          resultado.status = 'inviavel';
          resultado.mensagem = 'Valor baixo para operação (mínimo R$ 100)';
          resultado.valorLiberado = isFinite(valorLiquido) ? valorLiquido : 0;
        } else {
          resultado.valorLiberado = isFinite(valorLiquido) ? valorLiquido : 0;
          resultado.custoTotal = isFinite(custo) ? custo : 0;
          resultado.taxaMes = isFinite(taxa * 100) ? taxa * 100 : 0;
          resultado.prazo = parcelas;
          resultado.status = 'valida';
          resultado.mensagem = 'Simulação válida';
        }
      }
    } else if (t === 'clt') {
      const salario = c.salarioBruto || 0;
      const margem = (c.margemPermitida || 0) / 100;
      const taxa = (c.taxaMes || 0) / 100;
      const meses = c.prazo || 1;
      
      resultado.valorBruto = isFinite(salario * margem * meses) ? salario * margem * meses : 0;
      resultado.cetEstimado = isFinite(taxa * 100 + 0.7) ? taxa * 100 + 0.7 : 0;
      resultado.prazo = meses;
      
      if (salario <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Informe o salário bruto';
      } else {
        resultado.parcela = isFinite(salario * margem) ? salario * margem : 0;
        resultado.valorLiberado = isFinite((salario * margem * meses) / 12) ? (salario * margem * meses) / 12 : 0;
        resultado.custoTotal = isFinite(resultado.parcela * meses) ? resultado.parcela * meses : 0;
        resultado.comprometimento = (salario > 0 && resultado.parcela > 0) ? isFinite((resultado.parcela / salario) * 100) ? (resultado.parcela / salario) * 100 : 0 : 0;
        
        if (resultado.comprometimento > 35) {
          resultado.status = 'atencao';
          resultado.mensagem = 'Alerta: comprometimento acima de 35%';
        } else {
          resultado.status = 'valida';
          resultado.mensagem = 'Simulação válida';
        }
      }
    } else if (t === 'emprestimo-pessoal') {
      const valorEmprestimo = c.valorEmprestimoPessoal || 0;
      const taxa = (c.taxaJurosPessoal || 0) / 100;
      const meses = c.prazoPessoal || 1;
      
      resultado.taxaMes = c.taxaJurosPessoal || 0;
      resultado.prazo = meses;
      
      if (valorEmprestimo <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Informe o valor do empréstimo';
      } else if (meses <= 0) {
        resultado.status = 'incompleto';
        resultado.mensagem = 'Informe o prazo';
      } else {
        // Cálculo usando Tabela Price (sistema francês)
        let parcela = 0;
        if (taxa > 0 && meses > 0) {
          parcela = valorEmprestimo * (taxa * Math.pow(1 + taxa, meses)) / (Math.pow(1 + taxa, meses) - 1);
        } else if (meses > 0) {
          parcela = valorEmprestimo / meses;
        }
        
        resultado.valorLiberado = isFinite(valorEmprestimo) ? valorEmprestimo : 0;
        resultado.parcela = isFinite(parcela) && !isNaN(parcela) ? parcela : 0;
        resultado.custoTotal = isFinite(parcela * meses) ? parcela * meses : 0;
        resultado.cetEstimado = (c.taxaJurosPessoal || 0) + 1.2;
        
        // Sem garantia, comprometimento calculado sobre renda informada
        if (c.rendaMensal > 0 && resultado.parcela > 0) {
          resultado.comprometimento = isFinite((resultado.parcela / c.rendaMensal) * 100) ? (resultado.parcela / c.rendaMensal) * 100 : 0;
        }
        
        if (resultado.comprometimento > 50) {
          resultado.status = 'atencao';
          resultado.mensagem = 'Atenção: comprometimento acima de 50%';
        } else {
          resultado.status = 'valida';
          resultado.mensagem = 'Simulação válida';
        }
      }
    }
    
    setSimuladorResultado(resultado);
    // Marcar que a simulação foi calculada
    setSimulacaoCalculada(true);
    // Reset status when recalculating
    setSimulationStatus('simulada');
    setSimulationAcceptedAt(null);
    setSimulationResult(null);
    setShowFaseSelector(false);
  };
  
  // Função para aceitar a simulação
  const aceitarSimulacao = async () => {
    if (!selectedLead || !simuladorResultado) return;
    
    const now = Date.now();
    const novoValor = Number(simuladorResultado.valorLiberado || 0);
    
    // Atualizar estados de simulação
    setSimulationStatus('aceita');
    setSimulationAcceptedAt(now);
    setSimulationResult({ ...simuladorResultado });
    setShowFaseSelector(true);
    
    // Atualizar localmente no store
    updateOportunidade(String(selectedLead.id), { 
      valor: novoValor, 
      simulationStatus: 'aceita',
      simulationAcceptedAt: now,
      simulationResult: simuladorResultado
    });
    
    // Atualizar selectedLead para refletir na UI
    setSelectedLead((prev: any) => prev ? ({ 
      ...prev, 
      valor: novoValor, 
      simulationStatus: 'aceita',
      simulationAcceptedAt: now,
      simulationResult: simuladorResultado
    }) : null);
    
    // Persistir no backend
    try {
      await api.updateOportunidade(Number(selectedLead.id), { 
        valor: novoValor, 
        simulationStatus: 'aceita',
        simulationAcceptedAt: now,
        simulationResult: simuladorResultado
      });
    } catch (error) {
      console.error('Erro ao atualizar valor da oportunidade:', error);
    }
  };
  
  // Função para recusar a simulação
  const recusarSimulacao = () => {
    setSimulationStatus('recusada');
    setSimulationAcceptedAt(null);
    setSimulationResult(null);
    setShowFaseSelector(false);
  };
  
  // Função para confirmar a mudança de fase
  const confirmarMudancaFase = () => {
    if (!selectedLead) return;
    
    const novoStatus = novaFaseAposAceite === 'perdido' ? 'perdido' : 'ativo';
    
    // Atualizar localmente no store
    moveOportunidade(selectedLead.id, { 
      etapa_id: novaFaseAposAceite, 
      status: novoStatus 
    });
    
    // Atualizar selectedLead para refletir na UI
    setSelectedLead((prev: any) => prev ? ({ 
      ...prev, 
      etapa_id: novaFaseAposAceite,
      etapa: novaFaseAposAceite,
      status: novoStatus
    }) : null);
    
    // Persistir no backend
    api.updateOportunidade(Number(selectedLead.id), { 
      etapa_id: novaFaseAposAceite, 
      status: novoStatus 
    }).catch(error => {
      console.error('Erro ao mover oportunidade:', error);
    });
    
    setShowFaseSelector(false);
  };
  
  // Dados para edição do drawer
  const [editDrawerData, setEditDrawerData] = useState({
    // Dados Pessoais / Cliente
    nome: "",
    tipoPessoa: "CPF" as "CPF" | "CNPJ",
    cpf_cnpj: "",
    profissao: "",
    estado_civil: "",
    sexo: "" as "" | "masculino" | "feminino" | "outro" | "nao_informar",
    data_nascimento: "",
    data_abertura: "",
    // Contato
    celular: "",
    telefone: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    // Dados da Oportunidade
    produto: "",
    valor: 0,
    etapa_id: "novo_lead" as string,
    responsavel_id: null as string | null,
    responsavel_nome: "",
    observacoes: "",
    tags: [] as string[],
    // Dados Bancários
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "" as "" | "corrente" | "poupanca",
    titular: "",
    documentoTitular: "",
    pixTipo: "" as "" | "cpf" | "cnpj" | "email" | "telefone" | "aleatoria",
    pixChave: "",
    // RD / Consulta Restrição
    rdStatus: "nao_consultado" as "nao_consultado" | "sem_restricao" | "restricao",
    rdConsultedAt: "",
    rdNotes: "",
    // Não Perturbe
    doNotCallStatus: "nao_consultado" as "nao_consultado" | "liberado" | "bloqueado",
    doNotCallConsultedAt: "",
    // Hierarquia Comercial
    racionalCompany_id: null as number | null,
    franquia_id: null as number | null,
    franqueado_id: null as number | null,
    // Motivo de pendência
    pendenciaMotivo: ""
  });
  
  // Form state
  const [formData, setFormData] = useState({
    // Dados Pessoais / Cliente
    nome: "",
    tipoPessoa: "CPF" as "CPF" | "CNPJ",
    cpf_cnpj: "",
    profissao: "",
    estado_civil: "",
    sexo: "" as "" | "masculino" | "feminino" | "outro" | "nao_informar",
    data_nascimento: "",
    data_abertura: "",
    // Contato
    celular: "",
    telefone: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    // Dados da Oportunidade
    produto: "",
    // 🎯 NOVA TAXONOMIA PF - Campos do catálogo
    productId: "",
    productCode: "",
    subproductId: "",
    subproductCode: "",
    modality: "",
    pipelineId: "",
    pipelineCode: "",
    catalogVersion: 1,
    valor: 0,
    etapa_id: "novo_lead" as string,
    tags: [] as string[],
    cliente_id: null as number | null,
    responsavel_id: null as string | null,
    responsavel_nome: "",
    observacoes: "",
    // Dados Bancários
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "" as "" | "corrente" | "poupanca",
    titular: "",
    documentoTitular: "",
    pixTipo: "" as "" | "cpf" | "cnpj" | "email" | "telefone" | "aleatoria",
    pixChave: "",
    // RD / Consulta Restrição
    rdStatus: "nao_consultado" as "nao_consultado" | "sem_restricao" | "restricao",
    rdConsultedAt: "",
    rdNotes: "",
    // Não Perturbe
    doNotCallStatus: "nao_consultado" as "nao_consultado" | "liberado" | "bloqueado",
    doNotCallConsultedAt: "",
    // Hierarquia Comercial
    racionalCompany_id: null as number | null,
    franquia_id: null as number | null,
    franqueado_id: null as number | null,
    // Motivo de pendência
    pendenciaMotivo: "",
    // 🎯 Dados Onboarding Parceiro Comercial
    parceiroTipo: "",
    razaoSocial: "",
    cnpj: "",
    telefoneComercial: "",
    emailCorporativo: "",
    responsavelLegal: "",
    cpfResponsavel: "",
    cargoResponsavel: "",
    documentosEnviados: [] as string[],
    // 🎯 Dados Onboarding Colaborador FINQZ
    vinculoTipo: "",
    cargo: "",
    departamento: "",
    salario: "",
    formacao: "",
    experienciaProfissional: "",
    disponibilidade: [] as string[]
  });
  
  // 🎯 Estado para Assinatura Digital
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProvedorAssinatura>('clicksign');
  const [envelopeStatus, setEnvelopeStatus] = useState<RespostaAssinatura | null>(null);
  
  // Função para iniciar processo de assinatura digital
  const handleIniciarAssinatura = async () => {
    if (!formData.email) {
      alert("É necessário ter um e-mail cadastrado para enviar solicitação de assinatura.");
      return;
    }
    
    setSignatureLoading(true);
    
    try {
      const requisicao: RequisicaoAssinatura = {
        oportunidadeId: editingOportunidade?.id || 'nova-oportunidade',
        documento: {
          id: `doc-${Date.now()}`,
          nome: `Contrato - ${formData.nome || 'Cliente'}`,
          tipo: 'contrato'
        },
        signatarios: [
          {
            email: formData.email,
            nome: formData.nome || 'Cliente',
            cpf: formData.cpf_cnpj || '',
            telefone: formData.celular || formData.telefone || '',
            ordem: 1
          }
        ],
        provider: selectedProvider
      };
      
      const resultado = await criarEnvelopeAssinatura(requisicao);
      setEnvelopeStatus(resultado);
      
      // Atualiza a oportunidade com o ID do envelope
      if (editingOportunidade) {
        updateOportunidade(editingOportunidade.id, {
          envelopeId: resultado.id,
          envelopeStatus: resultado.status,
          envelopeUrl: resultado.urlAssinatura,
          envelopeProvider: selectedProvider
        });
      }
      
      alert(`Assinatura enviada com sucesso! ID: ${resultado.id}`);
    } catch (error) {
      console.error('Erro ao iniciar assinatura:', error);
      alert('Erro ao enviar solicitação de assinatura. Tente novamente.');
    } finally {
      setSignatureLoading(false);
    }
  };
  
  // 🎯 Função para confirmar assinatura e executar automações
  const handleConfirmarAssinatura = async () => {
    if (!editingOportunidade && !selectedLead) {
      alert('Selecione uma oportunidade primeiro');
      return;
    }
    
    const oportunidade = editingOportunidade || selectedLead;
    if (!oportunidade) return;
    
    // Atualizar status para assinado
    const novoStatus: RespostaAssinatura = {
      ...envelopeStatus!,
      status: 'assinado',
      dataAssinatura: new Date().toISOString()
    };
    setEnvelopeStatus(novoStatus);
    
    // Atualizar oportunidade
    updateOportunidade(oportunidade.id, {
      envelopeStatus: 'assinado',
      etapa_id: 'ativo',
      etapa: 'ativo',
      status: 'ganho',
      dataAssinatura: novoStatus.dataAssinatura
    });
    
    // Preparar dados para automação
    const oportunidadeAssinada: OportunidadeAssinada = {
      id: oportunidade.id,
      nome: formData.nome || oportunidade.nome || '',
      email: formData.email || oportunidade.email || '',
      cpf_cnpj: formData.cpf_cnpj || oportunidade.cpf_cnpj || '',
      telefone: formData.telefone || oportunidade.telefone || '',
      celular: formData.celular || oportunidade.celular || '',
      pipeline_id: currentPipelineConfig?.id || oportunidade.pipeline_id || '',
      pipelineNome: currentPipelineConfig?.nome,
      etapa_id: 'ativo',
      // Dados parceiro
      parceiroTipo: formData.parceiroTipo,
      razaoSocial: formData.razaoSocial,
      cnpj: formData.cnpj,
      telefoneComercial: formData.telefoneComercial,
      emailCorporativo: formData.emailCorporativo,
      responsavelLegal: formData.responsavelLegal,
      cpfResponsavel: formData.cpfResponsavel,
      cargoResponsavel: formData.cargoResponsavel,
      // Dados colaborador
      vinculoTipo: formData.vinculoTipo,
      cargo: formData.cargo,
      departamento: formData.departamento,
      formacao: formData.formacao,
      // Dados bancários
      banco: formData.banco,
      agencia: formData.agencia,
      conta: formData.conta,
      pixTipo: formData.pixTipo,
      pixChave: formData.pixChave,
      // Hierarquia
      racionalCompany_id: formData.racionalCompany_id,
      franquia_id: formData.franquia_id,
      franqueado_id: formData.franqueado_id
    };
    
    // Executar automações
    try {
      const resultados = await executarAutomacoes(oportunidadeAssinada);
      
      // Mostrar resumo das automações
      const sucesso = resultados.filter(r => r.status === 'sucesso').length;
      const erro = resultados.filter(r => r.status === 'erro').length;
      
      alert(`🎉 Contrato assinado com sucesso!\n\n📋 Automações executadas:\n✅ ${sucesso} concluídas\n${erro > 0 ? `❌ ${erro} com erro` : ''}`);
      
      // Fechar modal se estiver editando
      if (editingOportunidade) {
        setShowModal(false);
        setEditingOportunidade(null);
      }
    } catch (error) {
      console.error('Erro ao executar automações:', error);
      alert('Contrato assinado, mas houve erro ao executar automações.');
    }
  };
  
  // 🎯 Tipo de pessoa para CPF/CNPJ
  const [tipoPessoa, setTipoPessoa] = useState<"CPF" | "CNPJ">("CPF");
  
  // 🎯 Funções de máscara (igual Clientes)
  const formatCPFInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  };
  
  const formatCNPJInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0,2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8)}`;
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8,12)}-${digits.slice(12)}`;
  };
  
  const formatCell = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 3) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3,7)}-${digits.slice(7)}`;
  };
  
  // 🎯 Dados de Hierarquia Comercial (mock - substituir por API depois)
  const [racionalCompanies, setRacionalCompanies] = useState<any[]>([
    { id: 1, nome: "Racional Company SP" },
    { id: 2, nome: "Racional Company RJ" },
    { id: 3, nome: "Racional Company MG" }
  ]);
  
  const [franquias, setFranquias] = useState<any[]>([
    { id: 1, nome: "Franquia São Paulo", racionalCompany_id: 1 },
    { id: 2, nome: "Franquia Campinas", racionalCompany_id: 1 },
    { id: 3, nome: "Franquia Rio de Janeiro", racionalCompany_id: 2 },
    { id: 4, nome: "Franquia Belo Horizonte", racionalCompany_id: 3 }
  ]);
  
  const [franqueados, setFranqueados] = useState<any[]>([
    { id: 1, nome: "Franqueado João Silva", franquia_id: 1 },
    { id: 2, nome: "Franqueado Maria Santos", franquia_id: 1 },
    { id: 3, nome: "Franqueado Pedro Costa", franquia_id: 2 },
    { id: 4, nome: "Franqueado Ana Oliveira", franquia_id: 3 },
    { id: 5, nome: "Franqueado Carlos Lima", franquia_id: 4 }
  ]);
  
  // 🎯 Estado da Hierarquia selecionada
  const [selectedRacionalCompany, setSelectedRacionalCompany] = useState<number | null>(null);
  const [selectedFranquia, setSelectedFranquia] = useState<number | null>(null);
  const [selectedFranqueado, setSelectedFranqueado] = useState<number | null>(null);
  
  // 🎯 Handlers de Hierarquia
  const handleRacionalCompanyChange = (companyId: number | null) => {
    setSelectedRacionalCompany(companyId);
    setSelectedFranquia(null);
    setSelectedFranqueado(null);
    setFormData({ ...formData, racionalCompany_id: companyId, franquia_id: null, franqueado_id: null });
  };
  
  const handleFranquiaChange = (franquiaId: number | null) => {
    setSelectedFranquia(franquiaId);
    setSelectedFranqueado(null);
    setFormData({ ...formData, franquia_id: franquiaId, franqueado_id: null });
  };
  
  // Função para obter responsáveis disponíveis conforme hierarquia
  const getAvailableResponsibles = () => {
    const currentUser = user;
    const allUsuarios = usuarios || [];
    
    if (!currentUser) {
      return allUsuarios.filter((u: any) => u.status === "ativo");
    }
    
    const userRole = currentUser.role || currentUser.perfil || "";
    const userScope = currentUser.scope || "";
    
    if (userRole.includes("ADMIN_SISTEMA") || userRole.includes("CEO") || userScope === "GLOBAL") {
      return allUsuarios.filter((u: any) => u.status === "ativo");
    }
    
    if (userScope === "FRANQUIA") {
      return allUsuarios.filter((u: any) => 
        u.status === "ativo" && 
        (u.scope === "FRANQUIA" || u.scope === "FRANQUEADO" || u.id === currentUser.id)
      );
    }
    
    if (userScope === "FRANQUEADO") {
      return allUsuarios.filter((u: any) => 
        u.status === "ativo" && 
        (u.scope === "FRANQUEADO" || u.id === currentUser.id)
      );
    }
    
    return allUsuarios.filter((u: any) => 
      u.status === "ativo" && u.id === currentUser.id
    );
  };
  
  const availableResponsibles = getAvailableResponsibles();
  
  const [pipelineFormData, setPipelineFormData] = useState({
    nome: ""
  });
  
  const [columnFormData, setColumnFormData] = useState({
    nome: "",
    cor: "#3b82f6"
  });
  
  // Drag state
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Get pipeline for selected product
  const getPipelineForProduct = (produtoId: string) => {
    if (!produtoId) return null;
    const produto = safeProdutos.find(p => p.id.toString() === produtoId || p.id === parseInt(produtoId));
    if (produto?.pipeline) {
      return pipelines.find(p => p.id === produto.pipeline);
    }
    return null;
  };
  
  // Handle product/pipeline selection - switch pipeline
  const handleProductChange = (produtoId: string) => {
    setSelectedProductId(produtoId);
    // 🎯 Limpar subproduto e modalidade ao mudar de produto
    setSelectedSubproductId("");
    setSelectedModality("");
    
    // Usar novo sistema de PIPELINES do catálogo
    if (produtoId) {
      // Primeiro tenta usar o catálogo novo
      const catalogPipeline = getPipelineByProductId(produtoId);
      if (catalogPipeline) {
        setCurrentPipelineId(catalogPipeline.id);
      } else {
        // Fallback para o sistema antigo de pipelines
        const pipelineConfig = getPipelineConfigById(produtoId);
        if (pipelineConfig) {
          setCurrentPipelineId(pipelineConfig.id);
        }
      }
    }
  };
  
  // Get current pipeline config - considers selected product with fallback
  const productPipeline = selectedProductId ? getPipelineConfigById(selectedProductId) : null;
  // ✅ Fallback seguro para currentPipelineConfig
  // ✅ PROTEÇÃO DE CONFIGURAÇÃO GLOBAL
  const currentPipelineConfig = productPipeline || getPipelineConfigById?.(safeCurrentPipelineId) || PIPELINES?.[0] || null;
  
  // ✅ ETAPAS DINÂMICAS do pipeline atual - usar OFICIAL_ETAPAS como base
  // ✅ HARDENING: Com normalizeKey e fallback seguro
  const etapasAtivasRaw = Array.isArray(currentPipelineConfig?.etapas)
    ? currentPipelineConfig.etapas.map((key: string, index: number) => {
        const etapaOriginal = OFICIAL_ETAPAS.find(e => normalizeKey(e.key) === normalizeKey(key));
        return {
          id: key,
          nome: etapaOriginal?.label ?? String(key),
          ordem: index + 1,
          ativo: true,
          cor: typeof getCorEtapa === "function" ? getCorEtapa(key, index) : "#3B82F6"
        };
      })
    : [];
  const etapasAtivas = Array.isArray(etapasAtivasRaw) ? etapasAtivasRaw : [];
  
  // Protection: Check if pipeline is valid
  const isPipelineValid = currentPipelineConfig && etapasAtivas.length > 0;
  
  // Check if current pipeline requires digital signature
  const requerAssinaturaDigital = currentPipelineConfig ? pipelineRequerAssinaturaDigital(currentPipelineConfig.id) : false;
  
  // Get required documents for current pipeline
  const documentosObrigatorios = currentPipelineConfig ? getDocumentosObrigatorios(currentPipelineConfig.id) : [];
  
  // Check if current pipeline is onboarding type
  const isOnboarding = currentPipelineConfig ? isPipelineOnboarding(currentPipelineConfig.id) : false;
  const isParceiro = currentPipelineConfig ? isPipelineParceiro(currentPipelineConfig.id) : false;
  const isColaborador = currentPipelineConfig ? isPipelineColaborador(currentPipelineConfig.id) : false;
  const pipelineTipoLabel = currentPipelineConfig ? getPipelineTipoLabel(currentPipelineConfig.tipo) : '';
  
  // ✅ BLINDAGEM DE ARRAY - Filter oportunidades - based on current pipeline (novo sistema PIPELINES)
  const oportunidadesBase = Array.isArray(safeOportunidadesKanban) ? safeOportunidadesKanban : [];
  const oportunidades = oportunidadesBase.filter((o: any) => {
    // ✅ Proteção: verificar se o objeto existe
    if (!o) return false;
    
    // ✅ Se currentPipelineConfig não existe, não filtrar (mostrar tudo)
    if (!currentPipelineConfig?.id) return true;

    // Se a oportunidade tem o novo campo pipeline_id, usar ele
    if (o?.pipeline_id) {
      return o.pipeline_id === currentPipelineConfig.id;
    }
    // Se não, verificar se o produto antigo mapeia para o pipeline atual
    if (o?.produto && typeof mapearProdutoLegadoParaPipeline === "function") {
      return mapearProdutoLegadoParaPipeline(o.produto) === currentPipelineConfig.id;
    }
    // ✅ Se não tem pipeline_id nem produto, mostrar (dados legados sem categorização)
    return true;
  });
  
  // APLICAR FILTRAGEM DE TENANT PRIMEIRO (segurança multi-tenant)
  // ✅ Fallback seguro para useTenantFilter
  const tenantFilteredResult = useTenantFilter(oportunidades);
  const tenantFilteredOportunidades = Array.isArray(tenantFilteredResult) ? tenantFilteredResult : [];
  
  // Filter by search term - includes nome, CPF/CNPJ, telefone
  // ✅ OTIMIZAÇÃO: useMemo para evitar recálculos desnecessários
  const filteredOportunidadesBase = Array.isArray(tenantFilteredOportunidades) ? tenantFilteredOportunidades : [];
  const filteredOportunidades = useMemo(() => filteredOportunidadesBase.filter((op: any) => {
    // Filter by search query
    if (searchQuery) {
      const term = searchQuery.toLowerCase().replace(/\D/g, '');
      const telefoneDigits = op.telefone?.replace(/\D/g, '') || '';
      const documentosDigits = op.documentos?.replace(/\D/g, '') || '';
      const matchSearch = 
        String(op.nome || "").toLowerCase().includes(term) ||
        String(op.cliente_nome || "").toLowerCase().includes(term) ||
        String(op.produto || "").toLowerCase().includes(term) ||
        telefoneDigits.includes(term) ||
        documentosDigits.includes(term);
      if (!matchSearch) return false;
    }
    
    // Filter by responsavel_id
    if (filters.responsavel_id) {
      if (op.responsavel_id !== filters.responsavel_id) return false;
    }
    
    // Filter by etapa
    if (filters.etapa_id) {
      if (op.etapa_id !== filters.etapa_id) return false;
    }

    // Filter by racionalCompany_id
    if (filters.racionalCompany_id) {
      const filterVal = Number(filters.racionalCompany_id);
      if (isNaN(filterVal) || op.racionalCompany_id !== filterVal) return false;
    }

    // Filter by franquia_id
    if (filters.franquia_id) {
      const filterVal = Number(filters.franquia_id);
      if (isNaN(filterVal) || op.franquia_id !== filterVal) return false;
    }

    // Filter by franqueado_id
    if (filters.franqueado_id) {
      const filterVal = Number(filters.franqueado_id);
      if (isNaN(filterVal) || op.franqueado_id !== filterVal) return false;
    }
    
    // Filter by data de criação - início
    if (filters.dataCriacaoInicio) {
      const dataCriacao = op.created_at ? new Date(op.created_at).getTime() : 0;
      const dataInicio = new Date(filters.dataCriacaoInicio).getTime();
      if (isNaN(dataInicio) || dataCriacao < dataInicio) return false;
    }
    
    // Filter by data de criação - fim
    if (filters.dataCriacaoFim) {
      const dataCriacao = op.created_at ? new Date(op.created_at).getTime() : 0;
      const dataFim = new Date(filters.dataCriacaoFim).getTime();
      if (isNaN(dataFim)) return true; // Skip filter if invalid date
      // Adicionar um dia para incluir o dia inteiro
      const dataFimCompleta = dataFim + (24 * 60 * 60 * 1000);
      if (dataCriacao > dataFimCompleta) return false;
    }
    
    // Filter by data de movimentação - início
    if (filters.dataMovimentacaoInicio) {
      const dataMovimentacao = op.ultimaMovimentacao || op.dataMovimentacao || op.movedAt || op.updatedAt;
      const dataMov = dataMovimentacao ? new Date(dataMovimentacao).getTime() : 0;
      const dataInicio = new Date(filters.dataMovimentacaoInicio).getTime();
      if (isNaN(dataInicio) || dataMov < dataInicio) return false;
    }
    
    // Filter by data de movimentação - fim
    if (filters.dataMovimentacaoFim) {
      const dataMovimentacao = op.ultimaMovimentacao || op.dataMovimentacao || op.movedAt || op.updatedAt;
      const dataMov = dataMovimentacao ? new Date(dataMovimentacao).getTime() : 0;
      const dataFim = new Date(filters.dataMovimentacaoFim).getTime();
      if (isNaN(dataFim)) return true; // Skip filter if invalid date
      const dataFimCompleta = dataFim + (24 * 60 * 60 * 1000);
      if (dataMov > dataFimCompleta) return false;
    }
    
    // Filter by data de integração - início
    if (filters.dataIntegradoInicio) {
      const dataIntegracao = op.integradoEm || op.dataIntegrado || op.integratedAt;
      const dataInt = dataIntegracao ? new Date(dataIntegracao).getTime() : 0;
      const dataInicio = new Date(filters.dataIntegradoInicio).getTime();
      if (isNaN(dataInicio) || dataInt < dataInicio) return false;
    }
    
    // Filter by data de integração - fim
    if (filters.dataIntegradoFim) {
      const dataIntegracao = op.integradoEm || op.dataIntegrado || op.integratedAt;
      const dataInt = dataIntegracao ? new Date(dataIntegracao).getTime() : 0;
      const dataFim = new Date(filters.dataIntegradoFim).getTime();
      if (isNaN(dataFim)) return true; // Skip filter if invalid date
      const dataFimCompleta = dataFim + (24 * 60 * 60 * 1000);
      if (dataInt > dataFimCompleta) return false;
    }
    
    return true;
  }), [filteredOportunidadesBase, searchQuery, filters]);
  
  // ✅ OTIMIZAÇÃO: Agrupar oportunidades por etapa uma única vez com ordenação
  const oportunidadesPorEtapa = useMemo(() => {
    const etapas = etapasAtivas.length > 0 ? etapasAtivas : ETAPAS_PIPELINE;
    const resultado: Record<string, typeof filteredOportunidades> = {};
    
    for (const etapa of etapas) {
      const etapaOpportunities = filteredOportunidades.filter((o) => o.etapa_id === etapa.id);
      const sortOption = columnSort[etapa.id] || 'data_desc';
      
      resultado[etapa.id] = etapaOpportunities.sort((a, b) => {
        const valorA = Number(a.valor ?? 0);
        const valorB = Number(b.valor ?? 0);
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        
        switch (sortOption) {
          case 'valor_asc':
            return valorA - valorB;
          case 'valor_desc':
            return valorB - valorA;
          case 'data_asc':
            return dateA - dateB;
          case 'data_desc':
          default:
            return dateB - dateA;
        }
      });
    }
    
    return resultado;
  }, [filteredOportunidades, columnSort, etapasAtivas]);

  // ✅ OTIMIZAÇÃO: Calcular totais por etapa uma única vez
  const totaisPorEtapa = useMemo(() => {
    const resultado: Record<string, number> = {};
    for (const etapa of etapasAtivas.length > 0 ? etapasAtivas : ETAPAS_PIPELINE) {
      const ops = oportunidadesPorEtapa[etapa.id] || [];
      resultado[etapa.id] = ops.reduce((acc, o) => acc + (o.valor || 0), 0);
    }
    return resultado;
  }, [oportunidadesPorEtapa, etapasAtivas]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    if (!can('oportunidades', 'move')) return;
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (!can('oportunidades', 'move')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, etapaId: string) => {
    if (!can('oportunidades', 'move')) return;

    e.preventDefault();

    const cardId = e.dataTransfer.getData("text/plain");

    if (!cardId) return;

    // ✅ VALIDAÇÃO DE AVANÇO: Verifica campos obrigatórios por etapa
    const oportunidade = safeOportunidadesKanban.find(o => o.id.toString() === cardId);
    if (oportunidade && etapaId !== 'perdido') {
      const validacao = validarEtapa(oportunidade, etapaId as EtapaKey);
      if (!validacao.valido) {
        alert(`⚠️ Não é possível avançar para esta etapa!\n\n${validacao.mensagem}`);
        setDraggedCard(null);
        setDragOverColumn(null);
        return;
      }
    }

    moveOportunidade(cardId, {
      etapa_id: etapaId,
      status: etapaId === "integrado" ? "ganho" : 
              etapaId === "perdido" ? "perdido" : 
              "ativo"
    });

    setDraggedCard(null);
    setDragOverColumn(null);
  };

  // Create oportunidade
  // Handle Import de dados
  const handleImport = (data: any[]) => {
    const novasOportunidades = data.map((item, index) => {
      // Normalizar tipoPessoa
      let tipoPessoa: "CPF" | "CNPJ" = "CPF"
      if (item.tipoPessoa) {
        const tp = item.tipoPessoa.toUpperCase()
        if (tp === 'PJ' || tp === 'CNPJ') tipoPessoa = "CNPJ"
      }
      
      // Normalizar etapa
      let etapa_id = "novo_lead"
      if (item.etapa) {
        const etapaNormalizada = item.etapa.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '_')
        const etapaValida = OFICIAL_ETAPAS.find(e => 
          e.key === etapaNormalizada || 
          e.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '_') === etapaNormalizada
        )
        if (etapaValida) {
          etapa_id = etapaValida.key
        }
      }
      
      // Normalizar telefone/celular (só números)
      const celular = item.celular?.replace(/\D/g, '') || ''
      const telefone = item.telefone?.replace(/\D/g, '') || ''
      const cpfCnpj = item.cpfCnpj?.replace(/\D/g, '') || ''
      
      // Encontrar responsável pelo nome
      let responsavel_id: string | null = null
      let responsavel_nome = ''
      if (item.responsavel) {
        const usuario = safeUsuarios.find((u: any) => 
          u.nome?.toLowerCase().includes(item.responsavel.toLowerCase())
        )
        if (usuario) {
          responsavel_id = usuario.id
          responsavel_nome = usuario.nome
        }
      }
      
      // Encontrar produto
      let produto_id: number | null = null
      if (item.produto) {
        const produto = safeProdutos.find(p => 
          p.nome?.toLowerCase().includes(item.produto.toLowerCase())
        )
        if (produto) {
          produto_id = produto.id
        }
      }
      
      return {
        id: generateId("lead"),
        nome: item.nomeCompleto || item.nome || "Sem nome",
        tipoPessoa,
        cpf_cnpj: cpfCnpj,
        celular,
        telefone,
        email: item.email || "",
        produto: item.produto || "",
        produto_id,
        etapa_id,
        etapa: etapa_id,
        valor: Number(item.valor) || 0,
        status: "ativo",
        cliente_nome: item.nomeCompleto || item.nome || "Sem nome",
        responsavel_id,
        responsavel_nome,
        observacoes: item.observacoes || "",
        rdStatus: item.rdStatus || "nao_consultado",
        rdConsultedAt: item.rdConsultedAt || "",
        rdNotes: item.rdNotes || "",
        tags: [],
        createdAt: new Date().toISOString()
      }
    })
    
    novasOportunidades.forEach(op => addOportunidade(op))
    alert(`Importadas ${novasOportunidades.length} oportunidades com sucesso!`)
  }

  // Funções de Consulta de Compliance
  const handleConsultCredit = () => {
    const doc = formData.cpf_cnpj?.replace(/\D/g, '');
    if (!doc || doc.length < 11) {
      alert('CPF/CNPJ inválido para consulta');
      return;
    }
    const hasRestriction = Math.random() > 0.7;
    setFormData({
      ...formData,
      rdStatus: hasRestriction ? 'restricao' : 'sem_restricao',
      rdConsultedAt: new Date().toISOString(),
    });
  };

  const handleConsultDoNotCall = () => {
    const phone = formData.celular || formData.telefone;
    if (!phone || phone.length < 10) {
      alert('Telefone/Celular inválido para consulta');
      return;
    }
    const isBlocked = Math.random() > 0.8;
    setFormData({
      ...formData,
      doNotCallStatus: isBlocked ? 'bloqueado' : 'liberado',
      doNotCallConsultedAt: new Date().toISOString(),
    });
  };

  // Renderizar status de compliance
  const renderCreditStatus = () => {
    const status = formData.rdStatus || 'nao_consultado';
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      nao_consultado: { color: 'text-slate-500', bg: 'bg-gray-400', label: 'Não consultado' },
      sem_restricao: { color: 'text-green-600', bg: 'bg-green-900/200', label: 'Sem restrição' },
      restricao: { color: 'text-red-600', bg: 'bg-red-900/200', label: 'Com restrição' },
    };
    const config = configs[status];
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${config.bg}`} />
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  const renderDoNotCallStatus = () => {
    const status = formData.doNotCallStatus || 'nao_consultado';
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      nao_consultado: { color: 'text-slate-500', bg: 'bg-gray-400', label: 'Não consultado' },
      liberado: { color: 'text-green-600', bg: 'bg-green-900/200', label: 'Liberado' },
      bloqueado: { color: 'text-yellow-600', bg: 'bg-yellow-900/200', label: 'Bloqueado' },
    };
    const config = configs[status];
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${config.bg}`} />
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar pendência
    if (formData.etapa_id === "pendencia" && !formData.pendenciaMotivo) {
      alert("Para salvar como Pendência, é necessário informar o motivo.");
      return;
    }

    // Validar e usar a etapa do pipeline atual
    const etapaId = formData.etapa_id && etapasAtivas.some(e => e.id === formData.etapa_id) 
      ? formData.etapa_id 
      : 'novo_lead';

    const newOportunidade = {
      // Gerar ID curto no formato L-0001
      id: generateId("lead"),

      // Dados do lead
      nome: formData.nome || "Sem nome",
      telefone: formData.telefone?.replace(/\D/g, "") || "",
      celular: formData.celular?.replace(/\D/g, "") || "",
      email: formData.email || "",
      cpf_cnpj: formData.cpf_cnpj || "",
      tipoPessoa: formData.tipoPessoa || "CPF",
      
      // Dados pessoais
      profissao: formData.profissao || "",
      estado_civil: formData.estado_civil || "",
      sexo: formData.sexo || "",
      data_nascimento: formData.data_nascimento || "",
      data_abertura: formData.data_abertura || "",
      
      // Endereço
      cep: formData.cep || "",
      rua: formData.rua || "",
      numero: formData.numero || "",
      complemento: formData.complemento || "",
      bairro: formData.bairro || "",
      cidade: formData.cidade || "",
      estado: formData.estado || "",
      
      // Produto selecionado
      produto: formData.produto || "",
      produto_id: selectedProductId || null,
      
      // Pipeline (novo sistema PIPELINES)
      pipeline_id: currentPipelineConfig?.id || selectedProductId || "consignado",
      pipelineNome: currentPipelineConfig?.nome,
      pipelineTipo: currentPipelineConfig?.tipo,
      etapa: etapaId,
      etapa_id: etapaId,

      // Status
      status: "ativo",

      // Valor
      valor: Number(formData.valor || 0),
      
      // Cliente (estrutura preparada para vinculação futura)
      cliente_id: formData.cliente_id || null,
      cliente_nome: formData.nome || "Sem nome",
      
      // Responsável
      responsavel_id: formData.responsavel_id || null,
      responsavel_nome: formData.responsavel_nome || "",
      
      // Observações
      observacoes: formData.observacoes || "",
      
      // Dados Bancários
      banco: formData.banco || "",
      agencia: formData.agencia || "",
      conta: formData.conta || "",
      tipoConta: formData.tipoConta || "",
      titular: formData.titular || "",
      documentoTitular: formData.documentoTitular || "",
      pixTipo: formData.pixTipo || "",
      pixChave: formData.pixChave || "",
      
      // RD / Consulta Restrição
      rdStatus: formData.rdStatus || "nao_consultado",
      rdConsultedAt: formData.rdConsultedAt || "",
      rdNotes: formData.rdNotes || "",
      
      // Hierarquia Comercial
      racionalCompany_id: formData.racionalCompany_id,
      franquia_id: formData.franquia_id,
      franqueado_id: formData.franqueado_id,
      
      // Motivo de pendência
      pendenciaMotivo: formData.etapa_id === "pendencia" ? formData.pendenciaMotivo : "",
      
      // Tags
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      
      // 🎯 Dados Onboarding Parceiro Comercial
      parceiroTipo: formData.parceiroTipo || "",
      razaoSocial: formData.razaoSocial || "",
      cnpj: formData.cnpj || "",
      telefoneComercial: formData.telefoneComercial || "",
      emailCorporativo: formData.emailCorporativo || "",
      responsavelLegal: formData.responsavelLegal || "",
      cpfResponsavel: formData.cpfResponsavel || "",
      cargoResponsavel: formData.cargoResponsavel || "",
      documentosEnviados: formData.documentosEnviados || [],
      
      // 🎯 Dados Onboarding Colaborador FINQZ
      vinculoTipo: formData.vinculoTipo || "",
      cargo: formData.cargo || "",
      departamento: formData.departamento || "",
      salario: formData.salario || "",
      formacao: formData.formacao || "",
      experienciaProfissional: formData.experienciaProfissional || "",
      disponibilidade: formData.disponibilidade || [],
      
      // Timestamps
      createdAt: new Date().toISOString()
    };

    addOportunidade(newOportunidade);

    // Reset form
    setShowModal(false);
    setFormData({
      nome: "", tipoPessoa: "CPF", cpf_cnpj: "", profissao: "", estado_civil: "", sexo: "",
      data_nascimento: "", data_abertura: "", celular: "", telefone: "", email: "",
      cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
      produto: "", valor: 0, etapa_id: "novo_lead", tags: [], cliente_id: null,
      responsavel_id: null, responsavel_nome: "", observacoes: "", banco: "", agencia: "",
      conta: "", tipoConta: "", titular: "", documentoTitular: "", pixTipo: "", pixChave: "",
      rdStatus: "nao_consultado", rdConsultedAt: "", rdNotes: "",
      racionalCompany_id: null, franquia_id: null, franqueado_id: null, pendenciaMotivo: "",
      // 🎯 Onboarding fields reset
      parceiroTipo: "", razaoSocial: "", cnpj: "", telefoneComercial: "", emailCorporativo: "",
      responsavelLegal: "", cpfResponsavel: "", cargoResponsavel: "", documentosEnviados: [],
      vinculoTipo: "", cargo: "", departamento: "", salario: "", formacao: "",
      experienciaProfissional: "", disponibilidade: []
    });
    setSelectedRacionalCompany(null);
    setSelectedFranquia(null);
    setSelectedFranqueado(null);
  };

  // Handle para editar oportunidade existente
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();

    const lead = editingOportunidade || selectedLead;
    if (!lead) return;

    const idToUpdate = lead.id ?? lead.displayId;
    if (!idToUpdate) return;

    const etapaId = formData.etapa_id || lead.etapa_id || lead.etapa || "novo_lead";

    const novoStatus =
      etapaId === "integrado" ? "ganho" :
      etapaId === "perdido" ? "perdido" :
      "ativo";

    const payload = {
      nome: formData.nome || "Sem nome",
      cliente_nome: formData.nome || "Sem nome",
      telefone: formData.telefone?.replace(/\D/g, "") || "",
      celular: formData.celular?.replace(/\D/g, "") || "",
      email: formData.email || "",
      cpf_cnpj: formData.cpf_cnpj || "",
      tipoPessoa: formData.tipoPessoa || "CPF",

      profissao: formData.profissao || "",
      estado_civil: formData.estado_civil || "",
      sexo: formData.sexo || "",
      data_nascimento: formData.data_nascimento || "",
      data_abertura: formData.data_abertura || "",

      cep: formData.cep || "",
      rua: formData.rua || "",
      numero: formData.numero || "",
      complemento: formData.complemento || "",
      bairro: formData.bairro || "",
      cidade: formData.cidade || "",
      estado: formData.estado || "",

      produto: formData.produto || "",
      valor: Number(formData.valor || 0),
      etapa_id: etapaId,
      etapa: etapaId,
      status: novoStatus,

      cliente_id: formData.cliente_id || null,
      responsavel_id: formData.responsavel_id || null,
      responsavel_nome: formData.responsavel_nome || "",
      observacoes: formData.observacoes || "",
      tags: Array.isArray(formData.tags) ? formData.tags : [],

      banco: formData.banco || "",
      agencia: formData.agencia || "",
      conta: formData.conta || "",
      tipoConta: formData.tipoConta || "",
      titular: formData.titular || "",
      documentoTitular: formData.documentoTitular || "",
      pixTipo: formData.pixTipo || "",
      pixChave: formData.pixChave || "",

      rdStatus: formData.rdStatus || "nao_consultado",
      rdConsultedAt: formData.rdConsultedAt || "",
      rdNotes: formData.rdNotes || "",

      racionalCompany_id: formData.racionalCompany_id,
      franquia_id: formData.franquia_id,
      franqueado_id: formData.franqueado_id,

      pendenciaMotivo: etapaId === "pendencia" ? formData.pendenciaMotivo : "",
      
      // 🎯 Dados Onboarding Parceiro Comercial
      parceiroTipo: formData.parceiroTipo || "",
      razaoSocial: formData.razaoSocial || "",
      cnpj: formData.cnpj || "",
      telefoneComercial: formData.telefoneComercial || "",
      emailCorporativo: formData.emailCorporativo || "",
      responsavelLegal: formData.responsavelLegal || "",
      cpfResponsavel: formData.cpfResponsavel || "",
      cargoResponsavel: formData.cargoResponsavel || "",
      documentosEnviados: formData.documentosEnviados || [],
      
      // 🎯 Dados Onboarding Colaborador FINQZ
      vinculoTipo: formData.vinculoTipo || "",
      cargo: formData.cargo || "",
      departamento: formData.departamento || "",
      salario: formData.salario || "",
      formacao: formData.formacao || "",
      experienciaProfissional: formData.experienciaProfissional || "",
      disponibilidade: formData.disponibilidade || []
    };

    updateOportunidade(String(idToUpdate), payload);

    setSelectedLead({
      ...lead,
      ...payload
    });

    setShowOpportunityForm(false);
    setShowModal(false);
    setEditingOportunidade(null);
  };

  // Pipeline handlers
  const handleCreatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    const newPipeline = {
      id: `pipeline-${Date.now()}`,
      nome: pipelineFormData.nome,
      ativo: true,
      colunas: [
        { id: "col-1", nome: "Entrada", ordem: 1, cor: "#3b82f6" },
        { id: "col-2", nome: "Em Andamento", ordem: 2, cor: "#8b5cf6" },
        { id: "col-3", nome: "Concluído", ordem: 3, cor: "#22c55e" }
      ]
    };
    addPipeline(newPipeline);
    setCurrentPipelineId(newPipeline.id);
    setShowPipelineModal(false);
    setPipelineFormData({ nome: "" });
  };

  const handleEditPipeline = () => {
    if (!editingPipeline) return;
    updatePipeline(editingPipeline.id, { nome: editingPipeline.nome });
    setEditingPipeline(null);
    setShowPipelineMenu(false);
  };

  const handleDeletePipeline = () => {
    const safePipelines = Array.isArray(pipelines) ? pipelines : [];
    if (!safeCurrentPipelineId || safePipelines.length <= 1) return;
    const pipelineName = currentPipelineConfig?.nome || safeCurrentPipelineId;
    if (confirm(`Excluir pipeline "${pipelineName}"?`)) {
      const otherPipeline = safePipelines.find((p: any) => p?.id !== safeCurrentPipelineId);
      if (otherPipeline?.id) {
        setCurrentPipelineId(otherPipeline.id);
      }
      deletePipeline(safeCurrentPipelineId);
    }
    setShowPipelineMenu(false);
  };

  // Column handlers
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const colunas = currentPipelineConfig?.colunas || [];
    const newColumn = {
      id: `col-${Date.now()}`,
      nome: columnFormData.nome,
      ordem: colunas.length + 1,
      cor: columnFormData.cor
    };
    addColumn(currentPipelineConfig?.id || safeCurrentPipelineId, newColumn);
    setShowColumnModal(false);
    setColumnFormData({ nome: "", cor: "#3b82f6" });
  };

  const handleEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn) return;
    updateColumn(currentPipelineConfig?.id || safeCurrentPipelineId, editingColumn.id, editingColumn.nome);
    setEditingColumn(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    const oportunidadesNaColuna = oportunidades.filter(o => o.coluna_id === columnId);
    if (oportunidadesNaColuna.length > 0) {
      alert("Não é possível excluir coluna com oportunidades. Mova-as primeiro.");
      return;
    }
    if (confirm("Excluir esta coluna?")) {
      deleteColumn(currentPipelineConfig?.id || safeCurrentPipelineId, columnId);
    }
  };

  // Oportunidade handlers
  const handleEditClick = (card: any) => {
    if (!canEditOportunidade(card)) return;

    const lead = {
      ...card,
      nome: card.cliente_nome ?? card.nome ?? '',
      etapa_id: card.etapa_id ?? card.etapa ?? 'negociacao',
    };

    setSelectedLead(lead);
    setEditingOportunidade(lead);

    // Preencher dados para o formulário principal (modal)
    setFormData({
      nome: lead.cliente_nome ?? lead.nome ?? "",
      tipoPessoa: lead.tipoPessoa ?? "CPF",
      cpf_cnpj: lead.cpf_cnpj ?? lead.documentos ?? "",
      profissao: lead.profissao ?? "",
      estado_civil: lead.estado_civil ?? "",
      sexo: lead.sexo ?? "",
      data_nascimento: lead.data_nascimento ?? "",
      data_abertura: lead.data_abertura ?? "",
      celular: lead.celular ?? lead.telefone ?? "",
      telefone: lead.telefone ?? "",
      email: lead.email ?? "",
      cep: lead.cep ?? "",
      rua: lead.rua ?? "",
      numero: lead.numero ?? "",
      complemento: lead.complemento ?? "",
      bairro: lead.bairro ?? "",
      cidade: lead.cidade ?? "",
      estado: lead.estado ?? "",
      produto: lead.produto ?? "",
      valor: Number(lead.valor ?? 0),
      etapa_id: lead.etapa_id,
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      cliente_id: lead.cliente_id ?? null,
      responsavel_id: lead.responsavel_id ?? null,
      responsavel_nome: lead.responsavel_nome ?? "",
      observacoes: lead.observacoes ?? "",
      banco: lead.banco ?? "",
      agencia: lead.agencia ?? "",
      conta: lead.conta ?? "",
      tipoConta: lead.tipoConta ?? "",
      titular: lead.titular ?? "",
      documentoTitular: lead.documentoTitular ?? "",
      pixTipo: lead.pixTipo ?? "",
      pixChave: lead.pixChave ?? "",
      rdStatus: lead.rdStatus ?? "nao_consultado",
      rdConsultedAt: lead.rdConsultedAt ?? "",
      rdNotes: lead.rdNotes ?? "",
      racionalCompany_id: lead.racionalCompany_id ?? null,
      franquia_id: lead.franquia_id ?? null,
      franqueado_id: lead.franqueado_id ?? null,
      pendenciaMotivo: lead.pendenciaMotivo ?? ""
    });

    // Também preencher editDrawerData para compatibilidade
    setEditDrawerData({
      nome: lead.nome ?? "",
      tipoPessoa: lead.tipoPessoa ?? "CPF",
      cpf_cnpj: lead.cpf_cnpj ?? "",
      profissao: lead.profissao ?? "",
      estado_civil: lead.estado_civil ?? "",
      sexo: lead.sexo ?? "",
      data_nascimento: lead.data_nascimento ?? "",
      data_abertura: lead.data_abertura ?? "",
      celular: lead.celular ?? "",
      telefone: lead.telefone ?? "",
      email: lead.email ?? "",
      cep: lead.cep ?? "",
      rua: lead.rua ?? "",
      numero: lead.numero ?? "",
      complemento: lead.complemento ?? "",
      bairro: lead.bairro ?? "",
      cidade: lead.cidade ?? "",
      estado: lead.estado ?? "",
      produto: lead.produto ?? "",
      valor: lead.valor ?? 0,
      etapa_id: lead.etapa_id,
      responsavel_id: lead.responsavel_id ?? null,
      responsavel_nome: lead.responsavel_nome ?? "",
      observacoes: lead.observacoes ?? "",
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      banco: lead.banco ?? "",
      agencia: lead.agencia ?? "",
      conta: lead.conta ?? "",
      tipoConta: lead.tipoConta ?? "",
      titular: lead.titular ?? "",
      documentoTitular: lead.documentoTitular ?? "",
      pixTipo: lead.pixTipo ?? "",
      pixChave: lead.pixChave ?? "",
      rdStatus: lead.rdStatus ?? "nao_consultado",
      rdConsultedAt: lead.rdConsultedAt ?? "",
      rdNotes: lead.rdNotes ?? "",
      racionalCompany_id: lead.racionalCompany_id ?? null,
      franquia_id: lead.franquia_id ?? null,
      franqueado_id: lead.franqueado_id ?? null,
      pendenciaMotivo: lead.pendenciaMotivo ?? ""
    });

    // O formulário será aberto pelo botão que chamou esta função
    setSelectedLead(lead);
    setEditingOportunidade(lead);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!can('oportunidades', 'delete')) return;
    if (confirm("Tem certeza que deseja excluir esta oportunidade?")) {
      deleteOportunidade(id);
    }
  };

  // Funções para editar a partir do drawer
  const handleOpenEditFromDrawer = () => {
    const lead = selectedLead || editingOportunidade;
    if (!lead) return;
    if (!canEditOportunidade(lead)) return;

    const etapaAtual = lead.etapa_id ?? lead.etapa ?? 'novo_lead';

    setEditingOportunidade(lead);

    setFormData({
      nome: lead.cliente_nome ?? lead.nome ?? "",
      tipoPessoa: lead.tipoPessoa ?? "CPF",
      cpf_cnpj: lead.cpf_cnpj ?? lead.documentos ?? "",
      profissao: lead.profissao ?? "",
      estado_civil: lead.estado_civil ?? "",
      sexo: lead.sexo ?? "",
      data_nascimento: lead.data_nascimento ?? "",
      data_abertura: lead.data_abertura ?? "",

      celular: lead.celular ?? lead.telefone ?? "",
      telefone: lead.telefone ?? "",
      email: lead.email ?? "",

      cep: lead.cep ?? "",
      rua: lead.rua ?? "",
      numero: lead.numero ?? "",
      complemento: lead.complemento ?? "",
      bairro: lead.bairro ?? "",
      cidade: lead.cidade ?? "",
      estado: lead.estado ?? "",

      produto: lead.produto ?? "",
      valor: Number(lead.valor ?? 0),
      etapa_id: etapaAtual,
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      cliente_id: lead.cliente_id ?? null,
      responsavel_id: lead.responsavel_id ?? null,
      responsavel_nome: lead.responsavel_nome ?? "",
      observacoes: lead.observacoes ?? "",

      banco: lead.banco ?? "",
      agencia: lead.agencia ?? "",
      conta: lead.conta ?? "",
      tipoConta: lead.tipoConta ?? "",
      titular: lead.titular ?? "",
      documentoTitular: lead.documentoTitular ?? "",
      pixTipo: lead.pixTipo ?? "",
      pixChave: lead.pixChave ?? "",

      rdStatus: lead.rdStatus ?? "nao_consultado",
      rdConsultedAt: lead.rdConsultedAt ?? "",
      rdNotes: lead.rdNotes ?? "",

      racionalCompany_id: lead.racionalCompany_id ?? null,
      franquia_id: lead.franquia_id ?? null,
      franqueado_id: lead.franqueado_id ?? null,
      pendenciaMotivo: lead.pendenciaMotivo ?? ""
    });

    setShowModal(true);
  };

  const handleSaveEditFromDrawer = () => {
    const leadToEdit = selectedLead || editingOportunidade;
    if (!leadToEdit) return;

    const idToUpdate = leadToEdit.id ?? leadToEdit.displayId;
    if (!idToUpdate) return;

    // Se a etapa mudou, validar antes de salvar
    const etapaAnterior = leadToEdit.etapa_id || leadToEdit.etapa;
    if (etapaAnterior !== editDrawerData.etapa_id && editDrawerData.etapa_id !== 'perdido') {
      const validacao = validarEtapa(editDrawerData, editDrawerData.etapa_id as EtapaKey);
      if (!validacao.valido) {
        alert(`⚠️ Não é possível avançar para esta etapa!\n\n${validacao.mensagem}`);
        return;
      }
    }

    // Determinar o status com base na nova etapa
    const novoStatus = editDrawerData.etapa_id === 'integrado' ? 'ganho' : 
                      editDrawerData.etapa_id === 'perdido' ? 'perdido' : 'ativo';

    updateOportunidade(String(idToUpdate), {
      // Dados Pessoais / Cliente
      nome: editDrawerData.nome,
      telefone: editDrawerData.telefone?.replace(/\D/g, "") || "",
      celular: editDrawerData.celular?.replace(/\D/g, "") || "",
      email: editDrawerData.email || "",
      cpf_cnpj: editDrawerData.cpf_cnpj || "",
      tipoPessoa: editDrawerData.tipoPessoa || "CPF",
      profissao: editDrawerData.profissao || "",
      estado_civil: editDrawerData.estado_civil || "",
      sexo: editDrawerData.sexo || "",
      data_nascimento: editDrawerData.data_nascimento || "",
      data_abertura: editDrawerData.data_abertura || "",
      // Endereço
      cep: editDrawerData.cep || "",
      rua: editDrawerData.rua || "",
      numero: editDrawerData.numero || "",
      complemento: editDrawerData.complemento || "",
      bairro: editDrawerData.bairro || "",
      cidade: editDrawerData.cidade || "",
      estado: editDrawerData.estado || "",
      // Dados da Oportunidade
      produto: editDrawerData.produto || "",
      valor: Number(editDrawerData.valor || 0),
      etapa_id: editDrawerData.etapa_id,
      etapa: editDrawerData.etapa_id,
      status: novoStatus,
      cliente_nome: editDrawerData.nome,
      responsavel_id: editDrawerData.responsavel_id,
      responsavel_nome: editDrawerData.responsavel_nome,
      observacoes: editDrawerData.observacoes || "",
      tags: Array.isArray(editDrawerData.tags) ? editDrawerData.tags : [],
      // Dados Bancários
      banco: editDrawerData.banco || "",
      agencia: editDrawerData.agencia || "",
      conta: editDrawerData.conta || "",
      tipoConta: editDrawerData.tipoConta || "",
      titular: editDrawerData.titular || "",
      documentoTitular: editDrawerData.documentoTitular || "",
      pixTipo: editDrawerData.pixTipo || "",
      pixChave: editDrawerData.pixChave || "",
      // RD / Consulta Restrição
      rdStatus: editDrawerData.rdStatus || "nao_consultado",
      rdConsultedAt: editDrawerData.rdConsultedAt || "",
      rdNotes: editDrawerData.rdNotes || "",
      // Hierarquia Comercial
      racionalCompany_id: editDrawerData.racionalCompany_id,
      franquia_id: editDrawerData.franquia_id,
      franqueado_id: editDrawerData.franqueado_id,
      // Motivo de pendência
      pendenciaMotivo: editDrawerData.etapa_id === "pendencia" ? editDrawerData.pendenciaMotivo : ""
    });

    // Atualizar o selectedLead com os novos dados
    setSelectedLead({
      ...leadToEdit,
      nome: editDrawerData.nome,
      cliente_nome: editDrawerData.nome,
      telefone: editDrawerData.telefone,
      celular: editDrawerData.celular,
      email: editDrawerData.email,
      produto: editDrawerData.produto,
      valor: editDrawerData.valor,
      etapa_id: editDrawerData.etapa_id,
      etapa: editDrawerData.etapa_id,
      status: novoStatus,
      responsavel_id: editDrawerData.responsavel_id,
      responsavel_nome: editDrawerData.responsavel_nome,
      tags: editDrawerData.tags,
      observacoes: editDrawerData.observacoes
    });

    // Se a etapa mudou, mover o card para a coluna correta
    if (etapaAnterior !== editDrawerData.etapa_id) {
      moveOportunidade(idToUpdate, {
        etapa_id: editDrawerData.etapa_id,
        status: novoStatus
      });
    }

    setShowEditDrawerModal(false);
    setEditingOportunidade(null);
    setSelectedLead(null);
  };

  if (!isPipelineValid) {
    return (
      <div className={`p-4 ${isDark ? "text-white" : "text-white"}`}>
        {selectedProductId 
          ? "Pipeline não encontrado para este produto. Selecione outro produto ou configure o pipeline."
          : "Nenhum pipeline encontrado"}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Padronizado - COM SELECT DE PIPELINE NA MESMA LINHA */}
      <PageHeader
        view={viewMode}
        setView={setViewMode}
        onSearch={setSearchQuery}
        onRefresh={() => {}}
        onCreate={() => setShowModal(true)}
        createLabel="Nova Oportunidade"
        // Ativar FilterDrawer (padrão premium)
        onOpenFilters={() => setShowFilterDrawer(true)}
        extraLeft={
          <select
            value={currentPipelineId || "pipeline-consignado"}
            onChange={(e) => handleProductChange(e.target.value)}
            className="border border-[#1f2937] px-3 py-2 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-[#000dff]/20"
          >
            {/* 🎯 APENAS PIPELINES DO CATÁLOGO PF */}
            {catalogPipelineOptions.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        }
        filters={[
          { label: 'Etapa', key: 'etapa_id', type: 'select', options: OFICIAL_ETAPAS.map(e => ({ label: e.label, value: e.key })), placeholder: 'Todas as etapas' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Ativo', value: 'ativo' },
            { label: 'Integrado', value: 'ganho' },
            { label: 'Perdido', value: 'perdido' }
          ], placeholder: 'Todos os status' },
          { label: 'Responsável', key: 'responsavel_id', type: 'select', options: safeUsuarios.filter((u: any) => u.status === 'ativo').map((u: any) => ({ label: u.nome, value: u.id })), placeholder: 'Todos os responsáveis' },
          { label: 'Data Criação (De)', key: 'dataCriacaoInicio', type: 'date' },
          { label: 'Data Criação (Até)', key: 'dataCriacaoFim', type: 'date' },
        ]}
        onFilterChange={updateFilter}
        filterValues={filters}
        exportData={filteredOportunidades}
        exportColumns={[
          { key: 'nome', label: 'Nome' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'produto', label: 'Produto' },
          { key: 'valor', label: 'Valor' },
          { key: 'etapa_id', label: 'Etapa' },
          { key: 'status', label: 'Status' },
        ]}
        exportFilename="oportunidades"
        exportLabel="Exportar"
        importLabel="Importar Leads"
        importColumns={[
          { key: 'nomeCompleto', label: 'Nome Completo', required: true },
          { key: 'tipoPessoa', label: 'Tipo de Pessoa', validate: (v) => !['PF', 'PJ', 'cpf', 'cnpj'].includes(v) ? 'Deve ser PF ou PJ' : null },
          { key: 'cpfCnpj', label: 'CPF/CNPJ' },
          { key: 'celular', label: 'Celular' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
          { key: 'produto', label: 'Produto' },
          { key: 'etapa', label: 'Etapa' },
          { key: 'valor', label: 'Valor', validate: (v) => isNaN(Number(v)) ? 'Deve ser número' : null },
          { key: 'responsavel', label: 'Responsável' },
          { key: 'racionalCompany', label: 'Racional Company' },
          { key: 'franquia', label: 'Franquia' },
          { key: 'franqueado', label: 'Franqueado' },
          { key: 'rdStatus', label: 'RD Status' },
          { key: 'rdConsultedAt', label: 'RD Data Consulta' },
          { key: 'rdNotes', label: 'RD Observações' },
          { key: 'observacoes', label: 'Observações' },
        ]}
        onImport={handleImport}
      />

      {/* Header e filtros wrapper */}
      <div>
        {/* FILTER DRAWER */}
        {showFilterDrawer && (
          <>
            {/* OVERLAY */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowFilterDrawer(false)}
            />

            {/* DRAWER */}
            <div className="fixed top-0 right-0 h-full w-[420px] bg-[#111827] z-50 shadow-2xl flex flex-col">

              {/* HEADER */}
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-lg">Filtros</h2>

                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className="text-slate-500 hover:text-black"
                >
                  ✕
                </button>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* ================= ETAPA E RESPONSÁVEL ================= */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    OPERACIONAL
                  </div>

                  <div className="space-y-3">

                    <Select value={filters.etapa_id} onChange={(e)=>updateFilter("etapa_id", e.target.value)}>
                      <option value="">Etapa</option>
                      {(etapasAtivas.length > 0 ? etapasAtivas : ETAPAS_PIPELINE).map(e => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </Select>

                    <Select value={filters.responsavel_id} onChange={(e)=>updateFilter("responsavel_id", e.target.value)}>
                      <option value="">Responsável</option>
                      {safeUsuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                      ))}
                    </Select>

                  </div>
                </div>

                {/* ================= HIERARQUIA COMERCIAL ================= */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    HIERARQUIA COMERCIAL
                  </div>

                  <div className="space-y-3">

                    <Select 
                      value={filters.racionalCompany_id} 
                      onChange={(e) => {
                        updateFilter("racionalCompany_id", e.target.value);
                        // Limpar Franquia e Franqueado ao trocar Company
                        if (e.target.value) {
                          updateFilter("franquia_id", "");
                          updateFilter("franqueado_id", "");
                        }
                      }}
                    >
                      <option value="">Company</option>
                      {(racionalCompanies || []).map(c => (
                        <option key={c.id} value={String(c.id)}>{c.nome || ''}</option>
                      ))}
                    </Select>

                    <Select 
                      value={filters.franquia_id} 
                      onChange={(e) => {
                        updateFilter("franquia_id", e.target.value);
                        // Limpar Franqueado ao trocar Franquia
                        if (e.target.value) {
                          updateFilter("franqueado_id", "");
                        }
                      }}
                    >
                      <option value="">Franquia</option>
                      {(franquias || [])
                        .filter(f => !filters.racionalCompany_id || f.company_id === Number(filters.racionalCompany_id))
                        .map(f => (
                          <option key={f.id} value={String(f.id)}>{f.nome || ''}</option>
                        ))
                      }
                    </Select>

                    <Select value={filters.franqueado_id} onChange={(e)=>updateFilter("franqueado_id", e.target.value)}>
                      <option value="">Franqueado</option>
                      {(franqueados || [])
                        .filter(f => !filters.franquia_id || f.franquia_id === Number(filters.franquia_id))
                        .map(f => (
                          <option key={f.id} value={String(f.id)}>{f.nome || ''}</option>
                        ))
                      }
                    </Select>

                  </div>
                </div>

                {/* ================= DATAS ================= */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    DATAS
                  </div>

                  <div className="space-y-3">

                    {/* DATA CRIAÇÃO */}
                    <div>
                      <label className="text-xs text-slate-500">Data Criação</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="date" value={filters.dataCriacaoInicio} onChange={(e)=>updateFilter("dataCriacaoInicio", e.target.value)} placeholder="Início"/>
                        <Input type="date" value={filters.dataCriacaoFim} onChange={(e)=>updateFilter("dataCriacaoFim", e.target.value)} placeholder="Fim"/>
                      </div>
                    </div>

                    {/* DATA MOVIMENTAÇÃO */}
                    <div>
                      <label className="text-xs text-slate-500">Data Movimentação</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="date" value={filters.dataMovimentacaoInicio} onChange={(e)=>updateFilter("dataMovimentacaoInicio", e.target.value)} placeholder="Início"/>
                        <Input type="date" value={filters.dataMovimentacaoFim} onChange={(e)=>updateFilter("dataMovimentacaoFim", e.target.value)} placeholder="Fim"/>
                      </div>
                    </div>

                    {/* DATA INTEGRAÇÃO */}
                    <div>
                      <label className="text-xs text-slate-500">Data Integração</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="date" value={filters.dataIntegradoInicio} onChange={(e)=>updateFilter("dataIntegradoInicio", e.target.value)} placeholder="Início"/>
                        <Input type="date" value={filters.dataIntegradoFim} onChange={(e)=>updateFilter("dataIntegradoFim", e.target.value)} placeholder="Fim"/>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* FOOTER FIXO */}
              <div className="p-4 border-t flex justify-between">

                <Button variant="ghost" onClick={resetFilters}>
                  Limpar
                </Button>

                <Button onClick={() => setShowFilterDrawer(false)}>
                  Aplicar
                </Button>

              </div>

            </div>
          </>
        )}

      </div>

      {/* 🚨 ÁREA DO PIPELINE - COM SCROLL VERTICAL E HORIZONTAL */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="flex gap-3 p-4 min-h-full">
          {/* ✅ Kanban dinâmico baseado no pipeline configurado */}
          {/* ✅ OTIMIZAÇÃO: Usar dados pré-calculados de oportunidadesPorEtapa */}
          {(etapasAtivas.length > 0 ? etapasAtivas : ETAPAS_PIPELINE).map((etapa) => {
          const columnOportunidades = oportunidadesPorEtapa[etapa.id] || [];
          const totalValor = totaisPorEtapa[etapa.id] || 0;
          const isDragOver = dragOverColumn === etapa.id;
          
          return (
            <div
              key={etapa.id}
              className={`w-[300px] flex-shrink-0 rounded-xl flex flex-col max-h-full bg-gray-100`}
              onDragOver={(e) => handleDragOver(e, etapa.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, etapa.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-[#1f2937] bg-gray-100 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: etapa.cor }}
                    />
                    <h3 className="font-semibold text-white text-sm truncate">
                      {etapa.nome}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-slate-600 flex-shrink-0">
                      {columnOportunidades.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">
                      R$ {totalValor.toLocaleString("pt-BR")}
                    </span>
                    {/* Controle de ordenação */}
                    <div className="relative group">
                      <button className="p-1 rounded hover:bg-gray-200 transition-colors" title="Ordenar">
                        <MoreHorizontal size={14} className="text-slate-500" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg border z-10 hidden group-hover:block bg-[#111827] border-[#1f2937]">
                        <div className="px-2 py-1 text-[10px] text-slate-400 border-b border-[#1f2937]">
                          Ordenar por
                        </div>
                        <button
                          onClick={() => setColumnSort(prev => ({ ...prev, [etapa.id]: 'valor_desc' }))}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${columnSort[etapa.id] === 'valor_desc' ? 'bg-blue-900/20 text-blue-700' : 'text-slate-300 hover:bg-gray-50'}`}
                        >
                          <ArrowDown size={12} /> Valor: maior
                        </button>
                        <button
                          onClick={() => setColumnSort(prev => ({ ...prev, [etapa.id]: 'valor_asc' }))}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${columnSort[etapa.id] === 'valor_asc' ? 'bg-blue-900/20 text-blue-700' : 'text-slate-300 hover:bg-gray-50'}`}
                        >
                          <ArrowUp size={12} /> Valor: menor
                        </button>
                        <button
                          onClick={() => setColumnSort(prev => ({ ...prev, [etapa.id]: 'data_desc' }))}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${columnSort[etapa.id] === 'data_desc' || !columnSort[etapa.id] ? 'bg-blue-900/20 text-blue-700' : 'text-slate-300 hover:bg-gray-50'}`}
                        >
                          <Clock size={12} /> Data: mais novo
                        </button>
                        <button
                          onClick={() => setColumnSort(prev => ({ ...prev, [etapa.id]: 'data_asc' }))}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${columnSort[etapa.id] === 'data_asc' ? 'bg-blue-900/20 text-blue-700' : 'text-slate-300 hover:bg-gray-50'}`}
                        >
                          <Clock size={12} /> Data: mais antigo
                        </button>
                      </div>
                    </div>
                    {can('oportunidades', 'edit') && (
                      <div className="relative group">
                        <button className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDark ? "hover:bg-[#1a1a2e]" : "hover:bg-gray-100"
                        }`}>
                          <MoreVertical size={14} className={isDark ? "text-slate-400" : "text-slate-600"} />
                        </button>
                        <div className={`absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg border z-10 hidden group-hover:block ${
                          isDark ? "bg-[#0a0a12] border-[#1a1a2e]" : "bg-[#111827] border-[#1f2937]"
                        }`}>
                          <button
                            onClick={() => setEditingColumn({ id: coluna.id, nome: coluna.nome })}
                            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${
                              isDark ? "text-slate-300 hover:bg-[#1a1a2e]" : "text-slate-300 hover:bg-gray-50"
                            }`}
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(coluna.id)}
                            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-red-500 hover:bg-red-900/200/10"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards - Versão Estável */}
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {columnOportunidades.map((card) => {
                  // Normalizar dados do card com optional chaining e fallbacks
                  const cardData = {
                    id: card?.id ?? '0',
                    displayId: card?.displayId ?? card?.id ?? 'L-0000',
                    nome: card?.cliente_nome ?? card?.nome ?? 'Sem nome',
                    produto: card?.produto ?? '',
                    valor: Number(card?.valor ?? 0),
                    telefone: card?.telefone ?? '',
                    email: card?.email ?? '',
                    tags: Array.isArray(card?.tags) ? card.tags : [],
                    etapa: card?.etapa_id ?? card?.etapa ?? 'novo_lead',
                    status: card?.status ?? 'ativo',
                    cliente_id: card?.cliente_id ?? null,
                    responsavel_id: card?.responsavel_id ?? null,
                    responsavel_nome: card?.responsavel_nome ?? '',
                    createdAt: card?.createdAt ?? null,
                    updatedAt: card?.updatedAt ?? null
                  };

                  // Função para formatar data
                  const formatDate = (dateStr: string | null | undefined) => {
                    if (!dateStr) return null;
                    try {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('pt-BR');
                    } catch {
                      return null;
                    }
                  };

                  // Função para calcular dias sem atuação
                  const getDiasSemAtuacao = () => {
                    const now = new Date();
                    // Usa updatedAt se existir, senão usa createdAt
                    const dataReferencia = cardData.updatedAt || cardData.createdAt;
                    if (!dataReferencia) return null;
                    try {
                      const data = new Date(dataReferencia);
                      const diffTime = now.getTime() - data.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays;
                    } catch {
                      return null;
                    }
                  };

                  const telefoneLimpo = String(cardData.telefone).replace(/\D/g, '');
                  
                  return (
                    <div
                      key={cardData.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, String(cardData.id))}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleOpenLead(cardData)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenLead(cardData);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="p-3 rounded-lg transition-all cursor-pointer bg-[#111827] border border-[#1f2937] hover:border-blue-400 hover:shadow-sm"
                    >
                      {/* ID no topo - usa displayId (L-0001) */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          #{cardData.displayId}
                        </span>
                        <StatusBadge 
                          status={cardData.status === 'ganho' ? 'aprovado' : cardData.status === 'perdido' ? 'reprovado' : 'pendente'} 
                          size="sm" 
                        />
                      </div>
                      
                      {/* Nome do cliente com Avatar */}
                      <div className="flex items-center gap-2 mb-1">
                        <EntityAvatar name={cardData.nome} type="cliente" size="sm" />
                        <h4 className="font-medium text-white text-sm truncate flex-1">
                          {cardData.nome}
                        </h4>
                      </div>
                      
                      {/* Produto */}
                      {cardData.produto && (
                        <p className="text-xs text-slate-600 truncate">
                          {cardData.produto}
                        </p>
                      )}
                      
                      {/* Responsável */}
                      <p className="text-xs text-slate-500 truncate">
                        {cardData.responsavel_nome || 'Sem responsável'}
                      </p>
                      
                      {/* Valor */}
                      {cardData.valor > 0 && (
                        <p className="text-base font-bold text-blue-600 mt-1">
                          R$ {cardData.valor.toLocaleString("pt-BR")}
                        </p>
                      )}
                      
                      {/* Data */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        {formatDate(cardData.createdAt) && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(cardData.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      {/* Dias sem atuação */}
                      {(() => {
                        const dias = getDiasSemAtuacao();
                        if (dias === null) return null;
                        let cor = '#22c55e'; // verde até 4 dias
                        if (dias >= 10) cor = '#ef4444'; // vermelho 10+ dias
                        else if (dias >= 5) cor = '#f59e0b'; // amarelo 5-9 dias
                        return (
                          <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: cor }}>
                            <Timer size={10} />
                            Sem atuação: {dias} {dias === 1 ? 'dia' : 'dias'}
                          </div>
                        );
                      })()}
                      
                      {/* Tags - máximo 2 + N */}
                      {cardData.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getTagsByIds(cardData.tags).slice(0, 2).map((tag) => (
                            <span
                              key={tag?.id ?? Math.random()}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                              style={{ backgroundColor: tag?.cor ?? '#6b7280' }}
                            >
                              {tag?.nome ?? ''}
                            </span>
                          ))}
                          {cardData.tags.length > 2 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-slate-300">
                              +{cardData.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Ações rápidas com ícones e stopPropagation */}
                      <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                        {canEditOportunidade(cardData) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              if (!selectedLead) {
                                alert("Nenhuma oportunidade selecionada para edição.");
                                return;
                              }

                              handleEditClick(cardData);
                              setShowOpportunityForm(true);
                            }}
                            className="p-1 rounded bg-blue-900/20 text-blue-700 hover:bg-blue-900/20"
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {telefoneLimpo && (
                          <>
                            <a
                              href={`https://wa.me/55${telefoneLimpo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded bg-green-900/20 text-green-700 hover:bg-green-900/20"
                              title="WhatsApp"
                            >
                              <MessageCircle size={12} />
                            </a>
                            <a
                              href={`tel:${telefoneLimpo}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded bg-blue-900/20 text-blue-700 hover:bg-blue-900/20"
                              title="Ligar"
                            >
                              <Phone size={12} />
                            </a>
                          </>
                        )}
                        {cardData.email && (
                          <a
                            href={`mailto:${cardData.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded bg-purple-900/20 text-purple-700 hover:bg-purple-900/20"
                            title="E-mail"
                          >
                            <Mail size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Modal de Nova Oportunidade */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setEditingOportunidade(null); }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl bg-[#111827] border border-[#1f2937]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
              <h2 className="text-lg font-semibold text-white">
                {editingOportunidade ? "Editar Oportunidade" : "Nova Oportunidade"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingOportunidade(null); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Form - Completo */}
            <form onSubmit={editingOportunidade ? handleSubmitEdit : handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Seção: Dados do Cliente */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
                    <input type="text" value={formData.nome ?? ""} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome completo" required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                    <select value={formData.tipoPessoa ?? "CPF"} onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value as "CPF" | "CNPJ" })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="CPF">Pessoa Física</option>
                      <option value="CNPJ">Pessoa Jurídica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{formData.tipoPessoa === "CPF" ? "CPF" : "CNPJ"}</label>
                    <input type="text" value={formData.tipoPessoa === "CPF" ? formatCPFInput(formData.cpf_cnpj ?? "") : formatCNPJInput(formData.cpf_cnpj ?? "")} onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value.replace(/\D/g, "") })} placeholder={formData.tipoPessoa === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Celular *</label>
                    <input type="tel" value={formData.celular ?? ""} onChange={(e) => setFormData({ ...formData, celular: formatCell(e.target.value) })} placeholder="(00) 00000-0000" required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                    <input type="tel" value={formData.telefone ?? ""} onChange={(e) => setFormData({ ...formData, telefone: formatCell(e.target.value) })} placeholder="(00) 0000-0000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                    <input type="email" value={formData.email ?? ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  {formData.tipoPessoa === "CPF" ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data Nascimento</label>
                      <input type="date" value={formData.data_nascimento ?? ""} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data Abertura</label>
                      <input type="date" value={formData.data_abertura ?? ""} onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Seção: Endereço */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Endereço</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">CEP</label><input type="text" value={formData.cep ?? ""} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Número</label><input type="text" value={formData.numero ?? ""} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Rua</label><input type="text" value={formData.rua ?? ""} onChange={(e) => setFormData({ ...formData, rua: e.target.value })} placeholder="Endereço" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label><input type="text" value={formData.complemento ?? ""} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} placeholder="Apto, sala..." className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label><input type="text" value={formData.bairro ?? ""} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} placeholder="Bairro" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label><input type="text" value={formData.cidade ?? ""} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} placeholder="Cidade" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Estado</label><input type="text" value={formData.estado ?? ""} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} placeholder="UF" maxLength={2} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] uppercase" /></div>
                </div>
              </div>
              
              {/* Seção: Oportunidade */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Oportunidade</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Produto *</label>
                    <select 
                      value={formData.productId || formData.produto || ""} 
                      onChange={(e) => {
                        const productId = e.target.value;
                        const product = catalogProductOptions.find(p => p.id === productId);
                        setFormData({ 
                          ...formData, 
                          produto: product?.name || "",
                          productId: productId,
                          productCode: product?.code || "",
                          subproductId: "",
                          subproductCode: "",
                          modality: ""
                        });
                        setSelectedProductId(productId);
                        setSelectedSubproductId("");
                        setSelectedModality("");
                      }} 
                      className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]"
                    >
                      <option value="">Selecione</option>
                      {catalogProductOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      {/* Fallback para produtos legados */}
                      {safeProdutos.filter(sp => !catalogProductOptions.find(cp => cp.name === sp.nome)).map((p) => <option key={`legacy-${p.id}`} value={p.nome}>{p.nome}</option>)}
                    </select>
                  </div>
                  {/* 🎯 Subproduto */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Subproduto</label>
                    <select 
                      value={formData.subproductId || ""} 
                      onChange={(e) => {
                        const subproductId = e.target.value;
                        const subproduct = catalogSubproducts.find(s => s.id === subproductId);
                        setFormData({ 
                          ...formData, 
                          subproductId: subproductId,
                          subproductCode: subproduct?.code || "",
                          modality: ""
                        });
                        setSelectedSubproductId(subproductId);
                        setSelectedModality("");
                      }}
                      disabled={!formData.productId}
                      className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] disabled:opacity-50"
                    >
                      <option value="">Selecione</option>
                      {catalogSubproducts.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                  {/* 🎯 Modalidade */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Modalidade</label>
                    <select 
                      value={formData.modality || ""} 
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          modality: e.target.value
                        });
                        setSelectedModality(e.target.value);
                      }}
                      disabled={!formData.subproductId}
                      className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] disabled:opacity-50"
                    >
                      <option value="">Selecione</option>
                      {catalogModalities.map((m) => (
                        <option key={m} value={m}>{getModalityLabel(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Etapa *</label>
                    <select value={formData.etapa_id ?? "novo_lead"} onChange={(e) => setFormData({ ...formData, etapa_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      {OFICIAL_ETAPAS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
                    <input type="number" value={formData.valor ?? 0} onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
                    <select value={formData.responsavel_id ?? ""} onChange={(e) => { const sid = e.target.value; const su = availableResponsibles.find((u: any) => u.id === sid); setFormData({ ...formData, responsavel_id: sid || null, responsavel_nome: su?.nome ?? "" }); }} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione</option>
                      {availableResponsibles.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
                    <textarea value={formData.observacoes ?? ""} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] resize-none" />
                  </div>
                </div>
              </div>
              
              {/* Seção: Dados Bancários */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados Bancários</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Banco</label><input type="text" value={formData.banco ?? ""} onChange={(e) => setFormData({ ...formData, banco: e.target.value })} placeholder="Banco" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Agência</label><input type="text" value={formData.agencia ?? ""} onChange={(e) => setFormData({ ...formData, agencia: e.target.value })} placeholder="0000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Conta</label><input type="text" value={formData.conta ?? ""} onChange={(e) => setFormData({ ...formData, conta: e.target.value })} placeholder="00000-0" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Tipo Conta</label><select value={formData.tipoConta ?? ""} onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]"><option value="">Selecione</option><option value="corrente">Corrente</option><option value="poupanca">Poupança</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Titular</label><input type="text" value={formData.titular ?? ""} onChange={(e) => setFormData({ ...formData, titular: e.target.value })} placeholder="Nome do titular" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Doc. Titular</label><input type="text" value={formData.documentoTitular ?? ""} onChange={(e) => setFormData({ ...formData, documentoTitular: e.target.value })} placeholder="CPF/CNPJ" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Tipo PIX</label><select value={formData.pixTipo ?? ""} onChange={(e) => setFormData({ ...formData, pixTipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]"><option value="">Selecione</option><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="aleatoria">Aleatória</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Chave PIX</label><input type="text" value={formData.pixChave ?? ""} onChange={(e) => setFormData({ ...formData, pixChave: e.target.value })} placeholder="Chave PIX" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                </div>
              </div>
              
              {/* Seção: Hierarquia */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Hierarquia Comercial</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Company</label><select value={selectedRacionalCompany ?? ""} onChange={(e) => handleRacionalCompanyChange(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]"><option value="">Selecione</option>{racionalCompanies.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Franquia</label><select value={selectedFranquia ?? ""} onChange={(e) => handleFranquiaChange(e.target.value ? Number(e.target.value) : null)} disabled={!selectedRacionalCompany} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] disabled:bg-gray-100"><option value="">Selecione</option>{franquias.filter(f => f.racionalCompany_id === selectedRacionalCompany).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Franqueado</label><select value={selectedFranqueado ?? ""} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setSelectedFranqueado(v); setFormData({ ...formData, franqueado_id: v }); }} disabled={!selectedFranquia} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] disabled:bg-gray-100"><option value="">Selecione</option>{franqueados.filter(f => f.franquia_id === selectedFranquia).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
                </div>
              </div>
              
              {/* 🎯 SEÇÃO ONBOARDING PARCEIROS COMERCIAIS */}
              {isParceiro && (
                <div className="border-b pb-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Package size={16} /> Dados do Parceiro Comercial
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Tipo de Parceiro *</label>
                      <select 
                        value={formData.parceiroTipo ?? ""} 
                        onChange={(e) => setFormData({ ...formData, parceiroTipo: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="COMPANY">Company</option>
                        <option value="FRANQUIA">Franquia</option>
                        <option value="FRANQUEADO">Franqueado</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Razão Social / Nome Fantasia</label>
                      <input 
                        type="text" 
                        value={formData.razaoSocial ?? ""} 
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })} 
                        placeholder="Razão social ou nome fantasia" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">CNPJ</label>
                      <input 
                        type="text" 
                        value={formData.cnpj ?? ""} 
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} 
                        placeholder="00.000.000/0000-00" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">Telefone Comercial</label>
                      <input 
                        type="tel" 
                        value={formData.telefoneComercial ?? ""} 
                        onChange={(e) => setFormData({ ...formData, telefoneComercial: e.target.value })} 
                        placeholder="(00) 0000-0000" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">E-mail Corporativo</label>
                      <input 
                        type="email" 
                        value={formData.emailCorporativo ?? ""} 
                        onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })} 
                        placeholder="contato@empresa.com.br" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Nome do Responsável Legal</label>
                      <input 
                        type="text" 
                        value={formData.responsavelLegal ?? ""} 
                        onChange={(e) => setFormData({ ...formData, responsavelLegal: e.target.value })} 
                        placeholder="Nome completo do responsável" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">CPF Responsável</label>
                      <input 
                        type="text" 
                        value={formData.cpfResponsavel ?? ""} 
                        onChange={(e) => setFormData({ ...formData, cpfResponsavel: e.target.value })} 
                        placeholder="000.000.000-00" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">Cargo no Cliente</label>
                      <input 
                        type="text" 
                        value={formData.cargoResponsavel ?? ""} 
                        onChange={(e) => setFormData({ ...formData, cargoResponsavel: e.target.value })} 
                        placeholder="Ex: Diretor, Sócio, Gerente" 
                        className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" 
                      />
                    </div>
                  </div>
                  
                  {/* Documentos Obrigatórios Checklist */}
                  <div className="mt-4 p-3 bg-[#111827] rounded-lg border border-purple-200">
                    <h4 className="text-xs font-semibold text-purple-800 mb-2">📋 Documentos Obrigatórios</h4>
                    <div className="space-y-2">
                      {documentosObrigatorios.map((doc: string) => (
                        <label key={doc} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.documentosEnviados?.includes(doc) || false}
                            onChange={(e) => {
                              const docs = formData.documentosEnviados || [];
                              const newDocs = e.target.checked 
                                ? [...docs, doc] 
                                : docs.filter((d: string) => d !== doc);
                              setFormData({ ...formData, documentosEnviados: newDocs });
                            }}
                            className="rounded border-purple-300 text-purple-600"
                          />
                          <span className="capitalize">{doc.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 🎯 SEÇÃO ONBOARDING COLABORADOR FINQZ */}
              {isColaborador && (
                <div className="border-b pb-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <User size={16} /> Dados do Colaborador
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Tipo de Vínculo *</label>
                      <select 
                        value={formData.vinculoTipo ?? ""} 
                        onChange={(e) => setFormData({ ...formData, vinculoTipo: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="CLT">CLT - Consolidação das Leis do Trabalho</option>
                        <option value="PJ">Pessoa Jurídica (Prestador de Serviços)</option>
                        <option value="ESTAGIO">Estágio</option>
                        <option value="TEMPORARIO">Temporário</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Cargo / Função *</label>
                      <input 
                        type="text" 
                        value={formData.cargo ?? ""} 
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} 
                        placeholder="Ex: Consultor Financeiro, Analista de Crédito" 
                        className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">Departamento</label>
                      <select 
                        value={formData.departamento ?? ""} 
                        onChange={(e) => setFormData({ ...formData, departamento: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]"
                      >
                        <option value="">Selecione</option>
                        <option value="comercial">Comercial</option>
                        <option value="operacional">Operacional</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="ti">Tecnologia da Informação</option>
                        <option value="rh">Recursos Humanos</option>
                        <option value="marketing">Marketing</option>
                        <option value="juridico">Jurídico</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">Salário Proposto</label>
                      <input 
                        type="text" 
                        value={formData.salario ?? ""} 
                        onChange={(e) => setFormData({ ...formData, salario: e.target.value })} 
                        placeholder="R$ 0,00" 
                        className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Formação Acadêmica</label>
                      <select 
                        value={formData.formacao ?? ""} 
                        onChange={(e) => setFormData({ ...formData, formacao: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]"
                      >
                        <option value="">Selecione</option>
                        <option value="ensino_medio">Ensino Médio</option>
                        <option value="ensino_tecnico">Ensino Técnico</option>
                        <option value="superior_incompleto">Superior Incompleto</option>
                        <option value="superior">Superior Completo</option>
                        <option value="pos_graduacao">Pós-graduação</option>
                        <option value="mestrado">Mestrado</option>
                        <option value="doutorado">Doutorado</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Experiência Profissional</label>
                      <textarea 
                        value={formData.experienciaProfissional ?? ""} 
                        onChange={(e) => setFormData({ ...formData, experienciaProfissional: e.target.value })} 
                        placeholder="Descreva suas experiências profissionais anteriores..." 
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Disponibilidade</label>
                      <div className="flex flex-wrap gap-2">
                        {['Manhã', 'Tarde', 'Noite', 'Sabado', 'Domingo'].map((disp) => (
                          <label key={disp} className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={formData.disponibilidade?.includes(disp) || false}
                              onChange={(e) => {
                                const disps = formData.disponibilidade || [];
                                const newDisps = e.target.checked 
                                  ? [...disps, disp] 
                                  : disps.filter((d: string) => d !== disp);
                                setFormData({ ...formData, disponibilidade: newDisps });
                              }}
                              className="rounded border-green-300 text-green-600"
                            />
                            <span>{disp}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Documentos Obrigatórios Checklist */}
                  <div className="mt-4 p-3 bg-[#111827] rounded-lg border border-green-200">
                    <h4 className="text-xs font-semibold text-green-800 mb-2">📋 Documentos Obrigatórios</h4>
                    <div className="space-y-2">
                      {documentosObrigatorios.map((doc: string) => (
                        <label key={doc} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.documentosEnviados?.includes(doc) || false}
                            onChange={(e) => {
                              const docs = formData.documentosEnviados || [];
                              const newDocs = e.target.checked 
                                ? [...docs, doc] 
                                : docs.filter((d: string) => d !== doc);
                              setFormData({ ...formData, documentosEnviados: newDocs });
                            }}
                            className="rounded border-green-300 text-green-600"
                          />
                          <span className="capitalize">{doc.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 🎯 SEÇÃO ASSINATURA DIGITAL */}
              {requerAssinaturaDigital && (
                <div className="border-b pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <FileCheck size={16} /> Assinatura Digital
                  </h3>
                  
                  {/* Status do envelope */}
                  {envelopeStatus && (
                    <div className="mb-4 p-3 bg-[#111827] rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500">Status</span>
                          <p className="font-semibold" style={{ color: getStatusColor(envelopeStatus.status) }}>
                            {getStatusLabel(envelopeStatus.status)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">ID</span>
                          <p className="text-xs font-mono">{envelopeStatus.id}</p>
                        </div>
                      </div>
                      {envelopeStatus.urlAssinatura && (
                        <a 
                          href={envelopeStatus.urlAssinatura} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 block text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          📝 Acessar Assinatura
                        </a>
                      )}
                      
                      {/* 🎯 Botão para confirmar assinatura concluída */}
                      {envelopeStatus.status === 'enviado' && (
                        <button
                          type="button"
                          onClick={handleConfirmarAssinatura}
                          className="mt-3 w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} />
                          ✅ Confirmar Assinatura Concluída
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Seleção de provedor */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-blue-700 mb-2">Selecione o Provedor</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROVEDORES_DISPONIVEIS.map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setSelectedProvider(prov.id as ProvedorAssinatura)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            selectedProvider === prov.id 
                              ? 'border-blue-500 bg-blue-900/20 text-blue-800' 
                              : 'border-[#1f2937] bg-[#111827] text-slate-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-lg">{prov.logo}</span>
                          <span className="block text-xs mt-1">{prov.nome}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Botão de iniciar assinatura */}
                  <button
                    type="button"
                    onClick={handleIniciarAssinatura}
                    disabled={signatureLoading || !formData.email}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                      signatureLoading || !formData.email
                        ? 'bg-gray-300 text-slate-500 cursor-not-allowed'
                        : 'bg-[#000dff] text-white hover:bg-[#000dff]/90'
                    }`}
                  >
                    {signatureLoading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar para Assinatura Digital
                      </>
                    )}
                  </button>
                  
                  {!formData.email && (
                    <p className="text-xs text-amber-600 mt-2 text-center">
                      ⚠️ Cadastre um e-mail para enviar a solicitação de assinatura
                    </p>
                  )}
                </div>
              )}
              
              {/* Motivo Pendência */}
              {formData.etapa_id === "pendencia" && (
                <div className="bg-red-900/20 p-3 rounded-lg border border-red-200">
                  <label className="block text-xs font-medium text-red-700 mb-1">Motivo da Pendência *</label>
                  <select value={formData.pendenciaMotivo ?? ""} onChange={(e) => setFormData({ ...formData, pendenciaMotivo: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm bg-[#111827]">
                    <option value="">Selecione</option>
                    {MOTIVOS_PENDENCIA.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </div>
              )}
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {listarTags().map((tag) => (
                    <button key={tag.id} type="button" onClick={() => { const newTags = formData.tags?.includes(tag.id) ? formData.tags.filter((t: string) => t !== tag.id) : [...(formData.tags || []), tag.id]; setFormData({ ...formData, tags: newTags }); }} className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${formData.tags?.includes(tag.id) ? 'text-white ring-2 ring-offset-1' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`} style={formData.tags?.includes(tag.id) ? { backgroundColor: tag.cor, ringColor: tag.cor } : {}}>
                      {tag.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance e Consultas */}
              <div className="mt-6 pt-6 border-t border-[#1f2937]">
                <h4 className="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
                  <Shield size={16} />
                  Compliance e Consultas
                </h4>
                <div className="space-y-4">
                  {/* Restrição de Crédito */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Restrição de Crédito</p>
                      <p className="text-xs text-slate-500">Consulta SPC/Serasa por CPF/CNPJ</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderCreditStatus()}
                      <button
                        type="button"
                        onClick={handleConsultCredit}
                        className="h-9 px-3 text-xs rounded-lg border border-[#1f2937] bg-[#111827] hover:bg-gray-50 transition-colors"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>

                  {/* Não Perturbe */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Não Perturbe</p>
                      <p className="text-xs text-slate-500">Bloqueio de contato por telefone</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderDoNotCallStatus()}
                      <button
                        type="button"
                        onClick={handleConsultDoNotCall}
                        className="h-9 px-3 text-xs rounded-lg border border-[#1f2937] bg-[#111827] hover:bg-gray-50 transition-colors"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingOportunidade(null); }} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-slate-300 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Drawer - Versão Estável */}
      {openLeadDrawer && selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpenLeadDrawer(false)}
          />

          <div className="w-[480px] h-full bg-[#111827] shadow-2xl overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">OPORTUNIDADE</span>
                <h2 className="text-lg font-semibold">#{selectedLead?.displayId ?? selectedLead?.id ?? '-'}</h2>
              </div>
              <button 
                onClick={() => setOpenLeadDrawer(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Cliente - usa cliente_nome se disponível */}
              <div>
                <span className="text-xs text-slate-500">Cliente</span>
                <p className="font-medium text-white">{selectedLead?.cliente_nome ?? selectedLead?.nome ?? 'Sem nome'}</p>
              </div>
              
              {/* Produto */}
              {(selectedLead?.produto || selectedLead?.produto_id) && (
                <div>
                  <span className="text-xs text-slate-500">Produto</span>
                  <p className="font-medium text-white">
                    {selectedLead?.produto || `Produto #${selectedLead?.produto_id}`}
                  </p>
                </div>
              )}
              
              {/* Responsável */}
              <div>
                <span className="text-xs text-slate-500">Responsável</span>
                <p className="font-medium text-white flex items-center gap-2">
                  <User size={14} />
                  {selectedLead?.responsavel_nome || 'Sem responsável'}
                </p>
              </div>
              
              {/* Valor */}
              <div>
                <span className="text-xs text-slate-500">Valor</span>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {Number(selectedLead?.valor ?? 0).toLocaleString("pt-BR")}
                </p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500">Criação</span>
                  <p className="font-medium text-white flex items-center gap-1">
                    <Clock size={12} />
                    {selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Última alteração</span>
                  <p className="font-medium text-white flex items-center gap-1">
                    <Calendar size={12} />
                    {selectedLead?.updatedAt ? new Date(selectedLead.updatedAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>

              {/* Sem atuação */}
              {(() => {
                const dataReferencia = selectedLead?.updatedAt || selectedLead?.createdAt;
                if (!dataReferencia) return null;
                const now = new Date();
                const data = new Date(dataReferencia);
                const diffTime = now.getTime() - data.getTime();
                const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                let cor = '#22c55e';
                if (dias >= 10) cor = '#ef4444';
                else if (dias >= 5) cor = '#f59e0b';
                return (
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: cor }}>
                    <Timer size={14} />
                    Sem atuação: {dias} {dias === 1 ? 'dia' : 'dias'}
                  </div>
                );
              })()}

              {/* Telefone */}
              {selectedLead?.telefone && (
                <div>
                  <span className="text-xs text-slate-500">Telefone</span>
                  <p className="font-medium text-white">{selectedLead.telefone}</p>
                </div>
              )}

              {/* E-mail */}
              {selectedLead?.email && (
                <div>
                  <span className="text-xs text-slate-500">E-mail</span>
                  <p className="font-medium text-white">{selectedLead.email}</p>
                </div>
              )}

              {/* Tags - máximo 2 + N */}
              {selectedLead?.tags?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getTagsByIds(selectedLead.tags).slice(0, 2).map((tag: any) => (
                      <span
                        key={tag?.id ?? Math.random()}
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag?.cor ?? '#6b7280' }}
                      >
                        {tag?.nome ?? ''}
                      </span>
                    ))}
                    {selectedLead.tags.length > 2 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-slate-300">
                        +{selectedLead.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Responsável */}
              {selectedLead?.responsavel && (
                <div>
                  <span className="text-xs text-slate-500">Responsável</span>
                  <p className="font-medium text-white">{selectedLead.responsavel}</p>
                </div>
              )}

              {/* Gestor */}
              {selectedLead?.gestor && (
                <div>
                  <span className="text-xs text-slate-500">Gestor</span>
                  <p className="font-medium text-white">{selectedLead.gestor}</p>
                </div>
              )}

              {/* Observações */}
              {selectedLead?.observacoes && (
                <div>
                  <span className="text-xs text-slate-500">Observações</span>
                  <p className="font-medium text-white">{selectedLead.observacoes}</p>
                </div>
              )}

              {/* Ações Rápidas */}
              <div className="pt-4 border-t space-y-3">
                <span className="text-xs text-slate-500">Ações Rápidas</span>
                
                {/* Botão Editar - apenas para quem tem permissão */}
                {canEditOportunidade(selectedLead) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenEditFromDrawer(); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#000dff] text-white text-sm rounded-lg hover:bg-[#000dff]/90 border border-[#000dff]"
                  >
                    <Edit2 size={16} />
                    Editar Oportunidade
                  </button>
                )}
                
                <div className="flex gap-2">
                  {selectedLead?.telefone && (
                    <>
                      <a
                        href={`https://wa.me/55${String(selectedLead.telefone).replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 text-green-700 text-sm rounded-lg hover:bg-green-900/20 border border-green-200"
                      >
                        <MessageCircle size={16} />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${String(selectedLead.telefone).replace(/\D/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-900/20 text-blue-700 text-sm rounded-lg hover:bg-blue-900/20 border border-blue-200"
                      >
                        <Phone size={16} />
                        Ligar
                      </a>
                    </>
                  )}
                  {selectedLead?.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-900/20 text-purple-700 text-sm rounded-lg hover:bg-purple-900/20 border border-purple-200"
                    >
                      <Mail size={16} />
                      E-mail
                    </a>
                  )}
                </div>
                
                {/* Botão Abrir Negociação */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenLeadDrawer(false);
                    setShowFullscreenModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#000dff] text-white text-sm rounded-lg hover:bg-[#000dff]/90 border border-[#000dff] mt-2"
                >
                  <FileText size={16} />
                  Abrir negociação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição a partir do Drawer - Formulário completo igual ao criar */}
      {showEditDrawerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEditDrawerModal(false)}
          />
          
          <div className="relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl bg-[#111827] border border-[#1f2937] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937] flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">
                {editingOportunidade ? 'Editar Oportunidade' : 'Nova Oportunidade'}
              </h2>
              <button
                onClick={() => setShowEditDrawerModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Seção: Dados do Cliente */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
                    <input type="text" value={editDrawerData.nome ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, nome: e.target.value })} placeholder="Nome completo" required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                    <select value={editDrawerData.tipoPessoa ?? "CPF"} onChange={(e) => setEditDrawerData({ ...editDrawerData, tipoPessoa: e.target.value as "CPF" | "CNPJ" })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="CPF">Pessoa Física</option>
                      <option value="CNPJ">Pessoa Jurídica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{editDrawerData.tipoPessoa === "CPF" ? "CPF" : "CNPJ"}</label>
                    <input type="text" value={editDrawerData.tipoPessoa === "CPF" ? formatCPFInput(editDrawerData.cpf_cnpj ?? "") : formatCNPJInput(editDrawerData.cpf_cnpj ?? "")} onChange={(e) => setEditDrawerData({ ...editDrawerData, cpf_cnpj: e.target.value.replace(/\D/g, "") })} placeholder={editDrawerData.tipoPessoa === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Celular *</label>
                    <input type="tel" value={editDrawerData.celular ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, celular: formatCell(e.target.value) })} placeholder="(00) 00000-0000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                    <input type="tel" value={editDrawerData.telefone ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, telefone: formatCell(e.target.value) })} placeholder="(00) 0000-0000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                    <input type="email" value={editDrawerData.email ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, email: e.target.value })} placeholder="email@exemplo.com" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  {editDrawerData.tipoPessoa === "CPF" ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data Nascimento</label>
                      <input type="date" value={editDrawerData.data_nascimento ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, data_nascimento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data Abertura</label>
                      <input type="date" value={editDrawerData.data_abertura ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, data_abertura: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Profissão</label>
                    <input type="text" value={editDrawerData.profissao ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, profissao: e.target.value })} placeholder="Profissão" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Estado Civil</label>
                    <select value={editDrawerData.estado_civil ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, estado_civil: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao">União Estável</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção: Endereço */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Endereço</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                    <input type="text" value={editDrawerData.cep ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, cep: e.target.value })} placeholder="00000-000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                    <select value={editDrawerData.estado ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, estado: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                    <input type="text" value={editDrawerData.cidade ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, cidade: e.target.value })} placeholder="Cidade" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Endereço</label>
                    <input type="text" value={editDrawerData.rua ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, rua: e.target.value })} placeholder="Rua, Avenida, etc." className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                    <input type="text" value={editDrawerData.numero ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, numero: e.target.value })} placeholder="Número" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label>
                    <input type="text" value={editDrawerData.complemento ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, complemento: e.target.value })} placeholder="Complemento" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                    <input type="text" value={editDrawerData.bairro ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, bairro: e.target.value })} placeholder="Bairro" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                </div>
              </div>

              {/* Seção: Dados da Oportunidade */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados da Oportunidade</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Produto *</label>
                    <select value={editDrawerData.produto ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, produto: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione um produto</option>
                      {safeProdutos.map((produto) => (
                        <option key={produto.id} value={produto.nome}>
                          {produto.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Etapa *</label>
                    <select value={editDrawerData.etapa_id && OFICIAL_ETAPAS.some(e => e.key === editDrawerData.etapa_id) ? editDrawerData.etapa_id : "novo_lead"} onChange={(e) => setEditDrawerData({ ...editDrawerData, etapa_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      {OFICIAL_ETAPAS.map((etapa) => (
                        <option key={etapa.key} value={etapa.key}>
                          {etapa.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
                    <input type="number" value={editDrawerData.valor ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, valor: parseFloat(e.target.value) || 0 })} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
                    <select value={editDrawerData.responsavel_id ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, responsavel_id: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione um responsável</option>
                      {availableResponsibles.map((usuario: any) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nome} {usuario.perfil ? `(${usuario.perfil})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
                    <textarea value={editDrawerData.observacoes ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, observacoes: e.target.value })} placeholder="Observações..." rows={3} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827] resize-none" />
                  </div>
                </div>
              </div>

              {/* Seção: Dados Bancários */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados Bancários</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Banco</label>
                    <input type="text" value={editDrawerData.banco ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, banco: e.target.value })} placeholder="Banco" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Agência</label>
                    <input type="text" value={editDrawerData.agencia ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, agencia: e.target.value })} placeholder="Agência" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Conta</label>
                    <input type="text" value={editDrawerData.conta ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, conta: e.target.value })} placeholder="Conta" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Conta</label>
                    <select value={editDrawerData.tipoConta ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, tipoConta: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione</option>
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Titular</label>
                    <input type="text" value={editDrawerData.titular ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, titular: e.target.value })} placeholder="Titular" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Doc. do Titular</label>
                    <input type="text" value={editDrawerData.documentoTitular ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, documentoTitular: e.target.value })} placeholder="CPF do titular" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Chave PIX</label>
                    <select value={editDrawerData.pixTipo ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, pixTipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Chave PIX</label>
                    <input type="text" value={editDrawerData.pixChave ?? ""} onChange={(e) => setEditDrawerData({ ...editDrawerData, pixChave: e.target.value })} placeholder="Chave PIX" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {listarTags().map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const newTags = editDrawerData.tags?.includes(tag.id)
                          ? editDrawerData.tags.filter((t: string) => t !== tag.id)
                          : [...(editDrawerData.tags || []), tag.id];
                        setEditDrawerData({ ...editDrawerData, tags: newTags });
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                        editDrawerData.tags?.includes(tag.id)
                          ? "text-white"
                          : "bg-gray-100 text-slate-600"
                      }`}
                      style={editDrawerData.tags?.includes(tag.id) ? { backgroundColor: tag.cor } : {}}
                    >
                      {tag.nome}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditDrawerModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-slate-300 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingOportunidade) {
                      handleSaveEditFromDrawer();
                    } else {
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#000dff] text-white hover:bg-[#000dff]/90 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fullscreen de Detalhes da Negociação */}
      {showFullscreenModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 overflow-hidden">
          <div className="bg-[#111827] border-b border-[#1f2937] px-6 py-4 shadow-sm flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowFullscreenModal(false)} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-white hover:bg-gray-100 rounded-lg text-sm font-medium"><ArrowLeft size={18} />Voltar ao Kanban</button>
                  <span className="text-slate-300">|</span>
                  <div><span className="text-xs text-slate-500 uppercase">Oportunidade</span><h1 className="text-xl font-bold text-white">#{selectedLead?.displayId ?? selectedLead?.id ?? '---'}</h1></div>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex-1 min-w-[140px]"><span className="text-xs text-slate-500 uppercase">Cliente</span><p className="font-semibold text-white">{selectedLead?.cliente_nome ?? selectedLead?.nome ?? 'Sem cliente'}</p></div>
                <div className="flex-1 min-w-[140px]"><span className="text-xs text-slate-500 uppercase">Produto</span><p className="font-semibold text-white">{selectedLead?.produto || 'Não selecionado'}</p></div>
                <div className="flex-1 min-w-[140px]"><span className="text-xs text-slate-500 uppercase">Etapa</span><p className="font-semibold text-white">{selectedLead?.etapa_id ?? selectedLead?.etapa ?? 'Novo Lead'}</p></div>
                <div className="flex-1 min-w-[140px]"><span className="text-xs text-slate-500 uppercase">Responsável</span><p className="font-semibold text-white">{selectedLead?.responsavel_nome || 'Sem responsável'}</p></div>
                <div className="flex-1 min-w-[140px]"><span className="text-xs text-slate-500 uppercase">Valor</span><p className="font-bold text-xl text-[#000dff]">R$ {Number(selectedLead?.valor ?? 0).toLocaleString("pt-BR")}</p></div>
              </div>
              {/* Observações da Pendência no header */}
              {(selectedLead?.etapa_id === 'pendencia' || selectedLead?.etapa === 'pendencia') && selectedLead?.observacoes && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs text-amber-700 uppercase font-medium">Observações da Pendência</span>
                  <p className="text-sm text-amber-900 mt-1">{selectedLead.observacoes}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-[#111827] rounded-xl border border-[#1f2937] shadow-sm">
                    <div className="border-b border-[#1f2937] px-4">
                      <div className="flex gap-1">
                        {[{ id: 'tarefas', label: 'Tarefas', icon: Check }, { id: 'anotacoes', label: 'Anotações', icon: FileText }, { id: 'simulador', label: 'Simulador', icon: Calculator }, { id: 'tags', label: 'Tags', icon: Tag }, { id: 'anexos', label: 'Anexos', icon: Paperclip }, { id: 'historico', label: 'Histórico', icon: History }].map((tab) => (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${activeTab === tab.id ? 'border-[#000dff] text-[#000dff]' : 'border-transparent text-slate-500'}`}><tab.icon size={16} />{tab.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="p-5">
                      {activeTab === 'tarefas' && (
                        <div className="space-y-4">
                          <div className="flex justify-between"><h4 className="font-semibold">Tarefas</h4><button className="px-3 py-1.5 bg-[#000dff] text-white text-sm rounded-lg"><Plus size={14} />Nova tarefa</button></div>
                          {[{ tipo: 'Ligação', responsavel: 'Aires Fernandes', data: '24/04/2026 10:00', status: 'Pendente' }, { tipo: 'Enviar proposta', responsavel: 'Comercial', data: '25/04/2026 14:30', status: 'Agendada' }, { tipo: 'Follow-up', responsavel: 'Aires Fernandes', data: '26/04/2026 09:00', status: 'Concluída' }].map((t, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"><GripVertical size={16} className="text-slate-400" /><div className="flex-1"><div className="flex items-center gap-2"><span className="font-medium">{t.tipo}</span><span className={`px-2 py-0.5 text-xs rounded-full ${t.status === 'Concluída' ? 'bg-green-900/20 text-green-700' : t.status === 'Agendada' ? 'bg-blue-900/20 text-blue-700' : 'bg-yellow-900/20 text-yellow-700'}`}>{t.status}</span></div><div className="text-xs text-slate-500 mt-1"><User size={12} /> {t.responsavel} • <Clock size={12} /> {t.data}</div></div><button className="p-1.5"><MoreVertical size={14} /></button></div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'anotacoes' && (
                        <div className="space-y-4">
                          <div className="flex justify-between"><h4 className="font-semibold">Anotações</h4><button className="px-3 py-1.5 bg-[#000dff] text-white text-sm rounded-lg"><Plus size={14} />Adicionar</button></div>
                          <textarea 
                            placeholder="Digite uma anotação..." 
                            className="w-full p-2 border rounded-lg text-sm" 
                            rows={3} 
                            defaultValue={selectedLead?.observacoes || ''}
                          />
                          <div className="flex justify-end"><button className="px-3 py-1.5 bg-[#000dff] text-white text-sm rounded-lg"><Send size={14} />Salvar</button></div>
                          {selectedLead?.observacoes ? (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-sm">Anotação</span>
                                <span className="text-xs text-slate-500">{selectedLead?.updatedAt ? new Date(selectedLead.updatedAt).toLocaleString('pt-BR') : '-'}</span>
                              </div>
                              <p className="text-sm">{selectedLead.observacoes}</p>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-400">
                              <FileText size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nenhuma anotação registrada</p>
                            </div>
                          )}
                        </div>
                      )}
                      {activeTab === 'simulador' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Simulador Financeiro</h4>
                          
                          {/* Produto atual */}
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <span className="text-xs text-slate-500 uppercase font-medium">Produto da Oportunidade</span>
                            <p className="font-semibold text-white">{selectedLead?.produto || 'Não definido'}</p>
                          </div>

                          {/* Layout em 2 colunas: Entrada e Resultado */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Coluna Esquerda - Entrada */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b">
                                <Calculator size={18} className="text-slate-600" />
                                <span className="font-medium text-slate-300">Entrada</span>
                              </div>

                              {/* Tipo de Simulação */}
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Simulação</label>
                                <select 
                                  className="w-full p-2.5 border rounded-lg text-sm bg-[#111827]"
                                  value={tipoSimulacao}
                                  onChange={(e) => { setTipoSimulacao(e.target.value); setSimulacaoCalculada(false); }}
                                >
                                  <option value="">Selecione...</option>
                                  <option value="emprestimo-garantia">Empréstimo com Garantia</option>
                                  <option value="consignado">Consignado</option>
                                  <option value="fgts">FGTS</option>
                                  <option value="clt">CLT</option>
                                  <option value="emprestimo-pessoal">Empréstimo Pessoal</option>
                                </select>
                                {tipoSimulacao && (
                                  <>
                                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                      <CheckCircle size={14} />
                                      Simulação para: {tipoSimulacao.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 italic">
                                      {getHelperText(tipoSimulacao)}
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* Campos de entrada - Dinâmicos por tipo */}
                              <div className="space-y-3">
                                {/* Empréstimo com Garantia (Refinanciamento de Auto) */}
                                {tipoSimulacao === 'emprestimo-garantia' && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Valor do Veículo (R$)</label>
                                      <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.valorVeiculo || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, valorVeiculo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    
                                    {/* Veículo quitado - Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                      <span className="text-sm font-medium text-slate-300">Veículo quitado?</span>
                                      <button
                                        type="button"
                                        onClick={() => setSimuladorCampos({...simuladorCampos, veiculoQuitado: !simuladorCampos.veiculoQuitado, saldoDevedor: simuladorCampos.veiculoQuitado ? 0 : simuladorCampos.saldoDevedor})}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simuladorCampos.veiculoQuitado ? 'bg-green-600' : 'bg-gray-300'}`}
                                      >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-[#111827] transition-transform ${simuladorCampos.veiculoQuitado ? 'translate-x-6' : 'translate-x-1'}`} />
                                      </button>
                                    </div>
                                    
                                    {/* Saldo devedor - apenas se não estiver quitado */}
                                    {!simuladorCampos.veiculoQuitado && (
                                      <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Saldo Devedor (R$)</label>
                                        <div className="relative">
                                          <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                          <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.saldoDevedor || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, saldoDevedor: parseFloat(e.target.value) || 0})} />
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Percentual Financiável (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="80" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.percentualFinanciavel || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, percentualFinanciavel: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Taxa ao Mês (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="2,5" step="0.01" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.taxaMes || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, taxaMes: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Prazo (meses)</label>
                                      <div className="relative">
                                        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="24" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.prazo || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, prazo: parseInt(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Renda Mensal (R$)</label>
                                      <div className="relative">
                                        <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.rendaMensal || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, rendaMensal: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Consignado */}
                                {tipoSimulacao === 'consignado' && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Subproduto *</label>
                                      <div className="relative">
                                        <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select 
                                          className="w-full pl-9 p-2.5 border rounded-lg text-sm bg-[#111827]"
                                          value={subprodutoConsignado}
                                          onChange={(e) => setSubprodutoConsignado(e.target.value)}
                                        >
                                          <option value="">Selecione...</option>
                                          {SUBPRODUTOS_CONSIGNADO.map((sp) => (
                                            <option key={sp.key} value={sp.key}>{sp.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Renda Líquida Mensal (R$) *</label>
                                      <div className="relative">
                                        <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={rendaLiquidaMensal || ''} onChange={(e) => setRendaLiquidaMensal(parseFloat(e.target.value) || 0)} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Prazo (meses) *</label>
                                      <div className="relative">
                                        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="48" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={prazoConsignado || ''} onChange={(e) => setPrazoConsignado(parseInt(e.target.value) || 0)} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Taxa Mensal (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="1,8" step="0.01" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={taxaMensalConsignado || ''} onChange={(e) => setTaxaMensalConsignado(parseFloat(e.target.value) || 0)} />
                                      </div>
                                    </div>
                                    {/* Texto informativo sobre margem */}
                                    <div className="col-span-2 p-3 bg-blue-900/20 border border-blue-200 rounded-lg">
                                      <p className="text-xs text-blue-700">
                                        💡 A margem pode ser consultada pelo Meu INSS ou SouGov, conforme o vínculo do cliente.
                                      </p>
                                    </div>
                                  </>
                                )}

                                {/* FGTS */}
                                {tipoSimulacao === 'fgts' && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Saldo FGTS (R$)</label>
                                      <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.saldoFGTS || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, saldoFGTS: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Anos Antecipados</label>
                                      <div className="relative">
                                        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="2" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.parcelasAntecipadas || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, parcelasAntecipadas: parseInt(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Taxa ao Mês (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,9" step="0.01" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.taxaMes || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, taxaMes: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* CLT */}
                                {tipoSimulacao === 'clt' && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Salário Bruto (R$)</label>
                                      <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.salarioBruto || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, salarioBruto: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Margem Permitida (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="35" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.margemPermitida || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, margemPermitida: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Taxa ao Mês (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="2,0" step="0.01" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.taxaMes || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, taxaMes: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Prazo (meses)</label>
                                      <div className="relative">
                                        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="36" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.prazo || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, prazo: parseInt(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Empréstimo Pessoal */}
                                {tipoSimulacao === 'emprestimo-pessoal' && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Valor do Empréstimo (R$)</label>
                                      <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="0,00" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.valorEmprestimoPessoal || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, valorEmprestimoPessoal: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Taxa de Juros ao Mês (%)</label>
                                      <div className="relative">
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="4,5" step="0.01" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.taxaJurosPessoal || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, taxaJurosPessoal: parseFloat(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">Prazo (meses)</label>
                                      <div className="relative">
                                        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" placeholder="24" className="w-full pl-9 p-2.5 border rounded-lg text-sm" value={simuladorCampos.prazoPessoal || ''} onChange={(e) => setSimuladorCampos({...simuladorCampos, prazoPessoal: parseInt(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Botão Calcular */}
                              <button 
                                onClick={() => { setSimulacaoLoading(true); setTimeout(() => { setSimulacaoLoading(false); calcularSimulacao(); }, 800); }}
                                disabled={!tipoSimulacao}
                                className="w-full px-4 py-2.5 bg-[#000dff] text-white text-sm rounded-lg font-medium hover:bg-[#000dff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {simulacaoLoading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Calculando...
                                  </>
                                ) : (
                                  'Calcular simulação'
                                )}
                              </button>
                            </div>

                            {/* Coluna Direita - Resultado */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b">
                                <FileText size={18} className="text-[#000dff]" />
                                <span className="font-semibold text-slate-200">Resultado da Simulação</span>
                              </div>

                              {!tipoSimulacao ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed rounded-xl bg-gray-50">
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Calculator size={32} className="opacity-50" />
                                  </div>
                                  <p className="text-sm text-center px-4 font-medium">Selecione um tipo de simulação para começar</p>
                                  <p className="text-xs text-slate-400 mt-2">Escolha o produto no menu acima</p>
                                </div>
                              ) : !simulacaoCalculada ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed rounded-xl bg-gray-50">
                                  <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                                    <Percent size={32} className="text-blue-400 opacity-70" />
                                  </div>
                                  <p className="text-sm text-center px-4 font-medium">Preencha os dados e clique em</p>
                                  <p className="text-xs font-semibold text-[#000dff] mt-1">"Calcular simulação"</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Card Principal - Parcela (dinâmico) */}
                                  <div className="p-6 bg-gradient-to-br from-[#000dff] via-blue-600 to-blue-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#111827] opacity-10 rounded-full -mr-16 -mt-16"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#111827] opacity-5 rounded-full -ml-12 -mb-12"></div>
                                    <span className="text-xs text-blue-100 uppercase font-semibold tracking-wider">
                                      {tipoSimulacao === 'fgts' ? 'Valor Líquido' : 'Parcela Mensal'}
                                    </span>
                                    <p className="text-4xl font-bold mt-2 tracking-tight">
                                      R$ {(tipoSimulacao === 'fgts' ? (simuladorResultado?.valorLiberado ?? 0) : (simuladorResultado?.parcela ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    {tipoSimulacao !== 'fgts' && (
                                      <p className="text-sm text-blue-100 mt-2 font-medium">em {simuladorResultado?.prazo || 0}x de R$ {(simuladorResultado?.parcela ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    )}
                                    <div className="mt-4 pt-3 border-t border-blue-500/30 flex justify-between text-xs text-blue-100">
                                      <span className="flex items-center gap-1"><Wallet size={12} /> Total: R$ {(simuladorResultado?.custoTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      <span className="flex items-center gap-1"><Percent size={12} /> Taxa: {(simuladorResultado?.taxaMes ?? 0).toFixed(2)}% a.m.</span>
                                    </div>
                                  </div>

                                  {/* Cards secundários - Grid melhorado */}
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Valor Bruto - apenas para Empréstimo com Garantia */}
                                    {tipoSimulacao === 'emprestimo-garantia' && (
                                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 bg-blue-900/200 rounded-full flex items-center justify-center">
                                            <DollarSign size={12} className="text-white" />
                                          </div>
                                          <span className="text-xs text-blue-600 font-medium">Valor Bruto</span>
                                        </div>
                                        <p className="text-lg font-bold text-blue-700">
                                          R$ {(simuladorResultado?.valorBruto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {tipoSimulacao !== 'fgts' && (
                                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 bg-green-900/200 rounded-full flex items-center justify-center">
                                            <CalendarDays size={12} className="text-white" />
                                          </div>
                                          <span className="text-xs text-green-600 font-medium">Parcela Mensal</span>
                                        </div>
                                        <p className="text-lg font-bold text-green-700">
                                          R$ {(simuladorResultado?.parcela ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 bg-emerald-900/200 rounded-full flex items-center justify-center">
                                          <Wallet size={12} className="text-white" />
                                        </div>
                                        <span className="text-xs text-emerald-600 font-medium">
                                          {tipoSimulacao === 'fgts' ? 'Valor Líquido' : 'Valor Liberado'}
                                        </span>
                                      </div>
                                      <p className="text-lg font-bold text-emerald-700">
                                        R$ {(simuladorResultado?.valorLiberado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                                          <Calculator size={12} className="text-white" />
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium">Custo Total</span>
                                      </div>
                                      <p className="text-lg font-bold text-slate-700">
                                        R$ {(simuladorResultado?.custoTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    {/* CET Estimado - apenas para Empréstimo com Garantia e Empréstimo Pessoal */}
                                    {(tipoSimulacao === 'emprestimo-garantia' || tipoSimulacao === 'emprestimo-pessoal') && (
                                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 col-span-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 bg-purple-900/200 rounded-full flex items-center justify-center">
                                            <Percent size={12} className="text-white" />
                                          </div>
                                          <span className="text-xs text-purple-600 font-medium">CET Estimado (Custo Efetivo Total)</span>
                                        </div>
                                        <p className="text-xl font-bold text-purple-700">
                                          {(simuladorResultado?.cetEstimado ?? 0).toFixed(2)}% <span className="text-xs text-purple-500 font-normal">ao mês</span>
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Resultado Específico do Consignado */}
                                  {tipoSimulacao === 'consignado' && resultadoConsignado && simulacaoCalculada && (
                                    <div className="space-y-3 mt-4">
                                      <div className="flex items-center gap-2 pb-2 border-b">
                                        <Calculator size={18} className="text-indigo-600" />
                                        <span className="font-medium text-slate-300">Margens Consignáveis</span>
                                      </div>
                                      
                                      {/* Subproduto selecionado */}
                                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <span className="text-xs text-indigo-600 uppercase font-medium">Subproduto</span>
                                        <p className="font-semibold text-indigo-900">{SUBPRODUTOS_CONSIGNADO.find(s => s.key === resultadoConsignado.subproduto)?.label || resultadoConsignado.subproduto}</p>
                                      </div>
                                      
                                      {/* Grid de margens */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-blue-900/20 border border-blue-200 rounded-lg">
                                          <span className="text-xs text-blue-600 font-medium">Margem Empréstimo (35%)</span>
                                          <p className="text-lg font-bold text-blue-700">R$ {resultadoConsignado.margemEmprestimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-purple-900/20 border border-purple-200 rounded-lg">
                                          <span className="text-xs text-purple-600 font-medium">Margem Cartão RMC (5%)</span>
                                          <p className="text-lg font-bold text-purple-700">R$ {resultadoConsignado.margemRMC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                                          <span className="text-xs text-pink-600 font-medium">Margem Cartão Benefício (5%)</span>
                                          <p className="text-lg font-bold text-pink-700">R$ {resultadoConsignado.margemCartaoBeneficio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-900/20 border border-emerald-200 rounded-lg">
                                          <span className="text-xs text-emerald-600 font-medium">Total Margem Consignável</span>
                                          <p className="text-lg font-bold text-emerald-700">R$ {resultadoConsignado.totalMargemConsignavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                      </div>
                                      
                                      {/* Detalhes do resultado */}
                                      <div className="grid grid-cols-2 gap-3 mt-2">
                                        <div className="p-3 bg-gray-50 border border-[#1f2937] rounded-lg">
                                          <span className="text-xs text-slate-500 font-medium">Margem Disponível</span>
                                          <p className="text-lg font-bold text-slate-300">R$ {resultadoConsignado.margemDisponivelSubproduto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-[#1f2937] rounded-lg">
                                          <span className="text-xs text-slate-500 font-medium">Parcela Estimada</span>
                                          <p className="text-lg font-bold text-slate-300">R$ {resultadoConsignado.parcelaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-[#1f2937] rounded-lg">
                                          <span className="text-xs text-slate-500 font-medium">Valor Liberado Est.</span>
                                          <p className="text-lg font-bold text-slate-300">R$ {resultadoConsignado.valorLiberadoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-[#1f2937] rounded-lg">
                                          <span className="text-xs text-slate-500 font-medium">Custo Total</span>
                                          <p className="text-lg font-bold text-slate-300">R$ {resultadoConsignado.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-[#1f2937] rounded-lg">
                                          <span className="text-xs text-slate-500 font-medium">CET Estimado</span>
                                          <p className="text-lg font-bold text-slate-300">{resultadoConsignado.cetEstimado.toFixed(2)}% a.m.</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-[#1f2937] rounded-lg">
                                          <span className="text-xs text-slate-500 font-medium">Comprometimento</span>
                                          <p className="text-lg font-bold text-slate-300">{resultadoConsignado.comprometimentoRenda.toFixed(1)}%</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Comprometimento de Renda (dinâmico) - Versão melhorada */}
                                  {tipoSimulacao !== 'fgts' && simuladorResultado?.comprometimento !== undefined && (
                                    <div className={`p-4 rounded-xl border ${
                                      simuladorResultado.comprometimento <= 30 ? 'bg-gradient-to-br from-green-50 to-green-100/30 border-green-200' : 
                                      simuladorResultado.comprometimento <= 50 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100/30 border-yellow-200' : 
                                      'bg-gradient-to-br from-red-50 to-red-100/30 border-red-200'
                                    }`}>
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            simuladorResultado.comprometimento <= 30 ? 'bg-green-900/20' : 
                                            simuladorResultado.comprometimento <= 50 ? 'bg-yellow-900/20' : 'bg-red-900/20'
                                          }`}>
                                            <TrendingUp size={16} className={
                                              simuladorResultado.comprometimento <= 30 ? 'text-green-600' : 
                                              simuladorResultado.comprometimento <= 50 ? 'text-yellow-600' : 'text-red-600'
                                            } />
                                          </div>
                                          <span className="text-sm font-medium text-slate-300">Comprometimento de Renda</span>
                                        </div>
                                        <span className={`text-2xl font-bold ${
                                          simuladorResultado.comprometimento <= 30 ? 'text-green-600' : 
                                          simuladorResultado.comprometimento <= 50 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                          {(simuladorResultado.comprometimento || 0).toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            simuladorResultado.comprometimento <= 30 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                                            simuladorResultado.comprometimento <= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                                          }`}
                                          style={{ width: `${Math.min(simuladorResultado.comprometimento || 0, 100)}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between mt-2 text-xs">
                                        <span className="text-green-600 font-medium">0%</span>
                                        <span className="text-yellow-600 font-medium">30%</span>
                                        <span className="text-red-600 font-medium">50%+</span>
                                      </div>
                                      <p className={`text-xs mt-2 font-medium ${
                                        simuladorResultado.comprometimento <= 30 ? 'text-green-700' : 
                                        simuladorResultado.comprometimento <= 50 ? 'text-yellow-700' : 'text-red-700'
                                      }`}>
                                        {simuladorResultado.comprometimento <= 30 ? '✓ Saúde financeira ok - abaixo de 30%' : 
                                         simuladorResultado.comprometimento <= 50 ? '⚠ Atenção necessária - entre 30% e 50%' : '✗ Risco elevado - acima de 50%'}
                                      </p>
                                    </div>
                                  )}

                                  {/* Status - dinâmico por resultado */}
                                  <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${
                                    simuladorResultado?.status === 'valida' ? 'bg-green-900/20 border-green-200' :
                                    simuladorResultado?.status === 'atencao' ? 'bg-yellow-900/20 border-yellow-200' :
                                    simuladorResultado?.status === 'inviavel' ? 'bg-red-900/20 border-red-200' :
                                    'bg-gray-50 border-[#1f2937]'
                                  }`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      simuladorResultado?.status === 'valida' ? 'bg-green-900/20' :
                                      simuladorResultado?.status === 'atencao' ? 'bg-yellow-900/20' :
                                      simuladorResultado?.status === 'inviavel' ? 'bg-red-900/20' : 'bg-gray-100'
                                    }`}>
                                      {simuladorResultado?.status === 'valida' ? (
                                        <CheckCircle size={20} className="text-green-600" />
                                      ) : simuladorResultado?.status === 'atencao' ? (
                                        <AlertCircle size={20} className="text-yellow-600" />
                                      ) : simuladorResultado?.status === 'inviavel' ? (
                                        <XCircle size={20} className="text-red-600" />
                                      ) : (
                                        <Circle size={20} className="text-slate-400" />
                                      )}
                                    </div>
                                    <span className={`text-sm font-semibold ${
                                      simuladorResultado?.status === 'valida' ? 'text-green-700' :
                                      simuladorResultado?.status === 'atencao' ? 'text-yellow-700' :
                                      simuladorResultado?.status === 'inviavel' ? 'text-red-700' : 'text-slate-300'
                                    }`}>
                                      {simuladorResultado?.mensagem || 'Aguardando cálculo...'}
                                    </span>
                                  </div>

                                  {/* Status da Simulação */}
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                                    <span className="text-xs text-slate-500 uppercase">Status:</span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      simulationStatus === 'simulada' ? 'bg-blue-900/20 text-blue-700' :
                                      simulationStatus === 'aceita' ? 'bg-green-900/20 text-green-700' :
                                      simulationStatus === 'recusada' ? 'bg-red-900/20 text-red-700' :
                                      'bg-gray-100 text-slate-500'
                                    }`}>
                                      {simulationStatus === 'simulada' ? 'Simulada' :
                                       simulationStatus === 'aceita' ? 'Aceita pelo cliente' :
                                       simulationStatus === 'recusada' ? 'Recusada pelo cliente' :
                                       'Aguardando'}
                                    </span>
                                    {simulationAcceptedAt && (
                                      <span className="text-xs text-slate-400">
                                        em {new Date(simulationAcceptedAt).toLocaleString('pt-BR')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Botões de Aceite/Recusa */}
                                  {simulacaoCalculada && simuladorResultado && simuladorResultado.status !== 'inviavel' && (
                                    <div className="flex gap-2 pt-2">
                                      <button 
                                        onClick={aceitarSimulacao}
                                        disabled={simulationStatus === 'aceita'}
                                        className="flex-1 px-3 py-2.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle size={14} className="inline mr-1" />
                                        Aceitar simulação
                                      </button>
                                      <button 
                                        onClick={recusarSimulacao}
                                        disabled={simulationStatus === 'recusada'}
                                        className="flex-1 px-3 py-2.5 bg-red-900/20 text-red-700 text-sm rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        <XCircle size={14} className="inline mr-1" />
                                        Recusar
                                      </button>
                                    </div>
                                  )}

                                  {/* Seletor de Fase após Aceite */}
                                  {showFaseSelector && (
                                    <div className="mt-4 p-4 bg-green-900/20 border border-green-200 rounded-lg space-y-3">
                                      <div className="flex items-center gap-2 text-green-800 font-medium">
                                        <CheckCircle size={18} />
                                        Simulação aceita! Escolha a próxima fase:
                                      </div>
                                      <select 
                                        value={novaFaseAposAceite}
                                        onChange={(e) => setNovaFaseAposAceite(e.target.value)}
                                        className="w-full p-2.5 border border-green-300 rounded-lg text-sm bg-[#111827]"
                                      >
                                        <option value="novo_lead">Novo Lead</option>
                                        <option value="negociacao">Negociação</option>
                                        <option value="aguardando_assinatura">Aguardando Assinatura</option>
                                        <option value="pendencia">Pendência</option>
                                        <option value="formalizacao">Formalização</option>
                                        <option value="integrado">Integrado</option>
                                        <option value="perdido">Perdido</option>
                                      </select>
                                      <button 
                                        onClick={confirmarMudancaFase}
                                        className="w-full px-3 py-2.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                      >
                                        <ArrowRight size={14} className="inline mr-1" />
                                        Confirmar e mover para {OFICIAL_ETAPAS.find(e => e.key === novaFaseAposAceite)?.label}
                                      </button>
                                    </div>
                                  )}

                                  {/* Ações - hierarquia */}
                                  <div className="flex gap-2 pt-2">
                                    <button className="flex-1 px-3 py-2.5 bg-[#000dff] text-white text-sm rounded-lg font-medium hover:bg-[#000dff]/90 shadow-sm">
                                      <FileText size={14} className="inline mr-1" />Gerar proposta
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <button className="flex-1 px-3 py-2 bg-gray-100 text-slate-300 text-sm rounded-lg font-medium hover:bg-gray-200">
                                      <Save size={14} className="inline mr-1" />Salvar simulação
                                    </button>
                                    <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700">
                                      <MessageCircle size={14} className="inline mr-1" />WhatsApp
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === 'tags' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {['Novo', 'Quente', 'Follow-up', 'Sem documento', 'Alto valor'].map(t => (
                              <button key={t} className="px-3 py-1.5 bg-gray-100 text-sm rounded-full hover:bg-gray-200 transition-colors">{t}</button>
                            ))}
                          </div>
                          <div className="pt-4 border-t">
                            <span className="text-sm text-slate-500">Aplicadas:</span>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {selectedLead?.tags && selectedLead.tags.length > 0 ? (
                                selectedLead.tags.map((tag, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-blue-900/20 text-blue-700 text-sm rounded-full">{tag}</span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-400">Nenhuma tag aplicada</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4"><button className="px-3 py-1.5 bg-[#000dff] text-white text-sm rounded-lg">Aplicar</button><button className="px-3 py-1.5 bg-gray-100 text-sm rounded-lg">Limpar</button></div>
                        </div>
                      )}
                      {activeTab === 'anexos' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Anexos</h4>
                          
                          <input
                            type="file"
                            multiple
                            onChange={handleUploadAnexo}
                            className="hidden"
                            id="upload-anexo"
                          />
                          
                          <label
                            htmlFor="upload-anexo"
                            className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700"
                          >
                            <Paperclip size={18} />
                            Anexar arquivos
                          </label>

                          {anexos.length === 0 ? (
                            <p className="text-slate-500">Nenhum arquivo anexado.</p>
                          ) : (
                            <div className="space-y-3">
                              {anexos.map((anexo) => (
                                <div key={anexo.id} className="flex items-center justify-between p-4 border rounded-xl">
                                  <div>
                                    <p className="font-medium">{anexo.nome}</p>
                                    <p className="text-sm text-slate-500">
                                      {(anexo.tamanho / 1024).toFixed(1)} KB
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setAnexos((prev) => prev.filter((a) => a.id !== anexo.id))}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remover
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {activeTab === 'historico' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Histórico</h4>
                          <div className="relative"><div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            {[
                              { evento: 'Oportunidade criada', data: selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleString('pt-BR') : '-' },
                              { evento: `Cliente: ${selectedLead?.cliente_nome || selectedLead?.nome || 'Não informado'}`, data: selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleString('pt-BR') : '-' },
                              { evento: `Produto: ${selectedLead?.produto || 'Não informado'}`, data: selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleString('pt-BR') : '-' },
                              { evento: `Valor: R$ ${Number(selectedLead?.valor ?? 0).toLocaleString('pt-BR')}`, data: selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleString('pt-BR') : '-' },
                              { evento: `Responsável: ${selectedLead?.responsavel_nome || 'Não atribuído'}`, data: selectedLead?.updatedAt ? new Date(selectedLead.updatedAt).toLocaleString('pt-BR') : '-' }
                            ].map((e, i) => (
                              <div key={i} className="relative flex gap-4 pb-6"><div className="w-6 h-6 rounded-full bg-[#000dff] border-2 border-white z-10"></div><div><p className="font-medium text-sm">{e.evento}</p><p className="text-xs text-slate-500">{e.data}</p></div></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-[#111827] rounded-xl border p-4"><h4 className="font-semibold mb-3 flex items-center gap-2"><User size={16} className="text-[#000dff]" />Ações rápidas</h4><div className="space-y-2">{selectedLead?.telefone && (<><a href={`https://wa.me/55${String(selectedLead.telefone).replace(/\D/g, "")}`} target="_blank" className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-green-900/20 text-green-700 text-sm rounded-lg"><MessageCircle size={16} />WhatsApp</a><a href={`tel:${String(selectedLead.telefone).replace(/\D/g, "")}`} className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-blue-900/20 text-blue-700 text-sm rounded-lg"><Phone size={16} />Ligar</a></>)}{selectedLead?.email && (<a href={`mailto:${selectedLead.email}`} className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-purple-900/20 text-purple-700 text-sm rounded-lg"><Mail size={16} />E-mail</a>)}{canEditOportunidade(selectedLead) && (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!selectedLead) { alert("Nenhuma oportunidade selecionada para edição."); return; } handleEditClick(selectedLead); }} className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-[#000dff] text-white text-sm rounded-lg"><Edit2 size={16} />Editar</button>)}</div></div>
                  <div className="bg-[#111827] rounded-xl border p-4"><h4 className="font-semibold mb-3 flex items-center gap-2"><FileText size={16} className="text-[#000dff]" />Resumo</h4><div className="space-y-3"><div><span className="text-xs text-slate-500">Valor</span><p className="font-bold text-lg text-[#000dff]">R$ {Number(selectedLead?.valor ?? 0).toLocaleString("pt-BR")}</p></div>{selectedLead?.telefone && (<div><span className="text-xs text-slate-500">Telefone</span><p className="text-sm">{selectedLead.telefone}</p></div>)}{selectedLead?.email && (<div><span className="text-xs text-slate-500">E-mail</span><p className="text-sm">{selectedLead.email}</p></div>)}<div><span className="text-xs text-slate-500">Criação</span><p className="text-sm">{selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString('pt-BR') : '-'}</p></div><div><span className="text-xs text-slate-500">Última</span><p className="text-sm">{selectedLead?.updatedAt ? new Date(selectedLead.updatedAt).toLocaleDateString('pt-BR') : '-'}</p></div></div></div>
                  <div className="bg-[#111827] rounded-xl border p-4"><h4 className="font-semibold mb-3 flex items-center gap-2"><Timer size={16} className="text-[#000dff]" />SLA</h4>{(() => { const d = selectedLead?.updatedAt || selectedLead?.createdAt; const dias = d ? Math.floor((new Date().getTime() - new Date(d).getTime()) / 86400000) : 0; const s = dias <= 4 ? 'Saudável' : dias <= 9 ? 'Atenção' : 'Crítico'; const c = dias <= 4 ? '#22c55e' : dias <= 9 ? '#f59e0b' : '#ef4444'; return (<div className="text-center"><p className="text-3xl font-bold" style={{color:c}}>{dias}</p><p className="text-sm text-slate-600">{dias === 0 ? 'dia' : 'dias'} sem atuação</p><div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{backgroundColor:c+'20',color:c}}><Circle size={8} fill={c} />{s}</div></div>); })()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Se selectedLead for nulo, mostrar mensagem de erro no modal fullscreen */}
      {showFullscreenModal && !selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFullscreenModal(false)}
          />
          <div className="relative bg-[#111827] rounded-xl shadow-2xl p-8 max-w-md text-center">
            <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Nenhuma oportunidade selecionada
            </h2>
            <p className="text-slate-500 mb-6">
              Selecione uma oportunidade no Kanban para ver os detalhes.
            </p>
            <button
              onClick={() => setShowFullscreenModal(false)}
              className="px-6 py-2.5 bg-[#000dff] text-white rounded-lg font-medium hover:bg-[#000dff]/90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Formulário Lateral de Edição de Oportunidade */}
      {showOpportunityForm && (
        <div className="fixed inset-0 z-[99999] bg-black/50 flex justify-end">
          <div className="w-full max-w-2xl h-full bg-[#111827] shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                Editar Oportunidade
              </h2>

              <button
                type="button"
                onClick={() => setShowOpportunityForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            {/* Formulário completo - mesmo usado em Nova Oportunidade */}
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              {/* Seção: Dados do Cliente */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
                    <input type="text" value={formData.nome ?? ""} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome completo" required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                    <select value={formData.tipoPessoa ?? "CPF"} onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value as "CPF" | "CNPJ" })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="CPF">Pessoa Física</option>
                      <option value="CNPJ">Pessoa Jurídica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{formData.tipoPessoa === "CPF" ? "CPF" : "CNPJ"}</label>
                    <input type="text" value={formData.tipoPessoa === "CPF" ? formatCPFInput(formData.cpf_cnpj ?? "") : formatCNPJInput(formData.cpf_cnpj ?? "")} onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value.replace(/\D/g, "") })} placeholder={formData.tipoPessoa === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Celular *</label>
                    <input type="tel" value={formData.celular ?? ""} onChange={(e) => setFormData({ ...formData, celular: formatCell(e.target.value) })} placeholder="(00) 00000-0000" required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                    <input type="tel" value={formData.telefone ?? ""} onChange={(e) => setFormData({ ...formData, telefone: formatCell(e.target.value) })} placeholder="(00) 0000-0000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                    <input type="email" value={formData.email ?? ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  {formData.tipoPessoa === "CPF" ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data Nascimento</label>
                      <input type="date" value={formData.data_nascimento ?? ""} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Data Abertura</label>
                      <input type="date" value={formData.data_abertura ?? ""} onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Seção: Endereço */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Endereço</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">CEP</label><input type="text" value={formData.cep ?? ""} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Rua</label><input type="text" value={formData.rua ?? ""} onChange={(e) => setFormData({ ...formData, rua: e.target.value })} placeholder="Rua" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Número</label><input type="text" value={formData.numero ?? ""} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} placeholder="Nº" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label><input type="text" value={formData.complemento ?? ""} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} placeholder="Complemento" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label><input type="text" value={formData.bairro ?? ""} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} placeholder="Bairro" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label><input type="text" value={formData.cidade ?? ""} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} placeholder="Cidade" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Estado</label><input type="text" value={formData.estado ?? ""} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} placeholder="Estado" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                </div>
              </div>
              
              {/* Seção: Dados do Negócio */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados do Negócio</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Produto *</label>
                    <select value={formData.produto ?? ""} onChange={(e) => setFormData({ ...formData, produto: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      <option value="">Selecione um produto</option>
                      <option value="consignado">Consignado</option>
                      <option value="personalite">Personalité</option>
                      <option value="cartão_beneficio">Cartão Benefício</option>
                      <option value="cartão_consignado">Cartão Consignado</option>
                      <option value="emprestimo_pessoal">Empréstimo Pessoal</option>
                      <option value="seguros">Seguros</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
                    <input type="number" value={formData.valor ?? 0} onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })} placeholder="0,00" required className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Etapa</label>
                    <select value={formData.etapa_id ?? "novo_lead"} onChange={(e) => setFormData({ ...formData, etapa_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]">
                      {OFICIAL_ETAPAS.map((etapa) => (
                        <option key={etapa.key} value={etapa.key}>{etapa.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
                    <textarea value={formData.observacoes ?? ""} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações..." rows={3} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" />
                  </div>
                </div>
              </div>
              
              {/* Seção: Dados Bancários */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados Bancários</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Banco</label><input type="text" value={formData.banco ?? ""} onChange={(e) => setFormData({ ...formData, banco: e.target.value })} placeholder="Banco" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Agência</label><input type="text" value={formData.agencia ?? ""} onChange={(e) => setFormData({ ...formData, agencia: e.target.value })} placeholder="Agência" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Conta</label><input type="text" value={formData.conta ?? ""} onChange={(e) => setFormData({ ...formData, conta: e.target.value })} placeholder="Conta" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Tipo Conta</label><select value={formData.tipoConta ?? ""} onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]"><option value="">Selecione</option><option value="corrente">Conta Corrente</option><option value="poupança">Poupança</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Titular</label><input type="text" value={formData.titular ?? ""} onChange={(e) => setFormData({ ...formData, titular: e.target.value })} placeholder="Titular" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Doc Titular</label><input type="text" value={formData.documentoTitular ?? ""} onChange={(e) => setFormData({ ...formData, documentoTitular: e.target.value })} placeholder="CPF do titular" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                </div>
              </div>
              
              {/* Seção: PIX */}
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">PIX</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Tipo PIX</label><select value={formData.pixTipo ?? ""} onChange={(e) => setFormData({ ...formData, pixTipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]"><option value="">Selecione</option><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="aleatoria">Chave Aleatória</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Chave PIX</label><input type="text" value={formData.pixChave ?? ""} onChange={(e) => setFormData({ ...formData, pixChave: e.target.value })} placeholder="Chave PIX" className="w-full px-3 py-2 rounded-lg border border-[#1f2937] text-sm bg-[#111827]" /></div>
                </div>
              </div>
              
              {/* 🎯 SEÇÃO ONBOARDING PARCEIROS COMERCIAIS (Edit Form) */}
              {isParceiro && (
                <div className="border-b pb-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Package size={16} /> Dados do Parceiro Comercial
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Tipo de Parceiro</label>
                      <select value={formData.parceiroTipo ?? ""} onChange={(e) => setFormData({ ...formData, parceiroTipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]">
                        <option value="">Selecione</option>
                        <option value="COMPANY">Company</option>
                        <option value="FRANQUIA">Franquia</option>
                        <option value="FRANQUEADO">Franqueado</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Razão Social</label>
                      <input type="text" value={formData.razaoSocial ?? ""} onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" />
                    </div>
                    <div><label className="block text-xs font-medium text-purple-700 mb-1">CNPJ</label><input type="text" value={formData.cnpj ?? ""} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" /></div>
                    <div><label className="block text-xs font-medium text-purple-700 mb-1">Tel. Comercial</label><input type="text" value={formData.telefoneComercial ?? ""} onChange={(e) => setFormData({ ...formData, telefoneComercial: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" /></div>
                    <div className="col-span-2"><label className="block text-xs font-medium text-purple-700 mb-1">E-mail Corporativo</label><input type="email" value={formData.emailCorporativo ?? ""} onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" /></div>
                    <div className="col-span-2"><label className="block text-xs font-medium text-purple-700 mb-1">Responsável Legal</label><input type="text" value={formData.responsavelLegal ?? ""} onChange={(e) => setFormData({ ...formData, responsavelLegal: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" /></div>
                    <div><label className="block text-xs font-medium text-purple-700 mb-1">CPF Resp.</label><input type="text" value={formData.cpfResponsavel ?? ""} onChange={(e) => setFormData({ ...formData, cpfResponsavel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" /></div>
                    <div><label className="block text-xs font-medium text-purple-700 mb-1">Cargo</label><input type="text" value={formData.cargoResponsavel ?? ""} onChange={(e) => setFormData({ ...formData, cargoResponsavel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm bg-[#111827]" /></div>
                  </div>
                  <div className="mt-3 p-2 bg-[#111827] rounded border border-purple-200">
                    <span className="text-xs font-semibold text-purple-800">Docs:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {documentosObrigatorios.map((doc: string) => (
                        <label key={doc} className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={formData.documentosEnviados?.includes(doc) || false} onChange={(e) => { const d = formData.documentosEnviados || []; setFormData({ ...formData, documentosEnviados: e.target.checked ? [...d, doc] : d.filter((x: string) => x !== doc) }); }} className="rounded" />
                          <span>{doc.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 🎯 SEÇÃO ONBOARDING COLABORADOR FINQZ (Edit Form) */}
              {isColaborador && (
                <div className="border-b pb-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <User size={16} /> Dados do Colaborador
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Tipo de Vínculo</label>
                      <select value={formData.vinculoTipo ?? ""} onChange={(e) => setFormData({ ...formData, vinculoTipo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]">
                        <option value="">Selecione</option>
                        <option value="CLT">CLT</option>
                        <option value="PJ">Pessoa Jurídica</option>
                        <option value="ESTAGIO">Estágio</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-green-700 mb-1">Cargo</label>
                      <input type="text" value={formData.cargo ?? ""} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]" />
                    </div>
                    <div><label className="block text-xs font-medium text-green-700 mb-1">Departamento</label><select value={formData.departamento ?? ""} onChange={(e) => setFormData({ ...formData, departamento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]"><option value="">Selecione</option><option value="comercial">Comercial</option><option value="operacional">Operacional</option><option value="financeiro">Financeiro</option></select></div>
                    <div><label className="block text-xs font-medium text-green-700 mb-1">Salário</label><input type="text" value={formData.salario ?? ""} onChange={(e) => setFormData({ ...formData, salario: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]" /></div>
                    <div className="col-span-2"><label className="block text-xs font-medium text-green-700 mb-1">Formação</label><select value={formData.formacao ?? ""} onChange={(e) => setFormData({ ...formData, formacao: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]"><option value="">Selecione</option><option value="superior">Superior</option><option value="tecnico">Técnico</option></select></div>
                    <div className="col-span-2"><label className="block text-xs font-medium text-green-700 mb-1">Experiência</label><textarea value={formData.experienciaProfissional ?? ""} onChange={(e) => setFormData({ ...formData, experienciaProfissional: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm bg-[#111827]" /></div>
                  </div>
                </div>
              )}
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {listarTags().map((tag) => (
                    <button key={tag.id} type="button" onClick={() => { const newTags = formData.tags?.includes(tag.id) ? formData.tags.filter((t: string) => t !== tag.id) : [...(formData.tags || []), tag.id]; setFormData({ ...formData, tags: newTags }); }} className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${formData.tags?.includes(tag.id) ? 'text-white ring-2 ring-offset-1' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`} style={formData.tags?.includes(tag.id) ? { backgroundColor: tag.cor, ringColor: tag.cor } : {}}>
                      {tag.nome}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowOpportunityForm(false); }} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-slate-300 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">Salvar alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 COMPONENTE DE ERRO LOCAL - Exibe erro de runtime de forma amigável
const PipelineRuntimeError = ({ error }: { error: any }) => (
  <div className="p-6">
    <div className="bg-[#111827] border border-red-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-red-700">
        Erro ao carregar Pipeline
      </h2>
      <p className="text-sm text-slate-600 mt-2">
        A tela foi protegida contra falha total. Verifique o console para detalhes.
      </p>
      <pre className="mt-4 text-xs bg-gray-50 border rounded-lg p-3 overflow-auto">
        {String(error?.message || error || "Erro desconhecido")}
      </pre>
    </div>
  </div>
);

// 🎯 WRAPPER SEGURO - Captura erros de runtime e exibe UI amigável
const OportunidadesPageSafe = () => {
  try {
    return <OportunidadesPageInner />;
  } catch (error) {
    console.error("[Pipeline/Oportunidades] Runtime crash:", error);
    return <PipelineRuntimeError error={error} />;
  }
};

export default OportunidadesPageSafe;
