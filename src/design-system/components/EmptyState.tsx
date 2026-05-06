// Design System - EmptyState Component
// FINQZ PRO - Estado vazio para listas e tabelas

import React from "react";
import { Button } from "./Button";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  const defaultIcon = <Inbox className="w-12 h-12 text-slate-400" />;

  return (
    <div
      className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
          {icon || defaultIcon}
        </div>
        <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl -z-10" />
      </div>

      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-slate-400 max-w-md leading-relaxed mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
