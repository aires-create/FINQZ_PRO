import { useEffect, useMemo, useState } from "react";
import StatsCard from "../components/dashboard/StatsCard";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Filter,
  Info,
  PieChart,
  ShoppingBag,
  Star,
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
  severidade: "crítico" | "atenção" | "informativo";
  motivo: string;
  metrica: string;
  sugestao: string;
  filtro?: Partial<DashboardFilters>;
};

const CHANNELS = [
  { label: "Venda Direta", color: "#0b4fb3", costPerLead: 180, expectedCac: 260 },
  { label: "Parceiros", color: "#3388d9", costPerLead: 120, expectedCac: 210 },
  { label: "Tráfego Pago", color: "#7c5cff", costPerLead: 390, expectedCac: 320 },
  { label: "Indicação", color: "#50c9a7", costPerLead: 75, expectedCac: 160 },
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
  return `${sign}${formatPercent(diff)}${suffix} contra período anterior`;
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

function RevenueChart({ series, previousSeries }: { series: { label: string; value: number }[]; previousSeries: number[] }) {
  const values = series.map((item) => item.value);
  const maxValue = Math.max(...values, ...previousSeries, 1);
  const getPoint = (value: number, index: number, total: number) => {
    const x = total <= 1 ? 210 : (420 / (total - 1)) * index;
    const y = 132 - (value / maxValue) * 104;
    return `${x.toFixed(1)},${Math.max(18, Math.min(132, y)).toFixed(1)}`;
  };
  const points = series.map((item, index) => getPoint(item.value, index, series.length)).join(" ");
  const previousPoints = previousSeries.map((value, index) => getPoint(value, index, previousSeries.length)).join(" ");

  return (
    <div className="relative h-48 overflow-hidden rounded-lg">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-muted)]" />
      <div className="absolute inset-0 grid grid-rows-4">
        {[100, 75, 50, 25].map((mark) => (
          <div key={mark} className="flex items-start border-t border-[var(--border-muted)] text-[11px] text-[var(--text-muted)]">
            <span className="w-10 pt-1">{formatMoney((maxValue * mark) / 100)}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 420 150" className="absolute inset-x-10 bottom-7 h-32 w-[calc(100%-5rem)] overflow-visible">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polyline points={`${points} 420,150 0,150`} fill="url(#revenueFill)" stroke="none" />
        <polyline points={previousPoints} fill="none" stroke="var(--chart-line-2)" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <polyline points={points} fill="none" stroke="var(--chart-line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(" ").filter(Boolean).map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} r="5" fill="var(--bg-elevated)" stroke="var(--chart-line)" strokeWidth="3" />;
        })}
      </svg>
      <div
        className="absolute bottom-1 left-10 right-4 grid text-center text-xs text-[var(--text-muted)]"
        style={{ gridTemplateColumns: `repeat(${Math.max(series.length, 1)}, minmax(0, 1fr))` }}
      >
        {series.map((item) => (
          <span key={item.label} className="truncate px-1">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70 ${className}`} />;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-hover)] p-6 text-center">
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
        width: `${Math.max(count ? 14 : 0, leadCount ? (count / leadCount) * 100 : 0)}%`,
      };
    });
  }, [filteredRows]);

  const productPerformance = useMemo(() => {
    const groups = new Map<string, DashboardRow[]>();
    filteredRows.forEach((row) => {
      const key = `${row.produtoId}-${row.subprodutoId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(row);
    });

    return Array.from(groups.values())
      .map((rows) => {
        const first = rows[0];
        const production = rows.filter((row) => row.etapaRank >= 2).reduce((total, row) => total + row.valor, 0);
        const conversion = rows.length ? (rows.filter((row) => row.etapaRank >= 2).length / rows.length) * 100 : 0;
        const contracts = rows.filter((row) => row.etapaRank >= 3).length;
        const proposals = rows.filter((row) => row.etapaRank >= 1).length;
        const maxCount = Math.max(rows.length, proposals, contracts, 1);

        return {
          produtoId: first.produtoId,
          subprodutoId: first.subprodutoId,
          produto: first.produto,
          subproduto: first.subproduto,
          production,
          conversion,
          leads: rows.length,
          contracts,
          bars: [
            Math.max(10, (rows.length / maxCount) * 100),
            Math.max(10, (proposals / maxCount) * 100),
            Math.max(10, (Math.max(contracts, rows.filter((row) => row.etapaRank >= 2).length) / maxCount) * 100),
          ],
          Icon: getProductIcon(first.produto),
        };
      })
      .sort((a, b) => b.production - a.production)
      .slice(0, 6);
  }, [filteredRows]);

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
    const generated: SmartAlert[] = [];
    const productionRows = filteredRows.filter((row) => row.etapaRank >= 2);
    const scopedPartners = filters.parceiro
      ? parceiros.filter((partner) => String(partner.id) === filters.parceiro)
      : parceiros;

    scopedPartners.forEach((partner) => {
      const rows = productionRows.filter((row) => row.parceiroId === String(partner.id));
      if (rows.length === 0) {
        generated.push({
          id: `parceiro-sem-producao-${partner.id}`,
          titulo: "Parceiro sem produção há mais de 30 dias",
          severidade: "crítico",
          motivo: `${partner.nome} não possui produção no período filtrado.`,
          metrica: "Produção Total",
          sugestao: "Aplicar filtro do parceiro e revisar carteira, pendências e cadência comercial.",
          filtro: { parceiro: String(partner.id) },
        });
      }
    });

    const scopedManagers = filters.responsavel
      ? gerenteOptions.filter((manager) => manager.id === filters.responsavel)
      : gerenteOptions;

    scopedManagers.forEach((manager) => {
      const rows = productionRows.filter((row) => row.responsavelId === manager.id);
      if (rows.length === 0) {
        generated.push({
          id: `gerente-sem-producao-${manager.id}`,
          titulo: "Gerente sem produção há mais de 3 dias",
          severidade: "atenção",
          motivo: `${manager.nome} não tem operação aprovada no recorte atual.`,
          metrica: "Conversão Geral",
          sugestao: "Filtrar o responsável e priorizar propostas em análise ou aprovação.",
          filtro: { responsavel: manager.id },
        });
      }
    });

    const paidTrafficStale = filteredRows.filter((row) => row.canal === "Tráfego Pago" && row.etapaRank <= 1 && row.diasSemMovimento > 2);
    if (paidTrafficStale.length > 0) {
      generated.push({
        id: "trafego-pago-sem-indicacao",
        titulo: "Leads de Tráfego Pago sem indicação há mais de 2 dias",
        severidade: "atenção",
        motivo: `${paidTrafficStale.length} lead(s) de mídia paga ainda não avançaram para aprovação.`,
        metrica: "CAC Médio",
        sugestao: "Filtrar Tráfego Pago e acionar SDR/gerente para qualificação imediata.",
        filtro: { canal: "Tráfego Pago" },
      });
    }

    if (metrics.conversion + 1 < previousMetrics.conversion) {
      generated.push({
        id: "queda-conversao",
        titulo: "Queda de conversão contra período anterior",
        severidade: "crítico",
        motivo: `Conversão atual em ${formatPercent(metrics.conversion)}, abaixo de ${formatPercent(previousMetrics.conversion)}.`,
        metrica: "Conversão Geral",
        sugestao: "Revisar etapas de proposta e aprovação para identificar gargalos.",
      });
    }

    const lowProduct = productPerformance.find((item) => item.leads >= 1 && item.conversion < 25);
    if (lowProduct) {
      generated.push({
        id: `produto-baixa-performance-${lowProduct.produtoId}-${lowProduct.subprodutoId}`,
        titulo: "Produto ou subproduto com baixa performance",
        severidade: "atenção",
        motivo: `${lowProduct.produto} / ${lowProduct.subproduto} está com ${formatPercent(lowProduct.conversion)} de conversão.`,
        metrica: "Desempenho por Produto",
        sugestao: "Filtrar o produto e revisar roteiro, oferta e pendências documentais.",
        filtro: { produto: lowProduct.produtoId, subproduto: lowProduct.subprodutoId },
      });
    }

    const expensiveChannel = channelData.find((channel) => channel.leads > 0 && channel.cac > channel.expectedCac);
    if (expensiveChannel) {
      generated.push({
        id: `canal-cac-${expensiveChannel.label}`,
        titulo: "Canal com CAC acima do esperado",
        severidade: "atenção",
        motivo: `${expensiveChannel.label} está com CAC de ${formatMoney(expensiveChannel.cac)}.`,
        metrica: "CAC Médio",
        sugestao: "Filtrar o canal e redistribuir investimento para origens com maior conversão.",
        filtro: { canal: expensiveChannel.label },
      });
    }

    const partnerGroups = new Map<string, DashboardRow[]>();
    filteredRows.forEach((row) => {
      if (!row.parceiroId) return;
      if (!partnerGroups.has(row.parceiroId)) partnerGroups.set(row.parceiroId, []);
      partnerGroups.get(row.parceiroId)?.push(row);
    });

    const partnerWithLowConversion = Array.from(partnerGroups.values()).find((rows) => {
      const conversion = rows.length ? (rows.filter((row) => row.etapaRank >= 2).length / rows.length) * 100 : 0;
      return rows.length >= 2 && conversion < 25;
    });

    if (partnerWithLowConversion) {
      const first = partnerWithLowConversion[0];
      generated.push({
        id: `parceiro-leads-baixa-conversao-${first.parceiroId}`,
        titulo: "Parceiro com muitos leads e baixa conversão",
        severidade: "crítico",
        motivo: `${first.parceiro} gerou ${partnerWithLowConversion.length} leads com baixa evolução no funil.`,
        metrica: "Funil Consolidado",
        sugestao: "Filtrar parceiro e comparar qualidade de entrada com aprovações.",
        filtro: { parceiro: first.parceiroId },
      });
    }

    if (generated.length === 0) {
      generated.push({
        id: "operacao-estavel",
        titulo: "Operação sem alertas críticos no recorte",
        severidade: "informativo",
        motivo: "Nenhuma ruptura operacional relevante foi encontrada para os filtros ativos.",
        metrica: "Saúde operacional",
        sugestao: "Manter acompanhamento diário e comparar com o próximo período.",
      });
    }

    const severityOrder = { crítico: 0, atenção: 1, informativo: 2 };
    return generated
      .sort((a, b) => severityOrder[a.severidade] - severityOrder[b.severidade])
      .slice(0, 7);
  }, [channelData, filteredRows, filters, gerenteOptions, metrics.conversion, parceiros, previousMetrics.conversion, productPerformance]);

  const exportRows = useMemo(() => {
    const rows = [
      { secao: "KPIs", indicador: "Produção Total", metrica: "Valor", valor: formatMoney(metrics.production), contexto: `${filteredRows.length} lead(s) filtrados`, sugestao: "" },
      { secao: "KPIs", indicador: "Originação Total", metrica: "Valor", valor: formatMoney(metrics.origination), contexto: `${filteredRows.length} lead(s) filtrados`, sugestao: "" },
      { secao: "KPIs", indicador: "Conversão Geral", metrica: "Percentual", valor: formatPercent(metrics.conversion), contexto: `${metrics.approved} aprovado(s)`, sugestao: "" },
      { secao: "KPIs", indicador: "CAC Médio", metrica: "Valor", valor: formatMoney(metrics.cac), contexto: "Custo de aquisição estimado", sugestao: "" },
      { secao: "KPIs", indicador: "LTV Médio", metrica: "Valor", valor: formatMoney(metrics.ltv), contexto: "Valor médio estimado", sugestao: "" },
      ...funnelRows.map((row) => ({ secao: "Funil Consolidado", indicador: row.label, metrica: "Volume", valor: row.value, contexto: row.conversion, sugestao: "" })),
      ...channelData.map((channel) => ({ secao: "Receita por Canal", indicador: channel.label, metrica: "Produção", valor: formatMoney(channel.production), contexto: `${formatPercent(channel.percentage)} | CAC ${formatMoney(channel.cac)}`, sugestao: "" })),
      ...productPerformance.map((product) => ({ secao: "Desempenho por Produto", indicador: `${product.produto} / ${product.subproduto}`, metrica: "Produção", valor: formatMoney(product.production), contexto: `${product.leads} lead(s) | ${formatPercent(product.conversion)}`, sugestao: "" })),
      ...alerts.map((alert) => ({ secao: "Alertas Inteligentes", indicador: alert.titulo, metrica: alert.metrica, valor: alert.severidade, contexto: alert.motivo, sugestao: alert.sugestao })),
    ];

    return rows;
  }, [alerts, channelData, filteredRows.length, funnelRows, metrics, productPerformance]);

  const activeFilterLabels = useMemo(() => {
    const periodLabel = PERIOD_OPTIONS.find((item) => item.value === filters.periodo)?.label ?? "Período";
    const productLabel = productStructure.products.find((item) => String(item.id) === filters.produto)?.nome;
    const subproductLabel = productStructure.subproducts.find((item) => String(item.id) === filters.subproduto)?.nome;
    const partnerLabel = parceiros.find((item) => String(item.id) === filters.parceiro)?.nome;
    const managerLabel = gerenteOptions.find((item) => item.id === filters.responsavel)?.nome;

    return [
      periodLabel,
      productLabel,
      subproductLabel,
      filters.canal,
      partnerLabel,
      managerLabel,
    ].filter(Boolean);
  }, [filters, gerenteOptions, parceiros, productStructure]);

  const dateRangeLabel = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;

  const setFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(getInitialFilters());

  const applyAlertFilter = (patch?: Partial<DashboardFilters>) => {
    if (!patch) return;
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="app-page">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold leading-tight tracking-normal text-[var(--text-primary)] sm:text-3xl">
            Painel Executivo
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span key={label} className="rounded-full border border-[var(--border-muted)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="finqz-control min-h-10 w-full min-w-0 justify-start px-3 text-sm sm:w-auto sm:max-w-[280px]"
          >
            <CalendarDays size={17} />
            <span className="min-w-0 truncate">{dateRangeLabel}</span>
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
            onClick={() => setFiltersOpen(true)}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary-hover"
          >
            <span className="flex items-center gap-2">
              <Filter size={17} />
              Filtros
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-36" />)
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
              change={`${metrics.conversion >= previousMetrics.conversion ? "+" : ""}${formatPercent(metrics.conversion - previousMetrics.conversion)} p.p. contra período anterior`}
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Desempenho por Produto e Subproduto</h3>
              <p className="text-xs text-[var(--text-muted)]">Dados derivados da Estrutura Comercial e do funil filtrado.</p>
            </div>
            <span className="rounded-full border border-[var(--border-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {formatInteger(productPerformance.length)} grupo(s)
            </span>
          </div>

          {loading ? (
            <SkeletonBlock className="h-48" />
          ) : productPerformance.length === 0 ? (
            <EmptyState title="Nenhum desempenho encontrado" detail="Ajuste os filtros para visualizar produção por produto e subproduto." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {productPerformance.map((product, index) => {
                const Icon = product.Icon;
                return (
                  <div
                    key={`${product.produtoId}-${product.subprodutoId}`}
                    className={`min-w-0 ${index > 0 ? "lg:border-l lg:border-[var(--border-muted)] lg:pl-5" : ""}`}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="finqz-icon-badge h-10 w-10">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text-primary)]">{product.produto}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{product.subproduto}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-primary)]">{formatMoney(product.production)}</p>
                          <p className="text-xs text-[var(--text-muted)]">Produção</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[var(--text-primary)]">{formatPercent(product.conversion)}</p>
                          <p className="text-xs text-[var(--text-muted)]">Conversão</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-[var(--text-primary)]">{formatInteger(product.contracts)}</p>
                          <p className="text-xs text-[var(--text-muted)]">Contratos</p>
                        </div>
                      </div>

                      <div className="flex h-28 items-end gap-2">
                        {product.bars.map((height, barIndex) => (
                          <div
                            key={`${product.produto}-${barIndex}`}
                            className="w-6 rounded-t-md border border-white/20 bg-gradient-to-t from-primary to-[var(--color-primary-soft)] shadow-sm"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Funil Consolidado</h3>
              <p className="text-xs text-[var(--text-muted)]">Leads até concluídos conforme filtros ativos.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
          </div>

          {loading ? (
            <SkeletonBlock className="h-48" />
          ) : filteredRows.length === 0 ? (
            <EmptyState title="Funil sem dados" detail="Não há leads no período e filtros selecionados." />
          ) : (
            <div className="space-y-3">
              {funnelRows.map((row) => (
                <div key={row.key} className="grid grid-cols-[96px_1fr_64px] items-center gap-3 text-sm">
                  <span className="font-medium text-[var(--text-secondary)]">{row.label}</span>
                  <div className="relative h-9 overflow-hidden rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-hover)]">
                    <div
                      className="flex h-full items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-primary-soft)] to-primary text-xs font-bold text-white shadow-sm"
                      style={{ width: row.width, marginInline: "auto" }}
                    >
                      {row.value}
                    </div>
                  </div>
                  <span className="text-right font-semibold text-[var(--text-primary)]">{row.conversion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.95fr_1.15fr]">
        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Produção ao Longo do Tempo</h3>
              <p className="text-xs text-[var(--text-muted)]">Linha pontilhada representa base comparativa.</p>
            </div>
            <span className="text-xs font-semibold text-[var(--color-primary)]">{formatMoney(metrics.production)}</span>
          </div>
          {loading ? <SkeletonBlock className="h-48" /> : <RevenueChart series={chartSeries} previousSeries={previousChartSeries} />}
        </div>

        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Receita por Canal</h3>
              <p className="text-xs text-[var(--text-muted)]">Venda Direta, Parceiros, Tráfego Pago e Indicação.</p>
            </div>
            <Users className="h-5 w-5 text-[var(--color-primary)]" />
          </div>

          {loading ? (
            <SkeletonBlock className="h-48" />
          ) : (
            <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
              <div
                className="h-32 w-32 shrink-0 rounded-full border border-[var(--border-default)] shadow-card"
                style={{ background: channelGradient }}
              >
                <div className="m-8 h-16 w-16 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)]" />
              </div>
              <div className="w-full space-y-3">
                {channelData.map((channel) => (
                  <div key={channel.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-[var(--text-secondary)]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: channel.color }} />
                      <span className="truncate">{channel.label}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-[var(--text-primary)]">{formatPercent(channel.percentage)}</span>
                      <span className="block text-xs text-[var(--text-muted)]">{formatMoney(channel.production)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Alertas Inteligentes</h3>
              <p className="text-xs text-[var(--text-muted)]">Análise operacional com contexto acionável.</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
          </div>

          {loading ? (
            <SkeletonBlock className="h-56" />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const toneClass =
                  alert.severidade === "crítico"
                    ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"
                    : alert.severidade === "atenção"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                      : "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300";
                const Icon = alert.severidade === "informativo" ? Info : AlertTriangle;

                return (
                  <div key={alert.id} className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-hover)] p-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{alert.titulo}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${toneClass}`}>
                            {alert.severidade}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{alert.motivo}</p>
                        <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">Métrica afetada: {alert.metrica}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{alert.sugestao}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {alert.filtro && (
                            <button
                              type="button"
                              onClick={() => applyAlertFilter(alert.filtro)}
                              className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                            >
                              Aplicar filtro
                            </button>
                          )}
                          <a
                            href="/app/crm/pipeline"
                            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
                          >
                            Abrir pipeline
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
