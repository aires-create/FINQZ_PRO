// Design System - Card Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  padding = "md",
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverStyles = hover
    ? "hover:shadow-2xl hover:shadow-blue-500/10 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 ease-out"
    : "";

  return (
    <div className={`
      bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/80 to-[#1E293B]/60
      backdrop-blur-2xl
      border border-white/10
      rounded-2xl
      shadow-xl shadow-black/20
      ${paddingStyles[padding]}
      ${hoverStyles}
      ${className}
    `}>
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

// Card Header
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => (
  <div className={`mb-6 ${className}`}>{children}</div>
);

// Card Title
export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => (
  <h3 className={`text-xl font-bold text-white tracking-tight ${className}`}>{children}</h3>
);

// Card Description
export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = "" }) => (
  <p className={`text-sm text-slate-400 mt-2 leading-relaxed ${className}`}>{children}</p>
);

// Card Content
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

// Card Footer
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = "" }) => (
  <div className={`mt-6 pt-6 border-t border-white/10 ${className}`}>{children}</div>
);

export default Card;
