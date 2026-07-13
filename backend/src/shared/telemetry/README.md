# Shared Telemetry Primitives

This module contains the generic telemetry building blocks shared by backend features.

## What belongs here

- `EventSeverity`
- `ErrorCategory`
- `TelemetryBaseContext`
- `TelemetryLogContext`
- `TelemetryMetricKind`
- `TelemetryMetricContext`
- `TelemetryValidationResult`
- `TelemetryLogRecord`
- `TelemetryMetricRecord`
- generic sanitization helpers
- generic validation helpers

## What does not belong here

- domain-specific consumers
- domain-specific event names
- bounded-context source taxonomies
- event payloads specific to a module
- event versioning specific to a module
- Master Catalog-only telemetry schemas

## Policy

- Sanitization is fail-safe.
- Sensitive identifiers are redacted before serialization.
- Metric labels are constrained by allowlist-style validation.
- Unknown schema keys are rejected.
- No artificial identifiers are generated.

## Relationship to bounded contexts

Domain vocabulary such as Master Catalog consumers, source types, event names, payloads, and event versions must live in the bounded context that owns them.

