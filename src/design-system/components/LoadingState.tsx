// Design System - LoadingState Component
// FINQZ PRO - Estado de carregamento

import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { icon: 16, text: "text-sm" },
  md: { icon: 24, text: "text-base" },
  lg: { icon: 32, text: "text-lg" },
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  text = "Carregando...",
  size = "md",
  className = "",
}) => {
  const sizes = sizeConfig[size];

  return (
    <div className={`finqz-card flex flex-col items-center justify-center px-6 py-14 ${className}`}>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
        <Loader2
          className="animate-spin text-primary-soft"
          size={sizes.icon}
        />
      </div>

      <div className="text-center">
        <h3 className={`${sizes.text} mb-1 font-semibold tracking-tight text-[var(--text-primary)]`}>
          {text}
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Estamos processando suas informações
        </p>
      </div>
    </div>
  );
};

// Skeleton loader para tabelas
export interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  lines = 1,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-[var(--bg-surface-hover)]"
          style={{ width: `${i % 3 === 0 ? 86 : i % 3 === 1 ? 72 : 64}%` }}
        />
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`finqz-card p-4 ${className}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 animate-pulse rounded-lg bg-[var(--bg-surface-hover)]" />
      <div className="flex-1">
        <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 w-3/4 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4 border-t border-[var(--border-muted)] py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
        ))}
      </div>
    ))}
  </div>
);

export default LoadingState;
