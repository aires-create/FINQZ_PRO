// Design System - Filter Components
// FINQZ PRO - Sistema de filtros enterprise CRM/Fintech

import React, { useState, useEffect, useCallback } from "react";
import { X, Filter, RefreshCw, Loader2, ChevronDown, Check, Search, DollarSign, Hash, Calendar, ToggleLeft } from "lucide-react";
import { Button } from "../../design-system/components/Button";
import { Input } from "../../design-system/components/Input";
import { Select } from "../../design-system/components/Select";
import { StatusBadge } from "../../design-system/components/StatusBadge";

// ============================================
// TYPES
// ============================================

export type FilterFieldType = 
  | "text" 
  | "select" 
  | "date" 
  | "dateRange" 
  | "number" 
  | "numberRange" 
  | "checkbox" 
  | "multiSelect" 
  | "currency" 
  | "cpfCnpj";

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  mask?: "cpf" | "cnpj" | "cpfCnpj" | "currency" | "phone";
  searchable?: boolean;
}

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  loading?: boolean;
  applyLabel?: string;
  clearLabel?: string;
}

// ============================================
// FILTER DRAWER COMPONENT
// ============================================

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  title = "Filtros",
  fields,
  values,
  onChange,
  onApply,
  onClear,
  loading = false,
  applyLabel = "Aplicar Filtros",
  clearLabel = "Limpar",
}) => {
  // Defensive: ensure values is always a valid object
  const safeValues = values || {};
  
  // Defensive: ensure fields is always a valid array and filter out invalid fields
  const safeFields = Array.isArray(fields) ? fields.filter(field => 
    field && typeof field === 'object' && field.key && field.type
  ) : [];
  
  const [localValues, setLocalValues] = useState<Record<string, string>>(safeValues);
  const [isClosing, setIsClosing] = useState(false);

  // Sincronizar valores locais quando o drawer abre
  useEffect(() => {
    if (isOpen) {
      setLocalValues(safeValues);
    }
  }, [isOpen, safeValues]);

  // Contagem de filtros ativos
  const activeFiltersCount = Object.values(localValues).filter(
    (v) => v && v !== ""
  ).length;

  const handleFieldChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    onChange(key, value);
  };

  // Limpar filtros NÃO fecha o drawer automaticamente
  const handleClear = () => {
    const emptyValues: Record<string, string> = {};
    safeFields.forEach((field) => {
      emptyValues[field.key] = "";
    });
    setLocalValues(emptyValues);
    onClear();
  };

  // Aplicar filtros fecha o drawer
  const handleApply = () => {
    onApply();
    onClose();
  };

  // Fechar com animação
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  // ESC fecha o drawer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  // Não renderiza se fechado
  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Overlay discreto - bg-black/30 sem blur */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer: container fixed inset-y-0 right-0, width responsivo */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:max-w-md bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 shadow-2xl z-50 transform transition-transform duration-200 ease-out flex flex-col h-full ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        {/* Header: shrink-0, border-b */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F172A]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#000dff]/10 rounded-lg">
              <Filter className="w-5 h-5 text-[#000dff]" />
            </div>
            <div>
              <h2 
                id="filter-drawer-title" 
                className="text-lg font-semibold text-white"
              >
                {title}
              </h2>
              {activeFiltersCount > 0 && (
                <p className="text-sm text-slate-500">
                  {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} ativo
                  {activeFiltersCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fechar filtros"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body: flex-1 overflow-y-auto */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {safeFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-[#111827] rounded-full mb-4">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                Nenhum filtro disponível
              </h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Esta tela não possui filtros configurados no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {safeFields.map((field) => (
              <div key={field.key}>
                {field.type === "select" ? (
                  <Select
                    label={field.label}
                    value={localValues[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || "Selecione..."}
                    options={field.options || []}
                  />
                ) : field.type === "text" ? (
                  <Input
                    label={field.label}
                    type="text"
                    value={localValues[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "date" ? (
                  <Input
                    label={field.label}
                    type="date"
                    value={localValues[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                ) : field.type === "dateRange" ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      {field.label}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={localValues[`${field.key}Start`] || ""}
                        onChange={(e) =>
                          handleFieldChange(`${field.key}Start`, e.target.value)
                        }
                        placeholder="Início"
                      />
                      <Input
                        type="date"
                        value={localValues[`${field.key}End`] || ""}
                        onChange={(e) =>
                          handleFieldChange(`${field.key}End`, e.target.value)
                        }
                        placeholder="Fim"
                      />
                    </div>
                  </div>
                ) : field.type === "number" ? (
                  <Input
                    label={field.label}
                    type="number"
                    value={localValues[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                  />
                ) : field.type === "numberRange" ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      {field.label}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Hash className="w-4 h-4" />
                        </span>
                        <Input
                          type="number"
                          value={localValues[`${field.key}Min`] || ""}
                          onChange={(e) =>
                            handleFieldChange(`${field.key}Min`, e.target.value)
                          }
                          placeholder="Mín"
                          className="pl-9"
                          min={field.min}
                          max={field.max}
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Hash className="w-4 h-4" />
                        </span>
                        <Input
                          type="number"
                          value={localValues[`${field.key}Max`] || ""}
                          onChange={(e) =>
                            handleFieldChange(`${field.key}Max`, e.target.value)
                          }
                          placeholder="Máx"
                          className="pl-9"
                          min={field.min}
                          max={field.max}
                        />
                      </div>
                    </div>
                  </div>
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = localValues[field.key] === "true" ? "false" : "true";
                        handleFieldChange(field.key, newValue);
                      }}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${localValues[field.key] === "true" ? "bg-[#000dff]" : "bg-white/10"}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 transition-transform
                          ${localValues[field.key] === "true" ? "translate-x-6" : "translate-x-1"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-slate-300">{field.label}</span>
                  </div>
                ) : field.type === "multiSelect" ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      {field.label}
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border border-white/10 bg-[#0F172A] rounded-lg min-h-[44px]">
                      {(field.options || []).map((option) => {
                        const isSelected = (localValues[field.key] || "").split(",").includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              const current = (localValues[field.key] || "").split(",").filter(Boolean);
                              if (isSelected) {
                                current.splice(current.indexOf(option.value), 1);
                              } else {
                                current.push(option.value);
                              }
                              handleFieldChange(field.key, current.join(","));
                            }}
                            className={`
                              px-3 py-1.5 text-sm rounded-full border transition-all
                              ${isSelected 
                                ? "bg-[#000dff]/10 border-[#000dff] text-[#000dff]" 
                                : "bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:border-white/20"
                              }
                            `}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : field.type === "currency" ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      {field.label}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <Input
                          type="text"
                          value={localValues[`${field.key}Min`] || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            handleFieldChange(`${field.key}Min`, value);
                          }}
                          placeholder="De R$"
                          className="pl-9"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <Input
                          type="text"
                          value={localValues[`${field.key}Max`] || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            handleFieldChange(`${field.key}Max`, value);
                          }}
                          placeholder="Até R$"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                ) : field.type === "cpfCnpj" ? (
                  <Input
                    label={field.label}
                    type="text"
                    value={localValues[field.key] || ""}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Apply mask
                      const digits = value.replace(/\D/g, "");
                      if (digits.length <= 11) {
                        // CPF mask
                        value = digits.replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                      } else {
                        // CNPJ mask
                        value = digits.replace(/(\d{2})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d{4})$/, "$1/$2")
                          .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
                      }
                      handleFieldChange(field.key, value);
                    }}
                    placeholder={field.placeholder || "CPF ou CNPJ"}
                    maxLength={18}
                  />
                ) : null}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Footer: shrink-0 border-t */}
        <div className="shrink-0 px-6 py-4 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 border-t border-white/10 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {clearLabel}
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="flex-1"
            loading={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {applyLabel}
          </Button>
        </div>
      </div>
    </>
  );
};

// ============================================
// FILTER BUTTON WITH BADGE
// ============================================

interface FilterButtonProps {
  onClick: () => void;
  activeCount: number;
  label?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  onClick,
  activeCount,
  label = "Filtros",
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 border
        ${activeCount > 0 
          ? "bg-[#000dff]/10 border-[#000dff]/30 text-[#000dff]" 
          : "bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
        }
      `}
    >
      <Filter className="w-4 h-4" />
      <span>{label}</span>
      {activeCount > 0 && (
        <span className="ml-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#000dff] text-white text-xs font-bold rounded-full">
          {activeCount > 9 ? "9+" : activeCount}
        </span>
      )}
      <ChevronDown className={`w-4 h-4 transition-transform ${activeCount > 0 ? "text-[#000dff]" : "text-slate-400"}`} />
    </button>
  );
};

// ============================================
// ACTIVE FILTERS CHIPS
// ============================================

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue?: string;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemove,
  onClearAll,
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-sm text-slate-500 mr-1">Filtros ativos:</span>
      {filters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#000dff]/10 border border-[#000dff]/20 rounded-full text-sm text-[#000dff]"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.displayValue || filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 p-0.5 hover:bg-[#000dff]/20 rounded-full transition-colors"
            aria-label={`Remover filtro ${filter.label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-slate-500 hover:text-red-600 transition-colors underline underline-offset-2"
      >
        Limpar todos
      </button>
    </div>
  );
};

// ============================================
// FILTER BAR (Complete filter component with button + chips)
// ============================================

interface FilterBarProps {
  // Button
  filterButtonLabel?: string;
  activeCount: number;
  onFilterButtonClick: () => void;
  
  // Active filters
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string) => void;
  onClearAllFilters: () => void;
  
  // Drawer state
  isDrawerOpen: boolean;
  onDrawerClose: () => void;
  
  // Drawer content
  fields: FilterField[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterButtonLabel = "Filtros",
  activeCount,
  onFilterButtonClick,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  isDrawerOpen,
  onDrawerClose,
  fields,
  filterValues,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  loading = false,
}) => {
  return (
    <>
      {/* Filter Button and Active Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <FilterButton
            onClick={onFilterButtonClick}
            activeCount={activeCount}
            label={filterButtonLabel}
          />
        </div>
        
        <ActiveFilters
          filters={activeFilters}
          onRemove={onRemoveFilter}
          onClearAll={onClearAllFilters}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        title={filterButtonLabel}
        fields={fields}
        values={filterValues}
        onChange={onFilterChange}
        onApply={onApplyFilters}
        onClear={onClearFilters}
        loading={loading}
      />
    </>
  );
};

export default FilterDrawer;
