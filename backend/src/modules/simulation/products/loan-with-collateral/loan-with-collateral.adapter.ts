import type {
  SimulationAudit,
  SimulationMetadata,
  SimulationProposal,
  SimulationRanking,
  SimulationRequest,
  SimulationResult,
  SimulationSnapshotReference,
} from '../../contracts/simulation.contract.js';
import { createSimulationSnapshot } from '../../snapshots/simulation-snapshot.factory.js';
import { createSimulationExecutionEnvelope } from '../../execution/simulation-execution-envelope.factory.js';
import { createSimulationSnapshotReference } from '../../value-objects/simulation-snapshot-reference.value-object.js';
import type { SimulationProductAdapter } from '../base/index.js';
import type { SimulationProductContext } from '../base/index.js';
import { createSimulationProductValidationResult } from '../base/index.js';
import { loanWithCollateralCapabilities } from './loan-with-collateral.capability.js';
import { loanWithCollateralMetadata } from './loan-with-collateral.metadata.js';
import { LoanWithCollateralValidator } from './loan-with-collateral.validator.js';
import { loanWithCollateralSubflowRegistry } from './subflows/index.js';
import type { LegacySimulationResult } from '../../acl/legacy-simulation.types.js';
import { simulationRequestToLegacySimulationInputMapper } from '../../acl/simulation-request-to-legacy-simulation-input.mapper.js';
import { legacySimulationResultToSimulationResultMapper } from '../../acl/legacy-simulation-result-to-simulation-result.mapper.js';
import { SimulateOperationUseCase } from '../../application/simulate-operation.use-case.js';
import type { SimulationBridgeContext } from '../../acl/simulation-bridge-context.js';
import { createSimulationBridgeContext } from '../../acl/simulation-bridge-context.js';
import { masterCatalogRuntime } from '../../../master-catalog/application/master-catalog.runtime.js';

const getResultNumber = (result: SimulationResult, key: string): number => {
  const item = result.result.find((entry) => entry.key === key);
  return typeof item?.value === 'number' ? item.value : 0;
};

const toLegacySimulationRequest = (request: SimulationRequest) => {
  const parameters = request.parameters ?? {};
  const legacyRequest: {
    bankCode: string;
    productCode: string;
    productName: string;
    agreementCode: string;
    agreementName: string;
    operationType: 'refinancing';
    productType: 'vehicle_financing';
    verticalType: 'veiculo';
    simulationType: 'CREDIT';
    customerType: 'PF';
    requestedAmount: number;
    term: number;
    monthlyRate: number;
    bankName?: string;
  } = {
    bankCode: request.tenant.code ?? request.tenant.id,
    productCode: request.product.code,
    productName: request.product.name,
    agreementCode: request.subproduct.code,
    agreementName: request.subproduct.name,
    operationType: 'refinancing',
    productType: 'vehicle_financing',
    verticalType: 'veiculo',
    simulationType: 'CREDIT',
    customerType: 'PF',
    requestedAmount: parameters.requestedAmount ?? 0,
    term: parameters.term ?? 0,
    monthlyRate: parameters.monthlyRate ?? 0,
  };

  if (request.tenant.name) {
    legacyRequest.bankName = request.tenant.name;
  }

  return legacyRequest;
};

const buildBridgeContext = (context: SimulationProductContext): SimulationBridgeContext => createSimulationBridgeContext({
  ...(context.bridgeContext ?? {}),
  tenantId: context.bridgeContext?.tenantId ?? context.request.tenant.id,
  opportunityId: context.bridgeContext?.opportunityId ?? context.request.opportunity?.id ?? 'legacy-opportunity',
  simulationId: context.bridgeContext?.simulationId ?? context.request.execution?.snapshotId ?? 'legacy-simulation',
  executionId: context.bridgeContext?.executionId ?? context.request.execution?.executionId ?? 'legacy-execution',
  correlationId: context.bridgeContext?.correlationId ?? context.request.execution?.correlationId ?? 'legacy-correlation',
  source: context.bridgeContext?.source ?? context.request.metadata.origin ?? 'simulation-bridge',
  compatibilityMode: context.bridgeContext?.compatibilityMode ?? context.request.metadata.compatibilityMode,
  catalogVersion: context.bridgeContext?.catalogVersion ?? context.request.metadata.catalogVersion,
  engineVersion: context.bridgeContext?.engineVersion ?? context.request.metadata.engineVersion,
  policyVersion: context.bridgeContext?.policyVersion ?? context.request.metadata.policyVersion,
  strategyVersion: context.bridgeContext?.strategyVersion ?? context.request.metadata.strategyVersion,
  createdAt: context.bridgeContext?.createdAt ?? context.request.metadata.createdAt,
});

const buildLegacyResult = (
  request: SimulationRequest,
  legacyOutput: Awaited<ReturnType<SimulateOperationUseCase['execute']>>,
  bridgeContext: SimulationBridgeContext,
): LegacySimulationResult => ({
  requestId: bridgeContext.requestId,
  simulationId: bridgeContext.simulationId,
  opportunityId: bridgeContext.opportunityId,
  tenantId: bridgeContext.tenantId,
  productId: request.product.id,
  productCode: request.product.code,
  productName: request.product.name,
  subproductId: request.subproduct.id,
  subproductCode: request.subproduct.code,
  subproductName: request.subproduct.name,
  requestedAmount: legacyOutput.requestedAmount,
  term: legacyOutput.term,
  monthlyRate: legacyOutput.monthlyRate,
  installmentAmount: legacyOutput.installmentAmount,
  totalAmount: legacyOutput.totalAmount,
  coefficient: legacyOutput.coefficient,
  status: 'valida',
  metadata: {
    compatibilityMode: bridgeContext.compatibilityMode,
    origin: bridgeContext.source,
    createdAt: bridgeContext.createdAt,
    engineVersion: bridgeContext.engineVersion,
    catalogVersion: bridgeContext.catalogVersion,
    policyVersion: bridgeContext.policyVersion,
    strategyVersion: bridgeContext.strategyVersion,
  },
  version: bridgeContext.engineVersion,
  createdAt: bridgeContext.createdAt,
  updatedAt: bridgeContext.createdAt,
});

const createLegacyResultFromCanonical = (
  request: SimulationRequest,
  result: SimulationResult,
  bridgeContext: SimulationBridgeContext,
): LegacySimulationResult => {
  const parameters = request.parameters ?? {};

  return {
    requestId: bridgeContext.requestId,
    simulationId: bridgeContext.simulationId,
    opportunityId: bridgeContext.opportunityId,
    tenantId: bridgeContext.tenantId,
    productId: request.product.id,
    productCode: request.product.code,
    productName: request.product.name,
    subproductId: request.subproduct.id,
    subproductCode: request.subproduct.code,
    subproductName: request.subproduct.name,
    requestedAmount: getResultNumber(result, 'requestedAmount') || parameters.requestedAmount || 0,
    term: getResultNumber(result, 'term') || parameters.term || 0,
    monthlyRate: getResultNumber(result, 'monthlyRate') || parameters.monthlyRate || 0,
    installmentAmount: getResultNumber(result, 'installmentAmount'),
    totalAmount: getResultNumber(result, 'totalAmount'),
    coefficient: getResultNumber(result, 'coefficient'),
    status: 'valida',
    metadata: {
      compatibilityMode: bridgeContext.compatibilityMode,
      origin: bridgeContext.source,
      createdAt: bridgeContext.createdAt,
      updatedAt: bridgeContext.createdAt,
      engineVersion: bridgeContext.engineVersion,
      catalogVersion: bridgeContext.catalogVersion,
      policyVersion: bridgeContext.policyVersion,
      strategyVersion: bridgeContext.strategyVersion,
    },
    version: bridgeContext.engineVersion,
    createdAt: bridgeContext.createdAt,
    updatedAt: bridgeContext.createdAt,
  };
};

const normalizeProduct = async (
  context: SimulationProductContext,
): Promise<SimulationProductContext> => {
  const request = context.request;
  const parameters = request.parameters ?? {};
  const masterCatalog = context.masterCatalog ?? masterCatalogRuntime;
  const product = await masterCatalog.findProductByCode({
    tenantId: request.tenant.id,
    code: request.product.code,
  });
  const subproduct = await masterCatalog.findSubproductByCode({
    tenantId: request.tenant.id,
    productId: request.product.id,
    code: request.subproduct.code,
  });

  return {
    ...context,
    request: {
      ...request,
      product: {
        ...request.product,
        ...(product ? { id: product.id, name: product.name } : {}),
      },
      subproduct: {
        ...request.subproduct,
        ...(subproduct ? { id: subproduct.id, name: subproduct.name } : {}),
      },
    },
  };
};

const mergeValidationResults = (
  ...results: Awaited<ReturnType<LoanWithCollateralValidator['validate']>>[]
) => {
  const issues = results.flatMap((result) => result.issues);

  return createSimulationProductValidationResult(
    issues.every((issue) => issue.severity !== 'error'),
    issues,
  );
};

export class LoanWithCollateralAdapter implements SimulationProductAdapter {
  readonly kind = 'loan-with-collateral';

  readonly metadata = loanWithCollateralMetadata;

  readonly capability = loanWithCollateralCapabilities;

  private readonly validator = new LoanWithCollateralValidator();

  private readonly legacyEngine = new SimulateOperationUseCase();

  resolveSubflow(context: SimulationProductContext) {
    return loanWithCollateralSubflowRegistry.resolveFromContext(context);
  }

  identify(context: SimulationProductContext): boolean {
    return this.supports(context);
  }

  supports(context: SimulationProductContext): boolean {
    return Boolean(this.resolveSubflow(context));
  }

  validate(context: SimulationProductContext) {
    const structural = this.validator.validate(context);
    const subflow = this.resolveSubflow(context);

    if (!subflow) {
      return Promise.resolve(
        mergeValidationResults(
          structural,
          createSimulationProductValidationResult(false, [
            {
              code: 'SUBFLOW_UNKNOWN',
              message: 'Loan with collateral subflow is not supported',
              severity: 'error',
            },
          ]),
        ),
      );
    }

    return Promise.resolve(
      mergeValidationResults(structural, subflow.validate(context)),
    );
  }

  async normalize(context: SimulationProductContext): Promise<SimulationProductContext> {
    const normalized = await normalizeProduct(context);
    const subflow = this.resolveSubflow(normalized);

    return subflow ? subflow.prepareContext(normalized) : normalized;
  }

  async simulate(context: SimulationProductContext): Promise<SimulationResult> {
    const normalized = await this.normalize(context);
    const bridgeContext = buildBridgeContext(normalized);
    const legacyInput = simulationRequestToLegacySimulationInputMapper(
      normalized.request,
      bridgeContext,
    );
    const legacyRequest = toLegacySimulationRequest(normalized.request);
    const legacyOutput = await this.legacyEngine.execute(legacyRequest);
    const legacyResult = buildLegacyResult(normalized.request, legacyOutput, bridgeContext);

    return legacySimulationResultToSimulationResultMapper(
      normalized.request,
      legacyResult,
      bridgeContext,
    );
  }

  buildProposal(context: SimulationProductContext, result: SimulationResult): SimulationProposal | null {
    return result.proposals[0] ?? null;
  }

  buildRanking(context: SimulationProductContext, result: SimulationResult): SimulationRanking {
    return result.ranking;
  }

  buildMetadata(context: SimulationProductContext, result: SimulationResult): SimulationMetadata {
    const metadata: SimulationMetadata = {
      ...result.metadata,
    };

    const origin = context.metadata.origin ?? result.metadata.origin;
    if (origin) {
      metadata.origin = origin;
    }

    return metadata;
  }

  buildSnapshot(context: SimulationProductContext, result: SimulationResult) {
    return createSimulationSnapshot(context.request, result, context.bridgeContext ?? {});
  }

  buildSnapshotReference(context: SimulationProductContext, result: SimulationResult): SimulationSnapshotReference {
    return this.buildExecutionEnvelope(context, result).snapshotReference;
  }

  buildAudit(context: SimulationProductContext, result: SimulationResult): SimulationAudit {
    const envelope = this.buildExecutionEnvelope(context, result);

    return {
      executionId: envelope.executionId,
      correlationId: envelope.correlationId,
      catalogVersion: envelope.catalogVersion,
      engineVersion: envelope.engineVersion,
      policyVersion: envelope.policyVersion,
      strategyVersion: envelope.strategyVersion,
      requestHash: envelope.requestHash,
      snapshotReference: envelope.snapshotReference,
      auditReference: envelope.auditReference,
      recordedAt: envelope.executionTimestamp,
    };
  }

  buildExecutionEnvelope(context: SimulationProductContext, result: SimulationResult) {
    const bridgeContext = buildBridgeContext(context);
    const legacyInput = simulationRequestToLegacySimulationInputMapper(
      context.request,
      bridgeContext,
    );
    const legacyResult = createLegacyResultFromCanonical(
      context.request,
      result,
      bridgeContext,
    );

    return createSimulationExecutionEnvelope(
      context.request,
      legacyInput,
      legacyResult,
      result,
      bridgeContext,
      createSimulationSnapshotReference(
        bridgeContext.simulationId,
        context.request.versioning.version,
        {
          source: bridgeContext.source,
          capturedAt: bridgeContext.createdAt,
        },
      ),
    );
  }
}
