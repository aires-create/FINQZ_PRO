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
  const defaultIcon = <Inbox className="w-12 h-12 text-gray-400" />;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
    >
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 text-center mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
