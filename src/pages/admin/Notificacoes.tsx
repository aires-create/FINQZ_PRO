// FINQZ PRO - Notificações Page
import React, { useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Check } from "lucide-react";
import { Button, Input } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

interface Notificacao {
  id: string;
  nome: string;
  descricao: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export const NotificacoesPage: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    { id: 'novo_lead', nome: 'Novo Lead', descricao: 'Quando um novo lead é criado', email: true, push: true, sms: false },
    { id: 'lead_quente', nome: 'Lead Quente', descricao: 'Quando um lead muda para estágio quente', email: true, push: true, sms: true },
    { id: 'proposta_enviada', nome: 'Proposta Enviada', descricao: 'Quando uma proposta é enviada', email: true, push: false, sms: false },
    { id: 'proposta_aceita', nome: 'Proposta Aceita', descricao: 'Quando uma proposta é aceita', email: true, push: true, sms: true },
    { id: 'evento_amanha', nome: 'Evento Amanhã', descricao: 'Lembrete de eventos agendados', email: true, push: true, sms: false },
    { id: 'audiencia_hoje', nome: 'Audiência Hoje', descricao: 'Lembrete de audiências do dia', email: true, push: true, sms: true },
  ]);

  const toggleNotificacao = (id: string, canal: 'email' | 'push' | 'sms') => {
    setNotificacoes(notificacoes.map(n => 
      n.id === id ? { ...n, [canal]: !n[canal] } : n
    ));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(notificacoes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notificacoes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Gerencie as notificações do sistema"
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={notificacoes}
        exportColumns={[{ key: 'nome', label: 'Nome' }]}
        exportFilename="notificacoes"
      />
      
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
          
          {/* Lista de Notificações */}
          <div className="space-y-3">
            {notificacoes.map((notificacao) => (
              <div key={notificacao.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{notificacao.nome}</h4>
                    <p className="text-sm text-gray-500 mt-1">{notificacao.descricao}</p>
                  </div>
                </div>
                
                {/* Canais de notificação */}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => toggleNotificacao(notificacao.id, 'email')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      notificacao.email 
                        ? 'bg-[#000dff]/10 border-[#000dff] text-[#000dff]' 
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Mail size={16} />
                    <span className="text-sm">E-mail</span>
                    {notificacao.email && <Check size={14} />}
                  </button>
                  
                  <button
                    onClick={() => toggleNotificacao(notificacao.id, 'push')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      notificacao.push 
                        ? 'bg-[#000dff]/10 border-[#000dff] text-[#000dff]' 
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Bell size={16} />
                    <span className="text-sm">Push</span>
                    {notificacao.push && <Check size={14} />}
                  </button>
                  
                  <button
                    onClick={() => toggleNotificacao(notificacao.id, 'sms')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      notificacao.sms 
                        ? 'bg-[#000dff]/10 border-[#000dff] text-[#000dff]' 
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone size={16} />
                    <span className="text-sm">SMS</span>
                    {notificacao.sms && <Check size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificacoesPage;
