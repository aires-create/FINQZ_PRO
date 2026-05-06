// Placeholder Enterprise - Em Preparação
import React from "react";
import { Zap, Clock, ListChecks, FileText, Mail, Phone, Bot, Database, Rocket, Lock } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description, icon: Icon, features }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="text-primary" size={40} />
      </div>
      
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
        <Clock size={14} />
        Em Preparação
      </div>
      
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-600 max-w-md mb-8">{description}</p>
      
      <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-xl border border-gray-200 p-6 max-w-lg w-full">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">O que será implementado:</h3>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-slate-600">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Export all placeholders
export const HubDisparos = () => (
  <PlaceholderPage
    title="Disparos"
    description="Sistema de disparo de mensagens em massa com automação e controle de frequência."
    icon={Rocket}
    features={[
      "Disparo via WhatsApp, SMS e Email",
      "Agendamento de campanhas",
      "Controle de frequência por contato",
      "Relatórios de entrega",
      "Template de mensagens"
    ]}
  />
);

export const HubAutomacao = () => (
  <PlaceholderPage
    title="Automação"
    description="Crie fluxos de automação para nutrir leads e converter clientes automaticamente."
    icon={Zap}
    features={[
      "Criador visual de fluxos",
      "Automação baseada em eventos",
      "Condições e ramificações",
      "Integração com CRM",
      "Relatórios de performance"
    ]}
  />
);

export const HubSdrIa = () => (
  <PlaceholderPage
    title="SDR IA"
    description="Assistente de vendas com IA para qualificação automática de leads."
    icon={Bot}
    features={[
      "Qualificação automática de leads",
      "Chatbot inteligente",
      "Agendamento de reuniões",
      "Follow-up automatizado",
      "Análise de sentiment"
    ]}
  />
);

export const HubHigienizacao = () => (
  <PlaceholderPage
    title="Higienização de Base"
    description="Limpeza e validação de bases de dados para melhorar a qualidade dos contatos."
    icon={Database}
    features={[
      "Validação de telefones",
      "Verificação de emails",
      "Deduplicação de registros",
      "Enriquecimento de dados",
      "Relatório de qualidade"
    ]}
  />
);

export const HubMailing = () => (
  <PlaceholderPage
    title="Mailing"
    description="Gestão de listas de Mailing para campanhas de email marketing."
    icon={Mail}
    features={[
      "Importação de listas",
      "Segmentação avançada",
      "Templates de email",
      "Automação de envios",
      "Análise de resultados"
    ]}
  />
);

export const HubWhatsApp = () => (
  <PlaceholderPage
    title="WhatsApp"
    description="Central de mensagens WhatsApp com múltiplos atendentes e automações."
    icon={Phone}
    features={[
      "Múltiplos atendentes",
      "Chatbot WhatsApp",
      "Mensagens automáticas",
      "Catálogo de produtos",
      "Status online"
    ]}
  />
);

export const CrmPipelines = () => (
  <PlaceholderPage
    title="Pipelines"
    description="Visualize e gerencie seus funis de vendas com pipelines personalizados."
    icon={ListChecks}
    features={[
      "Criador de pipelines",
      "Drag and drop de oportunidades",
      "Estágios personalizados",
      "Metas por estágio",
      "Análise de conversão"
    ]}
  />
);

export const AdminPermissoes = () => (
  <PlaceholderPage
    title="Permissões"
    description="Gerencie roles e permissões de usuários do sistema."
    icon={Lock}
    features={[
      "Criação de roles",
      "Permissões granulares",
      "Herança de permissões",
      "Auditoria de acessos",
      "Templates de permissão"
    ]}
  />
);

export default PlaceholderPage;
