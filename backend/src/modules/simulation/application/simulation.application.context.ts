import type { SimulationBridgeContext } from '../acl/simulation-bridge-context.js';
import type { SimulationRequest, SimulationResult } from '../contracts/simulation.contract.js';
import type { SimulationExecutionEnvelope } from '../execution/simulation-execution-envelope.contract.js';
import type { SimulationSnapshot } from '../snapshots/simulation-snapshot.contract.js';
import type { MasterCatalogRuntimeContract } from '../../master-catalog/application/master-catalog.runtime.js';
import type { LoanWithCollateralSubflow } from '../products/loan-with-collateral/subflows/index.js';
import type { SimulationProductAdapter, SimulationProductContext } from '../products/base/index.js';

export interface SimulationApplicationExecutionContext extends SimulationProductContext {
  readonly productAdapter: SimulationProductAdapter;
  readonly subflow?: LoanWithCollateralSubflow;
  readonly executionId: string;
  readonly correlationId: string;
  readonly result?: SimulationResult;
  readonly snapshot?: SimulationSnapshot;
  readonly executionEnvelope?: SimulationExecutionEnvelope;
  readonly bridgeContext?: Partial<SimulationBridgeContext>;
}

export interface SimulationApplicationExecutionResult {
  readonly context: SimulationApplicationExecutionContext;
  readonly result: SimulationResult;
  readonly snapshot: SimulationSnapshot;
  readonly executionEnvelope: SimulationExecutionEnvelope;
}

export interface SimulationApplicationRuntimeOptions {
  readonly bridgeContext?: Partial<SimulationBridgeContext>;
  readonly masterCatalog?: MasterCatalogRuntimeContract;
}
