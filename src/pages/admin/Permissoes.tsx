// Permissões/Funções - Página Administrativa
import React, { useEffect, useMemo, useState } from "react";
import { Shield, Users, Key, Search, Edit, Trash2, Copy, X, Check, AlertCircle } from "lucide-react";
import { KpiCard } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  rolesApi,
  permissionsApi,
  type RoleResponse,
  type PermissionResponse,
} from "../../api/modules";

interface Role {
  id: string;
  nome: string;
  descricao: string;
  usuarios: number;
  permissoes: number;
  rolePermissions?: string[];
  tipo: "sistema" | "personalizada";
  createdAt: string;
}

interface PermissionOption {
  id: string;
  nome: string;
  categoria: string;
  slug: string;
}

type RoleFormPayload = Omit<Role, "id" | "usuarios" | "permissoes" | "createdAt"> & {
  permissoes: string[];
};

const mapPermissionToOption = (permission: PermissionResponse): PermissionOption => ({
  id: permission.slug,
  nome: permission.name,
  categoria: permission.resource,
  slug: permission.slug,
});

const mapRoleResponseToRole = (role: RoleResponse): Role => ({
  id: role.id,
  nome: role.name,
  descricao: role.description ?? "",
  usuarios: 0,
  permissoes: role.permissions?.length ?? 0,
  rolePermissions: role.permissions?.map((p) => p.slug) ?? [],
  tipo: role.isSystem ? "sistema" : "personalizada",
  createdAt: role.createdAt ? String(role.createdAt).split("T")[0] : "-",
});

const slugifyRole = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Modal para criar/editar função
const NovaRoleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: RoleFormPayload) => Promise<void>;
  editingRole?: Role | null;
  permissionsList: PermissionOption[];
}> = ({ isOpen, onClose, onSave, editingRole, permissionsList }) => {
  const isEditing = !!editingRole;
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchPermission, setSearchPermission] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
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

  const filteredPermissions = permissionsList.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchPermission.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchPermission.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchPermission.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {} as Record<string, PermissionOption[]>);

  const togglePermission = (permissionSlug: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionSlug)
        ? prev.filter((id) => id !== permissionSlug)
        : [...prev, permissionSlug]
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

    try {
      await onSave({
        nome: nome.trim(),
        descricao: descricao.trim(),
        tipo: "personalizada",
        permissoes: selectedPermissions,
      });

      setNome("");
      setDescricao("");
      setSelectedPermissions([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar função");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#111827] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Editar Função" : "Nova Função"}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing
                  ? "Edite as permissões da função selecionada"
                  : "Crie uma nova função com permissões oficiais do backend"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome da Função <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Gestor de Vendas"
              className="w-full px-4 py-3 border border-[#1f2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o propósito desta função..."
              rows={3}
              className="w-full px-4 py-3 border border-[#1f2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Permissões <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-2">
                ({selectedPermissions.length} selecionadas)
              </span>
            </label>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchPermission}
                onChange={(e) => setSearchPermission(e.target.value)}
                placeholder="Buscar permissões..."
                className="w-full pl-10 pr-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto border border-[#1f2937] rounded-xl p-4">
              {Object.entries(groupedPermissions).map(([categoria, permissions]) => (
                <div key={categoria}>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {categoria}
                  </h4>
                  <div className="space-y-1">
                    {permissions.map((permission) => (
                      <label
                        key={permission.slug}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.slug)}
                          onChange={() => togglePermission(permission.slug)}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-slate-300">
                          {permission.nome}
                          <span className="ml-2 text-xs text-slate-500">
                            {permission.slug}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {permissionsList.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nenhuma permissão encontrada no backend.
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#1f2937] bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-300 bg-[#111827] border border-[#1f2937] rounded-xl hover:bg-gray-50 transition-colors"
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
                Salvando...
              </>
            ) : (
              <>
                <Check size={18} />
                {isEditing ? "Salvar Alterações" : "Criar Função"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PermissoesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<PermissionOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const loadData = async () => {
    setLoadingData(true);
    setPageError("");

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        rolesApi.getAll({ limit: 100 }),
        permissionsApi.getAll({ limit: 500 }),
      ]);

      setRoles((rolesResponse.data ?? []).map(mapRoleResponseToRole));
      setPermissionsList((permissionsResponse.data ?? []).map(mapPermissionToOption));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Erro ao carregar permissões e funções");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (role) =>
          role.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [roles, searchTerm]
  );

  const handleCreateRole = async (newRole: RoleFormPayload) => {
    await rolesApi.create({
      name: newRole.nome,
      slug: slugifyRole(newRole.nome),
      description: newRole.descricao,
      permissions: newRole.permissoes,
    });

    await loadData();
  };

  const handleUpdateRole = async (updatedRole: RoleFormPayload) => {
    if (!editingRole) return;

    await rolesApi.update(editingRole.id, {
      name: updatedRole.nome,
      description: updatedRole.descricao,
      permissions: updatedRole.permissoes,
    });

    setEditingRole(null);
    setIsModalOpen(false);
    await loadData();
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.tipo === "sistema") return;

    const confirmed = window.confirm(`Deseja excluir a função "${role.nome}"?`);
    if (!confirmed) return;

    await rolesApi.delete(role.id);
    await loadData();
  };

  return (
    <div className="app-page">
      <NovaRoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        onSave={editingRole ? handleUpdateRole : handleCreateRole}
        editingRole={editingRole}
        permissionsList={permissionsList}
      />

      <PageHeader
        title="Permissões/Funções"
        icon={Shield}
        onCreate={() => setIsModalOpen(true)}
        createLabel="Nova Função"
      />

      {pageError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{pageError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total de Funções" value={roles.length} icon={<Shield size={18} />} variant="gray" />
        <KpiCard label="Funções do Sistema" value={roles.filter((r) => r.tipo === "sistema").length} icon={<Key size={18} />} variant="blue" />
        <KpiCard label="Personalizadas" value={roles.filter((r) => r.tipo === "personalizada").length} icon={<Users size={18} />} variant="green" />
        <KpiCard label="Usuários" value={roles.reduce((acc, r) => acc + r.usuarios, 0)} icon={<Users size={18} />} variant="orange" />
      </div>

      <div className="finqz-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar funções por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#1f2937] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="finqz-card overflow-hidden">
        {loadingData ? (
          <div className="p-12 text-center text-slate-500">Carregando funções e permissões...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[#1f2937]">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Usuários
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Permissões
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                        <p className="text-xs text-slate-500">Criado em {role.createdAt}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 max-w-xs truncate">{role.descricao}</p>
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
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-40"
                        title={role.tipo === "sistema" ? "Função de sistema não pode ser editada" : "Editar"}
                        disabled={role.tipo === "sistema"}
                        onClick={() => {
                          setEditingRole(role);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Duplicar"
                        onClick={() => {
                          setEditingRole({
                            ...role,
                            id: "",
                            nome: `${role.nome} cópia`,
                            tipo: "personalizada",
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Copy size={16} />
                      </button>

                      {role.tipo === "personalizada" && (
                        <button
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                          onClick={() => void handleDeleteRole(role)}
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
        )}

        {!loadingData && filteredRoles.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma função encontrada</h3>
            <p className="text-slate-500">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Nenhuma função retornada pelo backend"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissoesPage;