import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildOpportunitiesByStage,
  getKanbanRuntimeHealthReport,
  getOpportunityVisualPipelineId,
  getOpportunityVisualStageId,
  mapApiOpportunityToKanbanShape,
  normalizeOpportunityForKanbanStage,
  resetKanbanRuntimeHealthMetrics,
  resetKanbanRuntimeHealthReport,
} from "../pages/Oportunidades";

describe("Oportunidades Kanban hardening", () => {
  it("prioritizes official stageId in the mapper when present", () => {
    const mapped = mapApiOpportunityToKanbanShape({
      id: "opp-1",
      title: "Opportunity",
      amount: 1000,
      status: "open",
      pipelineId: "pipeline-uuid",
      stageId: "stage-uuid",
      pipeline: { name: "Pipeline - Consignado" },
      stage: { name: "Negociacao", order: 2 },
    });

    expect(mapped.stageId).toBe("stage-uuid");
    expect(mapped.backendStageId).toBe("stage-uuid");
    expect(mapped.etapa_id).toBe("stage-uuid");
    expect(mapped.etapa).toBe("stage-uuid");
    expect(mapped.pipelineId).toBe("pipeline-uuid");
    expect(mapped.backendPipelineId).toBe("pipeline-uuid");
    expect(mapped.pipeline_id).toBe("pipeline-uuid");
  });

  it("falls back to semantic stage only when official stageId is absent", () => {
    const mapped = mapApiOpportunityToKanbanShape({
      id: "opp-2",
      title: "Legacy Opportunity",
      amount: 500,
      pipeline: { name: "Pipeline - Consignado" },
      stage: { name: "Negociacao", order: 2 },
    });

    expect(mapped.stageId).toBe("");
    expect(mapped.backendStageId).toBe("");
    expect(mapped.etapa_id).toBe("negociacao");
    expect(mapped.etapa).toBe("negociacao");
  });

  it("maps stage name only records without losing compatibility", () => {
    const mapped = mapApiOpportunityToKanbanShape({
      id: "opp-3",
      title: "Stage Name Only",
      amount: 700,
      stage: { name: "Novo Lead" },
      pipeline: { name: "Pipeline - Consignado" },
    });

    expect(mapped.etapa_id).toBe("novo_lead");
    expect(mapped.etapa).toBe("novo_lead");
    expect(getOpportunityVisualStageId(mapped)).toBe("novo_lead");
  });

  it("groups visual columns by UUID stageId when available", () => {
    const grouped = buildOpportunitiesByStage(
      [
        {
          id: "1",
          nome: "A",
          valor: 100,
          stageId: "stage-1",
          etapa_id: "legacy-slug",
          updatedAt: "2026-06-30T10:00:00.000Z",
        },
        {
          id: "2",
          nome: "B",
          valor: 50,
          stageId: "stage-2",
          etapa_id: "another-slug",
          updatedAt: "2026-06-30T11:00:00.000Z",
        },
      ],
      [{ id: "stage-1" }, { id: "stage-2" }],
      {},
    );

    expect(grouped["stage-1"]).toHaveLength(1);
    expect(grouped["stage-1"][0].id).toBe("1");
    expect(grouped["stage-2"]).toHaveLength(1);
    expect(grouped["stage-2"][0].id).toBe("2");
  });

  it("uses fallback only for invalid or legacy stage values", () => {
    const validStageIds = new Set(["stage-1", "stage-2"]);

    const normalizedValid = normalizeOpportunityForKanbanStage(
      {
        id: "valid",
        stageId: "stage-2",
        etapa_id: "legacy-negociacao",
      },
      validStageIds,
      "stage-1",
    );

    expect(normalizedValid.etapa_id).toBe("stage-2");
    expect(normalizedValid.etapa).toBe("stage-2");

    const normalizedLegacy = normalizeOpportunityForKanbanStage(
      {
        id: "legacy",
        etapa_id: "negociacao",
      },
      validStageIds,
      "stage-1",
    );

    expect(normalizedLegacy.etapa_id).toBe("stage-1");
    expect(normalizedLegacy.etapa).toBe("stage-1");
  });

  it("rebuilds the kanban correctly after a drag-and-drop refresh", () => {
    const beforeMove = mapApiOpportunityToKanbanShape({
      id: "opp-dnd",
      title: "Dragged",
      amount: 1200,
      pipelineId: "pipeline-1",
      stageId: "stage-1",
      pipeline: { name: "Pipeline - Consignado" },
      stage: { name: "Novo Lead", order: 1 },
      updatedAt: "2026-06-30T12:00:00.000Z",
    });

    const afterMove = mapApiOpportunityToKanbanShape({
      id: "opp-dnd",
      title: "Dragged",
      amount: 1200,
      pipelineId: "pipeline-1",
      stageId: "stage-2",
      pipeline: { name: "Pipeline - Consignado" },
      stage: { name: "Negociacao", order: 2 },
      updatedAt: "2026-06-30T12:05:00.000Z",
    });

    const stages = [{ id: "stage-1" }, { id: "stage-2" }];

    const beforeGrouped = buildOpportunitiesByStage([beforeMove], stages, {});
    const afterGrouped = buildOpportunitiesByStage([afterMove], stages, {});

    expect(beforeGrouped["stage-1"]).toHaveLength(1);
    expect(beforeGrouped["stage-2"]).toHaveLength(0);
    expect(afterGrouped["stage-1"]).toHaveLength(0);
    expect(afterGrouped["stage-2"]).toHaveLength(1);
    expect(afterGrouped["stage-2"][0].stageId).toBe("stage-2");
  });

  it("preserves official stageId across logout/login style remapping", () => {
    const apiPayload = {
      id: "opp-session",
      title: "Session Persistence",
      amount: 900,
      pipelineId: "pipeline-1",
      stageId: "stage-2",
      pipeline: { name: "Pipeline - Consignado" },
      stage: { name: "Negociacao", order: 2 },
    };

    const firstSession = mapApiOpportunityToKanbanShape(apiPayload);
    const secondSession = mapApiOpportunityToKanbanShape(JSON.parse(JSON.stringify(apiPayload)));

    expect(firstSession.stageId).toBe("stage-2");
    expect(secondSession.stageId).toBe("stage-2");
    expect(getOpportunityVisualStageId(firstSession)).toBe("stage-2");
    expect(getOpportunityVisualStageId(secondSession)).toBe("stage-2");
    expect(getOpportunityVisualPipelineId(secondSession)).toBe("pipeline-1");
  });

  it("exposes a passive runtime health report structure", () => {
    const report = resetKanbanRuntimeHealthReport();

    expect(report.reportVersion).toBe("H18-C");
    expect(report.totalOpportunitiesAudited).toBe(0);
    expect(report.totalGroupedByUuid).toBe(0);
    expect(Array.isArray(report.recentDragEvents)).toBe(true);
    expect(Array.isArray(report.recentObservations)).toBe(true);
  });

  it("renders the negotiation header from selectedLead data only", () => {
    const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../pages/Oportunidades.tsx");
    const source = readFileSync(filePath, "utf8");

    expect(source).toContain("selectedLead?.stageLabel ?? selectedLead?.derived?.stageLabel ?? selectedLead?.etapa ?? selectedLead?.etapa_id ?? 'Novo Lead'");
    expect(source).not.toContain("selectedWorkspaceLead?.derived.stageLabel");
  });

  it("resets runtime metrics without changing report structure", () => {
    resetKanbanRuntimeHealthReport();
    const report = getKanbanRuntimeHealthReport();
    report.totalOpportunitiesAudited = 10;
    report.totalGroupedByUuid = 5;
    report.recentObservations.push({
      timestamp: new Date().toISOString(),
      type: "test",
      details: {},
    });

    const reset = resetKanbanRuntimeHealthMetrics();

    expect(reset.totalOpportunitiesAudited).toBe(0);
    expect(reset.totalGroupedByUuid).toBe(0);
    expect(reset.recentObservations).toHaveLength(1);
  });

  it("keeps the Pipeline opening flow wired to the official workspace normalizer", () => {
    const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../pages/Oportunidades.tsx");
    const source = readFileSync(filePath, "utf8");

    expect(source).toContain('normalizeOpportunityWorkspace } from "../components/pipeline"');
    expect(source).toContain("setSelectedLead(normalizeOpportunityWorkspace(lead, {");
    expect(source).toContain("source: 'session',");
    expect(source).toContain("stageCatalog: etapasAtivas,");
    expect(source).toContain("onClick={() => handleOpenLead(cardData)}");
  });
});
