// FINQZ PRO - Roteiros Operacionais Page
// - Lista hierárquica expansível (sem Kanban)
// - Filtros funcionais
// - Modal organizado por seções
// - Suporte a textos, vídeos, PDFs, links, checklists, FAQs
// - Integração com Estrutura Comercial
// - Importação e Exportação CSV/JSON

import React, { useMemo, useState, useCallback, useEffect } from "react";
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
  BookOpen,
  GraduationCap,
  MessageSquare,
  Headphones,
  Settings,
  Book,
  HelpCircle,
  CheckSquare,
  Video,
  File,
  Link2,
  Filter,
  X,
  Check,
  AlertTriangle,
  Clock,
  Eye,
  Send,
  Archive,
  ToggleLeft,
  ToggleRight,
  Play,
  ExternalLink,
  UploadCloud,
  FileSpreadsheet,
  ClipboardList,
} from "lucide-react";

import useAppStore from "../store";
import type { 
  RoteiroOperacional, 
  RoteiroOperacionalNivel, 
  OrigemTipo, 
  FormatoConteudo,
  VideoProvider,
  Prioridade,
  StatusPublicacao,
  EstruturaComercial
} from "../types";

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

// ============================================
// CONSTANTES
// ============================================

// Categorias iniciais
const CATEGORIAS = [
  "Crédito",
  "Energia",
  "Seguros",
  "Consórcios",
  "Financeiro",
  "Comercial",
  "Operacional",
  "Institucional",
  "Jurídico",
  "Compliance",
  "Outros",
];

// Tipos de conteúdo
const TIPOS_CONTEUDO = [
  "Treinamento",
  "Comunicado",
  "Roteiro de Vendas",
  "Script de Atendimento",
  "Procedimento Operacional",
  "Manual",
  "FAQ",
  "Política",
  "Checklist",
  "Vídeo",
  "PDF",
  "Link Externo",
];

// Tipos de origem
const ORIGENS_TIPO: { value: OrigemTipo; label: string }[] = [
  { value: "finqz_interno", label: "FINQZ Interno" },
  { value: "banco", label: "Banco" },
  { value: "promotora", label: "Promotora" },
  { value: "comercializadora", label: "Comercializadora" },
  { value: "seguradora", label: "Seguradora" },
  { value: "administradora_consorcio", label: "Administradora de Consórcio" },
  { value: "parceiro_operacional", label: "Parceiro Operacional" },
  { value: "correspondente", label: "Correspondente" },
  { value: "outro", label: "Outro" },
];

// Formatos de conteúdo
const FORMATOS_CONTEUDO: { value: FormatoConteudo; label: string; icon: React.ReactNode }[] = [
  { value: "texto", label: "Texto", icon: <FileText size={16} /> },
  { value: "video", label: "Vídeo", icon: <Video size={16} /> },
  { value: "pdf", label: "PDF", icon: <File size={16} className="text-red-500" /> },
  { value: "link", label: "Link Externo", icon: <Link2 size={16} /> },
  { value: "checklist", label: "Checklist", icon: <CheckSquare size={16} /> },
  { value: "faq", label: "FAQ", icon: <HelpCircle size={16} /> },
  { value: "arquivo", label: "Arquivo", icon: <UploadCloud size={16} /> },
];

// Provedores de vídeo
const VIDEO_PROVIDERS: { value: VideoProvider; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "loom", label: "Loom" },
  { value: "drive", label: "Google Drive" },
  { value: "outro", label: "Outro" },
];

// Prioridades
const PRIORIDADES: { value: Prioridade; label: string; color: string }[] = [
  { value: "baixa", label: "Baixa", color: "gray" },
  { value: "media", label: "Média", color: "blue" },
  { value: "alta", label: "Alta", color: "orange" },
  { value: "critica", label: "Crítica", color: "red" },
];

// Status de publicação
const STATUS_PUBLICACAO: { value: StatusPublicacao; label: string; color: string }[] = [
  { value: "rascunho", label: "Rascunho", color: "gray" },
  { value: "publicado", label: "Publicado", color: "green" },
  { value: "arquivado", label: "Arquivado", color: "yellow" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Ícones por nível
const getNivelIcon = (nivel: RoteiroOperacionalNivel) => {
  switch (nivel) {
    case "categoria":
      return <BookOpen size={18} className="text-blue-600" />;
    case "tipo_conteudo":
      return <GraduationCap size={18} className="text-green-600" />;
    case "origem":
      return <ClipboardList size={18} className="text-purple-600" />;
    case "roteiro":
      return <FileText size={18} className="text-orange-600" />;
    default:
      return <FileText size={18} className="text-gray-600" />;
  }
};

// Cor por nível
const getNivelColor = (nivel: RoteiroOperacionalNivel) => {
  switch (nivel) {
    case "categoria":
      return "blue";
    case "tipo_conteudo":
      return "green";
    case "origem":
      return "purple";
    case "roteiro":
      return "orange";
    default:
      return "gray";
  }
};

// Obter cor da prioridade
const getPrioridadeColor = (prioridade?: Prioridade) => {
  switch (prioridade) {
    case "critica":
      return "bg-red-100 text-red-800";
    case "alta":
      return "bg-orange-100 text-orange-800";
    case "media":
      return "bg-blue-100 text-blue-800";
    case "baixa":
      return "bg-gray-100 text-gray-200";
    default:
      return "bg-gray-100 text-gray-200";
  }
};

// Obter cor do status de publicação
const getStatusColor = (status?: StatusPublicacao) => {
  switch (status) {
    case "publicado":
      return "bg-green-100 text-green-800";
    case "rascunho":
      return "bg-gray-100 text-gray-200";
    case "arquivado":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-200";
  }
};

// Obter ícone do formato
const getFormatoIcon = (formato?: FormatoConteudo) => {
  switch (formato) {
    case "video":
      return <Video size={14} className="text-purple-500" />;
    case "pdf":
      return <File size={14} className="text-red-500" />;
    case "link":
      return <Link2 size={14} className="text-blue-500" />;
    case "checklist":
      return <CheckSquare size={14} className="text-green-500" />;
    case "faq":
      return <HelpCircle size={14} className="text-orange-500" />;
    case "arquivo":
      return <UploadCloud size={14} className="text-gray-500" />;
    default:
      return <FileText size={14} className="text-gray-500" />;
  }
};

// Validar URL
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Extrair ID do YouTube
const extractYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ============================================
// COMPONENTES
// ============================================

// Item da lista hierárquica
interface HierarchyItemProps {
  item: RoteiroOperacional;
  children: RoteiroOperacional[];
  level: number;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
  onEdit: (item: RoteiroOperacional) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onPublish: (id: number) => void;
  onArchive: (id: number) => void;
  onToggleStatus: (id: number) => void;
  estruturaComercial: EstruturaComercial[];
}

const HierarchyItem: React.FC<HierarchyItemProps> = ({
  item,
  children,
  level,
  expandedIds,
  toggleExpand,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onToggleStatus,
  estruturaComercial,
}) => {
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(item.id);
  const nivelColor = getNivelColor(item.nivel);

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => hasChildren && toggleExpand(item.id)}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-6 h-6 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Ícone do nível */}
        <div className="flex-shrink-0">{getNivelIcon(item.nivel)}</div>

        {/* Nome e informações */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium text-white truncate">{item.nome}</span>
          
          {/* Badge de tipo */}
          {item.nivel === "roteiro" && item.tipo && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {item.tipo}
            </span>
          )}
          
          {/* Badge de formato */}
          {item.formato_conteudo && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {getFormatoIcon(item.formato_conteudo)}
              {item.formato_conteudo}
            </span>
          )}
          
          {/* Badge de obrigatório */}
          {item.obrigatorio && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
              <AlertTriangle size={10} />
              Obrigatório
            </span>
          )}
          
          {/* Badge de status publicação */}
          {item.status_publicacao && item.nivel === "roteiro" && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status_publicacao)}`}>
              {item.status_publicacao}
            </span>
          )}
          
          {/* Badge de prioridade */}
          {item.prioridade && item.nivel === "roteiro" && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPrioridadeColor(item.prioridade)}`}>
              {item.prioridade}
            </span>
          )}
        </div>

        {/* Contador de filhos */}
        {hasChildren && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {children.length}
          </span>
        )}

        {/* Ações */}
        {item.nivel === "roteiro" && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-300"
              title="Editar"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDuplicate(item.id)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-300"
              title="Duplicar"
            >
              <Copy size={14} />
            </button>
            {item.status_publicacao === "rascunho" && (
              <button
                onClick={() => onPublish(item.id)}
                className="p-1.5 hover:bg-green-100 rounded text-gray-500 hover:text-green-700"
                title="Publicar"
              >
                <Send size={14} />
              </button>
            )}
            {item.status_publicacao === "publicado" && (
              <button
                onClick={() => onArchive(item.id)}
                className="p-1.5 hover:bg-yellow-100 rounded text-gray-500 hover:text-yellow-700"
                title="Arquivar"
              >
                <Archive size={14} />
              </button>
            )}
            <button
              onClick={() => onToggleStatus(item.id)}
              className={`p-1.5 rounded ${item.ativo ? 'hover:bg-red-100 text-gray-500 hover:text-red-700' : 'hover:bg-green-100 text-gray-500 hover:text-green-700'}`}
              title={item.ativo ? "Inativar" : "Ativar"}
            >
              {item.ativo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 hover:bg-red-100 rounded text-gray-500 hover:text-red-700"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <HierarchyItem
              key={child.id}
              item={child}
              children={children.filter((c) => c.parent_id === child.id)}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onPublish={onPublish}
              onArchive={onArchive}
              onToggleStatus={onToggleStatus}
              estruturaComercial={estruturaComercial}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENT PRINCIPAL
// ============================================

export const RoteirosOperacionaisPage: React.FC = () => {
  const {
    roteirosOperacionais,
    setRoteirosOperacionais,
    addRoteiroOperacional,
    updateRoteiroOperacional,
    deleteRoteiroOperacional,
    toggleRoteiroOperacionalStatus,
    duplicateRoteiroOperacional,
    publishRoteiroOperacional,
    archiveRoteiroOperacional,
    exportRoteirosOperacionais,
    importRoteirosOperacionais,
    estruturaComercial,
  } = useAppStore();

  // Estados
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoteiroOperacional | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentNivel, setParentNivel] = useState<RoteiroOperacionalNivel | null>(null);

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [filtroFormato, setFiltroFormato] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroObrigatorio, setFiltroObrigatorio] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("");

  // Estado do FilterDrawer
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<RoteiroOperacional>>({
    nivel: "categoria",
    nome: "",
    codigo: "",
    descricao: "",
    ativo: 1,
    status_publicacao: "rascunho",
  });

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Se não houver dados, criar estrutura inicial
      if (!roteirosOperacionais || roteirosOperacionais.length === 0) {
        const now = Date.now();
        const initialData: RoteiroOperacional[] = [];
        let id = 1;

        // Criar categorias
        const categorias = [
          { nome: "Crédito", id: id++ },
          { nome: "Energia", id: id++ },
          { nome: "Seguros", id: id++ },
          { nome: "Consórcios", id: id++ },
          { nome: "Financeiro", id: id++ },
          { nome: "Comercial", id: id++ },
          { nome: "Operacional", id: id++ },
          { nome: "Institucional", id: id++ },
          { nome: "Compliance", id: id++ },
        ];

        categorias.forEach((cat) => {
          initialData.push({
            id: cat.id,
            nivel: "categoria",
            nome: cat.nome,
            ativo: 1,
            created_at: now,
            updated_at: now,
          });
        });

        // Criar tipos para cada categoria
        const tiposPorCategoria = [
          { categoria: "Crédito", tipos: ["Treinamento", "Comunicado", "Roteiro de Vendas", "Script de Atendimento", "Procedimento Operacional", "Manual"] },
          { categoria: "Energia", tipos: ["Treinamento", "Comunicado", "Roteiro de Vendas", "Procedimento Operacional", "Manual"] },
          { categoria: "Seguros", tipos: ["Treinamento", "Comunicado", "Roteiro de Vendas", "Procedimento Operacional", "Manual"] },
          { categoria: "Consórcios", tipos: ["Treinamento", "Comunicado", "Roteiro de Vendas", "Procedimento Operacional", "Manual"] },
          { categoria: "Financeiro", tipos: ["Treinamento", "Comunicado", "Procedimento Operacional", "Manual"] },
          { categoria: "Comercial", tipos: ["Treinamento", "Comunicado", "Roteiro de Vendas", "Script de Atendimento"] },
          { categoria: "Operacional", tipos: ["Treinamento", "Comunicado", "Procedimento Operacional", "Manual", "Checklist"] },
          { categoria: "Institucional", tipos: ["Manual", "FAQ", "Política"] },
          { categoria: "Compliance", tipos: ["Política", "Procedimento Operacional", "Checklist"] },
        ];

        tiposPorCategoria.forEach(({ categoria, tipos }) => {
          const catItem = initialData.find((i) => i.nome === categoria);
          if (catItem) {
            tipos.forEach((tipo) => {
              initialData.push({
                id: id++,
                parent_id: catItem.id,
                nivel: "tipo_conteudo",
                nome: tipo,
                categoria: categoria,
                ativo: 1,
                created_at: now,
                updated_at: now,
              });
            });
          }
        });

        // Criar origens para cada tipo
        const origens = ["FINQZ Interno", "Banco", "Promotora", "Comercializadora"];
        
        initialData.filter(i => i.nivel === "tipo_conteudo").forEach((tipoItem) => {
          origens.forEach((origem) => {
            initialData.push({
              id: id++,
              parent_id: tipoItem.id,
              nivel: "origem",
              nome: origem,
              tipo: tipoItem.nome,
              origem_tipo: origem === "FINQZ Interno" ? "finqz_interno" : 
                           origem === "Banco" ? "banco" :
                           origem === "Promotora" ? "promotora" : "comercializadora",
              categoria: tipoItem.categoria,
              ativo: 1,
              created_at: now,
              updated_at: now,
            });
          });
        });

        setRoteirosOperacionais(initialData);
        
        // Expandir todas as categorias inicialmente
        const allIds = new Set(initialData.map(i => i.id));
        setExpandedIds(allIds);
      }
      
      setLoading(false);
    };

    loadData();
  }, []);

  // Toggle expansão
  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!roteirosOperacionais || roteirosOperacionais.length === 0) return [];
    
    let data = [...roteirosOperacionais];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.nome?.toLowerCase().includes(query) ||
        item.codigo?.toLowerCase().includes(query) ||
        item.descricao?.toLowerCase().includes(query) ||
        item.resumo?.toLowerCase().includes(query) ||
        item.conteudo?.toLowerCase().includes(query) ||
        item.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Filtros adicionais
    if (filtroCategoria) {
      data = data.filter((item) => item.categoria === filtroCategoria);
    }
    if (filtroTipo) {
      data = data.filter((item) => item.tipo === filtroTipo);
    }
    if (filtroOrigem) {
      data = data.filter((item) => item.origem_tipo === filtroOrigem);
    }
    if (filtroFormato) {
      data = data.filter((item) => item.formato_conteudo === filtroFormato);
    }
    if (filtroStatus) {
      data = data.filter((item) => item.status_publicacao === filtroStatus);
    }
    if (filtroPrioridade) {
      data = data.filter((item) => item.prioridade === filtroPrioridade);
    }
    if (filtroObrigatorio === "sim") {
      data = data.filter((item) => item.obrigatorio === true);
    }
    if (filtroAtivo === "sim") {
      data = data.filter((item) => item.ativo === 1);
    } else if (filtroAtivo === "nao") {
      data = data.filter((item) => item.ativo === 0);
    }

    return data;
  }, [roteirosOperacionais, searchQuery, filtroCategoria, filtroTipo, filtroOrigem, filtroFormato, filtroStatus, filtroPrioridade, filtroObrigatorio, filtroAtivo]);

  // Obter itens raiz (categorias)
  const rootItems = useMemo(() => {
    return filteredData.filter((item) => !item.parent_id);
  }, [filteredData]);

  // Obter filhos de um item
  const getChildren = useCallback((parentId: number) => {
    return filteredData.filter((item) => item.parent_id === parentId);
  }, [filteredData]);

  // Cards superiores
  const cards = useMemo(() => {
    if (!roteirosOperacionais || roteirosOperacionais.length === 0) {
      return {
        total: 0,
        publicados: 0,
        rascunhos: 0,
        arquivados: 0,
        obrigatorios: 0,
        videos: 0,
        pdfs: 0,
        vencendo: 0,
        inativos: 0,
      };
    }

    const roteiros = roteirosOperacionais;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return {
      total: roteiros.length,
      publicados: roteiros.filter((r) => r.status_publicacao === "publicado").length,
      rascunhos: roteiros.filter((r) => r.status_publicacao === "rascunho").length,
      arquivados: roteiros.filter((r) => r.status_publicacao === "arquivado").length,
      obrigatorios: roteiros.filter((r) => r.obrigatorio).length,
      videos: roteiros.filter((r) => r.formato_conteudo === "video").length,
      pdfs: roteiros.filter((r) => r.formato_conteudo === "pdf" || r.formato_conteudo === "arquivo").length,
      vencendo: roteiros.filter((r) => r.validade_fim && new Date(r.validade_fim).getTime() - now < thirtyDays && new Date(r.validade_fim).getTime() > now).length,
      inativos: roteiros.filter((r) => r.ativo === 0).length,
    };
  }, [roteirosOperacionais]);

  // Abrir modal para criar novo item
  const handleNewItem = (pId?: number, pNivel?: RoteiroOperacionalNivel) => {
    setEditingItem(null);
    setParentId(pId || null);
    setParentNivel(pNivel || null);
    
    let nivel: RoteiroOperacionalNivel = "categoria";
    let parentNome = "";
    
    if (pId && pNivel) {
      const parent = roteirosOperacionais?.find((r) => r.id === pId);
      parentNome = parent?.nome || "";
      
      switch (pNivel) {
        case "categoria":
          nivel = "tipo_conteudo";
          break;
        case "tipo_conteudo":
          nivel = "origem";
          break;
        case "origem":
          nivel = "roteiro";
          break;
      }
    }

    setFormData({
      nivel,
      parent_id: pId || undefined,
      nome: "",
      codigo: "",
      descricao: "",
      ativo: 1,
      status_publicacao: "rascunho",
    });
    setShowModal(true);
  };

  // Abrir modal para editar item
  const handleEdit = (item: RoteiroOperacional) => {
    setEditingItem(item);
    setParentId(item.parent_id || null);
    setParentNivel(item.nivel);
    setFormData({ ...item });
    setShowModal(true);
  };

  // Salvar item
  const handleSave = () => {
    if (!formData.nome) return;

    const now = Date.now();

    if (editingItem) {
      // Atualizar existente
      updateRoteiroOperacional(editingItem.id, {
        ...formData,
        updated_at: now,
      });
    } else {
      // Criar novo
      const maxId = Math.max(...(roteirosOperacionais || []).map((r) => r.id), 0);
      addRoteiroOperacional({
        id: maxId + 1,
        ...formData,
        ativo: formData.ativo || 1,
        version: 1,
        created_at: now,
        updated_at: now,
      } as RoteiroOperacional);
    }

    setShowModal(false);
  };

  // Excluir item
  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteRoteiroOperacional(id);
    }
  };

  // Duplicar item
  const handleDuplicate = (id: number) => {
    duplicateRoteiroOperacional(id);
  };

  // Publicar item
  const handlePublish = (id: number) => {
    publishRoteiroOperacional(id);
  };

  // Arquivar item
  const handleArchive = (id: number) => {
    archiveRoteiroOperacional(id);
  };

  // Alternar status
  const handleToggleStatus = (id: number) => {
    toggleRoteiroOperacionalStatus(id);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (!roteirosOperacionais || roteirosOperacionais.length === 0) return;

    const headers = [
      "nivel",
      "parent_nome",
      "nome",
      "codigo",
      "descricao",
      "categoria",
      "tipo",
      "origem_tipo",
      "origem_nome",
      "formato_conteudo",
      "url",
      "video_url",
      "prioridade",
      "obrigatorio",
      "validade_inicio",
      "validade_fim",
      "status_publicacao",
      "ativo",
    ];

    const rows = roteirosOperacionais.map((item) => {
      const parent = roteirosOperacionais.find((r) => r.id === item.parent_id);
      return [
        item.nivel,
        parent?.nome || "",
        item.nome,
        item.codigo || "",
        item.descricao || "",
        item.categoria || "",
        item.tipo || "",
        item.origem_tipo || "",
        item.origem_nome || "",
        item.formato_conteudo || "",
        item.url || "",
        item.video_url || "",
        item.prioridade || "",
        item.obrigatorio ? "sim" : "não",
        item.validade_inicio || "",
        item.validade_fim || "",
        item.status_publicacao || "",
        item.ativo,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `roteiros_operacionais_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Exportar JSON
  const handleExportJSON = () => {
    if (!roteirosOperacionais || roteirosOperacionais.length === 0) return;
    
    const blob = new Blob([JSON.stringify(roteirosOperacionais, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `roteiros_operacionais_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  // Baixar modelo CSV
  const handleDownloadTemplate = () => {
    const headers = [
      "nivel",
      "parent_nome",
      "nome",
      "codigo",
      "descricao",
      "categoria",
      "tipo",
      "origem_tipo",
      "origem_nome",
      "formato_conteudo",
      "url",
      "video_url",
      "prioridade",
      "obrigatorio",
      "validade_inicio",
      "validade_fim",
      "status_publicacao",
      "ativo",
    ];

    const exampleRows = [
      ["categoria", "", "Crédito", "CRD001", "Categoria de Crédito", "Crédito", "", "", "", "", "", "", "media", "não", "", "", "rascunho", "1"],
      ["tipo_conteudo", "Crédito", "Treinamento", "TRN001", "Treinamentos de Crédito", "Crédito", "Treinamento", "", "", "", "", "", "baixa", "não", "", "", "rascunho", "1"],
      ["origem", "Treinamento", "FINQZ Interno", "FIN001", "Treinamentos internos", "Crédito", "Treinamento", "finqz_interno", "FINQZ Interno", "", "", "", "baixa", "não", "", "", "rascunho", "1"],
    ];

    const csvContent = [headers.join(","), ...exampleRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_roteiros_operacionais.csv";
    link.click();
  };

  // Importar CSV (simples)
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split("\n");
      const headers = lines[0].split(",");
      
      const newItems: RoteiroOperacional[] = [];
      let maxId = Math.max(...(roteirosOperacionais || []).map((r) => r.id), 0);
      const now = Date.now();

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h.trim()] = values[idx]?.trim() || "";
        });

        // Encontrar parent_id pelo nome
        let parentId: number | undefined;
        if (row.parent_nome) {
          const parent = roteirosOperacionais?.find((r) => r.nome === row.parent_nome);
          parentId = parent?.id;
        }

        // Determinar nível
        let nivel: RoteiroOperacionalNivel = "roteiro";
        if (row.nivel === "categoria") nivel = "categoria";
        else if (row.nivel === "tipo_conteudo") nivel = "tipo_conteudo";
        else if (row.nivel === "origem") nivel = "origem";

        newItems.push({
          id: ++maxId,
          parent_id: parentId,
          nivel,
          nome: row.nome || "",
          codigo: row.codigo,
          descricao: row.descricao,
          categoria: row.categoria,
          tipo: row.tipo,
          origem_tipo: row.origem_tipo as OrigemTipo,
          origem_nome: row.origem_nome,
          formato_conteudo: row.formato_conteudo as FormatoConteudo,
          url: row.url,
          video_url: row.video_url,
          prioridade: row.prioridade as Prioridade,
          obrigatorio: row.obrigatorio === "sim",
          validade_inicio: row.validade_inicio || undefined,
          validade_fim: row.validade_fim || undefined,
          status_publicacao: (row.status_publicacao || "rascunho") as StatusPublicacao,
          ativo: row.ativo === "1" || row.ativo === "true" ? 1 : 0,
          created_at: now,
          updated_at: now,
        });
      }

      if (newItems.length > 0) {
        importRoteirosOperacionais(newItems);
        alert(`Importados ${newItems.length} registros com sucesso!`);
      }
    };
    reader.readAsText(file);
    
    // Limpar input
    event.target.value = "";
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchQuery("");
    setFiltroCategoria("");
    setFiltroTipo("");
    setFiltroOrigem("");
    setFiltroFormato("");
    setFiltroStatus("");
    setFiltroPrioridade("");
    setFiltroObrigatorio("");
    setFiltroAtivo("");
  };

  // Renderizar modal de formulário
  const renderFormModal = () => {
    const nivel = formData.nivel || "categoria";
    const isRoteiro = nivel === "roteiro";

    return (
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? `Editar ${nivel.replace("_", " ")}` : `Novo ${nivel.replace("_", " ")}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Nível (apenas para visualização/criação) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nível
            </label>
            <Select
              value={nivel}
              onChange={(e) => setFormData({ ...formData, nivel: e.target.value as RoteiroOperacionalNivel })}
              disabled={!!editingItem}
              options={[
                { value: "categoria", label: "Categoria" },
                { value: "tipo_conteudo", label: "Tipo de Conteúdo" },
                { value: "origem", label: "Origem" },
                { value: "roteiro", label: "Roteiro / Material" },
              ]}
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome *
            </label>
            <Input
              value={formData.nome || ""}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome"
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código
            </label>
            <Input
              value={formData.codigo || ""}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: CRD001"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descrição
            </label>
            <TextArea
              value={formData.descricao || ""}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Digite a descrição"
              rows={3}
            />
          </div>

          {/* Campos específicos para roteiro */}
          {isRoteiro && (
            <>
              {/* Resumo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Resumo
                </label>
                <Input
                  value={formData.resumo || ""}
                  onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                  placeholder="Resumo do conteúdo"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Categoria
                </label>
                <Select
                  value={formData.categoria || ""}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...CATEGORIAS.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>

              {/* Tipo de conteúdo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Conteúdo
                </label>
                <Select
                  value={formData.tipo || ""}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...TIPOS_CONTEUDO.map((t) => ({ value: t, label: t })),
                  ]}
                />
              </div>

              {/* Origem tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Origem
                </label>
                <Select
                  value={formData.origem_tipo || ""}
                  onChange={(e) => setFormData({ ...formData, origem_tipo: e.target.value as OrigemTipo })}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...ORIGENS_TIPO.map((o) => ({ value: o.value, label: o.label })),
                  ]}
                />
              </div>

              {/* Origem nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Origem
                </label>
                <Input
                  value={formData.origem_nome || ""}
                  onChange={(e) => setFormData({ ...formData, origem_nome: e.target.value })}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              {/* Formato do conteúdo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Formato do Conteúdo
                </label>
                <Select
                  value={formData.formato_conteudo || ""}
                  onChange={(e) => setFormData({ ...formData, formato_conteudo: e.target.value as FormatoConteudo })}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...FORMATOS_CONTEUDO.map((f) => ({ value: f.value, label: f.label })),
                  ]}
                />
              </div>

              {/* Campos para vídeo */}
              {formData.formato_conteudo === "video" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL do Vídeo
                    </label>
                    <Input
                      value={formData.video_url || ""}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Provedor
                    </label>
                    <Select
                      value={formData.video_provider || ""}
                      onChange={(e) => setFormData({ ...formData, video_provider: e.target.value as VideoProvider })}
                      options={[
                        { value: "", label: "Selecione..." },
                        ...VIDEO_PROVIDERS.map((v) => ({ value: v.value, label: v.label })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL da Thumbnail
                    </label>
                    <Input
                      value={formData.thumbnail_url || ""}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="URL da imagem de capa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Duração (segundos)
                    </label>
                    <Input
                      type="number"
                      value={formData.duracao_segundos || ""}
                      onChange={(e) => setFormData({ ...formData, duracao_segundos: parseInt(e.target.value) || undefined })}
                      placeholder="Duração em segundos"
                    />
                  </div>
                </>
              )}

              {/* Campos para link */}
              {formData.formato_conteudo === "link" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    URL
                  </label>
                  <Input
                    value={formData.url || ""}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Campos para PDF/Arquivo */}
              {(formData.formato_conteudo === "pdf" || formData.formato_conteudo === "arquivo") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nome do Arquivo
                    </label>
                    <Input
                      value={formData.arquivo_nome || ""}
                      onChange={(e) => setFormData({ ...formData, arquivo_nome: e.target.value })}
                      placeholder="Nome do arquivo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL do Arquivo
                    </label>
                    <Input
                      value={formData.arquivo_url || ""}
                      onChange={(e) => setFormData({ ...formData, arquivo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tipo do Arquivo
                    </label>
                    <Input
                      value={formData.arquivo_tipo || ""}
                      onChange={(e) => setFormData({ ...formData, arquivo_tipo: e.target.value })}
                      placeholder="Ex: application/pdf"
                    />
                  </div>
                </>
              )}

              {/* Conteúdo (texto) */}
              {(formData.formato_conteudo === "texto" || !formData.formato_conteudo) && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Conteúdo
                  </label>
                  <TextArea
                    value={formData.conteudo || ""}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    placeholder="Digite o conteúdo..."
                    rows={6}
                  />
                </div>
              )}

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Prioridade
                </label>
                <Select
                  value={formData.prioridade || ""}
                  onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as Prioridade })}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...PRIORIDADES.map((p) => ({ value: p.value, label: p.label })),
                  ]}
                />
              </div>

              {/* Obrigatório */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="obrigatorio"
                  checked={formData.obrigatorio || false}
                  onChange={(e) => setFormData({ ...formData, obrigatorio: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="obrigatorio" className="text-sm text-gray-300">
                  Conteúdo obrigatório
                </label>
              </div>

              {/* Validade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Validade Início
                  </label>
                  <Input
                    type="date"
                    value={formData.validade_inicio || ""}
                    onChange={(e) => setFormData({ ...formData, validade_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Validade Fim
                  </label>
                  <Input
                    type="date"
                    value={formData.validade_fim || ""}
                    onChange={(e) => setFormData({ ...formData, validade_fim: e.target.value })}
                  />
                </div>
              </div>

              {/* Status publicação */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status de Publicação
                </label>
                <Select
                  value={formData.status_publicacao || "rascunho"}
                  onChange={(e) => setFormData({ ...formData, status_publicacao: e.target.value as StatusPublicacao })}
                  options={STATUS_PUBLICACAO.map((s) => ({ value: s.value, label: s.label }))}
                />
              </div>

              {/* Vínculo com Estrutura Comercial */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Vincular à Estrutura Comercial
                </label>
                <Select
                  value={formData.relacionado_estrutura_id?.toString() || ""}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    setFormData({ 
                      ...formData, 
                      relacionado_estrutura_id: isNaN(id) ? undefined : id 
                    });
                  }}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...(estruturaComercial || []).map((ec) => ({ 
                      value: ec.id.toString(), 
                      label: `${ec.nivel}: ${ec.nome}` 
                    })),
                  ]}
                />
              </div>
            </>
          )}

          {/* Ativo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo === 1}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked ? 1 : 0 })}
              className="rounded border-gray-300"
            />
            <label htmlFor="ativo" className="text-sm text-gray-300">
              Ativo
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingItem ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  // Se estiver carregando
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000dff]"></div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3">
      {/* Header Padronizado */}
      <PageHeader
        onSearch={setSearchQuery}
        onRefresh={() => {}}
        onCreate={() => handleNewItem()}
        createLabel="Novo Item"
        // Ativar FilterDrawer (padrão premium)
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={[
          { label: 'Categoria', key: 'categoria', type: 'select', options: [
            { label: 'Treinamento', value: 'treinamento' },
            { label: 'Comunicado', value: 'comunicado' },
            { label: 'Script', value: 'script' },
            { label: 'Material', value: 'material' },
          ], placeholder: 'Todas as categorias' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Publicado', value: 'publicado' },
            { label: 'Rascunho', value: 'rascunho' },
          ], placeholder: 'Todos os status' },
          { label: 'Formato', key: 'formato', type: 'select', options: [
            { label: 'Vídeo', value: 'video' },
            { label: 'PDF', value: 'pdf' },
            { label: 'Texto', value: 'texto' },
          ], placeholder: 'Todos os formatos' },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'categoria') setFiltroCategoria(value)
          if (key === 'status') setFiltroStatus(value)
          if (key === 'formato') setFiltroFormato(value)
        }}
      />

      {/* Cards superiores */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <KpiCard
          label="Total"
          value={cards.total}
          icon={<BookOpen size={18} />}
          variant="blue"
        />
        <KpiCard
          label="Publicados"
          value={cards.publicados}
          icon={<CheckSquare size={18} />}
          variant="green"
        />
        <KpiCard
          label="Rascunhos"
          value={cards.rascunhos}
          icon={<Edit size={18} />}
          variant="gray"
        />
        <KpiCard
          label="Arquivados"
          value={cards.arquivados}
          icon={<Archive size={18} />}
          variant="orange"
        />
        <KpiCard
          label="Obrigatórios"
          value={cards.obrigatorios}
          icon={<AlertTriangle size={18} />}
          variant="red"
        />
        <KpiCard
          label="Vídeos"
          value={cards.videos}
          icon={<Video size={18} />}
          variant="purple"
        />
        <KpiCard
          label="PDFs/Arquivos"
          value={cards.pdfs}
          icon={<File size={18} />}
          variant="red"
        />
        <KpiCard
          label="Vencendo"
          value={cards.vencendo}
          icon={<Clock size={18} />}
          variant="orange"
        />
        <KpiCard
          label="Inativos"
          value={cards.inativos}
          icon={<X size={18} />}
          variant="gray"
        />
      </div>

      {/* Barra de busca e filtros */}
      <Card className="p-3">
        <div className="space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, código, descrição, tags..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              options={[
                { value: "", label: "Todas as categorias" },
                ...CATEGORIAS.map((c) => ({ value: c, label: c })),
              ]}
              className="w-36 h-9 text-sm"
            />
            <Select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              options={[
                { value: "", label: "Todos os tipos" },
                ...TIPOS_CONTEUDO.map((t) => ({ value: t, label: t })),
              ]}
              className="w-36 h-9 text-sm"
            />
            <Select
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
              options={[
                { value: "", label: "Todas as origens" },
                ...ORIGENS_TIPO.map((o) => ({ value: o.value, label: o.label })),
              ]}
              className="w-36 h-9 text-sm"
            />
            <Select
              value={filtroFormato}
              onChange={(e) => setFiltroFormato(e.target.value)}
              options={[
                { value: "", label: "Todos os formatos" },
                ...FORMATOS_CONTEUDO.map((f) => ({ value: f.value, label: f.label })),
              ]}
              className="w-36 h-9 text-sm"
            />
            <Select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              options={[
                { value: "", label: "Todos os status" },
                ...STATUS_PUBLICACAO.map((s) => ({ value: s.value, label: s.label })),
              ]}
              className="w-32 h-9 text-sm"
            />
            <Select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              options={[
                { value: "", label: "Todas as prioridades" },
                ...PRIORIDADES.map((p) => ({ value: p.value, label: p.label })),
              ]}
              className="w-32 h-9 text-sm"
            />
            <Select
              value={filtroObrigatorio}
              onChange={(e) => setFiltroObrigatorio(e.target.value)}
              options={[
                { value: "", label: "Obrigatório?" },
                { value: "sim", label: "Sim" },
              ]}
              className="w-32"
            />
            <Select
              value={filtroAtivo}
              onChange={(e) => setFiltroAtivo(e.target.value)}
              options={[
                { value: "", label: "Status" },
                { value: "sim", label: "Ativos" },
                { value: "nao", label: "Inativos" },
              ]}
              className="w-32"
            />
            <Button variant="secondary" onClick={clearFilters} icon={<X size={14} />}>
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Ações em lote */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            icon={<FileSpreadsheet size={16} />}
            disabled={!roteirosOperacionais || roteirosOperacionais.length === 0}
          >
            Exportar CSV
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportJSON}
            icon={<Download size={16} />}
            disabled={!roteirosOperacionais || roteirosOperacionais.length === 0}
          >
            Exportar JSON
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadTemplate}
            icon={<FileText size={16} />}
          >
            Modelo CSV
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleImport}
              className="hidden"
            />
            <span className="flex items-center gap-2 px-4 py-2 bg-[#111827] border rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-50">
              <Upload size={16} />
              Importar
            </span>
          </label>
        </div>
      </div>

      {/* Lista hierárquica */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {rootItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText size={48} className="mb-4 text-gray-300" />
              <p>Nenhum roteiro operacional encontrado</p>
              <Button
                variant="primary"
                onClick={() => handleNewItem()}
                className="mt-4"
                icon={<Plus size={16} />}
              >
                Criar primeiro item
              </Button>
            </div>
          ) : (
            rootItems.map((item) => (
              <HierarchyItem
                key={item.id}
                item={item}
                children={getChildren(item.id)}
                level={0}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onPublish={handlePublish}
                onArchive={handleArchive}
                onToggleStatus={handleToggleStatus}
                estruturaComercial={estruturaComercial || []}
              />
            ))
          )}
        </div>
      </Card>

      {/* Modal de formulário */}
      {renderFormModal()}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        fields={[
          { key: 'categoria', label: 'Categoria', type: 'select', options: [
            { label: 'Todas', value: '' },
            { label: 'Operacional', value: 'operacional' },
            { label: 'Comercial', value: 'comercial' },
            { label: 'Financeiro', value: 'financeiro' },
            { label: 'Gestão', value: 'gestao' },
          ], placeholder: 'Todas as categorias' },
          { key: 'tipo', label: 'Tipo', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Texto', value: 'texto' },
            { label: 'Vídeo', value: 'video' },
            { label: 'PDF', value: 'pdf' },
            { label: 'Link', value: 'link' },
            { label: 'Checklist', value: 'checklist' },
            { label: 'FAQ', value: 'faq' },
          ], placeholder: 'Todos os tipos' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Rascunho', value: 'rascunho' },
            { label: 'Publicados', value: 'publicado' },
            { label: 'Arquivados', value: 'arquivado' },
          ], placeholder: 'Todos os status' },
          { key: 'prioridade', label: 'Prioridade', type: 'select', options: [
            { label: 'Todas', value: '' },
            { label: 'Alta', value: 'alta' },
            { label: 'Média', value: 'media' },
            { label: 'Baixa', value: 'baixa' },
          ], placeholder: 'Todas as prioridades' },
          { key: 'obrigatorio', label: 'Obrigatório', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' },
          ], placeholder: 'Todos' },
          { key: 'ativo', label: 'Ativo', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' },
          ], placeholder: 'Todos' },
        ]}
        values={{
          categoria: filtroCategoria,
          tipo: filtroTipo,
          origem: filtroOrigem,
          formato: filtroFormato,
          status: filtroStatus,
          prioridade: filtroPrioridade,
          obrigatorio: filtroObrigatorio,
          ativo: filtroAtivo,
        }}
        onChange={(key, value) => {
          if (key === 'categoria') setFiltroCategoria(value)
          if (key === 'tipo') setFiltroTipo(value)
          if (key === 'origem') setFiltroOrigem(value)
          if (key === 'formato') setFiltroFormato(value)
          if (key === 'status') setFiltroStatus(value)
          if (key === 'prioridade') setFiltroPrioridade(value)
          if (key === 'obrigatorio') setFiltroObrigatorio(value)
          if (key === 'ativo') setFiltroAtivo(value)
        }}
        onApply={() => setOpenFilterDrawer(false)}
        onClear={clearFilters}
      />
    </div>
  );
};

export default RoteirosOperacionaisPage;
