// FINQZ PRO - Automações Page
// Página profissional de automações com modelo baseado em eventos

import React, { useState, useMemo, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Zap, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  FileJson,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  ExternalLink,
  Mail,
  MessageCircle,
  Bell,
  CheckSquare,
  ArrowRight,
  Smartphone,
  Loader2
} from "lucide-react";
import useAppStore from "../store";
import { Button, Card as DSCard, Input, Select, Badge, Modal } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { TRIGGER_CONFIG } from "../types/automations";
import type { 
  Automation, 
  AutomationTrigger, 
  AutomationAction, 
  AutomationCondition,
  ActionParameters,
  AutomationStatus,
  AutomationLog,
} from "../types/automations";
import * as automationUtils from "../utils/automations";

// ============================================
// TYPES
// ============================================

interface AutomationFormData {
  nome: string;
  descricao: string;
  trigger: AutomationTrigger;
  acao: AutomationAction;
  acaoParametros: ActionParameters;
  condicoes: AutomationCondition[];
  condicaoLogica: 'AND' | 'OR';
  ativo: boolean;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Badge de status
 */
const StatusBadge: React.FC<{ status: AutomationStatus }> = ({ status }) => {
  const config = automationUtils.formatStatus(status);
  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {status === 'ativa' && <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />}
      {config.label}
    </span>
  );
};

/**
 * Linha de log
 */
const LogRow: React.FC<{ log: AutomationLog }> = ({ log }) => {
  const statusIcon = {
    sucesso: <CheckCircle className="w-4 h-4 text-green-500" />,
    falha: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    erro: <XCircle className="w-4 h-4 text-red-500" />,
    skipped: <Clock className="w-4 h-4 text-gray-400" />,
  };
  
  return (
    <div className="flex items-center gap-4 p-3 border-b border-gray-100 hover:bg-gray-50">
      {statusIcon[log.status]}
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{log.entidadeNome || `Entidade #${log.entidadeId}`}</p>
        <p className="text-xs text-gray-500">{log.erro || 'Execução bem-sucedida'}</p>
      </div>
      <div className="text-xs text-gray-500">
        {new Date(log.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
};

/**
 * Card de automação
 */
const AutomationCard: React.FC<{
  automation: Automation;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onViewLogs: () => void;
}> = ({ automation, onEdit, onDelete, onToggle, onViewLogs }) => {
  const [expanded, setExpanded] = useState(false);
  
  const triggerConfig = TRIGGER_CONFIG.TRIGGERS.find(t => t.id === automation.trigger);
  const actionConfig = TRIGGER_CONFIG.ACTIONS.find(a => a.id === automation.acao);
  
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">{automation.nome}</h3>
              <StatusBadge status={automation.status} />
            </div>
            {automation.descricao && (
              <p className="text-sm text-gray-500 mb-3">{automation.descricao}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">{automationUtils.formatTriggerName(automation.trigger)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">{automationUtils.formatActionName(automation.acao)}</span>
              </div>
              {automation.condicoes && automation.condicoes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">{automation.condicoes.length} condição(s)</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              title={automation.ativo ? 'Pausar' : 'Ativar'}
            >
              {automation.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewLogs} title="Ver Logs">
              <Clock className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit} title="Editar">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} title="Excluir">
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                Última execução: {automationUtils.formatExecutionDate(automation.ultimaExecucao)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-600">
                ✓ {automation.totalSucessos || 0} sucessos
              </span>
              <span className="text-red-600">
                ✗ {automation.totalFalhas || 0} falhas
              </span>
              {automation.totalExecucoes && automation.totalExecucoes > 0 && (
                <span className="text-blue-600 font-medium">
                  {automationUtils.formatSuccessRate(automation.totalSucessos || 0, automation.totalExecucoes)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Expandir para ver condições */}
        {automation.condicoes && automation.condicoes.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Ocultar' : 'Ver'} condições
          </button>
        )}
        
        {expanded && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Lógica: {automation.condicaoLogica || 'AND'}
            </p>
            <div className="space-y-2">
              {automation.condicoes.map((cond, index) => (
                <div key={index} className="text-sm text-gray-300">
                  {cond.campo} {cond.operador} {cond.valor}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Modal de Automação
 */
const AutomationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AutomationFormData) => void;
  automation?: Automation | null;
  isSaving?: boolean;
}> = ({ isOpen, onClose, onSave, automation, isSaving }) => {
  const [formData, setFormData] = useState<AutomationFormData>({
    nome: automation?.nome || '',
    descricao: automation?.descricao || '',
    trigger: automation?.trigger || 'oportunidade_criada',
    acao: automation?.acao || 'criar_notificacao',
    acaoParametros: automation?.acaoParametros || {},
    condicoes: automation?.condicoes || [],
    condicaoLogica: automation?.condicaoLogica || 'AND',
    ativo: automation?.ativo ?? true,
  });
  
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  
  const requiresConfirmation = automationUtils.actionRequiresConfirmation(formData.acao);
  
  const handleSubmit = () => {
    // Valida automação
    const validationResult = automationUtils.validateAutomation({
      nome: formData.nome,
      trigger: formData.trigger,
      acao: formData.acao,
      acaoParametros: formData.acaoParametros,
      condicoes: formData.condicoes,
    });
    
    setValidation(validationResult);
    
    if (!validationResult.isValid) {
      return;
    }
    
    if (requiresConfirmation) {
      setShowConfirm(true);
      return;
    }
    
    onSave(formData);
  };
  
  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSave(formData);
  };
  
  const addCondition = () => {
    setFormData({
      ...formData,
      condicoes: [...formData.condicoes, { campo: '', operador: 'equals', valor: '' }],
    });
  };
  
  const updateCondition = (index: number, field: keyof AutomationCondition, value: any) => {
    const newCondicoes = [...formData.condicoes];
    newCondicoes[index] = { ...newCondicoes[index], [field]: value };
    setFormData({ ...formData, condicoes: newCondicoes });
  };
  
  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      condicoes: formData.condicoes.filter((_, i) => i !== index),
    });
  };
  
  const getActionIcon = (action: AutomationAction) => {
    const icons: Record<AutomationAction, React.ReactNode> = {
      enviar_email: <Mail className="w-5 h-5" />,
      enviar_whatsapp: <MessageCircle className="w-5 h-5" />,
      criar_notificacao: <Bell className="w-5 h-5" />,
      criar_tarefa: <CheckSquare className="w-5 h-5" />,
      mover_etapa: <ArrowRight className="w-5 h-5" />,
      chamar_webhook: <ExternalLink className="w-5 h-5" />,
      atualizar_campo: <Settings className="w-5 h-5" />,
      enviar_sms: <Smartphone className="w-5 h-5" />,
    };
    return icons[action];
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">
          {automation ? 'Editar Automação' : 'Nova Automação'}
        </h2>
        
        {/* Validação */}
        {!validation.isValid && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertCircle className="w-4 h-4" />
              Corrija os erros antes de salvar
            </div>
            <ul className="list-disc list-inside text-sm text-red-600">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Nome */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Notificar nova oportunidade"
          />
        </div>
        
        {/* Descrição */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="O que esta automação faz?"
          />
        </div>
        
        {/* Trigger */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Trigger *
          </label>
          <select
            value={formData.trigger}
            onChange={(e) => setFormData({ ...formData, trigger: e.target.value as AutomationTrigger })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {TRIGGER_CONFIG.TRIGGERS.map((trigger) => (
              <option key={trigger.id} value={trigger.id}>
                {trigger.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {TRIGGER_CONFIG.TRIGGERS.find(t => t.id === formData.trigger)?.descricao}
          </p>
        </div>
        
        {/* Ação */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Ação *
          </label>
          <select
            value={formData.acao}
            onChange={(e) => setFormData({ ...formData, acao: e.target.value as AutomationAction })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {TRIGGER_CONFIG.ACTIONS.map((action) => (
              <option key={action.id} value={action.id}>
                {action.label}
              </option>
            ))}
          </select>
          
          {requiresConfirmation && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Esta ação requer confirmação antes da execução
            </div>
          )}
        </div>
        
        {/* Parâmetros da Ação */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Parâmetros da Ação
          </label>
          
          {formData.acao === 'enviar_email' && (
            <>
              <input
                type="email"
                placeholder="Destinatário"
                value={formData.acaoParametros.destinatario || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, destinatario: e.target.value }
                })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Assunto"
                value={formData.acaoParametros.assunto || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, assunto: e.target.value }
                })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Corpo do e-mail"
                value={formData.acaoParametros.corpo || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, corpo: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </>
          )}
          
          {formData.acao === 'enviar_whatsapp' && (
            <>
              <input
                type="tel"
                placeholder="Telefone (com DDD)"
                value={formData.acaoParametros.telefone || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, telefone: e.target.value }
                })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Mensagem"
                value={formData.acaoParametros.mensagem || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, mensagem: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </>
          )}
          
          {formData.acao === 'criar_notificacao' && (
            <>
              <input
                type="text"
                placeholder="Título da notificação"
                value={formData.acaoParametros.titulo || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, titulo: e.target.value }
                })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Descrição"
                value={formData.acaoParametros.descricao || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, descricao: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
            </>
          )}
          
          {formData.acao === 'chamar_webhook' && (
            <>
              <input
                type="url"
                placeholder="URL do Webhook"
                value={formData.acaoParametros.webhookUrl || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, webhookUrl: e.target.value }
                })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={formData.acaoParametros.webhookMethod || 'POST'}
                onChange={(e) => setFormData({
                  ...formData,
                  acaoParametros: { ...formData.acaoParametros, webhookMethod: e.target.value as 'GET' | 'POST' | 'PUT' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </>
          )}
        </div>
        
        {/* Condições */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Condições
            </label>
            <button
              type="button"
              onClick={addCondition}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Adicionar condição
            </button>
          </div>
          
          {formData.condicoes.length > 0 && (
            <div className="mb-2">
              <select
                value={formData.condicaoLogica}
                onChange={(e) => setFormData({ ...formData, condicaoLogica: e.target.value as 'AND' | 'OR' })}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="AND">Todas as condições (AND)</option>
                <option value="OR">Qualquer condição (OR)</option>
              </select>
            </div>
          )}
          
          {formData.condicoes.map((condition, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <select
                value={condition.campo}
                onChange={(e) => updateCondition(index, 'campo', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Selecione o campo</option>
                <option value="valor">Valor</option>
                <option value="etapa">Etapa</option>
                <option value="status">Status</option>
                <option value="produto">Produto</option>
              </select>
              <select
                value={condition.operador}
                onChange={(e) => updateCondition(index, 'operador', e.target.value)}
                className="w-32 px-2 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {TRIGGER_CONFIG.OPERATORS.map((op) => (
                  <option key={op.id} value={op.id}>{op.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Valor"
                value={condition.valor as string}
                onChange={(e) => updateCondition(index, 'valor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Ativo */}
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-300">Automação ativa</span>
          </label>
        </div>
        
        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {automation ? 'Salvar Alterações' : 'Criar Automação'}
          </Button>
        </div>
        
        {/* Modal de Confirmação */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#111827] rounded-lg p-6 max-w-md">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Confirmar Ação</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Você está criando uma automação que executa "<strong>{automationUtils.formatActionName(formData.acao)}</strong>". 
                Esta é uma ação potencialmente sensível. Deseja continuar?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSave}>
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AutomacoesPage: React.FC = () => {
  const { automacoes, setAutomacoes } = useAppStore();
  
  // State
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedAutomationLogs, setSelectedAutomationLogs] = useState<AutomationLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dados mockados para demonstração
  const mockLogs: AutomationLog[] = [
    { id: 1, automacaoId: 1, automacaoNome: 'Notificar nova oportunidade', entidadeTipo: 'oportunidade', entidadeId: 1, entidadeNome: 'João Silva', status: 'sucesso', tentativa: 1, timestamp: Date.now() - 3600000 },
    { id: 2, automacaoId: 1, automacaoNome: 'Notificar nova oportunidade', entidadeTipo: 'oportunidade', entidadeId: 2, entidadeNome: 'Maria Santos', status: 'sucesso', tentativa: 1, timestamp: Date.now() - 7200000 },
    { id: 3, automacaoId: 2, automacaoNome: 'Mover para triagem', entidadeTipo: 'oportunidade', entidadeId: 3, entidadeNome: 'Pedro Costa', status: 'erro', erro: 'Webhook retornou 500', tentativa: 3, timestamp: Date.now() - 10800000 },
  ];
  
  // Filtrar automações
  const filteredAutomations = useMemo(() => {
    if (!search) return automacoes;
    const searchLower = search.toLowerCase();
    return automacoes.filter(a => 
      a.nome.toLowerCase().includes(searchLower) ||
      a.descricao?.toLowerCase().includes(searchLower)
    );
  }, [automacoes, search]);
  
  // Handlers
  const handleCreate = () => {
    setEditingAutomation(null);
    setShowModal(true);
  };
  
  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setShowModal(true);
  };
  
  const handleDelete = async (automation: Automation) => {
    if (window.confirm(`Tem certeza que deseja excluir "${automation.nome}"?`)) {
      setAutomacoes(automacoes.filter(a => a.id !== automation.id));
    }
  };
  
  const handleToggle = (automation: Automation) => {
    setAutomacoes(automacoes.map(a => 
      a.id === automation.id 
        ? { ...a, ativo: !a.ativo, status: !a.ativo ? 'ativa' : 'pausada' }
        : a
    ));
  };
  
  const handleViewLogs = (automation: Automation) => {
    setSelectedAutomationLogs(mockLogs.filter(l => l.automacaoId === automation.id));
    setShowLogsModal(true);
  };
  
  const handleSave = async (formData: AutomationFormData) => {
    setIsSaving(true);
    
    try {
      // Simula salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAutomation: Automation = {
        id: editingAutomation?.id || Date.now(),
        nome: formData.nome,
        descricao: formData.descricao,
        trigger: formData.trigger,
        acao: formData.acao,
        acaoParametros: formData.acaoParametros,
        condicoes: formData.condicoes,
        condicaoLogica: formData.condicaoLogica,
        ativo: formData.ativo,
        status: formData.ativo ? 'ativa' : 'pausada',
        escopo: 'oportunidade',
        createdAt: editingAutomation?.createdAt || Date.now(),
        updatedAt: Date.now(),
        totalExecucoes: editingAutomation?.totalExecucoes || 0,
        totalSucessos: editingAutomation?.totalSucessos || 0,
        totalFalhas: editingAutomation?.totalFalhas || 0,
      };
      
      if (editingAutomation) {
        setAutomacoes(automacoes.map(a => a.id === editingAutomation.id ? newAutomation : a));
      } else {
        setAutomacoes([newAutomation, ...automacoes]);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving automation:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Estatísticas
  const stats = useMemo(() => ({
    total: automacoes.length,
    ativas: automacoes.filter(a => a.ativo).length,
    pausadas: automacoes.filter(a => !a.ativo).length,
    comErro: automacoes.filter(a => a.status === 'erro').length,
  }), [automacoes]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Automações"
        subtitle="Configure automações baseadas em eventos do sistema"
      />
      
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-4">
            <p className="text-sm text-gray-500">Ativas</p>
            <p className="text-2xl font-semibold text-green-600">{stats.ativas}</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-4">
            <p className="text-sm text-gray-500">Pausadas</p>
            <p className="text-2xl font-semibold text-yellow-600">{stats.pausadas}</p>
          </div>
          <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-4">
            <p className="text-sm text-gray-500">Com Erro</p>
            <p className="text-2xl font-semibold text-red-600">{stats.comErro}</p>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar automações..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
          </div>
          
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Automação
          </Button>
        </div>
        
        {/* Lista de Automações */}
        {filteredAutomations.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma automação encontrada</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Tente buscar por outro termo' : 'Crie sua primeira automação para começar'}
            </p>
            {!search && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Automação
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAutomations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onEdit={() => handleEdit(automation)}
                onDelete={() => handleDelete(automation)}
                onToggle={() => handleToggle(automation)}
                onViewLogs={() => handleViewLogs(automation)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de Criação/Edição */}
      <AutomationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        automation={editingAutomation}
        isSaving={isSaving}
      />
      
      {/* Modal de Logs */}
      <Modal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} size="lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Logs de Execução</h2>
          {selectedAutomationLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum log encontrado</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {selectedAutomationLogs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AutomacoesPage;
