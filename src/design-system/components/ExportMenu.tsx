/**
 * FINQZ PRO - Export Menu Component
 * Menu padronizado para exportação de dados em múltiplos formatos
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, File, FileSpreadsheet, Copy } from 'lucide-react';
import { zIndex } from '../../config/zIndex';

export interface ExportOption {
  id: string;
  label: string;
  format: 'csv' | 'excel' | 'pdf' | 'json';
  icon: React.ReactNode;
  description?: string;
}

export interface ExportMenuProps {
  data: any[];
  columns: { key: string; label: string }[];
  filename?: string;
  options?: ExportOption[];
  onExport?: (format: string, data: any[]) => void;
  disabled?: boolean;
  label?: string;
  dropdownClassName?: string;
}

const EXPORT_DATE_SUFFIX = () => new Date().toISOString().split('T')[0];

const escapeCsvValue = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  if (!/[;"\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

export const buildCsvExportContent = (
  data: any[],
  columns: { key: string; label: string }[],
): string => {
  const headerLine = columns.map((column) => escapeCsvValue(column.label)).join(';');
  const rowLines = data.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(';'),
  );

  return `\ufeff${[headerLine, ...rowLines].join('\r\n')}`;
};

const triggerDownload = (blob: Blob, filename: string, extension: string): void => {
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);

  link.href = objectUrl;
  link.download = `${filename}_${EXPORT_DATE_SUFFIX()}.${extension}`;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
};

const exportToCSV = (data: any[], columns: { key: string; label: string }[], filename: string) => {
  const csv = buildCsvExportContent(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename, 'csv');
};

const exportToExcel = async (
  data: any[],
  columns: { key: string; label: string }[],
  filename: string,
) => {
  const { utils, write } = await import('xlsx');
  const sheetData = [
    columns.map((column) => column.label),
    ...data.map((row) => columns.map((column) => row[column.key] ?? '')),
  ];

  const worksheet = utils.aoa_to_sheet(sheetData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Clientes');

  const arrayBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  triggerDownload(blob, filename, 'xlsx');
};

const exportToJSON = (data: any[], filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

const exportToPDF = (data: any[], columns: { key: string; label: string }[], filename: string) => {
  let html = `
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #000dff; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #000dff; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .date { color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${filename}</h1>
      <p class="date">Exportado em: ${new Date().toLocaleDateString('pt-BR')}</p>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td>${row[col.key] ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
};

export const ExportMenu: React.FC<ExportMenuProps> = ({
  data,
  columns,
  filename = 'export',
  options,
  onExport,
  disabled = false,
  label = 'Exportar',
  dropdownClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const defaultOptions: ExportOption[] = [
    {
      id: 'csv',
      label: 'CSV',
      format: 'csv',
      icon: <FileText size={16} className="text-green-600 dark:text-green-400" />,
      description: 'Valores separados por vírgula',
    },
    {
      id: 'excel',
      label: 'Excel',
      format: 'excel',
      icon: <FileSpreadsheet size={16} className="text-blue-600 dark:text-blue-400" />,
      description: 'Formato Microsoft Excel',
    },
    {
      id: 'pdf',
      label: 'PDF',
      format: 'pdf',
      icon: <File size={16} className="text-red-600 dark:text-red-400" />,
      description: 'Formato PDF para impressão',
    },
  ];

  const exportOptions = options || defaultOptions;

  const handleExport = async (format: string) => {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    if (onExport) {
      onExport(format, data);
    } else {
      // Exportação padrão
      switch (format) {
        case 'csv':
          exportToCSV(data, columns, filename);
          break;
        case 'excel':
          await exportToExcel(data, columns, filename);
          break;
        case 'pdf':
          exportToPDF(data, columns, filename);
          break;
        case 'json':
          exportToJSON(data, filename);
          break;
      }
    }

    setIsOpen(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || data.length === 0}
        className={`
          flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium
          transition-all duration-200
          ${disabled || data.length === 0
            ? 'cursor-not-allowed opacity-50 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary dark:hover:border-primary'
          }
        `}
      >
        <Download size={16} />
        {label}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0"
            style={{ zIndex: zIndex.dropdown }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={`
              absolute top-full right-0 mt-2 w-56 rounded-lg
              border border-slate-200/50 dark:border-slate-700/50
              bg-white dark:bg-slate-900
              shadow-lg shadow-black/10 dark:shadow-black/40
              overflow-hidden
              ${dropdownClassName}
            `}
            style={{ zIndex: zIndex.dropdown + 1 }}
          >
            <div className="p-2">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => void handleExport(option.format)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    text-left text-sm font-medium
                    transition-all duration-200
                    hover:bg-slate-100 dark:hover:bg-slate-800
                  `}
                >
                  {option.icon}
                  <div className="flex-1">
                    <div className="text-slate-900 dark:text-slate-100">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;
