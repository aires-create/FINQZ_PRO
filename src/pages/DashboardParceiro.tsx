// FINQZ PRO - Dashboard Parceiro
import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, TrendingUp, DollarSign, FileText, LogOut, Search, Bell } from "lucide-react";
import { Layout } from "../layouts/MainLayout";
import useAppStore from "../store";

// Menu items específicos para parceiro
const parceiroMenuItems = [
  { path: "/app/parceiro", label: "Dashboard", icon: TrendingUp },
  { path: "/app/parceiro/clientes", label: "Meus Clientes", icon: Users },
  { path: "/app/parceiro/oportunidades", label: "Oportunidades", icon: FileText },
];

export const DashboardParceiroPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, parceiros, oportunidades } = useAppStore();
  
  // Encontrar o parceiro logado
  const parceiro = parceiros.find(p => p.id === user?.parceiroId);
  
  // Estatísticas do parceiro
  const parceiroOportunidades = oportunidades.filter(o => o.parceiro_id === parceiro?.id);
  const valorTotal = parceiroOportunidades.reduce((acc, o) => acc + (o.valor || 0), 0);
  const emAnalise = parceiroOportunidades.filter(o => o.status === "analise").length;
  const aprovados = parceiroOportunidades.filter(o => o.status === "aprovado").length;

  if (!parceiro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Parceiro não encontrado</p>
      </div>
    );
  }

  // Conteúdo principal do Dashboard Parceiro
  const DashboardContent = () => (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Olá, {parceiro.nome}!</h1>
        <p className="text-slate-500">Bem-vindo à sua área de parceiro</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1f2937]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-[#000dff]" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{parceiroOportunidades.length}</p>
          <p className="text-sm text-slate-500">Total de Operações</p>
        </div>

        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1f2937]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-500">Valor Total</p>
        </div>

        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1f2937]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Search className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{emAnalise}</p>
          <p className="text-sm text-slate-500">Em Análise</p>
        </div>

        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1f2937]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bell className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{aprovados}</p>
          <p className="text-sm text-slate-500">Aprovados</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Últimas Operações</h2>
        {parceiroOportunidades.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Nenhuma operação encontrada</p>
        ) : (
          <div className="space-y-3">
            {parceiroOportunidades.slice(0, 5).map((opp) => (
              <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-white">{opp.nome}</p>
                  <p className="text-sm text-slate-500">{opp.produto}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    R$ {opp.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    opp.status === "aprovado" ? "bg-green-100 text-green-700" :
                    opp.status === "analise" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-slate-300"
                  }`}>
                    {opp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return <Layout customMenuItems={parceiroMenuItems}>{DashboardContent()}</Layout>;
};

export default DashboardParceiroPage;
