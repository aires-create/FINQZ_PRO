import type {
  SimulationAudit,
  SimulationAuditReference,
  SimulationDecision,
  SimulationExecutionContext,
  SimulationMetadata,
  SimulationParticipant,
  SimulationProposal,
  SimulationProposalReference,
  SimulationRanking,
  SimulationRequest,
  SimulationResult,
  SimulationSnapshotReference,
} from '../contracts/simulation.contract.js';

export type SimulationRequestDto = Readonly<SimulationRequest>;
export type SimulationResultDto = Readonly<SimulationResult>;
export type SimulationMetadataDto = Readonly<SimulationMetadata>;
export type SimulationParticipantDto = Readonly<SimulationParticipant>;
export type SimulationProposalDto = Readonly<SimulationProposal>;
export type SimulationRankingDto = Readonly<SimulationRanking>;
export type SimulationDecisionDto = Readonly<SimulationDecision>;
export type SimulationExecutionContextDto = Readonly<SimulationExecutionContext>;
export type SimulationSnapshotReferenceDto = Readonly<SimulationSnapshotReference>;
export type SimulationProposalReferenceDto = Readonly<SimulationProposalReference>;
export type SimulationAuditReferenceDto = Readonly<SimulationAuditReference>;
export type SimulationAuditDto = Readonly<SimulationAudit>;

const cloneParticipant = (participant: SimulationParticipant): SimulationParticipant => {
  const dto: SimulationParticipant = { ...participant };
  if (participant.metadata) {
    dto.metadata = { ...participant.metadata };
  }
  return dto;
};

const cloneRequestParticipant = cloneParticipant;

const cloneAsset = <T extends { metadata?: Record<string, unknown> }>(asset: T): T => {
  const dto: T = { ...asset };
  if (asset.metadata) {
    dto.metadata = { ...asset.metadata };
  }
  return dto;
};

export const toSimulationRequestDto = (
  request: SimulationRequest,
): SimulationRequestDto => {
  const dto: SimulationRequest = {
    tenant: { ...request.tenant },
    product: { ...request.product },
    subproduct: { ...request.subproduct },
    customer: cloneRequestParticipant(request.customer),
    participants: request.participants.map(cloneRequestParticipant),
    guarantees: request.guarantees.map((guarantee) => {
      const dtoGuarantee = { ...guarantee };
      if (guarantee.asset) {
        dtoGuarantee.asset = cloneAsset(guarantee.asset);
      }
      if (guarantee.metadata) {
        dtoGuarantee.metadata = { ...guarantee.metadata };
      }
      return dtoGuarantee;
    }),
    metadata: { ...request.metadata },
    versioning: { ...request.versioning },
  };

  if (request.vehicle) {
    dto.vehicle = cloneAsset(request.vehicle);
  }
  if (request.property) {
    dto.property = cloneAsset(request.property);
  }
  if (request.agreement) {
    dto.agreement = { ...request.agreement };
  }
  if (request.provider) {
    dto.provider = { ...request.provider };
  }
  if (request.commercializadora) {
    dto.commercializadora = { ...request.commercializadora };
  }
  if (request.bank) {
    dto.bank = { ...request.bank };
  }
  if (request.corban) {
    dto.corban = { ...request.corban };
  }
  if (request.channel) {
    dto.channel = { ...request.channel };
  }
  if (request.pipeline) {
    dto.pipeline = { ...request.pipeline };
  }
  if (request.opportunity) {
    dto.opportunity = { ...request.opportunity };
  }
  if (request.commercial) {
    dto.commercial = { ...request.commercial };
  }
  if (request.income) {
    dto.income = { ...request.income };
  }
  if (request.parameters) {
    dto.parameters = { ...request.parameters };
  }
  if (request.execution) {
    dto.execution = { ...request.execution };
  }

  return dto;
};

export const toSimulationResultDto = (
  result: SimulationResult,
): SimulationResultDto => {
  const dto: SimulationResult = {
    tenant: { ...result.tenant },
    product: { ...result.product },
    subproduct: { ...result.subproduct },
    customer: cloneParticipant(result.customer),
    participants: result.participants.map(cloneParticipant),
    guarantees: result.guarantees.map((guarantee) => {
      const dtoGuarantee = { ...guarantee };
      if (guarantee.asset) {
        dtoGuarantee.asset = cloneAsset(guarantee.asset);
      }
      if (guarantee.metadata) {
        dtoGuarantee.metadata = { ...guarantee.metadata };
      }
      return dtoGuarantee;
    }),
    metadata: { ...result.metadata },
    result: result.result.map((item) => ({ ...item })),
    proposals: result.proposals.map((proposal) => {
      const dtoProposal = { ...proposal };
      if (proposal.provider) {
        dtoProposal.provider = { ...proposal.provider };
      }
      if (proposal.payload) {
        dtoProposal.payload = { ...proposal.payload };
      }
      return dtoProposal;
    }),
    ranking: {
      candidates: result.ranking.candidates.map((candidate) => ({
        ...candidate,
        provider: { ...candidate.provider },
        reasons: [...candidate.reasons],
      })),
    },
    decision: {
      status: result.decision.status,
      reasons: [...result.decision.reasons],
    },
    rejectionReasons: [...result.rejectionReasons],
    alerts: [...result.alerts],
    warnings: [...result.warnings],
    snapshot: { ...result.snapshot },
    proposalReference: { ...result.proposalReference },
    auditReference: { ...result.auditReference },
    executionId: result.executionId,
    executionTimestamp: result.executionTimestamp,
    engineVersion: result.engineVersion,
    catalogVersion: result.catalogVersion,
    policyVersion: result.policyVersion,
    strategyVersion: result.strategyVersion,
    status: result.status,
  };

  if (result.versioning) {
    dto.versioning = { ...result.versioning };
  }
  if (result.execution) {
    dto.execution = { ...result.execution };
  }

  if (result.vehicle) {
    dto.vehicle = cloneAsset(result.vehicle);
  }
  if (result.property) {
    dto.property = cloneAsset(result.property);
  }
  if (result.agreement) {
    dto.agreement = { ...result.agreement };
  }
  if (result.provider) {
    dto.provider = { ...result.provider };
  }
  if (result.commercializadora) {
    dto.commercializadora = { ...result.commercializadora };
  }
  if (result.bank) {
    dto.bank = { ...result.bank };
  }
  if (result.corban) {
    dto.corban = { ...result.corban };
  }
  if (result.channel) {
    dto.channel = { ...result.channel };
  }
  if (result.pipeline) {
    dto.pipeline = { ...result.pipeline };
  }
  if (result.opportunity) {
    dto.opportunity = { ...result.opportunity };
  }
  if (result.commercial) {
    dto.commercial = { ...result.commercial };
  }
  if (result.income) {
    dto.income = { ...result.income };
  }
  if (result.parameters) {
    dto.parameters = { ...result.parameters };
  }
  if (result.ranking.selected) {
    dto.ranking.selected = { ...result.ranking.selected };
  }
  if (result.ranking.selectedIndex !== undefined) {
    dto.ranking.selectedIndex = result.ranking.selectedIndex;
  }
  if (result.decision.message) {
    dto.decision.message = result.decision.message;
  }
  if (result.decision.recommendedProvider) {
    dto.decision.recommendedProvider = { ...result.decision.recommendedProvider };
  }
  if (result.selectedProvider) {
    dto.selectedProvider = { ...result.selectedProvider };
  }

  return dto;
};

export const toSimulationMetadataDto = (
  metadata: SimulationMetadata,
): SimulationMetadataDto => ({ ...metadata });

export const toSimulationExecutionContextDto = (
  execution: SimulationExecutionContext,
): SimulationExecutionContextDto => ({ ...execution });

export const toSimulationSnapshotReferenceDto = (
  snapshot: SimulationSnapshotReference,
): SimulationSnapshotReferenceDto => ({ ...snapshot });

export const toSimulationProposalReferenceDto = (
  proposalReference: SimulationProposalReference,
): SimulationProposalReferenceDto => ({ ...proposalReference });

export const toSimulationAuditReferenceDto = (
  auditReference: SimulationAuditReference,
): SimulationAuditReferenceDto => ({ ...auditReference });

export const toSimulationAuditDto = (
  audit: SimulationAudit,
): SimulationAuditDto => ({
  ...audit,
  snapshotReference: { ...audit.snapshotReference },
  auditReference: { ...audit.auditReference },
});
