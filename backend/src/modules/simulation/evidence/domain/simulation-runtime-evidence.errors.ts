export class InvalidSimulationRuntimeEvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSimulationRuntimeEvidenceError';
  }
}

export class ConflictingSimulationRuntimeEvidenceError extends Error {
  constructor(
    readonly evidenceId: string,
    readonly campaignId: string,
  ) {
    super(
      `Conflicting simulation runtime evidence: ${campaignId}/${evidenceId}`,
    );
    this.name = 'ConflictingSimulationRuntimeEvidenceError';
  }
}
