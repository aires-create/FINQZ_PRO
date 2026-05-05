// Design System - Adapters Layer
// CAMADA DE COMPATIBILIDADE: Permite substituição gradual sem quebrar o sistema
// Use estes adapters para migrar componentes aos poucos
// 
// ⚠️ PADRÃO TRAVADO - FINQZ PRO
// Use SOMENTE estes componentes para garantir consistência:
// - Button, Input, Select, Card, Badge, Modal, Toggle, TextArea
// - StatusBadge, ActionButtons, PageHeader, TableContainer
// 
// ❌ PROIBIDO usar:
// - <button> nativo
// - <input> nativo (use Input do DS)
// - <select> nativo (use Select do DS)
// - <table> sem TableContainer

import React from "react";

// ============================================
// COMPONENTES BASE DO DESIGN SYSTEM
// ============================================

export { Button as DSButton } from "./components/Button";
export type { ButtonProps as DSButtonProps } from "./components/Button";

export { Input as DSInput } from "./components/Input";
export type { InputProps as DSInputProps } from "./components/Input";

export { Select as DSSelect } from "./components/Select";
export type { SelectProps as DSSelectProps, SelectOption as DSSelectOption } from "./components/Select";

export { 
  Card as DSCard,
  CardHeader as DSCardHeader,
  CardTitle as DSCardTitle,
  CardDescription as DSCardDescription,
  CardContent as DSCardContent,
  CardFooter as DSCardFooter,
} from "./components/Card";
export type { 
  CardProps as DSCardProps,
  CardHeaderProps as DSCardHeaderProps,
  CardTitleProps as DSCardTitleProps,
  CardDescriptionProps as DSCardDescriptionProps,
  CardContentProps as DSCardContentProps,
  CardFooterProps as DSCardFooterProps,
} from "./components/Card";

export { Badge as DSBadge } from "./components/Badge";
export type { BadgeProps as DSBadgeProps } from "./components/Badge";

export { Modal as DSModal } from "./components/Modal";
export type { ModalProps as DSModalProps } from "./components/Modal";

export { Toggle as DSToggle } from "./components/Toggle";
export type { ToggleProps as DSToggleProps } from "./components/Toggle";

export { TextArea as DSTextArea } from "./components/TextArea";
export type { TextAreaProps as DSTextAreaProps } from "./components/TextArea";

// ============================================
// COMPONENTES PADRONIZADOS (LOCK DE PADRÃO)
// ============================================

// 🔲 STATUS GLOBAL - Enum de status padronizado
export type StatusType = "ATIVO" | "INATIVO" | "PENDENTE" | "APROVADO" | "REPROVADO" | "EM_ANALISE" | "ATIVO" | "INATIVO" | "NAO_PERTURBE" | "PROSPECTO" | "CONTATO" | "NEGOCIACAO" | "FORMALIZACAO" | "INTEGRADO" | "PERDIDO" | "GANHO";

// StatusBadge foi movido para ./components/StatusBadge.tsx
// Use: import { StatusBadge } from "../components/ui";

// 🔲 ACTIONBUTTONS - Componente padronizado para ações de linha
// Use em TODO o sistema para garantir botões de ação consistentes
interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onToggle?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  canToggle?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
  toggleLabel?: string;
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  onView,
  onToggle,
  canEdit = true,
  canDelete = true,
  canView = true,
  canToggle = true,
  editLabel = "Editar",
  deleteLabel = "Excluir",
  viewLabel = "Visualizar",
  toggleLabel = "Alternar",
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {canView && onView && (
        <button
          onClick={onView}
          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title={viewLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
      {canEdit && onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title={editLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {canToggle && onToggle && (
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
          title={toggleLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}
      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title={deleteLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

// 🔲 PAGEHEADER - Componente padronizado para cabeçalho de página
// Use em TODAS as páginas para garantir consistência
interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/20">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

// 🔲 TABLECONTAINER - Wrapper padronizado para tabelas
// Use em TODAS as tabelas para garantir consistência visual
interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className = "",
  loading = false
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
};

// 🔲 FILTERDRAWER - Componente padronizado para drawers de filtro
// Use em TODAS as páginas que precisam de filtros
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onClear?: () => void;
  onApply?: () => void;
  className?: string;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  title = "Filtros",
  children,
  onClear,
  onApply,
  className = ""
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`w-[420px] bg-white h-full shadow-2xl p-6 overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-6">
          {children}
        </div>

        {(onClear || onApply) && (
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
            {onClear && (
              <button
                onClick={onClear}
                className="text-gray-500 hover:text-gray-700"
              >
                Limpar
              </button>
            )}
            {onApply && (
              <button
                onClick={onApply}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Aplicar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// EXPORTS DE TIPOS
// ============================================

// StatusBadgeProps foi movido para ./components/StatusBadge.tsx
export type {
  ActionButtonsProps,
  PageHeaderProps,
  TableContainerProps,
  FilterDrawerProps
};

// ============================================
// PAGE ACTIONS - Header padronizado
// ============================================

interface PageActionsProps {
  leftContent?: React.ReactNode;
  rightActions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageActions: React.FC<PageActionsProps> = ({ 
  leftContent, 
  rightActions,
  children 
}) => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        {leftContent}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {rightActions}
      </div>
    </div>
  );
};

// ============================================
// EXPORT BUTTONS - Botões de exportação
// ============================================

interface ExportButtonsProps {
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  disabled?: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onExportCSV}
        disabled={disabled}
        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar CSV"
      >
        CSV
      </button>
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar Excel"
      >
        Excel
      </button>
      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar PDF"
      >
        PDF
      </button>
    </div>
  );
};

// ============================================
// VIEW TOGGLE - Alternar visualização (Kanban/Lista)
// ============================================

type ViewMode = 'kanban' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange('kanban')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value === 'kanban'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Kanban
      </button>
      <button
        onClick={() => onChange('list')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Lista
      </button>
    </div>
  );
};

// ============================================
// FILTER BUTTON - Botão de filtro padrão
// ============================================

interface FilterButtonProps {
  onClick: () => void;
  active?: boolean;
  count?: number;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ 
  onClick, 
  active = false,
  count = 0 
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      Filtros
      {count > 0 && (
        <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

// ============================================
// PRIMARY BUTTON - Botão primário padrão
// ============================================

interface PrimaryButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  onClick, 
  children,
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
};

// ============================================
// REFRESH BUTTON - Botão de atualizar
// ============================================

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  onClick, 
  loading = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
      title="Atualizar dados"
    >
      <svg 
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Atualizar
    </button>
  );
};
