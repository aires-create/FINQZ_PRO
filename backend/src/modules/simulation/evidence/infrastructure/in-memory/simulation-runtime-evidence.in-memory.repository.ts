import {
  ConflictingSimulationRuntimeEvidenceError,
} from '../../domain/simulation-runtime-evidence.errors.js';
import type {
  SimulationRuntimeEvidenceRepository,
} from '../../domain/simulation-runtime-evidence.repository.js';
import type {
  SimulationRuntimeEvidenceRecord,
} from '../../domain/simulation-runtime-evidence.types.js';

const buildKey = (
  tenantId: string,
  campaignId: string,
  evidenceId: string,
): string => `${tenantId}:${campaignId}:${evidenceId}`;

const serializeRecord = (
  record: SimulationRuntimeEvidenceRecord,
): string =>
  JSON.stringify({
    ...record,
    receivedAt: record.receivedAt.toISOString(),
  });

export class InMemorySimulationRuntimeEvidenceRepository
  implements SimulationRuntimeEvidenceRepository {
  private readonly records =
    new Map<string, SimulationRuntimeEvidenceRecord>();

  async save(
    evidence: SimulationRuntimeEvidenceRecord,
  ): Promise<SimulationRuntimeEvidenceRecord> {
    const key = buildKey(
      evidence.tenantId,
      evidence.campaignId,
      evidence.evidenceId,
    );

    const existing = this.records.get(key);

    if (existing) {
      if (serializeRecord(existing) !== serializeRecord(evidence)) {
        throw new ConflictingSimulationRuntimeEvidenceError(
          evidence.evidenceId,
          evidence.campaignId,
        );
      }

      return existing;
    }

    this.records.set(key, evidence);
    return evidence;
  }

  async findByIdentity(
    tenantId: string,
    campaignId: string,
    evidenceId: string,
  ): Promise<SimulationRuntimeEvidenceRecord | null> {
    return (
      this.records.get(
        buildKey(tenantId, campaignId, evidenceId),
      ) ?? null
    );
  }

  async listByCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<SimulationRuntimeEvidenceRecord[]> {
    return [...this.records.values()].filter(
      (record) =>
        record.tenantId === tenantId &&
        record.campaignId === campaignId,
    );
  }
}
