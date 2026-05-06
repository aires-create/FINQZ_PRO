import StatsCard from "../components/dashboard/StatsCard"
import { Card, CardHeader, CardTitle, CardContent } from "../design-system/components/Card"
import { DollarSign, Users, TrendingUp, Target } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#0F172A] to-[#1E293B] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER SECTION */}
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent tracking-tight">
            📊 Painel FINQZ
          </h1>
          <p className="text-slate-400 text-sm lg:text-base">
            Visão geral do seu negócio em tempo real
          </p>
        </div>

        {/* KPIs GRID */}
        <Card className="border-white/5 bg-[#0F172A]/40 backdrop-blur-2xl shadow-2xl shadow-blue-500/5">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Indicadores Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatsCard
                title="Receita Total"
                value="R$ 128.450"
                change="+12% este mês"
                icon={<DollarSign className="w-5 h-5" />}
                variant="green"
              />

              <StatsCard
                title="Leads"
                value="2.340"
                change="+8% crescimento"
                icon={<Users className="w-5 h-5" />}
                variant="blue"
              />

              <StatsCard
                title="Conversão"
                value="18.5%"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="cyan"
              />

              <StatsCard
                title="Clientes Ativos"
                value="312"
                icon={<Target className="w-5 h-5" />}
                variant="purple"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}