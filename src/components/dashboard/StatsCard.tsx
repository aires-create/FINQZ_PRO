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
    iconBg: "from-blue-500/90 to-blue-700/80",
    iconColor: "text-white",
    glow: "shadow-blue-500/10"
  },
  green: {
    border: "border-emerald-500/20",
    iconBg: "from-emerald-400/90 to-blue-600/80",
    iconColor: "text-white",
    glow: "shadow-emerald-500/10"
  },
  cyan: {
    border: "border-cyan-500/20",
    iconBg: "from-cyan-400/90 to-blue-600/80",
    iconColor: "text-white",
    glow: "shadow-cyan-500/10"
  },
  purple: {
    border: "border-purple-500/20",
    iconBg: "from-violet-400/90 to-indigo-700/80",
    iconColor: "text-white",
    glow: "shadow-violet-500/10"
  },
  orange: {
    border: "border-amber-500/20",
    iconBg: "from-amber-400/90 to-orange-600/80",
    iconColor: "text-white",
    glow: "shadow-amber-500/10"
  },
  red: {
    border: "border-red-500/20",
    iconBg: "from-rose-400/90 to-violet-700/80",
    iconColor: "text-white",
    glow: "shadow-rose-500/10"
  }
}

export default function StatsCard({ title, value, change, icon, variant = "blue" }: Props) {
  const styles = variantStyles[variant]
  const isNegative = change?.trim().startsWith("-")
  const isNeutral = change?.startsWith("Sem base")

  return (
    <div className={`finqz-kpi-card group flex min-h-[128px] flex-col justify-between p-4 shadow-xl ${styles.border} ${styles.glow}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-bold uppercase text-[var(--text-secondary)]">
          {title}
        </p>
        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${styles.iconBg} ${styles.iconColor} shadow-lg transition-transform duration-200 group-hover:scale-105`}>
            {icon}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-[1.55rem] font-extrabold leading-tight text-[#1f75ff] dark:text-[#3b82ff]">
          {value}
        </h2>

        {change && (
          <div className={`mt-3 flex min-w-0 items-center gap-1.5 ${
            isNeutral
              ? "text-[var(--text-muted)]"
              : isNegative
                ? "text-orange-500 dark:text-orange-300"
                : "text-emerald-600 dark:text-emerald-300"
          }`}>
            {isNegative ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <p className="truncate text-xs font-semibold">
              {change}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
