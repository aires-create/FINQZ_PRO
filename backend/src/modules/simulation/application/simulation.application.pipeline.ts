import { createSimulationCorrelationId } from '../execution/correlation-id.factory.js';
import { createSimulationExecutionEnvelope } from '../execution/simulation-execution-envelope.factory.js';
import { createSimulationExecutionId } from '../execution/execution-id.factory.js';
import { createSimulationSnapshot } from '../snapshots/simulation-snapshot.factory.js';
import type { SimulationExecutionEnvelope } from '../execution/simulation-execution-envelope.contract.js';
import type { SimulationRequest, SimulationResult } from '../contracts/simulation.contract.js';
import type { SimulationSnapshot } from '../snapshots/simulation-snapshot.contract.js';
import type {
  SimulationProductAdapter,
  SimulationProductContext,
  SimulationProductResolverContract,
} from '../products/base/index.js';
import type { LoanWithCollateralSubflow } from '../products/loan-with-collateral/subflows/index.js';
import {
  InvalidCollateralError,
  InvalidSimulationRequestError,
  LegacyExecutionError,
  UnsupportedProductError,
  UnsupportedSubproductError,
} from './simulation.application.errors.js';
import type {
  SimulationApplicationExecutionContext,
  SimulationApplicationRuntimeOptions,
} from './simulation.application.context.js';

export interface SimulationApplicationPipelineDependencies {
  readonly productResolver: SimulationProductResolverContract;
}

export interface SimulationApplicationResolvedFlow {
  readonly adapter: SimulationProductAdapter;
  readonly subflow?: LoanWithCollateralSubflow;
}

export class SimulationApplicationPipeline {
  constructor(private readonly dependencies: SimulationApplicationPipelineDependencies) {}

  validateRequest(request: SimulationRequest): SimulationRequest {
    if (!request?.tenant?.id || !request?.product?.id || !request?.subproduct?.id) {
      throw new InvalidSimulationRequestError('Simulation request is missing tenant, product or subproduct identity');
    }

    return request;
  }

  resolveProduct(request: SimulationRequest): SimulationProductAdapter {
    const adapter = this.dependencies.productResolver.resolveFromContext(
      this.buildProductContext(request),
    );

    if (!adapter) {
      throw new UnsupportedProductError(request.product.id, request.product.code);
    }

    return adapter;
  }

  resolveSubflow(adapter: SimulationProductAdapter, request: SimulationRequest): LoanWithCollateralSubflow | undefined {
    const candidate = adapter as SimulationProductAdapter & {
      resolveSubflow?: (context: SimulationProductContext) => LoanWithCollateralSubflow | undefined;
    };

    if (typeof candidate.resolveSubflow !== 'function') {
      return undefined;
    }

    const subflow = candidate.resolveSubflow(this.buildProductContext(request));

    if (!subflow) {
      throw new UnsupportedSubproductError(request.subproduct.id, request.subproduct.code);
    }

    return subflow;
  }

  async executeACL(adapter: SimulationProductAdapter, context: SimulationProductContext): Promise<SimulationProductContext> {
    try {
      return await adapter.normalize(context);
    } catch (error) {
      throw new LegacyExecutionError(error instanceof Error ? error.message : 'Failed to execute ACL normalization');
    }
  }

  async executeLegacyEngine(adapter: SimulationProductAdapter, context: SimulationProductContext): Promise<SimulationResult> {
    try {
      return await adapter.simulate(context);
    } catch (error) {
      throw new LegacyExecutionError(error instanceof Error ? error.message : 'Failed to execute legacy simulation engine');
    }
  }

  mapResult(result: SimulationResult): SimulationResult {
    return result;
  }

  createSnapshot(
    adapter: SimulationProductAdapter,
    context: SimulationApplicationExecutionContext,
    result: SimulationResult,
  ): SimulationSnapshot {
    return adapter.buildSnapshot({
      ...context,
      result,
    }, result);
  }

  createExecutionEnvelope(
    adapter: SimulationProductAdapter,
    context: SimulationApplicationExecutionContext,
    result: SimulationResult,
  ): SimulationExecutionEnvelope {
    return adapter.buildExecutionEnvelope({
      ...context,
      result,
    }, result);
  }

  createExecutionContext(
    request: SimulationRequest,
    adapter: SimulationProductAdapter,
    subflow: LoanWithCollateralSubflow | undefined,
    options: SimulationApplicationRuntimeOptions = {},
  ): SimulationApplicationExecutionContext {
    return {
      tenant: request.tenant,
      opportunity: request.opportunity,
      commercial: request.commercial,
      execution: request.execution,
      provider: request.provider,
      request,
      metadata: request.metadata,
      bridgeContext: options.bridgeContext ?? {},
      ...(options.masterCatalog ? { masterCatalog: options.masterCatalog } : {}),
      productAdapter: adapter,
      executionId: request.execution?.executionId ?? createSimulationExecutionId(),
      correlationId: request.execution?.correlationId ?? createSimulationCorrelationId(),
      ...(subflow ? { subflow } : {}),
    };
  }

  private buildProductContext(
    request: SimulationRequest,
    options: SimulationApplicationRuntimeOptions = {},
  ): SimulationProductContext {
    return {
      tenant: request.tenant,
      opportunity: request.opportunity,
      commercial: request.commercial,
      execution: request.execution,
      provider: request.provider,
      request,
      metadata: request.metadata,
      bridgeContext: options.bridgeContext ?? {},
      ...(options.masterCatalog ? { masterCatalog: options.masterCatalog } : {}),
    };
  }
}

export const assertCollateralForSubflow = (
  subflow: LoanWithCollateralSubflow | undefined,
  request: SimulationRequest,
): void => {
  if (!subflow) {
    throw new UnsupportedSubproductError(request.subproduct.id, request.subproduct.code);
  }

  const validation = subflow.validate({
    tenant: request.tenant,
    opportunity: request.opportunity,
    commercial: request.commercial,
    execution: request.execution,
    provider: request.provider,
    request,
    metadata: request.metadata,
  });

  if (!validation.valid) {
    throw new InvalidCollateralError(subflow.metadata.collateralKind);
  }
};
