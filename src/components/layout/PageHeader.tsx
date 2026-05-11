import React, { useEffect, useState } from "react"
import { Search, RefreshCw, Plus, Filter, Download, LayoutGrid, List, ChevronDown, FileSpreadsheet, FileText, File, Upload } from "lucide-react"
import { zIndex } from "../../config/zIndex"
import { ImportModal } from "../../design-system/components/ImportModal"

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

const EMPTY_FILTER_VALUES: Record<string, string> = {}

type PageHeaderProps = {
  title?: string
  subtitle?: string
  icon?: React.ReactNode | React.ElementType
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
  extra?: React.ReactNode
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

export function PageHeader({
  title,
  subtitle,
  icon,
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
  filterValues = EMPTY_FILTER_VALUES,
  exportData,
  exportColumns = [],
  exportFilename = 'export',
  exportLabel = 'Exportar',
  onExport,
  showSearch,
  showFilter = true,
  onImport,
  importColumns = [],
  importLabel = "Importar",
  extra
}: PageHeaderProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [localFilterValues, setLocalFilterValues] = useState<Record<string, string>>(filterValues)

  useEffect(() => {
    setLocalFilterValues(filterValues)
  }, [filterValues])

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

  const exportOptions: ExportConfig[] = [
    { label: 'CSV', value: 'csv', icon: <FileText size={16} className="text-green-600" /> },
    { label: 'Excel', value: 'excel', icon: <FileSpreadsheet size={16} className="text-blue-600" /> },
    { label: 'PDF', value: 'pdf', icon: <File size={16} className="text-red-600" /> },
  ]

  const shouldShowSearch = showSearch ?? Boolean(onSearch)
  const shouldShowExport = Boolean(onExport || exportData !== undefined)
  const headerIconNode = icon
    ? React.isValidElement(icon)
      ? icon
      : React.createElement(icon as React.ElementType, { className: "h-5 w-5" })
    : null

  return (
    <div className="finqz-card p-3">
      {(title || subtitle || icon) && (
        <div className="mb-4 flex items-start gap-3 border-b border-slate-700/50 pb-4">
          {icon && (
            <div className="finqz-icon-badge h-10 w-10 shrink-0">
              {headerIconNode}
            </div>
          )}
          <div className="min-w-0">
            {title && (
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left: Busca + Atualizar */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {/* Kanban / Lista Toggle */}
          {view && setView && (
            <div className="flex rounded-lg border border-slate-700/60 bg-[#111827] p-1">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  view === 'kanban' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
                title="Kanban"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  view === 'list' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
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
          {shouldShowSearch && (
            <div className="relative min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar..."
                className="h-10 w-full min-w-[220px] max-w-[320px] rounded-lg border border-slate-700/60 bg-[#111827] pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}

          {/* Atualizar - botão fantasma com ícone apenas */}
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              title="Atualizar"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>

        {/* Right: Ações */}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 lg:ml-auto">
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
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  activeFiltersCount > 0 || showFilterDropdown
                    ? 'border-primary bg-primary/10 text-slate-100'
                    : 'border-slate-700/60 bg-[#111827] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <Filter size={16} className={activeFiltersCount > 0 ? 'text-primary-soft' : 'text-slate-500'} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
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
                    className="fixed inset-0" 
                    style={{ zIndex: zIndex.dropdown }}
                    onClick={() => setShowFilterDropdown(false)} 
                  />
                  <div 
                    className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-slate-700/70 bg-[#0F172A] p-4 shadow-panel"
                    style={{ zIndex: zIndex.dropdown + 1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-100">Filtros</h3>
                      <button 
                        onClick={() => {
                          setLocalFilterValues({})
                          filters.forEach(f => onFilterChange?.(f.key, ''))
                        }}
                        className="text-xs font-semibold text-primary-soft hover:text-white"
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
                              className="w-full rounded-lg border border-slate-700/60 bg-[#111827] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                              className="w-full rounded-lg border border-slate-700/60 bg-[#111827] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : filter.type === 'date' ? (
                            <input
                              type="date"
                              value={localFilterValues[filter.key] || ''}
                              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                              className="w-full rounded-lg border border-slate-700/60 bg-[#111827] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowFilterDropdown(false)}
                      className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-700/60 bg-[#111827] px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Upload size={16} className="text-slate-500" />
              {importLabel}
            </button>
          )}

          {/* Exportar Dropdown */}
          {shouldShowExport && (
            <div className="relative">
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-700/60 bg-[#111827] px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <Download size={16} className="text-slate-500" />
                {exportLabel}
                <ChevronDown size={14} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showExportDropdown && (
                <>
                  <div 
                    className="fixed inset-0" 
                    style={{ zIndex: zIndex.dropdown }}
                    onClick={() => setShowExportDropdown(false)} 
                  />
                  <div 
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-700/70 bg-[#0F172A] py-2 shadow-panel"
                    style={{ zIndex: zIndex.dropdown + 1 }}
                  >
                    {exportOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleExport(option.value)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.06]"
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {extra}

          {/* Novo Cliente - Botão Primário */}
          {onCreate && (
            <button 
              onClick={onCreate} 
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <Plus size={16} />
              {createLabel}
            </button>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(data) => {
          onImport?.(data)
          setShowImportModal(false)
        }}
        columns={importColumns}
        title={importLabel}
        description="Importe os dados a partir de um arquivo CSV."
        acceptedTypes={['.csv']}
      />

    </div>
  )
}
