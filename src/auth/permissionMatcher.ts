const ACTION_ALIAS_MAP: Record<string, string[]> = {
  read: ["READ", "VIEW"],
  view: ["VIEW", "READ"],
  create: ["CREATE"],
  edit: ["EDIT", "UPDATE"],
  delete: ["DELETE"],
  export: ["EXPORT"],
};

const MODULE_ALIAS_MAP: Record<string, string[]> = {
  customer: ["CUSTOMER", "CLIENTES", "PARCEIROS"],
  sales: ["SALES", "OPORTUNIDADES", "ESTRUTURA_COMERCIAL", "TABELAS_COMERCIAIS"],
  report: ["REPORT", "RELATORIOS"],
  finance: ["FINANCE", "FINANCEIRO", "CONTA_CORRENTE"],
  audit: ["AUDIT", "AUDITORIA"],
  simulador: ["SIMULADOR"],
  system: ["SYSTEM", "CONFIGURACOES", "GERAL", "TAGS", "PIPELINES", "INTEGRACOES", "AUTOMACOES", "NOTIFICACOES", "SEGURANCA", "BANCOS"],
  system_users: ["SYSTEM_USERS", "USUARIOS"],
  system_roles: ["SYSTEM_ROLES", "PERMISSOES"],
  sdr_ia: ["SDR_IA"],
};

export const buildPermissionVariants = (permission?: string): string[] => {
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
    const moduleAliases = MODULE_ALIAS_MAP[moduleName] || [moduleName.toUpperCase()];

    moduleAliases.forEach((moduleAlias) => {
      aliases.forEach((alias) => {
        variants.add(`${moduleAlias}_${alias}`);
      });
    });
  }

  return Array.from(variants);
};

export const hasPermissionMatch = (
  userPermissions: string[],
  requiredPermission?: string,
): boolean => {
  if (!requiredPermission || userPermissions.length === 0 || userPermissions.includes("*")) {
    return true;
  }

  const variants = buildPermissionVariants(requiredPermission);
  return userPermissions.some((permission) => {
    const normalizedPermission = String(permission).toUpperCase();
    return variants.some((variant) => variant.toUpperCase() === normalizedPermission);
  });
};
