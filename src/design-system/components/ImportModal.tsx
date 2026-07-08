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

export const normalizeColumnKey = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

export const parseDelimitedRows = (text: string): string[][] => {
  const cleanedText = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  const sampleLine = cleanedText.split(/\r\n|\n|\r/).find((line) => line.trim()) ?? '';
  const semicolonCount = (sampleLine.match(/;/g)?.length ?? 0);
  const commaCount = (sampleLine.match(/,/g)?.length ?? 0);
  const delimiter = commaCount > semicolonCount ? ',' : ';';

  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanedText.length; i += 1) {
    const char = cleanedText[i];
    const next = cleanedText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }

      currentRow.push(currentCell.trim());
      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((value) => value.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
};

export interface ImportEvaluationResult {
  data: any[];
  rowErrors: Record<number, string>;
  headerError: string | null;
  mappedColumns: Record<number, string>;
}

export const evaluateImportRows = (
  rows: string[][],
  columns: ImportColumn[],
): ImportEvaluationResult => {
  if (rows.length < 2) {
    return {
      data: [],
      rowErrors: {},
      headerError: 'O arquivo precisa conter ao menos uma linha de cabeçalho e uma linha de dados.',
      mappedColumns: {},
    };
  }

  const headers = rows[0].map((header) => String(header ?? '').trim());
  const mappedColumns: Record<number, string> = {};

  headers.forEach((header, index) => {
    const key = normalizeColumnKey(header);
    const expectedColumn = columns.find(
      (column) =>
        normalizeColumnKey(column.label) === key ||
        normalizeColumnKey(column.key) === key,
    );

    if (expectedColumn) {
      mappedColumns[index] = expectedColumn.key;
    }
  });

  const requiredColumns = columns.filter((column) => column.required);
  const mappedKeys = new Set(Object.values(mappedColumns));
  const missingRequiredColumns = requiredColumns.filter((column) => !mappedKeys.has(column.key));

  if (Object.keys(mappedColumns).length === 0) {
    return {
      data: [],
      rowErrors: {},
      headerError: 'Nenhum cabeçalho reconhecido foi encontrado. Verifique se o arquivo usa os nomes esperados.',
      mappedColumns,
    };
  }

  if (missingRequiredColumns.length > 0) {
    return {
      data: [],
      rowErrors: {},
      headerError: `Cabeçalho incompleto. Campo(s) obrigatório(s) ausente(s): ${missingRequiredColumns
        .map((column) => column.label)
        .join(', ')}.`,
      mappedColumns,
    };
  }

  const dataRows = rows.slice(1);
  const processedData: any[] = [];
  const rowErrors: Record<number, string> = {};

  dataRows.forEach((row, rowIndex) => {
    const rowData: Record<string, string> = {};

    row.forEach((cell, cellIndex) => {
      const key = mappedColumns[cellIndex];
      if (key) {
        rowData[key] = cell;
      }
    });

    let rowError: string | null = null;

    columns.forEach((column) => {
      const value = rowData[column.key];
      if (column.required && !value) {
        rowError = `Campo "${column.label}" é obrigatório.`;
      }

      if (!rowError && column.validate && value) {
        const validationError = column.validate(value);
        if (validationError) {
          rowError = validationError;
        }
      }
    });

    if (rowError) {
      rowErrors[rowIndex] = rowError;
      return;
    }

    processedData.push(rowData);
  });

  return {
    data: processedData,
    rowErrors,
    headerError: null,
    mappedColumns,
  };
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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setImportFileName(file.name);
    setFeedbackMessage(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      let rows: string[][] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const { read, utils } = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          setFeedbackMessage('O arquivo selecionado não possui planilhas válidas.');
          setStep('upload');
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        rows = utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
      } else {
        const text = await file.text();
        rows = parseDelimitedRows(text);
      }

      const evaluation = evaluateImportRows(rows, columns);

      if (evaluation.headerError) {
        setImportData([]);
        setImportErrors({});
        setStep('upload');
        setFeedbackMessage(evaluation.headerError);
        return;
      }

      setImportData(evaluation.data);
      setImportErrors(evaluation.rowErrors);

      if (evaluation.data.length === 0) {
        setStep('upload');
        setFeedbackMessage('Nenhuma linha válida foi encontrada. Revise os dados do arquivo e tente novamente.');
        return;
      }

      setStep('preview');
    } catch (error) {
      console.error('[ImportModal] Falha ao processar arquivo de importação:', error);
      setImportData([]);
      setImportErrors({});
      setStep('upload');
      setFeedbackMessage('Não foi possível ler o arquivo selecionado. Verifique o formato e tente novamente.');
    }
  };

  const handleConfirmImport = () => {
    if (importData.length === 0) {
      setFeedbackMessage('Nenhum dado válido para importar.');
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
    setFeedbackMessage(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const totalValidRows = importData.length;
  const totalErrorRows = Object.keys(importErrors).length;
  const totalRows = totalValidRows + totalErrorRows;
  const requiredColumns = columns.filter((column) => column.required);
  const optionalColumns = columns.filter((column) => !column.required);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-6">
        {feedbackMessage && (
          <div className="rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{feedbackMessage}</p>
            </div>
          </div>
        )}

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
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Campos do arquivo
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Obrigatórios
                </div>
                <div className="space-y-2">
                  {requiredColumns.length > 0 ? (
                    requiredColumns.map((column) => (
                      <div key={column.key} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{column.label}</span>
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

              <div className="border-t border-slate-200/70 pt-4 dark:border-slate-700/60">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Opcionais
                </div>
                <div className="space-y-2">
                  {optionalColumns.length > 0 ? (
                    optionalColumns.map((column) => (
                      <div key={column.key} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{column.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          opcional
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nenhum campo opcional configurado.
                    </p>
                  )}
                </div>
              </div>
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
