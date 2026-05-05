// FINQZ PRO - Permissions Hook
import useAppStore from "./store";
import { PROFILE_PERMISSIONS } from "../types";

/**
 * Hook principal para verificações de permissão RBAC
 * 
 * Uso:
 * const { can } = useCan();
 * 
 * if (can('clientes', 'edit')) {
 *   // usuário pode editar clientes
 * }
 */
export const useCan = () => {
  const { user, userPermissions, hasPermission, setUserPermissions } = useAppStore();

  // Inicializa permissões baseado no perfil do usuário
  const initPermissions = (perfil: string) => {
    // Admin tem acesso total
    if (perfil === 'admin') {
      setUserPermissions({ '*': ['*'] });
      return;
    }

    // Usa permissões padrão do perfil
    const profilePerms = PROFILE_PERMISSIONS[perfil];
    if (profilePerms) {
      setUserPermissions(profilePerms);
    }
  };

  // Atualiza permissão específica
  const updatePermission = (module: string, actions: string[]) => {
    setUserPermissions({
      ...userPermissions,
      [module]: actions,
    });
  };

  /**
   * Verifica se o usuário tem permissão para uma ação em um módulo
   * @param module - Nome do módulo (clientes, oportunidades, parceiros, etc)
   * @param action - Ação desejada (read, create, edit, delete, export, move)
   * @returns true se tem permissão, false caso contrário
   */
  const can = (module: string, action: string): boolean => {
    // Admin sempre tem acesso
    if (user?.perfil === 'admin') return true;
    
    // Usa a função hasPermission do store
    return hasPermission(module, action);
  };

  return {
    can,
    hasPermission,
    initPermissions,
    updatePermission,
    userPermissions,
    isAdmin: user?.perfil === 'admin',
  };
};

// Mantém compatibilidade com código existente
export const usePermission = useCan;

export default useCan;
