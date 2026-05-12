export const tenantFilter = (tenantId: string) => ({ tenantId });

export const tenantScope = <T extends Record<string, any>>(query: T, tenantId: string) => ({
  ...query,
  where: {
    ...query.where,
    tenantId,
  },
});
