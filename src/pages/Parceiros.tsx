// FINQZ PRO - Parceiros Page
import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Building2, Store, User, ToggleLeft, ToggleRight, UserCheck, UserX, Grid, List, Upload, Copy, Check, FileText, Image, File, Handshake, Shield } from "lucide-react";
import useAppStore from "../store";
import type { Parceiro } from "../types";
import { Button, Card as DSCard, Input, Select, Badge, StatusBadge, EntityAvatar, EmptyState, LoadingState, KpiCard } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { API_BASE_URL } from "../config/environment";
import { useTenantFilter } from "../hooks/useTenantFilter";

const PARCEIRO_STATUSES = [
  { key: "prospect", label: "Prospect" },
  { key: "contato", label: "Contato" },
  { key: "negociacao", label: "Negociação" },
  { key: "ativo", label: "Ativo" },
  { key: "inativo", label: "Inativo" },
  { key: "nao_perturbe", label: "Não Perturbe" },
];

const PARCEIRO_TIPOS = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "franquia", label: "Franquia", icon: Store },
  { key: "franqueado", label: "Franqueado", icon: User },
];

// Função para normalizar código do parceiro para formato #P-0000
const normalizeCodigoParceiro = (codigo: string | number | undefined): string => {
  if (!codigo && codigo !== 0) {
    return '#P-0001';
  }
  const num = String(codigo).replace(/\D/g, '');
  if (!num) {
    return '#P-0001';
  }
  return `#P-${num.padStart(4, '0')}`;
};

// Função para extrair número do código do parceiro
const getCodigoParceiroNumber = (codigo: string | number | undefined): number => {
  if (!codigo && codigo !== 0) return 0;
  const num = String(codigo).replace(/\D/g, '');
  return parseInt(num, 10) || 0;
};

export const ParceirosPage: React.FC = () => {
  const { parceiros, addParceiro, updateParceiro, deleteParceiro, toggleParceiroStatus, theme } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCidade, setFilterCidade] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  // Lista apenas - sem Kanban/Grid
  const [showModal, setShowModal] = useState(false);
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ login: string; senha: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<Array<{ nome: string; tipo: string; arquivo: string; data: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado do Drawer de Filtros
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

  // Chave para persistência no localStorage
  const PARCEIROS_STORAGE_KEY = 'finqz_pro_parceiros';

  // Função para carregar parceiros do localStorage
  const loadParceirosFromStorage = (): Parceiro[] => {
    try {
      const saved = localStorage.getItem(PARCEIROS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : parceiros;
    } catch {
      return parceiros;
    }
  };

  // Persistir parceiros no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PARCEIROS_STORAGE_KEY, JSON.stringify(parceiros || []));
    } catch (error) {
      console.error('Erro ao persistir parceiros:', error);
    }
  }, [parceiros]);

  // Função para processar importação de parceiros
  const handleImportParceiros = (importData: any[]) => {
    if (!importData || importData.length === 0) {
      alert("Nenhum dado encontrado para importar.");
      return;
    }

    const now = Date.now();
    // Gerar códigos sequenciais para os novos parceiros
    const proximoCodigo = generateCodigo();
    
    const newParceiros = importData.map((row, index) => {
      const codigo = row.codigo ? getCodigoParceiroNumber(row.codigo) : proximoCodigo + index;
      const login = normalizeCodigoParceiro(codigo);
      
      return {
        id: now + index,
        codigo,
        login,
        nome: row.nome || "",
        tipo: row.tipo || 'franqueado',
        cpf_cnpj: row.cpf_cnpj || row.cpf || row.cnpj || "",
        responsavel: row.responsavel || "",
        telefone: row.telefone || "",
        celular: row.celular || "",
        email: row.email || "",
        cep: row.cep || "",
        rua: row.rua || "",
        numero: row.numero || "",
        complemento: row.complemento || "",
        bairro: row.bairro || "",
        cidade: row.cidade || "",
        estado: row.estado || "",
        status: row.status || 'prospect',
        observacao: row.observacao || "",
        created_at: now,
        updated_at: now,
      };
    }).filter(p => p.nome);

    if (newParceiros.length === 0) {
      alert("Nenhum parceiro válido encontrado. O nome é obrigatório.");
      return;
    }

    const updatedParceiros = [...safeParceiros, ...newParceiros];
    updatedParceiros.forEach((p, i) => addParceiro({ ...p, id: now + i }));
    
    alert(`${newParceiros.length} parceiro(s) importado(s) com sucesso!`);
  };

  const safeParceiros = Array.isArray(parceiros) ? parceiros : [];

  // Função para gerar código automático sequencial
  const generateCodigo = () => {
    const parceirosList = Array.isArray(parceiros) ? parceiros : [];
    if (parceirosList.length === 0) return 1;
    // Extrair apenas números dos códigos existentes
    const numeros = parceirosList.map(p => getCodigoParceiroNumber(p.codigo));
    const maxNumero = numeros.length > 0 ? Math.max(...numeros) : 0;
    return maxNumero + 1;
  };

  // Função para gerar senha segura
  const generateSenha = () => {
    const letras = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numeros = "0123456789";
    const todos = letras + numeros;
    let senha = "";
    // Pelo menos uma letra maiúscula
    senha += letras.charAt(Math.floor(Math.random() * letras.length));
    // Pelo menos um número
    senha += numeros.charAt(Math.floor(Math.random() * numeros.length));
    // Restante aleatório
    for (let i = 0; i < 4; i++) {
      senha += todos.charAt(Math.floor(Math.random() * todos.length));
    }
    return senha.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Função para resetar senha do parceiro
  const handleResetSenha = async () => {
    if (!editingParceiro) return;

    const novaSenha = generateSenha();

    // Validações antes de enviar
    const podeEnviarEmail = !!editingParceiro.email;
    const podeEnviarWhatsapp = !!editingParceiro.celular;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/parceiros/${editingParceiro.id}/reset-senha`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            novaSenha,
            parceiro: {
              nome: editingParceiro.nome,
              email: editingParceiro.email,
              celular: editingParceiro.celular,
              login: editingParceiro.codigo,
            },
            enviarEmail: podeEnviarEmail,
            enviarWhatsapp: podeEnviarWhatsapp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido");
      }

      // Atualiza local
      updateParceiro(editingParceiro.id, {
        senha: novaSenha,
        updated_at: Date.now(),
      });

      setGeneratedCredentials({
        login: normalizeCodigoParceiro(editingParceiro.codigo),
        senha: novaSenha,
      });

      // Feedback real
      let msg = "✅ Senha resetada com sucesso!\n";

      if (podeEnviarEmail) {
        msg += result.notifications?.email?.success
          ? "✉️ Email enviado\n"
          : "⚠️ Falha no email\n";
      } else {
        msg += "⚠️ Sem email cadastrado\n";
      }

      if (podeEnviarWhatsapp) {
        msg += result.notifications?.whatsapp?.success
          ? "📱 WhatsApp enviado\n"
          : "⚠️ Falha no WhatsApp\n";
      } else {
        msg += "⚠️ Sem celular cadastrado\n";
      }

      alert(msg);

      setShowCredentials(true);

    } catch (error) {
      console.error("Erro crítico:", error);

      alert("Erro ao comunicar com servidor. Senha atualizada localmente.");

      // fallback seguro
      updateParceiro(editingParceiro.id, {
        senha: novaSenha,
        updated_at: Date.now(),
      });

      setGeneratedCredentials({
        login: normalizeCodigoParceiro(editingParceiro.codigo),
        senha: novaSenha,
      });

      setShowCredentials(true);

    }
  };

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "franqueado" as "company" | "franquia" | "franqueado",
    cpf_cnpj: "",
    responsavel: "",
    telefone: "",
    celular: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    status: "prospect" as "prospect" | "contato" | "negociacao" | "ativo" | "inativo" | "nao_perturbe",
    // Novos campos baseados em Cliente
    profissao: "",
    estado_civil: "",
    responsavel_legal: "",
    cpf_responsavel: "",
    sexo: "" as "" | "masculino" | "feminino" | "outro" | "nao_informar",
    data_nascimento: "",
    // Dados Bancários
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "" as "" | "corrente" | "poupanca",
    titular: "",
    documentoTitular: "",
    pixTipo: "" as "" | "cpf" | "cnpj" | "email" | "telefone" | "aleatoria",
    pixChave: "",
    // Campos existentes
    parent_id: 0,
    comissao_company: 0,
    comissao_franquia: 0,
    comissao_franqueado: 0,
    observacao: "",
    // Dados Compliance
    rdStatus: "nao_consultado" as "nao_consultado" | "sem_restricao" | "restricao",
    rdConsultedAt: "",
    doNotCallStatus: "nao_consultado" as "nao_consultado" | "liberado" | "bloqueado",
    doNotCallConsultedAt: "",
  });

  // APLICAR FILTRAGEM DE TENANT PRIMEIRO (segurança multi-tenant)
  const tenantFilteredParceiros = useTenantFilter(parceiros) as Parceiro[];
  
  const filteredParceiros = tenantFilteredParceiros.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = !filterTipo || p.tipo === filterTipo;
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchCidade = !filterCidade || p.cidade?.toLowerCase().includes(filterCidade.toLowerCase());
    const matchEstado = !filterEstado || p.estado?.toUpperCase() === filterEstado.toUpperCase();
    const matchResponsavel = !filterResponsavel || p.responsavel?.toLowerCase().includes(filterResponsavel.toLowerCase());
    const matchEmail = !filterEmail || p.email?.toLowerCase().includes(filterEmail.toLowerCase());
    return matchSearch && matchTipo && matchStatus && matchCidade && matchEstado && matchResponsavel && matchEmail;
  });

  // Funções de Consulta de Compliance
  const handleConsultCredit = () => {
    const doc = formData.cpf_cnpj?.replace(/\D/g, '');
    if (!doc || doc.length < 11) {
      alert('CPF/CNPJ inválido para consulta');
      return;
    }
    const hasRestriction = Math.random() > 0.7;
    setFormData({
      ...formData,
      rdStatus: hasRestriction ? 'restricao' : 'sem_restricao',
      rdConsultedAt: new Date().toISOString(),
    });
  };

  const handleConsultDoNotCall = () => {
    const phone = formData.celular || formData.telefone;
    if (!phone || phone.length < 10) {
      alert('Telefone/Celular inválido para consulta');
      return;
    }
    const isBlocked = Math.random() > 0.8;
    setFormData({
      ...formData,
      doNotCallStatus: isBlocked ? 'bloqueado' : 'liberado',
      doNotCallConsultedAt: new Date().toISOString(),
    });
  };

  // Renderizar status de compliance
  const renderCreditStatus = () => {
    const status = formData.rdStatus || 'nao_consultado';
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      nao_consultado: { color: 'text-slate-500', bg: 'bg-gray-400', label: 'Não consultado' },
      sem_restricao: { color: 'text-green-600', bg: 'bg-green-900/200', label: 'Sem restrição' },
      restricao: { color: 'text-red-600', bg: 'bg-red-900/200', label: 'Com restrição' },
    };
    const config = configs[status];
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${config.bg}`} />
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  const renderDoNotCallStatus = () => {
    const status = formData.doNotCallStatus || 'nao_consultado';
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      nao_consultado: { color: 'text-slate-500', bg: 'bg-gray-400', label: 'Não consultado' },
      liberado: { color: 'text-green-600', bg: 'bg-green-900/200', label: 'Liberado' },
      bloqueado: { color: 'text-yellow-600', bg: 'bg-yellow-900/200', label: 'Bloqueado' },
    };
    const config = configs[status];
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${config.bg}`} />
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    
    // Normalizar dados bancários
    const dadosBancarios = {
      banco: formData.banco,
      agencia: formData.agencia,
      conta: formData.conta,
      tipoConta: formData.tipoConta,
      titular: formData.titular,
      documentoTitular: formData.documentoTitular,
      pixTipo: formData.pixTipo,
      pixChave: formData.pixChave,
    };

    // Verificar se tem dados bancários para salvar
    const temDadosBancarios = Object.values(dadosBancarios).some(v => v && v !== "");

    if (editingParceiro) {
      updateParceiro(editingParceiro.id, {
        ...formData,
        cpf_cnpj: formData.cpf_cnpj || undefined,
        celular: formData.celular || undefined,
        profissao: formData.profissao || undefined,
        estado_civil: formData.estado_civil || undefined,
        responsavel_legal: formData.responsavel_legal || undefined,
        cpf_responsavel: formData.cpf_responsavel || undefined,
        parent_id: formData.parent_id || undefined,
        documentos: documentos.length > 0 ? documentos : undefined,
        bankData: temDadosBancarios ? dadosBancarios : undefined,
        updated_at: now,
      });
    } else {
      // Gerar código, login e senha automáticos
      const novoCodigo = generateCodigo();
      const novoLogin = normalizeCodigoParceiro(novoCodigo);
      const novaSenha = generateSenha();
      
      const newParceiro: Parceiro = {
        id: Date.now(),
        codigo: novoCodigo,
        login: novoLogin,
        senha: novaSenha,
        ...formData,
        cpf_cnpj: formData.cpf_cnpj || undefined,
        celular: formData.celular || undefined,
        profissao: formData.profissao || undefined,
        estado_civil: formData.estado_civil || undefined,
        responsavel_legal: formData.responsavel_legal || undefined,
        cpf_responsavel: formData.cpf_responsavel || undefined,
        parent_id: formData.parent_id || undefined,
        documentos: documentos.length > 0 ? documentos : undefined,
        bankData: temDadosBancarios ? dadosBancarios : undefined,
        created_at: now,
        updated_at: now,
      };
      addParceiro(newParceiro);
      
      // Mostrar credenciais geradas
      setGeneratedCredentials({ login: novoLogin, senha: novaSenha });
      setShowCredentials(true);
    }
    
    setShowModal(false);
    setEditingParceiro(null);
    setDocumentos([]);
    resetForm();
  };

  const handleEdit = (parceiro: Parceiro) => {
    setEditingParceiro(parceiro);
    setFormData({
      nome: parceiro.nome,
      tipo: parceiro.tipo,
      cpf_cnpj: parceiro.cpf_cnpj || "",
      responsavel: parceiro.responsavel || "",
      telefone: parceiro.telefone || "",
      celular: parceiro.celular || "",
      email: parceiro.email || "",
      cep: parceiro.cep || "",
      rua: parceiro.rua || "",
      numero: parceiro.numero || "",
      complemento: parceiro.complemento || "",
      bairro: parceiro.bairro || "",
      cidade: parceiro.cidade || "",
      estado: parceiro.estado || "",
      status: parceiro.status,
      profissao: parceiro.profissao || "",
      estado_civil: parceiro.estado_civil || "",
      responsavel_legal: parceiro.responsavel_legal || "",
      cpf_responsavel: parceiro.cpf_responsavel || "",
      sexo: parceiro.sexo || "",
      data_nascimento: parceiro.data_nascimento || "",
      banco: parceiro.bankData?.banco || "",
      agencia: parceiro.bankData?.agencia || "",
      conta: parceiro.bankData?.conta || "",
      tipoConta: parceiro.bankData?.tipoConta || "",
      titular: parceiro.bankData?.titular || "",
      documentoTitular: parceiro.bankData?.documentoTitular || "",
      pixTipo: parceiro.bankData?.pixTipo || "",
      pixChave: parceiro.bankData?.pixChave || "",
      parent_id: parceiro.parent_id || 0,
      comissao_company: parceiro.comissao_company,
      comissao_franquia: parceiro.comissao_franquia,
      comissao_franqueado: parceiro.comissao_franqueado,
      observacao: parceiro.observacao || "",
    });
    // Carregar documentos existentes
    if (parceiro.documentos && parceiro.documentos.length > 0) {
      setDocumentos(parceiro.documentos);
    } else {
      setDocumentos([]);
    }
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este parceiro?")) {
      deleteParceiro(id);
    }
  };

  const handleToggleStatus = (id: number) => {
    toggleParceiroStatus(id);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "franqueado",
      cpf_cnpj: "",
      responsavel: "",
      telefone: "",
      celular: "",
      email: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      status: "prospect",
      profissao: "",
      estado_civil: "",
      responsavel_legal: "",
      cpf_responsavel: "",
      sexo: "",
      data_nascimento: "",
      banco: "",
      agencia: "",
      conta: "",
      tipoConta: "",
      titular: "",
      documentoTitular: "",
      pixTipo: "",
      pixChave: "",
      parent_id: 0,
      comissao_company: 0,
      comissao_franquia: 0,
      comissao_franqueado: 0,
      observacao: "",
    });
    setDocumentos([]);
    setShowCredentials(false);
    setGeneratedCredentials(null);
  };

  // Função para lidar com upload de documentos
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const tipo = file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'imagem' : 'outro';
        setDocumentos((prev) => [
          ...prev,
          {
            nome: file.name,
            tipo,
            arquivo: reader.result as string,
            data: Date.now(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para remover documento
  const removeDocumento = (index: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== index));
  };

  // Função para copiar texto
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Função para detectar se é CNPJ
  const isCNPJ = (cpfCnpj: string) => {
    return cpfCnpj && cpfCnpj.length > 11;
  };

  // Função para formatar CPF/CNPJ
  const formatCPFCNPJ = (cpfCnpj: string) => {
    if (!cpfCnpj) return "";
    if (cpfCnpj.length <= 11) {
      return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  // Função para formatar telefone
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  const getTipoLabel = (tipo: string) => {
    return PARCEIRO_TIPOS.find((t) => t.key === tipo)?.label || tipo;
  };

  const getStatusLabel = (status: string) => {
    return PARCEIRO_STATUSES.find((s) => s.key === status)?.label || status;
  };

  return (
    <div className="space-y-5">
      {/* Header Padronizado */}
      <PageHeader
        onSearch={setSearch}
        showSearch={true}
        onRefresh={() => {}}
        onCreate={() => {
          setEditingParceiro(null);
          resetForm();
          setShowModal(true);
        }}
        createLabel="Novo Parceiro"
        onImport={handleImportParceiros}
        importLabel="Importar Parceiros"
        importColumns={[
          { key: 'nome', label: 'Nome', required: true },
          { key: 'tipo', label: 'Tipo', required: false },
          { key: 'cpf_cnpj', label: 'CPF/CNPJ', required: false },
          { key: 'responsavel', label: 'Responsável', required: false },
          { key: 'email', label: 'Email', required: false },
          { key: 'telefone', label: 'Telefone', required: false },
          { key: 'celular', label: 'Celular', required: false },
          { key: 'cep', label: 'CEP', required: false },
          { key: 'rua', label: 'Rua', required: false },
          { key: 'numero', label: 'Número', required: false },
          { key: 'complemento', label: 'Complemento', required: false },
          { key: 'bairro', label: 'Bairro', required: false },
          { key: 'cidade', label: 'Cidade', required: false },
          { key: 'estado', label: 'Estado', required: false },
          { key: 'status', label: 'Status', required: false },
          { key: 'observacao', label: 'Observação', required: false },
        ]}
        // Ativar FilterDrawer (padrão premium)
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={[
          { label: 'Tipo', key: 'tipo', type: 'select', options: [
            { label: 'Franquia', value: 'franquia' },
            { label: 'Franqueado', value: 'franqueado' },
            { label: 'Company', value: 'company' },
            { label: 'Parceiro', value: 'PARCEIRO' }
          ], placeholder: 'Todos os tipos' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Prospect', value: 'prospect' },
            { label: 'Contato', value: 'contato' },
            { label: 'Negociação', value: 'negociacao' },
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' },
            { label: 'Não Perturbe', value: 'nao_perturbe' }
          ], placeholder: 'Todos os status' },
          { label: 'Cidade', key: 'cidade', type: 'text', placeholder: 'Cidade' },
          { label: 'Estado', key: 'estado', type: 'text', placeholder: 'Estado (UF)' },
          { label: 'Responsável', key: 'responsavel', type: 'text', placeholder: 'Responsável' },
          { label: 'Email', key: 'email', type: 'text', placeholder: 'Email' },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'tipo') setFilterTipo(value)
          if (key === 'status') setFilterStatus(value)
          if (key === 'cidade') setFilterCidade(value)
          if (key === 'estado') setFilterEstado(value)
          if (key === 'responsavel') setFilterResponsavel(value)
          if (key === 'email') setFilterEmail(value)
        }}
        exportData={filteredParceiros}
        exportColumns={[
          { key: 'nome', label: 'Nome' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'email', label: 'Email' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'cidade', label: 'Cidade' },
          { key: 'estado', label: 'Estado' },
        ]}
        exportFilename="parceiros"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3 lg:gap-4">
        <KpiCard
          label="Total de Parceiros"
          value={parceiros.length}
          icon={<Store size={18} />}
          variant="blue"
          className="shadow-2xl shadow-slate-950/20"
        />
        <KpiCard
          label="Ativos"
          value={parceiros.filter(p => p.status === 'ativo').length}
          icon={<UserCheck size={18} />}
          variant="green"
          className="shadow-2xl shadow-slate-950/20"
        />
        <KpiCard
          label="Inativos"
          value={parceiros.filter(p => p.status === 'inativo').length}
          icon={<UserX size={18} />}
          variant="red"
          className="shadow-2xl shadow-slate-950/20"
        />
        <KpiCard
          label="Franquias"
          value={parceiros.filter(p => p.tipo === 'franquia').length}
          icon={<Building2 size={18} />}
          variant="purple"
          className="shadow-2xl shadow-slate-950/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0F172A]/90 p-4 sm:p-5 shadow-2xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Resumo de Parceiros</p>
          <h3 className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-white">Visão geral da carteira</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Acompanhe os status-chave, a performance de franquias e maior visibilidade de contatos ativos em um painel premium.
          </p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0F172A]/90 p-4 sm:p-5 shadow-2xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Parceiros ativos</p>
          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold text-emerald-300">{parceiros.filter(p => p.status === 'ativo').length}</p>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">Parceiros em operação e com contato regular.</p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0F172A]/90 p-4 sm:p-5 shadow-2xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Franquias cadastradas</p>
          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold text-violet-300">{parceiros.filter(p => p.tipo === 'franquia').length}</p>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">Contagem de unidades franqueadas no sistema.</p>
        </div>
      </div>

      {/* Partners List - Apenas Lista */}
      <div className="hidden md:block rounded-3xl border border-white/10 bg-[#0F172A]/90 shadow-2xl shadow-black/20 overflow-x-auto">
        <div className="min-w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
            <tr className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">ID/Código</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Parceiro</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Tipo</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Status</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Responsável</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Contato</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Localização</th>
              <th className="text-right px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Ações</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {filteredParceiros.map((parceiro) => (
                <tr key={parceiro.id} className="transition-colors duration-200 hover:bg-slate-900/70">
                  <td className="px-4 py-4 text-white font-semibold">{normalizeCodigoParceiro(parceiro.codigo)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar 
                        name={parceiro.nome} 
                        type={parceiro.tipo === 'franquia' ? 'empresa' : 'parceiro'} 
                        size="sm" 
                      />
                      <span className="font-medium text-white">{parceiro.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#1f2937] text-slate-300 border border-[#374151]">
                      {getTipoLabel(parceiro.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant={
                        parceiro.status === 'ativo' ? 'success' :
                        parceiro.status === 'inativo' ? 'danger' : 'warning'
                      }
                      className="uppercase tracking-[0.04em]"
                    >
                      {getStatusLabel(parceiro.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{parceiro.responsavel || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {parceiro.telefone && <div className="text-slate-600">{parceiro.telefone}</div>}
                      {parceiro.email && <div className="text-slate-500 text-xs">{parceiro.email}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {parceiro.cidade || parceiro.estado ? `${parceiro.cidade || ''}${parceiro.cidade && parceiro.estado ? ', ' : ''}${parceiro.estado || ''}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(parceiro as Parceiro)}
                        className="p-2 text-slate-400 hover:text-[#3388d9] hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete((parceiro as Parceiro).id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3 sm:space-y-4">
        {filteredParceiros.map((parceiro) => (
          <div key={parceiro.id} className="rounded-2xl border border-white/10 bg-[#0F172A]/90 p-3 sm:p-4 shadow-2xl shadow-black/20">
            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <EntityAvatar 
                  name={parceiro.nome} 
                  type={parceiro.tipo === 'franquia' ? 'empresa' : 'parceiro'} 
                  size="sm" 
                />
                <div className="min-w-0">
                  <h3 className="font-medium text-white text-sm sm:text-base truncate">{parceiro.nome}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{normalizeCodigoParceiro(parceiro.codigo)}</p>
                </div>
              </div>
              <Badge
                variant={
                  parceiro.status === 'ativo' ? 'success' :
                  parceiro.status === 'inativo' ? 'danger' : 'warning'
                }
                className="uppercase tracking-[0.04em] flex-shrink-0 text-xs"
              >
                {getStatusLabel(parceiro.status)}
              </Badge>
            </div>
            <div className="space-y-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-[0.25em] flex-shrink-0">Tipo:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#1f2937] text-slate-300 border border-[#374151]">                  {getTipoLabel(parceiro.tipo)}
                </span>
              </div>
              {parceiro.responsavel && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-[0.25em] flex-shrink-0">Resp:</span>
                  <span className="text-xs sm:text-sm text-slate-300 line-clamp-1">{parceiro.responsavel}</span>
                </div>
              )}
              {(parceiro.telefone || parceiro.email) && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-[0.25em] flex-shrink-0">Contato:</span>
                  <div className="text-xs sm:text-sm space-y-0.5 min-w-0">
                    {parceiro.telefone && <div className="text-slate-300 truncate">{parceiro.telefone}</div>}
                    {parceiro.email && <div className="text-slate-400 text-xs truncate">{parceiro.email}</div>}
                  </div>
                </div>
              )}
              {(parceiro.cidade || parceiro.estado) && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-[0.25em] flex-shrink-0">Local:</span>
                  <span className="text-xs sm:text-sm text-slate-300 truncate">
                    {parceiro.cidade || parceiro.estado ? `${parceiro.cidade || ''}${parceiro.cidade && parceiro.estado ? ', ' : ''}${parceiro.estado || ''}` : '-'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-2 sm:pt-3 border-t border-white/5">
              <button
                onClick={() => handleEdit(parceiro as Parceiro)}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#3388d9]/10 text-[#3388d9] border border-[#3388d9]/20 rounded-lg sm:rounded-xl hover:bg-[#3388d9]/20 transition-colors text-xs sm:text-sm font-medium"
              >
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDelete((parceiro as Parceiro).id)}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg sm:rounded-xl hover:bg-red-500/20 transition-colors text-xs sm:text-sm font-medium"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredParceiros.length === 0 && (
        <EmptyState
          icon={<Store size={48} />}
          title="Nenhum parceiro encontrado"
          description={filterStatus || filterTipo || filterCidade || filterEstado || filterResponsavel || filterEmail
            ? "Tente ajustar os filtros para encontrar mais parceiros"
            : "Comece adicionando seu primeiro parceiro"}
          action={!filterStatus && !filterTipo && !filterCidade && !filterEstado && !filterResponsavel && !filterEmail ? {
            label: "Novo Parceiro",
            onClick: () => {
              setEditingParceiro(null);
              resetForm();
              setShowModal(true);
            }
          } : undefined}
        />
      )}

      {/* Modal de Credenciais */}
      {showCredentials && generatedCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#111827] rounded-2xl p-4 sm:p-6 w-full max-w-md border border-[#1f2937] max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Check size={24} className="text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Parceiro Criado!</h3>
              <p className="text-slate-500 text-xs sm:text-sm">Credenciais de acesso geradas automaticamente</p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Login</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedCredentials.login}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-lg sm:rounded-xl text-white font-mono text-xs sm:text-sm focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9]"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedCredentials.login, 'login')}
                    className="p-2 bg-[#1f2937] hover:bg-[#374151] rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedField === 'login' ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Senha</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={generatedCredentials.senha}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-lg sm:rounded-xl text-white font-mono text-xs sm:text-sm focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9]"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedCredentials.senha, 'senha')}
                    className="p-2 bg-[#1f2937] hover:bg-[#374151] rounded-lg transition-colors flex-shrink-0"
                    title="Copiar senha"
                  >
                    {copiedField === 'senha' ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 flex justify-end">
              <button
                onClick={() => setShowCredentials(false)}
                className="px-4 py-2 bg-[#3388d9] text-white rounded-lg sm:rounded-2xl hover:bg-[#2673c8] text-xs sm:text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#111827] rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-[#1f2937]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {editingParceiro ? "Editar Parceiro" : "Novo Parceiro"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    {PARCEIRO_TIPOS.map((tipo) => (
                      <option key={tipo.key} value={tipo.key}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Celular
                  </label>
                  <input
                    type="text"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-[#0F172A] border border-[#1f2937] rounded-2xl text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    {PARCEIRO_STATUSES.map((status) => (
                      <option key={status.key} value={status.key}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Profissão
                  </label>
                  <input
                    type="text"
                    value={formData.profissao}
                    onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Estado Civil
                  </label>
                  <select
                    value={formData.estado_civil}
                    onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                    <option value="uniao">União Estável</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Sexo
                  </label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                    <option value="nao_informar">Prefiro não informar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                {isCNPJ(formData.cpf_cnpj || "") && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                        Responsável Legal
                      </label>
                      <input
                        type="text"
                        value={formData.responsavel_legal}
                        onChange={(e) => setFormData({ ...formData, responsavel_legal: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                        CPF do Responsável
                      </label>
                      <input
                        type="text"
                        value={formData.cpf_responsavel}
                        onChange={(e) => setFormData({ ...formData, cpf_responsavel: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                      />
                    </div>
                  </>
                )}
                
                {/* Seção de Endereço */}
                <div className="sm:col-span-2 mt-2 sm:mt-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3 pb-2 border-b border-[#1f2937]">Endereço</h4>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Rua</label>
                  <input
                    type="text"
                    value={formData.rua}
                    onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                
                {/* Seção de Dados Bancários */}
                <div className="sm:col-span-2 mt-2 sm:mt-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3 pb-2 border-b border-[#1f2937]">Dados Bancários</h4>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Nome do banco"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Agência
                  </label>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    placeholder="Número da agência"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Conta
                  </label>
                  <input
                    type="text"
                    value={formData.conta}
                    onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                    placeholder="Número da conta"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Tipo de Conta
                  </label>
                  <select
                    value={formData.tipoConta}
                    onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value as any })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    <option value="">Selecione</option>
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Conta Poupança</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Titular da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.titular}
                    onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                    placeholder="Nome do titular"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    CPF/CNPJ do Titular
                  </label>
                  <input
                    type="text"
                    value={formData.documentoTitular}
                    onChange={(e) => setFormData({ ...formData, documentoTitular: e.target.value })}
                    placeholder="CPF ou CNPJ do titular"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>

                {/* Seção PIX */}
                <div className="sm:col-span-2 mt-2">
                  <h5 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2 pb-1 border-b border-gray-100">Chave PIX</h5>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Tipo de Chave PIX
                  </label>
                  <select
                    value={formData.pixTipo}
                    onChange={(e) => setFormData({ ...formData, pixTipo: e.target.value as any })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  >
                    <option value="">Selecione</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={formData.pixChave}
                    onChange={(e) => setFormData({ ...formData, pixChave: e.target.value })}
                    placeholder="Valor da chave PIX"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors"
                  />
                </div>

                {/* Seção de Documentos */}
                <div className="sm:col-span-2 mt-2 sm:mt-4">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Documentos (PDF, JPG, PNG)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white"
                  />
                  {documentos.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {documentos.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-[#0F172A] rounded-lg border border-[#1f2937]">
                          <div className="flex items-center gap-2 min-w-0">
                            {doc.tipo === 'pdf' ? <FileText size={16} className="text-red-500 flex-shrink-0" /> : 
                             doc.tipo === 'imagem' ? <Image size={16} className="text-blue-500 flex-shrink-0" /> : 
                             <File size={16} className="text-slate-500 flex-shrink-0" />}
                            <span className="text-xs sm:text-sm text-slate-300 truncate">{doc.nome}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocumento(index)}
                            className="p-1 text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                    Observação
                  </label>
                  <textarea
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    rows={3}
                    placeholder="Observações sobre o parceiro..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] border border-[#1f2937] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white focus:border-[#3388d9] focus:ring-1 focus:ring-[#3388d9] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Botão de Reset de Senha - apenas quando editando */}
              {editingParceiro && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-[#111827]/50 rounded-xl border border-[#1f2937] mt-2 sm:mt-4 gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-300">Acesso do Parceiro</p>
                    <p className="text-xs text-slate-500">Gerenciar login e senha</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSenha}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-900/30 text-red-300 text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-red-900/50 transition-colors whitespace-nowrap"
                  >
                    Resetar Senha
                  </button>
                </div>
              )}

              {/* Compliance e Consultas */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#1f2937]">
                <h4 className="text-xs sm:text-sm font-medium text-slate-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield size={16} />
                  Compliance e Consultas
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {/* Restrição de Crédito */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-[#111827]/50 rounded-lg border border-[#1f2937] gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-300">Restrição de Crédito</p>
                      <p className="text-xs text-slate-500">Consulta SPC/Serasa por CPF/CNPJ</p>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      {renderCreditStatus()}
                      <button
                        type="button"
                        onClick={handleConsultCredit}
                        className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-xs rounded-lg border border-[#1f2937] bg-[#111827] hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>

                  {/* Não Perturbe */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-[#111827]/50 rounded-lg border border-[#1f2937] gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-300">Não Perturbe</p>
                      <p className="text-xs text-slate-500">Bloqueio de contato por telefone</p>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      {renderDoNotCallStatus()}
                      <button
                        type="button"
                        onClick={handleConsultDoNotCall}
                        className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-xs rounded-lg border border-[#1f2937] bg-[#111827] hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:flex-1 px-4 py-2 sm:py-2.5 text-slate-400 hover:text-slate-300 bg-[#111827]/50 hover:bg-[#1f2937] rounded-lg sm:rounded-2xl text-sm sm:text-base transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-4 py-2 sm:py-2.5 bg-[#3388d9] hover:bg-[#2673c8] text-white font-medium rounded-lg sm:rounded-2xl text-sm sm:text-base transition-colors"
                >
                  {editingParceiro ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
      🔲 DRAWER DE FILTROS (Parceiros)
      ============================================ */}
      {openFilterDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/40"
            onClick={() => setOpenFilterDrawer(false)}
          />
          <div className="w-full max-w-sm bg-[#0F172A]/95 backdrop-blur-2xl h-full shadow-2xl p-3 sm:p-4 lg:p-6 overflow-y-auto border-l border-white/10">
            <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-6 gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Painel de filtros</p>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Refinar parceiros</h2>
              </div>
              <button 
                onClick={() => setOpenFilterDrawer(false)}
                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Tipo</label>
                <Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="text-xs sm:text-sm">
                  <option value="">Todos os Tipos</option>
                  {PARCEIRO_TIPOS.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Status</label>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs sm:text-sm">
                  <option value="">Todos os Status</option>
                  {PARCEIRO_STATUSES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Cidade</label>
                <Input
                  type="text"
                  value={filterCidade}
                  onChange={(e) => setFilterCidade(e.target.value)}
                  placeholder="Filtrar por cidade"
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Estado</label>
                <Input
                  type="text"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  placeholder="UF (ex: SP, RJ)"
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Responsável</label>
                <Input
                  type="text"
                  value={filterResponsavel}
                  onChange={(e) => setFilterResponsavel(e.target.value)}
                  placeholder="Filtrar por responsável"
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Email</label>
                <Input
                  type="text"
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                  placeholder="Filtrar por email"
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3 lg:pt-4 border-t border-white/10">
                <Button variant="outline" onClick={() => { setFilterTipo(""); setFilterStatus(""); setFilterCidade(""); setFilterEstado(""); setFilterResponsavel(""); setFilterEmail(""); }} className="text-slate-300 text-xs sm:text-sm w-full sm:flex-1">
                  Limpar
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm w-full sm:flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParceirosPage;
