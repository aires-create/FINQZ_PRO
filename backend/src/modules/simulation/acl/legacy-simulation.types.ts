import type {
  SimulationOperationType,
  SimulationProductType,
  SimulationType,
  SimulationVerticalType,
  CustomerType,
} from '../domain/contracts/simulation.contract.js';
import type {
  SimulationAssetKind,
  SimulationCompatibilityMode,
  SimulationCollateralKind,
  SimulationPartyRole,
} from '../types/simulation.types.js';

export interface LegacySimulationAssetInput {
  id?: string | undefined;
  kind?: SimulationAssetKind | undefined;
  label?: string | undefined;
  value?: number | undefined;
  brand?: string | undefined;
  model?: string | undefined;
  year?: number | undefined;
  plate?: string | undefined;
  chassi?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface LegacySimulationCollateralInput {
  id?: string | undefined;
  kind?: SimulationCollateralKind | undefined;
  label?: string | undefined;
  value?: number | undefined;
  priority?: number | undefined;
  asset?: LegacySimulationAssetInput | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface LegacySimulationParticipantInput {
  id?: string | undefined;
  role?: SimulationPartyRole | undefined;
  name: string;
  document?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  tenantId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface LegacySimulationInput {
  tenantId: string;
  opportunityId?: string | undefined;
  simulationId?: string | undefined;
  requestId?: string | undefined;
  executionId?: string | undefined;
  correlationId?: string | undefined;
  requestHash?: string | undefined;
  source?: string | undefined;
  compatibilityMode?: SimulationCompatibilityMode | undefined;
  bankCode?: string | undefined;
  bankName?: string | undefined;
  productId?: string | undefined;
  productCode?: string | undefined;
  productName?: string | undefined;
  subproductId?: string | undefined;
  subproductCode?: string | undefined;
  subproductName?: string | undefined;
  agreementCode?: string | undefined;
  agreementName?: string | undefined;
  operationType: SimulationOperationType;
  productType: SimulationProductType;
  verticalType?: SimulationVerticalType | undefined;
  simulationType?: SimulationType | undefined;
  customerType?: CustomerType | undefined;
  customerName?: string | undefined;
  customerDocument?: string | undefined;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  participants?: LegacySimulationParticipantInput[] | undefined;
  guarantees?: LegacySimulationCollateralInput[] | undefined;
  vehicle?: LegacySimulationAssetInput | undefined;
  property?: LegacySimulationAssetInput | undefined;
  requestedAmount: number;
  term: number;
  monthlyRate: number;
  incomeMonthlyValue?: number | undefined;
  incomeCurrency?: string | undefined;
  incomeSource?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  version?: string | undefined;
  revision?: number | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface LegacySimulationResult {
  requestId?: string | undefined;
  simulationId?: string | undefined;
  opportunityId?: string | undefined;
  tenantId?: string | undefined;
  productId?: string | undefined;
  productCode?: string | undefined;
  productName?: string | undefined;
  subproductId?: string | undefined;
  subproductCode?: string | undefined;
  subproductName?: string | undefined;
  requestedAmount: number;
  term: number;
  monthlyRate: number;
  installmentAmount: number;
  totalAmount: number;
  coefficient: number;
  status?: string | undefined;
  message?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  version?: string | undefined;
  revision?: number | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}
