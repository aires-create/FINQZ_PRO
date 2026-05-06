// FINQZ PRO - SDR IA Hub Page - Professional SaaS Version
// Centro de controle operacional do SDR IA

import React, { useState, useEffect } from "react";
import {
  Bot,
  Brain,
  Activity,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  MessageSquare,
  RefreshCw,
  Play,
  Pause,
  Edit3,
  Radio,
  ChevronRight,
  Loader2,
  Sparkles,
  FileText,
  Toggle,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  BarChart3,
  Gauge,
  Flame,
  Shield,
  Wifi,
  WifiOff,
  Send,
  RotateCcw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  AlertCircle,
  Lightbulb,
  Megaphone,
  Reply,
  Repeat,
  Rocket,
  ThumbsUp,
  Handshake,
  ShoppingCart,
  Star,
  Percent,
  Calendar,
  ArrowRight,
  Plus,
  Trash2,
  Eye
} from "lucide-react";
import { Button, Card, Badge, Input, Modal, TextArea, Select } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import api from "../api/client";
import { dataService } from "../api/dataService";
import useAppStore from "../store";

// Types
interface SdrMetrics {
  leadsAnalisadosHoje: number;
  leadsQualificados: number;
  taxaInteresse: number;
  conversoesGeradas: number;
  conversoesHoje: number;
  leadsQuentes: number;
  leadsEmRisco: number;
  leadsProximoFechar: number;
  scoreMedio: number;
  melhorHorario: string;
  melhorCampanha: string;
  tendenciaInteresse: 'alta' | 'estavel' | 'baixa';
  variacaoConversao: number;
  objecoes: SdrObjection[];
}

interface SdrObjection {
  tipo: string;
  count: number;
  acaoRecomendada: string;
  script?: string;
}

interface SdrChannelMetrics {
  whatsapp: number;
  sms: number;
  email: number;
}

interface SdrOriginMetrics {
  organic: number;
  paid: number;
  referral: number;
  direct: number;
}

interface SdrProductMetrics {
  finqzPro: number;
  contaCorrente: number;
  produtos: number;
}

interface SdrAnalysis {
  id: number;
  leadNome: string;
  intent: string;
  intentPriority: 'alta' | 'media' | 'baixa';
  confidence: number;
  score: number;
  suggestedResponse: string;
  canal: 'whatsapp' | 'sms' | 'email';
  origem: string;
  produto: string;
  createdAt: string;
}

interface SdrConfig {
  prompt: string;
  tone: 'consultivo' | 'vendedor' | 'tecnico';
  autoMode: boolean;
  assistedResponse: boolean;
  apiConnected: boolean;
  apiLatency: number;
}

interface SdrStatus {
  online: boolean;
  latência: number;
  apiStatus: 'online' | 'offline' | 'degradada';
  uptime: number;
}

interface SdrTemplate {
  id: number;
  nome: string;
  categoria: 'lead_quente' | 'risco' | 'objecao' | 'followup' | 'obrigado' | 'reagendamento';
  conteudo: string;
  ativo: boolean;
  variaveis: string[];
  createdAt: string;
}

// Automation Rules Interfaces
interface SdrAutomationRule {
  id: number;
  nome: string;
  templateId: number;
  ativo: boolean;
  condicoes: RuleCondition[];
  acao: 'atacar' | 'followup' | 'responder' | 'alerta';
  createdAt: string;
}

interface RuleCondition {
  tipo: 'score' | 'intencao' | 'objecao' | 'tempo_sem_resposta' | 'dias_inativo';
  operador: 'maior_que' | 'menor_que' | 'igual' | 'contem' | 'entre';
  valor: string | number | [number, number];
}

interface TemplateHistory {
  id: number;
  templateId: number;
  templateNome: string;
  ruleId?: number;
  ruleNome?: string;
  leadNome: string;
  mensagemEnviada: string;
  data: string;
  status: 'enviada' | 'respondida' | 'falhou';
}

// SDR Agent Interface
interface SdrAgent {
  id: number;
  nome: string;
  objetivo: string;
  tom: 'formal' | 'consultivo' | 'agressivo';
  estrategia: 'venda_rapida' | 'relacionamento' | 'reativacao';
  promptBase: string;
  regrasAtuacao: string;
  templateIds: number[];
  ativo: boolean;
  isDefault: boolean;
  createdAt: string;
}

// Mock templates
const mockTemplates: SdrTemplate[] = [
  {
    id: 1,
    nome: 'Lead Quente - Primeiro Contato',
    categoria: 'lead_quente',
    conteudo: 'Olá {{nome}}! Vi que você demonstrou interesse em {{produto}}. Gostaria de agendar uma conversa rápida de 15 minutos para apresentar as melhores opções para seu negócio? 📞',
    ativo: true,
    variaveis: ['nome', 'produto', 'empresa'],
    createdAt: '2026-04-30T10:00:00'
  },
  {
    id: 2,
    nome: 'Reengajamento - Lead em Risco',
    categoria: 'risco',
    conteudo: 'Olá {{nome}}, percebi que você não respondeu nossa última mensagem. Gostaria de saber se ainda tem interesse em {{produto}}. Posso te ajudar de alguma forma? 😊',
    ativo: true,
    variaveis: ['nome', 'produto', 'dias_sem_contato'],
    createdAt: '2026-04-30T09:00:00'
  },
  {
    id: 3,
    nome: 'Objeção - Preço Alto',
    categoria: 'objecao',
    conteudo: 'Entendo sua preocupação com o investimento, {{nome}}. Nosso {{produto}} oferece ROI de 300% em 6 meses. Posso apresentar uma opção parcelada sem juros que se adapta ao seu orçamento?',
    ativo: true,
    variaveis: ['nome', 'produto', 'preco_atual', 'roi'],
    createdAt: '2026-04-30T08:00:00'
  },
  {
    id: 4,
    nome: 'Follow-up Automático',
    categoria: 'followup',
    conteudo: 'Olá {{nome}}! Só passando para lembrar que nossa oferta especial em {{produto}} termina em {{dias_prazo}}. Não perca essa oportunidade de otimizar seus resultados! 🚀',
    ativo: true,
    variaveis: ['nome', 'produto', 'dias_prazo', 'valor'],
    createdAt: '2026-04-30T07:00:00'
  },
  {
    id: 5,
    nome: 'Obrigado pela Conversa',
    categoria: 'obrigado',
    conteudo: 'Obrigado pela conversa, {{nome}}! Foi um prazer conhecer mais sobre sua empresa. Qualquer dúvida sobre {{produto}}, estou à disposição. Até breve! 👋',
    ativo: true,
    variaveis: ['nome', 'produto', 'proxima_data'],
    createdAt: '2026-04-30T06:00:00'
  },
  {
    id: 6,
    nome: 'Reagendamento',
    categoria: 'reagendamento',
    conteudo: 'Olá {{nome}}, vi que não foi possível conversar ontem. Gostaria de remarcar nossa reunião para outro horário que seja mais conveniente para você?',
    ativo: true,
    variaveis: ['nome', 'data_original', 'hora_original'],
    createdAt: '2026-04-30T05:00:00'
  }
];

// Mock data
const mockMetrics: SdrMetrics = {
  leadsAnalisadosHoje: 47,
  leadsQualificados: 23,
  taxaInteresse: 48.9,
  conversoesGeradas: 12,
  conversoesHoje: 3,
  leadsQuentes: 8,
  leadsEmRisco: 3,
  leadsProximoFechar: 5,
  scoreMedio: 72,
  melhorHorario: "09:00 - 11:00",
  melhorCampanha: "Black Friday",
  tendenciaInteresse: 'alta',
  variacaoConversao: 12.5,
  objecoes: [
    { tipo: "preço alto", count: 12, acaoRecomendada: "aplicar_script_negociacao", script: "Entendo sua preocupação com o investimento. Nosso plano oferece ROI de 300% em 6 meses. Posso apresentar uma opção parcelada sem juros?" },
    { tipo: "preciso pensar", count: 8, acaoRecomendada: "disparar_followup", script: "Sem problemas! Vou te enviar um resumo das principais vantagens para você avaliar. Quando seria um bom momento para conversarmos novamente?" },
    { tipo: "concorrente", count: 6, acaoRecomendada: "enviar_argumento_diferencial", script: "Nossa diferença principal: suporte 24/7, integração nativa com +200 ferramentas e SLA de 99.9% de uptime. Posso fazer um comparativo detalhado?" }
  ]
};

const mockChannelMetrics: SdrChannelMetrics = {
  whatsapp: 32,
  sms: 10,
  email: 5
};

const mockOriginMetrics: SdrOriginMetrics = {
  organic: 18,
  paid: 15,
  referral: 9,
  direct: 5
};

const mockProductMetrics: SdrProductMetrics = {
  finqzPro: 25,
  contaCorrente: 15,
  produtos: 7
};

const mockAnalyses: SdrAnalysis[] = [
  {
    id: 1,
    leadNome: "João Silva",
    intent: "interessado",
    intentPriority: "alta",
    confidence: 0.92,
    score: 85,
    suggestedResponse: "Ótimo! Vamos agendar uma reunião para apresentar nosso produto.",
    canal: "whatsapp",
    origem: "organic",
    produto: "FINQZ PRO",
    createdAt: "2026-04-30T10:30:00"
  },
  {
    id: 2,
    leadNome: "Maria Santos",
    intent: "duvida",
    intentPriority: "media",
    confidence: 0.78,
    score: 65,
    suggestedResponse: "Fico à disposição para esclarecer todas as suas dúvidas sobre o produto.",
    canal: "whatsapp",
    origem: "paid",
    produto: "Conta Corrente",
    createdAt: "2026-04-30T10:15:00"
  },
  {
    id: 3,
    leadNome: "Pedro Costa",
    intent: "preco",
    intentPriority: "alta",
    confidence: 0.88,
    score: 72,
    suggestedResponse: "Temos opções de planos que se adaptam ao seu orçamento. Posso apresentar?",
    canal: "sms",
    origem: "direct",
    produto: "FINQZ PRO",
    createdAt: "2026-04-30T09:45:00"
  },
  {
    id: 4,
    leadNome: "Ana Oliveira",
    intent: "sem_interesse",
    intentPriority: "baixa",
    confidence: 0.95,
    score: 25,
    suggestedResponse: "Agradecemos o contato. Qualquer dúvida, estamos à disposição.",
    canal: "whatsapp",
    origem: "referral",
    produto: "Produtos",
    createdAt: "2026-04-30T09:30:00"
  },
  {
    id: 5,
    leadNome: "Carlos Lima",
    intent: "interessado",
    intentPriority: "alta",
    confidence: 0.91,
    score: 88,
    suggestedResponse: "Perfeito! Vou enviar os detalhes do plano premium para você.",
    canal: "email",
    origem: "organic",
    produto: "FINQZ PRO",
    createdAt: "2026-04-30T09:15:00"
  }
];

const defaultPrompt = `Você é um assistente de vendas (SDR) da FINQZ PRO.
Sua função é analisar mensagens de leads e determinar:

1. **Intenção**: Classifique a intenção do lead:
   - interessado: O lead demonstra interesse no produto/serviço
   - duvida: O lead tem dúvidas que precisam ser esclarecidas
   - preco: O lead está perguntando sobre preço
   - sem_interesse: O lead demonstrou desinteresse
   - quer_humano: O lead quer falar com uma pessoa

2. **Score**: Atribua um score de 0-100 baseado na qualificação

3. **Ação recomendada**: Determine a próxima ação:
   - responder: Responder automaticamente
   - escalar_humano: Escalonar para um humano
   - criar_oportunidade: Criar oportunidade no CRM
   - aguardar: Aguardar mais interação

4. **Resposta sugerida**: Forneça uma resposta adequada à intenção do lead.

Responda em JSON com os campos: intent, score, recommended_action, response_text`;

const toneOptions = [
  { value: 'consultivo', label: 'Consultivo', description: 'Focado em entender necessidades e aconselhar' },
  { value: 'vendedor', label: 'Vendedor', description: 'Focado em fechar negócios e converter' },
  { value: 'tecnico', label: 'Técnico', description: 'Focado em detalhes técnicos e funcionalidades' }
];

export const SdrIaHubPage: React.FC = () => {
  const store = useAppStore();
  const user = store.user;
  
  // States
  const [metrics, setMetrics] = useState<SdrMetrics>(mockMetrics);
  const [channelMetrics, setChannelMetrics] = useState<SdrChannelMetrics>(mockChannelMetrics);
  const [originMetrics, setOriginMetrics] = useState<SdrOriginMetrics>(mockOriginMetrics);
  const [productMetrics, setProductMetrics] = useState<SdrProductMetrics>(mockProductMetrics);
  const [analyses, setAnalyses] = useState<SdrAnalysis[]>(mockAnalyses);
  const [status, setStatus] = useState<SdrStatus>({
    online: true,
    latência: 145,
    apiStatus: 'online',
    uptime: 99.8
  });
  const [config, setConfig] = useState<SdrConfig>({
    prompt: defaultPrompt,
    tone: 'consultivo',
    autoMode: true,
    assistedResponse: true,
    apiConnected: true,
    apiLatency: 145
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'config' | 'intelligence' | 'actions' | 'templates' | 'agentes'>('metrics');
  const [showCreateOppModal, setShowCreateOppModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SdrAnalysis | null>(null);
  const [oppData, setOppData] = useState({
    nome: '',
    telefone: '',
    valor: 0,
    produto: '',
    observacoes: ''
  });
  const [isCreatingOpp, setIsCreatingOpp] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [insights, setInsights] = useState<{tipo: string; mensagem: string; icone: string}[]>([
    { tipo: 'tendencia', mensagem: 'IA detectou aumento de 23% no interesse por FINQZ PRO', icone: 'TrendingUp' },
    { tipo: 'campanha', mensagem: 'Campanha "Black Friday" tem melhor performance hoje', icone: 'Megaphone' },
    { tipo: 'conversao', mensagem: 'Probabilidade de conversão subiu 15% esta semana', icone: 'Percent' },
    { tipo: 'sugestao', mensagem: 'Recomendação: Foque em leads com score acima de 75', icone: 'Lightbulb' }
  ]);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [selectedObjection, setSelectedObjection] = useState<SdrObjection | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Template states
  const [templates, setTemplates] = useState<SdrTemplate[]>(mockTemplates);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SdrTemplate | null>(null);
  
  // Automation Rules states
  const [automationRules, setAutomationRules] = useState<SdrAutomationRule[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<SdrAutomationRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    nome: '',
    templateId: 0,
    ativo: true,
    acao: 'atacar' as SdrAutomationRule['acao'],
    condicoes: [] as RuleCondition[]
  });

  // Template History state
  const [templateHistory, setTemplateHistory] = useState<TemplateHistory[]>([]);

  // Agents state
  const [agents, setAgents] = useState<SdrAgent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SdrAgent | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [hybridAiEnabled, setHybridAiEnabled] = useState(true);
  const [agentForm, setAgentForm] = useState({
    nome: '',
    objetivo: '',
    tom: 'consultivo' as SdrAgent['tom'],
    estrategia: 'relacionamento' as SdrAgent['estrategia'],
    promptBase: '',
    regrasAtuacao: '',
    templateIds: [] as number[],
    ativo: true
  });

  const [templateForm, setTemplateForm] = useState({
    nome: '',
    categoria: 'lead_quente' as SdrTemplate['categoria'],
    conteudo: '',
    ativo: true
  });
  const [previewData, setPreviewData] = useState({
    nome: 'João Silva',
    produto: 'FINQZ PRO',
    empresa: 'Empresa Exemplo',
    dias_sem_contato: '3',
    preco_atual: 'R$ 997',
    roi: '300%',
    dias_prazo: '5',
    valor: 'R$ 797',
    proxima_data: '15/05',
    data_original: '30/04',
    hora_original: '14:00',
    template: null as SdrTemplate | null,
    leadNome: ''
  });
  const [filterCategoria, setFilterCategoria] = useState<string>('all');

  // Load metrics from API
  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/sdr/metrics");
      if (response.data.success) {
        setMetrics(response.data.metrics);
        setChannelMetrics(response.data.channelMetrics);
        setOriginMetrics(response.data.originMetrics);
        setProductMetrics(response.data.productMetrics);
      }
    } catch (error) {
      console.log("[SDR] Using mock metrics");
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent analyses
  const loadAnalyses = async () => {
    try {
      const response = await api.get("/api/sdr/analyses/recent");
      if (response.data.success) {
        setAnalyses(response.data.analyses);
      }
    } catch (error) {
      console.log("[SDR] Using mock analyses");
    }
  };

  // Check API status
  const checkApiStatus = async () => {
    try {
      const start = Date.now();
      await api.get("/api/sdr/status");
      const latency = Date.now() - start;
      setStatus(prev => ({
        ...prev,
        online: true,
        apiStatus: 'online',
        latência: latency,
        uptime: 99.8 + Math.random() * 0.2
      }));
      setConfig(prev => ({ ...prev, apiConnected: true, apiLatency: latency }));
    } catch (error) {
      setStatus(prev => ({ ...prev, online: false, apiStatus: 'offline' }));
      setConfig(prev => ({ ...prev, apiConnected: false }));
    }
  };

  // Test IA
  const handleTestIa = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await api.post("/api/sdr/test", {
        testMessage: "Olá, tenho interesse no produto, qual o preço?"
      });
      
      if (response.data.success) {
        setTestResult(JSON.stringify(response.data.result, null, 2));
      } else {
        setTestResult("Erro: " + response.data.error);
      }
    } catch (error: any) {
      setTestResult("Erro ao testar: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsTesting(false);
    }
  };

  // Force analysis
  const handleForceAnalysis = async () => {
    setIsLoading(true);
    try {
      await api.post("/api/sdr/force-analysis");
      await loadMetrics();
      await loadAnalyses();
    } catch (error) {
      console.error("[SDR] Force analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reprocess leads
  const handleReprocessLeads = async () => {
    setIsLoading(true);
    try {
      await api.post("/api/sdr/reprocess");
      await loadMetrics();
      await loadAnalyses();
    } catch (error) {
      console.error("[SDR] Reprocess error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Attack hot leads
  const handleAttackHotLeads = async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      await api.post("/api/sdr/attack-hot-leads");
      setActionFeedback('Leads quentes atacados com sucesso!');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (error) {
      console.error("[SDR] Attack hot leads error:", error);
      setActionFeedback('Erro ao atacar leads. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate responses
  const handleGenerateResponses = async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      await api.post("/api/sdr/generate-responses");
      setActionFeedback('Respostas geradas para todos os leads pendentes!');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (error) {
      console.error("[SDR] Generate responses error:", error);
      setActionFeedback('Erro ao gerar respostas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle objection action
  const handleObjectionAction = (objection: SdrObjection) => {
    setSelectedObjection(objection);
    setShowObjectionModal(true);
  };

  // Execute objection action
  const executeObjectionAction = async () => {
    if (!selectedObjection) return;
    setIsLoading(true);
    try {
      await api.post("/api/sdr/objection-action", {
        tipo: selectedObjection.tipo,
        acao: selectedObjection.acaoRecomendada
      });
      setShowObjectionModal(false);
      setActionFeedback(`Ação executada: ${selectedObjection.acaoRecomendada.replace('_', ' ')}`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (error) {
      console.error("[SDR] Objection action error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Template functions
  const openTemplateModal = (template?: SdrTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        nome: template.nome,
        categoria: template.categoria,
        conteudo: template.conteudo,
        ativo: template.ativo
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        nome: '',
        categoria: 'lead_quente',
        conteudo: '',
        ativo: true
      });
    }
    setShowTemplateModal(true);
  };

  const saveTemplate = async () => {
    try {
      if (editingTemplate) {
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...templateForm }
            : t
        ));
        setActionFeedback('Template atualizado com sucesso!');
      } else {
        const newTemplate: SdrTemplate = {
          id: Date.now(),
          ...templateForm,
          variaveis: templateForm.conteudo.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/[{}]/g, '')) || [],
          createdAt: new Date().toISOString()
        };
        setTemplates(prev => [...prev, newTemplate]);
        setActionFeedback('Template criado com sucesso!');
      }
      setShowTemplateModal(false);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (error) {
      console.error("[SDR] Save template error:", error);
    }
  };

  const toggleTemplate = (id: number) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ativo: !t.ativo } : t
    ));
  };

  const deleteTemplate = (id: number) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setActionFeedback('Template excluído!');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const getPreviewMessage = (content: string) => {
    let preview = content;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return preview;
  };

  const getTemplateCategoryLabel = (categoria: string) => {
    switch (categoria) {
      case 'lead_quente': return 'Lead Quente';
      case 'risco': return 'Em Risco';
      case 'objecao': return 'Objeção';
      case 'followup': return 'Follow-up';
      case 'obrigado': return 'Obrigado';
      case 'reagendamento': return 'Reagendamento';
      default: return categoria;
    }
  };

  // Get Active Agent - returns the default active agent or first active agent
  const getActiveAgent = (): SdrAgent | null => {
    // Try to find default agent that is active
    const defaultAgent = agents.find(a => a.isDefault && a.ativo);
    if (defaultAgent) return defaultAgent;
    
    // Fallback to first active agent
    const firstActive = agents.find(a => a.ativo);
    if (firstActive) return firstActive;
    
    // No active agent found
    return null;
  };

  // Safe version of getActiveAgent - always returns null if no agents
  const getActiveAgentSafe = (): SdrAgent | null => {
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return null;
    }
    return getActiveAgent();
  };

  // Get final prompt with fallback - combines agent prompt with base prompt
  const getFinalPrompt = (basePrompt: string): string => {
    const activeAgent = getActiveAgentSafe();
    if (!activeAgent || !activeAgent.promptBase) {
      return basePrompt;
    }
    return `${activeAgent.promptBase}\n\n${basePrompt}`;
  };

  // Automation Rules Helper Functions
  const getConditionTypeLabel = (tipo: RuleCondition['tipo']) => {
    switch (tipo) {
      case 'score': return 'Score do Lead';
      case 'intencao': return 'Intenção';
      case 'objecao': return 'Objeção';
      case 'tempo_sem_resposta': return 'Tempo sem Resposta';
      case 'dias_inativo': return 'Dias Inativo';
      default: return tipo;
    }
  };

  const getConditionOperatorLabel = (operador: RuleCondition['operador']) => {
    switch (operador) {
      case 'maior_que': return 'Maior que';
      case 'menor_que': return 'Menor que';
      case 'igual': return 'Igual a';
      case 'contem': return 'Contém';
      case 'entre': return 'Entre';
      default: return operador;
    }
  };

  const getActionLabel = (acao: SdrAutomationRule['acao']) => {
    switch (acao) {
      case 'atacar': return 'Atacar Lead';
      case 'followup': return 'Enviar Follow-up';
      case 'responder': return 'Gerar Resposta';
      case 'alerta': return 'Alertar Equipo';
      default: return acao;
    }
  };

  // Agent Helper Functions
  const getAgentTomLabel = (tom?: SdrAgent['tom']) => {
    if (!tom) return 'Não definido';
    switch (tom) {
      case 'formal': return 'Formal';
      case 'consultivo': return 'Consultivo';
      case 'agressivo': return 'Agressivo';
      default: return tom;
    }
  };

  const getAgentEstrategiaLabel = (estrategia?: SdrAgent['estrategia']) => {
    if (!estrategia) return 'Não definido';
    switch (estrategia) {
      case 'venda_rapida': return 'Venda Rápida';
      case 'relacionamento': return 'Relacionamento';
      case 'reativacao': return 'Reativação';
      default: return estrategia;
    }
  };

  const getAgentTomColor = (tom?: SdrAgent['tom']) => {
    if (!tom) return 'bg-slate-700 border-slate-600 text-slate-400';
    switch (tom) {
      case 'formal': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'consultivo': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'agressivo': return 'bg-red-500/20 border-red-500/50 text-red-400';
      default: return 'bg-slate-700 border-slate-600 text-slate-400';
    }
  };

  const getAgentEstrategiaColor = (estrategia?: SdrAgent['estrategia']) => {
    if (!estrategia) return 'bg-slate-700 border-slate-600 text-slate-400';
    switch (estrategia) {
      case 'venda_rapida': return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'relacionamento': return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      case 'reativacao': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default: return 'bg-slate-700 border-slate-600 text-slate-400';
    }
  };

  const evaluateCondition = (condition: RuleCondition, lead: SdrAnalysis): boolean => {
    const leadScore = lead.score;
    const leadIntencao = lead.intencao;
    
    switch (condition.tipo) {
      case 'score':
        if (condition.operador === 'maior_que') return leadScore > Number(condition.valor);
        if (condition.operador === 'menor_que') return leadScore < Number(condition.valor);
        if (condition.operador === 'igual') return leadScore === Number(condition.valor);
        if (condition.operador === 'entre') {
          const [min, max] = condition.valor as [number, number];
          return leadScore >= min && leadScore <= max;
        }
        return false;
      case 'intencao':
        if (condition.operador === 'igual') return leadIntencao === condition.valor;
        if (condition.operador === 'contem') return String(leadIntencao).includes(String(condition.valor));
        return false;
      default:
        return false;
    }
  };

  const findMatchingRule = (lead: SdrAnalysis): SdrAutomationRule | null => {
    return automationRules
      .filter(rule => rule.ativo)
      .find(rule => rule.condicoes.every(cond => evaluateCondition(cond, lead))) || null;
  };

  const getProcessedTemplateMessage = (template: SdrTemplate, variables: Record<string, string>): string => {
    let message = template.conteudo;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return message;
  };

  const applyHybridAI = async (message: string, leadNome: string): Promise<string> => {
    // Simulated AI adaptation - in production, this would call an AI API
    const adaptations = [
      `Olá ${leadNome}! ${message}`,
      `${message} 🤔`,
      `Apenas confirmando: ${message.toLowerCase()}`,
      message.replace(/prezad[oa]/gi, 'oi').replace(/atenciosamente/gi, 'abs')
    ];
    return adaptations[Math.floor(Math.random() * adaptations.length)];
  };

  const getTemplateCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'lead_quente': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'risco': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'objecao': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'followup': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'obrigado': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'reagendamento': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Send follow-up
  const handleSendFollowUp = async () => {
    setIsLoading(true);
    try {
      await api.post("/api/sdr/followup");
    } catch (error) {
      console.error("[SDR] Follow-up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle automation
  const handleToggleAutomation = async () => {
    const newMode = !config.autoMode;
    setConfig(prev => ({ ...prev, autoMode: newMode }));
    
    try {
      await api.post("/api/sdr/config", {
        autoMode: newMode
      });
    } catch (error) {
      console.error("[SDR] Toggle automation error:", error);
      setConfig(prev => ({ ...prev, autoMode: !newMode }));
    }
  };

  // Save prompt
  const handleSavePrompt = async () => {
    try {
      await api.post("/api/sdr/config", {
        prompt: config.prompt,
        tone: config.tone
      });
      setShowConfigModal(false);
    } catch (error) {
      console.error("[SDR] Save prompt error:", error);
    }
  };

  // Get intent color
  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "interessado": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "duvida": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "preco": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "sem_interesse": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-red-500/20 border-red-500/30 text-red-400";
      case "media": return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case "baixa": return "bg-slate-500/20 border-slate-500/30 text-slate-400";
      default: return "bg-slate-500/20 border-slate-500/30 text-slate-400";
    }
  };

  // Get canal icon
  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case "whatsapp": return <MessageCircle className="w-3 h-3" />;
      case "sms": return <Phone className="w-3 h-3" />;
      case "email": return <Mail className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  // Get intent label
  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case "interessado": return "Interessado";
      case "duvida": return "Dúvida";
      case "preco": return "Pergunta sobre Preço";
      case "sem_interesse": return "Sem Interesse";
      case "quer_humano": return "Quer Humano";
      default: return "Indefinido";
    }
  };

  // Open create opportunity modal
  const handleCreateOportunity = (analysis: SdrAnalysis) => {
    setSelectedAnalysis(analysis);
    setOppData({
      nome: analysis.leadNome,
      telefone: '',
      valor: 0,
      produto: analysis.produto,
      observacoes: `Oportunidade criada via SDR IA\nIntenção: ${getIntentLabel(analysis.intent)}\nPrioridade: ${analysis.intentPriority}\nScore: ${analysis.score}\nConfiança: ${Math.round(analysis.confidence * 100)}%\nCanal: ${analysis.canal}\n\nSugestão de resposta:\n${analysis.suggestedResponse}`
    });
    setShowCreateOppModal(true);
  };

  // Submit opportunity creation
  const handleSubmitOportunity = async () => {
    if (!selectedAnalysis) return;
    
    setIsCreatingOpp(true);
    try {
      await dataService.oportunidades.create({
        nome: oppData.nome,
        telefone: oppData.telefone,
        valor: oppData.valor,
        produto: oppData.produto,
        observacoes: oppData.observacoes,
        status: 'novo',
        etapa: 'novo'
      });
      
      setShowCreateOppModal(false);
      setSelectedAnalysis(null);
      setOppData({ nome: '', telefone: '', valor: 0, produto: '', observacoes: '' });
      
      await loadMetrics();
    } catch (error) {
      console.error('[SDR] Create opportunity error:', error);
    } finally {
      setIsCreatingOpp(false);
    }
  };

  // Filter analyses
  const filteredAnalyses = filterPriority === 'all' 
    ? analyses 
    : analyses.filter(a => a.intentPriority === filterPriority);

  useEffect(() => {
    loadMetrics();
    loadAnalyses();
    checkApiStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <PageHeader
        title="SDR IA"
        subtitle="Centro de controle operacional"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
              {status.online ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-slate-300 text-sm">
                {status.latência}ms
              </span>
              <Badge variant={status.apiStatus === 'online' ? 'success' : 'error'}>
                {status.apiStatus === 'online' ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAttackHotLeads}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:opacity-50"
          >
            <Flame className="w-4 h-4" />
            Atacar leads quentes
          </button>
          <button
            onClick={handleSendFollowUp}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#000dff] hover:bg-[#0011cc] text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Enviar follow-up automático
          </button>
          <button
            onClick={handleReprocessLeads}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Reprocessar leads
          </button>
          <button
            onClick={handleGenerateResponses}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Gerar respostas
          </button>
        </div>

        {/* Action Feedback */}
        {actionFeedback && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm">{actionFeedback}</span>
          </div>
        )}

        {/* Status Banner - Professional SaaS */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">SDR IA Ativo</h2>
                  <Badge variant="success" className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/20 text-white border-white/30">
                    Online
                  </Badge>
                </div>
                <p className="text-blue-100">
                  {config.autoMode ? "Modo automático ativado" : "Modo manual"}
                  {config.assistedResponse ? " • Resposta assistida ativada" : ""}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <Flame className="w-5 h-5 text-orange-300" />
                  {metrics.leadsQuentes} 🔥
                </div>
                <div className="text-blue-100 text-sm">Leads Quentes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <AlertTriangle className="w-5 h-5 text-yellow-300" />
                  {metrics.leadsEmRisco} ⚠️
                </div>
                <div className="text-blue-100 text-sm">Leads em Risco</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-green-300" />
                  {metrics.leadsProximoFechar} 💰
                </div>
                <div className="text-blue-100 text-sm">Próximos de Fechar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  {metrics.conversoesHoje}
                </div>
                <div className="text-blue-100 text-sm">Conversões Hoje</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <Gauge className="w-5 h-5 text-purple-300" />
                  {metrics.scoreMedio}%
                </div>
                <div className="text-blue-100 text-sm">Score Médio</div>
              </div>
            </div>
          </div>
          
          {/* Status Row */}
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-200" />
                <span className="text-blue-100">Melhor horário: <strong className="text-white">{metrics.melhorHorario}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-200" />
                <span className="text-blue-100">Uptime: <strong className="text-white">{status.uptime.toFixed(1)}%</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-200">Objeções detectadas:</span>
              <div className="flex gap-2">
                {metrics.objecoes.map((obj, i) => (
                  <button
                    key={i}
                    onClick={() => handleObjectionAction(obj)}
                    className="px-3 py-1.5 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/10 hover:bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/20 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{obj.tipo}</span>
                    <span className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/20 px-1.5 rounded text-[10px]">{obj.count}</span>
                    {obj.tipo === 'preço alto' && <DollarSign className="w-3 h-3 text-green-400" />}
                    {obj.tipo === 'preciso pensar' && <Clock className="w-3 h-3 text-blue-400" />}
                    {obj.tipo === 'concorrente' && <Shield className="w-3 h-3 text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700 pb-2 overflow-x-auto">
          {[
            { id: 'metrics', label: 'Métricas', icon: Activity },
            { id: 'config', label: 'Configuração', icon: Settings },
            { id: 'intelligence', label: 'Inteligência', icon: Brain },
            { id: 'actions', label: 'Ações', icon: Zap },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'agentes', label: 'Agentes', icon: Bot },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics.leadsAnalisadosHoje}</div>
                <div className="text-slate-400 text-sm">Leads analisados hoje</div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics.leadsQualificados}</div>
                <div className="text-slate-400 text-sm">Leads qualificados</div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-2xl font-bold text-purple-400">{metrics.taxaInteresse}%</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics.taxaInteresse}%</div>
                <div className="text-slate-400 text-sm">Taxa de interesse</div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-2xl font-bold text-cyan-400">+{metrics.conversoesHoje}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics.conversoesGeradas}</div>
                <div className="text-slate-400 text-sm">Conversões geradas</div>
              </Card>
            </div>

            {/* Channel Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  Por Canal
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300">WhatsApp</span>
                    </div>
                    <span className="text-white font-bold">{channelMetrics.whatsapp}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">SMS</span>
                    </div>
                    <span className="text-white font-bold">{channelMetrics.sms}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300">Email</span>
                    </div>
                    <span className="text-white font-bold">{channelMetrics.email}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Por Origem
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">Orgânico</span>
                    <span className="text-white font-bold">{originMetrics.organic}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">Pago</span>
                    <span className="text-white font-bold">{originMetrics.paid}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">Indicação</span>
                    <span className="text-white font-bold">{originMetrics.referral}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">Direto</span>
                    <span className="text-white font-bold">{originMetrics.direct}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Por Produto
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">FINQZ PRO</span>
                    <span className="text-white font-bold">{productMetrics.finqzPro}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">Conta Corrente</span>
                    <span className="text-white font-bold">{productMetrics.contaCorrente}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-300">Produtos</span>
                    <span className="text-white font-bold">{productMetrics.produtos}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Dynamic Insights Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Insights Dinâmicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  insight.tipo === 'tendencia' ? 'bg-green-500/20' :
                  insight.tipo === 'campanha' ? 'bg-blue-500/20' :
                  insight.tipo === 'conversao' ? 'bg-purple-500/20' :
                  'bg-yellow-500/20'
                }`}>
                  {insight.tipo === 'tendencia' && <TrendingUp className="w-5 h-5 text-green-400" />}
                  {insight.tipo === 'campanha' && <Megaphone className="w-5 h-5 text-blue-400" />}
                  {insight.tipo === 'conversao' && <Percent className="w-5 h-5 text-purple-400" />}
                  {insight.tipo === 'sugestao' && <Lightbulb className="w-5 h-5 text-yellow-400" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{insight.mensagem}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {insight.tipo === 'tendencia' && 'IA detectou tendência'}
                    {insight.tipo === 'campanha' && 'Melhor campanha do dia'}
                    {insight.tipo === 'conversao' && 'Probabilidade de conversão'}
                    {insight.tipo === 'sugestao' && 'Recomendação estratégica'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analyzed Leads List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Leads Analisados
          </h3>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-4 bg-slate-900/50 text-slate-400 text-sm font-medium">
              <div>Nome</div>
              <div>Score</div>
              <div>Intenção</div>
              <div>Status</div>
              <div>Ação Sugerida</div>
              <div>Prioridade</div>
            </div>
            <div className="divide-y divide-slate-700">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-slate-700/30 transition-colors items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#000dff] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {analysis.leadNome.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-white text-sm">{analysis.leadNome}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            analysis.score >= 75 ? 'bg-green-500' :
                            analysis.score >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${analysis.score}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{analysis.score}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${getIntentColor(analysis.intent)}`}>
                      {getIntentLabel(analysis.intent)}
                    </span>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                      analysis.intentPriority === 'alta' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      analysis.intentPriority === 'media' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {analysis.intentPriority === 'alta' && '🔥'}
                      {analysis.intentPriority === 'media' && '⏳'}
                      {analysis.intentPriority === 'baixa' && '❄️'}
                      {analysis.intentPriority.charAt(0).toUpperCase() + analysis.intentPriority.slice(1)}
                    </span>
                  </div>
                  <div className="text-slate-300 text-sm truncate">
                    {analysis.suggestedResponse.substring(0, 50)}...
                  </div>
                  <div>
                    <button
                      onClick={() => handleCreateOportunity(analysis)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                    >
                      Criar Opp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Templates de Mensagens
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Gerencie os templates usados nas ações automáticas do SDR IA
                </p>
              </div>
              <button
                onClick={() => openTemplateModal()}
                className="flex items-center gap-2 px-4 py-2 bg-[#000dff] hover:bg-[#0011cc] text-white rounded-xl font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                Novo Template
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategoria('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterCategoria === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {['lead_quente', 'risco', 'objecao', 'followup', 'obrigado', 'reagendamento'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterCategoria === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {getTemplateCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates
                .filter(t => filterCategoria === 'all' || t.categoria === filterCategoria)
                .map(template => (
                  <div 
                    key={template.id} 
                    className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${
                      template.ativo 
                        ? 'border-slate-700 hover:border-blue-500/50' 
                        : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">{template.nome}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs border ${getTemplateCategoryColor(template.categoria)}`}>
                          {getTemplateCategoryLabel(template.categoria)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTemplateModal(template)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-slate-300" />
                        </button>
                        <button
                          onClick={() => toggleTemplate(template.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            template.ativo 
                              ? 'bg-green-500/20 hover:bg-green-500/30' 
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {template.ativo 
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <XCircle className="w-4 h-4 text-slate-400" />
                          }
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-3">
                      {template.conteudo}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-1 flex-wrap">
                        {template.variaveis.slice(0, 3).map(v => (
                          <span key={v} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                            {`{{${v}}}`}
                          </span>
                        ))}
                        {template.variaveis.length > 3 && (
                          <span className="text-slate-500">+{template.variaveis.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Variable Reference */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Variáveis Disponíveis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.keys(previewData).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <code className="px-1.5 py-0.5 bg-slate-900 text-blue-400 rounded text-xs">
                      {`{{${key}}}`}
                    </code>
                    <span className="text-slate-500 text-xs">{previewData[key as keyof typeof previewData]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Configurações do SDR IA
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <div>
                    <div className="text-white font-medium">Modo Automático</div>
                    <div className="text-slate-400 text-sm">Analisa mensagens automaticamente</div>
                  </div>
                  <button
                    onClick={handleToggleAutomation}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      config.autoMode ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-full transition-transform ${
                      config.autoMode ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <div>
                    <div className="text-white font-medium">Resposta Assistida</div>
                    <div className="text-slate-400 text-sm">Sugere respostas para o operador</div>
                  </div>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, assistedResponse: !prev.assistedResponse }))}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      config.assistedResponse ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-full transition-transform ${
                      config.assistedResponse ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium">Status da API</div>
                    <Badge variant={config.apiConnected ? "success" : "error"}>
                      {config.apiConnected ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                  <div className="text-slate-400 text-sm flex items-center gap-2">
                    <Radio className={`w-3 h-3 ${config.apiConnected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
                    {config.apiConnected ? `OpenAI API respondendo em ${config.apiLatency}ms` : "Erro de conexão com OpenAI"}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Prompt do Sistema
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                  className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Prompt
                </Button>
              </div>
              
              <div className="mb-4">
                <label className="text-slate-300 text-sm mb-2 block">Tom da Comunicação</label>
                <div className="grid grid-cols-3 gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setConfig(prev => ({ ...prev, tone: tone.value as any }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        config.tone === tone.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-white font-medium text-sm">{tone.label}</div>
                      <div className="text-slate-400 text-xs">{tone.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 max-h-48 overflow-y-auto">
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                  {config.prompt.substring(0, 500)}...
                </pre>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Alterações no prompt podem afetar o comportamento da IA</span>
              </div>
            </Card>
          </div>
        )}

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                Últimas Análises
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todas as prioridades</option>
                  <option value="alta">Alta prioridade</option>
                  <option value="media">Média prioridade</option>
                  <option value="baixa">Baixa prioridade</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAnalyses}
                  className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredAnalyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className={`bg-slate-800/50 border backdrop-blur-sm transition-colors ${
                    analysis.intentPriority === 'alta' 
                      ? 'border-red-500/30 hover:border-red-500/50' 
                      : analysis.intentPriority === 'media'
                      ? 'border-yellow-500/30 hover:border-yellow-500/50'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                          analysis.intentPriority === 'alta' 
                            ? 'bg-[#ef4444]'
                            : analysis.intentPriority === 'media'
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#475569]'
                        }`}>
                          {analysis.leadNome.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{analysis.leadNome}</div>
                          <div className="text-slate-400 text-xs">
                            {new Date(analysis.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getIntentColor(analysis.intent)}`}>
                          {getIntentLabel(analysis.intent)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(analysis.intentPriority)}`}>
                          Prioridade {analysis.intentPriority.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          {getCanalIcon(analysis.canal)}
                          {analysis.canal}
                        </span>
                        <span className="text-slate-400 text-xs">
                          Confiança: {Math.round(analysis.confidence * 100)}%
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                analysis.score >= 70 ? 'bg-green-500' : analysis.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${analysis.score}%` }}
                            />
                          </div>
                          <span className="text-slate-400 text-xs">Score: {analysis.score}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-slate-400 text-xs mb-1">Sugestão de resposta:</div>
                        <div className="text-slate-200 text-sm">{analysis.suggestedResponse}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {analysis.intent === 'interessado' && analysis.score >= 70 && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateOportunity(analysis)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Target className="w-4 h-4 mr-1" />
                          Criar Oportunidade
                        </Button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Automation Rules Section */}
        {activeTab === 'templates' && (
          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Regras de Automação
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Configure quando cada template deve ser automaticamente aplicado
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingRule(null);
                  setRuleForm({ nome: '', templateId: 0, ativo: true, acao: 'atacar', condicoes: [] });
                  setShowRuleModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </div>

            {/* Rules List */}
            {automationRules.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 text-center">
                <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="text-white font-medium mb-2">Nenhuma regra de automação</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Crie regras para automatizar o envio de mensagens baseadas em condições específicas
                </p>
                <Button
                  onClick={() => {
                    setEditingRule(null);
                    setRuleForm({ nome: '', templateId: 0, ativo: true, acao: 'atacar', condicoes: [] });
                    setShowRuleModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {automationRules.map(rule => {
                  const template = templates.find(t => t.id === rule.templateId);
                  return (
                    <div
                      key={rule.id}
                      className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${
                        rule.ativo ? 'border-blue-500/30 hover:border-blue-500/50' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-medium">{rule.nome}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs border ${
                              rule.ativo ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-700 border-slate-600 text-slate-400'
                            }`}>
                              {rule.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs border bg-purple-500/20 border-purple-500/50 text-purple-400">
                              {getActionLabel(rule.acao)}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">
                            Template: <span className="text-white">{template?.nome || 'Não selecionado'}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setRuleForm({
                                nome: rule.nome,
                                templateId: rule.templateId,
                                ativo: rule.ativo,
                                acao: rule.acao,
                                condicoes: rule.condicoes
                              });
                              setShowRuleModal(true);
                            }}
                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAutomationRules(automationRules.map(r => 
                              r.id === rule.id ? { ...r, ativo: !r.ativo } : r
                            ))}
                            className={`p-2 rounded-lg transition-colors ${
                              rule.ativo ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                            }`}
                          >
                            {rule.ativo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setAutomationRules(automationRules.filter(r => r.id !== rule.id))}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* Conditions */}
                      <div className="space-y-2">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Condições</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.condicoes.map((cond, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm border border-slate-600">
                              {getConditionTypeLabel(cond.tipo)} {getConditionOperatorLabel(cond.operador)} {String(cond.valor)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Template History Section */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-400" />
                Histórico de Templates Enviados
              </h3>
              {templateHistory.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400">Nenhum template enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templateHistory.slice(0, 10).map(item => (
                    <div key={item.id} className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{item.leadNome}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 border border-blue-500/50 text-blue-400">
                            {item.templateNome}
                          </span>
                          {item.ruleNome && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 border border-purple-500/50 text-purple-400">
                              Regra: {item.ruleNome}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm truncate mt-1">{item.mensagemEnviada}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.status === 'enviada' ? 'bg-green-500/20 text-green-400' :
                          item.status === 'respondida' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.status === 'enviada' ? 'Enviada' : item.status === 'respondida' ? 'Respondida' : 'Falhou'}
                        </span>
                        <span className="text-slate-500 text-sm">{new Date(item.data).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agentes' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  Agentes SDR IA
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Configure agentes IA com estratégias e comportamentos específicos
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingAgent(null);
                  setAgentForm({
                    nome: '',
                    objetivo: '',
                    tom: 'consultivo',
                    estrategia: 'relacionamento',
                    promptBase: '',
                    regrasAtuacao: '',
                    templateIds: [],
                    ativo: true
                  });
                  setShowAgentModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Agente
              </Button>
            </div>

            {/* Default Agent Info */}
            {agents.find(a => a.isDefault) && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Bot className="w-4 h-4" />
                  <span className="font-medium">Agente Padrão Ativo</span>
                </div>
                <p className="text-slate-300 text-sm">
                  {agents.find(a => a.isDefault)?.nome} está atendendo automaticamente os leads
                </p>
              </div>
            )}

            {/* Agents Grid */}
            {agents.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 text-center">
                <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="text-white font-medium mb-2">Nenhum agente configurado</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Crie agentes IA com diferentes estratégias de venda
                </p>
                <Button
                  onClick={() => {
                    setEditingAgent(null);
                    setAgentForm({
                      nome: '',
                      objetivo: '',
                      tom: 'consultivo',
                      estrategia: 'relacionamento',
                      promptBase: '',
                      regrasAtuacao: '',
                      templateIds: [],
                      ativo: true
                    });
                    setShowAgentModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Agente
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {agents.map(agent => {
                  const linkedTemplates = templates.filter(t => (agent.templateIds || []).includes(t.id));
                  return (
                    <div
                      key={agent.id}
                      className={`bg-slate-800/50 border rounded-xl p-5 transition-all ${
                        agent.ativo 
                          ? 'border-purple-500/30 hover:border-purple-500/50' 
                          : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-semibold">{agent.nome}</h4>
                            {agent.isDefault && (
                              <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-400">
                                Padrão
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs border ${agent.ativo ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                              {agent.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm mb-3">{agent.objetivo}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs border ${getAgentTomColor(agent.tom)}`}>
                              {getAgentTomLabel(agent.tom)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs border ${getAgentEstrategiaColor(agent.estrategia)}`}>
                              {getAgentEstrategiaLabel(agent.estrategia)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingAgent(agent);
                              setAgentForm({
                                nome: agent.nome,
                                objetivo: agent.objetivo,
                                tom: agent.tom,
                                estrategia: agent.estrategia,
                                promptBase: agent?.promptBase || '',
                                regrasAtuacao: agent?.regrasAtuacao || '',
                                templateIds: agent.templateIds || [],
                                ativo: agent.ativo
                              });
                              setShowAgentModal(true);
                            }}
                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAgents(agents.map(a => 
                              a.id === agent.id ? { ...a, ativo: !a.ativo } : a
                            ))}
                            className={`p-2 rounded-lg transition-colors ${
                              agent.ativo ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                            }`}
                          >
                            {agent.ativo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (agent.isDefault) {
                                setActionFeedback('Este agente já é o padrão');
                                return;
                              }
                              setAgents(agents.map(a => ({
                                ...a,
                                isDefault: a.id === agent.id
                              })));
                              setActionFeedback(`${agent.nome} definido como padrão!`);
                              setTimeout(() => setActionFeedback(null), 3000);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              agent.isDefault ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                            }`}
                            title="Definir como padrão"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Linked Templates */}
                      {linkedTemplates.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Templates Vinculados</p>
                          <div className="flex flex-wrap gap-2">
                            {linkedTemplates.map(t => (
                              <span key={t.id} className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs">
                                {t.nome}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prompt Preview */}
                      {agent.promptBase && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Prompt Base</p>
                          <p className="text-slate-400 text-sm line-clamp-2">{agent.promptBase}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Testar IA</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Envie uma mensagem de teste para verificar o funcionamento da IA
                </p>
                <Button
                  onClick={handleTestIa}
                  disabled={isTesting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Teste
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Forçar Análise</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Executa análise em todas as conversas pendentes
                </p>
                <Button
                  onClick={handleForceAnalysis}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Forçar Análise
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Reprocessar Leads</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Reprocessa todos os leads não analisados
                </p>
                <Button
                  onClick={handleReprocessLeads}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reprocessar
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Follow-up Automático</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Envia follow-up para leads qualificados
                </p>
                <Button
                  onClick={handleSendFollowUp}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Follow-up
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Test Result Modal */}
        {testResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Resultado do Teste</h3>
                <button onClick={() => setTestResult(null)}>
                  <XCircle className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>
              <pre className="bg-slate-900 rounded-xl p-4 text-green-400 text-sm font-mono overflow-x-auto">
                {testResult}
              </pre>
            </div>
          </div>
        )}

        {/* Edit Prompt Modal */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title="Editar Prompt do Sistema"
        >
          <div className="space-y-4">
            <TextArea
              value={config.prompt}
              onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
              rows={15}
              className="font-mono text-sm"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSavePrompt}>
                Salvar Prompt
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Opportunity Modal */}
        <Modal
          isOpen={showCreateOppModal}
          onClose={() => setShowCreateOppModal(false)}
          title="Criar Oportunidade no CRM"
        >
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-400">
                <Target className="w-5 h-5" />
                <span className="font-medium">Lead Qualificado!</span>
              </div>
              <p className="text-green-300/70 text-sm mt-1">
                Este lead foi identificado como interessado (score: {selectedAnalysis?.score})
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1">Nome do Lead</label>
              <Input
                value={oppData.nome}
                onChange={(e) => setOppData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1">Telefone</label>
              <Input
                value={oppData.telefone}
                onChange={(e) => setOppData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1">Produto de Interesse</label>
              <Input
                value={oppData.produto}
                onChange={(e) => setOppData(prev => ({ ...prev, produto: e.target.value }))}
                placeholder="Ex: FINQZ PRO, Conta Corrente, etc."
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1">Valor Estimado (R$)</label>
              <Input
                type="number"
                value={oppData.valor}
                onChange={(e) => setOppData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1">Observações</label>
              <TextArea
                value={oppData.observacoes}
                onChange={(e) => setOppData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                placeholder="Observações sobre o lead..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateOppModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitOportunity}
                disabled={isCreatingOpp || !oppData.nome}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreatingOpp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Criar Oportunidade
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Template Modal */}
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title={editingTemplate ? 'Editar Template' : 'Novo Template'}
        >
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Nome do Template</label>
              <Input
                value={templateForm.nome}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Lead Quente - Primeiro Contato"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Categoria</label>
              <Select
                value={templateForm.categoria}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, categoria: e.target.value as SdrTemplate['categoria'] }))}
                options={[
                  { value: 'lead_quente', label: 'Lead Quente' },
                  { value: 'risco', label: 'Em Risco' },
                  { value: 'objecao', label: 'Objeção' },
                  { value: 'followup', label: 'Follow-up' },
                  { value: 'obrigado', label: 'Obrigado' },
                  { value: 'reagendamento', label: 'Reagendamento' }
                ]}
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">
                Conteúdo da Mensagem
                <span className="text-slate-500 text-xs ml-2">(Use {'{{variável}}'} para dynamic values)</span>
              </label>
              <TextArea
                value={templateForm.conteudo}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, conteudo: e.target.value }))}
                placeholder="Olá {{nome}}! Vi que você demonstrou interesse em {{produto}}..."
                rows={5}
              />
            </div>
            
            {/* Preview */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">Preview</span>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {getPreviewMessage(templateForm.conteudo || 'Digite uma mensagem para ver o preview...')}
                </p>
              </div>
            </div>

            {/* Preview Data Editor */}
            <div>
              <button
                onClick={() => {
                  const dataEditor = document.getElementById('preview-data-editor');
                  if (dataEditor) {
                    dataEditor.classList.toggle('hidden');
                  }
                }}
                className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300"
              >
                <Settings className="w-3 h-3" />
                Editar dados do preview
              </button>
              <div id="preview-data-editor" className="hidden mt-2 grid grid-cols-2 gap-2">
                {Object.entries(previewData).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-slate-500 text-xs">{key}</label>
                    <Input
                      value={value}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={templateForm.ativo}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, ativo: e.target.checked }))}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600"
              />
              <label htmlFor="ativo" className="text-slate-300 text-sm">Template ativo</label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplateModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveTemplate}
                disabled={!templateForm.nome || !templateForm.conteudo}
                className="flex-1 bg-[#000dff] hover:bg-[#0011cc]"
              >
                {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Automation Rule Modal */}
        <Modal
          isOpen={showRuleModal}
          onClose={() => setShowRuleModal(false)}
          title={editingRule ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Nome da Regra</label>
              <Input
                value={ruleForm.nome}
                onChange={(e) => setRuleForm({ ...ruleForm, nome: e.target.value })}
                placeholder="Ex: Atacar leads quentes"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Template</label>
              <select
                value={ruleForm.templateId}
                onChange={(e) => setRuleForm({ ...ruleForm, templateId: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={0}>Selecione um template...</option>
                {templates.filter(t => t.ativo).map(template => (
                  <option key={template.id} value={template.id}>{template.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Ação</label>
              <select
                value={ruleForm.acao}
                onChange={(e) => setRuleForm({ ...ruleForm, acao: e.target.value as SdrAutomationRule['acao'] })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="atacar">Atacar Lead</option>
                <option value="followup">Enviar Follow-up</option>
                <option value="responder">Gerar Resposta</option>
                <option value="alerta">Alertar Equipo</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-slate-300 text-sm font-medium">Condições</label>
                <button
                  onClick={() => setRuleForm({
                    ...ruleForm,
                    condicoes: [...ruleForm.condicoes, { tipo: 'score', operador: 'maior_que', valor: 70 }]
                  })}
                  className="text-blue-400 text-sm hover:text-blue-300"
                >
                  + Adicionar Condição
                </button>
              </div>
              <div className="space-y-2">
                {ruleForm.condicoes.map((cond, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-2 flex-wrap">
                    <select
                      value={cond.tipo}
                      onChange={(e) => {
                        const newCondicoes = [...ruleForm.condicoes];
                        newCondicoes[idx] = { ...cond, tipo: e.target.value as RuleCondition['tipo'] };
                        setRuleForm({ ...ruleForm, condicoes: newCondicoes });
                      }}
                      className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="score">Score</option>
                      <option value="intencao">Intenção</option>
                      <option value="objecao">Objeção</option>
                      <option value="tempo_sem_resposta">Tempo sem Resposta</option>
                      <option value="dias_inativo">Dias Inativo</option>
                    </select>
                    <select
                      value={cond.operador}
                      onChange={(e) => {
                        const newCondicoes = [...ruleForm.condicoes];
                        newCondicoes[idx] = { ...cond, operador: e.target.value as RuleCondition['operador'] };
                        setRuleForm({ ...ruleForm, condicoes: newCondicoes });
                      }}
                      className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="maior_que">Maior que</option>
                      <option value="menor_que">Menor que</option>
                      <option value="igual">Igual a</option>
                      <option value="contem">Contém</option>
                      <option value="entre">Entre</option>
                    </select>
                    <input
                      type="text"
                      value={String(cond.valor)}
                      onChange={(e) => {
                        const newCondicoes = [...ruleForm.condicoes];
                        newCondicoes[idx] = { ...cond, valor: e.target.value };
                        setRuleForm({ ...ruleForm, condicoes: newCondicoes });
                      }}
                      placeholder="Valor"
                      className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm w-20"
                    />
                    <button
                      onClick={() => setRuleForm({
                        ...ruleForm,
                        condicoes: ruleForm.condicoes.filter((_, i) => i !== idx)
                      })}
                      className="text-red-400 hover:text-red-300 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ruleAtivo"
                checked={ruleForm.ativo}
                onChange={(e) => setRuleForm({ ...ruleForm, ativo: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600"
              />
              <label htmlFor="ruleAtivo" className="text-slate-300 text-sm">Regra ativa</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!ruleForm.nome || !ruleForm.templateId) {
                    setActionFeedback('Preencha o nome e selecione um template');
                    return;
                  }
                  if (editingRule) {
                    setAutomationRules(automationRules.map(r => 
                      r.id === editingRule.id ? { ...r, ...ruleForm, id: r.id } : r
                    ));
                    setActionFeedback('Regra atualizada!');
                  } else {
                    setAutomationRules([...automationRules, { ...ruleForm, id: Date.now(), createdAt: new Date().toISOString() }]);
                    setActionFeedback('Regra criada!');
                  }
                  setShowRuleModal(false);
                  setTimeout(() => setActionFeedback(null), 3000);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {editingRule ? 'Atualizar' : 'Criar'} Regra
              </Button>
            </div>
          </div>
        </Modal>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Preview da Mensagem"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
              <span className="text-slate-400 text-sm">IA Híbrida</span>
              <button
                onClick={() => setHybridAiEnabled(!hybridAiEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${hybridAiEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 transition-transform ${hybridAiEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-white whitespace-pre-wrap">{previewMessage}</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600"
              >
                Editar
              </Button>
              <Button
                onClick={() => {
                  setShowPreviewModal(false);
                  setActionFeedback('Mensagem enviada com sucesso!');
                  // Add to history
                  if (previewData.template) {
                    setTemplateHistory([{
                      id: Date.now(),
                      templateId: previewData.template.id,
                      templateNome: previewData.template.nome,
                      leadNome: previewData.leadNome,
                      mensagemEnviada: previewMessage,
                      data: new Date().toISOString(),
                      status: 'enviada'
                    }, ...templateHistory]);
                  }
                  setTimeout(() => setActionFeedback(null), 3000);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Agent Modal */}
        <Modal
          isOpen={showAgentModal}
          onClose={() => setShowAgentModal(false)}
          title={editingAgent ? 'Editar Agente' : 'Novo Agente SDR IA'}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Nome do Agente</label>
              <Input
                value={agentForm.nome}
                onChange={(e) => setAgentForm({ ...agentForm, nome: e.target.value })}
                placeholder="Ex: Agente de Vendas Premium"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Objetivo</label>
              <Input
                value={agentForm.objetivo}
                onChange={(e) => setAgentForm({ ...agentForm, objetivo: e.target.value })}
                placeholder="Ex: Converter leads em clientes de alto valor"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Tom de Comunicação</label>
                <select
                  value={agentForm.tom}
                  onChange={(e) => setAgentForm({ ...agentForm, tom: e.target.value as SdrAgent['tom'] })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="formal">Formal</option>
                  <option value="consultivo">Consultivo</option>
                  <option value="agressivo">Agressivo</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Estratégia</label>
                <select
                  value={agentForm.estrategia}
                  onChange={(e) => setAgentForm({ ...agentForm, estrategia: e.target.value as SdrAgent['estrategia'] })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="venda_rapida">Venda Rápida</option>
                  <option value="relacionamento">Relacionamento</option>
                  <option value="reativacao">Reativação</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Prompt Base</label>
              <TextArea
                value={agentForm.promptBase}
                onChange={(e) => setAgentForm({ ...agentForm, promptBase: e.target.value })}
                placeholder="Instruções detalhadas para o agente..."
                rows={4}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Regras de Atuação</label>
              <TextArea
                value={agentForm.regrasAtuacao}
                onChange={(e) => setAgentForm({ ...agentForm, regrasAtuacao: e.target.value })}
                placeholder="Quando agir, quando parar, limites..."
                rows={3}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Templates Vinculados</label>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                {templates.filter(t => t.ativo).map(template => (
                  <label key={template.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-600/50 px-2 rounded">
                    <input
                      type="checkbox"
                      checked={agentForm.templateIds.includes(template.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAgentForm({ ...agentForm, templateIds: [...agentForm.templateIds, template.id] });
                        } else {
                          setAgentForm({ ...agentForm, templateIds: agentForm.templateIds.filter(id => id !== template.id) });
                        }
                      }}
                      className="w-4 h-4 rounded bg-slate-600 border-slate-500"
                    />
                    <span className="text-slate-300 text-sm">{template.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agentAtivo"
                checked={agentForm.ativo}
                onChange={(e) => setAgentForm({ ...agentForm, ativo: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600"
              />
              <label htmlFor="agentAtivo" className="text-slate-300 text-sm">Agente ativo</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowAgentModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!agentForm.nome || !agentForm.objetivo) {
                    setActionFeedback('Preencha o nome e objetivo do agente');
                    return;
                  }
                  if (editingAgent) {
                    setAgents(agents.map(a => 
                      a.id === editingAgent.id ? { ...a, ...agentForm, id: a.id } : a
                    ));
                    setActionFeedback('Agente atualizado!');
                  } else {
                    setAgents([...agents, { ...agentForm, id: Date.now(), isDefault: agents.length === 0, createdAt: new Date().toISOString() }]);
                    setActionFeedback('Agente criado!');
                  }
                  setShowAgentModal(false);
                  setTimeout(() => setActionFeedback(null), 3000);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {editingAgent ? 'Atualizar' : 'Criar'} Agente
              </Button>
            </div>
          </div>
        </Modal>

        {/* Objection Action Modal */}
        <Modal
          isOpen={showObjectionModal}
          onClose={() => setShowObjectionModal(false)}
          title="Ação para Objeção"
        >
          {selectedObjection && (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">{selectedObjection.tipo}</span>
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">
                    {selectedObjection.count} ocorrências
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Ação recomendada: <span className="text-white">{selectedObjection.acaoRecomendada.replace('_', ' ')}</span>
                </p>
                {selectedObjection.script && (
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-slate-300 text-sm mb-2 font-medium">Script sugerido:</p>
                    <p className="text-slate-400 text-sm">{selectedObjection.script}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowObjectionModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={executeObjectionAction}
                  disabled={isLoading}
                  className="flex-1 bg-[#000dff] hover:bg-[#0011cc]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Executar Ação'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default SdrIaHubPage;
