import React from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: string;
  title: string;
  color?: string;
  opportunities: any[];
  onDrop: (e: React.DragEvent, etapaId: string) => void;
  onDragOver: (e: React.DragEvent, etapaId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onAddClick: () => void;
  onCardClick: (card: any) => void;
  isDragOver: boolean;
  totalValor: number;
  isDark?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color = '#3B82F6',
  opportunities,
  onDrop,
  onDragOver,
  onDragLeave,
  onAddClick,
  onCardClick,
  isDragOver,
  totalValor,
  isDark = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div
      className={`flex-shrink-0 w-[300px] flex flex-col bg-gray-100 rounded-xl ${
        isDragOver ? 'ring-2 ring-primary' : ''
      }`}
      onDrop={(e) => onDrop(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={onDragLeave}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
          <span className="bg-gray-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {opportunities.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddClick}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Adicionar oportunidade"
          >
            <Plus className="w-4 h-4 text-slate-500" />
          </button>
          <button className="p-1 hover:bg-gray-200 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-280px)] space-y-2">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            draggable
            onClick={() => onCardClick(opp)}
            className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm text-slate-900 line-clamp-2">
                {opp.nome || 'Sem nome'}
              </span>
            </div>
            
            {opp.telefone && (
              <p className="text-xs text-slate-500 mb-1">{opp.telefone}</p>
            )}
            
            {opp.produto && (
              <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                {opp.produto}
              </span>
            )}
            
            {opp.valor > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(opp.valor)}
                </span>
              </div>
            )}
          </div>
        ))}

        {opportunities.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhuma oportunidade
          </div>
        )}
      </div>

      {/* Column Footer */}
      {totalValor > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Total</span>
            <span className="text-sm font-bold text-slate-700">
              {formatCurrency(totalValor)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
