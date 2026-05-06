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
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-purple-50 text-purple-600",
  cyan: "bg-cyan-50 text-cyan-600",
  gray: "bg-gray-100 text-slate-600",
  default: "bg-gray-100 text-slate-600",
  // Nomes antigos para compatibilidade
  info: "bg-blue-50 text-blue-600",
  success: "bg-green-50 text-green-600",
  warning: "bg-orange-50 text-orange-600",
  danger: "bg-red-50 text-red-600",
};

// Mapeamento de cores para o valor (mesma cor do ícone)
const valueColorClasses: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  red: "text-red-600",
  orange: "text-orange-600",
  purple: "text-purple-600",
  cyan: "text-cyan-600",
  gray: "text-slate-900",
  default: "text-slate-900",
  // Nomes antigos para compatibilidade
  info: "text-blue-600",
  success: "text-green-600",
  warning: "text-orange-600",
  danger: "text-red-600",
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
    <div className={`rounded-2xl border border-gray-200 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 p-4 shadow-sm min-h-[92px] overflow-hidden ${className}`}>
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
