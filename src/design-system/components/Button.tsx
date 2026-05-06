// Design System - Button Component
// FINQZ PRO - Padrão Fintech

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "filter";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  disabled,
  ...props
}) => {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variantes com cores FINQZ
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover active:bg-[#0009e0] focus:ring-primary/30",
    secondary: "bg-[#111827] border border-white/10 text-slate-200 hover:bg-[#0F172A] active:bg-[#0B1523] focus:ring-primary/20",
    outline: "border border-white/10 text-slate-200 hover:bg-white/5 active:bg-white/10 focus:ring-primary/20",
    ghost: "text-slate-200 hover:bg-white/5 focus:ring-primary/20",
    danger: "bg-[#7f1d1d] text-white hover:bg-[#991b1b] active:bg-[#7f1d1d] focus:ring-red-300/20",
    filter: "bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 text-slate-200 hover:bg-white/5 focus:ring-primary/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </button>
  );
};

export default Button;
