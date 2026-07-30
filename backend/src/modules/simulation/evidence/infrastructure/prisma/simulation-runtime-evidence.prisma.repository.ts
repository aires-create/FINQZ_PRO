import type { Prisma, PrismaClient, SimulationRuntimeEvidence as SimulationRuntimeEvidenceModel } from '@prisma/client';

import { prisma } from '../../../../../core/prisma/client.js';
import {
  ConflictingSimulationRuntimeEvidenceError,
} from '../../domain/simulation-runtime-evidence.errors.js';
import type {
  SimulationRuntimeEvidenceRepository,
} from '../../domain/simulation-runtime-evidence.repository.js';
import type {
  SimulationRuntimeEvidenceRecord,
} from '../../domain/simulation-runtime-evidence.types.js';
import {
  toSimulationRuntimeEvidenceCreateInput,
  toSimulationRuntimeEvidenceRecord,
} from './simulation-runtime-evidence.prisma.mapper.js';

type PrismaSimulationRuntimeEvidenceClient =
  PrismaClient | Prisma.TransactionClient;

const serializeEvidenceRecord = (
  evidence: SimulationRuntimeEvidenceRecord,
): string =>
  JSON.stringify({
    ...evidence,
    receivedAt: evidence.receivedAt.toISOString(),
  });

const isPrismaKnownRequestError = (
  error: unknown,
): error is { code: string } => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'code' in error && typeof (error as { code: unknown }).code === 'string';
};

const isUniqueConstraintViolation = (error: unknown): boolean =>
  isPrismaKnownRequestError(error) && error.code === 'P2002';

export class SimulationRuntimeEvidencePrismaRepository
  implements SimulationRuntimeEvidenceRepository {
  constructor(
    private readonly client: PrismaSimulationRuntimeEvidenceClient = prisma,
  ) {}

  private get table() {
    return this.client.simulationRuntimeEvidence;
  }

  private async fetchByIdentity(
    tenantId: string,
    campaignId: string,
    evidenceId: string,
  ): Promise<SimulationRuntimeEvidenceModel | null> {
    return this.table.findUnique({
      where: {
        tenantId_campaignId_evidenceId: {
          tenantId,
          campaignId,
          evidenceId,
        },
      },
    });
  }

  private async fetchManyByCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<SimulationRuntimeEvidenceModel[]> {
    return this.table.findMany({
      where: {
        tenantId,
        campaignId,
      },
      orderBy: [
        { timestamp: 'asc' },
        { createdAt: 'asc' },
        { evidenceId: 'asc' },
      ],
    });
  }

  async save(
    evidence: SimulationRuntimeEvidenceRecord,
  ): Promise<SimulationRuntimeEvidenceRecord> {
    const existing = await this.fetchByIdentity(
      evidence.tenantId,
      evidence.campaignId,
      evidence.evidenceId,
    );

    if (existing) {
      const existingRecord = toSimulationRuntimeEvidenceRecord(existing);
      if (serializeEvidenceRecord(existingRecord) !== serializeEvidenceRecord(evidence)) {
        throw new ConflictingSimulationRuntimeEvidenceError(
          evidence.evidenceId,
          evidence.campaignId,
        );
      }

      return existingRecord;
    }

    try {
      const created = await this.table.create({
        data: toSimulationRuntimeEvidenceCreateInput(evidence),
      });

      return toSimulationRuntimeEvidenceRecord(created);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }

      const reloaded = await this.fetchByIdentity(
        evidence.tenantId,
        evidence.campaignId,
        evidence.evidenceId,
      );

      if (!reloaded) {
        throw error;
      }

      const reloadedRecord = toSimulationRuntimeEvidenceRecord(reloaded);

      if (serializeEvidenceRecord(reloadedRecord) !== serializeEvidenceRecord(evidence)) {
        throw new ConflictingSimulationRuntimeEvidenceError(
          evidence.evidenceId,
          evidence.campaignId,
        );
      }

      return reloadedRecord;
    }
  }

  async findByIdentity(
    tenantId: string,
    campaignId: string,
    evidenceId: string,
  ): Promise<SimulationRuntimeEvidenceRecord | null> {
    const record = await this.fetchByIdentity(
      tenantId,
      campaignId,
      evidenceId,
    );

    return record ? toSimulationRuntimeEvidenceRecord(record) : null;
  }

  async listByCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<SimulationRuntimeEvidenceRecord[]> {
    const records = await this.fetchManyByCampaign(tenantId, campaignId);

    return records.map((record) => toSimulationRuntimeEvidenceRecord(record));
  }
}

export const simulationRuntimeEvidencePrismaRepository =
  new SimulationRuntimeEvidencePrismaRepository();
