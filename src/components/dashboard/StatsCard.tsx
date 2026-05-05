type Props = {
  title: string
  value: string
  change?: string
}

export default function StatsCard({ title, value, change }: Props) {
  return (
    <div className="bg-zinc-900 text-white p-4 rounded-2xl shadow-md border border-zinc-800">
      <p className="text-zinc-400 text-sm">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
      {change && (
        <p className="text-green-400 text-sm mt-1">{change}</p>
      )}
    </div>
  )
}