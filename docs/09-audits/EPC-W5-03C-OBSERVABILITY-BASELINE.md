# EPC-W5-03C - Baseline Observability & Release Gates

- status: `DEFERRED`
- verdict: `DEFERRED_PENDING_GATES`
- wave: `EPC-W5 - Master Catalog SSOT Consolidation`
- baselineBranch: `homologation/bootstrap-vps`
- baselineHead: `1d20966e95911d94ea266cf762a6fc9123f0fc3e`
- architectureValidated: `true`
- liveEndpointEvidence: `false`
- backendBootstrapEvidence: `failed`
- firstFunctionalCut: `deferred`
- previousAuditEvidence: `stale_or_insufficient`
- rerunNeededAfterHeadConfirmation: `true`

## 1. Executive summary

This baseline validates the observability architecture already built for the Master Catalog:

- `Master Catalog Runtime`
- `Observability Adapter`
- `Structured Logger Sink`
- `Noop Sink` as fallback
- existing corporate logger

The code and test suite confirm the observability contracts and fail-safe behavior.
However, the operational baseline required for the first Functional Cut could not be completed in this environment because the backend bootstrap failed before the HTTP server could listen.

The earlier audit evidence tied to `fc2a992` is stale/insufficient for the current release baseline and must not be used to claim live validation of the `1d20966` structured logger sink without a re-run aligned to the confirmed `HEAD`.

The failure occurred during database readiness:

- `PrismaClientInitializationError`
- TLS credential error while opening the database connection
- no live HTTP endpoints could be exercised end-to-end

Evidence captured during the attempt:

- `backend/epc-w503c.out.log`
- `backend/epc-w503c.err.log`

## 2. Architecture validated

The validated architecture is strictly passive and in-process:

1. Master Catalog controller emits request lifecycle events.
2. Observability Adapter sanitizes and validates the event.
3. Structured Logger Sink writes a single structured record using the corporate logger.
4. Noop Sink absorbs failures and preserves functional flow.

No external telemetry exporter, queue, database write, or tracing backend is introduced.

## 3. Endpoints analyzed

The Master Catalog route surface analyzed for this baseline contains exactly five authenticated GET endpoints:

1. `GET /api/v1/master-catalog/tree`
2. `GET /api/v1/master-catalog/segments`
3. `GET /api/v1/master-catalog/products`
4. `GET /api/v1/master-catalog/products/:productId/subproducts`
5. `GET /api/v1/master-catalog/subproducts/:subproductId/modalities`

No POST, PUT, PATCH, or DELETE endpoints exist in this slice.

## 4. Live execution attempt

I attempted to start the compiled backend locally with the current environment.

Result:

- process started
- database readiness check failed before the server could listen
- no real endpoint calls could be executed

Observed failure signature:

- `Error opening a TLS connection: Credenciais não disponíveis no pacote de segurança`
- `Database connection failed`
- `Failed to start server`

Conclusion:

- runtime bootstrap is blocked in this environment
- the operational baseline remains incomplete
- the release gates that depend on live request evidence stay deferred
- the next step is a local readiness diagnosis, not a functional change

## 5. Events validated

The implementation and tests validate the following event family:

- `REQUEST_STARTED`
- `PRIMARY_USED`
- `REQUEST_FINISHED`
- `REQUEST_FAILED`

Event behavior confirmed by code and unit tests:

- `REQUEST_STARTED` is emitted at request entry
- `PRIMARY_USED` is emitted after successful runtime completion
- `REQUEST_FINISHED` is emitted after success
- `REQUEST_FAILED` is emitted on controller/runtime failure
- sink failures do not alter the HTTP response path

Important limitation:

- no live production-like execution evidence was captured for these events in this environment

## 6. Metrics collected

No live metric samples were collected.

All metrics below are defined for the baseline but were not collected live:

- `requests_total`
- `primary_requests_total`
- `failed_requests_total`
- `latency`
- `availability`
- `primary_usage_ratio`
- `error_ratio`

- `requests_total`: `DEFINED_NOT_COLLECTED_LIVE`
- `primary_requests_total`: `DEFINED_NOT_COLLECTED_LIVE`
- `failed_requests_total`: `DEFINED_NOT_COLLECTED_LIVE`
- `latency`: `DEFINED_NOT_COLLECTED_LIVE`
- `availability`: `DEFINED_NOT_COLLECTED_LIVE`
- `primary_usage_ratio`: `DEFINED_NOT_COLLECTED_LIVE`
- `error_ratio`: `DEFINED_NOT_COLLECTED_LIVE`

## 7. Release gates

| Gate | Criterion | Status | Evidence |
|---|---|---:|---|
| A | Schema emitted correctly | PASS_BY_TEST_AND_STATIC_EVIDENCE | telemetry contracts, unit tests, static architecture |
| B | RequestId propagated | PASS_BY_TEST_NOT_LIVE_VALIDATED | telemetry emitter tests, no live validation |
| C | Primary usage mensurável | FAIL_NO_LIVE_EVIDENCE | no live request execution evidence |
| D | Fallback mensurável | NOT_APPLICABLE | no fallback functional path exists in the currently instrumented Master Catalog backend flow |
| E | Parity prepared | NOT_APPLICABLE | shadow/parity does not occur in this backend flow |
| F | Latency mensurável | FAIL_NO_LIVE_EVIDENCE | no live request execution evidence |
| G | Errors classified | FAIL_NO_LIVE_EVIDENCE | no live request execution evidence |
| H | Rollback documented | PASS_BY_DOCUMENTATION_AND_TEST | rollback posture documented and validated by tests |

Overall interpretation:

- live baseline not proven
- first Functional Cut must remain deferred

## 8. Rollback posture

Rollback is documentation-only in this stage and does not alter runtime:

- technical rollback: disable or remove the observability sink wiring
- operational rollback: stop the local backend process and preserve current code
- functional rollback: no functional rollback is required because the runtime was not changed
- observability rollback: route the adapter back to `NoopObservabilitySink`

## 9. Next step

`W5-03C-R1 — LOCAL RUNTIME READINESS DIAGNOSIS`

Objective:

- identify, using read-only and safe diagnostic commands only, why the local process fails PostgreSQL/TLS readiness while integration tests can connect in other paths

Constraints:

- do not alter `.env`
- do not alter `.env.example`
- do not alter `DATABASE_URL`
- do not disable TLS
- do not alter Prisma
- do not create migrations
- do not execute deploy
- do not access or modify VPS
- do not bypass readiness

## 10. Risks

### BLOCKER

- backend bootstrap cannot complete in this environment because database readiness fails before the HTTP server listens

### CRITICAL

- no real HTTP endpoint evidence could be generated

### HIGH

- release gates `C`, `D`, `F`, and `G` remain unproven with live execution
- first Functional Cut cannot be authorized yet

### MEDIUM

- operational readiness is still documentary-only
- request lifecycle volume will need runtime measurement once the backend is reachable

### LOW

- static telemetry contracts are stable
- build and test validation succeeded

### Comparison with EPC-W5-GR

Compared with `EPC-W5-GR`, the architectural risk is lower because observability contracts and the structured logger sink already exist.
The operational risk is still high because the environment could not produce live endpoint evidence.

## 11. Gaps

- no live backend listening state
- no real endpoint calls
- no live request/latency/fallback metrics
- no shadow parity evidence
- no release-gate evidence from a running system

## 12. Validation results

- `npm run test` passed
- `npm run build` passed
- `git diff --check` passed
- `git status --short --branch` captured for baseline reporting

## 13. Files created

- `docs/09-audits/EPC-W5-03C-OBSERVABILITY-BASELINE.md`
- `docs/09-audits/evidence/EPC-W5-03C-OBSERVABILITY-BASELINE.json`
- `docs/09-audits/evidence/EPC-W5-03C-RELEASE-GATES.mmd`

## 14. Final decision

The operational baseline is not complete because the required live evidence could not be produced.

Verdict: `DEFERRED_PENDING_GATES`
