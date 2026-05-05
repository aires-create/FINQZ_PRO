import StatsCard from "../components/dashboard/StatsCard"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">📊 Painel FINQZ</h1>

      {/* GRID DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatsCard
          title="Receita Total"
          value="R$ 128.450"
          change="+12% este mês"
        />

        <StatsCard
          title="Leads"
          value="2.340"
          change="+8% crescimento"
        />

        <StatsCard
          title="Conversão"
          value="18.5%"
        />

        <StatsCard
          title="Clientes Ativos"
          value="312"
        />

      </div>

    </div>
  )
}