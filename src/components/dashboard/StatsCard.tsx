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
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-300"
  },
  green: {
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-300"
  },
  cyan: {
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-300"
  },
  purple: {
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-300"
  },
  orange: {
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-300"
  },
  red: {
    border: "border-red-500/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-300"
  }
}

export default function StatsCard({ title, value, change, icon, variant = "blue" }: Props) {
  const styles = variantStyles[variant]
  const isNegative = change?.trim().startsWith("-")

  return (
    <div className={`finqz-kpi-card group flex min-h-[116px] flex-col justify-between p-3 sm:p-4 ${styles.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {icon && (
              <div className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${styles.border}
                ${styles.iconBg} ${styles.iconColor}
              `}>
                {icon}
              </div>
            )}
            <p className="truncate text-xs font-semibold uppercase text-[var(--text-muted)]">
              {title}
            </p>
          </div>

          <h2 className="mb-1 truncate text-[1.35rem] font-bold leading-tight text-[var(--text-primary)]">
            {value}
          </h2>

          {change && (
            <div className={`flex min-w-0 items-center gap-1.5 ${isNegative ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
              {isNegative ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              <p className="truncate text-xs font-semibold">
                {change}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
