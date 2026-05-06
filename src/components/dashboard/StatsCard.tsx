import React from "react"

type Props = {
  title: string
  value: string
  change?: string
  icon?: React.ReactNode
  variant?: "blue" | "green" | "cyan" | "purple" | "orange" | "red"
}

const variantStyles = {
  blue: {
    gradient: "from-blue-500/20 via-blue-600/10 to-blue-700/5",
    glow: "shadow-blue-500/25",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-300"
  },
  green: {
    gradient: "from-emerald-500/20 via-emerald-600/10 to-emerald-700/5",
    glow: "shadow-emerald-500/25",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-300"
  },
  cyan: {
    gradient: "from-cyan-500/20 via-cyan-600/10 to-cyan-700/5",
    glow: "shadow-cyan-500/25",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-300"
  },
  purple: {
    gradient: "from-purple-500/20 via-purple-600/10 to-purple-700/5",
    glow: "shadow-purple-500/25",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-300"
  },
  orange: {
    gradient: "from-orange-500/20 via-orange-600/10 to-orange-700/5",
    glow: "shadow-orange-500/25",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-300"
  },
  red: {
    gradient: "from-red-500/20 via-red-600/10 to-red-700/5",
    glow: "shadow-red-500/25",
    border: "border-red-500/20",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-300"
  }
}

export default function StatsCard({ title, value, change, icon, variant = "blue" }: Props) {
  const styles = variantStyles[variant]

  return (
    <div className={`
      group relative overflow-hidden rounded-2xl
      bg-gradient-to-br ${styles.gradient}
      border ${styles.border}
      backdrop-blur-xl
      p-6
      transition-all duration-500 ease-out
      hover:scale-[1.02] hover:-translate-y-1
      hover:shadow-2xl hover:${styles.glow}
      hover:border-white/30
      cursor-pointer
      min-h-[140px]
    `}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:bg-white/10 group-hover:scale-110" />
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-white/5 blur-xl transition-all duration-500 group-hover:bg-white/8" />

      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            {icon && (
              <div className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                ${styles.iconBg} ${styles.iconColor}
                transition-all duration-300 group-hover:scale-110
              `}>
                {icon}
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
              {title}
            </p>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 group-hover:scale-105 transition-transform duration-300">
            {value}
          </h2>

          {change && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                {change}
              </p>
            </div>
          )}
        </div>

        {/* Decorative Element */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-sm" />
        </div>
      </div>
    </div>
  )
}