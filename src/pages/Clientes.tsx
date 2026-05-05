// FINQZ PRO - Clientes Page
import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, X, MessageCircle, Calendar, User, Building2, Download, Clock, Shield } from "lucide-react";
import api from "../api/client";
import useAppStore from "../store";
import type { Cliente } from "../types";
import { Button, Card as DSCard, Input, Select, Badge, StatusBadge, EntityAvatar, EmptyState, LoadingState, KpiCard } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { USE_MOCKS } from "../config/environment";
import { useTenantFilter } from "../hooks/useTenantFilter";

// Chave para persistência no localStorage
const CLIENTS_STORAGE_KEY = 'finqz_pro_clients';

// Seed inicial de clientes
const initialClientesSeed: Cliente[] = [
  { id: 1, nome: "João Silva", codigo: "CLI-001", cpf_cnpj: "12345678901", email: "joao@email.com", telefone: "11999999999", status: "ativo", created_at: Date.now(), updated_at: Date.now() },
  { id: 2, nome: "Maria Santos", codigo: "CLI-002", cpf_cnpj: "23456789012", email: "maria@email.com", telefone: "11988888888", status: "nao_perturbe", created_at: Date.now(), updated_at: Date.now() },
  { id: 3, nome: "Pedro Costa", cpf_cnpj: "34567890123", email: "pedro@email.com", telefone: "11977777777", status: "inativo", created_at: Date.now(), updated_at: Date.now() },
  { id: 4, nome: "Ana Oliveira", code: "AOL-2024", cpf_cnpj: "45678901234", email: "ana@email.com", telefone: "11966666666", status: "ativo", created_at: Date.now(), updated_at: Date.now() },
  { id: 5, nome: "Carlos Lima", cpf_cnpj: "56789012345", email: "carlos@email.com", telefone: "11955555555", status: "ativo", created_at: Date.now(), updated_at: Date.now() },
];

// Função utilitária para formatar código do cliente no padrão #C-0000
const formatClientCode = (cliente: Cliente | undefined, index: number): string => {
  if (!cliente) {
    return `#C-${String(index + 1).padStart(4, '0')}`;
  }
  
  // Prioridade 1: código já existente
  const raw = cliente?.codigo || cliente?.code || cliente?.id;
  
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

// Função para carregar clientes do localStorage
const loadClientsFromStorage = (): Cliente[] => {
  try {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) ? parsed : initialClientesSeed;
  } catch {
    return initialClientesSeed;
  }
};

export const ClientesPage: React.FC = () => {
  const { clientes: storeClientes, setClientes } = useAppStore();
  
  // Inicializar clientes do localStorage
  const [clientes, setClientesLocal] = useState<Cliente[]>(loadClientsFromStorage);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Lista apenas - sem Kanban
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<"CPF" | "CNPJ">("CPF");
  const [cepLoading, setCepLoading] = useState(false);
  
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

  useEffect(() => {
    loadClientes();
  }, [search]);

  // Persistir clientes no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clientes || []));
    } catch (error) {
      console.error('Erro ao persistir clientes:', error);
    }
  }, [clientes]);

  const loadClientes = async () => {
    // Em modo de produção (USE_MOCKS=false), tenta API primeiro
    if (!USE_MOCKS) {
      try {
        setLoading(true);
        const data = await api.getClientes(search);
        setClientesLocal(data.clientes);
        setClientes(data.clientes);
      } catch (error) {
        console.error("Error loading clientes from API:", error);
        // Fallback para localStorage apenas se API falhar
        const savedClients = loadClientsFromStorage();
        if (savedClients && savedClients.length > 0) {
          setClientesLocal(savedClients);
          setClientes(savedClients);
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Modo de desenvolvimento (USE_MOCKS=true): usa localStorage
    const savedClients = loadClientsFromStorage();
    if (savedClients && savedClients.length > 0) {
      setClientesLocal(savedClients);
      setClientes(savedClients);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await api.getClientes(search);
      setClientesLocal(data.clientes);
      setClientes(data.clientes);
    } catch (error) {
      console.error("Error loading clientes:", error);
    } finally {
      setLoading(false);
    }
  };

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
    setClientes(updatedClientes as any);
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
  // APLICAR FILTRAGEM DE TENANT PRIMEIRO (segurança multi-tenant)
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const tenantFilteredClientes = useTenantFilter(safeClientes);
  
  // Depois aplica os filtros de UI
  const filteredClientes = tenantFilteredClientes.filter((cliente) => {
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

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCEP = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, "").length !== 8) return;
    
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData({
          ...formData,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
          complemento: data.complemento || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setCepLoading(false);
    }
  };

  // Funções de Consulta de Compliance
  const handleConsultCredit = () => {
    const doc = formData.cpf_cnpj?.replace(/\D/g, '');
    if (!doc || doc.length < 11) {
      alert('CPF/CNPJ inválido para consulta');
      return;
    }
    
    // Simulação de consulta (em produção, chamaria API)
    const hasRestriction = Math.random() > 0.7; // 30% de chance de restrição
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
    
    // Simulação de consulta (em produção, chamaria API)
    const isBlocked = Math.random() > 0.8; // 20% de chance de bloqueio
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
      nao_consultado: { color: 'text-gray-500', bg: 'bg-gray-400', label: 'Não consultado' },
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
      nao_consultado: { color: 'text-gray-500', bg: 'bg-gray-400', label: 'Não consultado' },
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
    if (!formData.nome?.trim()) {
      alert("Nome é obrigatório");
      return;
    }
    if (!formData.celular?.trim()) {
      alert("Celular é obrigatório");
      return;
    }
    if (!formData.cpf_cnpj?.trim()) {
      alert("CPF ou CNPJ é obrigatório");
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
      nome: formData.nome?.trim() || '',
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
      
      let updatedClientes;
      
      if (editingCliente) {
        // Editando - atualizar cliente existente
        const editingId = getClientId(editingCliente);
        updatedClientes = safeClientes.map(client => {
          const clientId = getClientId(client);
          if (clientId === editingId) {
            return {
              ...client,
              ...newClient,
              id: clientId,
              created_at: client?.created_at || newClient.created_at,
              updated_at: Date.now(),
            };
          }
          return client;
        });
      } else {
        // Novo cliente - adicionar à lista
        updatedClientes = [...safeClientes, newClient];
      }
      
      setClientes(updatedClientes);
      setClientesLocal(updatedClientes);
      
      // Tentar salvar na API em background
      try {
        if (editingCliente) {
          await api.updateCliente(editingCliente.id, newClient);
        } else {
          await api.createCliente(newClient);
        }
      } catch (apiError) {
        console.error('API error (cliente salvo localmente):', apiError);
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
  const handleViewHistory = (cliente: Cliente) => {
    setHistoryCliente(cliente);
    // Simular histórico baseado nos dados do cliente (em produção, viria do backend)
    const mockHistory = [
      { data: cliente.created_at, campo: 'Criação', valorAnterior: '-', valorNovo: 'Cliente cadastrado' },
    ];
    setClienteHistory(mockHistory);
    setShowHistory(true);
  };

  // Função para fechar histórico
  const handleCloseHistory = () => {
    setShowHistory(false);
    setHistoryCliente(null);
    setClienteHistory([]);
  };

  // Helper: verifica se campo deve estar editável
  const isEditable = !editingCliente || isEditing;

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    // Detectar tipo de pessoa
    const isCNPJ = cliente.cpf_cnpj && cliente.cpf_cnpj.length > 11;
    setTipoPessoa(isCNPJ ? "CNPJ" : "CPF");
    // Formatar CPF/CNPJ para exibição ao editar
    const formattedDoc = isCNPJ 
      ? formatCNPJInput(cliente.cpf_cnpj || "")
      : formatCPFInput(cliente.cpf_cnpj || "");
    setFormData({
      nome: cliente.nome,
      cpf_cnpj: formattedDoc,
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      celular: cliente.celular || "",
      cep: cliente.cep || "",
      rua: cliente.rua || "",
      numero: cliente.numero || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      status: cliente.status || "ativo",
      observacao: cliente.observacao || "",
      // Novos campos
      profissao: cliente.profissao || "",
      estado_civil: cliente.estado_civil || "",
      responsavel_legal: cliente.responsavel_legal || "",
      cpf_responsavel: cliente.cpf_responsavel || "",
      sexo: cliente.sexo || "",
      data_nascimento: cliente.data_nascimento || "",
      // Dados Bancários - ler de bankData ou diretamente (compatibilidade com dados antigos)
      banco: cliente.bankData?.banco ?? cliente.banco ?? "",
      agencia: cliente.bankData?.agencia ?? cliente.agencia ?? "",
      conta: cliente.bankData?.conta ?? cliente.conta ?? "",
      tipoConta: cliente.bankData?.tipoConta ?? cliente.tipoConta ?? "",
      titular: cliente.bankData?.titular ?? cliente.titular ?? "",
      documentoTitular: cliente.bankData?.documentoTitular ?? cliente.documentoTitular ?? "",
      pixTipo: cliente.bankData?.pixTipo ?? cliente.pixTipo ?? "",
      pixChave: cliente.bankData?.pixChave ?? cliente.pixChave ?? "",
      // Dados RD
      rdStatus: cliente.rdStatus ?? "nao_consultado",
      rdConsultedAt: cliente.rdConsultedAt ?? "",
      rdNotes: cliente.rdNotes ?? "",
    });
    setIsEditing(false); // Modo visualização
    setShowModal(true);
  };

  // Função para abrir modal de novo cliente
  const handleNewCliente = () => {
    resetForm();
    setEditingCliente(null);
    setTipoPessoa("CPF");
    setIsEditing(true); // Novo cliente já em modo de edição
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        // Excluir localmente primeiro
        const updatedClientes = clientes.filter(c => c.id !== id);
        setClientes(updatedClientes);
        setClientesLocal(updatedClientes);
        
        // Tentar excluir na API em background
        try {
          await api.deleteCliente(id);
        } catch (apiError) {
          console.error('API error (cliente excluído localmente):', apiError);
        }
      } catch (error) {
        console.error("Error deleting cliente:", error);
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
      
      // Update locally first for immediate feedback
      const updatedClientes = clientes.map(c => 
        c.id === cliente.id ? { ...c, status: newStatus } : c
      );
      setClientes(updatedClientes);
      setClientesLocal(updatedClientes);
      // Then try to sync with API
      try {
        await api.updateCliente(cliente.id, { ...cliente, status: newStatus });
      } catch (apiError) {
        // Revert if API fails
        setClientes(clientes);
        console.error("Error syncing with API:", apiError);
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
    });
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
    if (!phone) return "-";
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

  // Função para exportar clientes filtrados para CSV
  const exportClientes = () => {
    const headers = ["Nome", "Tipo", "CPF/CNPJ", "Email", "Telefone", "Celular", "CEP", "Rua", "Número", "Complemento", "Bairro", "Cidade", "Estado", "Status", "Profissão", "Estado Civil", "Observação"];
    
    const csvContent = [
      headers.join(","),
      ...filteredClientes.map((cliente) => {
        const tipo = isCNPJ(cliente.cpf_cnpj || "") ? "Pessoa Jurídica" : "Pessoa Física";
        const status = cliente.status === "ativo" ? "Ativo" : cliente.status === "inativo" ? "Inativo" : "Não Perturbe";
        return [
          `"${cliente.nome || ""}"`,
          `"${tipo}"`,
          `"${cliente.cpf_cnpj || ""}"`,
          `"${cliente.email || ""}"`,
          `"${formatPhone(cliente.telefone)}"`,
          `"${formatPhone(cliente.celular)}"`,
          `"${cliente.cep || ""}"`,
          `"${cliente.rua || ""}"`,
          `"${cliente.numero || ""}"`,
          `"${cliente.complemento || ""}"`,
          `"${cliente.bairro || ""}"`,
          `"${cliente.cidade || ""}"`,
          `"${cliente.estado || ""}"`,
          `"${status}"`,
          `"${cliente.profissao || ""}"`,
          `"${cliente.estado_civil || ""}"`,
          `"${(cliente.observacao || "").replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        onSearch={setSearch}
        onRefresh={loadClientes}
        onCreate={handleNewCliente}
        createLabel="Novo Cliente"
        onImport={handleImportClientes}
        importLabel="Importar Clientes"
        importColumns={[
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
          { key: 'tags', label: 'Tags', required: false },
        ]}
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
        exportData={filteredClientes}
        exportLabel="Exportar"
        exportColumns={[
          { key: 'nome', label: 'Nome' },
          { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
          { key: 'email', label: 'Email' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'cidade', label: 'Cidade' },
          { key: 'estado', label: 'Estado' },
        ]}
        exportFilename="clientes"
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
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden shadow-sm mt-5">
        {loading ? (
          <LoadingState text="Carregando clientes..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-[#1f2937] bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">ID/Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">CPF/CNPJ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">Localização</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600">Criado em</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente, index) => (
                  <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 align-middle text-sm text-gray-300">
                      <span className="text-sm font-medium text-white">
                        {formatClientCode(cliente, index)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={cliente.nome} type="cliente" size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-white">{cliente.nome}</p>
                          <p className="text-xs text-gray-500">{cliente.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-300">
                      {isCNPJ(cliente.cpf_cnpj || "") ? (
                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-900/20" title="Pessoa Jurídica">
                          <Building2 size={18} className="text-green-600" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-900/20" title="Pessoa Física">
                          <User size={18} className="text-blue-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm font-mono text-gray-300">
                      {formatDocument(cliente?.cpf_cnpj, cliente?.personType)}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-300">
                      {(() => {
                        const { celular, telefone, email } = getClienteContato(cliente);
                        if (!celular && !telefone && !email) {
                          return <span className="text-gray-400">-</span>;
                        }
                        return (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm text-gray-300">
                              {formatPhone(celular || telefone)}
                            </span>

                            {celular || telefone ? (
                              <a
                                href={`tel:${celular || telefone}`}
                                className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-900/20 transition-colors"
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
                                className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-900/20 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </a>
                            ) : null}

                            {email ? (
                              <a
                                href={`mailto:${email}`}
                                className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-900/20 transition-colors"
                                title={email}
                              >
                                <Mail size={16} />
                              </a>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2 align-middle text-sm text-gray-300 max-w-[150px] truncate">
                      {cliente.cidade && cliente.estado
                        ? `${cliente.cidade}/${cliente.estado}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-300">
                      {formatSafeDate(cliente?.created_at)}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-300">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(cliente)}
                          className={`p-2 rounded-xl transition-colors ${
                            cliente.status === "ativo" 
                              ? "text-green-600 hover:bg-green-900/20" 
                              : cliente.status === "nao_perturbe"
                              ? "text-yellow-600 hover:bg-yellow-900/20"
                              : "text-red-600 hover:bg-red-900/20"
                          }`}
                          title={cliente.status === "ativo" ? "Ativo - Clique para mudar" : cliente.status === "nao_perturbe" ? "Não Perturbe - Clique para mudar" : "Inativo - Clique para mudar"}
                        >
                          <span className={`w-4 h-4 rounded-full inline-block ${
                            cliente.status === "ativo" 
                              ? "bg-green-900/200" 
                              : cliente.status === "nao_perturbe"
                              ? "bg-yellow-900/200"
                              : "bg-red-900/200"
                          }`}></span>
                        </button>
                        <button
                          onClick={() => handleViewHistory(cliente)}
                          className="p-2 text-gray-500 hover:text-[#000dff] hover:bg-gray-100 rounded-xl transition-colors"
                          title="Histórico"
                        >
                          <Clock size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="p-2 text-[#000dff] hover:text-[#000dff]/80 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="p-2 text-[#000dff] hover:text-red-500 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
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
          <div className="bg-[#111827] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1f2937]">
              <h3 className="text-lg font-semibold text-white">
                {editingCliente ? "Editar Cliente" : "Novo Cliente"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-[#000dff] hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <User size={16} />
                  Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditable}
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Nome completo ou razão social"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tipo de Pessoa
                    </label>
                    <select
                      value={tipoPessoa}
                      onChange={(e) => setTipoPessoa(e.target.value as "CPF" | "CNPJ")}
                      disabled={!isEditable}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                    >
                      <option value="CPF">Pessoa Física</option>
                      <option value="CNPJ">Pessoa Jurídica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {tipoPessoa === "CPF" ? "CPF" : "CNPJ"}
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.cpf_cnpj}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (tipoPessoa === "CNPJ") {
                          setFormData({ ...formData, cpf_cnpj: formatCNPJInput(value) });
                        } else {
                          setFormData({ ...formData, cpf_cnpj: formatCPFInput(value) });
                        }
                      }}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder={tipoPessoa === "CPF" ? "CPF (11 dígitos)" : "CNPJ (14 dígitos)"}
                      maxLength={tipoPessoa === "CPF" ? 14 : 18}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Profissão
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.profissao}
                      onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Profissão"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Estado Civil
                    </label>
                    <select
                      disabled={!isEditable}
                      value={formData.estado_civil}
                      onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                    >
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro</option>
                      <option value="casado">Casado</option>
                      <option value="divorciado">Divorciado</option>
                      <option value="viuvo">Viúvo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Sexo
                    </label>
                    <select
                      disabled={!isEditable}
                      value={formData.sexo}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                    >
                      <option value="">Selecione...</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                      <option value="nao_informar">Prefiro não informar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {tipoPessoa === "CPF" ? "Data de Nascimento" : "Data de Abertura"}
                    </label>
                    <input
                      type="date"
                      disabled={!isEditable}
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Phone size={16} />
                  Informações de Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
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
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      disabled={!isEditable}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Campos condicionais para CNPJ */}
              {tipoPessoa === "CNPJ" && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                    <Building2 size={16} />
                    Responsável Legal (CNPJ)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Nome do Responsável Legal
                      </label>
                      <input
                        type="text"
                        disabled={!isEditable}
                        value={formData.responsavel_legal}
                        onChange={(e) => setFormData({ ...formData, responsavel_legal: e.target.value })}
                        className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                        placeholder="Nome do responsável legal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        CPF do Responsável
                      </label>
                      <input
                        type="text"
                        disabled={!isEditable}
                        value={formData.cpf_responsavel}
                        onChange={(e) => setFormData({ ...formData, cpf_responsavel: e.target.value.replace(/\D/g, "") })}
                        className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                        placeholder="CPF do responsável"
                        maxLength={11}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Endereço */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Endereço
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      CEP {cepLoading && <span className="text-xs text-[#000dff]">buscando...</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!isEditable}
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, "") })}
                        onBlur={() => buscarEnderecoPorCEP(formData.cep)}
                        className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed pr-10"
                        placeholder="00000-000"
                        maxLength={8}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#000dff] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Rua
                    </label>
                    <input
                      type="text"
                      value={formData.rua}
                      onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      className="w-full bg-gray-50 border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors"
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full bg-gray-50 border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors"
                      placeholder="Nº"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      className="w-full bg-gray-50 border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors"
                      placeholder="Apto, sala, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full bg-gray-50 border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors"
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full bg-gray-50 border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors"
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full bg-gray-50 border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors"
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Building2 size={16} />
                  Dados Bancários
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Nome do banco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Agência
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.agencia}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Agência"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Conta
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Conta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tipo de Conta
                    </label>
                    <select
                      disabled={!isEditable}
                      value={formData.tipoConta}
                      onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value as any })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                    >
                      <option value="">Selecione...</option>
                      <option value="corrente">Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Titular
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.titular}
                      onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Nome do titular"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Documento do Titular
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.documentoTitular}
                      onChange={(e) => setFormData({ ...formData, documentoTitular: e.target.value.replace(/\D/g, "") })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="CPF ou CNPJ do titular"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tipo de Chave PIX
                    </label>
                    <select
                      disabled={!isEditable}
                      value={formData.pixTipo}
                      onChange={(e) => setFormData({ ...formData, pixTipo: e.target.value as any })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={formData.pixChave}
                      onChange={(e) => setFormData({ ...formData, pixChave: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#1f2937] px-3 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-400"
                      placeholder="Chave PIX"
                    />
                  </div>
                </div>
              </div>

              {/* Status e Observações */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Edit size={16} />
                  Informações Adicionais
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-300">Status:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="ativo"
                          checked={formData.status === "ativo"}
                          disabled={!isEditable}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as "ativo" | "inativo" | "nao_perturbe" })}
                          className="w-4 h-4 text-[#000dff] bg-[#111827] border-gray-300 focus:ring-[#000dff] disabled:opacity-50"
                        />
                        <span className="text-gray-300">Ativo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="inativo"
                          checked={formData.status === "inativo"}
                          disabled={!isEditable}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as "ativo" | "inativo" | "nao_perturbe" })}
                          className="w-4 h-4 text-[#000dff] bg-[#111827] border-gray-300 focus:ring-[#000dff] disabled:opacity-50"
                        />
                        <span className="text-red-600">Inativo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="nao_perturbe"
                          checked={formData.status === "nao_perturbe"}
                          disabled={!isEditable}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as "ativo" | "inativo" | "nao_perturbe" })}
                          className="w-4 h-4 text-[#000dff] bg-[#111827] border-gray-300 focus:ring-[#000dff] disabled:opacity-50"
                        />
                        <span className="text-gray-300">Não Perturbe</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formData.observacao}
                      onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                      className="w-full bg-[#111827] border border-[#1f2937] rounded-2xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#000dff] transition-colors resize-none"
                      placeholder="Observações sobre o cliente..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Compliance e Consultas */}
              <div className="mt-6 pt-6 border-t border-[#1f2937]">
                <h4 className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2">
                  <Shield size={16} />
                  Compliance e Consultas
                </h4>
                <div className="space-y-4">
                  {/* Restrição de Crédito */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Restrição de Crédito</p>
                      <p className="text-xs text-gray-500">Consulta SPC/Serasa por CPF/CNPJ</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderCreditStatus()}
                      <button
                        type="button"
                        onClick={handleConsultCredit}
                        className="h-9 px-3 text-xs rounded-lg border border-[#1f2937] bg-[#111827] hover:bg-gray-50 transition-colors"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>

                  {/* Não Perturbe */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Não Perturbe</p>
                      <p className="text-xs text-gray-500">Bloqueio de contato por telefone</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderDoNotCallStatus()}
                      <button
                        type="button"
                        onClick={handleConsultDoNotCall}
                        className="h-9 px-3 text-xs rounded-lg border border-[#1f2937] bg-[#111827] hover:bg-gray-50 transition-colors"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-500 hover:text-gray-300 hover:bg-gray-100 rounded-2xl transition-colors"
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
                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-2xl transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-2xl transition-colors"
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
                <p className="text-sm text-gray-500">{historyCliente.nome}</p>
              </div>
              <button
                onClick={handleCloseHistory}
                className="p-2 text-[#000dff] hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {clienteHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
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
                          <span className="text-xs text-gray-500">{formatSafeDate(item.data)}</span>
                        </div>
                        <div className="mt-2 text-sm">
                          <p className="text-gray-500">
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
                <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="nao_perturbe">Não Perturbe</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Tipo</label>
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
    </div>
  );
};

export default ClientesPage;
