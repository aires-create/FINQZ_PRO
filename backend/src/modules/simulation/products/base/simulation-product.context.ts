import type { SimulationBridgeContext } from '../../acl/simulation-bridge-context.js';
import type { SimulationRequest, SimulationResult, SimulationMetadata, SimulationProposal, SimulationRanking, SimulationAudit } from '../../contracts/simulation.contract.js';
import type { SimulationSnapshot } from '../../snapshots/simulation-snapshot.contract.js';
import type { LegacySimulationInput, LegacySimulationResult } from '../../acl/legacy-simulation.types.js';
import type { MasterCatalogRuntimeContract } from '../../../master-catalog/application/master-catalog.runtime.js';
import type { SimulationExecutionEnvelope } from '../../execution/simulation-execution-envelope.contract.js';

export interface SimulationProductContext {
  readonly tenant: SimulationRequest['tenant'];
  readonly opportunity?: SimulationRequest['opportunity'];
  readonly masterCatalog?: MasterCatalogRuntimeContract;
  readonly commercial?: SimulationRequest['commercial'];
  readonly execution?: SimulationRequest['execution'];
  readonly provider?: SimulationRequest['provider'];
  readonly request: SimulationRequest;
  readonly metadata: SimulationMetadata;
  readonly bridgeContext?: Partial<SimulationBridgeContext>;
  readonly legacyInput?: LegacySimulationInput;
  readonly legacyResult?: LegacySimulationResult;
  readonly snapshot?: SimulationSnapshot;
  readonly executionEnvelope?: SimulationExecutionEnvelope;
  readonly result?: SimulationResult;
  readonly proposal?: SimulationProposal;
  readonly ranking?: SimulationRanking;
  readonly audit?: SimulationAudit;
}
