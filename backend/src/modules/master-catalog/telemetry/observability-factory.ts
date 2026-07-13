import { NoopObservabilitySink, type ObservabilitySink } from './observability-sink.js';

export const resolveObservabilitySink = (): ObservabilitySink => {
  return new NoopObservabilitySink();
};
