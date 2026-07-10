import { finqzClient } from "../../../api/finqzClient";
import type {
  SimulationRuntimeRequestBody,
  SimulationRuntimeSuccessResponse,
} from "../contracts/simulation-runtime.contract";

const SIMULATION_RUNTIME_ENDPOINT = "/api/v1/simulations/runtime";

export interface ExecuteSimulationRuntimeShadowOptions {
  requestId?: string;
}

export const executeSimulationRuntimeShadow = async (
  request: SimulationRuntimeRequestBody,
  options: ExecuteSimulationRuntimeShadowOptions = {},
): Promise<SimulationRuntimeSuccessResponse> => {
  const response = await finqzClient.post<SimulationRuntimeSuccessResponse>(
    SIMULATION_RUNTIME_ENDPOINT,
    request,
    {
      requestId: options.requestId,
      preserveApiPrefix: true,
    },
  );

  if (!response.success) {
    throw new Error("Unexpected runtime response payload");
  }

  return response;
};

