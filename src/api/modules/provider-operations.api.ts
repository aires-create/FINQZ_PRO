import { apiCall } from "./base";

export type ProviderOperationsRuntimeStatus =
  | "ok"
  | "degraded"
  | "down"
  | "disabled"
  | "idle";

export type ProviderOperationsCapabilitySupport = boolean | "planned";

export type ProviderOperationsCapabilities = {
  initialSimulation: ProviderOperationsCapabilitySupport;
  marginInquiry: ProviderOperationsCapabilitySupport;
  rateTables: ProviderOperationsCapabilitySupport;
  proposalPipeline: ProviderOperationsCapabilitySupport;
  commissions: ProviderOperationsCapabilitySupport;
  commissionPayout: ProviderOperationsCapabilitySupport;
  dataEnrichment: ProviderOperationsCapabilitySupport;
  messageSender: ProviderOperationsCapabilitySupport;
  bulkMessaging: ProviderOperationsCapabilitySupport;
  webhooks: ProviderOperationsCapabilitySupport;
};

export type ProviderOperationsIssue = {
  providerKey: string;
  capability: string;
  status: "degraded" | "down";
  sanitizedErrorCode?: string;
  lastFailureAt?: string;
  latencyMs?: number;
};

export type ProviderOperationsProvider = {
  providerKey: string;
  status: "ok" | "degraded" | "down" | "disabled" | "unknown";
  connectivityStatus: "ok" | "degraded" | "down" | "disabled" | "unknown";
  authStatus: "ok" | "failed" | "unknown";
  lastLatencyMs?: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastErrorCode?: string;
  capabilities: ProviderOperationsCapabilities | null;
  capabilityHealth: Array<{
    capability: string;
    status: "ok" | "degraded" | "down" | "disabled";
    lastLatencyMs?: number;
    lastSuccessAt?: string;
    lastFailureAt?: string;
    lastErrorCode?: string;
  }>;
};

export type ProviderOperationsConsole = {
  generatedAt: string;
  runtimeStatus: ProviderOperationsRuntimeStatus;
  summary: {
    generatedAt: string;
    totalProviders: number;
    healthy: number;
    degraded: number;
    down: number;
    disabled: number;
    averageLatencyMs?: number;
  };
  providers: ProviderOperationsProvider[];
  issues: ProviderOperationsIssue[];
  capabilities: Record<string, ProviderOperationsCapabilities>;
  counts: {
    degraded: number;
    down: number;
    disabled: number;
  };
};

type ProviderOperationsConsoleEnvelope = {
  success: boolean;
  data?: ProviderOperationsConsole;
};

export const providerOperationsApi = {
  async getConsoleSnapshot(): Promise<ProviderOperationsConsole> {
    const response = await apiCall<ProviderOperationsConsoleEnvelope>(
      "/integrations/operations/console",
    );

    if (!response.success || !response.data) {
      throw new Error("Erro ao carregar console operacional de providers.");
    }

    return response.data;
  },
};
