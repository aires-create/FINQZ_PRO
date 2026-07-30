import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";
import { SimulationRuntimeRemoteEvidenceHttpClient } from "./simulation-runtime-remote-evidence.client";

const buildEvidence = (): SimulationRuntimeEvidence => ({
  evidenceId: "sim-runtime-evidence-00000001",
  timestamp: "2026-07-10T12:00:00.000Z",
  environment: "homologation",
  tenantIdHash: "tenant-hash",
  opportunityIdHash: "opportunity-hash",
  requestId: "request-1",
  correlationId: "correlation-1",
  executionId: "execution-1",
  productCode: "LOAN_WITH_COLLATERAL",
  subproductCode: "AUTO_EQUITY",
  legacyStatus: "approved",
  canonicalStatus: "approved",
  comparisonStatus: "EQUIVALENT",
  divergenceCategory: "NONE",
  divergenceCount: 0,
  financialCriticalCount: 0,
  financialMinorCount: 0,
  structuralCount: 0,
  missingCanonicalFieldCount: 0,
  missingLegacyFieldCount: 0,
  mappingFailure: false,
  runtimeFailure: false,
  unsupportedScenario: false,
  legacyDurationMs: null,
  runtimeDurationMs: 120,
  fallbackUsed: false,
  shadowMode: true,
  comparatorVersion: "1.0.0",
  contractVersion: "1.0.0",
  catalogVersion: "1.0.0",
  engineVersion: "1.0.0",
  policyVersion: "1.0.0",
  strategyVersion: "1.0.0",
});

describe("SimulationRuntimeRemoteEvidenceHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts sanitized evidence to the canonical endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SimulationRuntimeRemoteEvidenceHttpClient({ timeoutMs: 1000 });
    const evidence = buildEvidence();

    const result = await client.send(evidence);

    expect(result.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/simulations/runtime-evidence");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
    expect((init.body as string)).toContain(evidence.evidenceId);
    expect((init.headers as Headers).get("X-Request-ID")).toBe(evidence.requestId);
  });

  it("preserves conflict responses as operational status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SimulationRuntimeRemoteEvidenceHttpClient();
    const result = await client.send(buildEvidence());

    expect(result.statusCode).toBe(409);
  });
});
