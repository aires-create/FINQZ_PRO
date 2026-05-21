export type IntegrationErrorCode =
  | 'INTEGRATION_ERROR'
  | 'PROVIDER_CAPABILITY_NOT_SUPPORTED'
  | 'PROVIDER_CONFIGURATION_ERROR'
  | 'PROVIDER_CONNECTION_ERROR'
  | 'PROVIDER_NOT_FOUND';

type IntegrationErrorParams = {
  code: IntegrationErrorCode;
  message: string;
};

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;

  constructor(params: IntegrationErrorParams) {
    super(params.message);
    this.name = new.target.name;
    this.code = params.code;
  }
}
