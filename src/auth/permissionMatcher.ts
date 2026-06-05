const ACTION_ALIAS_MAP: Record<string, string[]> = {
  read: ["read", "view"],
  view: ["view", "read"],
  create: ["create"],
  edit: ["edit", "update"],
  delete: ["delete"],
  export: ["export"],
  move: ["move", "move_stage", "move_card", "move_opportunity"],
  move_stage: ["move_stage", "move", "move_card", "move_opportunity"],
  move_card: ["move_card", "move", "move_stage", "move_opportunity"],
  move_opportunity: ["move_opportunity", "move", "move_stage", "move_card"],
};

const MODULE_ALIAS_MAP: Record<string, string[]> = {
  customer: ["customer", "clientes", "parceiros"],
  sales: ["sales", "oportunidades", "estrutura_comercial", "tabelas_comerciais"],
  report: ["report", "relatorios"],
  finance: ["finance", "financeiro", "conta_corrente"],
  audit: ["audit", "auditoria"],
  simulador: ["simulador"],
  system: ["system", "configuracoes", "geral", "tags", "pipelines", "integracoes", "automacoes", "notificacoes", "seguranca", "bancos"],
  system_users: ["system_users", "usuarios"],
  system_roles: ["system_roles", "permissoes"],
  sdr_ia: ["sdr_ia"],
  opportunity: ["opportunity", "oportunidades"],
  oportunidades: ["oportunidades", "opportunity"],
};

export const buildPermissionVariants = (permission?: string): string[] => {
  if (!permission) return [];

  const normalizedPermission = permission.toLowerCase();
  const variants = new Set<string>([
    permission,
    normalizedPermission,
    normalizedPermission.replace(':read', ''),
    normalizedPermission.replace(':read', ':*'),
    normalizedPermission.replace(':read', ':view'),
    normalizedPermission.replace(':view', ':read'),
    normalizedPermission.replace(':view', ''),
    normalizedPermission.replace(':view', ':*'),
  ]);

  if (normalizedPermission.includes(':')) {
    const [moduleName, actionName = 'read'] = normalizedPermission.split(':');
    const aliases = ACTION_ALIAS_MAP[actionName] || [actionName];
    const moduleAliases = MODULE_ALIAS_MAP[moduleName] || [moduleName];

    moduleAliases.forEach((moduleAlias) => {
      aliases.forEach((alias) => {
        variants.add(`${moduleAlias}:${alias}`);
        variants.add(`${moduleAlias.toUpperCase()}_${alias.toUpperCase()}`);
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
