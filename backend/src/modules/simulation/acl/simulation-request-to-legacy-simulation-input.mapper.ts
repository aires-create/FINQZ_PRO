import type { SimulationRequest } from '../contracts/simulation.contract.js';
import type { LegacySimulationInput } from './legacy-simulation.types.js';
import type { SimulationBridgeContext } from './simulation-bridge-context.js';

const getPrimaryGuaranteeAsset = (request: SimulationRequest) => {
  const vehicleGuarantee = request.guarantees.find((guarantee) => guarantee.kind === 'vehicle');
  return vehicleGuarantee?.asset ?? request.vehicle ?? request.property;
};

export const simulationRequestToLegacySimulationInputMapper = (
  request: SimulationRequest,
  contextInput: Partial<SimulationBridgeContext> = {},
): LegacySimulationInput => {
  const primaryAsset = getPrimaryGuaranteeAsset(request);
  const parameters = request.parameters ?? {};
  const product = request.product;
  const subproduct = request.subproduct;
  const tenant = request.tenant;

  const legacyInput: LegacySimulationInput = {
    tenantId: contextInput.tenantId ?? tenant.id,
    opportunityId: contextInput.opportunityId ?? request.opportunity?.id,
    simulationId: contextInput.simulationId ?? request.execution?.snapshotId,
    requestId: contextInput.requestId ?? request.execution?.requestId,
    executionId: contextInput.executionId ?? request.execution?.executionId,
    correlationId: contextInput.correlationId ?? request.execution?.correlationId,
    source: contextInput.source ?? request.metadata.origin ?? 'simulation-bridge',
    compatibilityMode: contextInput.compatibilityMode ?? request.metadata.compatibilityMode,
    bankCode: tenant.code ?? undefined,
    bankName: tenant.name ?? undefined,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    subproductId: subproduct.id,
    subproductCode: subproduct.code,
    subproductName: subproduct.name,
    agreementCode: request.agreement?.code,
    agreementName: request.agreement?.name,
    operationType: 'new_loan',
    productType: 'vehicle_financing',
    verticalType: request.commercial?.workflow as never,
    simulationType: undefined,
    customerType: undefined,
    customerName: request.customer.name,
    customerDocument: request.customer.document,
    customerEmail: request.customer.email,
    customerPhone: request.customer.phone,
    participants: request.participants.map((participant) => ({
      id: participant.id,
      role: participant.role,
      name: participant.name,
      document: participant.document,
      email: participant.email,
      phone: participant.phone,
      tenantId: participant.tenantId,
      metadata: participant.metadata ? { ...participant.metadata } : undefined,
    })),
    guarantees: request.guarantees.map((guarantee) => ({
      id: guarantee.id,
      kind: guarantee.kind,
      label: guarantee.label,
      value: guarantee.value,
      priority: guarantee.priority,
      asset: guarantee.asset
        ? {
            id: guarantee.asset.id,
            kind: guarantee.asset.kind,
            label: guarantee.asset.label,
            value: guarantee.asset.value,
            brand: guarantee.asset.brand,
            model: guarantee.asset.model,
            year: guarantee.asset.year,
            plate: guarantee.asset.plate,
            chassi: guarantee.asset.chassi,
            metadata: guarantee.asset.metadata ? { ...guarantee.asset.metadata } : undefined,
          }
        : undefined,
      metadata: guarantee.metadata ? { ...guarantee.metadata } : undefined,
    })),
    vehicle: request.vehicle
      ? {
          id: request.vehicle.id,
          kind: request.vehicle.kind,
          label: request.vehicle.label,
          value: request.vehicle.value,
          brand: request.vehicle.brand,
          model: request.vehicle.model,
          year: request.vehicle.year,
          plate: request.vehicle.plate,
          chassi: request.vehicle.chassi,
          metadata: request.vehicle.metadata ? { ...request.vehicle.metadata } : undefined,
        }
      : undefined,
    property: request.property
      ? {
          id: request.property.id,
          kind: request.property.kind,
          label: request.property.label,
          value: request.property.value,
          brand: request.property.brand,
          model: request.property.model,
          year: request.property.year,
          plate: request.property.plate,
          chassi: request.property.chassi,
          metadata: request.property.metadata ? { ...request.property.metadata } : undefined,
        }
      : undefined,
    requestedAmount: parameters.requestedAmount ?? 0,
    term: parameters.term ?? 0,
    monthlyRate: parameters.monthlyRate ?? 0,
    incomeMonthlyValue: request.income?.monthlyValue,
    incomeCurrency: request.income?.currency,
    incomeSource: request.income?.source,
    metadata: request.metadata.updatedAt
      ? {
          ...request.metadata,
          updatedAt: request.metadata.updatedAt,
          compatibilityMode: request.metadata.compatibilityMode,
        }
      : {
          ...request.metadata,
        },
    version: request.versioning.version,
    revision: request.versioning.revision,
    createdAt: request.metadata.createdAt,
    updatedAt: request.metadata.updatedAt,
  };

  if (primaryAsset && !legacyInput.vehicle && !legacyInput.property) {
    legacyInput.vehicle = {
      id: primaryAsset.id,
      kind: primaryAsset.kind,
      label: primaryAsset.label,
      value: primaryAsset.value,
      brand: primaryAsset.brand,
      model: primaryAsset.model,
      year: primaryAsset.year,
      plate: primaryAsset.plate,
      chassi: primaryAsset.chassi,
      metadata: primaryAsset.metadata ? { ...primaryAsset.metadata } : undefined,
    };
  }

  return legacyInput;
};

