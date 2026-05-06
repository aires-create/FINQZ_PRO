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
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <Loader2
        className={`animate-spin text-primary ${sizes.text}`}
        size={sizes.icon}
      />
      {text && (
        <p className={`text-slate-300 mt-2 ${sizes.text}`}>{text}</p>
      )}
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
          className="h-4 bg-white/10 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-sm ${className}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-white/10 rounded animate-pulse" />
      <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" />
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
        <div key={i} className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4 py-3 border-t border-gray-100"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

export default LoadingState;
