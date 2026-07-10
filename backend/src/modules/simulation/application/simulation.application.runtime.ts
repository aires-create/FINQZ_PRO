import { simulationProductResolver } from '../products/index.js';
import { SimulationApplicationPipeline } from './simulation.application.pipeline.js';
import { SimulationApplicationService } from './simulation.application.service.js';
import type { SimulationRequest } from '../contracts/simulation.contract.js';
import type { SimulationApplicationExecutionResult, SimulationApplicationRuntimeOptions } from './simulation.application.context.js';

export interface SimulationApplicationRuntimeDependencies {
  readonly service?: SimulationApplicationService;
}

export class SimulationApplicationRuntime {
  private readonly service: SimulationApplicationService;

  constructor(dependencies: SimulationApplicationRuntimeDependencies = {}) {
    this.service =
      dependencies.service ??
      new SimulationApplicationService({
        pipeline: new SimulationApplicationPipeline({
          productResolver: simulationProductResolver,
        }),
      });
  }

  async execute(
    request: SimulationRequest,
    options: SimulationApplicationRuntimeOptions = {},
  ): Promise<SimulationApplicationExecutionResult> {
    return this.service.execute(request, options);
  }
}

export const simulationApplicationRuntime = new SimulationApplicationRuntime();
