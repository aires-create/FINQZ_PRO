import type { SimulationResult } from '../contracts/simulation.contract.js';
import type { LegacySimulationResult } from './legacy-simulation.types.js';

const getResultValue = (result: SimulationResult, key: string): number => {
  const item = result.result.find((entry) => entry.key === key);
  return typeof item?.value === 'number' ? item.value : 0;
};

export const simulationResultToLegacySimulationResultMapper = (
  result: SimulationResult,
): LegacySimulationResult => ({
  requestId: result.execution?.requestId,
  simulationId: result.snapshot.snapshotId,
  opportunityId: result.opportunity?.id,
  tenantId: result.tenant.id,
  productId: result.product.id,
  productCode: result.product.code,
  productName: result.product.name,
  subproductId: result.subproduct.id,
  subproductCode: result.subproduct.code,
  subproductName: result.subproduct.name,
  requestedAmount: getResultValue(result, 'requestedAmount'),
  term: getResultValue(result, 'term'),
  monthlyRate: getResultValue(result, 'monthlyRate'),
  installmentAmount: getResultValue(result, 'installmentAmount'),
  totalAmount: getResultValue(result, 'totalAmount'),
  coefficient: getResultValue(result, 'coefficient'),
  status:
    result.decision.status === 'APPROVED'
      ? 'valida'
      : result.decision.status === 'NEEDS_REVIEW'
        ? 'atencao'
        : result.decision.status === 'REJECTED'
          ? 'inviavel'
          : 'incompleto',
  message: result.decision.message,
  metadata: result.metadata.updatedAt
    ? { ...result.metadata, updatedAt: result.metadata.updatedAt }
    : { ...result.metadata },
  version: result.versioning?.version,
  revision: result.versioning?.revision,
  createdAt: result.metadata.createdAt,
  updatedAt: result.metadata.updatedAt,
});
