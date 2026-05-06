type Props = {
  title: string
  value: string
  change?: string
}

export default function StatsCard({ title, value, change }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0F172A]/80 backdrop-blur-xl border border-white/10/[0.06] hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.45)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/10 opacity-70" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl transition-all duration-300 group-hover:bg-blue-500/20" />

      <div className="relative">
        <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(59,130,246,0.25)]">
          {value}
        </h2>

        {change && (
          <p className="mt-4 text-sm font-semibold text-emerald-400">
            ↑ {change}
          </p>
        )}
      </div>
    </div>
  )
}