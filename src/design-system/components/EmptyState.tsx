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
  const defaultIcon = <Inbox className="h-8 w-8 text-[var(--color-primary-soft)]" />;

  return (
    <div
      className={`finqz-card flex flex-col items-center justify-center border-dashed px-6 py-14 text-center ${className}`}
    >
      <div className="finqz-icon-badge mb-5 h-14 w-14">
        {icon || defaultIcon}
      </div>

      <h3 className="mb-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h3>

      {description && (
        <p className="mb-5 max-w-md text-sm leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
