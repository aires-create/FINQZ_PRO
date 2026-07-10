import { createSimulationProductCapability } from '../base/index.js';

export const loanWithCollateralCapabilities = createSimulationProductCapability({
  names: ['vehicle', 'property', 'provider', 'guarantor'],
});

