// Permissões/Roles - Página Administrativa
import React, { useState } from "react";
import { Shield, Plus, Users, Key, ChevronRight, Search, MoreVertical, Edit, Trash2, Copy, X, Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Role {
  id: string;
  nome: string;
  descricao: string;
  usuarios: number;
  permissoes: number;
  rolePermissions?: string[]; // IDs das permissões atribuídas
  tipo: "sistema" | "personalizada";
  createdAt: string;
}

// Lista de permissões disponíveis
const PERMISSIONS_LIST = [
  { id: "dashboard_view", nome: "Visualizar Dashboard", categoria: "Dashboard" },
  { id: "clientes_view", nome: "Visualizar Clientes", categoria: "Clientes" },
  { id: "clientes_create", nome: "Criar Clientes", categoria: "Clientes" },
  { id: "clientes_edit", nome: "Editar Clientes", categoria: "Clientes" },
  { id: "clientes_delete", nome: "Excluir Clientes", categoria: "Clientes" },
  { id: "oportunidades_view", nome: "Visualizar Oportunidades", categoria: "Oportunidades" },
  { id: "oportunidades_create", nome: "Criar Oportunidades", categoria: "Oportunidades" },
  { id: "oportunidades_edit", nome: "Editar Oportunidades", categoria: "Oportunidades" },
  { id: "oportunidades_delete", nome: "Excluir Oportunidades", categoria: "Oportunidades" },
  { id: "parceiros_view", nome: "Visualizar Parceiros", categoria: "Parceiros" },
  { id: "parceiros_create", nome: "Criar Parceiros", categoria: "Parceiros" },
  { id: "parceiros_edit", nome: "Editar Parceiros", categoria: "Parceiros" },
  { id: "usuarios_view", nome: "Visualizar Usuários", categoria: "Usuários" },
  { id: "usuarios_create", nome: "Criar Usuários", categoria: "Usuários" },
  { id: "usuarios_edit", nome: "Editar Usuários", categoria: "Usuários" },
  { id: "usuarios_delete", nome: "Excluir Usuários", categoria: "Usuários" },
  { id: "auditoria_view", nome: "Visualizar Auditoria", categoria: "Auditoria" },
  { id: "eventos_view", nome: "Visualizar Eventos", categoria: "Eventos" },
  { id: "configuracoes_view", nome: "Visualizar Configurações", categoria: "Configurações" },
  { id: "configuracoes_edit", nome: "Editar Configurações", categoria: "Configurações" },
  { id: "relatorios_view", nome: "Visualizar Relatórios", categoria: "Relatórios" },
  { id: "relatorios_export", nome: "Exportar Relatórios", categoria: "Relatórios" },
  { id: "financeiro_view", nome: "Visualizar Financeiro", categoria: "Financeiro" },
  { id: "financeiro_edit", nome: "Editar Financeiro", categoria: "Financeiro" },
];

const mockRoles: Role[] = [
  {
    id: "1",
    nome: "Admin Sistema",
    descricao: "Acesso total ao sistema com todas as permissões",
    usuarios: 3,
    permissoes: 24,
    rolePermissions: PERMISSIONS_LIST.map(p => p.id),
    tipo: "sistema",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    nome: "Diretor Auditoria",
    descricao: "Gestão de auditoria e eventos do sistema",
    usuarios: 2,
    permissoes: 8,
    rolePermissions: ["auditoria_view", "eventos_view", "relatorios_view", "relatorios_export", "clientes_view", "oportunidades_view", "dashboard_view", "usuarios_view"],
    tipo: "sistema",
    createdAt: "2024-02-01",
  },
  {
    id: "3",
    nome: "Gerente Auditoria",
    descricao: "Supervisão de atividades de auditoria",
    usuarios: 5,
    permissoes: 6,
    rolePermissions: ["auditoria_view", "eventos_view", "relatorios_view", "clientes_view", "oportunidades_view", "dashboard_view"],
    tipo: "sistema",
    createdAt: "2024-02-15",
  },
  {
    id: "4",
    nome: "Auditor",
    descricao: "Acesso para visualização e criação de relatórios de auditoria",
    usuarios: 12,
    permissoes: 4,
    rolePermissions: ["auditoria_view", "eventos_view", "relatorios_view", "relatorios_export"],
    tipo: "sistema",
    createdAt: "2024-03-01",
  },
];

// Modal para criar/editar role
const NovaRoleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, "id" | "usuarios" | "permissoes" | "createdAt"> & { permissoes: string[] }) => void;
  editingRole?: Role | null; // Role sendo editada (se fornecida, modo edição)
}> = ({ isOpen, onClose, onSave, editingRole }) => {
  const isEditing = !!editingRole;
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchPermission, setSearchPermission] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Preencher dados quando abre para edição
  React.useEffect(() => {
    if (editingRole) {
      setNome(editingRole.nome);
      setDescricao(editingRole.descricao);
      setSelectedPermissions(editingRole.rolePermissions || []);
    } else {
      setNome("");
      setDescricao("");
      setSelectedPermissions([]);
    }
    setError("");
  }, [editingRole, isOpen]);

  const filteredPermissions = PERMISSIONS_LIST.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchPermission.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchPermission.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {} as Record<string, typeof PERMISSIONS_LIST>);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nome.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!descricao.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (selectedPermissions.length === 0) {
      setError("Selecione pelo menos uma permissão");
      return;
    }

    setLoading(true);

    // Simular chamada de API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSave({
      nome: nome.trim(),
      descricao: descricao.trim(),
      tipo: "personalizada",
      permissoes: selectedPermissions,
    });

    setLoading(false);
    setNome("");
    setDescricao("");
    setSelectedPermissions([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#111827] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Editar Role" : "Nova Role"}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing 
                  ? "Edite as permissões da role selecionada" 
                  : "Crie uma nova role com permissões personalizadas"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Gestor de Vendas"
              className="w-full px-4 py-3 border border-[#1f2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o propósito desta role..."
              rows={3}
              className="w-full px-4 py-3 border border-[#1f2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Permissões */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permissões <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">({selectedPermissions.length} selecionadas)</span>
            </label>

            {/* Busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchPermission}
                onChange={(e) => setSearchPermission(e.target.value)}
                placeholder="Buscar permissões..."
                className="w-full pl-10 pr-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Lista de permissões por categoria */}
            <div className="space-y-4 max-h-64 overflow-y-auto border border-[#1f2937] rounded-xl p-4">
              {Object.entries(groupedPermissions).map(([categoria, permissions]) => (
                <div key={categoria}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {categoria}
                  </h4>
                  <div className="space-y-1">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-gray-300">{permission.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#1f2937] bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 bg-[#111827] border border-[#1f2937] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check size={18} />
                {isEditing ? "Salvar Alterações" : "Criar Role"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PermissoesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const filteredRoles = roles.filter(
    (role) =>
      role.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = (newRole: Omit<Role, "id" | "usuarios" | "permissoes" | "createdAt"> & { permissoes: string[] }) => {
    const role: Role = {
      id: String(Date.now()),
      nome: newRole.nome,
      descricao: newRole.descricao,
      tipo: newRole.tipo,
      usuarios: 0,
      permissoes: newRole.permissoes.length,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setRoles((prev) => [role, ...prev]);
  };

  const handleUpdateRole = (updatedRole: Omit<Role, "id" | "usuarios" | "permissoes" | "createdAt"> & { permissoes: string[] }) => {
    if (!editingRole) return;
    
    const role: Role = {
      ...editingRole,
      nome: updatedRole.nome,
      descricao: updatedRole.descricao,
      tipo: updatedRole.tipo,
      permissoes: updatedRole.permissoes.length,
      rolePermissions: updatedRole.permissoes,
    };

    setRoles((prev) =>
      prev.map((r) => (r.id === editingRole.id ? role : r))
    );
    
    setEditingRole(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Modal de Nova Role */}
      <NovaRoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        onSave={editingRole ? handleUpdateRole : handleCreateRole}
        editingRole={editingRole}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Administração</span>
          <ChevronRight size={16} />
          <span className="text-white">Permissões/Roles</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              Permissões/Roles
            </h1>
            <p className="text-gray-600 mt-1">
              Gerenciamento de roles e permissões do sistema
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Nova Role
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Roles</p>
              <p className="text-2xl font-bold text-white">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Roles do Sistema</p>
              <p className="text-2xl font-bold text-white">
                {roles.filter((r) => r.tipo === "sistema").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Key className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Roles Personalizadas</p>
              <p className="text-2xl font-bold text-white">
                {roles.filter((r) => r.tipo === "personalizada").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Usuários</p>
              <p className="text-2xl font-bold text-white">
                {roles.reduce((acc, r) => acc + r.usuarios, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar roles por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-[#111827] rounded-xl border border-[#1f2937] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[#1f2937]">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Usuários
              </th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Permissões
              </th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRoles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      role.tipo === "sistema" 
                        ? "bg-gradient-to-br from-purple-500 to-purple-700" 
                        : "bg-gradient-to-br from-green-500 to-green-700"
                    }`}>
                      <Shield className="text-white" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{role.nome}</p>
                      <p className="text-xs text-gray-500">Criado em {role.createdAt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 max-w-xs truncate">{role.descricao}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    role.tipo === "sistema"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {role.tipo === "sistema" ? "Sistema" : "Personalizada"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {role.usuarios}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {role.permissoes}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar"
                      onClick={() => {
                        setEditingRole(role);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <Copy size={16} />
                    </button>
                    {role.tipo === "personalizada" && (
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRoles.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma role encontrada</h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Comece criando uma nova role para o sistema"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissoesPage;
