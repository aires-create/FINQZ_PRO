import type {
  SimulationAudit,
  SimulationMetadata,
  SimulationProposal,
  SimulationRanking,
  SimulationRequest,
  SimulationResult,
  SimulationSnapshotReference,
} from '../../contracts/simulation.contract.js';
import type { SimulationExecutionEnvelope } from '../../execution/simulation-execution-envelope.contract.js';
import type { SimulationSnapshot } from '../../snapshots/simulation-snapshot.contract.js';
import type { SimulationProductContext } from './simulation-product.context.js';
import type { SimulationProductCapability } from './simulation-product.capability.js';
import type { SimulationProductMetadata } from './simulation-product.metadata.js';
import type { SimulationProductValidationResult } from './simulation-product.types.js';

export interface SimulationProductAdapter {
  readonly kind: string;
  readonly metadata: SimulationProductMetadata;
  readonly capability: SimulationProductCapability;

  identify(context: SimulationProductContext): boolean;
  supports(context: SimulationProductContext): boolean;
  validate(context: SimulationProductContext): Promise<SimulationProductValidationResult>;
  normalize(context: SimulationProductContext): Promise<SimulationProductContext>;
  simulate(context: SimulationProductContext): Promise<SimulationResult>;
  buildProposal(context: SimulationProductContext, result: SimulationResult): SimulationProposal | null;
  buildRanking(context: SimulationProductContext, result: SimulationResult): SimulationRanking;
  buildMetadata(context: SimulationProductContext, result: SimulationResult): SimulationMetadata;
  buildAudit(context: SimulationProductContext, result: SimulationResult): SimulationAudit;
  buildSnapshot(context: SimulationProductContext, result: SimulationResult): SimulationSnapshot;
  buildExecutionEnvelope(context: SimulationProductContext, result: SimulationResult): SimulationExecutionEnvelope;
  buildSnapshotReference(context: SimulationProductContext, result: SimulationResult): SimulationSnapshotReference;
}

