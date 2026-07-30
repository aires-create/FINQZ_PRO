import type { SimulationProductCapabilityName } from './simulation-product.types.js';

export interface SimulationProductCapability {
  readonly names: readonly SimulationProductCapabilityName[];
  supportsVehicle(): boolean;
  supportsProperty(): boolean;
  supportsFGTS(): boolean;
  supportsPayroll(): boolean;
  supportsEnergy(): boolean;
  supportsInsurance(): boolean;
  supportsGuarantor(): boolean;
  supportsProvider(): boolean;
}

export interface SimulationProductCapabilityInput {
  readonly names?: readonly SimulationProductCapabilityName[];
}

const hasCapability = (
  names: readonly SimulationProductCapabilityName[],
  capability: SimulationProductCapabilityName,
): boolean => names.includes(capability);

export const createSimulationProductCapability = (
  input: SimulationProductCapabilityInput = {},
): SimulationProductCapability => {
  const names = input.names ?? [];

  return {
    names,
    supportsVehicle: () => hasCapability(names, 'vehicle'),
    supportsProperty: () => hasCapability(names, 'property'),
    supportsFGTS: () => hasCapability(names, 'fgts'),
    supportsPayroll: () => hasCapability(names, 'payroll'),
    supportsEnergy: () => hasCapability(names, 'energy'),
    supportsInsurance: () => hasCapability(names, 'insurance'),
    supportsGuarantor: () => hasCapability(names, 'guarantor'),
    supportsProvider: () => hasCapability(names, 'provider'),
  };
};
