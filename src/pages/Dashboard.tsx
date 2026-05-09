import StatsCard from "../components/dashboard/StatsCard";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Filter,
  Info,
  PieChart,
  ShoppingBag,
  Star,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";

const products = [
  {
    label: "Credito",
    revenue: "R$ 2.145.300",
    metric: "34,2%",
    metricLabel: "Margem",
    contracts: "1.469",
    contractsLabel: "Tickets",
    icon: CreditCard,
    bars: [62, 88, 70],
  },
  {
    label: "Energia GD",
    revenue: "R$ 1.185.600",
    metric: "41,8%",
    metricLabel: "Margem",
    contracts: "368",
    contractsLabel: "Contratos",
    icon: Zap,
    bars: [54, 74, 46],
  },
  {
    label: "Mercado Livre",
    revenue: "R$ 349.550",
    metric: "28,6%",
    metricLabel: "Margem",
    contracts: "26",
    contractsLabel: "Contratos",
    icon: ShoppingBag,
    bars: [56, 31, 10],
  },
];

const funnelRows = [
  { label: "Leads", value: "8.745", conversion: "100%", width: "100%" },
  { label: "Propostas", value: "4.328", conversion: "49,5%", width: "78%" },
  { label: "Aprovados", value: "2.163", conversion: "25,4%", width: "58%" },
  { label: "Contratos", value: "1.452", conversion: "16,6%", width: "42%" },
  { label: "Concluidos", value: "1.169", conversion: "13,4%", width: "28%" },
];

const channels = [
  { label: "Trafego Pago", value: "42,1%", color: "#0b4fb3" },
  { label: "Parceiros", value: "28,4%", color: "#3388d9" },
  { label: "Organico", value: "17,6%", color: "#7c5cff" },
  { label: "Indicacao", value: "11,9%", color: "#50c9a7" },
];

const alerts = [
  {
    title: "Aumento de inadimplencia",
    detail: "Credito - 30 dias",
    severity: "Critico",
    tone: "red",
    icon: AlertTriangle,
  },
  {
    title: "Queda na conversao de propostas",
    detail: "Energia GD",
    severity: "Atencao",
    tone: "amber",
    icon: AlertTriangle,
  },
  {
    title: "CAC acima da meta",
    detail: "Mercado Livre",
    severity: "Informativo",
    tone: "blue",
    icon: Info,
  },
];

const chartPoints = "0,120 70,88 140,94 210,45 280,62 350,54 420,22";

function RevenueChart() {
  return (
    <div className="relative h-44 overflow-hidden rounded-lg">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-muted)]" />
      <div className="absolute inset-0 grid grid-rows-4">
        {["4M", "3M", "2M", "1M"].map((label) => (
          <div key={label} className="flex items-start border-t border-[var(--border-muted)] text-[11px] text-[var(--text-muted)]">
            <span className="w-8 pt-1">{label}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 420 150" className="absolute inset-x-8 bottom-6 h-32 w-[calc(100%-4rem)] overflow-visible">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polyline
          points={`${chartPoints} 420,150 0,150`}
          fill="url(#revenueFill)"
          stroke="none"
        />
        <polyline
          points={chartPoints}
          fill="none"
          stroke="var(--chart-line)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="0,120 70,101 140,83 210,51 280,67 350,56 420,25"
          fill="none"
          stroke="var(--chart-line-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {chartPoints.split(" ").map((point) => {
          const [cx, cy] = point.split(",");
          return (
            <circle
              key={point}
              cx={cx}
              cy={cy}
              r="6"
              fill="var(--bg-elevated)"
              stroke="var(--chart-line)"
              strokeWidth="3"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-1 left-8 right-2 grid grid-cols-6 text-center text-xs text-[var(--text-muted)]">
        {["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"].map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="app-page">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Ola, Gestor!
          </h2>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Veja o desempenho geral da promotora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="finqz-control h-11 px-3 text-sm">
            <CalendarDays size={17} />
            <span>01/05/2024 - 31/05/2024</span>
          </button>
          <button className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary-hover">
            <span className="flex items-center gap-2">
              <Filter size={17} />
              Filtros
            </span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          title="Receita Total"
          value="R$ 3.680.450"
          change="+18,6% vs mes anterior"
          icon={<CircleDollarSign className="h-5 w-5" />}
          variant="blue"
        />
        <StatsCard
          title="Originacao Total"
          value="R$ 12.450.000"
          change="+21,3% vs mes anterior"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="cyan"
        />
        <StatsCard
          title="Conversao Geral"
          value="26,8%"
          change="+3,2 p.p. vs mes anterior"
          icon={<UserRound className="h-5 w-5" />}
          variant="green"
        />
        <StatsCard
          title="CAC Medio"
          value="R$ 215,40"
          change="-8,4% vs mes anterior"
          icon={<PieChart className="h-5 w-5" />}
          variant="red"
        />
        <StatsCard
          title="LTV Medio"
          value="R$ 1.842,00"
          change="+12,7% vs mes anterior"
          icon={<Star className="h-5 w-5" />}
          variant="purple"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Performance por Produto</h3>
            <button className="finqz-control h-9 px-3 text-xs">Este mes</button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {products.map((product, index) => {
              const Icon = product.icon;
              return (
                <div
                  key={product.label}
                  className={`min-w-0 ${index > 0 ? "lg:border-l lg:border-[var(--border-muted)] lg:pl-5" : ""}`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="finqz-icon-badge h-10 w-10">
                      <Icon size={18} />
                    </div>
                    <p className="font-semibold text-[var(--text-primary)]">{product.label}</p>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-primary)]">{product.revenue}</p>
                        <p className="text-xs text-[var(--text-muted)]">Receita</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{product.metric}</p>
                        <p className="text-xs text-[var(--text-muted)]">{product.metricLabel}</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[var(--text-primary)]">{product.contracts}</p>
                        <p className="text-xs text-[var(--text-muted)]">{product.contractsLabel}</p>
                      </div>
                    </div>

                    <div className="flex h-28 items-end gap-2">
                      {product.bars.map((height, barIndex) => (
                        <div
                          key={`${product.label}-${barIndex}`}
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
        </div>

        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Funnel Consolidado</h3>
            <button className="finqz-control h-9 px-3 text-xs">Todos os produtos</button>
          </div>

          <div className="space-y-3">
            {funnelRows.map((row, index) => (
              <div key={row.label} className="grid grid-cols-[92px_1fr_58px] items-center gap-3 text-sm">
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
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.95fr_1.15fr]">
        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Receita ao Longo do Tempo</h3>
            <button className="finqz-control h-9 px-3 text-xs">Ultimos 6 meses</button>
          </div>
          <RevenueChart />
        </div>

        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Receita por Canal</h3>
            <button className="finqz-control h-9 px-3 text-xs">Este mes</button>
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
            <div
              className="h-32 w-32 shrink-0 rounded-full border border-[var(--border-default)] shadow-card"
              style={{
                background: "conic-gradient(#0b4fb3 0 42%, #3388d9 42% 70%, #7c5cff 70% 88%, #50c9a7 88% 100%)",
              }}
            >
              <div className="m-8 h-16 w-16 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)]" />
            </div>
            <div className="w-full space-y-3">
              {channels.map((channel) => (
                <div key={channel.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-[var(--text-secondary)]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: channel.color }} />
                    <span className="truncate">{channel.label}</span>
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">{channel.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="finqz-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Alertas</h3>
            <button className="text-xs font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]">
              Ver todos
            </button>
          </div>

          <div className="divide-y divide-[var(--border-muted)]">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              const toneClass =
                alert.tone === "red"
                  ? "bg-red-500/10 text-red-600 dark:text-red-300"
                  : alert.tone === "amber"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-300";
              return (
                <div key={alert.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{alert.title}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{alert.detail}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-primary)]">{alert.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
