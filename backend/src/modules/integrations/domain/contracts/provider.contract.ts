export type IntegrationConnectionStatus = {
  connected: boolean;
  status?: number;
  message?: string;
  error?: string;
};

export interface IntegrationProvider {
  healthCheck(): Promise<boolean>;
  testConnection(): Promise<IntegrationConnectionStatus>;
}
