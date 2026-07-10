import type {
  SimulationRuntimeEvidenceRecord,
} from './simulation-runtime-evidence.types.js';

export interface SimulationRuntimeEvidenceRepository {
  save(
    evidence: SimulationRuntimeEvidenceRecord,
  ): Promise<SimulationRuntimeEvidenceRecord>;

  findByIdentity(
    tenantId: string,
    campaignId: string,
    evidenceId: string,
  ): Promise<SimulationRuntimeEvidenceRecord | null>;

  listByCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<SimulationRuntimeEvidenceRecord[]>;
}
