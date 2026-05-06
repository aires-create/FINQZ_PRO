// FINQZ PRO - Usuários Page
import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, X, User, Shield, ToggleLeft, ToggleRight, UserCheck, UserX, Eye, Globe, Building2, Store, UserCircle, Lock, Unlock } from "lucide-react";
import useAppStore from "../store";
import { Role, ROLE_LABELS, ROLE_PERMISSIONS, ROLE_SCOPES, SCOPE_LABELS, Permission, PERMISSION_LABELS } from "../types";
import { Button, Card as DSCard, Input, Select } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { FilterDrawer, FilterField } from "../components/layout/FilterDrawer";

const USER_ROLES: Role[] = [
  'ROLE_ADMIN_SISTEMA',
  'ROLE_CEO',
  'ROLE_DIRETOR_AUDITORIA',
  'ROLE_GERENTE_AUDITORIA',
  'ROLE_AUDITOR',
  'ROLE_DIRETOR_FINANCEIRO',
  'ROLE_GERENTE_FINANCEIRO',
  'ROLE_ANALISTA_FINANCEIRO',
  'ROLE_ASSISTENTE_FINANCEIRO',
  'ROLE_GERENTE_CONTESTACAO',
  'ROLE_ANALISTA_CONTESTACAO',
  'ROLE_ASSISTENTE_CONTESTACAO',
  'ROLE_SUPERINTENDENTE',
  'ROLE_DIRETOR_COMERCIAL_B2B',
  'ROLE_GERENTE_COMERCIAL_B2B',
  'ROLE_CONSULTOR_COMERCIAL_B2B',
  'ROLE_DIRETOR_COMERCIAL_B2C',
  'ROLE_GERENTE_COMERCIAL_B2C',
  'ROLE_CONSULTOR_COMERCIAL_B2C',
  'ROLE_GERENTE_REGIONAL_B2B',
  'ROLE_GERENTE_REGIONAL_B2C',
  'ROLE_SUPERVISOR_BACKOFFICE',
  'ROLE_ASSISTENTE_BACKOFFICE',
  'ROLE_GERENTE_FRANQUIA',
  'ROLE_VENDEDOR_FRANQUIA',
  'ROLE_FRANQUEADO',
];

// Tipos de status de usuário
type UserStatus = "ATIVO" | "INATIVO" | "BLOQUEADO";

// Filtros disponíveis
interface UserFilters {
  access_code: string;
  nome: string;
  email: string;
  role: string;
  scope: string;
  user_type: string;
  partner_type: string;
  partner_id: string;
  status: string;
  mfa_enabled: string;
}

const ScopeIcon: React.FC<{ scope: string }> = ({ scope }) => {
  switch (scope) {
    case 'GLOBAL':
      return <Globe size={14} className="text-purple-500" />;
    case 'COMPANY':
      return <Building2 size={14} className="text-blue-500" />;
    case 'FRANQUIA':
      return <Store size={14} className="text-green-500" />;
    case 'FRANQUEADO':
    case 'OWN':
      return <UserCircle size={14} className="text-orange-500" />;
    default:
      return <UserCircle size={14} className="text-slate-400" />;
  }
};

export const UsuariosPage: React.FC = () => {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, toggleUsuarioStatus, theme, parceiros } = useAppStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({
    access_code: "",
    nome: "",
    email: "",
    role: "",
    scope: "",
    user_type: "",
    partner_type: "",
    partner_id: "",
    status: "",
    mfa_enabled: "",
  });

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v && v !== "").length;
  }, [filters]);

  // Tipo de usuário: interno FINQZ ou parceiro
  const [userType, setUserType] = useState<"interno" | "parceiro">("interno");
  // Tipo de parceiro selecionado (para parceiro)
  const [partnerType, setPartnerType] = useState<"COMPANY" | "FRANQUIA" | "FRANQUEADO">("COMPANY");
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    role: "ROLE_CONSULTOR_COMERCIAL_B2C" as Role,
    senha: "",
    access_code: "",
    partner_id: undefined as number | undefined,
    status: "ATIVO" as UserStatus,
  });

  // Função para verificar se é o último admin ativo
  const isLastAdmin = (usuarioId: string) => {
    const adminUsers = Array.isArray(usuarios) ? usuarios.filter(u => u.role === "ROLE_ADMIN_SISTEMA" && u.status === "ATIVO") : [];
    return adminUsers.length === 1 && adminUsers[0].id === usuarioId;
  };

  // Função para bloquear usuário
  const handleBlockUser = (id: string) => {
    if (isLastAdmin(id)) {
      alert("Não é possível bloquear o último administrador ativo.");
      return;
    }
    if (confirm("Tem certeza que deseja bloquear este usuário?")) {
      updateUsuario(id, {
        status: "BLOQUEADO",
        locked_until: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias
        updated_at: Date.now(),
      });
    }
  };

  // Função para desbloquear usuário
  const handleUnlockUser = (id: string) => {
    updateUsuario(id, {
      status: "ATIVO",
      failed_login_attempts: 0,
      locked_until: undefined,
      updated_at: Date.now(),
    });
  };

  // Função para excluir usuário
  const handleDelete = (id: string) => {
    if (isLastAdmin(id)) {
      alert("Não é possível excluir o último administrador ativo.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUsuario(id);
    }
  };

  // Função para alternar status (ativo/inativo)
  const handleToggleStatus = (id: string) => {
    const usuario = Array.isArray(usuarios) ? usuarios.find(u => u.id === id) : null;
    if (!usuario) return;
    
    if (isLastAdmin(id)) {
      alert("Não é possível inativar o último administrador ativo.");
      return;
    }
    
    const newStatus = usuario.status === "ATIVO" ? "INATIVO" : "ATIVO";
    updateUsuario(id, { status: newStatus, updated_at: Date.now() });
  };

  // Filtrar usuários
  const filteredUsuarios = useMemo(() => {
    let users = Array.isArray(usuarios) ? usuarios : [];
    
    // Filtro de busca rápida
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.nome.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.access_code && u.access_code.toLowerCase().includes(searchLower))
      );
    }

    // Filtros avançados
    if (filters.access_code) {
      const codeFilter = filters.access_code.toUpperCase();
      users = users.filter(u => u.access_code?.toUpperCase().includes(codeFilter));
    }
    if (filters.nome) {
      users = users.filter(u => u.nome.toLowerCase().includes(filters.nome.toLowerCase()));
    }
    if (filters.email) {
      users = users.filter(u => u.email.toLowerCase().includes(filters.email.toLowerCase()));
    }
    if (filters.role) {
      users = users.filter(u => u.role === filters.role);
    }
    if (filters.scope) {
      users = users.filter(u => u.scope === filters.scope);
    }
    if (filters.user_type) {
      if (filters.user_type === "interno") {
        users = users.filter(u => !u.access_code?.startsWith("P-"));
      } else if (filters.user_type === "parceiro") {
        users = users.filter(u => u.access_code?.startsWith("P-"));
      }
    }
    if (filters.partner_type) {
      const partnerIds = Array.isArray(parceiros) ? parceiros.filter(p => p.tipo === filters.partner_type).map(p => p.id) : [];
      users = users.filter(u => u.partner_id && partnerIds.includes(u.partner_id));
    }
    if (filters.partner_id) {
      users = users.filter(u => u.partner_id === parseInt(filters.partner_id));
    }
    if (filters.status) {
      users = users.filter(u => u.status === filters.status);
    }
    if (filters.mfa_enabled) {
      const mfaValue = filters.mfa_enabled === "true";
      users = users.filter(u => u.mfa_enabled === mfaValue);
    }

    return users;
  }, [usuarios, search, filters, parceiros]);

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      access_code: "",
      nome: "",
      email: "",
      role: "",
      scope: "",
      user_type: "",
      partner_type: "",
      partner_id: "",
      status: "",
      mfa_enabled: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();

    // Obter permissões e scope baseados no role
    const permissions = formData.role ? ROLE_PERMISSIONS[formData.role] : [];
    
    // Determinar scope baseado no tipo de usuário
    let scope: "GLOBAL" | "COMPANY" | "FRANQUIA" | "FRANQUEADO" = "GLOBAL";
    if (userType === "parceiro") {
      scope = partnerType;
    }

    if (editingUsuario) {
      // Verificar se está tentando bloquear o último admin
      if (formData.status === "BLOQUEADO" && isLastAdmin(editingUsuario.id)) {
        alert("Não é possível bloquear o último administrador ativo.");
        return;
      }
      updateUsuario(editingUsuario.id, {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        partner_id: formData.partner_id,
        permissions,
        scope,
        status: formData.status,
        updated_at: now,
      });
    } else {
      const newUsuario = {
        id: Date.now().toString(),
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        access_code: formData.access_code,
        partner_id: formData.partner_id,
        permissions,
        scope,
        status: formData.status,
        created_at: now,
        updated_at: now,
      };
      addUsuario(newUsuario);
    }

    setShowModal(false);
    setEditingUsuario(null);
    resetForm();
  };

  const handleEdit = (usuario: any) => {
    setEditingUsuario(usuario);
    
    // Determinar tipo de usuário baseado no access_code
    const isPartner = usuario.access_code?.startsWith('P-');
    setUserType(isPartner ? "parceiro" : "interno");
    
    // Determinar tipo de parceiro baseado no scope
    if (isPartner && usuario.scope) {
      setPartnerType(usuario.scope as "COMPANY" | "FRANQUIA" | "FRANQUEADO");
    }
    
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role || 'ROLE_CONSULTOR_COMERCIAL_B2C',
      senha: "",
      access_code: usuario.access_code || "",
      partner_id: usuario.partner_id,
      status: usuario.status || "ATIVO",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    // Gerar próximo código de acesso disponível baseado no tipo
    const existingCodes = Array.isArray(usuarios) ? usuarios.map(u => u.access_code).filter(Boolean) : [];
    
    if (userType === "interno") {
      // Códigos FINQZ-0001 até FINQZ-0999
      const internalCodes = existingCodes
        .filter((code: string) => code.startsWith('FINQZ-'))
        .map((code: string) => {
          const match = code.match(/^FINQZ-(\d{4})$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n: number) => n > 0 && n <= 999);
      
      let nextCode = 1;
      while (internalCodes.includes(nextCode) && nextCode <= 999) {
        nextCode++;
      }
      const newAccessCode = `FINQZ-${String(nextCode).padStart(4, '0')}`;
      
      setFormData({
        nome: "",
        email: "",
        role: "ROLE_CONSULTOR_COMERCIAL_B2C",
        senha: "",
        access_code: newAccessCode,
        partner_id: undefined,
        status: "ATIVO",
      });
    } else {
      // Códigos P-1001 até P-9999
      const partnerCodes = existingCodes
        .filter((code: string) => code.startsWith('P-'))
        .map((code: string) => {
          const match = code.match(/^P-(\d{4})$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n: number) => n >= 1001);
      
      let nextCode = 1001;
      while (partnerCodes.includes(nextCode) && nextCode <= 9999) {
        nextCode++;
      }
      const newAccessCode = `P-${String(nextCode).padStart(4, '0')}`;
      
      setFormData({
        nome: "",
        email: "",
        role: "ROLE_GERENTE_FRANQUIA",
        senha: "",
        access_code: newAccessCode,
        partner_id: undefined,
        status: "ATIVO",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role as Role] || role;
  };

  const getScopeLabel = (role: string) => {
    const scope = ROLE_SCOPES[role as Role];
    return scope ? SCOPE_LABELS[scope] : 'N/A';
  };

  const viewPermissions = (role: string) => {
    setSelectedRole(role as Role);
    setShowPermissionsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Padronizado */}
      <PageHeader
        onSearch={setSearch}
        onRefresh={() => {}}
        onCreate={() => { setEditingUsuario(null); setUserType("interno"); setFormData(prev => ({ ...prev, status: "ATIVO" })); resetForm(); setShowModal(true); }}
        createLabel="Novo Usuário"
        // Ativar FilterDrawer (padrão premium)
        onOpenFilters={() => setOpenFilterDrawer(true)}
        filters={[
          { label: 'ID/Código', key: 'access_code', type: 'text', placeholder: 'FINQZ-0001 ou P-1001' },
          { label: 'Nome', key: 'nome', type: 'text', placeholder: 'Buscar por nome' },
          { label: 'Email', key: 'email', type: 'text', placeholder: 'Buscar por email' },
          { label: 'Perfil', key: 'role', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Admin Sistema', value: 'ROLE_ADMIN_SISTEMA' },
            { label: 'CEO', value: 'ROLE_CEO' },
            { label: 'Diretor de Auditoria', value: 'ROLE_DIRETOR_AUDITORIA' },
            { label: 'Gerente de Auditoria', value: 'ROLE_GERENTE_AUDITORIA' },
            { label: 'Auditor', value: 'ROLE_AUDITOR' },
            { label: 'Diretor Financeiro', value: 'ROLE_DIRETOR_FINANCEIRO' },
            { label: 'Gerente Financeiro', value: 'ROLE_GERENTE_FINANCEIRO' },
            { label: 'Analista Financeiro', value: 'ROLE_ANALISTA_FINANCEIRO' },
            { label: 'Assistente Financeiro', value: 'ROLE_ASSISTENTE_FINANCEIRO' },
            { label: 'Diretor Comercial B2B', value: 'ROLE_DIRETOR_COMERCIAL_B2B' },
            { label: 'Gerente Comercial B2B', value: 'ROLE_GERENTE_COMERCIAL_B2B' },
            { label: 'Consultor Comercial B2B', value: 'ROLE_CONSULTOR_COMERCIAL_B2B' },
            { label: 'Diretor Comercial B2C', value: 'ROLE_DIRETOR_COMERCIAL_B2C' },
            { label: 'Gerente Comercial B2C', value: 'ROLE_GERENTE_COMERCIAL_B2C' },
            { label: 'Consultor Comercial B2C', value: 'ROLE_CONSULTOR_COMERCIAL_B2C' },
            { label: 'Gerente de Franquia', value: 'ROLE_GERENTE_FRANQUIA' },
            { label: 'Vendedor de Franquia', value: 'ROLE_VENDEDOR_FRANQUIA' },
            { label: 'Franqueado', value: 'ROLE_FRANQUEADO' },
          ], placeholder: 'Todos os perfis' },
          { label: 'Escopo', key: 'scope', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Global', value: 'GLOBAL' },
            { label: 'Company', value: 'COMPANY' },
            { label: 'Franquia', value: 'FRANQUIA' },
            { label: 'Franqueado', value: 'FRANQUEADO' },
          ], placeholder: 'Todos os escopos' },
          { label: 'Tipo de Usuário', key: 'user_type', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Interno FINQZ', value: 'interno' },
            { label: 'Parceiro', value: 'parceiro' },
          ], placeholder: 'Todos os tipos' },
          { label: 'Tipo de Parceiro', key: 'partner_type', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Company', value: 'COMPANY' },
            { label: 'Franquia', value: 'FRANQUIA' },
            { label: 'Franqueado', value: 'FRANQUEADO' },
          ], placeholder: 'Todos os tipos' },
          { label: 'Parceiro Vinculado', key: 'partner_id', type: 'select', options: [
            { label: 'Todos', value: '' },
            ...(Array.isArray(parceiros) ? parceiros.map(p => ({ label: p.nome, value: String(p.id) })) : []),
          ], placeholder: 'Todos os parceiros' },
          { label: 'Status', key: 'status', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Ativo', value: 'ATIVO' },
            { label: 'Inativo', value: 'INATIVO' },
            { label: 'Bloqueado', value: 'BLOQUEADO' },
          ], placeholder: 'Todos os status' },
          { label: 'MFA', key: 'mfa_enabled', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Ativo', value: 'true' },
            { label: 'Inativo', value: 'false' },
          ], placeholder: 'Todos' },
        ]}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
      />

      {/* Users Table */}
      <div className="bg-[#111827] bg-[#111827]:bg-[#111827] bg-[#111827]:bg-[#111827] rounded-2xl border border-[#1f2937] bg-[#111827]:border-[#1f2937] bg-[#111827]:border-[#1f2937] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f2937] bg-[#111827]:border-[#1f2937] bg-[#111827]:border-[#1f2937]">
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">ID/CÓDIGO</th>
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Usuário</th>
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Email</th>
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Perfil</th>
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Escopo</th>
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Parceiro</th>
              <th className="text-left text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Status</th>
              <th className="text-right text-sm font-medium text-slate-500 bg-[#111827]:text-slate-500 p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b border-gray-100 bg-[#111827]:border-[#1f2937] bg-[#111827]:border-[#1f2937]">
                <td className="p-4">
                  <span className="font-mono text-sm text-slate-500">
                    {usuario.access_code || "-"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-white bg-[#111827]:text-white">{usuario.nome}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600 bg-[#111827]:text-slate-500">{usuario.email}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {getRoleLabel(usuario.role)}
                    </span>
                    <button
                      onClick={() => viewPermissions(usuario.role)}
                      className="p-1 rounded hover:bg-gray-100 text-slate-400 hover:text-slate-600"
                      title="Ver permissões"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <ScopeIcon scope={usuario.scope || 'GLOBAL'} />
                    <span className="text-xs text-slate-500">{getScopeLabel(usuario.role)}</span>
                  </div>
                </td>
                <td className="p-4">
                  {usuario.partner_id ? (
                    <span className="text-sm text-slate-600">
                      {Array.isArray(parceiros) ? parceiros.find(p => p.id === usuario.partner_id)?.nome || `- (${usuario.partner_id})` : `- (${usuario.partner_id})`}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    usuario.status === "ATIVO" ? "bg-green-900/20 text-green-700" : 
                    usuario.status === "INATIVO" ? "bg-yellow-900/20 text-yellow-700" : 
                    "bg-red-900/20 text-red-700"
                  }`}>
                    {usuario.status === "ATIVO" ? "Ativo" : usuario.status === "INATIVO" ? "Inativo" : "Bloqueado"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* Botão Desbloquear (se bloqueado) */}
                    {usuario.status === "BLOQUEADO" && (
                      <button
                        onClick={() => handleUnlockUser(usuario.id)}
                        className="p-2 text-green-500 hover:text-green-700 hover:bg-green-900/20 rounded-lg"
                        title="Desbloquear usuário"
                      >
                        <Unlock size={16} />
                      </button>
                    )}
                    {/* Botão Bloquear (se ativo) */}
                    {usuario.status === "ATIVO" && (
                      <button
                        onClick={() => handleBlockUser(usuario.id)}
                        className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg"
                        title="Bloquear usuário"
                      >
                        <Lock size={16} />
                      </button>
                    )}
                    {/* Botão Editar */}
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg"
                      title="Editar usuário"
                    >
                      <Edit size={16} />
                    </button>
                    {/* Botão Excluir */}
                    <button
                      onClick={() => handleDelete(usuario.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-900/20 rounded-lg"
                      title="Excluir usuário"
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

      {filteredUsuarios.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 bg-[#111827]:text-slate-500">Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] bg-[#111827]:bg-[#111827] bg-[#111827]:bg-[#111827] rounded-2xl p-6 w-full max-w-md border border-[#1f2937] bg-[#111827]:border-[#1f2937] bg-[#111827]:border-[#1f2937]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white bg-[#111827]:text-white">
                {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-500 hover:text-slate-600 bg-[#111827]:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white"
                />
              </div>

              {/* Tipo de Usuário */}
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                  Tipo de Usuário *
                </label>
                <select
                  required
                  value={userType}
                  onChange={(e) => {
                    const newType = e.target.value as "interno" | "parceiro";
                    setUserType(newType);
                    // Reset partner fields when changing type
                    setFormData({ ...formData, partner_id: undefined });
                    // Regenerate access code based on new type
                    const existingCodes = usuarios.map(u => u.access_code).filter(Boolean);
                    if (newType === "interno") {
                      const internalCodes = existingCodes.filter(c => c.startsWith('FINQZ-')).map(c => parseInt(c.match(/^FINQZ-(\d{4})$/)?.[1] || "0")).filter(n => n > 0 && n <= 999);
                      let nextCode = 1;
                      while (internalCodes.includes(nextCode) && nextCode <= 999) nextCode++;
                      setFormData(prev => ({ ...prev, access_code: `FINQZ-${String(nextCode).padStart(4, '0')}`, partner_id: undefined }));
                    } else {
                      const partnerCodes = existingCodes.filter(c => c.startsWith('P-')).map(c => parseInt(c.match(/^P-(\d{4})$/)?.[1] || "0")).filter(n => n >= 1001);
                      let nextCode = 1001;
                      while (partnerCodes.includes(nextCode) && nextCode <= 9999) nextCode++;
                      setFormData(prev => ({ ...prev, access_code: `P-${String(nextCode).padStart(4, '0')}`, role: "ROLE_GERENTE_FRANQUIA" }));
                    }
                  }}
                  disabled={!!editingUsuario}
                  className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white disabled:opacity-50"
                >
                  <option value="interno">Interno FINQZ</option>
                  <option value="parceiro">Parceiro</option>
                </select>
              </div>

              {/* Campos de Parceiro - apenas se for usuário parceiro */}
              {userType === "parceiro" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                      Tipo de Parceiro *
                    </label>
                    <select
                      required
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value as "COMPANY" | "FRANQUIA" | "FRANQUEADO")}
                      disabled={!!editingUsuario}
                      className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white disabled:opacity-50"
                    >
                      <option value="COMPANY">Company</option>
                      <option value="FRANQUIA">Franquia</option>
                      <option value="FRANQUEADO">Franqueado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                      Parceiro Vinculado *
                    </label>
                    <select
                      required
                      value={formData.partner_id || ""}
                      onChange={(e) => setFormData({ ...formData, partner_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white"
                    >
                      <option value="">Selecione um parceiro</option>
                      {parceiros
                        .filter(p => p.tipo === partnerType && p.status === "ativo")
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome} ({p.tipo})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                  Papel (Role) *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                  Código de Acesso
                </label>
                <input
                  type="text"
                  value={formData.access_code}
                  readOnly={!!editingUsuario}
                  placeholder={editingUsuario ? "" : "Gerado automaticamente"}
                  className={`w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white font-mono ${editingUsuario ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {editingUsuario ? "Código fixo após criação" : "Gerado automaticamente ao criar"}
                </p>
              </div>
              
              {/* Campo Status - apenas em modo edição */}
              {editingUsuario && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="BLOQUEADO">Bloqueado</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">
                  Senha Inicial {editingUsuario ? "(opcional)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingUsuario}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 bg-[#111827]:bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-2xl text-white bg-[#111827]:text-white"
                  placeholder={editingUsuario ? "Deixe em branco para manter" : ""}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 bg-[#111827]:text-slate-500 hover:bg-gray-100 bg-[#111827]:hover:bg-gray-50 bg-[#111827]:bg-gray-50 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#000dff] text-white rounded-2xl hover:bg-[#000dff]/90"
                >
                  {editingUsuario ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Permissões */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPermissionsModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-xl shadow-2xl bg-[#111827] border border-[#1f2937] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Permissões: {ROLE_LABELS[selectedRole]}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <ScopeIcon scope={ROLE_SCOPES[selectedRole]} />
                  <span className="text-sm text-slate-500">
                    Escopo: {SCOPE_LABELS[ROLE_SCOPES[selectedRole]]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 gap-2">
                {selectedRole && ROLE_PERMISSIONS[selectedRole] ? (
                  ROLE_PERMISSIONS[selectedRole].map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                    >
                      <Shield size={14} className="text-[#000dff]" />
                      <span className="text-sm text-slate-300">
                        {PERMISSION_LABELS[permission] || permission}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm p-2">
                    Selecione um role para ver as permissões
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        fields={[
          { key: 'access_code', label: 'ID/Código', type: 'text', placeholder: 'FINQZ-0001 ou P-1001' },
          { key: 'nome', label: 'Nome', type: 'text', placeholder: 'Buscar por nome' },
          { key: 'email', label: 'Email', type: 'text', placeholder: 'Buscar por email' },
          { key: 'role', label: 'Perfil', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Admin Sistema', value: 'ROLE_ADMIN_SISTEMA' },
            { label: 'CEO', value: 'ROLE_CEO' },
            { label: 'Gerente', value: 'ROLE_GERENTE' },
            { label: 'Consultor', value: 'ROLE_CONSULTOR' },
          ], placeholder: 'Todos os perfis' },
          { key: 'scope', label: 'Escopo', type: 'select', options: [
            { label: 'Todos', value: '' },
            { label: 'Global', value: 'GLOBAL' },
            { label: 'Company', value: 'COMPANY' },
            { label: 'Franquia', value: 'FRANQUIA' },
          ], placeholder: 'Todos os escopos' },
        ]}
        values={filters}
        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        onApply={() => setOpenFilterDrawer(false)}
        onClear={clearFilters}
      />
    </div>
  );
};

export default UsuariosPage;
