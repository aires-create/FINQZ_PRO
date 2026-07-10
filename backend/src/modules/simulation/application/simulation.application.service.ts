import type { SimulationRequest, SimulationResult } from '../contracts/simulation.contract.js';
import type { SimulationApplicationExecutionContext, SimulationApplicationExecutionResult, SimulationApplicationRuntimeOptions } from './simulation.application.context.js';
import { InvalidSimulationRequestError, UnsupportedSubproductError } from './simulation.application.errors.js';
import { SimulationApplicationPipeline, type SimulationApplicationResolvedFlow, assertCollateralForSubflow } from './simulation.application.pipeline.js';

export interface SimulationApplicationServiceDependencies {
  readonly pipeline: SimulationApplicationPipeline;
}

export class SimulationApplicationService {
  constructor(private readonly dependencies: SimulationApplicationServiceDependencies) {}

  async execute(
    request: SimulationRequest,
    options: SimulationApplicationRuntimeOptions = {},
  ): Promise<SimulationApplicationExecutionResult> {
    const validatedRequest = this.dependencies.pipeline.validateRequest(request);
    const resolvedFlow = this.resolveFlow(validatedRequest);
    assertCollateralForSubflow(resolvedFlow.subflow, validatedRequest);
    const executionContext = this.dependencies.pipeline.createExecutionContext(
      validatedRequest,
      resolvedFlow.adapter,
      resolvedFlow.subflow,
      options,
    );

    const aclContext = await this.dependencies.pipeline.executeACL(
      resolvedFlow.adapter,
      executionContext,
    );
    const simulationResult = await this.dependencies.pipeline.executeLegacyEngine(
      resolvedFlow.adapter,
      aclContext,
    );
    const result = this.dependencies.pipeline.mapResult(simulationResult);
    const snapshot = this.dependencies.pipeline.createSnapshot(
      resolvedFlow.adapter,
      {
        ...executionContext,
        request: aclContext.request,
        metadata: aclContext.metadata,
        bridgeContext: aclContext.bridgeContext ?? {},
      },
      result,
    );
    const executionEnvelope = this.dependencies.pipeline.createExecutionEnvelope(
      resolvedFlow.adapter,
      {
        ...executionContext,
        request: aclContext.request,
        metadata: aclContext.metadata,
        bridgeContext: aclContext.bridgeContext ?? {},
      },
      result,
    );

    return {
      context: {
      ...executionContext,
      request: aclContext.request,
      metadata: aclContext.metadata,
      bridgeContext: aclContext.bridgeContext ?? {},
      result,
      snapshot,
      executionEnvelope,
      },
      result,
      snapshot,
      executionEnvelope,
    };
  }

  resolveFlow(request: SimulationRequest): SimulationApplicationResolvedFlow {
    const adapter = this.dependencies.pipeline.resolveProduct(request);
    const subflow = this.dependencies.pipeline.resolveSubflow(adapter, request);

    if (!subflow) {
      throw new UnsupportedSubproductError(request.subproduct.id, request.subproduct.code);
    }

    return {
      adapter,
      subflow,
    };
  }
}
