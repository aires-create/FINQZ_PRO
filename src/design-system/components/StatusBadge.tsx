// Design System - StatusBadge Component
// FINQZ PRO - Badge de status específico do sistema

import React from "react";

export type StatusType =
  | "ativo"
  | "inativo"
  | "pendente"
  | "aprovado"
  | "reprovado"
  | "erro"
  | "pf"
  | "pj"
  | "global"
  | "empresa"
  | "franquia"
  | "franqueado"
  | "sucesso"
  | "warning"
  | "info"
  | "danger";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; label: string }
> = {
  ativo: { bg: "bg-emerald-500/10 border border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", label: "Ativo" },
  inativo: { bg: "bg-slate-500/10 border border-slate-500/20", text: "text-slate-600 dark:text-slate-300", label: "Inativo" },
  pendente: { bg: "bg-yellow-500/10 border border-yellow-500/20", text: "text-yellow-700 dark:text-yellow-300", label: "Pendente" },
  aprovado: { bg: "bg-emerald-500/10 border border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", label: "Aprovado" },
  reprovado: { bg: "bg-red-500/10 border border-red-500/20", text: "text-red-700 dark:text-red-300", label: "Reprovado" },
  erro: { bg: "bg-red-500/10 border border-red-500/20", text: "text-red-700 dark:text-red-300", label: "Erro" },
  pf: { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-700 dark:text-blue-300", label: "Pessoa Física" },
  pj: { bg: "bg-purple-500/10 border border-purple-500/20", text: "text-purple-700 dark:text-purple-300", label: "Pessoa Jurídica" },
  global: { bg: "bg-primary/10 border border-primary/20", text: "text-primary", label: "Global" },
  empresa: { bg: "bg-indigo-500/10 border border-indigo-500/20", text: "text-indigo-700 dark:text-indigo-300", label: "Empresa" },
  franquia: { bg: "bg-orange-500/10 border border-orange-500/20", text: "text-orange-700 dark:text-orange-300", label: "Franquia" },
  franqueado: { bg: "bg-cyan-500/10 border border-cyan-500/20", text: "text-cyan-700 dark:text-cyan-300", label: "Franqueado" },
  sucesso: { bg: "bg-emerald-500/10 border border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", label: "Sucesso" },
  warning: { bg: "bg-yellow-500/10 border border-yellow-500/20", text: "text-yellow-700 dark:text-yellow-300", label: "Atenção" },
  info: { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-700 dark:text-blue-300", label: "Informação" },
  danger: { bg: "bg-red-500/10 border border-red-500/20", text: "text-red-700 dark:text-red-300", label: "Perigoso" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  className = "",
}) => {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeStyles[size]} ${className}`}
    >
      {displayLabel}
    </span>
  );
};

// Helper para criar badge rapidamente
export const createStatusBadge = (status: StatusType, customLabel?: string) => ({
  status,
  label: customLabel,
});

export default StatusBadge;
