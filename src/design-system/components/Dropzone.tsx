/**
 * FINQZ PRO - Dropzone Component
 * Componente reutilizável de drag-and-drop para importação de arquivos
 * Suporta CSV, XLSX, XLS e outros formatos
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // em bytes (padrão: 10MB)
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  acceptedTypes = ['.csv', '.xlsx', '.xls', '.json'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  disabled = false,
  label = 'Clique ou arraste o arquivo aqui',
  description = 'Aceitos: CSV, XLSX, XLS',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }
  }, [disabled]);

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipo
      const hasValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type);
        }
        return file.type === type;
      });

      if (!hasValidType) {
        setError(`Tipo de arquivo não permitido: ${file.name}`);
        continue;
      }

      // Validar tamanho
      if (file.size > maxSize) {
        setError(`Arquivo muito grande: ${file.name} (máx ${maxSize / 1024 / 1024}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (!multiple && validFiles.length > 1) {
      validFiles.length = 1;
      setError('Apenas um arquivo por vez');
    }

    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || !e.dataTransfer?.files) return;

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, acceptedTypes, maxSize, multiple, disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, acceptedTypes, maxSize, multiple]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center
          transition-all duration-200 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700' : ''}
          ${dragActive ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        <Upload className={`mx-auto mb-3 h-10 w-10 ${dragActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
        
        <p className={`text-sm font-medium ${dragActive ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
          {label}
        </p>
        
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200/50 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
