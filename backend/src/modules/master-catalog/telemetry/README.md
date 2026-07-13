# Master Catalog Telemetry

This module owns the Master Catalog-specific telemetry vocabulary.

## What belongs here

- `MasterCatalogConsumer`
- `MasterCatalogSourceType`
- `MasterCatalogEventName`
- `MASTER_CATALOG_TELEMETRY_EVENT_VERSION`
- event payloads specific to Master Catalog
- event schemas and validation specific to Master Catalog
- discriminated unions for Master Catalog telemetry events
- the passive in-process emitter used by Master Catalog handlers

## What does not belong here

- generic log context
- generic metric context
- generic sanitization helpers
- generic validation helpers
- shared telemetry severities and error categories

## Contract rules

- `eventVersion` is mandatory.
- Event schemas are closed and reject unknown keys.
- Payloads are event-specific and do not accept arbitrary objects.
- `primary` and `fallback` cannot be simultaneously true.
- Shadow events must explicitly declare shadow context.
- Error events carry `errorCategory`, `errorCode`, and `errorMessage`.
- Success events do not require error fields.

## Relationship to `shared/telemetry`

`shared/telemetry` provides the generic primitives only:

- base context
- log context
- metric context
- validation result
- sanitization helpers
- generic validation helpers

The bounded-context vocabulary stays in this module so `shared` does not become a registry for all domains.

## Passive integration

The emitter in this module is intentionally synchronous, fail-safe, and side-effect free.
It validates and sanitizes event records locally and does not publish logs, metrics, traces, queues, or persistent telemetry.
