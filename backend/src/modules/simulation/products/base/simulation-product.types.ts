export const simulationProductCapabilityNames = [
  'vehicle',
  'property',
  'fgts',
  'payroll',
  'energy',
  'insurance',
  'guarantor',
  'provider',
] as const;

export type SimulationProductCapabilityName =
  (typeof simulationProductCapabilityNames)[number];

export type SimulationProductValidationSeverity = 'info' | 'warning' | 'error';

export interface SimulationProductValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: SimulationProductValidationSeverity;
}

export interface SimulationProductValidationResult {
  readonly valid: boolean;
  readonly issues: SimulationProductValidationIssue[];
}
