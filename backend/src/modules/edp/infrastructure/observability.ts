export interface EdpObservabilityHookData {
  component: string;
  route: string;
  method: string;
  correlationId: string;
  tenantId: string | null;
}

export const createEdpObservabilitySnapshot = (
  data: EdpObservabilityHookData,
) => ({
  component: data.component,
  route: data.route,
  method: data.method,
  correlationId: data.correlationId,
  tenantId: data.tenantId,
  status: 'foundation',
});
