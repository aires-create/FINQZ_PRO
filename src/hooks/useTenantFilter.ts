// FINQZ PRO - Tenant Filter Hook
// Hook para filtragem de dados baseada no escopo do usuário
// CRÍTICO: Esta filtragem acontece no frontend como camada adicional de segurança

import { useMemo } from 'react';
import { getScopedData, TenantAware } from '../utils/tenant';
import useAppStore from '../store';

/**
 * Hook para filtrar dados baseado no escopo do usuário
 * 
 * @param data - Array de dados para filtrar
 * @returns Dados filtrados conforme o escopo do usuário
 * 
 * Uso:
 * const filteredClientes = useTenantFilter(clientes);
 * const filteredOportunidades = useTenantFilter(oportunidades);
 */
export const useTenantFilter = <T extends TenantAware>(data: T[]): T[] => {
  // Use user from store instead of AuthProvider to avoid context mismatch
  const user = useAppStore((state) => state.user);

  // Protection: ensure data is always an array
  const safeData = data || [];

  const filteredData = useMemo(() => {
    return getScopedData(user, safeData);
  }, [user, safeData]);

  return filteredData;
};

/**
 * Hook para verificar se o usuário pode acessar um registro específico
 * 
 * @param record - Registro para verificar
 * @returns true se o usuário pode acessar
 */
export const useCanAccessRecord = <T extends TenantAware>(record: T | null): boolean => {
  // Use user from store instead of AuthProvider to avoid context mismatch
  const user = useAppStore((state) => state.user);

  if (!record) return false;
  if (!user) return false;

  // Admin tem acesso a tudo
  if (user.role === 'ROLE_ADMIN_SISTEMA' || user.scope === 'GLOBAL') {
    return true;
  }

  const userScope = user.scope || 'OWN';

  switch (userScope) {
    case 'GLOBAL':
      return true;

    case 'COMPANY':
      return record.tenant_id === user.tenant_id || !record.tenant_id;

    case 'FRANQUIA':
      return record.franquia_id === user.parceiroId || record.franqueado_id === user.parceiroId;

    case 'FRANQUEADO':
      return record.franqueado_id === user.parceiroId || (record as unknown as { parceiro_id?: number }).parceiro_id === user.parceiroId;

    case 'OWN':
      return record.owner_id === user.id;

    default:
      return false;
  }
};

/**
 * Hook para obter o escopo atual do usuário
 * Útil para exibir informações na UI
 */
export const useUserScope = () => {
  // Use user from store instead of AuthProvider to avoid context mismatch
  const user = useAppStore((state) => state.user);

  return {
    scope: user?.scope || 'OWN',
    tenantId: user?.tenant_id,
    parceiroId: user?.parceiroId,
    isAdmin: user?.role === 'ROLE_ADMIN_SISTEMA',
    isGlobal: user?.scope === 'GLOBAL',
  };
};

export default useTenantFilter;
