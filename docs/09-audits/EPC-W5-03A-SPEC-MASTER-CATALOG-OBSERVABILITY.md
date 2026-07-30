# EPC-W5-03A Spec - Master Catalog Observability Specification

- specId: `EPC-W5-03A-SPEC`
- status: `COMPLETE`
- wave: `EPC-W5 - Master Catalog SSOT Consolidation`
- waveReadiness: `GO_WITH_RESTRICTIONS`
- observabilityReadiness: `AUTHORIZED`
- firstFunctionalCut: `DEFERRED_PENDING_GATES`
- baselineBranch: `homologation/bootstrap-vps`
- baselineHead: `542bf501626841f07b1686b32b4a6da79d8b8067`
- nextAuthorizedStep: `READINESS_W5_03A_OBSERVABILITY`
- implementationScope: specification only, no code changes
- verdict: `APPROVED WITH RESTRICTIONS`

## 1. Objective

This document specifies the official observability contract for the Master Catalog. It defines the events, logs, metrics, traces, instrumentation points, release gates, rollback posture, and ADR/EPC/Runbook ownership that must exist before W5-03B can be promoted.

## 2. Non-goals

This spec does not:

- implement telemetry
- change runtime behavior
- change frontend behavior
- change backend behavior
- change feature flags
- change HTTP contracts
- change Prisma schema
- change database state
- create migrations
- create scripts

## 3. Documents and sources reviewed

### 3.1 Governance and continuity

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](/C:/Projects/FINQZ_PRO/docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](/C:/Projects/FINQZ_PRO/docs/00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [DCA-ENTERPRISE-DECISION-PLATFORM-v1.md](/C:/Projects/FINQZ_PRO/docs/03-decision-platform/DCA-ENTERPRISE-DECISION-PLATFORM-v1.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](/C:/Projects/FINQZ_PRO/docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)

### 3.2 Master Catalog audits

- [EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md)
- [EPC-W4-02-MASTER-CATALOG-PROMOTION.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EPC-W4-02-MASTER-CATALOG-PROMOTION.md)
- [EPC-W5-01-MASTER-CATALOG-INVENTORY.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-01-MASTER-CATALOG-INVENTORY.md)
- [EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-02-MASTER-CATALOG-DEPENDENCY-GRAPH.md)
- [EPC-W5-03-MASTER-CATALOG-MIGRATION-CUT-PLAN.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-03-MASTER-CATALOG-MIGRATION-CUT-PLAN.md)
- [EPC-W5-GR-ARCHITECTURE-REVIEW-GO-NO-GO.md](/C:/Projects/FINQZ_PRO/docs/09-audits/EPC-W5-GR-ARCHITECTURE-REVIEW-GO-NO-GO.md)

### 3.3 ADRs

- [ADR-004-commercial-master-catalog.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-004-commercial-master-catalog.md)
- [ADR-010-loan-with-collateral-canonical-taxonomy.md](/C:/Projects/FINQZ_PRO/docs/05-adr/ADR-010-loan-with-collateral-canonical-taxonomy.md)

### 3.4 Code sources

- `backend/src/core/http/fastify.ts`
- `backend/src/core/http/request-correlation.ts`
- `backend/src/infra/observability/*`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.controller.ts`
- `backend/src/modules/master-catalog/application/master-catalog.runtime.ts`
- `backend/src/modules/master-catalog/services/master-catalog.service.ts`
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts`
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts`
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.metadata.ts`
- `src/api/http.ts`
- `src/api/modules/master-catalog.api.ts`
- `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts`
- `src/features/commercial-structure/commercialCoverageShadowComparator.ts`
- `src/features/simulation-runtime/hooks/useSimulationRuntimeShadow.ts`
- `src/features/simulation-runtime/telemetry/simulation-runtime.telemetry.ts`
- `src/pages/Oportunidades.tsx`
- `src/pages/EstruturaComercial.tsx`
- `src/pages/CommercialCoverage.tsx`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/Simulador.tsx`
- `src/store/index.ts`

## 4. Architecture proposal

The Master Catalog observability layer is a contract-only cross-cutting layer with four goals:

1. make every canonical request measurable;
2. make shadow usage and fallback usage explicit;
3. make parity and divergence auditable;
4. make the first functional cut impossible without telemetry evidence.

The authoritative source of truth remains the backend Master Catalog runtime, with tenant-scoped persistence and canonical API reads. Observability does not replace ownership; it makes ownership measurable.

### 4.1 Canonical domains in scope

- Master Catalog backend read path
- Frontend canonical consumers
- Commercial Coverage shadow read
- Simulation Runtime shadow/evidence flow
- loan-with-collateral compatibility adapter
- legacy compatibility sources that still touch the catalog

### 4.2 Out of scope

- mutation flows
- pricing and settlement logic
- provider execution logic not related to catalog observability
- schema evolution
- runtime feature flag changes

## 5. Event model

The event catalog is split into `REQUIRED_FOR_W5_03A_MVP`, `CONDITIONAL`, `FUTURE`, and `REJECTED`.

### 5.0 Event catalog classification

- `REQUIRED_FOR_W5_03A_MVP`
  - `MASTER_CATALOG_REQUEST_STARTED`
  - `MASTER_CATALOG_REQUEST_FINISHED`
  - `MASTER_CATALOG_REQUEST_FAILED`
  - `MASTER_CATALOG_PRIMARY_USED`
  - `MASTER_CATALOG_FALLBACK_USED`
  - `MASTER_CATALOG_SHADOW_STARTED`
  - `MASTER_CATALOG_SHADOW_FINISHED`
  - `MASTER_CATALOG_SHADOW_DIVERGENCE`
  - `MASTER_CATALOG_PARITY_RESULT`
- `CONDITIONAL`
  - `MASTER_CATALOG_CONSUMER_REGISTERED`
  - `MASTER_CATALOG_CACHE_HIT`
  - `MASTER_CATALOG_CACHE_MISS`
- `FUTURE`
  - none committed for W5-03A
- `REJECTED`
  - cache-as-requirement for W5-03A/W5-03B
  - artificial trace/span generation

The following events are specified for completeness, but only the required set is part of the W5-03A MVP.

### 5.1 MASTER_CATALOG_REQUEST_STARTED

- Description: emitted when a canonical Master Catalog request starts.
- Objective: mark request entry and establish the request identity chain.
- Origin: frontend API client or backend HTTP boundary.
- Destination: structured logs, metrics pipeline, traces, audit evidence.
- Consumers: Oportunidades, Estrutura Comercial, Commercial Coverage, loan-with-collateral, future cache layers.
- Payload: request metadata and consumer identity.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `status`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `httpMethod`, `httpRoute`, `shadow`, `primary`, `fallback`, `latencyMs`.
- Frequency: one per canonical request.
- Log level: `info`.
- Retention: platform log retention policy.
- Audit criterion: every finished request must have a matching start event.

### 5.2 MASTER_CATALOG_REQUEST_FINISHED

- Description: emitted when a canonical request finishes successfully.
- Objective: record outcome, latency, and primary/fallback/shadow state.
- Origin: controller, runtime, or API client wrapper.
- Destination: logs, metrics, traces, evidence pack.
- Consumers: all canonical consumers.
- Payload: status, latency, result type, mode flags.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `status`, `latencyMs`, `result`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `fallback`, `shadow`, `primary`, `errorCode`, `errorMessage`, `httpStatus`.
- Frequency: one per successful request.
- Log level: `info`.
- Retention: platform log retention policy.
- Audit criterion: finished events must reconcile with started events and measured latency.

### 5.3 MASTER_CATALOG_REQUEST_FAILED

- Description: emitted when a canonical request fails.
- Objective: capture failure classification and recovery path.
- Origin: controller, runtime, repository, or consumer wrapper.
- Destination: logs, metrics, alerts, audit evidence.
- Consumers: all canonical consumers.
- Payload: error classification and consumer context.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `status`, `errorCode`, `errorMessage`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `latencyMs`, `fallback`, `shadow`, `primary`, `result`.
- Frequency: one per failed request.
- Log level: `error`.
- Retention: platform log retention policy.
- Audit criterion: every failure must be classified and correlated to a request start.

### 5.4 MASTER_CATALOG_PRIMARY_USED

- Description: emitted when the canonical source is used as the primary path.
- Objective: measure direct canonical adoption.
- Origin: canonical read consumers and runtime resolution.
- Destination: logs, metrics, audit evidence.
- Consumers: Oportunidades, Estrutura Comercial, Commercial Coverage, loan-with-collateral, Simulation Runtime.
- Payload: primary usage context.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `primary`, `result`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `latencyMs`, `httpRoute`, `shadow`, `fallback`.
- Frequency: one per canonical primary resolution.
- Log level: `info`.
- Retention: platform log retention policy.
- Audit criterion: primary usage must be counted per consumer and per release window.

### 5.5 MASTER_CATALOG_FALLBACK_USED

- Description: emitted when a fallback path is used instead of the canonical primary path.
- Objective: measure residual compatibility usage.
- Origin: Oportunidades empty-tree fallback, loan-with-collateral fallback path, any approved compatibility adapter.
- Destination: logs, metrics, alerts, evidence.
- Consumers: canonical consumers with transitional behavior.
- Payload: fallback reason and recovery path.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `fallback`, `result`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `errorCode`, `errorMessage`, `latencyMs`, `shadow`, `primary`.
- Frequency: one per fallback occurrence.
- Log level: `warn`.
- Retention: platform log retention policy.
- Audit criterion: fallback must be visible, counted, and reducible to zero where required.

### 5.6 MASTER_CATALOG_SHADOW_STARTED

- Description: emitted when a shadow comparison starts.
- Objective: mark the beginning of a parity comparison cycle.
- Origin: Commercial Coverage loader or any future shadow wrapper.
- Destination: logs, traces, audit evidence.
- Consumers: shadow read consumers only.
- Payload: shadow context and compared sources.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `shadow`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `latencyMs`, `primary`, `fallback`, `result`.
- Frequency: one per shadow execution.
- Log level: `info`.
- Retention: platform log retention policy.
- Audit criterion: every divergence result must have a matching shadow start.

### 5.7 MASTER_CATALOG_SHADOW_FINISHED

- Description: emitted when a shadow comparison finishes.
- Objective: capture completion, runtime, and comparison status.
- Origin: shadow comparator.
- Destination: logs, metrics, evidence.
- Consumers: Commercial Coverage and any future parity gate.
- Payload: summary of the comparison.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `shadow`, `result`, `latencyMs`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `fallback`, `primary`, `errorCode`, `errorMessage`.
- Frequency: one per finished comparison.
- Log level: `info` or `warn` depending on comparison outcome.
- Retention: platform log retention policy.
- Audit criterion: completion must carry comparison status and latency.

### 5.8 MASTER_CATALOG_SHADOW_DIVERGENCE

- Description: emitted when the canonical tree diverges from the compatibility tree.
- Objective: measure drift and parity risk.
- Origin: Commercial Coverage comparator.
- Destination: logs, alerts, parity evidence, release gates.
- Consumers: observability pipeline, data owner, commercial owner.
- Payload: divergence categories and affected nodes.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `shadow`, `result`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `latencyMs`, `errorCode`, `errorMessage`, `primary`.
- Frequency: zero or more per shadow execution, but always counted.
- Log level: `warn`.
- Retention: longer than normal request logs until parity is formally accepted.
- Audit criterion: any divergence must be classified by category and count.

### 5.9 MASTER_CATALOG_PARITY_RESULT

- Description: emitted when parity is computed for a consumer or release window.
- Objective: provide the formal pass/fail parity result for W5-03B readiness.
- Origin: parity gate evaluator.
- Destination: evidence pack, release checklist, architecture audit.
- Consumers: release management, architecture board, commercial owner.
- Payload: parity score, scope, and decision.
- Required fields: `timestamp`, `tenantId`, `consumer`, `sourceType`, `requestId`, `catalogVersion`, `source`, `result`, `shadow`, `primary`.
- Required when available: `correlationId`, `traceId`, `spanId`.
- Optional fields: `latencyMs`, `fallback`, `errorCode`, `errorMessage`.
- Frequency: at least once per controlled evidence window.
- Log level: `info`.
- Retention: until the next wave baseline is ratified.
- Audit criterion: parity result must be reproducible from metric and log evidence.

### 5.10 MASTER_CATALOG_CONSUMER_REGISTERED

- Description: emitted when a consumer is recognized as a Master Catalog consumer.
- Objective: preserve static taxonomies of consumers if an operational registration process becomes available later.
- Origin: consumer bootstrap or future registration hook.
- Destination: catalog usage inventory or future registry evidence.
- Consumers: static catalog consumers and future operational registries.
- Payload: consumer identity and scope.
- Required fields: `timestamp`, `consumer`, `sourceType`, `source`, `result`.
- Optional fields: `tenantId`, `requestId`, `correlationId`, `traceId`, `spanId`, `catalogVersion`, `fallback`, `shadow`, `primary`.
- Frequency: only if a real registration process exists.
- Log level: `info`.
- Retention: wave baseline retention policy.
- Audit criterion: not required for the W5-03A MVP.
- Classification: `CONDITIONAL`

### 5.11 MASTER_CATALOG_CACHE_HIT

- Description: emitted when a cache layer serves a Master Catalog response or lookup.
- Objective: remain conditional until an official cache exists in the canonical flow.
- Origin: future API client cache or backend lookup cache.
- Destination: optional diagnostics only.
- Consumers: future cache wrappers only.
- Payload: cache key, scope, and consumer.
- Required fields: `timestamp`, `consumer`, `sourceType`, `source`, `result`.
- Optional fields: `tenantId`, `requestId`, `correlationId`, `traceId`, `spanId`, `catalogVersion`, `latencyMs`, `shadow`, `primary`, `fallback`.
- Frequency: not applicable until official cache exists.
- Log level: `debug` or `info` depending on environment.
- Retention: operational diagnostics policy.
- Audit criterion: not applicable until official cache exists.
- Classification: `CONDITIONAL`

### 5.12 MASTER_CATALOG_CACHE_MISS

- Description: emitted when a cache layer cannot serve a Master Catalog response or lookup.
- Objective: remain conditional until an official cache exists in the canonical flow.
- Origin: future cache layer.
- Destination: optional diagnostics only.
- Consumers: future cache wrappers only.
- Payload: cache key, miss reason, and consumer.
- Required fields: `timestamp`, `consumer`, `sourceType`, `source`, `result`.
- Optional fields: `tenantId`, `requestId`, `correlationId`, `traceId`, `spanId`, `catalogVersion`, `latencyMs`, `errorCode`, `errorMessage`, `shadow`, `primary`, `fallback`.
- Frequency: not applicable until official cache exists.
- Log level: `debug` or `info` depending on environment.
- Retention: operational diagnostics policy.
- Audit criterion: not applicable until official cache exists.
- Classification: `CONDITIONAL`

### 5.13 Event consumers and producers

Current and planned producers:

- `backend/src/core/http/fastify.ts`
- `backend/src/modules/master-catalog/presentation/http/master-catalog.controller.ts`
- `backend/src/modules/master-catalog/application/master-catalog.runtime.ts`
- `backend/src/modules/master-catalog/services/master-catalog.service.ts`
- `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts`
- `src/api/http.ts`
- `src/api/modules/master-catalog.api.ts`
- `src/pages/Oportunidades.tsx`
- `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts`
- `src/pages/EstruturaComercial.tsx`
- `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts`
- `src/pages/CommercialCoverage.tsx`
- `src/features/simulation-runtime/hooks/useSimulationRuntimeShadow.ts`
- `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts`
- future cache wrapper layers

## 6. Structured log schema

The canonical log schema is a single structured object emitted by backend and selected frontend observability sinks.

| Field | Type | Availability | Description | Example |
| --- | --- | --- | --- | --- |
| `timestamp` | string (ISO-8601) | REQUIRED | Event time in UTC | `2026-07-12T12:34:56.789Z` |
| `level` | string | REQUIRED | Log severity | `info` |
| `tenantId` | string | REQUIRED_WITH_SANITIZATION_AND_ACCESS_CONTROL | Tenant context | `tenant_123` |
| `sourceType` | string | REQUIRED | Source classification | `frontend` |
| `consumer` | string | REQUIRED | Consumer identity | `Oportunidades` |
| `requestId` | string | REQUIRED | Request correlation at transport level | `finqz-...` |
| `correlationId` | string | REQUIRED_WHEN_AVAILABLE | Business transaction chain ID | `corr-...` |
| `traceId` | string | REQUIRED_WHEN_AVAILABLE | Distributed trace ID | `4bf92f3577b34da6a3ce929d0e0e4736` |
| `spanId` | string | REQUIRED_WHEN_AVAILABLE | Span identifier if tracing exists | `00f067aa0ba902b7` |
| `catalogVersion` | string | REQUIRED | Master Catalog version used in the request | `3.1.0` |
| `source` | string | REQUIRED | Emitting component | `master-catalog.controller` |
| `status` | string | REQUIRED | Result status | `success` |
| `latencyMs` | number or null | REQUIRED | Latency in milliseconds | `42` |
| `fallback` | boolean | REQUIRED | Whether fallback path was used | `false` |
| `shadow` | boolean | REQUIRED | Whether shadow path was used | `true` |
| `primary` | boolean | REQUIRED | Whether primary canonical path was used | `true` |
| `result` | string | REQUIRED | Outcome or status label | `MATCH` |
| `errorCode` | string or null | REQUIRED_WHEN_AVAILABLE | Machine-readable failure code | `VALIDATION_ERROR` |
| `errorMessage` | string or null | REQUIRED_WHEN_AVAILABLE | Human-readable error summary | `Missing tenant context` |

### 6.1 Optional diagnostic fields

- `httpMethod`
- `httpRoute`
- `httpStatus`
- `eventName`
- `eventId`
- `divergenceCount`
- `parityScore`
- `cacheKey`
- `comparisonStatus`
- `fallbackReason`
- `primarySource`
- `shadowSource`
- `consumerVersion`
- `operation`

### 6.2 Tenant policy

- logs: `tenantId` is allowed with sanitization and access control
- metrics: raw `tenantId` is prohibited as a label
- tracing: `tenantId` is allowed only according to security policy
- frontend: do not infer `tenantId` outside the authenticated context

### 6.3 Log rules

- Every Master Catalog log line must include tenant, consumer, request, catalog version, source, and result context.
- Correlation, trace, and span identifiers are included when the capability exists and the contract already exposes them.
- Error logs must never omit `errorCode` and `errorMessage`.
- Shadow and fallback usage must be distinguishable by boolean fields, not inferred from message text.
- Logs must be machine-parsable and must not rely on console formatting.
- Request IDs are transport IDs; correlation IDs are business IDs when available; trace IDs and span IDs are distributed tracing identifiers when available.
- No artificial trace/span identifiers may be generated when the capability does not exist.

## 7. Metrics

All metrics are contract-level names. Thresholds are not current values; they are release-gate targets to be approved before W5-03B promotion.

### 7.1 Metric classes

- `PRIMARY_METRIC`
  - `master_catalog_requests_total`
  - `master_catalog_primary_requests_total`
  - `master_catalog_fallback_requests_total`
  - `master_catalog_shadow_requests_total`
  - `master_catalog_shadow_divergence_total`
  - `master_catalog_errors_total`
  - `master_catalog_latency_ms`
  - `master_catalog_consumer_usage_total`
- `DERIVED_RATIO`
  - `master_catalog_availability`
  - `master_catalog_parity_score`
  - `master_catalog_primary_usage_ratio`
  - `master_catalog_fallback_ratio`
  - `master_catalog_error_ratio`
- `CONDITIONAL_METRIC`
  - `master_catalog_cache_hit_total`
  - `master_catalog_cache_miss_total`

| Metric | Description | Formula | Source | Unit | Threshold | Owner | Periodicity | Corrective action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `master_catalog_requests_total` | Total canonical requests | count of canonical Master Catalog requests | backend HTTP + API client | requests | gate target required | platform observability | rolling 5m / 1h / 24h | inspect route, tenant context, and request path |
| `master_catalog_primary_requests_total` | Canonical primary usage | count where `primary=true` | request logs / events | requests | gate target required | domain owner | rolling 5m / 1h / 24h | identify consumers still bypassing primary |
| `master_catalog_fallback_requests_total` | Fallback usage | count where `fallback=true` | request logs / events | requests | gate target required | domain owner | rolling 5m / 1h / 24h | reduce fallback scope or fix primary path |
| `master_catalog_shadow_requests_total` | Shadow executions | count where `shadow=true` | shadow comparator / shadow hook | requests | gate target required | observability owner | rolling 5m / 1h / 24h | validate shadow pipeline and comparator health |
| `master_catalog_shadow_divergence_total` | Shadow divergences | count of divergent comparisons | shadow comparator | divergences | gate target required | commercial/data owner | per release window | block retirement until divergence is explained |
| `master_catalog_errors_total` | Failures | count of failed requests/events | logs + error handler | errors | gate target required | platform owner | rolling 5m / 1h / 24h | classify error and fix source path |
| `master_catalog_latency_ms` | Latency histogram | request durations in milliseconds | request logs + spans | milliseconds | p95/p99 gate target required | platform observability | rolling 5m / 1h / 24h | investigate slow consumer, runtime, or repository |
| `master_catalog_availability` | Derived service availability ratio | successful canonical requests / total canonical requests | request lifecycle metrics | ratio | gate target required | platform owner | rolling 5m / 1h / 24h | inspect outages, failures, and readiness |
| `master_catalog_parity_score` | Derived parity ratio | matched comparison fields / compared fields | parity comparator | ratio | gate target required | data/commercial owner | per release window | keep shadow active and re-evaluate drift |
| `master_catalog_consumer_usage_total` | Consumer usage distribution | count by consumer and sourceType | events + logs | requests | gate target required | architecture owner | rolling 1h / 24h | identify consumers not yet migrated |
| `master_catalog_cache_hit_total` | Conditional cache hits | count of cache hits | conditional cache wrapper | hits | not applicable until official cache exists | platform owner | conditional | do not recommend creating cache for W5-03A/W5-03B |
| `master_catalog_cache_miss_total` | Conditional cache misses | count of cache misses | conditional cache wrapper | misses | not applicable until official cache exists | platform owner | conditional | do not recommend creating cache for W5-03A/W5-03B |

### 7.1 Metric semantics

- `availability` is a success ratio, not uptime marketing language.
- `parity_score` must be derived from a reproducible comparator, not a manual judgement.
- `shadow_divergence_total` must remain visible even when divergence is accepted formally.
- `primary_usage_ratio`, `fallback_ratio`, and `error_ratio` are derived ratios, not primary counters.
- raw `tenantId` must not be used as a metric label.
- cache metrics are conditional and not a prerequisite for W5-03A or W5-03B.

### 7.2 Ratio definitions

| Ratio | Numerator | Denominator | Population | Window | Exclusions | Source of base metrics |
| --- | --- | --- | --- | --- | --- | --- |
| `master_catalog_availability` | successful canonical requests | total canonical requests | all canonical request attempts | release window | synthetic health probes, if tracked separately | request lifecycle logs and counters |
| `master_catalog_parity_score` | matched comparison fields | compared fields | shadow comparisons | release window | incomplete comparisons, if explicitly invalid | parity comparator and shadow logs |
| `master_catalog_primary_usage_ratio` | primary canonical requests | total canonical requests | all canonical requests | release window | synthetic health probes | request lifecycle logs and primary counter |
| `master_catalog_fallback_ratio` | fallback requests | total canonical requests | all canonical requests | release window | cache misses, unless the fallback is the cache fallback | request lifecycle logs and fallback counter |
| `master_catalog_error_ratio` | failed requests | total canonical requests | all canonical requests | release window | non-request system noise | request lifecycle logs and failure counter |

## 8. Tracing

### 8.1 Required IDs

- `requestId` - `REQUIRED`
- `correlationId` - `REQUIRED_WHEN_AVAILABLE`
- `traceId` - `REQUIRED_WHEN_AVAILABLE`
- `spanId` - `REQUIRED_WHEN_AVAILABLE`
- `tenantId` - `REQUIRED` in logs with sanitization and access control
- `consumer` - `REQUIRED`
- `sourceType` - `REQUIRED`
- `catalogVersion` - `REQUIRED`

### 8.2 Semantics

- `requestId`: transport-level request correlation. The frontend HTTP client forwards `X-Request-ID` when the request path already supports it.
- `correlationId`: business log correlation across frontend, backend, shadow, and evidence flows when the contract already carries it.
- `traceId` and `spanId`: distributed tracing identifiers when tracing infrastructure exists and has been approved.
- `tenantId`: tenant-scoped identity propagated from auth and request context.
- `consumer`: named client or module using the catalog.
- `sourceType`: source classification for the emitting hop.
- `catalogVersion`: version of the catalog contract used in the request.

### 8.3 Propagation rules

1. Frontend API client creates or forwards `requestId`.
2. API request enters backend through `fastify.ts` and request correlation middleware.
3. Controller resolves `tenantId` from the authenticated tenant context.
4. Runtime and service carry `tenantId`, `requestId`, and `correlationId`.
5. Repository executes tenant-scoped Prisma queries.
6. Structured logs and events repeat the same identifiers.
7. Shadow and evidence flows keep the same `requestId` and `correlationId`.

No artificial trace identifiers are required for W5-03A, and W5-03B must not block on end-to-end distributed tracing unless that capability has been implemented and approved.

### 8.4 End-to-end path

Frontend
↓
API
↓
Controller
↓
Runtime
↓
Service
↓
Repository
↓
Prisma

### 8.5 Trace linking rules

- Every canonical request must be linkable from frontend log to backend log to database access.
- Shadow comparisons must share the same request and correlation identifiers as the initiating consumer.
- Evidence records must preserve request and correlation identifiers even when a fallback path is used.

## 9. Instrumentation map

### 9.1 Backend

| Layer | Where to instrument | What to record |
| --- | --- | --- |
| HTTP kernel | `backend/src/core/http/fastify.ts` | request start/finish, request correlation, readiness, errors, route context |
| Master Catalog route | `backend/src/modules/master-catalog/presentation/http/master-catalog.routes.ts` | consumer name, auth success/failure, route entry |
| Master Catalog controller | `backend/src/modules/master-catalog/presentation/http/master-catalog.controller.ts` | tenant, validation result, request outcome |
| Master Catalog runtime | `backend/src/modules/master-catalog/application/master-catalog.runtime.ts` | canonical mode, version, consumer context |
| Master Catalog service | `backend/src/modules/master-catalog/services/master-catalog.service.ts` | tenant enforcement, path selection |
| Master Catalog repository | `backend/src/modules/master-catalog/repositories/master-catalog.prisma.repository.ts` | query count, tenant scope, latency, result size |
| Prisma | `backend/prisma/seed.ts` and query access layer | seed bootstrap and canonical persistence evidence |
| Simulation adapter | `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.adapter.ts` | alias hit, fallback used, product/subproduct normalization |
| Simulation metadata | `backend/src/modules/simulation/products/loan-with-collateral/loan-with-collateral.metadata.ts` | product identity and compatibility scope |

### 9.2 Frontend

| Layer | Where to instrument | What to record |
| --- | --- | --- |
| API client | `src/api/http.ts` and `src/api/modules/master-catalog.api.ts` | requestId, route, response status, latency, consumer |
| Oportunidades | `src/pages/Oportunidades.tsx` | canonical fetch success/failure, empty-tree fallback, consumer registration |
| Estrutura Comercial | `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts`, `src/pages/EstruturaComercial.tsx` | tree load success/failure, sync counts, mapper outcome |
| Commercial Coverage | `src/features/commercial-structure/loadCommercialStructureCoverageTree.ts`, `src/pages/CommercialCoverage.tsx` | shadow start/finish/divergence, comparator results, coverage tree result |
| Simulation Runtime shadow | `src/features/simulation-runtime/hooks/useSimulationRuntimeShadow.ts`, `src/features/simulation-runtime/telemetry/simulation-runtime.telemetry.ts` | shadow start/finish, evidence stored/failed, fallback used, comparison summary |
| Stores | `src/store/index.ts` | legacy source usage, derived structure source, migration residuals |
| Simulador | `src/pages/Simulador.tsx` | dependency on compatibility repository and fallback behavior |
| Tabelas Comerciais | `src/pages/TabelasComerciais.tsx` | selector origin, catalog source, fallback behavior |

### 9.3 Consumer-specific rules

- Oportunidades: emit start/finish/failure and fallback usage.
- Estrutura Comercial: emit primary usage and sync result.
- Commercial Coverage: emit shadow start/finish/divergence and parity result.
- loan-with-collateral: emit primary, alias-hit, and fallback usage.
- consumer registration: conditional only, if a real operational registry exists.
- Simulation Runtime: emit shadow telemetry and evidence events.
- Legacy stores and repositories: emit registration and residual usage only while they exist.

## 10. Release gates

The observability contract is intended to block a premature first functional cut. W5-03B can move from `DEFERRED_PENDING_GATES` to `GO` only when the evidence below exists in the release pack.

| Gate | Evidence required | Pass criteria | Fail criteria | Owner |
| --- | --- | --- | --- | --- |
| Gate A - Observability baseline | Structured schema published and logs emitted | mandatory fields present in logs and events | any mandatory field missing | observability owner |
| Gate B - Request correlation | requestId, consumer, and sourceType are observable between frontend and backend | frontend requestId correlates to backend requestId when technically available without incompatible contract change | request correlation cannot be established | platform owner |
| Gate C - Primary usage | canonical primary usage measured per consumer | primary requests are measurable for Oportunidades and Estrutura Comercial | primary usage cannot be measured | consumer owner |
| Gate D - Fallback measurement | fallback usage measured per consumer | fallback events are visible and attributable | fallback use is not counted or not attributable | domain owner |
| Gate E - Shadow parity | shadow results and divergences measured | parity score and divergence totals are reproducible | comparator absent or inconsistent | commercial owner |
| Gate F - Latency and availability | latency and availability metrics exposed | p95, p99, and availability are visible in the window | metrics unavailable | platform owner |
| Gate G - Error visibility | failures are classified and counted | errors_total reconciles with logs | failure classification missing | platform owner |
| Gate H - Rollback rehearsal | rollback of observability is documented and testable | rollback can disable telemetry without changing behavior | rollback requires production code change | architecture owner |

### 10.1 Exact evidence required to liberate W5-03B

W5-03B `Oportunidades` may move to `GO` only after the release pack contains all of the following:

1. `MASTER_CATALOG_REQUEST_STARTED`, `MASTER_CATALOG_REQUEST_FINISHED`, and `MASTER_CATALOG_REQUEST_FAILED` are emitted and visible.
2. `requestId`, `consumer`, and `sourceType` are correlated between frontend and backend when technically available without contract breakage.
3. `MASTER_CATALOG_PRIMARY_USED` and `MASTER_CATALOG_FALLBACK_USED` are counted per consumer.
4. `MASTER_CATALOG_SHADOW_STARTED`, `MASTER_CATALOG_SHADOW_FINISHED`, and `MASTER_CATALOG_SHADOW_DIVERGENCE` are visible for shadow consumers.
5. `MASTER_CATALOG_PARITY_RESULT` is reproducible from logs and metrics.
6. Structured logs carry the required and required-when-available fields.
7. `master_catalog_availability`, `master_catalog_latency_ms`, `master_catalog_parity_score`, and the base counters used by the ratios are exposed.
8. A rollback rehearsal exists that removes observability from the path without changing runtime behavior.
9. The release checklist approves the numeric thresholds for the gates after baseline.
10. Full distributed tracing is not a blocker unless it has been implemented and approved.

### 10.2 Release gate thresholds

Thresholds are intentionally not hard-coded in this spec. They must be declared in the release checklist for the specific rollout window and approved before W5-03B promotion.

## 11. Rollback

Rollback of observability must not change runtime behavior, HTTP contracts, persistence, or feature flags.

Allowed rollback actions:

- disable new event sinks
- disable new metric export paths
- disable new trace exporters
- keep canonical request behavior unchanged
- keep shadow behavior unchanged
- keep fallback behavior unchanged
- keep tenant and correlation propagation unchanged

Rollback must be possible by configuration or by swapping the observability package version, not by altering production logic.

## 12. ADR, EPC, and Runbook ownership

### 12.1 ADR required

ADR is required when the decision changes domain ownership, canonical identifiers, persistence semantics, fallback semantics, or consumer retirement policy.

Examples:

- changing the canonical taxonomy of product/subproduct identity
- changing the meaning of `catalogVersion`
- changing the ownership of `creditPfCatalog`
- changing the retirement policy for `loan-with-collateral`

### 12.2 EPC required

EPC is required when the decision defines the observability contract, event schema, metric names, gate criteria, or the consumer inventory.

Examples:

- adding or changing observability events
- changing structured log schema
- defining metrics and parity rules
- defining release gates and rollout criteria

### 12.3 Runbook required

Runbook is required when the decision affects operations, incident response, release execution, alerting, or rollback procedure.

Examples:

- enabling or disabling observability exporters
- investigating missing traces or missing metrics
- handling parity divergence during rollout
- performing a rollback rehearsal

## 13. Release posture

- `READINESS_W5_OVERALL`: `GO_WITH_RESTRICTIONS`
- `READINESS_W5_03A_OBSERVABILITY`: `AUTHORIZED`
- `READINESS_W5_03B_OPPORTUNITIES`: `DEFERRED_PENDING_GATES`
- `READINESS_FIRST_FUNCTIONAL_CUT`: `DEFERRED_PENDING_GATES`
- `READINESS_LEGACY_REMOVAL`: `NO_GO`
- `READINESS_LOAN_WITH_COLLATERAL_FALLBACK_REMOVAL`: `NO_GO`
- `READINESS_CREDIT_PF_CATALOG_RETIREMENT`: `NO_GO`

## 14. Closure

This specification authorizes the observability prerequisites for Master Catalog and defines the evidence required before any first functional cut is allowed. The next executable step is `W5-03A Observability Prerequisites`.
