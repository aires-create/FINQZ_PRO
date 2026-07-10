import type { SimulationSnapshotReference } from '../contracts/simulation.contract.js';

export type SimulationSnapshotReferenceValueObject = Readonly<
  SimulationSnapshotReference
>;

export const createSimulationSnapshotReference = (
  snapshotId: string,
  snapshotVersion: string,
  extras: Partial<SimulationSnapshotReference> = {},
): SimulationSnapshotReferenceValueObject => ({
  snapshotId: snapshotId.trim(),
  snapshotVersion: snapshotVersion.trim(),
  ...extras,
});

