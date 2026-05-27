import { finqzClient } from "../finqzClient";

export type ProviderPayloadDiagnosticsIssue = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  path?: string;
};

export type ProviderPayloadDiagnostics = {
  providerKey: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: ProviderPayloadDiagnosticsIssue[];
  unknownStatuses: string[];
};

type PayloadDiagnosticsEnvelope = {
  success: boolean;
  data: ProviderPayloadDiagnostics;
};

export const getProviderPayloadDiagnostics = async (
  providerKey: string,
): Promise<ProviderPayloadDiagnostics> => {
  const response = await finqzClient.get<PayloadDiagnosticsEnvelope>(
    `/api/v1/integrations/providers/${providerKey}/payload-diagnostics`,
  );

  if (!response.data?.success || !response.data?.data) {
    throw new Error("Erro ao carregar diagnóstico de payload.");
  }

  return response.data.data;
};
