// FINQZ PRO - Layout Component
// Design System Fintech - Sidebar Escura com Menu Colapsável
import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Layers,
  FileBarChart,
  UserCog,
  Settings,
  TrendingUp,
  Menu,
  X,
  LogOut,
  ClipboardList,
  Wallet,
  PiggyBank,
  Bell,
  Package,
  Shield,
  Send,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Rocket,
  Phone,
  Database,
  Mail,
  Bot,
  Gauge,
  Building2,
  FileText,
  DollarSign,
  BarChart3,
  Lock,
  Activity,
  Key,
  Table2,
  Calculator,
  Moon,
  Sun,
} from "lucide-react";
import useAppStore from "../store";
import { createEdgeSpark } from "@edgespark/client";
import { API_BASE_URL } from "../config/environment";

const client = createEdgeSpark({
  baseUrl: new URL(API_BASE_URL, window.location.origin).toString(),
});

// ============================================
// HELPER - Verificar Permissões RBAC
// ============================================

// Mapeamento de permissões de rota para módulos (formato: module:action)
const ROUTE_PERMISSIONS: Record<string, string> = {
  // Dashboard
  "/app/dashboard": "dashboard:read",
  // FINQZ HUB
  "/app/hub/audiencias": "audiencias:read",
  "/app/hub/campanhas": "campanhas:read",
  "/app/hub/disparos": "disparos:read",
  "/app/hub/whatsapp": "whatsapp:read",
  "/app/hub/sdr-ia": "sdr_ia:read",
  "/app/hub/higienizacao": "higienizacao:read",
  "/app/hub/mailing": "mailing:read",
  // CRM
  "/app/crm/clientes": "clientes:read",
  "/app/crm/pipeline": "oportunidades:read",
  // Operações
  "/app/operacoes/parceiros": "parceiros:read",
  "/app/operacoes/estrutura-comercial": "estrutura_comercial:read",
  "/app/operacoes/tabelas-comerciais": "estrutura_comercial:read",
  "/app/operacoes/roteiros": "roteiros:read",
  "/app/operacoes/financeiro": "financeiro:read",
  "/app/operacoes/conta-corrente": "conta_corrente:read",
  "/app/operacoes/relatorios": "relatorios:read",
  // Administração
  "/app/admin/usuarios": "usuarios:read",
  "/app/admin/permissoes": "permissoes:read",
  "/app/admin/auditoria": "auditoria:read",
  "/app/admin/eventos": "admin:read",
  "/app/admin/geral": "configuracoes:read",
  "/app/admin/tags": "configuracoes:read",
  "/app/admin/pipelines": "configuracoes:read",
  "/app/admin/integracoes": "configuracoes:read",
  "/app/admin/automacoes": "configuracoes:read",
  "/app/admin/notificacoes": "configuracoes:read",
  "/app/admin/seguranca": "configuracoes:read",
  "/app/admin/bancos": "configuracoes:read",
  // Legado (redirects)
  "/app/admin/configuracoes": "configuracoes:read",
  "/app/configuracoes": "configuracoes:read",
  "/app/produtos": "produtos:read",
  "/app/automacoes": "automacoes:read",
};

const ACTION_ALIAS_MAP: Record<string, string[]> = {
  read: ["READ", "VIEW"],
  view: ["VIEW", "READ"],
  create: ["CREATE"],
  edit: ["EDIT", "UPDATE"],
  delete: ["DELETE"],
  export: ["EXPORT"],
};

const buildPermissionVariants = (permission?: string): string[] => {
  if (!permission) return [];

  const variants = new Set<string>([
    permission,
    permission.replace(':read', ''),
    permission.replace(':read', ':*'),
    permission.replace(':read', ':view'),
    permission.replace(':view', ':read'),
    permission.replace(':view', ''),
    permission.replace(':view', ':*'),
  ]);

  if (permission.includes(':')) {
    const [moduleName, actionName = 'read'] = permission.split(':');
    const aliases = ACTION_ALIAS_MAP[actionName] || [actionName.toUpperCase()];

    aliases.forEach((alias) => {
      variants.add(`${moduleName.toUpperCase()}_${alias}`);
    });
  }

  return Array.from(variants);
};

const hasPermissionMatch = (userPermissions: string[], requiredPermission?: string): boolean => {
  if (!requiredPermission || userPermissions.length === 0 || userPermissions.includes("*")) {
    return true;
  }

  const variants = buildPermissionVariants(requiredPermission);
  return userPermissions.some((permission) => {
    const normalizedPermission = String(permission).toUpperCase();
    return variants.some((variant) => variant.toUpperCase() === normalizedPermission);
  });
};

// Função para verificar se usuário tem permissão para uma rota
const hasPermissionForRoute = (userPermissions: string[], route: string): boolean => {
  const requiredPermission = ROUTE_PERMISSIONS[route];
  if (!requiredPermission) {
    return true;
  }

  return hasPermissionMatch(userPermissions, requiredPermission);
};

// Função para verificar se usuário tem permissão para ver o grupo
const hasPermissionForGroup = (userPermissions: string[], groupPermission?: string): boolean => {
  return hasPermissionMatch(userPermissions, groupPermission);
};

// Função para verificar se usuário tem permissão para um item de menu
const hasPermissionForMenuItem = (userPermissions: string[], itemPermission?: string): boolean => {
  return hasPermissionMatch(userPermissions, itemPermission);
};

// ============================================
// TIPOS E CONFIGURAÇÕES DE MENU
// ============================================

type MenuItem = {
  path: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
};

type MenuGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
  items: MenuItem[];
};

// Mapeamento de páginas para ícone e título
const pageConfig: Record<string, { title: string; icon: React.ElementType }> = {
  "/app/dashboard": { title: "Dashboard", icon: LayoutDashboard },
  // FINQZ HUB
  "/app/hub/audiencias": { title: "Audiências", icon: Users },
  "/app/hub/campanhas": { title: "Campanhas", icon: Send },
  "/app/hub/disparos": { title: "Disparos", icon: Rocket },
  "/app/hub/whatsapp": { title: "WhatsApp", icon: Phone },
  "/app/hub/sdr-ia": { title: "SDR IA", icon: Bot },
  "/app/hub/higienizacao": { title: "Higienização", icon: Database },
  "/app/hub/mailing": { title: "Mailing", icon: Mail },
  // CRM
  "/app/crm/clientes": { title: "Clientes", icon: Users },
  "/app/crm/pipeline": { title: "Pipeline", icon: TrendingUp },
  // Operações
  "/app/operacoes/parceiros": { title: "Parceiros", icon: Handshake },
  "/app/operacoes/estrutura-comercial": { title: "Estrutura Comercial", icon: Building2 },
  "/app/operacoes/tabelas-comerciais": { title: "Tabelas Comerciais", icon: Table2 },
  "/app/operacoes/roteiros": { title: "Roteiros Operacionais", icon: ClipboardList },
  "/app/operacoes/financeiro": { title: "Financeiro", icon: Wallet },
  "/app/operacoes/conta-corrente": { title: "Conta Corrente", icon: PiggyBank },
  "/app/operacoes/relatorios": { title: "Relatórios", icon: BarChart3 },
  // Administração
  "/app/admin/usuarios": { title: "Usuários", icon: UserCog },
  "/app/admin/permissoes": { title: "Permissões/Roles", icon: Lock },
  "/app/admin/auditoria": { title: "Auditoria", icon: Shield },
  "/app/admin/eventos": { title: "Eventos", icon: Activity },
  "/app/admin/geral": { title: "Geral", icon: Settings },
  "/app/admin/tags": { title: "Tags", icon: Zap },
  "/app/admin/pipelines": { title: "Pipelines", icon: TrendingUp },
  "/app/admin/integracoes": { title: "Integrações", icon: Key },
  "/app/admin/automacoes": { title: "Automações", icon: Zap },
  "/app/admin/notificacoes": { title: "Notificações", icon: Bell },
  "/app/admin/seguranca": { title: "Segurança", icon: Shield },
  "/app/admin/bancos": { title: "Bancos & Providers", icon: Building2 },
  // Legado (redirects)
  "/app/clientes": { title: "Clientes", icon: Users },
  "/app/oportunidades": { title: "Pipeline", icon: TrendingUp },
  "/app/crm/oportunidades": { title: "Pipeline", icon: TrendingUp },
  "/app/parceiros": { title: "Parceiros", icon: Handshake },
  "/app/estrutura-comercial": { title: "Estrutura Comercial", icon: Layers },
  "/app/roteiros-operacionais": { title: "Roteiros Operacionais", icon: ClipboardList },
  "/app/financeiro": { title: "Financeiro", icon: Wallet },
  "/app/conta-corrente": { title: "Conta Corrente", icon: PiggyBank },
  "/app/relatorios": { title: "Relatórios", icon: FileBarChart },
  "/app/auditoria": { title: "Auditoria", icon: Shield },
  "/app/usuarios": { title: "Usuários", icon: UserCog },
  "/app/configuracoes": { title: "Configurações", icon: Settings },
  "/app/produtos": { title: "Produtos", icon: Package },
  "/app/automacoes": { title: "Automações", icon: Settings },
  "/app/campanhas": { title: "Campanhas", icon: Send },
  "/app/conversas": { title: "WhatsApp", icon: Phone },
  "/app/hub/conversas": { title: "WhatsApp", icon: Phone },
  "/app/hub/automacao": { title: "Configurações", icon: Settings },
};

// Grupos de Menu - Ordem: Dashboard, CRM, Operações, FINQZ HUB, Administração
const menuGroups: MenuGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Target,
    permission: "crm:read",
    items: [
      { path: "/app/crm/clientes", label: "Clientes", icon: Users, permission: "clientes:read" },
      { path: "/app/crm/pipeline", label: "Pipeline", icon: TrendingUp, permission: "oportunidades:read" },
      { path: "/app/crm/simulador", label: "Simulador", icon: Calculator, permission: "simulador:read" },
    ],
  },
  {
    id: "operacoes",
    label: "Operações",
    icon: Building2,
    permission: "operacoes:read",
    items: [
      { path: "/app/operacoes/parceiros", label: "Parceiros", icon: Handshake, permission: "parceiros:read" },
      { path: "/app/operacoes/estrutura-comercial", label: "Estrutura Comercial", icon: Building2, permission: "estrutura_comercial:read" },
      { path: "/app/operacoes/tabelas-comerciais", label: "Tabelas Comerciais", icon: Table2, permission: "estrutura_comercial:read" },
      { path: "/app/operacoes/roteiros", label: "Roteiros Operacionais", icon: ClipboardList, permission: "roteiros:read" },
      { path: "/app/operacoes/financeiro", label: "Financeiro", icon: Wallet, permission: "financeiro:read" },
      { path: "/app/operacoes/conta-corrente", label: "Conta Corrente", icon: PiggyBank, permission: "conta_corrente:read" },
      { path: "/app/operacoes/relatorios", label: "Relatórios", icon: BarChart3, permission: "relatorios:read" },
    ],
  },
  {
    id: "hub",
    label: "FINQZ HUB",
    icon: Zap,
    permission: "hub:read",
    items: [
      { path: "/app/hub/audiencias", label: "Audiências", icon: Users, permission: "audiencias:read" },
      { path: "/app/hub/campanhas", label: "Campanhas", icon: Send, permission: "campanhas:read" },
      { path: "/app/hub/disparos", label: "Disparos", icon: Rocket, permission: "disparos:read" },
      { path: "/app/hub/whatsapp", label: "WhatsApp", icon: Phone, permission: "whatsapp:read" },
      { path: "/app/hub/sdr-ia", label: "SDR IA", icon: Bot, permission: "sdr_ia:read" },
      { path: "/app/hub/higienizacao", label: "Higienização", icon: Database, permission: "higienizacao:read" },
      { path: "/app/hub/mailing", label: "Mailing", icon: Mail, permission: "mailing:read" },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    icon: Settings,
    permission: "admin:read",
    items: [
      { path: "/app/admin/usuarios", label: "Usuários", icon: UserCog, permission: "usuarios:read" },
      { path: "/app/admin/permissoes", label: "Permissões/Roles", icon: Lock, permission: "permissoes:read" },
      { path: "/app/admin/auditoria", label: "Auditoria", icon: Shield, permission: "auditoria:read" },
      { path: "/app/admin/eventos", label: "Eventos", icon: Activity, permission: "admin:read" },
      { path: "/app/admin/geral", label: "Geral", icon: Settings, permission: "configuracoes:read" },
      { path: "/app/admin/tags", label: "Tags", icon: Zap, permission: "configuracoes:read" },
      { path: "/app/admin/pipelines", label: "Pipelines", icon: TrendingUp, permission: "configuracoes:read" },
      { path: "/app/admin/integracoes", label: "Integrações", icon: Key, permission: "configuracoes:read" },
      { path: "/app/admin/automacoes", label: "Automações", icon: Zap, permission: "configuracoes:read" },
      { path: "/app/admin/notificacoes", label: "Notificações", icon: Bell, permission: "configuracoes:read" },
      { path: "/app/admin/seguranca", label: "Segurança", icon: Shield, permission: "configuracoes:read" },
    ],
  },
];

// Itens legados (para compatibilidade com rotas antigas)
const legacyMenuItems: MenuItem[] = [
  { path: "/app/configuracoes", label: "Configurações", icon: Settings },
  { path: "/app/produtos", label: "Produtos", icon: Package },
];

export const Layout: React.FC<{ customMenuItems?: MenuItem[]; children?: React.ReactNode }> = ({ customMenuItems, children }) => {
  const { sidebarOpen, setSidebarOpen, user, theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["dashboard", "crm", "operacoes", "hub", "administracao"]);

  // Obter permissões do usuário (do store ou do usuário logado)
  const userPermissions = user?.permissions || [];
  
  // Filtrar grupos de menu baseados nas permissões do usuário
  const filteredMenuGroups = useMemo(() => {
    return menuGroups
      .filter(group => hasPermissionForGroup(userPermissions, group.permission))
      .map(group => ({
        ...group,
        items: group.items.filter(item => hasPermissionForMenuItem(userPermissions, item.permission))
      }))
      .filter(group => group.items.length > 0); // Remove grupos sem itens
  }, [userPermissions]);

  // Filtrar itens legados baseados nas permissões
  const filteredLegacyItems = useMemo(() => {
    return legacyMenuItems.filter(item => 
      hasPermissionForRoute(userPermissions, item.path)
    );
  }, [userPermissions]);

  // Carregar estado expandido do localStorage ou usar padrão
  useEffect(() => {
    const saved = localStorage.getItem("menuExpandedGroups");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Garantir que todos os grupos principais estejam expandidos
        const defaultGroups = ["dashboard", "crm", "operacoes", "hub", "administracao"];
        const mergedGroups = [...new Set([...parsed, ...defaultGroups])];
        setExpandedGroups(mergedGroups);
      } catch (e) {
        console.error("Erro ao carregar estado do menu:", e);
        // Usar padrão se falhar
        setExpandedGroups(["dashboard", "crm", "operacoes", "hub", "administracao"]);
      }
    } else {
      // Expandir todos por padrão na primeira vez
      setExpandedGroups(["dashboard", "crm", "operacoes", "hub", "administracao"]);
    }
  }, []);

  // Salvar estado expandido no localStorage
  const toggleGroup = (groupId: string) => {
    const newExpanded = expandedGroups.includes(groupId)
      ? expandedGroups.filter((id) => id !== groupId)
      : [...expandedGroups, groupId];
    setExpandedGroups(newExpanded);
    localStorage.setItem("menuExpandedGroups", JSON.stringify(newExpanded));
  };

  // Expandir grupo automaticamente se item ativo - sempre garantir que grupos principais estejam visíveis
  useEffect(() => {
    const defaultGroups = ["dashboard", "crm", "operacoes", "hub", "administracao"];
    const currentPath = location.pathname;
    let needsUpdate = false;
    const newExpanded = [...expandedGroups];
    
    for (const group of filteredMenuGroups) {
      const hasActiveItem = group.items.some((item) => item.path === currentPath);
      if (hasActiveItem && !expandedGroups.includes(group.id)) {
        newExpanded.push(group.id);
        needsUpdate = true;
      }
    }
    
    // Garantir que grupos principais sempre estejam visíveis
    for (const defaultGroup of defaultGroups) {
      if (!newExpanded.includes(defaultGroup)) {
        newExpanded.push(defaultGroup);
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      setExpandedGroups(newExpanded);
    }
  }, [location.pathname, filteredMenuGroups]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setProfileMenuOpen(false);
    if (profileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [profileMenuOpen]);

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 1023px)");
    const syncSidebarForViewport = () => {
      if (mobileMedia.matches) {
        setSidebarOpen(false);
      }
    };

    syncSidebarForViewport();
    mobileMedia.addEventListener("change", syncSidebarForViewport);

    return () => mobileMedia.removeEventListener("change", syncSidebarForViewport);
  }, [setSidebarOpen]);

  // Obter configuração da página atual
  const currentPage = pageConfig[location.pathname] || { title: "FINQZ PRO", icon: LayoutDashboard };
  const PageIcon = currentPage.icon;
  const currentGroup = filteredMenuGroups.find((group) =>
    group.items.some((item) => item.path === location.pathname)
  );
  const currentArea = currentGroup?.id === "dashboard" ? "Visão geral" : currentGroup?.label || "Workspace";

  const handleLogout = async () => {
    await client.auth.signOut();
    navigate("/");
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // ============================================
  // DESIGN SYSTEM FINQZ - Tema Fintech
  // ============================================
  // Sidebar: secondary-900 (#0F172A)
  // Main: background (#F7F9FC)
  // Topbar: surface (#FFFFFF)
  // Primary: #1D2BFF

  return (
    <div className="finqz-shell flex h-screen overflow-hidden">
      {sidebarOpen && (
        <button
          aria-label="Fechar navegação"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`finqz-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? "w-72 translate-x-0 lg:w-72" : "-translate-x-full lg:w-20"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--sidebar-border)] px-4">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "lg:justify-center lg:w-full"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-base font-bold tracking-tight text-[var(--sidebar-text)]">FINQZ</div>
                <div className="text-[10px] font-semibold uppercase text-[var(--sidebar-muted)]">PRO</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--nav-hover-bg)] hover:text-[var(--sidebar-text)]"
            aria-label={sidebarOpen ? "Recolher navegação" : "Expandir navegação"}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {filteredMenuGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.includes(group.id);
            const isActive = group.items.some((item) => item.path === location.pathname);
            const primaryItem = group.items[0];

            if (!sidebarOpen && primaryItem) {
              return (
                <NavLink
                  key={group.id}
                  to={primaryItem.path}
                  title={group.label}
                  onClick={closeSidebarOnMobile}
                  className={`mb-1 flex h-11 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "finqz-nav-active"
                      : "finqz-nav-idle"
                  }`}
                >
                  <GroupIcon size={19} />
                </NavLink>
              );
            }

            return (
              <div key={group.id} className="space-y-1">
                {group.id === "dashboard" ? (
                  group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebarOnMobile}
                        className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                          isItemActive
                            ? "finqz-nav-active"
                            : "finqz-nav-idle"
                        }`}
                      >
                        <ItemIcon size={17} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })
                ) : (
                  <>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`flex h-9 w-full items-center justify-between rounded-lg px-3 text-xs font-semibold uppercase transition-colors ${
                        isActive
                          ? "finqz-nav-active"
                          : "finqz-nav-idle"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <GroupIcon size={15} />
                        <span className="truncate">{group.label}</span>
                      </span>
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 pl-2">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = location.pathname === item.path;

                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={closeSidebarOnMobile}
                              className={`flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                                isItemActive
                                  ? "finqz-nav-active"
                                  : "finqz-nav-idle"
                              }`}
                            >
                              <ItemIcon size={16} />
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[var(--sidebar-border)] p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProfileMenuOpen(!profileMenuOpen);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--nav-hover-bg)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-sm shadow-primary/20">
              {user?.name?.charAt(0) || "U"}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--sidebar-text)]">
                  {user?.name || "Usuário"}
                </p>
                <p className="truncate text-xs text-[var(--sidebar-muted)]">
                  {user?.email || "usuario@finqz.com"}
                </p>
              </div>
            )}
          </button>

          {profileMenuOpen && sidebarOpen && (
            <div className="finqz-menu absolute bottom-16 left-4 right-4 z-50">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </aside>

      <main
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${
          sidebarOpen ? "lg:ml-72" : "lg:ml-20"
        }`}
      >
        <header className="finqz-topbar flex min-h-16 items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Abrir navegação"
            >
              <Menu size={18} />
            </button>
            <div className="finqz-icon-badge h-10 w-10">
              <PageIcon size={19} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase text-[var(--text-muted)]">{currentArea}</p>
              <h1 className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)] sm:text-lg">
                {currentPage.title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)] shadow-sm md:flex">
              <Shield size={14} className="text-emerald-500 dark:text-emerald-300" />
              Enterprise
            </div>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              title="Notificações"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-transparent">
          <div className="px-4 py-5 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};
