// Design System - Table Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  density?: "compact" | "normal" | "comfortable";
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  className?: string;
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  density = "normal",
  striped = true,
  hoverable = true,
  className = "",
  onRowClick
}: TableProps<T>) => {
  const densityClasses = {
    compact: "text-xs",
    normal: "text-sm",
    comfortable: "text-base"
  };

  const rowHeightClasses = {
    compact: "h-8",
    normal: "h-12",
    comfortable: "h-16"
  };

  const cellPaddingClasses = {
    compact: "px-3 py-1",
    normal: "px-4 py-3",
    comfortable: "px-6 py-4"
  };

  if (loading) {
    return (
      <div className={`table-container ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`table-container ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
              <MoreHorizontal className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-[var(--text-muted)]">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <div className="overflow-x-auto">
        <table className="table min-w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left font-semibold ${cellPaddingClasses[density]} ${
                    column.align === "center" ? "text-center" :
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronRight className="w-3 h-3 -rotate-90 text-slate-400" />
                        <ChevronRight className="w-3 h-3 rotate-90 text-slate-400 -mt-1" />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={`
                  border-b border-[var(--border-muted)] last:border-b-0
                  ${striped && index % 2 === 1 ? "bg-[var(--bg-surface-strong)]/50" : "bg-transparent"}
                  ${hoverable ? "cursor-pointer transition-colors hover:bg-[var(--bg-surface-hover)]" : ""}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${cellPaddingClasses[density]} text-[var(--text-primary)] ${
                      column.align === "center" ? "text-center" :
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
  className = ""
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex items-center justify-between border-t border-[var(--border-muted)] bg-[var(--bg-surface-strong)] px-6 py-4 ${className}`}>
      <div className="text-sm text-[var(--text-secondary)]">
        Mostrando{" "}
        <span className="font-medium text-[var(--text-primary)]">
          {startItem}
        </span>{" "}
        a{" "}
        <span className="font-medium text-[var(--text-primary)]">
          {endItem}
        </span>{" "}
        de{" "}
        <span className="font-medium text-[var(--text-primary)]">
          {totalItems}
        </span>{" "}
        resultados
      </div>

      <div className="flex items-center gap-3">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="px-3 min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Table;
