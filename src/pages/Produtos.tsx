// FINQZ PRO - Produtos Page (Refatorado)
// - Lista apenas (sem Kanban)
// - Filtros funcionais
// - Modal organizado por seções
// - Estrutura completa (preparada para API/Integrações/Automação)
// - Exportação completa

import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Percent,
  Link2,
  Bot,
  Calendar,
  BadgeCheck,
  BadgeAlert,
  Building2,
  Users,
  Table2,
  FileText,
} from "lucide-react";

import useAppStore from "../store";
import type { Produto as ProdutoBase, Pipeline } from "../types";

import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  TextArea,
  Modal,
  Toggle,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";

type ProdutoExtended = ProdutoBase & {
  // Classificações / vínculo comercial
  tipo_produto?: string;
  banco?: string;
  promotora?: string;
  tabela?: string;
  convenio?: string;

  // Condições comerciais (além dos campos já existentes em ProdutoBase)
  taxa_juros_anual?: number;
  coeficiente?: number;
  parcela_minima?: number;
  parcela_maxima?: number;

  comissao_banco?: number;
  comissao_promotora?: number;
  comissao_total?: number;
  comissao_fixa?: number;

  validade_inicio?: string; // YYYY-MM-DD
  validade_fim?: string; // YYYY-MM-DD

  // API / Integração futura
  external_id?: string;
  api_source?: string;
  integration_id?: string;
  sync_status?: string; // ex: pending | synced | error | never
  last_sync_at?: string; // ISO/Date string

  // Campos extras de integração
  status_integracao?: string; // ex: ativo | inativo | pendente | erro
  origem_integracao?: string; // ex: zenvia | banco_x | planilha | manual
  integracao_notas?: string;

  // Automação futura
  automation_enabled?: boolean;
  automation_rules?: string; // JSON/texto
  automation_triggers?: string; // JSON/texto
  automation_notes?: string;
};

type FiltersState = {
  status: "" | "1" | "0";
  categoria: string;
  tipo_produto: string;
  banco: string;
  promotora: string;
  tabela: string;
  convenio: string;
};

type ProdutoFormState = {
  // Básico
  nome: string;
  descricao: string;
  ativo: boolean;
  categoria: string;
  tipo_produto: string;
  pipeline: string;

  // Banco / Promotora
  banco: string;
  promotora: string;

  // Tabela / Convênio
  tabela: string;
  convenio: string;

  // Condições comerciais
  taxa_juros: string;
  taxa_juros_anual: string;
  coeficiente: string;

  prazo_minimo: string;
  prazo_maximo: string;

  valor_minimo: string;
  valor_maximo: string;

  parcela_minima: string;
  parcela_maxima: string;

  comissao_banco: string;
  comissao_promotora: string;
  comissao_total: string;
  comissao_fixa: string;

  validade_inicio: string;
  validade_fim: string;

  // Documentos / Requisitos
  documentos: string;
  requisitos: string;
  observacoes: string;

  // Integração / API
  external_id: string;
  api_source: string;
  integration_id: string;
  sync_status: string;
  last_sync_at: string;
  status_integracao: string;
  origem_integracao: string;
  integracao_notas: string;

  // Automação futura
  automation_enabled: boolean;
  automation_rules: string;
  automation_triggers: string;
  automation_notes: string;
};

const normalize = (v?: string) => (v || "").toLowerCase().trim();

const toOptionalNumber = (v: string): number | undefined => {
  const raw = v?.trim();
  if (!raw) return undefined;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};

const toOptionalInt = (v: string): number | undefined => {
  const raw = v?.trim();
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
};

const formatCurrency = (v?: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "-";

const formatPercent = (v?: number, decimals = 2) =>
  typeof v === "number" && Number.isFinite(v) ? `${v.toFixed(decimals)}%` : "-";

const buildPipelineOptions = (pipelines: Pipeline[]) => {
  const base = [{ value: "default", label: "Padrão (default)" }];
  const dynamic = (pipelines || []).map((p) => ({ value: p.id, label: p.nome }));
  const merged = [...base, ...dynamic];

  // remove duplicados
  const seen = new Set<string>();
  return merged.filter((o) => {
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  });
};

const getUniqueOptions = (values: Array<string | undefined | null>) => {
  const set = new Set(
    values.map((v) => (v || "").trim()).filter((v) => v.length > 0)
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
};

const createEmptyForm = (defaultPipeline = "default"): ProdutoFormState => ({
  nome: "",
  descricao: "",
  ativo: true,
  categoria: "",
  tipo_produto: "",
  pipeline: defaultPipeline,

  banco: "",
  promotora: "",

  tabela: "",
  convenio: "",

  taxa_juros: "",
  taxa_juros_anual: "",
  coeficiente: "",

  prazo_minimo: "",
  prazo_maximo: "",

  valor_minimo: "",
  valor_maximo: "",

  parcela_minima: "",
  parcela_maxima: "",

  comissao_banco: "",
  comissao_promotora: "",
  comissao_total: "",
  comissao_fixa: "",

  validade_inicio: "",
  validade_fim: "",

  documentos: "",
  requisitos: "",
  observacoes: "",

  external_id: "",
  api_source: "",
  integration_id: "",
  sync_status: "",
  last_sync_at: "",
  status_integracao: "",
  origem_integracao: "",
  integracao_notas: "",

  automation_enabled: false,
  automation_rules: "",
  automation_triggers: "",
  automation_notes: "",
});

export const ProdutosPage: React.FC = () => {
  const { produtos: produtosBase, addProduto, updateProduto, deleteProduto, toggleProdutoStatus, pipelines } =
    useAppStore();

  // Produtos podem conter campos extras (integração/automação) mesmo que o type global ainda não tenha todos.
  const produtos = produtosBase as ProdutoExtended[];

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FiltersState>({
    status: "",
    categoria: "",
    tipo_produto: "",
    banco: "",
    promotora: "",
    tabela: "",
    conveni: "",
  });
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoExtended | null>(null);

  const pipelineOptions = useMemo(() => buildPipelineOptions(pipelines || []), [pipelines]);

  const [form, setForm] = useState<ProdutoFormState>(() =>
    createEmptyForm(pipelineOptions?.[0]?.value || "default")
  );

  const filterOptions = useMemo(() => {
    return {
      categorias: getUniqueOptions(produtos.map((p) => p.categoria)),
      tipos: getUniqueOptions(produtos.map((p) => p.tipo_produto)),
      bancos: getUniqueOptions(produtos.map((p) => p.banco)),
      promotoras: getUniqueOptions(produtos.map((p) => p.promotora)),
      tabelas: getUniqueOptions(produtos.map((p) => p.tabela)),
      conveni: getUniqueOptions(produtos.map((p) => p.convenio)),
    };
  }, [produtos]);

  const filteredProdutos = useMemo(() => {
    const s = normalize(search);

    return (produtos || [])
      .filter((p) => {
        const matchesSearch =
          !s ||
          normalize(p.nome).includes(s) ||
          normalize(p.descricao).includes(s) ||
          normalize(p.categoria).includes(s) ||
          normalize(p.tipo_produto).includes(s) ||
          normalize(p.banco).includes(s) ||
          normalize(p.promotora).includes(s) ||
          normalize(p.tabela).includes(s) ||
          normalize(p.convenio).includes(s);

        const matchesStatus =
          !filters.status || String(p.ativo ?? "") === String(filters.status);

        const matchesCategoria =
          !filters.categoria || normalize(p.categoria) === normalize(filters.categoria);

        const matchesTipo =
          !filters.tipo_produto || normalize(p.tipo_produto) === normalize(filters.tipo_produto);

        const matchesBanco =
          !filters.banco || normalize(p.banco) === normalize(filters.banco);

        const matchesPromotora =
          !filters.promotora || normalize(p.promotora) === normalize(filters.promotora);

        const matchesTabela =
          !filters.tabela || normalize(p.tabela) === normalize(filters.tabela);

        const matchesConvenio =
          !filters.convenio || normalize(p.convenio) === normalize(filters.convenio);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategoria &&
          matchesTipo &&
          matchesBanco &&
          matchesPromotora &&
          matchesTabela &&
          matchesConvenio
        );
      })
      .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
  }, [produtos, search, filters]);

  const stats = useMemo(() => {
    const total = produtos.length;
    const ativos = produtos.filter((p) => p.ativo === 1).length;
    const inativos = total - ativos;

    const taxaMedia =
      total > 0
        ? produtos.reduce((acc, p) => acc + (p.taxa_juros ?? 0), 0) / total
        : 0;

    const comissaoMediaTotal =
      total > 0
        ? produtos.reduce((acc, p) => acc + (p.comissao_total ?? p.comissao ?? 0), 0) / total
        : 0;

    const integracaoPendente = produtos.filter((p) => {
      const sync = normalize(p.sync_status);
      const statusInt = normalize(p.status_integracao);
      return sync === "pending" || statusInt === "pendente" || statusInt === "erro";
    }).length;

    const automacoesAtivas = produtos.filter((p) => !!p.automation_enabled).length;

    return {
      total,
      ativos,
      inativos,
      taxaMedia,
      comissaoMediaTotal,
      integracaoPendente,
      automacoesAtivas,
    };
  }, [produtos]);

  const openCreate = () => {
    setEditingProduto(null);
    setForm(createEmptyForm(pipelineOptions?.[0]?.value || "default"));
    setShowModal(true);
  };

  const openEdit = (produto: ProdutoExtended) => {
    setEditingProduto(produto);
    setForm({
      nome: produto.nome || "",
      descricao: produto.descricao || "",
      ativo: produto.ativo === 1,
      categoria: produto.categoria || "",
      tipo_produto: produto.tipo_produto || "",
      pipeline: produto.pipeline || "default",

      banco: produto.banco || "",
      promotora: produto.promotora || "",

      tabela: produto.tabela || "",
      conveni: produto.convenio || "",

      taxa_juros: produto.taxa_juros != null ? String(produto.taxa_juros) : "",
      taxa_juros_anual:
        produto.taxa_juros_anual != null ? String(produto.taxa_juros_anual) : "",
      coeficiente: produto.coeficiente != null ? String(produto.coeficiente) : "",

      prazo_minimo: produto.prazo_minimo != null ? String(produto.prazo_minimo) : "",
      prazo_maximo: produto.prazo_maximo != null ? String(produto.prazo_maximo) : "",

      valor_minimo: produto.valor_minimo != null ? String(produto.valor_minimo) : "",
      valor_maximo: produto.valor_maximo != null ? String(produto.valor_maximo) : "",

      parcela_minima: produto.parcela_minima != null ? String(produto.parcela_minima) : "",
      parcela_maxima: produto.parcela_maxima != null ? String(produto.parcela_maxima) : "",

      comissao_banco: produto.comissao_banco != null ? String(produto.comissao_banco) : "",
      comissao_promotora:
        produto.comissao_promotora != null ? String(produto.comissao_promotora) : "",
      comissao_total: produto.comissao_total != null ? String(produto.comissao_total) : "",
      comissao_fixa: produto.comissao_fixa != null ? String(produto.comissao_fixa) : "",

      validade_inicio: produto.validade_inicio || "",
      validade_fim: produto.validade_fim || "",

      documentos: produto.documentos || "",
      requisitos: produto.requisitos || "",
      observacoes: produto.observacoes || "",

      external_id: produto.external_id || "",
      api_source: produto.api_source || "",
      integration_id: produto.integration_id || "",
      sync_status: produto.sync_status || "",
      last_sync_at: produto.last_sync_at || "",
      status_integracao: produto.status_integracao || "",
      origem_integracao: produto.origem_integracao || "",
      integracao_notas: produto.integracao_notas || "",

      automation_enabled: !!produto.automation_enabled,
      automation_rules: produto.automation_rules || "",
      automation_triggers: produto.automation_triggers || "",
      automation_notes: produto.automation_notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    const ok = window.confirm("Tem certeza que deseja excluir este produto?");
    if (!ok) return;
    deleteProduto(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();

    const payload: Partial<ProdutoExtended> = {
      // Básico
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      ativo: form.ativo ? 1 : 0,
      categoria: form.categoria.trim() || undefined,
      tipo_produto: form.tipo_produto.trim() || undefined,
      pipeline: form.pipeline || "default",

      // Banco / Promotora
      banco: form.banco.trim() || undefined,
      promotora: form.promotora.trim() || undefined,

      // Tabela / Convênio
      tabela: form.tabela.trim() || undefined,
      convenio: form.convenio.trim() || undefined,

      // Condições comerciais
      taxa_juros: toOptionalNumber(form.taxa_juros),
      taxa_juros_anual: toOptionalNumber(form.taxa_juros_anual),
      coeficiente: toOptionalNumber(form.coeficiente),

      prazo_minimo: toOptionalInt(form.prazo_minimo),
      prazo_maximo: toOptionalInt(form.prazo_maximo),

      valor_minimo: toOptionalNumber(form.valor_minimo),
      valor_maximo: toOptionalNumber(form.valor_maximo),

      parcela_minima: toOptionalNumber(form.parcela_minima),
      parcela_maxima: toOptionalNumber(form.parcela_maxima),

      comissao_banco: toOptionalNumber(form.comissao_banco),
      comissao_promotora: toOptionalNumber(form.comissao_promotora),
      comissao_total: toOptionalNumber(form.comissao_total),
      comissao_fixa: toOptionalNumber(form.comissao_fixa),

      validade_inicio: form.validade_inicio || undefined,
      validade_fim: form.validade_fim || undefined,

      // Documentos / Requisitos
      documentos: form.documentos.trim() || undefined,
      requisitos: form.requisitos.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,

      // API / Integração
      external_id: form.external_id.trim() || undefined,
      api_source: form.api_source.trim() || undefined,
      integration_id: form.integration_id.trim() || undefined,
      sync_status: form.sync_status.trim() || undefined,
      last_sync_at: form.last_sync_at.trim() || undefined,
      status_integracao: form.status_integracao.trim() || undefined,
      origem_integracao: form.origem_integracao.trim() || undefined,
      integracao_notas: form.integracao_notas.trim() || undefined,

      // Automação
      automation_enabled: form.automation_enabled,
      automation_rules: form.automation_rules.trim() || undefined,
      automation_triggers: form.automation_triggers.trim() || undefined,
      automation_notes: form.automation_notes.trim() || undefined,

      updated_at: now,
    };

    if (editingProduto) {
      // updateProduto tipado no store usa Partial<ProdutoBase>, então fazemos cast seguro.
      updateProduto(editingProduto.id, payload as unknown as Partial<ProdutoBase>);
    } else {
      const novo: ProdutoExtended = {
        id: now,
        nome: payload.nome || "Novo Produto",
        pipeline: payload.pipeline || "default",
        ativo: payload.ativo ?? 1,
        created_at: now,
        updated_at: now,
        ...payload,
      };

      // addProduto tipado no store usa ProdutoBase, mas ProdutoExtended é estruturalmente compatível.
      addProduto(novo as unknown as ProdutoBase);
    }

    setShowModal(false);
    setEditingProduto(null);
    setForm(createEmptyForm(pipelineOptions?.[0]?.value || "default"));
  };

  const exportColumns = useMemo(() => {
    // Exportação completa (todos os campos desta página)
    return [
      { key: "id", label: "ID" },
      { key: "nome", label: "Nome" },
      { key: "descricao", label: "Descrição" },
      { key: "ativo", label: "Ativo (1/0)" },
      { key: "categoria", label: "Categoria" },
      { key: "tipo_produto", label: "Tipo de produto" },
      { key: "pipeline", label: "Pipeline" },

      { key: "banco", label: "Banco" },
      { key: "promotora", label: "Promotora" },
      { key: "tabela", label: "Tabela" },
      { key: "convenio", label: "Convênio" },

      { key: "taxa_juros", label: "Taxa de juros (a.m.)" },
      { key: "taxa_juros_anual", label: "Taxa de juros (a.a.)" },
      { key: "coeficiente", label: "Coeficiente" },

      { key: "prazo_minimo", label: "Prazo mínimo (meses)" },
      { key: "prazo_maximo", label: "Prazo máximo (meses)" },

      { key: "valor_minimo", label: "Valor mínimo" },
      { key: "valor_maximo", label: "Valor máximo" },
      { key: "parcela_minima", label: "Parcela mínima" },
      { key: "parcela_maxima", label: "Parcela máxima" },

      { key: "comissao_banco", label: "Comissão banco (%)" },
      { key: "comissao_promotora", label: "Comissão promotora (%)" },
      { key: "comissao_total", label: "Comissão total (%)" },
      { key: "comissao_fixa", label: "Comissão fixa (R$)" },

      { key: "validade_inicio", label: "Validade início" },
      { key: "validade_fim", label: "Validade fim" },

      { key: "documentos", label: "Documentos" },
      { key: "requisitos", label: "Requisitos" },
      { key: "observacoes", label: "Observações" },

      { key: "external_id", label: "External ID" },
      { key: "api_source", label: "API Source" },
      { key: "integration_id", label: "Integration ID" },
      { key: "sync_status", label: "Sync Status" },
      { key: "last_sync_at", label: "Last Sync At" },
      { key: "status_integracao", label: "Status integração" },
      { key: "origem_integracao", label: "Origem integração" },
      { key: "integracao_notas", label: "Integração notas" },

      { key: "automation_enabled", label: "Automação habilitada" },
      { key: "automation_rules", label: "Automation rules" },
      { key: "automation_triggers", label: "Automation triggers" },
      { key: "automation_notes", label: "Automation notes" },

      { key: "created_at", label: "Criado em (timestamp)" },
      { key: "updated_at", label: "Atualizado em (timestamp)" },
    ];
  }, []);

  const headerFilters = useMemo(() => {
    return [
      {
        label: "Status",
        key: "status",
        type: "select" as const,
        placeholder: "Todos",
        options: [
          { label: "Ativo", value: "1" },
          { label: "Inativo", value: "0" },
        ],
      },
      {
        label: "Categoria",
        key: "categoria",
        type: "select" as const,
        placeholder: "Todas",
        options: filterOptions.categorias.map((v) => ({ label: v, value: v })),
      },
      {
        label: "Tipo de produto",
        key: "tipo_produto",
        type: "select" as const,
        placeholder: "Todos",
        options: filterOptions.tipos.map((v) => ({ label: v, value: v })),
      },
      {
        label: "Banco",
        key: "banco",
        type: "select" as const,
        placeholder: "Todos",
        options: filterOptions.bancos.map((v) => ({ label: v, value: v })),
      },
      {
        label: "Promotora",
        key: "promotora",
        type: "select" as const,
        placeholder: "Todas",
        options: filterOptions.promotoras.map((v) => ({ label: v, value: v })),
      },
      {
        label: "Tabela",
        key: "tabela",
        type: "select" as const,
        placeholder: "Todas",
        options: filterOptions.tabelas.map((v) => ({ label: v, value: v })),
      },
      {
        label: "Convênio",
        key: "convenio",
        type: "select" as const,
        placeholder: "Todos",
        options: filterOptions.conveni.map((v) => ({ label: v, value: v })),
      },
    ];
  }, [filterOptions]);

  return (
    <div className="space-y-6">
      <PageHeader
        // Sem Kanban: não passar view/setView
        onSearch={(v) => setSearch(v)}
        onRefresh={() => {
          // Futuro: recarregar via API
        }}
        onCreate={openCreate}
        createLabel="Novo Produto"
        // Ativar FilterDrawer (padrão premium)
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={headerFilters}
        filterValues={filters as unknown as Record<string, string>}
        onFilterChange={(key, value) => {
          setFilters((prev) => ({ ...prev, [key]: value } as FiltersState));
        }}
        exportData={filteredProdutos}
        exportColumns={exportColumns}
        exportFilename="produtos_finqz_pro"
      />

      {/* Cards / Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card className="border-[#1f2937]" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-xl font-semibold text-white">{stats.total}</div>
            </div>
          </div>
        </Card>

        <Card className="border-[#1f2937]" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-900/200/10 flex items-center justify-center">
              <BadgeCheck size={18} className="text-green-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Ativos</div>
              <div className="text-xl font-semibold text-white">{stats.ativos}</div>
            </div>
          </div>
        </Card>

        <Card className="border-[#1f2937]" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/200/10 flex items-center justify-center">
              <BadgeAlert size={18} className="text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Inativos</div>
              <div className="text-xl font-semibold text-white">{stats.inativos}</div>
            </div>
          </div>
        </Card>

        <Card className="border-[#1f2937]" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-900/200/10 flex items-center justify-center">
              <Percent size={18} className="text-yellow-700" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Taxa média (a.m.)</div>
              <div className="text-xl font-semibold text-white">
                {formatPercent(stats.taxaMedia, 2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-[#1f2937]" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/200/10 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-700" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Comissão média</div>
              <div className="text-xl font-semibold text-white">
                {formatPercent(stats.comissaoMediaTotal, 2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-[#1f2937]" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Link2 size={18} className="text-indigo-700" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Integração (pend/erro)</div>
              <div className="text-xl font-semibold text-white">
                {stats.integracaoPendente}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista (apenas) */}
      <Card className="border-[#1f2937]" padding="none">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <div className="text-sm text-slate-600">
              Exibindo <span className="font-semibold text-white">{filteredProdutos.length}</span>{" "}
              de <span className="font-semibold text-white">{produtos.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="info" className="rounded-full">
              <Bot size={14} className="mr-1" />
              Automações ativas: {stats.automacoesAtivas}
            </Badge>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Banco</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Promotora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tabela</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Convênio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Taxa (a.m.)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Prazo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Valores</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Comissão</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Integração</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProdutos.map((p) => {
                const prazo =
                  p.prazo_minimo != null || p.prazo_maximo != null
                    ? `${p.prazo_minimo ?? "-"} - ${p.prazo_maximo ?? "-"}`
                    : "-";

                const valores =
                  p.valor_minimo != null || p.valor_maximo != null
                    ? `${formatCurrency(p.valor_minimo)} → ${formatCurrency(p.valor_maximo)}`
                    : "-";

                const comissao = p.comissao_total ?? p.comissao;
                const integracaoLabel =
                  p.sync_status || p.status_integracao || (p.integration_id ? "configurada" : "-");

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {p.nome}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {p.descricao || "Sem descrição"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {p.categoria ? <Badge variant="info">{p.categoria}</Badge> : <span className="text-sm text-slate-500">-</span>}
                    </td>

                    <td className="px-4 py-3">
                      {p.tipo_produto ? (
                        <Badge variant="primary">{p.tipo_produto}</Badge>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-300">{p.banco || "-"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-300">{p.promotora || "-"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Table2 size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-300">{p.tabela || "-"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{p.convenio || "-"}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{formatPercent(p.taxa_juros, 2)}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{prazo}</span>
                      {prazo !== "-" ? <span className="text-xs text-slate-400"> meses</span> : null}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{valores}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatPercent(comissao, 2)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {integracaoLabel && integracaoLabel !== "-" ? (
                        <Badge
                          variant={
                            normalize(integracaoLabel) === "error" ||
                            normalize(integracaoLabel) === "erro"
                              ? "danger"
                              : normalize(integracaoLabel) === "pending" ||
                                normalize(integracaoLabel) === "pendente"
                              ? "warning"
                              : "success"
                          }
                        >
                          {integracaoLabel}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={p.ativo === 1}
                          onChange={() => toggleProdutoStatus(p.id)}
                          size="sm"
                        />
                        <span className="text-sm text-slate-300">
                          {p.ativo === 1 ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit size={16} />}
                          onClick={() => openEdit(p)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDelete(p.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProdutos.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={26} className="text-slate-300" />
                      <div className="text-sm font-semibold text-slate-300">
                        Nenhum produto encontrado
                      </div>
                      <div className="text-sm text-slate-500">
                        Ajuste os filtros ou crie um novo produto.
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="primary"
                          icon={<Plus size={16} />}
                          onClick={openCreate}
                        >
                          Novo Produto
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal (organizado por seções) */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduto ? "Editar Produto" : "Novo Produto"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Informações básicas */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Informações básicas</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do produto *"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Empréstimo Consignado"
                required
              />

              <Select
                label="Pipeline"
                value={form.pipeline}
                onChange={(e) => setForm((p) => ({ ...p, pipeline: e.target.value }))}
                placeholder=""
              >
                {pipelineOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Categoria"
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                placeholder=""
              >
                <option value="">Selecione...</option>
                {filterOptions.categorias.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>

              <Input
                label="Tipo de produto"
                value={form.tipo_produto}
                onChange={(e) => setForm((p) => ({ ...p, tipo_produto: e.target.value }))}
                placeholder="Ex: Consignado, FGTS, Cartão..."
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Descrição"
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descrição do produto..."
                />
              </div>

              <div className="md:col-span-2">
                <Toggle
                  checked={form.ativo}
                  onChange={(checked) => setForm((p) => ({ ...p, ativo: checked }))}
                  label={form.ativo ? "Produto ativo" : "Produto inativo"}
                />
              </div>
            </div>
          </Card>

          {/* Banco e promotora */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Banco e promotora</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Banco"
                value={form.banco}
                onChange={(e) => setForm((p) => ({ ...p, banco: e.target.value }))}
                placeholder=""
              >
                <option value="">Selecione...</option>
                {filterOptions.bancos.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>

              <Select
                label="Promotora"
                value={form.promotora}
                onChange={(e) => setForm((p) => ({ ...p, promotora: e.target.value }))}
                placeholder=""
              >
                <option value="">Selecione...</option>
                {filterOptions.promotoras.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Tabela e convênio */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Table2 size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Tabela e convênio</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tabela"
                value={form.tabela}
                onChange={(e) => setForm((p) => ({ ...p, tabela: e.target.value }))}
                placeholder=""
              >
                <option value="">Selecione...</option>
                {filterOptions.tabelas.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>

              <Select
                label="Convênio"
                value={form.convenio}
                onChange={(e) => setForm((p) => ({ ...p, conveni: e.target.value }))}
                placeholder=""
              >
                <option value="">Selecione...</option>
                {filterOptions.conveni.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Condições comerciais */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Condições comerciais</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Taxa (a.m.) %"
                type="number"
                step="0.01"
                value={form.taxa_juros}
                onChange={(e) => setForm((p) => ({ ...p, taxa_juros: e.target.value }))}
                placeholder="Ex: 2.50"
              />

              <Input
                label="Taxa (a.a.) %"
                type="number"
                step="0.01"
                value={form.taxa_juros_anual}
                onChange={(e) => setForm((p) => ({ ...p, taxa_juros_anual: e.target.value }))}
                placeholder="Ex: 34.90"
              />

              <Input
                label="Coeficiente"
                type="number"
                step="0.000001"
                value={form.coeficiente}
                onChange={(e) => setForm((p) => ({ ...p, coeficiente: e.target.value }))}
                placeholder="Ex: 0.032145"
              />

              <Input
                label="Comissão fixa (R$)"
                type="number"
                step="0.01"
                value={form.comissao_fixa}
                onChange={(e) => setForm((p) => ({ ...p, comissao_fixa: e.target.value }))}
                placeholder="Ex: 120.00"
              />

              <Input
                label="Prazo mínimo (meses)"
                type="number"
                value={form.prazo_minimo}
                onChange={(e) => setForm((p) => ({ ...p, prazo_minimo: e.target.value }))}
                placeholder="Ex: 6"
              />

              <Input
                label="Prazo máximo (meses)"
                type="number"
                value={form.prazo_maximo}
                onChange={(e) => setForm((p) => ({ ...p, prazo_maximo: e.target.value }))}
                placeholder="Ex: 84"
              />

              <Input
                label="Valor mínimo"
                type="number"
                step="0.01"
                value={form.valor_minimo}
                onChange={(e) => setForm((p) => ({ ...p, valor_minimo: e.target.value }))}
                placeholder="Ex: 1000"
              />

              <Input
                label="Valor máximo"
                type="number"
                step="0.01"
                value={form.valor_maximo}
                onChange={(e) => setForm((p) => ({ ...p, valor_maximo: e.target.value }))}
                placeholder="Ex: 50000"
              />

              <Input
                label="Parcela mínima"
                type="number"
                step="0.01"
                value={form.parcela_minima}
                onChange={(e) => setForm((p) => ({ ...p, parcela_minima: e.target.value }))}
                placeholder="Ex: 50"
              />

              <Input
                label="Parcela máxima"
                type="number"
                step="0.01"
                value={form.parcela_maxima}
                onChange={(e) => setForm((p) => ({ ...p, parcela_maxima: e.target.value }))}
                placeholder="Ex: 1500"
              />

              <Input
                label="Comissão banco (%)"
                type="number"
                step="0.01"
                value={form.comissao_banco}
                onChange={(e) => setForm((p) => ({ ...p, comissao_banco: e.target.value }))}
                placeholder="Ex: 1.20"
              />

              <Input
                label="Comissão promotora (%)"
                type="number"
                step="0.01"
                value={form.comissao_promotora}
                onChange={(e) => setForm((p) => ({ ...p, comissao_promotora: e.target.value }))}
                placeholder="Ex: 0.80"
              />

              <Input
                label="Comissão total (%)"
                type="number"
                step="0.01"
                value={form.comissao_total}
                onChange={(e) => setForm((p) => ({ ...p, comissao_total: e.target.value }))}
                placeholder="Ex: 2.00"
              />

              <Input
                label="Validade início"
                type="date"
                value={form.validade_inicio}
                onChange={(e) => setForm((p) => ({ ...p, validade_inicio: e.target.value }))}
              />

              <Input
                label="Validade fim"
                type="date"
                value={form.validade_fim}
                onChange={(e) => setForm((p) => ({ ...p, validade_fim: e.target.value }))}
              />
            </div>
          </Card>

          {/* Documentos e requisitos */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Documentos e requisitos</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextArea
                label="Documentos"
                rows={3}
                value={form.documentos}
                onChange={(e) => setForm((p) => ({ ...p, documentos: e.target.value }))}
                placeholder="Ex: RG, CPF, comprovante de renda..."
              />

              <TextArea
                label="Requisitos"
                rows={3}
                value={form.requisitos}
                onChange={(e) => setForm((p) => ({ ...p, requisitos: e.target.value }))}
                placeholder="Ex: Idade mínima, margem disponível, score..."
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Observações"
                  rows={3}
                  value={form.observacoes}
                  onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Observações internas..."
                />
              </div>
            </div>
          </Card>

          {/* Integração/API */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Link2 size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Integração / API</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="External ID"
                value={form.external_id}
                onChange={(e) => setForm((p) => ({ ...p, external_id: e.target.value }))}
                placeholder="ID no sistema externo"
              />
              <Input
                label="API Source"
                value={form.api_source}
                onChange={(e) => setForm((p) => ({ ...p, api_source: e.target.value }))}
                placeholder="Ex: banco_x, planilha..."
              />
              <Input
                label="Integration ID"
                value={form.integration_id}
                onChange={(e) => setForm((p) => ({ ...p, integration_id: e.target.value }))}
                placeholder="ID da integração"
              />

              <Input
                label="Sync status"
                value={form.sync_status}
                onChange={(e) => setForm((p) => ({ ...p, sync_status: e.target.value }))}
                placeholder="Ex: pending, synced, error"
              />
              <Input
                label="Last sync at"
                value={form.last_sync_at}
                onChange={(e) => setForm((p) => ({ ...p, last_sync_at: e.target.value }))}
                placeholder="ISO / Data"
                leftIcon={<Calendar size={16} />}
              />
              <Input
                label="Status integração"
                value={form.status_integracao}
                onChange={(e) => setForm((p) => ({ ...p, status_integracao: e.target.value }))}
                placeholder="Ex: ativo, pendente, erro"
              />

              <Input
                label="Origem integração"
                value={form.origem_integracao}
                onChange={(e) => setForm((p) => ({ ...p, origem_integracao: e.target.value }))}
                placeholder="Ex: manual, api, importacao"
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Notas de integração"
                  rows={3}
                  value={form.integracao_notas}
                  onChange={(e) => setForm((p) => ({ ...p, integracao_notas: e.target.value }))}
                  placeholder="Observações sobre integração, mapeamentos, etc."
                />
              </div>
            </div>
          </Card>

          {/* Automação futura */}
          <Card className="border-[#1f2937]" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={16} className="text-primary" />
              <div className="text-sm font-semibold text-white">Automação futura</div>
            </div>

            <div className="space-y-4">
              <Toggle
                checked={form.automation_enabled}
                onChange={(checked) => setForm((p) => ({ ...p, automation_enabled: checked }))}
                label={form.automation_enabled ? "Automação habilitada" : "Automação desabilitada"}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextArea
                  label="Automation rules (JSON/texto)"
                  rows={4}
                  value={form.automation_rules}
                  onChange={(e) => setForm((p) => ({ ...p, automation_rules: e.target.value }))}
                  placeholder='Ex: [{"if":"...","then":"..."}]'
                />
                <TextArea
                  label="Automation triggers (JSON/texto)"
                  rows={4}
                  value={form.automation_triggers}
                  onChange={(e) => setForm((p) => ({ ...p, automation_triggers: e.target.value }))}
                  placeholder='Ex: [{"event":"status_change","when":"..."}]'
                />
              </div>

              <TextArea
                label="Notas de automação"
                rows={3}
                value={form.automation_notes}
                onChange={(e) => setForm((p) => ({ ...p, automation_notes: e.target.value }))}
                placeholder="Detalhes e observações para automações futuras..."
              />
            </div>
          </Card>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" icon={<Plus size={16} />}>
              {editingProduto ? "Salvar alterações" : "Cadastrar produto"}
            </Button>
          </div>

          {/* Observação para compatibilidade */}
          <div className="text-xs text-slate-500 pt-1">
            Observação: campos de Integração/Automação já estão prontos para API futura e podem
            ser persistidos no estado mesmo antes do type global ser expandido.
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProdutosPage;
