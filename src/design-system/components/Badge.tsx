// Design System - Badge Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full";

  const variants = {
    default: "bg-slate-800/90 text-slate-100 border border-white/10",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-emerald-900/20 text-emerald-200 border border-emerald-500/20",
    warning: "bg-amber-900/20 text-amber-200 border border-amber-500/20",
    danger: "bg-red-900/20 text-red-200 border border-red-500/20",
    info: "bg-blue-900/20 text-blue-200 border border-blue-500/20",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
