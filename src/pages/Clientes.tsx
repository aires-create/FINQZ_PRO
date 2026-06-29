// FINQZ PRO - Clientes Page
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, X, MessageCircle, Calendar, User, Building2, Clock, Shield, Upload } from "lucide-react";
import { clientesApi } from "../api/modules/clientes.api";
import { useLocation } from "react-router-dom";
import type { Cliente } from "../types";
import { Button, Card as DSCard, Input, Select, Badge, StatusBadge, EntityAvatar, EmptyState, LoadingState, ErrorState, KpiCard, ImportModal, ExportMenu, SegmentedControl } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { fetchAddressByCEPWithStatus, formatCEP as formatCepMasked, isValidCEPFormat } from "../data/cepService";

// Função utilitária para formatar código do cliente no padrão #C-0000
const formatClientCode = (cliente: Cliente | undefined, index: number): string => {
  if (!cliente) {
    return `#C-${String(index + 1).padStart(4, '0')}`;
  }
  
  // Prioridade: código já existente, sem cair no id técnico
  const raw = cliente?.codigo || cliente?.code || (cliente as any)?.customerCode;
  
  if (raw !== undefined && raw !== null) {
    const num = String(raw).replace(/\D/g, '');
    if (num) {
      return `#C-${num.padStart(4, '0')}`;
    }
  }
  
  // Fallback: usar índice da lista
  const fallback = index + 1;
  return `#C-${String(fallback).padStart(4, '0')}`;
};

const formatClientCodeShort = (cliente: Cliente | undefined, index: number): string => {
  const fullCode = formatClientCode(cliente, index);
  const digits = fullCode.replace(/\D/g, "");

  if (digits.length <= 4) {
    return fullCode;
  }

  return `#C-${digits.slice(-4)}`;
};

export const ClientesPage: React.FC = () => {
  const location = useLocation();
  
  const [clientes, setClientesLocal] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("search") ?? "");
  // Lista apenas - sem Kanban
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<"" | "CPF" | "CNPJ">("");
  const [cepError, setCepError] = useState<string | null>(null);
  const tipoPessoaControlRef = useRef<HTMLDivElement | null>(null);
  const cepLookupRequestRef = useRef(0);
  const cepLookupLastResolvedRef = useRef("");
  const [cepLookupStatus, setCepLookupStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");
  const [cepLookupMessage, setCepLookupMessage] = useState("");
  
  // Filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterCidade, setFilterCidade] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");

  // Histórico de alterações
  const [showHistory, setShowHistory] = useState(false);
  const [historyCliente, setHistoryCliente] = useState<Cliente | null>(null);

  // Import/Export
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [clienteHistory, setClienteHistory] = useState<Array<{
    data: number;
    campo: string;
    valorAnterior: string;
    valorNovo: string;
  }>>([]);
  const [formData, setFormData] = useState({
    nome: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    celular: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    status: "ativo" as "ativo" | "inativo" | "nao_perturbe",
    observacao: "",
    // Novos campos
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
    // Dados RD
    rdStatus: "nao_consultado" as "nao_consultado" | "sem_restricao" | "restricao",
    rdConsultedAt: "",
    rdNotes: "",
    // Dados Não Perturbe
    doNotCallStatus: "nao_consultado" as "nao_consultado" | "liberado" | "bloqueado",
    doNotCallConsultedAt: "",
  });

  const modalFieldClass =
    "w-full h-9 rounded-xl border border-[#1f2937] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#000dff] focus:outline-none focus:ring-2 focus:ring-[#000dff]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
  const modalSelectClass = `${modalFieldClass} appearance-none pr-9`;
  const modalTextareaClass =
    "w-full rounded-xl border border-[#1f2937] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#000dff] focus:outline-none focus:ring-2 focus:ring-[#000dff]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 resize-none";
  const modalCardClass = "rounded-xl border border-[#1f2937] bg-white/90 p-3 shadow-sm";
  const modalSubtleCardClass = "rounded-xl border border-dashed border-[#1f2937] bg-white/60 p-3";
  const modalSectionTitleClass = "text-sm font-medium text-slate-200 mb-2 flex items-center gap-2";

  useEffect(() => {
    loadClientes();
  }, [search]);

  useEffect(() => {
    const nextSearch = new URLSearchParams(location.search).get("search") ?? "";
    setSearch((currentSearch) =>
      currentSearch === nextSearch ? currentSearch : nextSearch,
    );
  }, [location.search]);

  useEffect(() => {
    if (!showModal) return;

    const focusTimer = window.setTimeout(() => {
      tipoPessoaControlRef.current?.querySelector<HTMLButtonElement>('button[role="radio"]')?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  const loadClientes = async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const clientesData = await clientesApi.getAll({ search });

      const normalizedClientes = clientesData.map((cliente: any) => {
        let parsedAddress: any = null;
        if (cliente?.address && typeof cliente.address === 'object') {
          parsedAddress = cliente.address;
        } else if (typeof cliente?.address === 'string') {
          try {
            parsedAddress = JSON.parse(cliente.address);
          } catch {
            parsedAddress = null;
          }
        }

      return {
        ...cliente,
        nome:
          cliente.nome ||
          [cliente.firstName, cliente.lastName].filter(Boolean).join(' ') ||
            'Cliente sem nome',
          codigo: cliente.codigo || cliente.customerCode,
          cpf_cnpj: cliente.cpf_cnpj || cliente.cpf,
          telefone: cliente.telefone || cliente.phone,
          cidade: cliente.cidade || parsedAddress?.cidade || parsedAddress?.city,
          estado: cliente.estado || parsedAddress?.estado || parsedAddress?.state || parsedAddress?.uf,
          tenant_id: cliente.tenant_id || cliente.tenantId,
          owner_id: cliente.owner_id || cliente.ownerId,
          franquia_id: cliente.franquia_id || cliente.franquiaId,
          franqueado_id: cliente.franqueado_id || cliente.franqueadoId,
          created_at: cliente.created_at || cliente.createdAt,
          updated_at: cliente.updated_at || cliente.updatedAt,
          status:
            cliente.isActive === false
              ? "inativo"
              : cliente.doNotCallStatus === "bloqueado"
                ? "nao_perturbe"
                : "ativo",
        };
      });

      setClientesLocal(normalizedClientes);
    } catch (error) {
      console.error("Error loading clientes:", error);
      setLoadError("Não foi possível carregar a lista de clientes a partir da API oficial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      void loadClientes();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadClientes();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [search]);

  // Definições para importação/exportação
  const importColumns = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'cpf_cnpj', label: 'CPF/CNPJ', required: false },
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
    { key: 'profissao', label: 'Profissão', required: false },
  ];

  const exportColumns = [
    { key: 'codigo', label: 'Código' },
    { key: 'nome', label: 'Nome' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'celular', label: 'Celular' },
    { key: 'cep', label: 'CEP' },
    { key: 'rua', label: 'Rua' },
    { key: 'numero', label: 'Número' },
    { key: 'complemento', label: 'Complemento' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado' },
    { key: 'profissao', label: 'Profissão' },
    { key: 'status', label: 'Status' },
  ];

  // Função para processar importação de clientes
  const handleImportClientes = (importData: any[]) => {
    if (!importData || importData.length === 0) {
      alert("Nenhum dado encontrado para importar.");
      return;
    }

    const now = Date.now();
    const newClientes = importData.map((row, index) => {
      // Detectar tipo de pessoa pelo documento
      const doc = onlyNumbers(row.cpf_cnpj || row.cpf || row.cnpj || "");
      const tipoPessoa = doc.length > 11 ? "PJ" : "PF";
      
      // Processar tags (pode vir como string separada por vírgula ou array)
      let tags: string[] = [];
      if (row.tags) {
        if (typeof row.tags === 'string') {
          tags = row.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        } else if (Array.isArray(row.tags)) {
          tags = row.tags;
        }
      }

      return {
        id: now + index,
        nome: row.nome || "",
        cpf_cnpj: doc || undefined,
        tipoPessoa,
        email: row.email || "",
        telefone: onlyNumbers(row.telefone || ""),
        celular: onlyNumbers(row.celular || ""),
        cep: onlyNumbers(row.cep || ""),
        rua: row.rua || "",
        numero: row.numero || "",
        complemento: row.complemento || "",
        bairro: row.bairro || "",
        cidade: row.cidade || "",
        estado: row.estado || "",
        status: "ativo",
        observacao: row.observacao || "",
        profissao: row.profissao || "",
        estado_civil: row.estado_civil || "",
        responsavel_legal: row.responsavel_legal || "",
        cpf_responsavel: row.cpf_responsavel || "",
        sexo: row.sexo || "",
        data_nascimento: row.data_nascimento || row.data_nasc || "",
        tags,
        created_at: now,
        updated_at: now,
      };
    }).filter(c => c.nome); // Filtrar clientes sem nome

    if (newClientes.length === 0) {
      alert("Nenhum cliente válido encontrado. O nome é obrigatório.");
      return;
    }

    // Adicionar ao estado
    const updatedClientes = [...safeClientes, ...newClientes];
    setClientesLocal(updatedClientes);
    
    alert(`${newClientes.length} cliente(s) importado(s) com sucesso!`);
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilterStatus("");
    setFilterTipo("");
    setFilterCidade("");
    setFilterEstado("");
    setFilterTag("");
  };

  // Função para filtrar clientes
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  
  // Depois aplica os filtros de UI
  const filteredClientes = safeClientes.filter((cliente, index) => {
    const searchTerm = (search || '').trim().toLowerCase();
    if (searchTerm) {
      const digits = searchTerm.replace(/\D/g, "");
      const searchableText = [
        cliente.nome,
        cliente.email,
        cliente.cpf_cnpj,
        cliente.telefone,
        cliente.celular,
        cliente.codigo,
        cliente.code,
        cliente.id,
        formatClientCode(cliente, index),
      ]
        .filter((value) => value !== undefined && value !== null)
        .map((value) => String(value).toLowerCase())
        .join(" ");

      const searchableDigits = [
        cliente.cpf_cnpj,
        cliente.telefone,
        cliente.celular,
        cliente.codigo,
        cliente.code,
        cliente.id,
        formatClientCode(cliente, index),
      ]
        .filter((value) => value !== undefined && value !== null)
        .map((value) => String(value).replace(/\D/g, ""))
        .join(" ");

      if (!searchableText.includes(searchTerm) && (!digits || !searchableDigits.includes(digits))) {
        return false;
      }
    }

    // Filtro por status
    if (filterStatus && cliente.status !== filterStatus) return false;
    
    // Filtro por tipo (CPF/CNPJ)
    if (filterTipo) {
      const isCNPJ = cliente.cpf_cnpj && cliente.cpf_cnpj.length > 11;
      if (filterTipo === "CPF" && isCNPJ) return false;
      if (filterTipo === "CNPJ" && !isCNPJ) return false;
    }
    
    // Filtro por cidade
    if (filterCidade && !cliente.cidade?.toLowerCase().includes(filterCidade.toLowerCase())) return false;
    
    // Filtro por estado
    if (filterEstado && cliente.estado?.toUpperCase() !== filterEstado.toUpperCase()) return false;
    
    return true;
  });

  const duplicateCliente = useMemo(() => {
    if (!tipoPessoa) return null;

    const docNumbers = onlyNumbers(formData.cpf_cnpj || "");
    const expectedLength = tipoPessoa === "CPF" ? 11 : 14;
    if (docNumbers.length !== expectedLength) return null;
    if (!validarDocumento(docNumbers, tipoPessoa)) return null;

    return safeClientes.find((cliente) => {
      if (editingCliente && String(cliente.id) === String(editingCliente.id)) {
        return false;
      }

      const candidateDoc = onlyNumbers(cliente.cpf_cnpj || cliente.cpf || "");
      if (candidateDoc.length !== expectedLength) return false;
      return candidateDoc === docNumbers;
    }) || null;
  }, [safeClientes, formData.cpf_cnpj, tipoPessoa, editingCliente]);

  // Função para validar CPF
  const validarCPF = (cpf: string): boolean => {
    if (!cpf || cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };

  // Função para validar CNPJ
  const validarCNPJ = (cnpj: string): boolean => {
    if (!cnpj || cnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    let soma = 0;
    let peso = 2;
    
    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso++;
      if (peso === 10) peso = 2;
    }
    
    let digito = soma % 11;
    if (digito < 2) digito = 0;
    else digito = 11 - digito;
    
    if (digito !== parseInt(cnpj.charAt(12))) return false;
    
    // Segundo dígito verificador
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso++;
      if (peso === 10) peso = 2;
    }
    
    digito = soma % 11;
    if (digito < 2) digito = 0;
    else digito = 11 - digito;
    
    if (digito !== parseInt(cnpj.charAt(13))) return false;
    
    return true;
  };

  // Função para validar CPF ou CNPJ
  const validarDocumento = (documento: string, tipo: "CPF" | "CNPJ"): boolean => {
    // Extrair apenas números
    const numbers = onlyNumbers(documento);
    // Se vazio, não validar (opcional)
    if (!numbers) return true;
    // Validar conforme o tipo
    if (tipo === "CPF") {
      return validarCPF(numbers);
    } else {
      return validarCNPJ(numbers);
    }
  };

  const validateCEP = (cep: string) => {
    const numbers = onlyNumbers(cep);
    if (!numbers) {
      setCepError(null);
      setCepLookupStatus("idle");
      setCepLookupMessage("");
      return;
    }

    setCepError(numbers.length === 8 ? null : "CEP deve conter 8 dígitos");
    if (numbers.length !== 8) {
      setCepLookupStatus("idle");
      setCepLookupMessage("");
    }
  };

  const lookupAddressByCEP = async (rawCep: string) => {
    const cleanCEP = onlyNumbers(rawCep);

    if (!cleanCEP) {
      setCepLookupStatus("idle");
      setCepLookupMessage("");
      return;
    }

    if (!isValidCEPFormat(cleanCEP)) {
      setCepError("CEP deve conter 8 dígitos");
      setCepLookupStatus("idle");
      setCepLookupMessage("");
      return;
    }

    if (cepLookupLastResolvedRef.current === cleanCEP) {
      return;
    }

    const requestId = ++cepLookupRequestRef.current;
    setCepError(null);
    setCepLookupStatus("loading");
    setCepLookupMessage("Buscando endereço...");

    const result = await fetchAddressByCEPWithStatus(cleanCEP);
    if (requestId !== cepLookupRequestRef.current) return;

    if (result.status === "found" && result.address) {
      setFormData((prev) => ({
        ...prev,
        cep: onlyNumbers(result.address?.cep || cleanCEP),
        rua: result.address?.street || prev.rua,
        complemento: result.address?.complement || prev.complemento,
        bairro: result.address?.neighborhood || prev.bairro,
        cidade: result.address?.city || prev.cidade,
        estado: result.address?.state || prev.estado,
      }));
      cepLookupLastResolvedRef.current = cleanCEP;
      setCepLookupStatus("found");
      setCepLookupMessage("Endereço localizado");
      return;
    }

    if (result.status === "not_found") {
      cepLookupLastResolvedRef.current = cleanCEP;
      setCepLookupStatus("not_found");
      setCepLookupMessage("CEP não encontrado");
      return;
    }

    setCepLookupStatus("error");
    setCepLookupMessage("Não foi possível consultar o CEP");
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement;
    if (
      target.tagName === "TEXTAREA" ||
      target.tagName === "BUTTON" ||
      (target as HTMLInputElement).type === "submit"
    ) {
      return;
    }

    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
      ),
    ).filter((element) => element.offsetParent !== null);

    const currentIndex = focusableElements.indexOf(target);
    if (currentIndex === -1 || currentIndex >= focusableElements.length - 1) return;

    event.preventDefault();
    focusableElements[currentIndex + 1]?.focus();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações mínimas
    if (!(formData?.nome || '').trim()) {
      alert("Nome é obrigatório");
      return;
    }
    if (!(formData?.email || '').trim()) {
      alert("E-mail é obrigatório");
      return;
    }
    if (!(formData?.celular || '').trim()) {
      alert("Celular é obrigatório");
      return;
    }
    if (!(formData?.cpf_cnpj || '').trim()) {
      alert("CPF ou CNPJ é obrigatório");
      return;
    }
    if (!tipoPessoa) {
      alert("Selecione o tipo de pessoa");
      return;
    }

    // Validar CPF ou CNPJ
    const documentoValido = validarDocumento(formData.cpf_cnpj, tipoPessoa);
    if (!documentoValido) {
      alert(tipoPessoa === "CPF" ? "CPF inválido" : "CNPJ inválido");
      return;
    }

    // Criar novo cliente com campos normalizados
    const now = Date.now();
    const newClient = {
      id: now,
      nome: (formData?.nome || '').trim(),
      cpf_cnpj: onlyNumbers(formData.cpf_cnpj || ''),
      tipoPessoa: tipoPessoa,
      email: formData.email || '',
      telefone: onlyNumbers(formData.telefone || ''),
      celular: onlyNumbers(formData.celular || ''),
      cep: onlyNumbers(formData.cep || ''),
      rua: formData.rua || '',
      numero: formData.numero || '',
      complemento: formData.complemento || '',
      bairro: formData.bairro || '',
      cidade: formData.cidade || '',
      estado: formData.estado || '',
      status: formData.status || 'ativo',
      observacao: formData.observacao || '',
      profissao: formData.profissao || '',
      estado_civil: formData.estado_civil || '',
      responsavel_legal: formData.responsavel_legal || '',
      cpf_responsavel: formData.cpf_responsavel || '',
      sexo: formData.sexo || '',
      data_nascimento: formData.data_nascimento || '',
      // Dados bancários - salvar em bankData
      bankData: {
        banco: formData.banco ?? '',
        agencia: formData.agencia ?? '',
        conta: formData.conta ?? '',
        tipoConta: formData.tipoConta ?? '',
        titular: formData.titular ?? '',
        documentoTitular: onlyNumbers(formData.documentoTitular ?? ''),
        pixTipo: formData.pixTipo ?? '',
        pixChave: formData.pixChave ?? '',
      },
      // RD
      rdStatus: formData.rdStatus || 'nao_consultado',
      rdConsultedAt: formData.rdConsultedAt || '',
      rdNotes: formData.rdNotes || '',
      // Timestamps
      created_at: now,
      updated_at: now,
    };

    try {
      // Função para obter ID seguro do cliente
      const getClientId = (client: any) => client?.id || client?._id || client?.uuid || client?.clientId;
      
      try {
        const normalizedStatus = formData?.status || 'ativo';
        const statusPayload = {
          isActive: normalizedStatus !== 'inativo',
          doNotCallStatus:
            formData.doNotCallStatus === 'bloqueado' ? 'bloqueado' : 'liberado',
        };

        const apiPayload = {
          firstName: newClient.nome?.split(' ')[0] || '',
          lastName:
            newClient.nome?.split(' ').slice(1).join(' ') || 'Não informado',
          email: formData?.email || newClient.email || '',
          cpf: onlyNumbers(formData?.cpf_cnpj || newClient.cpf_cnpj || ''),
          phone: onlyNumbers(formData?.celular || formData?.telefone || newClient.celular || newClient.telefone || ''),
          birthDate: formData?.data_nascimento || null,
          profession: formData?.profissao || null,
          maritalStatus: formData?.estado_civil || null,
          gender: formData?.sexo || null,
          documentType: tipoPessoa,
          address: {
            cep: formData?.cep || '',
            rua: formData?.rua || '',
            numero: formData?.numero || '',
            complemento: formData?.complemento || '',
            bairro: formData?.bairro || '',
            cidade: formData?.cidade || '',
            estado: formData?.estado || '',
          },
          bankData: {
            banco: formData?.banco || '',
            agencia: formData?.agencia || '',
            conta: formData?.conta || '',
            tipoConta: formData?.tipoConta || '',
            titular: formData?.titular || '',
            documentoTitular: onlyNumbers(formData?.documentoTitular || ''),
            pixTipo: formData?.pixTipo || '',
            pixChave: formData?.pixChave || '',
          },
          notes: formData?.observacao || null,
          rdStatus: formData?.rdStatus || null,
          rdConsultedAt: formData?.rdConsultedAt || null,
          rdNotes: formData?.rdNotes || null,
          doNotCallConsultedAt: formData?.doNotCallConsultedAt || null,
          ...statusPayload,
        };

        if (editingCliente) {
          await clientesApi.update(editingCliente.id, apiPayload as any);
        } else {
          await clientesApi.create(apiPayload as any);
        }

        await loadClientes();
      } catch (apiError) {
        console.error('API error saving cliente:', apiError);
        alert("Erro ao salvar cliente no servidor. Nenhuma alteração local foi aplicada.");
        return;
      }
      
      // Fechar modal e limpar
      setShowModal(false);
      setEditingCliente(null);
      setIsEditing(false);
      resetForm();
    } catch (error) {
      console.error('ERRO AO SALVAR CLIENTE:', error);
      alert("Erro ao salvar cliente. Tente novamente.");
    }
  };

  // Função para fechar modal e limpar estados
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCliente(null);
    setIsEditing(false);
    resetForm();
  };

  // Função para gerar histórico de alterações
  const generateHistory = (clienteAtual: Cliente, dadosAnteriores: any) => {
    const history: Array<{ data: number; campo: string; valorAnterior: string; valorNovo: string }> = [];
    const campos = ['nome', 'cpf_cnpj', 'email', 'celular', 'telefone', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'status'];
    
    campos.forEach(campo => {
      const valorAnterior = dadosAnteriores[campo] || '-';
      const valorNovo = (clienteAtual as any)[campo] || '-';
      
      if (valorAnterior !== valorNovo) {
        history.push({
          data: Date.now(),
          campo: campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, ' '),
          valorAnterior: String(valorAnterior),
          valorNovo: String(valorNovo),
        });
      }
    });
    
    return history;
  };

  // Função para abrir histórico do cliente
  const handleViewHistory = async (cliente: Cliente) => {
    const actionLabelMap: Record<string, string> = {
      CUSTOMER_CREATED: "Cliente criado",
      CUSTOMER_UPDATED: "Cliente atualizado",
      CUSTOMER_DELETED: "Cliente excluído",
    };

    const changedFieldLabelMap: Record<string, string> = {
      firstName: "Nome",
      lastName: "Sobrenome",
      email: "E-mail",
      phone: "Telefone",
      cpf: "CPF/CNPJ",
      birthDate: "Data de nascimento",
      isActive: "Status",
      doNotCallStatus: "Não Perturbe",
      address: "Endereço",
      bankData: "Dados bancários",
      notes: "Observações",
    };

    setHistoryCliente(cliente);
    setShowHistory(true);
    try {
      const logs = await clientesApi.getAuditLogs({
        entityId: String(cliente.id),
        limit: 20,
      });

      const mappedHistory = logs.map((log: any) => {
        const changedFields = Array.isArray(log?.metadata?.changedFields)
          ? log.metadata.changedFields
          : [];
        const translatedAction = actionLabelMap[log?.action] || "Alteração";

        let valorNovo = translatedAction;
        if (changedFields.length > 0) {
          const translatedFields = changedFields.map((field: string) => (
            changedFieldLabelMap[field] || field
          ));
          valorNovo = `Campos alterados: ${translatedFields.join(", ")}`;
        }

        return {
          data: log?.createdAt ? new Date(log.createdAt).getTime() : Date.now(),
          campo: translatedAction,
          valorAnterior: "-",
          valorNovo,
        };
      });

      setClienteHistory(mappedHistory);
    } catch (error) {
      console.error("Error loading customer audit history:", error);
      setClienteHistory([]);
    }
  };

  // Função para fechar histórico
  const handleCloseHistory = () => {
    setShowHistory(false);
    setHistoryCliente(null);
    setClienteHistory([]);
  };

  const formatHistoryDateTime = (timestamp: number) => {
    if (!timestamp || Number.isNaN(timestamp)) return "-";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "-";

    const datePart = date.toLocaleDateString("pt-BR");
    const timePart = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return `${datePart} às ${timePart}`;
  };

  // Helper: verifica se campo deve estar editável
  const isEditable = !editingCliente || isEditing;
  const isPessoaJuridica = tipoPessoa === "CNPJ";

  const resolveTipoPessoa = (cliente: any): "CPF" | "CNPJ" => {
    const explicitType = String(cliente?.documentType || cliente?.tipoPessoa || "").toUpperCase();
    if (explicitType === "CNPJ" || explicitType === "PJ") return "CNPJ";
    if (explicitType === "CPF" || explicitType === "PF") return "CPF";

    const normalizedDoc = onlyNumbers(cliente?.cpf_cnpj || cliente?.cpf || "");
    return normalizedDoc.length > 11 ? "CNPJ" : "CPF";
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    const address = (cliente.address || {}) as any;
    const bankData = (cliente.bankData || {}) as any;
    const nextTipoPessoa = resolveTipoPessoa(cliente);
    const normalizedNome =
      cliente.nome ||
      [cliente.firstName, cliente.lastName].filter(Boolean).join(' ') ||
      '';
    const normalizedDoc = onlyNumbers(
      cliente.cpf_cnpj || cliente.cpf || ''
    );
    const normalizedPhone = onlyNumbers(
      cliente.celular || cliente.telefone || cliente.phone || ''
    );
    setTipoPessoa(nextTipoPessoa);
    // Formatar CPF/CNPJ para exibição ao editar
    const formattedDoc = nextTipoPessoa === "CNPJ"
      ? formatCNPJInput(normalizedDoc)
      : formatCPFInput(normalizedDoc);
    setFormData({
      nome: normalizedNome,
      cpf_cnpj: formattedDoc,
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      celular: normalizedPhone,
      cep: address.cep || cliente.cep || "",
      rua: address.rua || cliente.rua || "",
      numero: address.numero || cliente.numero || "",
      complemento: address.complemento || cliente.complemento || "",
      bairro: address.bairro || cliente.bairro || "",
      cidade: address.cidade || cliente.cidade || "",
      estado: address.estado || cliente.estado || "",
      status: cliente.status === "nao_perturbe" ? "inativo" : (cliente.status || "ativo"),
      observacao: cliente.notes || cliente.observacao || "",
      // Novos campos
      profissao: cliente.profession || cliente.profissao || "",
      estado_civil: cliente.maritalStatus || cliente.estado_civil || "",
      responsavel_legal: cliente.responsavel_legal || "",
      cpf_responsavel: cliente.cpf_responsavel || "",
      sexo: cliente.gender || cliente.sexo || "",
      data_nascimento:
        cliente.data_nascimento ||
        (cliente.birthDate ? String(cliente.birthDate).slice(0, 10) : ""),
      // Dados Bancários - ler de bankData ou diretamente (compatibilidade com dados antigos)
      banco: bankData.banco ?? cliente.banco ?? "",
      agencia: bankData.agencia ?? cliente.agencia ?? "",
      conta: bankData.conta ?? cliente.conta ?? "",
      tipoConta: bankData.tipoConta ?? cliente.tipoConta ?? "",
      titular: bankData.titular ?? cliente.titular ?? "",
      documentoTitular: bankData.documentoTitular ?? cliente.documentoTitular ?? "",
      pixTipo: bankData.pixTipo ?? cliente.pixTipo ?? "",
      pixChave: bankData.pixChave ?? cliente.pixChave ?? "",
      // Dados RD
      rdStatus: cliente.rdStatus ?? "nao_consultado",
      rdConsultedAt: cliente.rdConsultedAt ?? "",
      rdNotes: cliente.rdNotes ?? "",
      doNotCallStatus: cliente.doNotCallStatus ?? "nao_consultado",
      doNotCallConsultedAt: cliente.doNotCallConsultedAt ?? "",
    });
    setCepError(null);
    setCepLookupStatus("idle");
    setCepLookupMessage("");
    cepLookupRequestRef.current = 0;
    cepLookupLastResolvedRef.current = "";
    setIsEditing(false); // Modo visualização
    setShowModal(true);
  };

  // Função para abrir modal de novo cliente
  const handleNewCliente = () => {
    resetForm();
    setEditingCliente(null);
    setTipoPessoa("");
    setCepError(null);
    setCepLookupStatus("idle");
    setCepLookupMessage("");
    cepLookupRequestRef.current = 0;
    cepLookupLastResolvedRef.current = "";
    setIsEditing(true); // Novo cliente já em modo de edição
    setShowModal(true);
  };

  const handleDelete = async (id: string | number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await clientesApi.delete(id);
        await loadClientes();
      } catch (apiError) {
        console.error('API error deleting cliente:', apiError);
        alert("Erro ao excluir cliente no servidor. Nenhuma alteração local foi aplicada.");
        return;
      }
    }
  };

  const handleToggleStatus = async (cliente: Cliente) => {
    try {
      // Ciclo: ativo → nao_perturbe → inativo → ativo
      const currentStatus = cliente.status || "ativo";
      let newStatus: "ativo" | "inativo" | "nao_perturbe";
      
      if (currentStatus === "ativo") {
        newStatus = "nao_perturbe";
      } else if (currentStatus === "nao_perturbe") {
        newStatus = "inativo";
      } else {
        newStatus = "ativo";
      }

      const statusPayload = {
        isActive: newStatus !== "inativo",
        doNotCallStatus: newStatus === "nao_perturbe" ? "bloqueado" : "liberado",
      };
      
      try {
        await clientesApi.update(cliente.id, {
          firstName: cliente.firstName || cliente.nome?.split(' ')[0] || '',
          lastName:
            cliente.lastName ||
            cliente.nome?.split(' ').slice(1).join(' ') ||
            'Não informado',
          email: cliente.email || '',
          cpf: onlyNumbers(cliente.cpf_cnpj || cliente.cpf || ''),
          phone: onlyNumbers(cliente.celular || cliente.telefone || cliente.phone || ''),
          ...statusPayload,
        } as any);
        await loadClientes();
      } catch (apiError) {
        console.error("API error updating cliente status:", apiError);
        alert("Erro ao atualizar status no servidor. Nenhuma alteração local foi aplicada.");
        return;
      }
    } catch (error) {
      console.error("Error toggling cliente status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf_cnpj: "",
      email: "",
      telefone: "",
      celular: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      status: "ativo",
      observacao: "",
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
      rdStatus: "nao_consultado",
      rdConsultedAt: "",
      rdNotes: "",
      doNotCallStatus: "nao_consultado",
      doNotCallConsultedAt: "",
    });
    setCepError(null);
    setCepLookupStatus("idle");
    setCepLookupMessage("");
    cepLookupRequestRef.current = 0;
    cepLookupLastResolvedRef.current = "";
    setIsEditing(false);
  };

  // Função para formatar CPF
  const formatCPF = (cpf: string) => {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Função para detectar se é CPF ou CNPJ
  const isCNPJ = (cpfCnpj: string) => {
    return cpfCnpj && cpfCnpj.length > 11;
  };

  // Função segura para obter apenas números
  const onlyNumbers = (value: any) => String(value || '').replace(/\D/g, '');

  // Função segura para formatar CPF/CNPJ
  const formatDocument = (value: any, personType?: string) => {
    const numbers = onlyNumbers(value);
    if (!numbers) return 'Não informado';

    if (personType === 'PJ' || numbers.length > 11) {
      // CNPJ
      return numbers
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    // CPF
    return numbers
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
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

  // Função para formatar celular brasileiro (exibição)
  const formatCell = (cell: string) => {
    if (!cell) return "";
    const numbers = cell.replace(/\D/g, "");
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers;
  };

  // Função helper para obter contato do cliente com fallbacks
  const getClienteContato = (cliente: any) => {
    // Prioridade 1: celular
    const celular = cliente?.celular ?? cliente?.phone ?? cliente?.mobile ?? cliente?.whatsapp ?? "";
    // Prioridade 2: telefone
    const telefone = cliente?.telefone ?? cliente?.phone ?? cliente?.contactPhone ?? "";
    // Prioridade 3: email
    const email = cliente?.email ?? "";
    
    return { celular, telefone, email };
  };

  // Função para formatar CNPJ com máscara ao digitar
  const formatCNPJInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Função para formatar CPF com máscara ao digitar
  const formatCPFInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  };

  // Função para formatar data
  // Função segura para formatar data
  const formatSafeDate = (value: any) => {
    if (!value) return 'Não informado';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Não informado';
    return date.toLocaleDateString('pt-BR');
  };

  const exportClientesData = useMemo(() => (
    filteredClientes.map((cliente, index) => ({
      codigo: formatClientCode(cliente, index),
      nome: cliente.nome || "",
      tipo: isCNPJ(cliente.cpf_cnpj || "") ? "Pessoa Jurídica" : "Pessoa Física",
      cpf_cnpj: cliente.cpf_cnpj || "",
      email: cliente.email || "",
      telefone: formatPhone(cliente.telefone),
      celular: formatPhone(cliente.celular),
      cep: cliente.cep || "",
      rua: cliente.rua || "",
      numero: cliente.numero || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      status: cliente.status === "ativo" ? "Ativo" : cliente.status === "inativo" ? "Inativo" : "Não Perturbe",
      profissao: cliente.profissao || "",
      estado_civil: cliente.estado_civil || "",
      observacao: cliente.observacao || "",
    }))
  ), [filteredClientes]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        onSearch={setSearch}
        onRefresh={loadClientes}
        onCreate={handleNewCliente}
        createLabel="Novo Cliente"
        // Ativar FilterDrawer (padrão premium)
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={[
          { label: 'Tipo', key: 'tipo', type: 'select', options: [
            { label: 'Pessoa Física', value: 'PF' },
            { label: 'Pessoa Jurídica', value: 'PJ' }
          ], placeholder: 'Todos os tipos' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' }
          ], placeholder: 'Todos os status' },
          { label: 'Cidade', key: 'cidade', type: 'text', placeholder: 'Cidade' },
          { label: 'Estado', key: 'estado', type: 'text', placeholder: 'Estado (UF)' },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'tipo') setFilterTipo(value)
          if (key === 'status') setFilterStatus(value)
          if (key === 'cidade') setFilterCidade(value)
          if (key === 'estado') setFilterEstado(value)
        }}
        extra={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Importação em implantação"
              className="flex items-center gap-1"
            >
              <Upload size={14} />
              Importar
            </Button>
            <ExportMenu
              data={exportClientesData}
              columns={exportColumns}
              filename="clientes"
              label="Exportar"
            />
          </div>
        }
      />

      {/* Stats Cards - Design System KpiCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <KpiCard
          label="Total de Clientes"
          value={clientes.length}
          icon={<User size={18} />}
          variant="gray"
        />
        <KpiCard
          label="Pessoas Físicas"
          value={clientes.filter(c => !isCNPJ(c.cpf_cnpj || "")).length}
          icon={<User size={18} />}
          variant="blue"
        />
        <KpiCard
          label="Pessoas Jurídicas"
          value={clientes.filter(c => isCNPJ(c.cpf_cnpj || "")).length}
          icon={<Building2 size={18} />}
          variant="green"
        />
        <KpiCard
          label="Novos este Mês"
          value={clientes.filter(c => {
            const now = new Date();
            const created = new Date(c.created_at);
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }).length}
          icon={<Calendar size={18} />}
          variant="orange"
        />
      </div>

      {/* Table */}
      <div className="table-container mt-5 overflow-hidden">
        {loading ? (
          <LoadingState text="Carregando clientes..." />
        ) : loadError ? (
          <ErrorState
            title="Falha ao carregar clientes"
            message={loadError}
            action={{
              label: "Tentar novamente",
              onClick: () => {
                void loadClientes();
              },
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">ID/Código</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">Cliente</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">Tipo</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">CPF/CNPJ</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">Contato</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">Localização</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">Criado em</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente, index) => (
                  <tr key={cliente.id} className="border-b border-[var(--border-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="px-3 py-2.5 align-middle text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      <span
                        className="text-sm font-medium font-mono tabular-nums text-[var(--text-primary)]"
                        title={formatClientCode(cliente, index)}
                      >
                        {formatClientCodeShort(cliente, index)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <EntityAvatar name={cliente.nome} type="cliente" size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{cliente.nome}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{cliente.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-sm text-[var(--text-secondary)]">
                      {isCNPJ(cliente.cpf_cnpj || "") ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" title="Pessoa Jurídica">
                          <Building2 size={18} />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300" title="Pessoa Física">
                          <User size={18} />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-sm font-mono text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDocument(cliente?.cpf_cnpj, cliente?.personType)}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-sm text-[var(--text-secondary)]">
                      {(() => {
                        const { celular, telefone, email } = getClienteContato(cliente);
                        if (!celular && !telefone && !email) {
                          return <span className="text-slate-400">-</span>;
                        }
                        return (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm leading-none text-[var(--text-secondary)]">
                              {formatPhone(celular || telefone)}
                            </span>

                            {celular || telefone ? (
                              <a
                                href={`tel:${celular || telefone}`}
                                className="inline-flex w-7 h-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-900/20 transition-colors"
                                title="Ligar"
                              >
                                <Phone size={16} />
                              </a>
                            ) : null}

                            {celular ? (
                              <a
                                href={`https://wa.me/55${celular}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-7 h-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-900/20 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </a>
                            ) : null}

                            {email ? (
                              <a
                                href={`mailto:${email}`}
                                className="inline-flex w-7 h-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-900/20 transition-colors"
                                title={email}
                              >
                                <Mail size={16} />
                              </a>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 align-middle text-sm text-[var(--text-secondary)] max-w-[150px] truncate">
                      {cliente.cidade && cliente.estado
                        ? `${cliente.cidade}/${cliente.estado}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-sm text-[var(--text-secondary)]">
                      {formatSafeDate(cliente?.created_at)}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(cliente)}
                          className={`inline-flex h-8 min-w-[88px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium transition-colors ${
                            cliente.status === "ativo" 
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15" 
                              : cliente.status === "nao_perturbe"
                              ? "border-amber-500/25 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15"
                              : "border-red-500/25 bg-red-500/10 text-red-600 hover:bg-red-500/15"
                          }`}
                          title={cliente.status === "ativo" ? "Ativo - Clique para mudar" : cliente.status === "nao_perturbe" ? "Não Perturbe - Clique para mudar" : "Inativo - Clique para mudar"}
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            cliente.status === "ativo" 
                              ? "bg-emerald-500" 
                              : cliente.status === "nao_perturbe"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}></span>
                          <span>{cliente.status === "ativo" ? "Ativo" : cliente.status === "nao_perturbe" ? "Não perturbe" : "Inativo"}</span>
                        </button>
                        <button
                          onClick={() => handleViewHistory(cliente)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                          title="Histórico"
                        >
                          <Clock size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#000dff]/80 hover:text-[#000dff] hover:bg-[#000dff]/10 transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500/80 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                          title="Excluir"
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
        )}
        {!loading && filteredClientes.length === 0 && (
          <EmptyState
            icon={<User size={48} />}
            title="Nenhum cliente encontrado"
            description={
              filterStatus || filterTipo || filterCidade || filterEstado
                ? "Tente ajustar os filtros para encontrar mais clientes"
                : "Comece adicionando seu primeiro cliente"
            }
            action={!filterStatus && !filterTipo && !filterCidade && !filterEstado ? {
              label: "Novo Cliente",
              onClick: handleNewCliente
            } : undefined}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-2xl w-full max-w-[950px] max-h-[86vh] overflow-hidden shadow-xl flex flex-col">
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1f2937] flex-none">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                </h3>
                <p className="text-sm text-slate-500">
                  {editingCliente
                    ? "Atualize as informações cadastrais."
                    : "Cadastre um cliente Pessoa Física ou Pessoa Jurídica."}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-[#000dff] hover:text-slate-300 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {/* Dados Pessoais */}
              <div>
                <h4 className={modalSectionTitleClass}>
                  <User size={16} />
                  Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div ref={tipoPessoaControlRef} className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Tipo de Pessoa
                    </label>
                    <SegmentedControl
                      name="tipoPessoa"
                      aria-label="Tipo de Pessoa"
                      value={tipoPessoa}
                      onChange={(nextValue) => setTipoPessoa(nextValue as "" | "CPF" | "CNPJ")}
                      disabled={!isEditable}
                      options={[
                        { value: "CPF", label: "Pessoa Física", icon: <User size={16} /> },
                        { value: "CNPJ", label: "Pessoa Jurídica", icon: <Building2 size={16} /> },
                      ]}
                    />
                  </div>

                  {tipoPessoa === "CPF" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">CPF</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.cpf_cnpj}
                          onChange={(e) => setFormData({ ...formData, cpf_cnpj: formatCPFInput(e.target.value) })}
                          className={modalFieldClass}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                        {duplicateCliente && (
                          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                            <p className="font-medium">
                              Cliente já cadastrado: {duplicateCliente.nome || "Cliente sem nome"}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleEdit(duplicateCliente)}
                              className="mt-1 inline-flex items-center text-[11px] font-medium text-amber-700 underline decoration-amber-500/60 underline-offset-2 hover:text-amber-800"
                            >
                              Editar cadastro existente
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditable}
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Data de Nascimento</label>
                        <input
                          type="date"
                          disabled={!isEditable}
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                          className={modalFieldClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Sexo</label>
                        <select
                          disabled={!isEditable}
                          value={formData.sexo}
                          onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                          className={modalSelectClass}
                        >
                          <option value="">Selecione...</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                          <option value="nao_informar">Prefiro não informar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Estado Civil</label>
                        <select
                          disabled={!isEditable}
                          value={formData.estado_civil}
                          onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                          className={modalSelectClass}
                        >
                          <option value="">Selecione...</option>
                          <option value="solteiro">Solteiro</option>
                          <option value="casado">Casado</option>
                          <option value="divorciado">Divorciado</option>
                          <option value="viuvo">Viúvo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Profissão</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.profissao}
                          onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Profissão"
                        />
                      </div>
                    </>
                  )}

                  {tipoPessoa === "CNPJ" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">CNPJ</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.cpf_cnpj}
                          onChange={(e) => setFormData({ ...formData, cpf_cnpj: formatCNPJInput(e.target.value) })}
                          className={modalFieldClass}
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                        {duplicateCliente && (
                          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                            <p className="font-medium">
                              Cliente já cadastrado: {duplicateCliente.nome || "Cliente sem nome"}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleEdit(duplicateCliente)}
                              className="mt-1 inline-flex items-center text-[11px] font-medium text-amber-700 underline decoration-amber-500/60 underline-offset-2 hover:text-amber-800"
                            >
                              Editar cadastro existente
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Razão Social</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditable}
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Razão social"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Data de Abertura</label>
                        <input
                          type="date"
                          disabled={!isEditable}
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                          className={modalFieldClass}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contato */}
              <div>
                <h4 className={modalSectionTitleClass}>
                  <Phone size={16} />
                  Informações de Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Celular *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditable}
                      value={formatCell(formData.celular)}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, celular: numbers.slice(0, 11) });
                      }}
                      onBlur={(e) => {
                        // Garantir que salvamos apenas números
                        const numbers = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, celular: numbers });
                      }}
                      className={modalFieldClass}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  {tipoPessoa === "CNPJ" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Telefone Comercial
                      </label>
                      <input
                        type="text"
                        disabled={!isEditable}
                        value={formatPhone(formData.telefone)}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, "");
                          setFormData({ ...formData, telefone: numbers.slice(0, 11) });
                        }}
                      onBlur={(e) => {
                        const numbers = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, telefone: numbers });
                      }}
                        className={modalFieldClass}
                        placeholder="(00) 0000-0000"
                        maxLength={14}
                      />
                    </div>
                  )}
                  <div className={tipoPessoa === "CNPJ" ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      disabled={!isEditable}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={modalFieldClass}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className={modalCardClass}>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Não Perturbe
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.doNotCallStatus === "bloqueado"}
                          disabled={!isEditable}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              doNotCallStatus: e.target.checked ? "bloqueado" : "liberado",
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                        />
                        <span className="text-sm text-slate-700">Bloquear contato</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h4 className={modalSectionTitleClass}>
                  <MapPin size={16} />
                  Endereço
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formatCepMasked(formData.cep)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                        setFormData({ ...formData, cep: digits });
                        if (cepError) setCepError(null);
                        if (cepLookupStatus !== "idle") {
                          setCepLookupStatus("idle");
                          setCepLookupMessage("");
                        }
                      }}
                      onBlur={(e) => {
                        validateCEP(e.target.value);
                        void lookupAddressByCEP(e.target.value);
                      }}
                      className={modalFieldClass}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {cepError && (
                      <p className="mt-1 text-xs text-rose-500">{cepError}</p>
                    )}
                    {!cepError && cepLookupMessage && (
                      <p
                        className={`mt-1 text-xs ${
                          cepLookupStatus === "found"
                            ? "text-emerald-600"
                            : cepLookupStatus === "loading"
                              ? "text-slate-500"
                              : cepLookupStatus === "not_found"
                                ? "text-amber-600"
                                : "text-rose-500"
                        }`}
                        aria-live="polite"
                      >
                        {cepLookupMessage}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Rua
                    </label>
                    <input
                      type="text"
                      value={formData.rua}
                      onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      className={modalFieldClass}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className={modalFieldClass}
                      placeholder="Nº"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      className={modalFieldClass}
                      placeholder="Apto, sala, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className={modalFieldClass}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className={modalFieldClass}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      UF
                    </label>
                    <input
                      type="text"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className={modalFieldClass}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              <div>
                <h4 className={modalSectionTitleClass}>
                  <Building2 size={16} />
                  Dados Bancários
                </h4>
                <div className="space-y-2.5">
                  <div className={modalCardClass}>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2.5">
                      Conta Bancária
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Banco</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.banco}
                          onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Nome do banco"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Agência</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.agencia}
                          onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Agência"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Conta</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.conta}
                          onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Conta"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Conta</label>
                        <select
                          disabled={!isEditable}
                          value={formData.tipoConta}
                          onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value as any })}
                          className={modalSelectClass}
                        >
                          <option value="">Selecione...</option>
                          <option value="corrente">Corrente</option>
                          <option value="poupanca">Poupança</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Titular</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.titular}
                          onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Nome do titular"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">CPF/CNPJ do Titular</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.documentoTitular}
                          onChange={(e) => setFormData({ ...formData, documentoTitular: e.target.value.replace(/\D/g, "") })}
                          className={modalFieldClass}
                          placeholder="CPF ou CNPJ do titular"
                          maxLength={14}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={modalCardClass}>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2.5">
                      PIX
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Chave PIX</label>
                        <select
                          disabled={!isEditable}
                          value={formData.pixTipo}
                          onChange={(e) => setFormData({ ...formData, pixTipo: e.target.value as any })}
                          className={modalSelectClass}
                        >
                          <option value="">Selecione...</option>
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="email">Email</option>
                          <option value="telefone">Telefone</option>
                          <option value="aleatoria">Chave Aleatória</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Chave PIX</label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={formData.pixChave}
                          onChange={(e) => setFormData({ ...formData, pixChave: e.target.value })}
                          className={modalFieldClass}
                          placeholder="Chave PIX"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status e Observações */}
              <div>
                <h4 className={modalSectionTitleClass}>
                  <Edit size={16} />
                  Informações Adicionais
                </h4>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className={modalCardClass}>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2.5">
                        Status
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="ativo"
                            checked={formData.status === "ativo"}
                            disabled={!isEditable}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as "ativo" | "inativo" })}
                            className="w-4 h-4 text-[#000dff] bg-[#111827] border-gray-300 focus:ring-[#000dff] disabled:opacity-50"
                          />
                          <span className="text-slate-700">Ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="inativo"
                            checked={formData.status === "inativo"}
                            disabled={!isEditable}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as "ativo" | "inativo" })}
                            className="w-4 h-4 text-[#000dff] bg-[#111827] border-gray-300 focus:ring-[#000dff] disabled:opacity-50"
                          />
                          <span className="text-rose-600">Inativo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label className="block text-sm font-medium text-slate-300">
                        Observações
                      </label>
                      <span className="text-xs text-slate-500">{formData.observacao.length}/500</span>
                    </div>
                    <textarea
                      value={formData.observacao}
                      maxLength={500}
                      onChange={(e) => setFormData({ ...formData, observacao: e.target.value.slice(0, 500) })}
                      className={modalTextareaClass}
                      placeholder="Observações sobre o cliente..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Compliance e Consultas */}
              <div className="pt-3 border-t border-[#1f2937]">
                <h4 className={modalSectionTitleClass}>
                  <Shield size={16} />
                  Compliance
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className={modalCardClass}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Restrição de Crédito</p>
                    {renderCreditStatus()}
                  </div>
                  <div className={modalCardClass}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Não Perturbe</p>
                    {renderDoNotCallStatus()}
                  </div>
                  <div className={modalSubtleCardClass}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Receita Federal</p>
                    <p className="text-xs text-slate-500">Futuro</p>
                  </div>
                  <div className={modalSubtleCardClass}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">GOV.BR</p>
                    <p className="text-xs text-slate-500">Futuro</p>
                  </div>
                  <div className={modalSubtleCardClass}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">LGPD</p>
                    <p className="text-xs text-slate-500">Disponivel futuramente</p>
                  </div>
                  <div className={modalSubtleCardClass}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Cadastro Positivo</p>
                    <p className="text-xs text-slate-500">Roadmap</p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f2937] flex-none">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 h-9 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                {editingCliente && !isEditing ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="px-4 h-9 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 h-9 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors"
                  >
                    {editingCliente ? "Salvar Alterações" : "Cadastrar Cliente"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistory && historyCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1f2937]">
              <div>
                <h3 className="text-lg font-semibold text-white">Histórico de Alterações</h3>
                <p className="text-sm text-slate-500">{historyCliente.nome}</p>
              </div>
              <button
                onClick={handleCloseHistory}
                className="p-2 text-[#000dff] hover:text-slate-600 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {clienteHistory.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <svg size={48} className="mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p>Nenhuma alteração registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clienteHistory.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <svg size={18} className="text-[#000dff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{item.campo}</h4>
                          <span className="text-xs text-slate-500">{formatHistoryDateTime(item.data)}</span>
                        </div>
                        <div className="mt-2 text-sm">
                          <p className="text-slate-500">
                            <span className="text-red-500 line-through">{item.valorAnterior || '-'}</span>
                            <span className="mx-2">→</span>
                            <span className="text-green-600 font-medium">{item.valorNovo}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#1f2937] bg-gray-50">
              <button
                onClick={handleCloseHistory}
                className="w-full px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
      🔲 DRAWER DE FILTROS (Clientes)
      ============================================ */}
      {openFilterDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/40"
            onClick={() => setOpenFilterDrawer(false)}
          />
          <div className="w-[420px] bg-[#111827] h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Filtros</h2>
              <button 
                onClick={() => setOpenFilterDrawer(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Status</label>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="nao_perturbe">Não Perturbe</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Tipo</label>
                <Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="CPF">Pessoa Física</option>
                  <option value="CNPJ">Pessoa Jurídica</option>
                </Select>
              </div>
              <div>
                <Input
                  type="text"
                  value={filterCidade}
                  onChange={(e) => setFilterCidade(e.target.value)}
                  placeholder="Filtrar por cidade..."
                  label="Cidade"
                />
              </div>
              <div>
                <Input
                  type="text"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  placeholder="Ex: SP, RJ, MG..."
                  maxLength={2}
                  label="Estado (UF)"
                />
              </div>
              <div className="flex justify-between pt-4 border-t border-[#1f2937]">
                <Button variant="ghost" onClick={clearFilters}>
                  Limpar
                </Button>
                <Button onClick={() => setOpenFilterDrawer(false)}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importação */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportClientes}
        columns={importColumns}
        title="Importar Clientes"
        description="Importe clientes a partir de um arquivo CSV. Campo obrigatório: nome."
        acceptedTypes={['.csv']}
      />
    </div>
  );
};

export default ClientesPage;
