export type RequestNumberGeneratorInput = {
  tenantId: string;
  requestedAt: Date;
  tenantCode?: string;
};

export type GeneratedRequestNumber = {
  requestNumber: string;
  year: number;
  sequence: number;
};

export interface RequestNumberGenerator {
  next(input: RequestNumberGeneratorInput): Promise<GeneratedRequestNumber>;
}
