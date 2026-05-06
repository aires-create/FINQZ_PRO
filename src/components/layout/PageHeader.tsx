import React, { useState, useRef } from "react"
import { Search, RefreshCw, Plus, Filter, Download, LayoutGrid, List, X, ChevronDown, FileSpreadsheet, FileText, File, Upload, AlertCircle, CheckCircle } from "lucide-react"
import { FilterField } from "./FilterDrawer"

type FilterConfig = {
  label: string
  key: string
  type: 'select' | 'text' | 'date' | 'dateRange'
  options?: { label: string; value: string }[]
  placeholder?: string
}

type ExportConfig = {
  label: string
  value: string
  icon: React.ReactNode
}

type ImportColumn = {
  key: string
  label: string
  required?: boolean
  validate?: (value: string) => string | null // retorna mensagem de erro ou null se válido
}

type PageHeaderProps = {
  view?: 'kanban' | 'list'
  setView?: (v: 'kanban' | 'list') => void
  onRefresh?: () => void
  onCreate?: () => void
  onSearch?: (v: string) => void
  onOpenFilters?: () => void
  extraLeft?: React.ReactNode
  createLabel?: string
  filters?: FilterConfig[]
  onFilterChange?: (key: string, value: string) => void
  filterValues?: Record<string, string>
  exportData?: any[]
  exportColumns?: { key: string; label: string }[]
  exportFilename?: string
  exportLabel?: string
  onExport?: (format: string, data: any[]) => void
  // Novas props opcionais
  showSearch?: boolean
  showFilter?: boolean
  // Props de importação
  onImport?: (data: any[]) => void
  importColumns?: ImportColumn[]
  importLabel?: string
}

// Funções de exportação
const exportToCSV = (data: any[], columns: { key: string; label: string }[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }
  
  const headers = columns.map(col => col.label).join(',')
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key]
      // Escape valores que contêm vírgulas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value ?? ''
    }).join(',')
  )
  
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

const exportToExcel = (data: any[], columns: { key: string; label: string }[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }
  
  // Criar HTML table para Excel
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>'
  html += '<table border="1">'
  
  // Headers
  html += '<tr>'
  columns.forEach(col => {
    html += `<th style="background:#000dff;color:white;font-weight:bold">${col.label}</th>`
  })
  html += '</tr>'
  
  // Rows
  data.forEach(row => {
    html += '<tr>'
    columns.forEach(col => {
      html += `<td>${row[col.key] ?? ''}</td>`
    })
    html += '</tr>'
  })
  
  html += '</table></body></html>'
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`
  link.click()
}

const exportToPDF = (data: any[], columns: { key: string; label: string }[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }
  
  // Criar HTML para impressão
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
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
}

// Função para parse de CSV
const parseCSV = (text: string): string[][] => {
  const lines = text.split('\n').filter(line => line.trim())
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

// Normaliza nome da coluna para chave
const normalizeColumnKey = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function PageHeader({
  view,
  setView,
  onRefresh,
  onCreate,
  onSearch,
  onOpenFilters,
  extraLeft,
  createLabel = "Novo",
  filters = [],
  onFilterChange,
  filterValues = {},
  exportData,
  exportColumns = [],
  exportFilename = 'export',
  exportLabel = 'Exportar',
  onExport,
  showSearch = true,
  showFilter = true,
  onImport,
  importColumns = [],
  importLabel = "Importar"
}: PageHeaderProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<Record<number, string>>({})
  const [importFileName, setImportFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localFilterValues, setLocalFilterValues] = useState<Record<string, string>>(filterValues)
  const [filterLoading, setFilterLoading] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    const newValues = { ...localFilterValues, [key]: value }
    setLocalFilterValues(newValues)
    onFilterChange?.(key, value)
  }

  const handleExport = (format: string) => {
    setShowExportDropdown(false)
    
    if (onExport) {
      onExport(format, exportData || [])
      return
    }
    
    // Funções de exportação padrão
    if (format === 'csv') {
      exportToCSV(exportData || [], exportColumns, exportFilename)
    } else if (format === 'excel') {
      exportToExcel(exportData || [], exportColumns, exportFilename)
    } else if (format === 'pdf') {
      exportToPDF(exportData || [], exportColumns, exportFilename)
    }
  }

  const activeFiltersCount = Object.values(localFilterValues).filter(v => v && v !== '').length

  // Processar arquivo importado
  const handleFileImport = (file: File) => {
    setImportFileName(file.name)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      
      if (rows.length < 2) {
        alert('Arquivo deve conter pelo menos cabeçalho e uma linha de dados')
        return
      }
      
      const headers = rows[0]
      const dataRows = rows.slice(1)
      
      // Mapear colunas do arquivo para colunas esperadas
      const columnMap: Record<number, string> = {}
      headers.forEach((header, index) => {
        const key = normalizeColumnKey(header)
        const expectedCol = importColumns.find(ic => normalizeColumnKey(ic.label) === key || normalizeColumnKey(ic.key) === key)
        if (expectedCol) {
          columnMap[index] = expectedCol.key
        }
      })
      
      // Processar linhas
      const processedData: any[] = {}
      const errors: Record<number, string> = {}
      
      dataRows.forEach((row, rowIndex) => {
        const rowData: any = {}
        let rowError = ''
        
        row.forEach((cell, colIndex) => {
          const key = columnMap[colIndex]
          if (key) {
            rowData[key] = cell
          }
        })
        
        // Validar campos obrigatórios
        importColumns.forEach(col => {
          if (col.required && !rowData[col.key]) {
            rowError = `Campo "${col.label}" é obrigatório`
          }
          if (col.validate && rowData[col.key]) {
            const error = col.validate(rowData[col.key])
            if (error) rowError = error
          }
        })
        
        if (rowError) {
          errors[rowIndex] = rowError
        } else {
          processedData[rowIndex] = rowData
        }
      })
      
      setImportData(Object.values(processedData))
      setImportErrors(errors)
    }
    
    reader.readAsText(file)
  }

  // Confirmar importação
  const handleConfirmImport = () => {
    if (importData.length === 0) {
      alert('Nenhum dado válido para importar')
      return
    }
    
    onImport?.(importData)
    setShowImportModal(false)
    setImportData([])
    setImportErrors({})
    setImportFileName('')
  }

  const exportOptions: ExportConfig[] = [
    { label: 'CSV', value: 'csv', icon: <FileText size={16} className="text-green-600" /> },
    { label: 'Excel', value: 'excel', icon: <FileSpreadsheet size={16} className="text-blue-600" /> },
    { label: 'PDF', value: 'pdf', icon: <File size={16} className="text-red-600" /> },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A]/80 backdrop-blur-xl p-3 shadow-sm">
      <div className="flex items-center justify-between w-full gap-4 flex-wrap">
        
        {/* Left: Busca + Atualizar */}
        <div className="flex items-center gap-2">
          {/* Kanban / Lista Toggle */}
          {view && setView && (
            <div className="flex bg-[#111827]/90 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  view === 'kanban' 
                    ? 'bg-[#000dff] text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-white/10'
                }`}
                title="Kanban"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  view === 'list' 
                    ? 'bg-[#000dff] text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-white/10'
                }`}
                title="Lista"
              >
                <List size={18} />
              </button>
            </div>
          )}

          {/* Extra Left */}
          {extraLeft}

          {/* Buscar - opcional */}
          {showSearch && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar..."
                className="h-10 w-[280px] rounded-xl border border-white/10 bg-[#0F172A] text-slate-100 placeholder:text-slate-400 pl-10 pr-3 text-sm outline-none focus:border-[#000dff] focus:ring-2 focus:ring-[#000dff]/20"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}

          {/* Atualizar - botão fantasma com ícone apenas */}
          <button 
            onClick={onRefresh} 
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10"
            title="Atualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Right: Ações */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Filtros Dropdown - opcional */}
          {showFilter && (filters.length > 0 || onOpenFilters) && (
            <div className="relative">
              <button 
                onClick={() => {
                  if (onOpenFilters) {
                    onOpenFilters()
                  } else if (filters.length > 0) {
                    setShowFilterDropdown(!showFilterDropdown)
                  }
                }}
                className={`flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#0F172A]/80 backdrop-blur-xl px-3 text-sm font-medium transition-all ${
                  activeFiltersCount > 0 || showFilterDropdown
                    ? 'border-[#000dff] bg-[#000dff]/5 text-[#000dff]'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Filter size={16} className={activeFiltersCount > 0 ? 'text-[#000dff]' : 'text-slate-500'} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-[#000dff] text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                {!onOpenFilters && (
                  <ChevronDown size={14} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && filters.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowFilterDropdown(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-100">Filtros</h3>
                      <button 
                        onClick={() => {
                          setLocalFilterValues({})
                          filters.forEach(f => onFilterChange?.(f.key, ''))
                        }}
                        className="text-xs text-[#000dff] hover:underline"
                      >
                        Limpar todos
                      </button>
                    </div>
                    <div className="space-y-3">
                      {filters.map((filter) => (
                        <div key={filter.key}>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            {filter.label}
                          </label>
                          {filter.type === 'select' && filter.options ? (
                            <select
                              value={localFilterValues[filter.key] || ''}
                              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                              className="w-full border border-white/10 rounded-lg bg-[#0F172A] text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]/20"
                            >
                              <option value="">{filter.placeholder || 'Selecione...'}</option>
                              {filter.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : filter.type === 'text' ? (
                            <input
                              type="text"
                              value={localFilterValues[filter.key] || ''}
                              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                              placeholder={filter.placeholder}
                              className="w-full border border-white/10 rounded-lg bg-[#0F172A] text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]/20"
                            />
                          ) : filter.type === 'date' ? (
                            <input
                              type="date"
                              value={localFilterValues[filter.key] || ''}
                              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                              className="w-full border border-white/10 rounded-lg bg-[#0F172A] text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#000dff]/20"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowFilterDropdown(false)}
                      className="w-full mt-4 bg-[#000dff] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#000dcc] transition-all"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Importar */}
          {onImport && importColumns.length > 0 && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 transition-all"
            >
              <Upload size={16} className="text-slate-500" />
              {importLabel}
            </button>
          )}

          {/* Exportar Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 transition-all"
            >
              <Download size={16} className="text-slate-500" />
              {exportLabel}
              <ChevronDown size={14} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showExportDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportDropdown(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg z-50 py-2">
                  {exportOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleExport(option.value)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Novo Cliente - Botão Primário */}
          {onCreate && (
            <button 
              onClick={onCreate} 
              className="flex h-10 items-center gap-2 rounded-xl bg-[#000dff] px-4 text-sm font-semibold text-white hover:bg-[#000dff]/90"
            >
              <Plus size={16} />
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative w-full max-w-2xl mx-4 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Importar Dados</h2>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-slate-300" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Upload de arquivo */}
              {!importData.length && (
                <div 
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#000dff] transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-300 mb-2">Clique ou arraste o arquivo aqui</p>
                  <p className="text-xs text-slate-400">Aceitos: CSV, XLSX, XLS</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileImport(file)
                    }}
                  />
                </div>
              )}

              {/* Preview dos dados */}
              {importData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-100">{importFileName}</p>
                      <p className="text-sm text-slate-500">
                        Total: {importData.length + Object.keys(importErrors).length} linhas • 
                        Válidas: <span className="text-green-600 font-medium">{importData.length}</span> • 
                        Erros: <span className="text-red-600 font-medium">{Object.keys(importErrors).length}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => { setImportData([]); setImportErrors({}); setImportFileName(''); }}
                      className="text-sm text-[#000dff] hover:underline"
                    >
                      Carregar outro arquivo
                    </button>
                  </div>

                  {/* Lista de erros */}
                  {Object.keys(importErrors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-700 mb-2">Erros encontrados:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {Object.entries(importErrors).slice(0, 5).map(([row, error]) => (
                          <li key={row}>Linha {parseInt(row) + 2}: {error}</li>
                        ))}
                        {Object.keys(importErrors).length > 5 && (
                          <li>... e mais {Object.keys(importErrors).length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Preview da tabela */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0F172A]">
                        <tr>
                          {columns.map((col) => (
                            <th key={col.key} className="px-3 py-2 text-left font-medium text-slate-300">{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t">
                            {importColumns.slice(0, 5).map(col => (
                              <td key={col.key} className="px-3 py-2 text-slate-200">{row[col.key] || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-200 bg-[#111827] rounded-lg hover:bg-white/5"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmImport}
                disabled={importData.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-[#000dff] rounded-lg hover:bg-[#000dcc] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importar {importData.length} {importData.length === 1 ? 'linha' : 'linhas'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
