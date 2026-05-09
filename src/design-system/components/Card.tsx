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
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6",
  };

  const hoverStyles = hover ? "finqz-card-hover" : "";

  return (
    <div className={`finqz-card ${paddingStyles[padding]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};

// Card Header
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => (
  <div className={`mb-4 flex min-w-0 flex-col gap-1 ${className}`}>{children}</div>
);

// Card Title
export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => (
  <h3 className={`text-heading-md text-[var(--text-primary)] ${className}`}>{children}</h3>
);

// Card Description
export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = "" }) => (
  <p className={`text-body-sm text-[var(--text-muted)] ${className}`}>{children}</p>
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
  <div className={`mt-5 border-t border-[var(--border-muted)] pt-4 ${className}`}>{children}</div>
);

export default Card;
