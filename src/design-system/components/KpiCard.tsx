// Design System - KpiCard Component
// FINQZ PRO - Cartão de KPI padronizado para todas as páginas
// Valor colorido na mesma cor do ícone

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: "blue" | "green" | "red" | "orange" | "purple" | "cyan" | "gray" | "default" | "info" | "success" | "warning" | "danger";
  variation?: number;
  variationLabel?: string;
  className?: string;
}

// Mapeamento de cores para ícone (fundo suave)
const iconColorClasses: Record<string, string> = {
  blue: "bg-blue-950/30 text-blue-300",
  green: "bg-emerald-950/30 text-emerald-300",
  red: "bg-red-950/30 text-red-300",
  orange: "bg-orange-950/30 text-orange-300",
  purple: "bg-violet-950/30 text-violet-300",
  cyan: "bg-cyan-950/30 text-cyan-300",
  gray: "bg-white/10 text-slate-200",
  default: "bg-white/10 text-slate-200",
  // Nomes antigos para compatibilidade
  info: "bg-blue-950/30 text-blue-300",
  success: "bg-emerald-950/30 text-emerald-300",
  warning: "bg-orange-950/30 text-orange-300",
  danger: "bg-red-950/30 text-red-300",
};

// Mapeamento de cores para o valor (mesma cor do ícone)
const valueColorClasses: Record<string, string> = {
  blue: "text-blue-300",
  green: "text-emerald-300",
  red: "text-red-300",
  orange: "text-orange-300",
  purple: "text-violet-300",
  cyan: "text-cyan-300",
  gray: "text-slate-200",
  default: "text-slate-200",
  // Nomes antigos para compatibilidade
  info: "text-blue-300",
  success: "text-emerald-300",
  warning: "text-orange-300",
  danger: "text-red-300",
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  variant = "blue",
  variation,
  variationLabel,
  className = "",
}) => {
  // Normalizar variant para suportar nomes antigos
  const normalizedVariant = iconColorClasses[variant] ? variant : "default";
  
  const iconClasses = iconColorClasses[normalizedVariant];
  const valueClasses = valueColorClasses[normalizedVariant];

  const getVariationIcon = () => {
    if (variation === undefined || variation === null) return null;
    if (variation > 0) return <TrendingUp size={12} className="text-green-600" />;
    if (variation < 0) return <TrendingDown size={12} className="text-red-600" />;
    return <Minus size={12} className="text-slate-400" />;
  };

  const getVariationColor = () => {
    if (variation === undefined || variation === null) return "";
    if (variation > 0) return "text-green-600";
    if (variation < 0) return "text-red-600";
    return "text-slate-500";
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#111827] backdrop-blur-xl p-4 shadow-sm min-h-[92px] overflow-hidden ${className}`}>
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className={`mt-1.5 text-lg xl:text-xl font-semibold leading-snug truncate ${valueClasses}`}>{value}</p>
          {(variation !== undefined && variation !== null) && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${getVariationColor()}`}>
              {getVariationIcon()}
              <span>{variation > 0 ? "+" : ""}{variation}%</span>
              {variationLabel && <span className="text-slate-400 ml-1">{variationLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClasses}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
