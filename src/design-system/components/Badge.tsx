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
    default: "bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-default)]",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-200",
    warning: "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-200",
    danger: "bg-red-500/10 text-red-700 border border-red-500/20 dark:text-red-200",
    info: "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-200",
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
