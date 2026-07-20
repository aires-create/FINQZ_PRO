# EPC-W5-03B-R4D - Residual Test Failure Qualification and Release Safety Gate

## Verdict

NO_GO

## Baseline

- Branch: `homologation/bootstrap-vps`
- Candidate head: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- HML head: `957e2fc696d9ec067683f26335756ecaf72b0290`
- Isolated worktree: `C:\Projects\FINQZ_PRO\_worktrees\w5-03b-r4-cce8840`

## Reproducible Linux Validation

Executed in disposable `node:20-bookworm-slim` containers with local PostgreSQL and Redis support containers started from the backend compose file.

- `npm ci`: PASS
- `npm test`: PASS
- `npm run build`: PASS

Observed full-suite summary:

- 270 test suites total
- 270 test suites passed
- 0 test suites failed
- 872 tests total
- 872 tests passed
- 0 tests failed

## Residual Failures

None in the current Linux full run.

There are no remaining runtime failures to classify as `RELEASE_BLOCKER`, `LEGACY_FAILURE`, `ENVIRONMENT_ONLY`, `FLAKY`, `NON_BLOCKING_KNOWN_FAILURE`, `TEST_DESIGN_DEFECT`, `RUNTIME_DEFECT`, or `INSUFFICIENT_EVIDENCE` from the runner output itself.

## Integrity Audit Of The Wave

The release gate is still blocked because the wave changed several suites that were previously expected to validate Prisma-backed behavior, but they now run against in-memory or fake Prisma harnesses.

### Changed suites

| File | Current semantics | Classification |
| --- | --- | --- |
| `backend/src/tests/integration/edp.persistence.prisma.test.ts` | Uses `createInMemoryEdpAggregateRepository`, `createInMemoryEdpEventStore`, `createInMemoryEdpOutbox`, `createInMemoryEdpAuditRepository`, `createInMemoryEdpIdempotencyRepository`, and `createInMemoryEdpCorrelationRepository` instead of a real Prisma client or PostgreSQL. | `INVALID_TEST_TRANSFORMATION` |
| `backend/src/tests/integration/edp.runtime.e2e.test.ts` | Uses `createFakePrismaClient`, `InMemoryEdpUnitOfWork`, and `vi.mock` for `database/prisma.js`, `core/prisma/client.js`, and `modules/edp/composition/index.js`. | `UNITIZED_BY_MOCKING` |
| `backend/src/tests/integration/simulation-runtime-evidence.http.test.ts` | Uses `createFakePrismaClient`, an in-memory repository, and mocks `database/prisma.js`, `config/app.js`, and `modules/security-events/index.js`. | `PARTIALLY_DEGRADED` |
| `backend/src/tests/integration/simulation-runtime-evidence.persistence.prisma.test.ts` | Uses an in-memory repository only and does not exercise Prisma or PostgreSQL. | `INVALID_TEST_TRANSFORMATION` |

### Context note

The adjacent persistence suite `backend/src/tests/integration/edp.persistence.test.ts` also uses a fake Prisma client, so there is no equivalent real-database coverage path in the local wave for these flows.

## Validation Details

### Candidate image

- Image: `finqz-pro-backend:hml-cce8840`
- Image ID: `sha256:9fd64615f722c576afd50d615a96b2f1eb31bfdb09b68e4766c77849cc45767b`
- Digest: `finqz-pro-backend@sha256:9fd64615f722c576afd50d615a96b2f1eb31bfdb09b68e4766c77849cc45767b`
- Created: `2026-07-14T14:05:57.672097868Z`
- Size: `219787912`
- Entrypoint: `["docker-entrypoint.sh"]`
- Cmd: `["node","dist/server.js"]`
- Healthcheck: `null`

### Rollback strategy

Rollback must remain image-explicit and rebuild-free.

- Current rollback source image ID: `sha256:c573f01f3ca9751b1b60ff8af252eab101885e7c9ec7af0d170a2bd7d0768d08`
- Current rollback source tag: `backend-api:latest`
- Future explicit rollback tag required before a revert: `backend-api:rollback-f945b26`

Operational intent:

- deploy the API with the candidate image tag
- revert with the explicit rollback tag only
- do not rebuild during rollback
- do not change frontend, Nginx, PostgreSQL, or Redis for the revert path

## Migration

Not executed.

Reference migration remains:

- `backend/prisma/migrations/20260710120000_sdc_3_4h_b_simulation_runtime_evidence/migration.sql`

Status remains `SAFE_ADDITIVE`.

## Risks

- The Linux runner is green, but the changed suites no longer prove real Prisma/PostgreSQL integration for the flows they name.
- The wave introduced a test-design regression by replacing database-backed validation with fake or in-memory harnesses.
- Without equivalent real-db coverage, a release can pass the runner while still hiding persistence regressions.

## Next Step

Restore or add equivalent real Prisma/PostgreSQL integration coverage for the affected flows before approving a backend release precheck.

## Safety Statement

- No deploy
- No migration
- No restart
- No commit
- No push
