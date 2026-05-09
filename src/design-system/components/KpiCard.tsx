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
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300",
  green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300",
  red: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-300",
  orange: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-300",
  purple: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-300",
  cyan: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-300",
  gray: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-200",
  default: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-200",
  // Nomes antigos para compatibilidade
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300",
  warning: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-300",
  danger: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-300",
};

// Mapeamento de cores para o valor (mesma cor do ícone)
const valueColorClasses: Record<string, string> = {
  blue: "text-blue-700 dark:text-blue-300",
  green: "text-emerald-700 dark:text-emerald-300",
  red: "text-red-700 dark:text-red-300",
  orange: "text-amber-700 dark:text-amber-300",
  purple: "text-violet-700 dark:text-violet-300",
  cyan: "text-cyan-700 dark:text-cyan-300",
  gray: "text-[var(--text-primary)]",
  default: "text-[var(--text-primary)]",
  // Nomes antigos para compatibilidade
  info: "text-blue-700 dark:text-blue-300",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-orange-700 dark:text-orange-300",
  danger: "text-red-700 dark:text-red-300",
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
    if (variation > 0) return <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-300" />;
    if (variation < 0) return <TrendingDown size={12} className="text-red-500 dark:text-red-300" />;
    return <Minus size={12} className="text-[var(--text-muted)]" />;
  };

  const getVariationColor = () => {
    if (variation === undefined || variation === null) return "";
    if (variation > 0) return "text-emerald-600 dark:text-emerald-300";
    if (variation < 0) return "text-red-600 dark:text-red-300";
    return "text-[var(--text-muted)]";
  };

  return (
    <div className={`finqz-kpi-card min-h-[104px] ${className}`}>
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</p>
          <p className={`mt-2 max-w-full text-[clamp(1.3rem,1.6vw,1.75rem)] font-semibold leading-tight ${valueClasses}`}>
            {value}
          </p>
          {(variation !== undefined && variation !== null) && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${getVariationColor()}`}>
              {getVariationIcon()}
              <span>{variation > 0 ? "+" : ""}{variation}%</span>
              {variationLabel && <span className="ml-1 text-[var(--text-muted)]">{variationLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconClasses}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
