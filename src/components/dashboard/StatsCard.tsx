import React from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

type Props = {
  title: string
  value: string
  change?: string
  icon?: React.ReactNode
  variant?: "blue" | "green" | "cyan" | "purple" | "orange" | "red"
}

const variantStyles = {
  blue: {
    border: "border-blue-500/20",
    iconBg: "from-blue-500/85 to-blue-700/75",
    iconColor: "text-white",
    glow: "shadow-blue-950/5"
  },
  green: {
    border: "border-emerald-500/20",
    iconBg: "from-emerald-400/85 to-blue-600/75",
    iconColor: "text-white",
    glow: "shadow-emerald-950/5"
  },
  cyan: {
    border: "border-cyan-500/20",
    iconBg: "from-cyan-400/85 to-blue-600/75",
    iconColor: "text-white",
    glow: "shadow-cyan-950/5"
  },
  purple: {
    border: "border-purple-500/20",
    iconBg: "from-violet-400/85 to-indigo-700/75",
    iconColor: "text-white",
    glow: "shadow-violet-950/5"
  },
  orange: {
    border: "border-amber-500/20",
    iconBg: "from-amber-400/85 to-orange-600/75",
    iconColor: "text-white",
    glow: "shadow-amber-950/5"
  },
  red: {
    border: "border-red-500/20",
    iconBg: "from-rose-400/85 to-violet-700/75",
    iconColor: "text-white",
    glow: "shadow-rose-950/5"
  }
}

export default function StatsCard({ title, value, change, icon, variant = "blue" }: Props) {
  const styles = variantStyles[variant]
  const isNegative = change?.trim().startsWith("-")
  const isNeutral = change?.startsWith("Sem base")

  return (
    <div className={`finqz-kpi-card group flex min-h-[122px] flex-col justify-between gap-3 p-3.5 shadow-sm sm:p-4 ${styles.border} ${styles.glow}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-extrabold uppercase tracking-normal text-[var(--text-secondary)] sm:text-xs">
          {title}
        </p>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${styles.iconBg} ${styles.iconColor} shadow-sm transition-transform duration-200 group-hover:scale-[1.03] sm:h-11 sm:w-11`}>
            {icon}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-[1.42rem] font-extrabold leading-none text-[#1265f1] dark:text-[#5aa2ff] sm:text-[1.55rem]">
          {value}
        </h2>

        {change && (
          <div className={`mt-2.5 flex min-w-0 items-center gap-1.5 ${
            isNeutral
              ? "text-[var(--text-muted)]"
              : isNegative
                ? "text-orange-500 dark:text-orange-300"
                : "text-emerald-600 dark:text-emerald-300"
          }`}>
            {isNegative ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <p className="truncate text-[11px] font-semibold sm:text-xs">
              {change}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
