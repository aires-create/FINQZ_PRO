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
  ativo: { bg: "bg-green-100", text: "text-green-700", label: "Ativo" },
  inativo: { bg: "bg-gray-100", text: "text-gray-600", label: "Inativo" },
  pendente: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pendente" },
  aprovado: { bg: "bg-green-100", text: "text-green-700", label: "Aprovado" },
  reprovado: { bg: "bg-red-100", text: "text-red-700", label: "Reprovado" },
  erro: { bg: "bg-red-100", text: "text-red-700", label: "Erro" },
  pf: { bg: "bg-blue-100", text: "text-blue-700", label: "Pessoa Física" },
  pj: { bg: "bg-purple-100", text: "text-purple-700", label: "Pessoa Jurídica" },
  global: { bg: "bg-primary/10", text: "text-primary", label: "Global" },
  empresa: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Empresa" },
  franquia: { bg: "bg-orange-100", text: "text-orange-700", label: "Franquia" },
  franqueado: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Franqueado" },
  sucesso: { bg: "bg-green-100", text: "text-green-700", label: "Sucesso" },
  warning: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Atenção" },
  info: { bg: "bg-blue-100", text: "text-blue-700", label: "Informação" },
  danger: { bg: "bg-red-100", text: "text-red-700", label: "Perigoso" },
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
