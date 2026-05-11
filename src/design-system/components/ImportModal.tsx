/**
 * FINQZ PRO - Import Modal Component
 * Modal padronizado para importação de dados com preview e validação
 */

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from './Button';
import { Dropzone } from './Dropzone';
import { Modal } from './Modal';

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
  validate?: (value: string) => string | null;
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
  columns: ImportColumn[];
  title?: string;
  description?: string;
  acceptedTypes?: string[];
  downloadTemplate?: () => void;
  templateFileName?: string;
}

// Funções utilitárias
const parseCSV = (text: string): string[][] => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    const delimiter = (line.match(/;/g)?.length || 0) > (line.match(/,/g)?.length || 0) ? ';' : ',';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

const normalizeColumnKey = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  columns,
  title = 'Importar Dados',
  description = 'Carregue um arquivo CSV com os dados para importação',
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  downloadTemplate,
  templateFileName = 'modelo',
}) => {
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, string>>({});
  const [importFileName, setImportFileName] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const handleFilesSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        alert('Arquivo deve conter pelo menos cabeçalho e uma linha de dados');
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Mapear colunas
      const columnMap: Record<number, string> = {};
      headers.forEach((header, index) => {
        const key = normalizeColumnKey(header);
        const expectedCol = columns.find(
          (ic) =>
            normalizeColumnKey(ic.label) === key ||
            normalizeColumnKey(ic.key) === key
        );
        if (expectedCol) {
          columnMap[index] = expectedCol.key;
        }
      });

      // Processar linhas
      const processedData: Record<number, any> = {};
      const errors: Record<number, string> = {};

      dataRows.forEach((row, rowIndex) => {
        const rowData: any = {};
        let rowError = '';

        row.forEach((cell, colIndex) => {
          const key = columnMap[colIndex];
          if (key) {
            rowData[key] = cell;
          }
        });

        // Validar
        columns.forEach((col) => {
          if (col.required && !rowData[col.key]) {
            rowError = `Campo "${col.label}" é obrigatório`;
          }
          if (col.validate && rowData[col.key]) {
            const error = col.validate(rowData[col.key]);
            if (error) rowError = error;
          }
        });

        if (rowError) {
          errors[rowIndex] = rowError;
        } else {
          processedData[rowIndex] = rowData;
        }
      });

      setImportData(Object.values(processedData));
      setImportErrors(errors);
      setStep('preview');
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importData.length === 0) {
      alert('Nenhum dado válido para importar');
      return;
    }

    onImport(importData);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setImportData([]);
    setImportErrors({});
    setImportFileName('');
    setStep('upload');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const totalValidRows = importData.length;
  const totalErrorRows = Object.keys(importErrors).length;
  const totalRows = totalValidRows + totalErrorRows;
  const requiredColumns = columns.filter((column) => column.required);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-xl border border-slate-200/50 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                {description && (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {acceptedTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {type.replace('.', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/50 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Campos do arquivo
            </div>
            <div className="space-y-2">
              {requiredColumns.length > 0 ? (
                requiredColumns.map((column) => (
                  <div key={column.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{column.label}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-300">
                      obrigatório
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nenhum campo obrigatório configurado.
                </p>
              )}
            </div>
          </div>
        </div>

        {step === 'upload' ? (
          <>
            <Dropzone
              onFilesSelected={handleFilesSelected}
              acceptedTypes={acceptedTypes}
              label="Selecionar arquivo para importação"
              description={`Arraste aqui ou clique para escolher. Aceitos: ${acceptedTypes.join(', ')}`}
            />

            {downloadTemplate && (
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar modelo ({templateFileName})
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Resumo */}
            <div className="rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {importFileName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Total: {totalRows} linhas • 
                    <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                      Válidas: {totalValidRows}
                    </span>
                    {totalErrorRows > 0 && (
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        Erros: {totalErrorRows}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm font-semibold text-primary hover:text-primary/90 dark:text-primary dark:hover:text-primary/80"
                >
                  Carregar outro
                </button>
              </div>
            </div>

            {/* Erros */}
            {totalErrorRows > 0 && (
              <div className="rounded-lg border border-red-200/50 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {totalErrorRows} erro(s) encontrado(s)
                  </p>
                </div>
                <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
                  {Object.entries(importErrors)
                    .slice(0, 5)
                    .map(([row, error]) => (
                      <li key={row}>Linha {parseInt(row) + 2}: {error}</li>
                    ))}
                  {totalErrorRows > 5 && (
                    <li>... e mais {totalErrorRows - 5} erro(s)</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview */}
            {totalValidRows > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50">
                      <tr>
                        {columns.slice(0, 6).map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 5).map((row, i) => (
                        <tr
                          key={i}
                          className="border-t border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                        >
                          {columns.slice(0, 6).map((col) => (
                            <td
                              key={col.key}
                              className="px-4 py-2 text-slate-600 dark:text-slate-400 truncate"
                            >
                              {row[col.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalValidRows > 5 && (
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
                    +{totalValidRows - 5} mais linhas
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex gap-3 border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancelar
        </Button>
        {step === 'preview' && (
          <Button
            onClick={handleConfirmImport}
            disabled={totalValidRows === 0}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Importar {totalValidRows} {totalValidRows === 1 ? 'linha' : 'linhas'}
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;
