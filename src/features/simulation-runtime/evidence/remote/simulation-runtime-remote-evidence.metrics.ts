export interface SimulationRuntimeRemoteEvidenceMetricsSnapshot {
  enqueuedCount: number;
  successCount: number;
  conflictCount: number;
  retryCount: number;
  failureCount: number;
  averageSendTimeMs: number;
  currentQueueSize: number;
}

export interface SimulationRuntimeRemoteEvidenceMetricsState {
  enqueuedCount: number;
  successCount: number;
  conflictCount: number;
  retryCount: number;
  failureCount: number;
  sendCount: number;
  totalSendTimeMs: number;
  currentQueueSize: number;
}

export const createSimulationRuntimeRemoteEvidenceMetricsState = (): SimulationRuntimeRemoteEvidenceMetricsState => ({
  enqueuedCount: 0,
  successCount: 0,
  conflictCount: 0,
  retryCount: 0,
  failureCount: 0,
  sendCount: 0,
  totalSendTimeMs: 0,
  currentQueueSize: 0,
});

export const buildSimulationRuntimeRemoteEvidenceMetricsSnapshot = (
  state: SimulationRuntimeRemoteEvidenceMetricsState,
): SimulationRuntimeRemoteEvidenceMetricsSnapshot => ({
  enqueuedCount: state.enqueuedCount,
  successCount: state.successCount,
  conflictCount: state.conflictCount,
  retryCount: state.retryCount,
  failureCount: state.failureCount,
  averageSendTimeMs: state.sendCount > 0 ? state.totalSendTimeMs / state.sendCount : 0,
  currentQueueSize: state.currentQueueSize,
});
