// FINQZ PRO - Estrutura Comercial Page
// - Lista hierárquica expansível (sem Kanban)
// - Filtros funcionais
// - Modal organizado por seções
// - Estrutura completa (API/Integrações/Automações/Financeiro)
// - Importação e Exportação CSV/JSON

import React, { useMemo, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  FileText,
  ChevronRight,
  ChevronDown,
  Building2,
  Package,
  Layers,
  Users,
  Table2,
  DollarSign,
  Percent,
  BadgeCheck,
  BadgeAlert,
  RefreshCw,
  Bot,
  Link2,
  Filter,
  X,
  Check,
  AlertTriangle,
  History,
  Clock,
} from "lucide-react";

import useAppStore from "../store";
import type { EstruturaComercial, EstruturaComercialNivel, FornecedorTipo, HistoricoItem } from "../types";

import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  TextArea,
  Modal,
  Toggle,
  KpiCard,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { FilterDrawer, FilterField } from "../components/layout/FilterDrawer";
import { creditPfCatalog, getActiveProducts } from "../data/catalogRepository";

// Tipos de fornecedor para select
const fornecedorTipos: { value: FornecedorTipo; label: string }[] = [
  { value: "banco", label: "Banco" },
  { value: "promotora", label: "Promotora" },
  { value: "comercializadora", label: "Comercializadora" },
  { value: "seguradora", label: "Seguradora" },
  { value: "administradora_consorcio", label: "Administradora de Consórcio" },
  { value: "fintech", label: "Fintech" },
  { value: "correspondente", label: "Correspondente" },
  { value: "parceiro_operacional", label: "Parceiro Operacional" },
  { value: "outro", label: "Outro" },
];

// Níveis para select
const nivelOptions: { value: EstruturaComercialNivel; label: string }[] = [
  { value: "vertical", label: "Vertical de Negócio" },
  { value: "produto", label: "Produto" },
  { value: "subproduto", label: "Subproduto/Convênio/Modalidade" },
  { value: "fornecedor_originador", label: "Fornecedor/Originador" },
  { value: "tabela_plano_campanha", label: "Tabela Comercial/Plano/Campanha" },
  { value: "condicao_comercial", label: "Condição Comercial" },
];

// Ícones por nível
const getNivelIcon = (nivel: EstruturaComercialNivel) => {
  switch (nivel) {
    case "vertical":
      return <Building2 size={18} className="text-blue-600" />;
    case "produto":
      return <Package size={18} className="text-green-600" />;
    case "subproduto":
      return <Layers size={18} className="text-purple-600" />;
    case "fornecedor_originador":
      return <Users size={18} className="text-orange-600" />;
    case "tabela_plano_campanha":
      return <Table2 size={18} className="text-teal-600" />;
    case "condicao_comercial":
      return <DollarSign size={18} className="text-yellow-600" />;
    default:
      return <Package size={18} className="text-gray-600" />;
  }
};

// Cor por nível
const getNivelColor = (nivel: EstruturaComercialNivel) => {
  switch (nivel) {
    case "vertical":
      return "bg-blue-900/20 border-blue-200";
    case "produto":
      return "bg-green-900/20 border-green-200";
    case "subproduto":
      return "bg-purple-50 border-purple-200";
    case "fornecedor_originador":
      return "bg-orange-50 border-orange-200";
    case "tabela_plano_campanha":
      return "bg-teal-50 border-teal-200";
    case "condicao_comercial":
      return "bg-yellow-900/20 border-yellow-200";
    default:
      return "bg-gray-50 border-[#1f2937]";
  }
};

// Obter placeholder do código por nível
const getCodigoPlaceholder = (nivel?: EstruturaComercialNivel): string => {
  switch (nivel) {
    case "fornecedor_originador":
      return "Ex: 336 para Banco C6, 033 para Santander, ENE-001 para comercializadora";
    case "tabela_plano_campanha":
      return "Ex: 701434, INSS_NOV_NORMAL_A, GD-RES-001";
    case "condicao_comercial":
      return "Ex: PAN-701434-84, C6-INSS-96";
    default:
      return "Ex: CREDITO, ENERGIA, CONSIGNADO";
  }
};

// Obter texto de ajuda do código por nível
const getCodigoHelpText = (nivel?: EstruturaComercialNivel): string => {
  switch (nivel) {
    case "fornecedor_originador":
      return "Informe o código oficial ou externo do banco, promotora, comercializadora ou parceiro.";
    case "tabela_plano_campanha":
      return "Informe o código da tabela, plano, campanha ou código usado na integração.";
    case "condicao_comercial":
      return "Use um código único para identificar a condição comercial, principalmente para importação, API e automações.";
    default:
      return "Código opcional para organização interna ou integração futura.";
  }
};

// Gerar código automático se não informado
const generateAutoCode = (nivel?: EstruturaComercialNivel, nome?: string): string => {
  if (!nivel || !nome) return "";
  
  const timestamp = Date.now().toString().slice(-3);
  const nomeFormatado = nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 20);
  
  const nivelPrefix = {
    vertical: "VERT",
    produto: "PROD",
    subproduto: "SUB",
    fornecedor_originador: "FORN",
    tabela_plano_campanha: "TABELA",
    condicao_comercial: "COND",
  }[nivel] || "ITEM";
  
  return `${nivelPrefix}-${nomeFormatado}-${timestamp}`;
};

// Formatar moeda
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

// Formatar percentual
const formatPercent = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
};

// Verificar se está vencido
const isVencido = (validade_fim?: string) => {
  if (!validade_fim) return false;
  return new Date(validade_fim) < new Date();
};

// Verificar se está vencendo em breve (30 dias)
const isVencendo = (validade_fim?: string) => {
  if (!validade_fim) return false;
  const dataFim = new Date(validade_fim);
  const hoje = new Date();
  const diffTime = dataFim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 30;
};

// Verificar se ainda não iniciou
const isNaoIniciada = (validade_inicio?: string) => {
  if (!validade_inicio) return false;
  return new Date(validade_inicio) > new Date();
};

// Calcular status de vigência
const getVigenciaStatus = (validade_inicio?: string, validade_fim?: string): "ativa" | "vencida" | "vencendo" | "nao_iniciada" | "indefinida" => {
  if (!validade_inicio && !validade_fim) return "indefinida";
  if (isNaoIniciada(validade_inicio)) return "nao_iniciada";
  if (isVencido(validade_fim)) return "vencida";
  if (isVencendo(validade_fim)) return "vencendo";
  return "ativa";
};

// Obter cor do status de vigência
const getVigenciaStatusColor = (status: string) => {
  switch (status) {
    case "ativa":
      return "bg-green-900/20 text-green-800 border-green-200";
    case "vencida":
      return "bg-red-900/20 text-red-800 border-red-200";
    case "vencendo":
      return "bg-yellow-900/20 text-yellow-800 border-yellow-200";
    case "nao_iniciada":
      return "bg-blue-900/20 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-200 border-[#1f2937]";
  }
};

// Obter label do status de vigência
const getVigenciaStatusLabel = (status: string) => {
  switch (status) {
    case "ativa":
      return "Ativa";
    case "vencida":
      return "Vencida";
    case "vencendo":
      return "Vencendo em breve";
    case "nao_iniciada":
      return "Não iniciada";
    default:
      return "Indefinida";
  }
};

// Formatar data para exibição
const formatDate = (timestamp: number | string | undefined) => {
  if (!timestamp) return "—";
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// Formatar data e hora para exibição
const formatDateTime = (timestamp: number | undefined) => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return date.toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// ============================================
// HELPER: Converter catálogo PF Credit para Estrutura Comercial
// Commercial Structure é um catálogo neutro de produtos/subprodutos/modalidades
// Não inclui fornecedores, tabelas comerciais ou condições comerciais
// ============================================

/**
 * Labels amigáveis para modalidades
 */
const formatModalityLabel = (modality: string): string => {
  const labels: Record<string, string> = {
    NOVO: "Novo",
    REFINANCIAMENTO: "Refinanciamento",
    PORTABILIDADE: "Portabilidade",
    TRANSFERENCIA_COTA: "Transferência de Cota"
  };
  return labels[modality] || modality || "Não informado";
};

/**
 * Converte o creditPfCatalog para o formato EstruturaComercial
 * Usado para sincronizar a estrutura comercial com o catálogo de produtos
 */
const buildEstruturaFromCatalog = (): EstruturaComercial[] => {
  const now = Date.now();
  const items: EstruturaComercial[] = [];
  let id = 1;

  // Verificar se o catálogo existe e é um array
  const safeCatalog = Array.isArray(creditPfCatalog) ? creditPfCatalog : [];

  // Nível 1: Vertical de Negócio (Crédito PF)
  const verticalId = id++;
  items.push({
    id: verticalId,
    nivel: "vertical",
    nome: "Crédito PF",
    descricao: "Produtos de crédito para pessoa física",
    ativo: 1,
    created_at: now,
    updated_at: now
  });

  // Para cada produto no catálogo
  safeCatalog.filter(p => p?.active).forEach((product) => {
    if (!product?.id || !product?.name) return;

    // Nível 2: Produto
    const produtoId = id++;
    items.push({
      id: produtoId,
      parent_id: verticalId,
      nivel: "produto",
      nome: product.name,
      codigo: product.code,
      descricao: product.name,
      ativo: product.active ? 1 : 0,
      created_at: now,
      updated_at: now
    });

    // Nível 3: Subprodutos
    const safeSubproducts = Array.isArray(product.subproducts) ? product.subproducts : [];
    safeSubproducts.filter(sp => sp?.active).forEach((subproduct) => {
      if (!subproduct?.id || !subproduct?.name) return;

      const subprodutoId = id++;
      const modalityLabels = (subproduct.modalities || []).map(formatModalityLabel).join(", ");
      
      items.push({
        id: subprodutoId,
        parent_id: produtoId,
        nivel: "subproduto",
        nome: subproduct.name,
        codigo: subproduct.code,
        descricao: `Modalidades: ${modalityLabels}`,
        ativo: subproduct.active ? 1 : 0,
        created_at: now,
        updated_at: now
      });

      // Nível 4: Modalidades (usando labels amigáveis)
      const safeModalities = Array.isArray(subproduct.modalities) ? subproduct.modalities : [];
      safeModalities.forEach((modality) => {
        items.push({
          id: id++,
          parent_id: subprodutoId,
          nivel: "tabela_plano_campanha",
          nome: formatModalityLabel(modality),
          codigo: modality,
          descricao: "Modalidade permitida",
          ativo: 1,
          created_at: now,
          updated_at: now
        });
      });
    });
  });

  return items;
};

const EstruturaComercialPage: React.FC = () => {
  const {
    estruturaComercial,
    setEstruturaComercial,
    addEstruturaComercial,
    updateEstruturaComercial,
    deleteEstruturaComercial,
    toggleEstruturaComercialStatus,
    duplicateEstruturaComercial,
    importEstruturaComercial,
    exportEstruturaComercial,
  } = useAppStore();

  // Estado
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([1, 20])); // Verticais expandidas por padrão
  const [selectedItem, setSelectedItem] = useState<EstruturaComercial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "vigencia" | "historico">("dados");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Filtros
  const [filtroVertical, setFiltroVertical] = useState<string>("");
  const [filtroProduto, setFiltroProduto] = useState<string>("");
  const [filtroNivel, setFiltroNivel] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroFornecedorTipo, setFiltroFornecedorTipo] = useState<string>("");
  const [filtroVigencia, setFiltroVigencia] = useState<string>("");

  // Estado do FilterDrawer
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

  // Handler: Sincronizar com Catálogo PF Credit
  const handleSyncWithCatalog = () => {
    if (confirm("Isso irá substituir a estrutura atual pelos produtos do catálogo PF Credit. Deseja continuar?")) {
      const newEstrutura = buildEstruturaFromCatalog();
      setEstruturaComercial(newEstrutura);
      alert(`Sincronizado! ${newEstrutura.length} itens foram importados do catálogo.`);
    }
  };

  // Dados do formulário
  const [formData, setFormData] = useState<Partial<EstruturaComercial>>({
    nivel: "vertical",
    nome: "",
    descricao: "",
    codigo: "",
    ativo: 1,
  });

  // Buscar itens pais para select
  const verticais = useMemo(() => 
    estruturaComercial.filter((item) => item.nivel === "vertical"), 
    [estruturaComercial]
  );

  const produtos = useMemo(() => 
    estruturaComercial.filter((item) => item.nivel === "produto"), 
    [estruturaComercial]
  );

  const subprodutos = useMemo(() => 
    estruturaComercial.filter((item) => item.nivel === "subproduto"), 
    [estruturaComercial]
  );

  const fornecedores = useMemo(() => 
    estruturaComercial.filter((item) => item.nivel === "fornecedor_originador"), 
    [estruturaComercial]
  );

  // Filtrar estrutura comercial
  const filteredEstrutura = useMemo(() => {
    let filtered = [...estruturaComercial];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nome?.toLowerCase().includes(term) ||
          item.descricao?.toLowerCase().includes(term) ||
          item.codigo?.toLowerCase().includes(term) ||
          item.fornecedor_nome?.toLowerCase().includes(term) ||
          item.tabela_nome?.toLowerCase().includes(term)
      );
    }

    // Filtros
    if (filtroVertical) {
      filtered = filtered.filter((item) => item.vertical === filtroVertical);
    }
    if (filtroProduto) {
      filtered = filtered.filter((item) => item.produto_nome === filtroProduto);
    }
    if (filtroNivel) {
      filtered = filtered.filter((item) => item.nivel === filtroNivel);
    }
    if (filtroStatus) {
      filtered = filtered.filter((item) => 
        filtroStatus === "ativo" ? item.ativo === 1 : item.ativo === 0
      );
    }
    if (filtroFornecedorTipo) {
      filtered = filtered.filter((item) => item.fornecedor_tipo === filtroFornecedorTipo);
    }

    // Filtro de vigência
    if (filtroVigencia) {
      const hoje = new Date();
      filtered = filtered.filter((item) => {
        const validadeInicio = item.validade_inicio ? new Date(item.validade_inicio) : null;
        const validadeFim = item.validade_fim ? new Date(item.validade_fim) : null;
        
        switch (filtroVigencia) {
          case "vigente":
            // Vigente: iniciou e ainda não venceu (ou não tem data de fim)
            return validadeInicio && validadeInicio <= hoje && (!validadeFim || validadeFim >= hoje);
          case "vencido":
            // Vencido: data de fim menor que hoje
            return validadeFim && validadeFim < hoje;
          case "a_vencer":
            // A vencer: vence nos próximos 30 dias
            return validadeFim && validadeFim >= hoje && validadeFim <= new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
          case "nao_iniciado":
            // Não iniciado: data de início maior que hoje
            return validadeInicio && validadeInicio > hoje;
          case "sem_vigencia":
            // Sem vigência: não tem data de início nem fim
            return !validadeInicio && !validadeFim;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [estruturaComercial, searchTerm, filtroVertical, filtroProduto, filtroNivel, filtroStatus, filtroFornecedorTipo, filtroVigencia]);

  // Construir árvore hierárquica
  const buildTree = useCallback((items: EstruturaComercial[]): EstruturaComercial[] => {
    const itemMap = new Map<number, EstruturaComercial>();
    const roots: EstruturaComercial[] = [];

    // Primeiro, criar mapa de todos os itens
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, parent_id: item.parent_id ?? null });
    });

    // Depois, construir árvore
    items.forEach((item) => {
      const node = itemMap.get(item.id)!;
      if (!item.parent_id || item.parent_id === null) {
        roots.push(node);
      } else {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          // O item já está no mapa
        }
      }
    });

    return roots;
  }, []);

  // Obter filhos de um item
  const getChildren = useCallback((parentId: number, items: EstruturaComercial[]): EstruturaComercial[] => {
    return items.filter((item) => item.parent_id === parentId);
  }, []);

  // Contagens para cards
  // Commercial Structure é um catálogo neutro de produtos/subprodutos/modalidades
  // Não inclui fornecedores, tabelas comerciais ou condições comerciais (serão módulos separados)
  const stats = useMemo(() => {
    // Contar apenas itens do catálogo: vertical + produto + subproduto + modalidade
    const total = estruturaComercial.filter((i) => 
      i.nivel === "vertical" || i.nivel === "produto" || i.nivel === "subproduto" || i.nivel === "tabela_plano_campanha"
    ).length;
    const verticaisAtivas = estruturaComercial.filter((i) => i.nivel === "vertical" && i.ativo === 1).length;
    const produtosAtivos = estruturaComercial.filter((i) => i.nivel === "produto" && i.ativo === 1).length;
    // Fornecedores = 0 (bancos/providers serão módulo separado)
    const fornecedoresAtivos = 0;
    // Tabelas Comerciais = 0 (será módulo separado)
    const tabelasAtivas = 0;
    // Condições Comerciais = 0 (será módulo separado)
    const condicoesAtivas = 0;
    // Vencendo = 0 (sem condições comerciais para vencer)
    const tabelasVencendo = 0;
    const automacoesAtivas = estruturaComercial.filter((i) => i.automation_enabled && i.automation_status === "active").length;
    const integracoesPendentes = estruturaComercial.filter((i) => i.sync_status === "pending").length;

    return {
      total,
      verticaisAtivas,
      produtosAtivos,
      fornecedoresAtivos,
      tabelasAtivas,
      condicoesAtivas,
      tabelasVencendo,
      automacoesAtivas,
      integracoesPendentes,
    };
  }, [estruturaComercial]);

  // Toggle expandir/recolher
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Abrir modal de criação
  const handleCreate = (nivel: EstruturaComercialNivel = "vertical", parentId?: number) => {
    setFormData({
      nivel,
      parent_id: parentId,
      nome: "",
      descricao: "",
      codigo: "",
      ativo: 1,
      vertical: "",
      produto_nome: "",
      subproduto_nome: "",
      fornecedor_tipo: undefined,
      fornecedor_nome: "",
      tabela_nome: "",
      tabela_codigo: "",
      taxa_juros: undefined,
      prazo: undefined,
      prazo_minimo: undefined,
      prazo_maximo: undefined,
      valor_minimo: undefined,
      valor_maximo: undefined,
      coeficiente: undefined,
      comissao_flat: undefined,
      comissao_bonus: undefined,
      comissao_adiantamento: undefined,
      comissao_total: undefined,
      comissao_fixa: undefined,
      comissao_recorrente: undefined,
    });
    setIsEditing(false);
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const handleEdit = (item: EstruturaComercial) => {
    setFormData({ ...item });
    setIsEditing(true);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Salvar item
  const handleSave = () => {
    if (!formData.nome?.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    // Validar código - remover espaços extras e validar caracteres
    const codigoTrimmed = formData.codigo?.trim() || "";
    
    // Validar duplicidade de código dentro do mesmo nível e parent_id
    if (codigoTrimmed) {
      const existingItem = estruturaComercial.find(
        (item) =>
          item.codigo?.toLowerCase() === codigoTrimmed.toLowerCase() &&
          item.nivel === formData.nivel &&
          item.parent_id === formData.parent_id &&
          (!isEditing || item.id !== selectedItem?.id)
      );
      if (existingItem) {
        alert("Já existe um registro com este código no mesmo nível e pai. Escolha outro código ou deixe em branco.");
        return;
      }
    }

    // Calcular comissão total automaticamente
    const comissaoTotal = 
      (formData.comissao_flat || 0) + 
      (formData.comissao_bonus || 0) + 
      (formData.comissao_adiantamento || 0);

    // Auto-gerar código se não informado
    const codigoFinal = codigoTrimmed || generateAutoCode(formData.nivel, formData.nome);

    const dataToSave = {
      ...formData,
      codigo: codigoFinal,
      comissao_total: (formData.comissao_total ?? comissaoTotal) || undefined,
      updated_at: Date.now(),
    };

    // Criar item de histórico
    const historicoItem: HistoricoItem = {
      id: Date.now(),
      data: Date.now(),
      tipo: isEditing ? "edicao" : "criacao",
      descricao: isEditing 
        ? `Edição do registro "${formData.nome}"`
        : `Criação do registro "${formData.nome}"`,
    };

    if (isEditing && selectedItem) {
      // Adicionar ao histórico existente
      const historicoExistente = selectedItem.historico || [];
      updateEstruturaComercial(selectedItem.id, {
        ...dataToSave,
        historico: [...historicoExistente, historicoItem],
      });
    } else {
      const newId = Math.max(...estruturaComercial.map((i) => i.id), 0) + 1;
      addEstruturaComercial({
        ...dataToSave,
        id: newId,
        created_at: Date.now(),
        historico: [historicoItem],
      } as EstruturaComercial);
    }

    setIsModalOpen(false);
    setFormData({});
  };

  // Excluir item
  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteEstruturaComercial(id);
    }
  };

  // Duplicar item
  const handleDuplicate = (id: number) => {
    duplicateEstruturaComercial(id);
  };

  // Toggle status
  const handleToggleStatus = (id: number) => {
    toggleEstruturaComercialStatus(id);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = [
      "codigo", "vertical", "produto", "subproduto", "fornecedor_tipo", "fornecedor_nome",
      "tabela_nome", "tabela_codigo", "taxa_juros", "prazo", "valor_minimo", "valor_maximo",
      "coeficiente", "comissao_flat", "comissao_bonus", "comissao_adiantamento", "comissao_total",
      "validade_inicio", "validade_fim", "ativo", "sync_status", "automation_enabled"
    ];

    const rows = filteredEstrutura.map((item) => [
      item.codigo || "",
      item.vertical || "",
      item.produto_nome || "",
      item.subproduto_nome || "",
      item.fornecedor_tipo || "",
      item.fornecedor_nome || "",
      item.tabela_nome || "",
      item.tabela_codigo || "",
      item.taxa_juros?.toString() || "",
      item.prazo?.toString() || "",
      item.valor_minimo?.toString() || "",
      item.valor_maximo?.toString() || "",
      item.coeficiente?.toString() || "",
      item.comissao_flat?.toString() || "",
      item.comissao_bonus?.toString() || "",
      item.comissao_adiantamento?.toString() || "",
      item.comissao_total?.toString() || "",
      item.validade_inicio || "",
      item.validade_fim || "",
      item.ativo?.toString() || "",
      item.sync_status || "",
      item.automation_enabled?.toString() || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estrutura_comercial_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  // Exportar JSON
  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(filteredEstrutura, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estrutura_comercial_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  // Importar CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");

      const newItems: EstruturaComercial[] = [];
      let currentId = Math.max(...estruturaComercial.map((i) => i.id), 0) + 1;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(",");
        const item: any = {
          id: currentId++,
          nivel: "condicao_comercial",
          ativo: 1,
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        headers.forEach((header, index) => {
          const value = values[index]?.trim() || "";
          const key = header.trim();
          
          if (key === "vertical") item.vertical = value;
          if (key === "produto") item.produto_nome = value;
          if (key === "subproduto") item.subproduto_nome = value;
          if (key === "fornecedor_tipo") item.fornecedor_tipo = value as FornecedorTipo;
          if (key === "fornecedor_nome") item.fornecedor_nome = value;
          if (key === "tabela_nome") item.tabela_nome = value;
          if (key === "tabela_codigo") item.tabela_codigo = value;
          if (key === "taxa_juros") item.taxa_juros = parseFloat(value) || undefined;
          if (key === "prazo") item.prazo = parseInt(value) || undefined;
          if (key === "prazo_minimo") item.prazo_minimo = parseInt(value) || undefined;
          if (key === "prazo_maximo") item.prazo_maximo = parseInt(value) || undefined;
          if (key === "valor_minimo") item.valor_minimo = parseFloat(value) || undefined;
          if (key === "valor_maximo") item.valor_maximo = parseFloat(value) || undefined;
          if (key === "coeficiente") item.coeficiente = parseFloat(value) || undefined;
          if (key === "comissao_flat") item.comissao_flat = parseFloat(value) || undefined;
          if (key === "comissao_bonus") item.comissao_bonus = parseFloat(value) || undefined;
          if (key === "comissao_adiantamento") item.comissao_adiantamento = parseFloat(value) || undefined;
          if (key === "validade_inicio") item.validade_inicio = value;
          if (key === "validade_fim") item.validade_fim = value;
          if (key === "ativo") item.ativo = value === "1" || value === "1" ? 1 : 0;
        });

        newItems.push(item as EstruturaComercial);
      }

      if (newItems.length > 0) {
        importEstruturaComercial(newItems);
        alert(`Importados ${newItems.length} registros com sucesso!`);
      }
    };
    reader.readAsText(file);
    setImportModalOpen(false);
  };

  // Renderizar item da lista
  const renderItem = (item: EstruturaComercial, level: number = 0) => {
    const children = getChildren(item.id, filteredEstrutura);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(item.id);
    const nivelItem = item.nivel as EstruturaComercialNivel;

    return (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors ${getNivelColor(nivelItem)}`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => hasChildren && toggleExpand(item.id)}
        >
          {/* Expand/Collapse */}
          <div className="w-6 h-6 flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )
            ) : (
              <div className="w-6" />
            )}
          </div>

          {/* Ícone do nível */}
          {getNivelIcon(nivelItem)}

          {/* Nome e descrição */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white truncate">{item.nome}</span>
              {item.ativo === 0 && (
                <Badge variant="secondary" className="text-xs">Inativo</Badge>
              )}
              {item.nivel === "condicao_comercial" && isVencido(item.validade_fim) && (
                <BadgeAlert size={14} className="text-red-500" />
              )}
              {item.nivel === "condicao_comercial" && isVencendo(item.validade_fim) && !isVencido(item.validade_fim) && (
                <AlertTriangle size={14} className="text-yellow-500" />
              )}
            </div>
            {item.descricao && (
              <div className="text-xs text-gray-500 truncate">{item.descricao}</div>
            )}
          </div>

          {/* Informações extras por nível */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {item.nivel === "condicao_comercial" && (
              <>
                {item.taxa_juros !== undefined && (
                  <span className="font-medium">{formatPercent(item.taxa_juros)}</span>
                )}
                {item.prazo && (
                  <span>{item.prazo}x</span>
                )}
                {item.valor_minimo !== undefined && item.valor_maximo !== undefined && (
                  <span>{formatCurrency(item.valor_minimo)} - {formatCurrency(item.valor_maximo)}</span>
                )}
              </>
            )}
            {item.fornecedor_tipo && (
              <span className="capitalize">{item.fornecedor_tipo.replace("_", " ")}</span>
            )}
            {item.fornecedor_nome && (
              <span>{item.fornecedor_nome}</span>
            )}
            {item.sync_status && item.sync_status !== "synced" && (
              <Badge variant={item.sync_status === "pending" ? "warning" : "destructive"} className="text-xs">
                {item.sync_status}
              </Badge>
            )}
            {item.automation_enabled && (
              <Bot size={14} className="text-purple-500" />
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreate("subproduto", item.id)}
              title="Adicionar subnível"
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(item)}
              title="Editar"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicate(item.id)}
              title="Duplicar"
            >
              <Copy size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item.id)}
              title={item.ativo === 1 ? "Inativar" : "Ativar"}
            >
              {item.ativo === 1 ? <BadgeCheck size={16} className="text-green-600" /> : <BadgeAlert size={16} className="text-gray-400" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item.id)}
              title="Excluir"
              className="hover:text-red-600"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Renderizar filhos */}
        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Itens raiz (sem pai)
  const rootItems = filteredEstrutura.filter((item) => !item.parent_id || item.parent_id === null);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Estrutura Comercial"
        subtitle="Gerencie a hierarquia comercial completa"
        onSearch={setSearchTerm}
        onRefresh={() => {}}
        onCreate={() => {}}
        createLabel="Nova Estrutura"
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={[
          { label: 'Nível', key: 'nivel', type: 'select', options: nivelOptions, placeholder: 'Todos os níveis' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' }
          ], placeholder: 'Todos os status' },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'nivel') setFiltroNivel(value)
          if (key === 'status') setFiltroStatus(value)
        }}
        importLabel="Importar Tabelas"
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="estrutura_comercial"
        extra={
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncWithCatalog}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Sincronizar Catálogo
          </Button>
        }
      />

      <div className="p-6">
        {/* Cards superiores */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <KpiCard
            label="Total de Itens"
            value={stats.total}
            icon={<Layers size={18} />}
            variant="blue"
          />
          <KpiCard
            label="Verticais Ativas"
            value={stats.verticaisAtivas}
            icon={<Building2 size={18} />}
            variant="blue"
          />
          <KpiCard
            label="Produtos Ativos"
            value={stats.produtosAtivos}
            icon={<Package size={18} />}
            variant="green"
          />
          <KpiCard
            label="Fornecedores"
            value={stats.fornecedoresAtivos}
            icon={<Users size={18} />}
            variant="orange"
          />
          <KpiCard
            label="Condições Comerciais"
            value={stats.condicoesAtivas}
            icon={<Table2 size={18} />}
            variant="orange"
          />
          <KpiCard
            label="Vencendo em 30 dias"
            value={stats.tabelasVencendo}
            icon={<AlertTriangle size={18} />}
            variant="red"
          />
        </div>

        {/* Lista hierárquica */}
        <Card className="overflow-hidden">
          <div className="bg-gray-50 border-b border-[#1f2937] p-3 flex items-center gap-2 text-sm font-medium text-gray-600">
            <div className="w-6" />
            <div className="w-6" />
            <div className="flex-1">Nome</div>
            <div className="w-48">Informações</div>
            <div className="w-40">Ações</div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {rootItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Layers size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma estrutura comercial encontrada</p>
                <Button className="mt-4" onClick={() => handleCreate("vertical")}>
                  <Plus size={16} className="mr-2" />
                  Criar Primeira Estrutura
                </Button>
              </div>
            ) : (
              rootItems.map((item) => renderItem(item))
            )}
          </div>
        </Card>
      </div>

      {/* Modal de criação/edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Estrutura Comercial" : "Nova Estrutura Comercial"}
        size="lg"
      >
        {/* Abas do modal */}
        <div className="flex border-b border-[#1f2937] mb-4 -mx-6 px-6">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dados"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("dados")}
          >
            Dados
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "vigencia"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("vigencia")}
          >
            Vigência
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "historico"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("historico")}
          >
            Histórico
          </button>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === "dados" && (
        <div className="space-y-4">
          {/* Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nível *</label>
            <Select
              value={formData.nivel}
              onChange={(e) => setFormData({ ...formData, nivel: e.target.value as EstruturaComercialNivel })}
              disabled={isEditing}
            >
              {nivelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome"
            />
          </div>

          {/* Código externo / integração */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Código externo / integração</label>
            <Input
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.trim() })}
              placeholder={getCodigoPlaceholder(formData.nivel)}
            />
            <p className="mt-1 text-xs text-gray-500">
              {getCodigoHelpText(formData.nivel)}
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <TextArea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da estrutura"
              rows={2}
            />
          </div>

          {/* Campos específicos por nível */}
          {formData.nivel === "fornecedor_originador" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Fornecedor</label>
                <Select
                  value={formData.fornecedor_tipo || ""}
                  onChange={(e) => setFormData({ ...formData, fornecedor_tipo: e.target.value as FornecedorTipo })}
                >
                  <option value="">Selecione...</option>
                  {fornecedorTipos.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Fornecedor</label>
                <Input
                  value={formData.fornecedor_nome}
                  onChange={(e) => setFormData({ ...formData, fornecedor_nome: e.target.value })}
                  placeholder="Nome do fornecedor/originador"
                />
              </div>
            </>
          )}

          {formData.nivel === "condicao_comercial" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Taxa de Juros (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.taxa_juros ?? ""}
                    onChange={(e) => setFormData({ ...formData, taxa_juros: parseFloat(e.target.value) || undefined })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Prazo</label>
                  <Input
                    type="number"
                    value={formData.prazo ?? ""}
                    onChange={(e) => setFormData({ ...formData, prazo: parseInt(e.target.value) || undefined })}
                    placeholder="Número de parcelas"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor Mínimo</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_minimo ?? ""}
                    onChange={(e) => setFormData({ ...formData, valor_minimo: parseFloat(e.target.value) || undefined })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor Máximo</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_maximo ?? ""}
                    onChange={(e) => setFormData({ ...formData, valor_maximo: parseFloat(e.target.value) || undefined })}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Coeficiente</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coeficiente ?? ""}
                    onChange={(e) => setFormData({ ...formData, coeficiente: parseFloat(e.target.value) || undefined })}
                    placeholder="0,0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Comissão Flat (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.comissao_flat ?? ""}
                    onChange={(e) => setFormData({ ...formData, comissao_flat: parseFloat(e.target.value) || undefined })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Validade Início</label>
                  <Input
                    type="date"
                    value={formData.validade_inicio}
                    onChange={(e) => setFormData({ ...formData, validade_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Validade Fim</label>
                  <Input
                    type="date"
                    value={formData.validade_fim}
                    onChange={(e) => setFormData({ ...formData, validade_fim: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <Toggle
              checked={formData.ativo === 1}
              onChange={(checked) => setFormData({ ...formData, ativo: checked ? 1 : 0 })}
            />
            <span className="text-sm text-gray-300">Ativo</span>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Salvar Alterações" : "Criar"}
            </Button>
          </div>
        </div>
        )}

        {/* Aba Vigência */}
        {activeTab === "vigencia" && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-[#1f2937] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Status da Vigência</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getVigenciaStatusColor(getVigenciaStatus(formData.validade_inicio, formData.validade_fim))}`}>
                  {getVigenciaStatusLabel(getVigenciaStatus(formData.validade_inicio, formData.validade_fim))}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Data de Início</label>
                  <Input
                    type="date"
                    value={formData.validade_inicio}
                    onChange={(e) => setFormData({ ...formData, validade_inicio: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Data em que a estrutura começa a vigorar
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Data de Fim</label>
                  <Input
                    type="date"
                    value={formData.validade_fim}
                    onChange={(e) => setFormData({ ...formData, validade_fim: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Data em que a estrutura deixa de vigorar
                  </p>
                </div>
              </div>

              {/* Informações de vigência */}
              <div className="mt-4 p-3 bg-[#111827] border border-[#1f2937] rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Início:</span>
                    <span className="ml-2 font-medium">{formatDate(formData.validade_inicio)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fim:</span>
                    <span className="ml-2 font-medium">{formatDate(formData.validade_fim)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duração:</span>
                    <span className="ml-2 font-medium">
                      {formData.validade_inicio && formData.validade_fim 
                        ? `${Math.ceil((new Date(formData.validade_fim).getTime() - new Date(formData.validade_inicio).getTime()) / (1000 * 60 * 60 * 24))} dias`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Salvar Alterações" : "Criar"}
            </Button>
          </div>
        </div>
        )}

        {/* Aba Histórico */}
        {activeTab === "historico" && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-[#1f2937] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Histórico de Alterações</h4>
                <Badge variant="secondary">
                  {selectedItem?.historico?.length || 0} registros
                </Badge>
              </div>
              
              {selectedItem?.historico && selectedItem.historico.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedItem.historico.map((item) => (
                    <div key={item.id} className="bg-[#111827] border border-[#1f2937] rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <History size={16} className="text-gray-400" />
                          <span className="font-medium text-white capitalize">{item.tipo}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDateTime(item.data)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{item.descricao}</p>
                      {item.campo && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">{item.campo}:</span>{" "}
                          <span className="line-through">{item.valor_anterior || "—"}</span>
                          {" → "}
                          <span>{item.valor_novo || "—"}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Nenhum histórico registrado</p>
                  <p className="text-sm mt-1">As alterações serão registradas automaticamente</p>
                </div>
              )}
            </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
        )}
      </Modal>

      {/* Modal de importação */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Importar Estrutura Comercial"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instruções de Importação</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• O arquivo deve estar no formato CSV</li>
              <li>• Cada linha representa uma Condição Comercial</li>
              <li>• Campos obrigatórios: vertical, produto</li>
              <li>• Campos opcionais: taxa_juros, prazo, valores, comissões</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Arquivo CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/20 file:text-blue-700 hover:file:bg-blue-900/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de exportação */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Exportar Estrutura Comercial"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Escolha o formato de exportação. Serão exportados {filteredEstrutura.length} registros.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={handleExportCSV}>
              <FileText size={24} />
              <span>Exportar CSV</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={handleExportJSON}>
              <Download size={24} />
              <span>Exportar JSON</span>
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        fields={[
          { key: 'nivel', label: 'Nível', type: 'select', options: nivelOptions, placeholder: 'Todos os níveis' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' }
          ], placeholder: 'Todos os status' },
        ]}
        values={{
          nivel: filtroNivel,
          status: filtroStatus,
        }}
        onChange={(key, value) => {
          if (key === 'nivel') setFiltroNivel(value)
          if (key === 'status') setFiltroStatus(value)
        }}
        onApply={() => setOpenFilterDrawer(false)}
        onClear={() => {
          setFiltroNivel('')
          setFiltroStatus('')
        }}
      />
    </div>
  );
};

export default EstruturaComercialPage;
