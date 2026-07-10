import type {
  SimulationRuntimeDecision,
  SimulationRuntimeRanking,
  SimulationRuntimeResponseData,
  SimulationRuntimeResultItem,
  SimulationRuntimeSuccessResponse,
} from "../contracts/simulation-runtime.contract";

export interface SimulationRuntimeNormalizedResponse extends SimulationRuntimeResponseData {
  resultMap: Record<string, SimulationRuntimeResultItem>;
}

export const mapSimulationRuntimeResponse = (
  response: SimulationRuntimeSuccessResponse,
): SimulationRuntimeNormalizedResponse => {
  const resultMap = Object.fromEntries(
    (response.data.result ?? []).map((item) => [item.key, item]),
  ) as Record<string, SimulationRuntimeResultItem>;

  return {
    ...response.data,
    resultMap,
  };
};

export const getSimulationRuntimeMetric = (
  response: Pick<SimulationRuntimeNormalizedResponse, "resultMap">,
  keys: string[],
): number | string | boolean | null | undefined => {
  for (const key of keys) {
    const item = response.resultMap[key];
    if (item !== undefined) {
      return item.value;
    }
  }

  return undefined;
};

export const getSimulationRuntimeDecisionStatus = (decision: SimulationRuntimeDecision): string => {
  return String(decision?.status ?? "");
};

export const getSimulationRuntimeSelectedProvider = (
  ranking: SimulationRuntimeRanking,
): Record<string, unknown> | null => {
  return ranking.selected ? { ...ranking.selected } : null;
};

