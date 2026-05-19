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
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={notificacoes}
        exportColumns={[{ key: 'nome', label: 'Nome' }]}
        exportFilename="notificacoes"
      />
      
      <div className="finqz-card p-4 sm:p-5">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Regras de notificação</h3>
          
          {/* Lista de Notificações */}
          <div className="space-y-3">
            {notificacoes.map((notificacao) => (
              <div key={notificacao.id} className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-[var(--text-primary)]">{notificacao.nome}</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{notificacao.descricao}</p>
                  </div>
                </div>
                
                {/* Canais de notificação */}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => toggleNotificacao(notificacao.id, 'email')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      notificacao.email 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
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
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
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
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
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
