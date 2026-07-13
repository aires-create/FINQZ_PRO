import {
  StructuredLoggerObservabilitySink,
  type ObservabilitySink,
} from './observability-sink.js';

export const resolveObservabilitySink = (): ObservabilitySink => {
  return new StructuredLoggerObservabilitySink();
};
