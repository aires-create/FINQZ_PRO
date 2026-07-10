import { httpRequest } from "../../../../api/http";
import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";
import type { SimulationRuntimeRemoteEvidenceClient, SimulationRuntimeRemoteEvidenceClientResult } from "./simulation-runtime-remote-evidence.types";

export interface SimulationRuntimeRemoteEvidenceClientOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;

export class SimulationRuntimeRemoteEvidenceHttpClient implements SimulationRuntimeRemoteEvidenceClient {
  constructor(private readonly options: SimulationRuntimeRemoteEvidenceClientOptions = {}) {}

  async send(evidence: SimulationRuntimeEvidence): Promise<SimulationRuntimeRemoteEvidenceClientResult> {
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutHandle = controller
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      const { response, requestId } = await httpRequest("/api/v1/simulations/runtime-evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(evidence),
        preserveApiPrefix: true,
        requestId: evidence.requestId,
        signal: controller?.signal,
      });

      return {
        statusCode: response.status,
        requestId,
      };
    } finally {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

export const createSimulationRuntimeRemoteEvidenceClient = (
  options: SimulationRuntimeRemoteEvidenceClientOptions = {},
): SimulationRuntimeRemoteEvidenceClient => new SimulationRuntimeRemoteEvidenceHttpClient(options);
