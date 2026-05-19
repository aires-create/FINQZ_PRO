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
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-300",
    valueColor: "text-blue-700 dark:text-blue-300"
  },
  green: {
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    valueColor: "text-emerald-700 dark:text-emerald-300"
  },
  cyan: {
    border: "border-cyan-500/20",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-300",
    valueColor: "text-sky-700 dark:text-sky-300"
  },
  purple: {
    border: "border-purple-500/20",
    iconBg: "bg-slate-500/10 border-slate-500/20",
    iconColor: "text-slate-600 dark:text-slate-300",
    valueColor: "text-[var(--text-primary)]"
  },
  orange: {
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-300",
    valueColor: "text-amber-700 dark:text-amber-300"
  },
  red: {
    border: "border-red-500/20",
    iconBg: "bg-red-500/10 border-red-500/20",
    iconColor: "text-red-600 dark:text-red-300",
    valueColor: "text-red-700 dark:text-red-300"
  }
}

export default function StatsCard({ title, value, change, icon, variant = "blue" }: Props) {
  const styles = variantStyles[variant]
  const isNegative = change?.trim().startsWith("-")
  const isNeutral = change?.startsWith("Sem base")

  return (
    <div className={`finqz-kpi-card group flex min-h-[112px] flex-col justify-between gap-3 p-3.5 sm:p-4 ${styles.border}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-extrabold uppercase tracking-normal text-[var(--text-secondary)] sm:text-xs">
          {title}
        </p>
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${styles.iconBg} ${styles.iconColor} sm:h-10 sm:w-10`}>
            {icon}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h2 className={`truncate text-[1.35rem] font-semibold leading-none tabular-nums sm:text-[1.5rem] ${styles.valueColor}`}>
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
