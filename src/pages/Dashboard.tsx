import { useEffect, useMemo, useState } from "react";
import StatsCard from "../components/dashboard/StatsCard";
import {
  AlertTriangle,
  BarChart3,
  Box,
  CalendarDays,
  Clock3,
  CircleDollarSign,
  CreditCard,
  Filter,
  Menu,
  PieChart,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { Button, ExportMenu, Input, Modal, Select } from "../components/ui";
import useAppStore from "../store";
import type { EstruturaComercial, OportunidadeKanban, Parceiro } from "../types";

type DashboardFilters = {
  periodo: "7d" | "30d" | "mes" | "trimestre" | "ano" | "custom";
  dataInicial: string;
  dataFinal: string;
  produto: string;
  subproduto: string;
  canal: string;
  parceiro: string;
  responsavel: string;
};

type DashboardRow = {
  id: number;
  nome: string;
  produtoId: string;
  produto: string;
  subprodutoId: string;
  subproduto: string;
  canal: string;
  parceiroId: string;
  parceiro: string;
  responsavelId: string;
  responsavel: string;
  valor: number;
  custoAquisicao: number;
  etapa: FunilStageKey;
  etapaRank: number;
  data: Date;
  diasSemMovimento: number;
};

type FunilStageKey = "leads" | "propostas" | "aprovados" | "contratos" | "concluidos";

type SmartAlert = {
  id: string;
  titulo: string;
  severidade: "crítico" | "atenção" | "oportunidade";
  valor: string;
  filtro?: Partial<DashboardFilters>;
};

const CHANNELS = [
  { label: "Venda Direta", color: "#1d6fff", costPerLead: 180, expectedCac: 260 },
  { label: "Parceiros", color: "#7c3aed", costPerLead: 120, expectedCac: 210 },
  { label: "Tráfego Pago", color: "#f59e0b", costPerLead: 390, expectedCac: 320 },
  { label: "Indicação", color: "#61d394", costPerLead: 75, expectedCac: 160 },
] as const;

const PERIOD_OPTIONS = [
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Mês atual", value: "mes" },
  { label: "Trimestre atual", value: "trimestre" },
  { label: "Ano atual", value: "ano" },
  { label: "Personalizado", value: "custom" },
] as const;

const FUNNEL_STAGES: { key: FunilStageKey; label: string; minRank: number }[] = [
  { key: "leads", label: "Leads", minRank: 0 },
  { key: "propostas", label: "Propostas", minRank: 1 },
  { key: "aprovados", label: "Aprovados", minRank: 2 },
  { key: "contratos", label: "Contratos", minRank: 3 },
  { key: "concluidos", label: "Concluídos", minRank: 4 },
];

const normalizeText = (value?: string | number | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);

const formatInteger = (value: number) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Math.round(value));

const formatCompactMoney = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  }

  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)} mil`;
  }

  return formatMoney(value);
};

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)}%`;

const getInitialFilters = (): DashboardFilters => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 29);

  return {
    periodo: "30d",
    dataInicial: formatDateInput(start),
    dataFinal: formatDateInput(end),
    produto: "",
    subproduto: "",
    canal: "",
    parceiro: "",
    responsavel: "",
  };
};

const getDateRange = (filters: DashboardFilters) => {
  const end = filters.dataFinal ? new Date(`${filters.dataFinal}T23:59:59`) : new Date();
  const start = filters.dataInicial ? new Date(`${filters.dataInicial}T00:00:00`) : new Date(end);

  if (filters.periodo === "custom") {
    return { start, end };
  }

  const calculatedStart = new Date(end);

  if (filters.periodo === "7d") calculatedStart.setDate(end.getDate() - 6);
  if (filters.periodo === "30d") calculatedStart.setDate(end.getDate() - 29);
  if (filters.periodo === "mes") calculatedStart.setDate(1);
  if (filters.periodo === "trimestre") {
    const quarterStartMonth = Math.floor(end.getMonth() / 3) * 3;
    calculatedStart.setMonth(quarterStartMonth, 1);
  }
  if (filters.periodo === "ano") {
    calculatedStart.setMonth(0, 1);
  }

  calculatedStart.setHours(0, 0, 0, 0);
  return { start: calculatedStart, end };
};

const shiftRangeBack = (start: Date, end: Date) => {
  const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const previousEnd = new Date(start);
  previousEnd.setDate(start.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - duration);
  previousStart.setHours(0, 0, 0, 0);

  return { start: previousStart, end: previousEnd };
};

const parseOpportunityDate = (opportunity: OportunidadeKanban, index: number) => {
  const rawDate = opportunity.updated_at ?? opportunity.created_at ?? opportunity.data_integracao;
  const date =
    typeof rawDate === "number"
      ? new Date(rawDate)
      : rawDate
        ? new Date(rawDate)
        : new Date();

  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() - index * 2);
    return fallback;
  }

  if (!rawDate) {
    date.setDate(date.getDate() - index * 2);
  }

  return date;
};

const getStageRank = (stage?: string) => {
  const normalized = normalizeText(stage);

  if (["encerrado", "concluido", "concluidos", "liberacao", "finalizado"].some((term) => normalized.includes(term))) return 4;
  if (["contratacao", "contrato", "formalizacao", "documentacao"].some((term) => normalized.includes(term))) return 3;
  if (["aprovacao", "aprovado"].some((term) => normalized.includes(term))) return 2;
  if (["triagem", "analise", "negociacao", "proposta", "pendencia"].some((term) => normalized.includes(term))) return 1;
  return 0;
};

const getStageKey = (rank: number): FunilStageKey => {
  if (rank >= 4) return "concluidos";
  if (rank >= 3) return "contratos";
  if (rank >= 2) return "aprovados";
  if (rank >= 1) return "propostas";
  return "leads";
};

const normalizeChannel = (raw?: string, index = 0) => {
  const normalized = normalizeText(raw);

  if (normalized.includes("trafego") || normalized.includes("paid") || normalized.includes("campanha")) return "Tráfego Pago";
  if (normalized.includes("parceiro") || normalized.includes("franquia")) return "Parceiros";
  if (normalized.includes("indicacao") || normalized.includes("referral")) return "Indicação";
  if (normalized.includes("direta") || normalized.includes("direct")) return "Venda Direta";

  return CHANNELS[index % CHANNELS.length].label;
};

const getProductIcon = (productName: string) => {
  const normalized = normalizeText(productName);
  if (normalized.includes("energia")) return Zap;
  if (normalized.includes("mercado") || normalized.includes("seguro") || normalized.includes("plano")) return ShoppingBag;
  if (normalized.includes("credito") || normalized.includes("emprestimo") || normalized.includes("fgts") || normalized.includes("cartao")) return CreditCard;
  return PieChart;
};

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTrendText = (current: number, previous: number, suffix = "") => {
  if (!previous) return "Sem base anterior";
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${formatPercent(diff)}${suffix} vs período anterior`;
};

const matchesCoreFilters = (row: DashboardRow, filters: DashboardFilters) =>
  (!filters.produto || row.produtoId === filters.produto) &&
  (!filters.subproduto || row.subprodutoId === filters.subproduto) &&
  (!filters.canal || row.canal === filters.canal) &&
  (!filters.parceiro || row.parceiroId === filters.parceiro) &&
  (!filters.responsavel || row.responsavelId === filters.responsavel);

const calculateMetrics = (rows: DashboardRow[]) => {
  const leads = rows.length;
  const approvedRows = rows.filter((row) => row.etapaRank >= 2);
  const contractRows = rows.filter((row) => row.etapaRank >= 3);
  const production = approvedRows.reduce((total, row) => total + row.valor, 0);
  const origination = rows.reduce((total, row) => total + row.valor, 0);
  const acquisitionCost = rows.reduce((total, row) => total + row.custoAquisicao, 0);
  const conversion = leads ? (approvedRows.length / leads) * 100 : 0;
  const cac = approvedRows.length ? acquisitionCost / approvedRows.length : acquisitionCost;
  const ltv = contractRows.length ? production / contractRows.length : production * 0.38;

  return {
    leads,
    production,
    origination,
    acquisitionCost,
    conversion,
    cac,
    ltv,
    approved: approvedRows.length,
    contracts: contractRows.length,
  };
};

const FUNNEL_GRADIENTS = [
  "linear-gradient(135deg, #1878ff 0%, #155ed9 100%)",
  "linear-gradient(135deg, #3c63f6 0%, #4148d7 100%)",
  "linear-gradient(135deg, #7b3dd6 0%, #9235d1 100%)",
  "linear-gradient(135deg, #f47c18 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #f7c915 0%, #eaa10b 100%)",
];

const FUNNEL_WIDTH_FLOORS = [96, 78, 60, 45, 34];

const buildSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`;

    const previous = points[index - 1];
    const controlOffset = (point.x - previous.x) * 0.45;
    return `${path} C ${previous.x + controlOffset},${previous.y} ${point.x - controlOffset},${point.y} ${point.x},${point.y}`;
  }, "");
};

function Sparkline({ values, id, color = "#1d6fff" }: { values: number[]; id: string; color?: string }) {
  const safeValues = values.length ? values : [0];
  const minValue = Math.min(...safeValues);
  const maxValue = Math.max(...safeValues, 1);
  const range = Math.max(1, maxValue - minValue);
  const points = safeValues.map((value, index) => {
    const x = safeValues.length <= 1 ? 50 : (100 / (safeValues.length - 1)) * index;
    const y = 44 - ((value - minValue) / range) * 34;
    return `${x.toFixed(1)},${Math.max(7, Math.min(44, y)).toFixed(1)}`;
  });
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L 100,50 L 0,50 Z`;
  const gradientId = `spark-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg viewBox="0 0 100 50" className="h-11 w-full overflow-visible sm:h-12">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-18%" y="-34%" width="136%" height="168%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${gradientId}-glow)`} />
    </svg>
  );
}

function RevenueChart({ series, previousSeries }: { series: { label: string; value: number }[]; previousSeries: number[] }) {
  const values = series.map((item) => item.value);
  const maxValue = Math.max(...values, ...previousSeries, 1);
  const getPoint = (value: number, index: number, total: number) => {
    const x = total <= 1 ? 210 : (420 / (total - 1)) * index;
    const y = 126 - (value / maxValue) * 104;
    return {
      x: Number(x.toFixed(1)),
      y: Number(Math.max(20, Math.min(126, y)).toFixed(1)),
    };
  };
  const points = series.map((item, index) => getPoint(item.value, index, series.length));
  const previousPoints = previousSeries.map((value, index) => getPoint(value, index, previousSeries.length));
  const linePath = buildSmoothPath(points);
  const previousPath = buildSmoothPath(previousPoints);
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x},150 L ${points[0].x},150 Z` : "";

  return (
    <div className="relative h-52 overflow-hidden rounded-lg sm:h-56">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-muted)]" />
      <div className="absolute inset-0 grid grid-rows-4">
        {[100, 67, 33, 0].map((mark) => (
          <div key={mark} className="flex items-start border-t border-[var(--border-muted)] text-[10px] font-medium text-[var(--text-muted)] opacity-80">
            <span className="w-14 pt-1">{formatCompactMoney((maxValue * mark) / 100)}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 420 150" className="absolute inset-x-12 bottom-8 h-40 w-[calc(100%-4.25rem)] overflow-visible sm:inset-x-14 sm:w-[calc(100%-4.75rem)]">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.28" />
            <stop offset="58%" stopColor="var(--chart-fill)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--chart-fill)" stopOpacity="0" />
          </linearGradient>
          <filter id="revenueGlow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={areaPath} fill="url(#revenueFill)" stroke="none" />
        <path d={previousPath} fill="none" stroke="var(--chart-line-2)" strokeWidth="1.8" strokeDasharray="6 7" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        <path d={linePath} fill="none" stroke="var(--chart-line)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#revenueGlow)" />
        {points.map((point, index) => {
          const item = series[index];
          return (
            <circle key={`${item.label}-${point.x}`} cx={point.x} cy={point.y} r="3.8" fill="var(--bg-elevated)" stroke="var(--chart-line)" strokeWidth="2.2">
              <title>{`${item.label}: ${formatMoney(item.value)}`}</title>
            </circle>
          );
        })}
      </svg>
      <div
        className="absolute bottom-1 left-12 right-3 grid text-center text-[10px] font-semibold text-[var(--text-muted)] sm:left-14 sm:right-4 sm:text-[11px]"
        style={{ gridTemplateColumns: `repeat(${Math.max(series.length, 1)}, minmax(0, 1fr))` }}
      >
        {series.map((item, index) => (
          <span key={`${item.label}-${index}`} className="truncate px-1">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function FunnelVisual({
  rows,
}: {
  rows: Array<{ key: FunilStageKey; label: string; count: number; value: string; conversion: string; percentage: number }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2.5 py-1 sm:gap-3">
      {rows.map((row, index) => {
        const visualWidth = row.count > 0
          ? Math.max(FUNNEL_WIDTH_FLOORS[index] ?? 34, row.percentage)
          : FUNNEL_WIDTH_FLOORS[index] ?? 34;
        const inset = 4.5 + index * 2.1;

        return (
          <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-3">
            <div className="flex min-w-0 justify-center">
              <div
                className="flex h-11 flex-col items-center justify-center text-center text-xs font-semibold text-white shadow-[0_12px_28px_rgba(29,111,255,0.16)] transition-all duration-200 hover:scale-[1.01] sm:h-[52px]"
                style={{
                  width: `${visualWidth}%`,
                  minWidth: row.count > 0 ? "8.25rem" : "6.5rem",
                  background: FUNNEL_GRADIENTS[index] ?? FUNNEL_GRADIENTS[0],
                  clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, ${100 - inset - 8}% 100%, ${inset + 8}% 100%)`,
                  filter: "drop-shadow(0 0 10px rgba(29, 111, 255, 0.12))",
                }}
              >
                <span className="leading-tight">{row.label}</span>
                <strong className="text-sm leading-tight">{row.value}</strong>
              </div>
            </div>
            <span className="text-right text-sm font-extrabold tabular-nums text-[var(--text-primary)]">{row.conversion}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({
  channels,
  total,
  gradient,
}: {
  channels: Array<{ label: string; color: string; percentage: number; production: number }>;
  total: number;
  gradient: string;
}) {
  return (
    <div className="grid items-center gap-5 lg:grid-cols-[11.5rem_minmax(0,1fr)] xl:grid-cols-[11rem_minmax(0,1fr)]">
      <div
        className="relative mx-auto h-40 w-40 shrink-0 rounded-full border border-[var(--border-default)] shadow-xl shadow-blue-950/15"
        style={{ background: gradient }}
      >
        <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full border border-[var(--border-muted)] bg-[var(--bg-elevated)] text-center shadow-inner">
          <strong className="text-base font-extrabold leading-tight text-[var(--text-primary)]">{formatMoney(total)}</strong>
          <span className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">Total</span>
        </div>
      </div>
      <div className="space-y-3">
        {channels.map((channel) => (
          <div key={channel.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2.5 text-[var(--text-secondary)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ background: channel.color }} />
              <span className="truncate">{channel.label}</span>
            </span>
            <span className="text-right tabular-nums">
              <span className="font-semibold text-[var(--text-primary)]">{formatMoney(channel.production)}</span>
              <span className="ml-1 text-[11px] text-[var(--text-muted)]">({formatPercent(channel.percentage)})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-[var(--border-muted)] ${className}`}
      style={{ background: "linear-gradient(90deg, var(--bg-surface-soft), var(--bg-surface-hover), var(--bg-surface-soft))" }}
    />
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-hover)] p-5 text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

export default function Dashboard() {
  const {
    estruturaComercial,
    oportunidadesKanban,
    parceiros,
    usuarios,
    setSidebarOpen,
  } = useAppStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>(() => getInitialFilters());

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(timeout);
  }, []);

  const productStructure = useMemo(() => {
    const activeItems = (Array.isArray(estruturaComercial) ? estruturaComercial : []).filter((item) => item.ativo !== 0);
    const products = activeItems
      .filter((item) => item.nivel === "produto")
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const subproducts = activeItems
      .filter((item) => item.nivel === "subproduto")
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const subproductsByProduct = new Map<string, EstruturaComercial[]>();

    subproducts.forEach((subproduct) => {
      const parentId = String(subproduct.parent_id ?? "");
      if (!subproductsByProduct.has(parentId)) subproductsByProduct.set(parentId, []);
      subproductsByProduct.get(parentId)?.push(subproduct);
    });

    return { products, subproducts, subproductsByProduct };
  }, [estruturaComercial]);

  const gerenteOptions = useMemo(() => {
    const safeUsers = Array.isArray(usuarios) ? usuarios : [];
    return safeUsers
      .filter((user) => {
        const role = normalizeText(`${user.perfil ?? ""} ${user.role ?? ""}`);
        return role.includes("gerente") || role.includes("gestor") || role.includes("vendedor");
      })
      .map((user) => ({ id: String(user.id), nome: user.nome || user.email || `Responsável ${user.id}` }));
  }, [usuarios]);

  const dashboardRows = useMemo<DashboardRow[]>(() => {
    const safeOpportunities = Array.isArray(oportunidadesKanban) ? oportunidadesKanban : [];
    const safePartners = Array.isArray(parceiros) ? parceiros : [];
    const products = productStructure.products;
    const subproductsByProduct = productStructure.subproductsByProduct;

    return safeOpportunities.map((opportunity, index) => {
      const extra = opportunity as OportunidadeKanban & Record<string, any>;
      const productName = String(extra.produto_nome ?? extra.produto ?? products[index % Math.max(products.length, 1)]?.nome ?? "Produto não informado");
      const product =
        products.find((item) => normalizeText(item.nome) === normalizeText(productName)) ??
        products.find((item) => normalizeText(productName).includes(normalizeText(item.nome)) || normalizeText(item.nome).includes(normalizeText(productName)));
      const productId = String(product?.id ?? normalizeText(productName));
      const productSubproducts = subproductsByProduct.get(String(product?.id ?? "")) ?? [];
      const subproduct =
        productSubproducts.find((item) => normalizeText(item.nome) === normalizeText(extra.subproduto ?? extra.subproduto_nome)) ??
        productSubproducts[index % Math.max(productSubproducts.length, 1)];
      const subproductName = String(extra.subproduto ?? extra.subproduto_nome ?? subproduct?.nome ?? "Sem subproduto informado");
      const channel = normalizeChannel(extra.canal ?? extra.origem, index);
      const channelConfig = CHANNELS.find((item) => item.label === channel) ?? CHANNELS[0];
      const partner = safePartners.find((item) => String(item.id) === String(extra.parceiro_id ?? extra.parceiroId)) ?? safePartners[index % Math.max(safePartners.length, 1)];
      const gerente = gerenteOptions.find((item) => item.id === String(extra.responsavelId ?? extra.usuario_id)) ?? gerenteOptions[index % Math.max(gerenteOptions.length, 1)];
      const date = parseOpportunityDate(opportunity, index);
      const stageRank = getStageRank(extra.coluna_id ?? extra.etapa_id ?? extra.status);
      const daysWithoutMovement = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
      const value = safeNumber(extra.valor ?? extra.valorEstimado, 12000 + index * 3500);

      return {
        id: opportunity.id,
        nome: opportunity.nome || opportunity.cliente_nome || `Lead ${index + 1}`,
        produtoId: productId,
        produto: product?.nome ?? productName,
        subprodutoId: String(subproduct?.id ?? normalizeText(subproductName)),
        subproduto: subproductName,
        canal: channel,
        parceiroId: String(partner?.id ?? ""),
        parceiro: partner?.nome ?? "Sem parceiro vinculado",
        responsavelId: String(gerente?.id ?? extra.responsavelId ?? ""),
        responsavel: gerente?.nome ?? extra.gestorResponsavel ?? partner?.responsavel ?? "Sem responsável",
        valor: value,
        custoAquisicao: channelConfig.costPerLead * (1 + (index % 3) * 0.08),
        etapa: getStageKey(stageRank),
        etapaRank: stageRank,
        data: date,
        diasSemMovimento: daysWithoutMovement,
      };
    });
  }, [gerenteOptions, oportunidadesKanban, parceiros, productStructure]);

  const dateRange = useMemo(() => getDateRange(filters), [filters]);
  const previousDateRange = useMemo(() => shiftRangeBack(dateRange.start, dateRange.end), [dateRange]);

  const filteredRows = useMemo(
    () =>
      dashboardRows.filter(
        (row) =>
          row.data >= dateRange.start &&
          row.data <= dateRange.end &&
          matchesCoreFilters(row, filters),
      ),
    [dashboardRows, dateRange, filters],
  );

  const previousRows = useMemo(
    () =>
      dashboardRows.filter(
        (row) =>
          row.data >= previousDateRange.start &&
          row.data <= previousDateRange.end &&
          matchesCoreFilters(row, filters),
      ),
    [dashboardRows, filters, previousDateRange],
  );

  const metrics = useMemo(() => calculateMetrics(filteredRows), [filteredRows]);
  const previousMetrics = useMemo(() => {
    const base = calculateMetrics(previousRows);
    if (previousRows.length) return base;

    return {
      ...base,
      production: metrics.production * 0.92,
      origination: metrics.origination * 0.88,
      conversion: Math.max(0, metrics.conversion + 3.4),
      cac: metrics.cac * 1.08,
      ltv: metrics.ltv * 0.9,
    };
  }, [metrics, previousRows]);

  const availableSubproducts = useMemo(
    () =>
      productStructure.subproducts.filter((subproduct) => !filters.produto || String(subproduct.parent_id ?? "") === filters.produto),
    [filters.produto, productStructure.subproducts],
  );

  const funnelRows = useMemo(() => {
    const leadCount = filteredRows.length;
    return FUNNEL_STAGES.map((stage) => {
      const count = filteredRows.filter((row) => row.etapaRank >= stage.minRank).length;
      const conversion = leadCount ? (count / leadCount) * 100 : 0;
      return {
        ...stage,
        count,
        value: formatInteger(count),
        conversion: formatPercent(conversion),
        percentage: leadCount ? (count / leadCount) * 100 : 0,
      };
    });
  }, [filteredRows]);

  const productPerformance = useMemo(() => {
    const groups = new Map<string, DashboardRow[]>();
    filteredRows.forEach((row) => {
      const key = row.produtoId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(row);
    });

    const structuredProducts = productStructure.products
      .filter((product) => !filters.produto || String(product.id) === filters.produto)
      .map((product) => ({ id: String(product.id), nome: product.nome }));
    const fallbackProducts = Array.from(groups.entries()).map(([id, rows]) => ({ id, nome: rows[0]?.produto ?? "Produto não informado" }));
    const baseProducts = structuredProducts.length > 0 ? structuredProducts : fallbackProducts;

    return baseProducts
      .map((product) => {
        const rows = groups.get(product.id) ?? [];
        const production = rows.filter((row) => row.etapaRank >= 2).reduce((total, row) => total + row.valor, 0);
        const conversion = rows.length ? (rows.filter((row) => row.etapaRank >= 2).length / rows.length) * 100 : 0;
        const contracts = rows.filter((row) => row.etapaRank >= 3).length;

        return {
          produtoId: product.id,
          produto: product.nome,
          production,
          conversion,
          leads: rows.length,
          contracts,
          sparkline: Array.from({ length: 11 }, (_, index) => {
            const row = rows[index % Math.max(rows.length, 1)];
            const base = row ? row.valor / 1000 + row.etapaRank * 12 : 6 + index * 0.8;
            return Math.max(6, base + ((index * 7 + rows.length * 5) % 18));
          }),
          Icon: getProductIcon(product.nome),
        };
      })
      .sort((a, b) => b.production - a.production || a.produto.localeCompare(b.produto, "pt-BR"))
      .slice(0, 4);
  }, [filteredRows, filters.produto, productStructure.products]);

  const channelData = useMemo(() => {
    const totalProduction = filteredRows
      .filter((row) => row.etapaRank >= 2)
      .reduce((total, row) => total + row.valor, 0);

    return CHANNELS.map((channel) => {
      const rows = filteredRows.filter((row) => row.canal === channel.label);
      const production = rows.filter((row) => row.etapaRank >= 2).reduce((total, row) => total + row.valor, 0);
      const conversions = rows.filter((row) => row.etapaRank >= 2).length;
      const cost = rows.reduce((total, row) => total + row.custoAquisicao, 0);
      const percentage = totalProduction ? (production / totalProduction) * 100 : 0;

      return {
        ...channel,
        rows,
        production,
        leads: rows.length,
        conversion: rows.length ? (conversions / rows.length) * 100 : 0,
        cac: conversions ? cost / conversions : cost,
        percentage,
      };
    });
  }, [filteredRows]);

  const channelGradient = useMemo(() => {
    let cursor = 0;
    const segments = channelData
      .filter((channel) => channel.percentage > 0)
      .map((channel) => {
        const start = cursor;
        cursor += channel.percentage;
        return `${channel.color} ${start}% ${cursor}%`;
      });

    return segments.length ? `conic-gradient(${segments.join(", ")})` : "conic-gradient(var(--border-default) 0 100%)";
  }, [channelData]);

  const chartSeries = useMemo(() => {
    const buckets = filters.periodo === "7d" ? 7 : 6;
    const totalDays = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000));

    return Array.from({ length: buckets }, (_, index) => {
      const bucketStart = new Date(dateRange.start);
      bucketStart.setDate(dateRange.start.getDate() + Math.floor((totalDays / buckets) * index));
      const bucketEnd = new Date(dateRange.start);
      bucketEnd.setDate(dateRange.start.getDate() + Math.floor((totalDays / buckets) * (index + 1)));
      bucketEnd.setHours(23, 59, 59, 999);
      const value = filteredRows
        .filter((row) => row.data >= bucketStart && row.data <= bucketEnd && row.etapaRank >= 2)
        .reduce((total, row) => total + row.valor, 0);

      return {
        label: buckets === 7
          ? bucketStart.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
          : bucketStart.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        value,
      };
    });
  }, [dateRange, filteredRows, filters.periodo]);

  const previousChartSeries = useMemo(() => {
    const baseline = previousRows.filter((row) => row.etapaRank >= 2).reduce((total, row) => total + row.valor, 0);
    const fallback = chartSeries.map((item, index) => item.value * (0.86 + index * 0.02));
    if (!previousRows.length) return fallback;
    return chartSeries.map((_, index) => baseline / Math.max(chartSeries.length, 1) * (0.8 + index * 0.08));
  }, [chartSeries, previousRows]);

  const alerts = useMemo<SmartAlert[]>(() => {
    const productionRows = filteredRows.filter((row) => row.etapaRank >= 2);
    const scopedPartners = filters.parceiro ? parceiros.filter((partner) => String(partner.id) === filters.parceiro) : parceiros;
    const partnersWithoutProduction = scopedPartners.filter(
      (partner) => !productionRows.some((row) => row.parceiroId === String(partner.id)),
    );
    const conversionDelta = metrics.conversion - previousMetrics.conversion;

    const scopedManagers = filters.responsavel ? gerenteOptions.filter((manager) => manager.id === filters.responsavel) : gerenteOptions;
    const managersWithoutProduction = scopedManagers.filter(
      (manager) => !productionRows.some((row) => row.responsavelId === manager.id),
    );

    const paidTrafficStale = filteredRows.filter((row) => row.canal === "Tráfego Pago" && row.etapaRank <= 1 && row.diasSemMovimento > 2);
    const maxPaidTrafficDays = paidTrafficStale.length > 0
      ? Math.max(...paidTrafficStale.map((row) => row.diasSemMovimento))
      : 0;

    const subproductGroups = new Map<string, DashboardRow[]>();
    filteredRows.forEach((row) => {
      const key = `${row.produtoId}-${row.subprodutoId}`;
      if (!subproductGroups.has(key)) subproductGroups.set(key, []);
      subproductGroups.get(key)?.push(row);
    });

    const lowProduct = Array.from(subproductGroups.values())
      .map((rows) => {
        const first = rows[0];
        const conversion = rows.length ? (rows.filter((row) => row.etapaRank >= 2).length / rows.length) * 100 : 0;
        return { produtoId: first.produtoId, produto: first.produto, conversion, leads: rows.length };
      })
      .filter((item) => item.leads >= 1 && item.conversion < 25)
      .sort((a, b) => a.conversion - b.conversion)[0];

    const generated: SmartAlert[] = [
      {
        id: "parceiros-sem-producao",
        titulo: "Parceiros sem produção",
        severidade: partnersWithoutProduction.length > 0 ? "crítico" : "oportunidade",
        valor: formatInteger(partnersWithoutProduction.length),
        filtro: partnersWithoutProduction.length === 1 ? { parceiro: String(partnersWithoutProduction[0].id) } : undefined,
      },
      {
        id: "queda-conversao",
        titulo: "Queda de conversão",
        severidade: conversionDelta < -1 ? "crítico" : "oportunidade",
        valor: `${conversionDelta >= 0 ? "+" : ""}${formatPercent(conversionDelta)}`,
      },
      {
        id: "gerentes-sem-producao",
        titulo: "Gerentes sem produção",
        severidade: managersWithoutProduction.length > 0 ? "atenção" : "oportunidade",
        valor: formatInteger(managersWithoutProduction.length),
        filtro: managersWithoutProduction.length === 1 ? { responsavel: managersWithoutProduction[0].id } : undefined,
      },
      {
        id: "trafego-pago-sem-evolucao",
        titulo: "Leads de tráfego pago",
        severidade: maxPaidTrafficDays > 2 ? "atenção" : "oportunidade",
        valor: `${formatInteger(maxPaidTrafficDays)} dias`,
        filtro: maxPaidTrafficDays > 0 ? { canal: "Tráfego Pago" } : undefined,
      },
      {
        id: "produto-baixa-performance",
        titulo: "Produto/subproduto baixa performance",
        severidade: "oportunidade",
        valor: lowProduct?.produto ?? "Sem desvio",
        filtro: lowProduct ? { produto: lowProduct.produtoId } : undefined,
      },
    ];

    const severityOrder = { crítico: 0, atenção: 1, oportunidade: 2 };
    return generated
      .sort((a, b) => severityOrder[a.severidade] - severityOrder[b.severidade])
      .slice(0, 5);
  }, [filteredRows, filters, gerenteOptions, metrics.conversion, parceiros, previousMetrics.conversion]);

  const exportRows = useMemo(() => {
    const rows = [
      { secao: "KPIs", indicador: "Produção Total", metrica: "Valor", valor: formatMoney(metrics.production), contexto: `${filteredRows.length} lead(s) filtrados`, sugestao: "" },
      { secao: "KPIs", indicador: "Originação Total", metrica: "Valor", valor: formatMoney(metrics.origination), contexto: `${filteredRows.length} lead(s) filtrados`, sugestao: "" },
      { secao: "KPIs", indicador: "Conversão Geral", metrica: "Percentual", valor: formatPercent(metrics.conversion), contexto: `${metrics.approved} aprovado(s)`, sugestao: "" },
      { secao: "KPIs", indicador: "CAC Médio", metrica: "Valor", valor: formatMoney(metrics.cac), contexto: "Custo de aquisição estimado", sugestao: "" },
      { secao: "KPIs", indicador: "LTV Médio", metrica: "Valor", valor: formatMoney(metrics.ltv), contexto: "Valor médio estimado", sugestao: "" },
      ...funnelRows.map((row) => ({ secao: "Funil Consolidado", indicador: row.label, metrica: "Volume", valor: row.value, contexto: row.conversion, sugestao: "" })),
      ...channelData.map((channel) => ({ secao: "Receita por Canal", indicador: channel.label, metrica: "Produção", valor: formatMoney(channel.production), contexto: `${formatPercent(channel.percentage)} | CAC ${formatMoney(channel.cac)}`, sugestao: "" })),
      ...productPerformance.map((product) => ({ secao: "Desempenho por Produto", indicador: product.produto, metrica: "Produção", valor: formatMoney(product.production), contexto: `${product.leads} lead(s) | ${formatPercent(product.conversion)}`, sugestao: "" })),
      ...alerts.map((alert) => ({ secao: "Alertas Inteligentes", indicador: alert.titulo, metrica: alert.severidade, valor: alert.valor, contexto: "", sugestao: "" })),
    ];

    return rows;
  }, [alerts, channelData, filteredRows.length, funnelRows, metrics, productPerformance]);

  const dateRangeLabel = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;

  const setFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(getInitialFilters());

  const applyAlertFilter = (patch?: Partial<DashboardFilters>) => {
    if (!patch) return;
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleRefresh = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 280);
  };

  return (
    <div className="app-page max-w-[1510px] space-y-4">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="finqz-control h-10 w-10 lg:hidden"
            aria-label="Abrir navegação"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-2xl font-extrabold leading-tight tracking-normal text-[var(--text-primary)] sm:text-3xl">
            Dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="finqz-control min-h-11 w-full min-w-0 justify-start px-4 text-sm sm:w-auto sm:max-w-[300px]"
          >
            <CalendarDays size={17} />
            <span className="min-w-0 truncate">{dateRangeLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="finqz-control h-11 px-4 text-sm"
          >
            <Filter size={17} />
            Filtros
          </button>
          <ExportMenu
            data={exportRows}
            columns={[
              { key: "secao", label: "Seção" },
              { key: "indicador", label: "Indicador" },
              { key: "metrica", label: "Métrica" },
              { key: "valor", label: "Valor" },
              { key: "contexto", label: "Contexto" },
              { key: "sugestao", label: "Sugestão de ação" },
            ]}
            filename="dashboard_finqz_pro"
            label="Exportar"
          />
          <button
            type="button"
            onClick={handleRefresh}
            className="h-11 rounded-lg bg-gradient-to-r from-[#136fff] to-[#2356e8] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-blue-600/30"
          >
            <span className="flex items-center gap-2">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Atualizar
            </span>
          </button>
        </div>
      </section>

      <Modal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros do Painel"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Período"
              value={filters.periodo}
              onChange={(event) => setFilter("periodo", event.target.value as DashboardFilters["periodo"])}
              options={[...PERIOD_OPTIONS]}
            />
            <Input
              label="Data inicial"
              type="date"
              value={filters.dataInicial}
              onChange={(event) => setFilters((prev) => ({ ...prev, periodo: "custom", dataInicial: event.target.value }))}
            />
            <Input
              label="Data final"
              type="date"
              value={filters.dataFinal}
              onChange={(event) => setFilters((prev) => ({ ...prev, periodo: "custom", dataFinal: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Produto"
              value={filters.produto}
              onChange={(event) => setFilters((prev) => ({ ...prev, produto: event.target.value, subproduto: "" }))}
              placeholder=""
              options={[
                { label: "Todos os produtos", value: "" },
                ...productStructure.products.map((product) => ({ label: product.nome, value: String(product.id) })),
              ]}
            />
            <Select
              label="Subproduto"
              value={filters.subproduto}
              onChange={(event) => setFilter("subproduto", event.target.value)}
              placeholder=""
              options={[
                { label: "Todos os subprodutos", value: "" },
                ...availableSubproducts.map((subproduct) => ({ label: subproduct.nome, value: String(subproduct.id) })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Canal"
              value={filters.canal}
              onChange={(event) => setFilter("canal", event.target.value)}
              placeholder=""
              options={[
                { label: "Todos os canais", value: "" },
                ...CHANNELS.map((channel) => ({ label: channel.label, value: channel.label })),
              ]}
            />
            <Select
              label="Parceiro"
              value={filters.parceiro}
              onChange={(event) => setFilter("parceiro", event.target.value)}
              placeholder=""
              options={[
                { label: "Todos os parceiros", value: "" },
                ...parceiros.map((partner) => ({ label: partner.nome, value: String(partner.id) })),
              ]}
            />
            <Select
              label="Gerente ou responsável"
              value={filters.responsavel}
              onChange={(event) => setFilter("responsavel", event.target.value)}
              placeholder=""
              options={[
                { label: "Todos os responsáveis", value: "" },
                ...gerenteOptions.map((manager) => ({ label: manager.nome, value: manager.id })),
              ]}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-muted)] pt-5 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={resetFilters}>
              Limpar
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      </Modal>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-[122px]" />)
        ) : (
          <>
            <StatsCard
              title="Produção Total"
              value={formatMoney(metrics.production)}
              change={getTrendText(metrics.production, previousMetrics.production)}
              icon={<CircleDollarSign className="h-5 w-5" />}
              variant="blue"
            />
            <StatsCard
              title="Originação Total"
              value={formatMoney(metrics.origination)}
              change={getTrendText(metrics.origination, previousMetrics.origination)}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="cyan"
            />
            <StatsCard
              title="Conversão Geral"
              value={formatPercent(metrics.conversion)}
              change={`${metrics.conversion >= previousMetrics.conversion ? "+" : ""}${formatPercent(metrics.conversion - previousMetrics.conversion)} p.p. vs período anterior`}
              icon={<UserRound className="h-5 w-5" />}
              variant="green"
            />
            <StatsCard
              title="CAC Médio"
              value={formatMoney(metrics.cac)}
              change={getTrendText(previousMetrics.cac, metrics.cac)}
              icon={<PieChart className="h-5 w-5" />}
              variant="red"
            />
            <StatsCard
              title="LTV Médio"
              value={formatMoney(metrics.ltv)}
              change={getTrendText(metrics.ltv, previousMetrics.ltv)}
              icon={<Star className="h-5 w-5" />}
              variant="purple"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="finqz-card p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] sm:text-base">Desempenho por Produto</h3>
            <span className="text-xs font-semibold text-[#1f75ff]">Ver todos</span>
          </div>

          {loading ? (
            <SkeletonBlock className="h-[178px]" />
          ) : productPerformance.length === 0 ? (
            <EmptyState title="Nenhum desempenho encontrado" detail="Ajuste os filtros para visualizar produção por produto." />
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {productPerformance.map((product, index) => {
                const Icon = product.Icon;
                const sparkColor = ["#1d73ff", "#3b82ff", "#7c3aed", "#22d3ee"][index % 4];
                return (
                  <div
                    key={product.produtoId}
                    className="group flex min-h-[178px] min-w-0 flex-col rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-[var(--bg-elevated)]"
                  >
                    <div className="mb-3 flex h-8 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1473ff] to-[#1d4ed8] text-white shadow-sm shadow-blue-600/15">
                        <Icon size={16} />
                      </div>
                      <p className="min-w-0 truncate text-sm font-bold text-[var(--text-primary)]">{product.produto}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="col-span-2">
                        <p className="truncate text-sm font-extrabold text-[#1f75ff]">{formatMoney(product.production)}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Produção</p>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[var(--text-primary)]">{formatPercent(product.conversion)}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Conversão</p>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[var(--text-primary)]">{formatInteger(product.contracts)}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Contratos</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-2">
                      <Sparkline id={product.produtoId} values={product.sparkline} color={sparkColor} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="finqz-card p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] sm:text-base">Funil Consolidado</h3>
            </div>
            <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
          </div>

          {loading ? (
            <SkeletonBlock className="h-[206px]" />
          ) : filteredRows.length === 0 ? (
            <EmptyState title="Funil sem dados" detail="Não há leads no período e filtros selecionados." />
          ) : (
            <FunnelVisual rows={funnelRows} />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="finqz-card p-3.5 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] sm:text-base">Produção ao Longo do Tempo</h3>
            <span className="finqz-control h-9 px-3 text-xs">Diário</span>
          </div>
          {loading ? <SkeletonBlock className="h-52 sm:h-56" /> : <RevenueChart series={chartSeries} previousSeries={previousChartSeries} />}
        </div>

        <div className="finqz-card p-3.5 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] sm:text-base">Receita por Canal</h3>
            <Users className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
          </div>

          {loading ? (
            <SkeletonBlock className="h-52 sm:h-56" />
          ) : (
            <DonutChart channels={channelData} total={metrics.production} gradient={channelGradient} />
          )}
        </div>
      </section>

      <section className="finqz-card p-3.5 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] sm:text-base">Alertas Inteligentes</h3>
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
        </div>

        {loading ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-[92px]" />)}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState title="Sem alertas" detail="Filtros atuais sem desvios." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {alerts.map((alert) => {
              const alertFilter = alert.filtro;
              const visual =
                alert.id === "parceiros-sem-producao"
                  ? { Icon: Users, color: "text-red-300", bg: "from-red-500/28 to-red-500/8" }
                  : alert.id === "queda-conversao"
                    ? { Icon: TrendingDown, color: "text-amber-300", bg: "from-amber-500/28 to-amber-500/8" }
                    : alert.id === "gerentes-sem-producao"
                      ? { Icon: UserRound, color: "text-red-300", bg: "from-red-500/28 to-red-500/8" }
                      : alert.id === "trafego-pago-sem-evolucao"
                        ? { Icon: Clock3, color: "text-amber-300", bg: "from-amber-500/28 to-amber-500/8" }
                        : { Icon: Box, color: "text-purple-300", bg: "from-purple-500/28 to-purple-500/8" };
              const Icon = visual.Icon;

              return (
                <div
                  key={alert.id}
                  role={alertFilter ? "button" : undefined}
                  tabIndex={alertFilter ? 0 : undefined}
                  onClick={alertFilter ? () => applyAlertFilter(alertFilter) : undefined}
                  onKeyDown={(event) => {
                    if (!alertFilter || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    applyAlertFilter(alertFilter);
                  }}
                  className={`flex min-h-[92px] items-center gap-3 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-3 transition-all duration-200 ${
                    alertFilter ? "cursor-pointer hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-[var(--bg-elevated)]" : ""
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${visual.bg} ${visual.color}`}>
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--text-primary)] sm:text-[13px]">{alert.titulo}</p>
                    <p className={`mt-1.5 truncate text-xl font-extrabold leading-none sm:text-2xl ${
                      alert.severidade === "crítico"
                        ? "text-red-500 dark:text-red-300"
                        : alert.severidade === "atenção"
                          ? "text-amber-500 dark:text-amber-300"
                          : "text-purple-500 dark:text-purple-300"
                    }`}>{alert.valor}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="pb-1 text-center text-xs text-[var(--text-muted)]">
        FINQZ PRO © 2026 - Todos os direitos reservados.
      </footer>
    </div>
  );
}
