# EPC-W5-03B-R5A Disposable Postgres Integration Validation

## Scope
- Validated the backend Prisma/PostgreSQL path against a disposable PostgreSQL 16 container only.
- Did not touch HML, production, the official local database, or any deployed stack.
- Did not execute deploy, commit, push, prune, or schema edits by hand.

## Disposable Database
- Container: `finqz-r5a-postgres`
- Image: `postgres:16-alpine`
- Published host port: `127.0.0.1:52625`
- Database: `finqz_r5a_test`
- User: `finqz_test`
- Password: `TEMPORARY_TEST_CREDENTIAL`
- Health: `running` and accepting connections

## Connectivity Checks
- DNS / host: `localhost` resolves to `::1` and `127.0.0.1`
- TCP: `127.0.0.1:52625` passed
- Authentication: `psql` login succeeded
- `SELECT 1`: passed
- Prisma `\$connect`: exercised implicitly by the real Prisma suites

## Environment Contract
- `NODE_ENV=test`
- `APP_ENV=local`
- `DATABASE_URL=postgresql://localhost:5432/finqz_r5a_test`
- `DIRECT_URL=postgresql://localhost:5432/finqz_r5a_test`
- `JWT_SECRET` and `JWT_REFRESH_SECRET` were set to temporary non-production values
- `CORS_ORIGIN=http://localhost:5173`

Note: the current codebase only accepts `APP_ENV` values `local`, `homologation`, and `production`, so `APP_ENV=test` is not valid in the present schema. The validation used `APP_ENV=local` to keep the runtime aligned with the current contract while still running `NODE_ENV=test`.

## Prisma Validation
- `npm ci`: PASS
- `npx prisma validate`: PASS
- `npx prisma generate`: PASS
- Prisma client target: `debian-openssl-3.0.x`
- No `libssl` failure after installing `openssl` in the Linux container

## Migration Inventory
- Total migrations: 18
- Oldest: `20260507224052_init_enterprise`
- Newest: `20260710120000_sdc_3_4h_b_simulation_runtime_evidence`
- Target migration present: yes

### Destructive SQL scan
- The only migration containing destructive historical statements was `20260511193021_init_foundation`
- Matches included `DROP COLUMN` statements in the migration history
- No migration was modified

## Applied Migrations
- `prisma migrate deploy`: PASS
- `prisma migrate status`: Database schema is up to date
- Applied migration count: 18

## Critical Tables
Confirmed present:
- `public.edp_simulations`
- `public.edp_decision_policies`
- `public.edp_event_store`
- `public.simulation_runtime_evidence`

Confirmed metadata:
- `edp_simulations`: PK on `id`, FK to `tenants(id)`, unique `(tenantId, aggregateId)`, indexes on `tenantId`, `tenantId/aggregateType`, `tenantId/deletedAt`
- `edp_decision_policies`: PK on `id`, FK to `tenants(id)`, unique `(tenantId, aggregateId, version)`, indexes on `tenantId`, `tenantId/aggregateId`, `tenantId/status`, `tenantId/deletedAt`
- `edp_event_store`: PK on `eventId`, FK to `tenants(id)`, indexes on `tenantId`, `tenantId/aggregateId`, `tenantId/correlationId`, `tenantId/eventName`, `tenantId/occurredAt`
- `simulation_runtime_evidence`: PK on `id`, FK to `tenants(id)`, unique `(tenantId, campaignId, evidenceId)`, indexes on `tenantId`, `tenantId/campaignId`, `tenantId/campaignId/subproductCode`, `tenantId/campaignId/comparisonStatus`, `tenantId/campaignId/divergenceCategory`, `tenantId/campaignId/timestamp`, `tenantId/correlationId`

## Prisma Target
- Generated client binary artifacts included `libquery_engine-debian-openssl-3.0.x.so.node`
- Prisma also kept the fallback `debian-openssl-1.1.x` artifact, but the Linux validation path used the `3.0.x` target successfully

## Real Prisma Suites

### Passed
- `backend/src/tests/integration/edp.persistence.prisma.test.ts`: 5/5 tests PASS
- `backend/src/tests/integration/simulation-runtime-evidence.http.test.ts`: 1/1 test PASS
- `backend/src/tests/integration/simulation-runtime-evidence.persistence.prisma.test.ts`: 4/4 tests PASS

### Failed
- `backend/src/tests/integration/edp.runtime.e2e.test.ts`: 1 file failed
- First run: 7 tests, 2 timed out at 30s
- Full backend test run: 7 tests, 3 failed
- The failing cases are timeout-sensitive and one follow-up query assertion in the same file was contaminated by the earlier timeout path

## InMemory Suites
All four companion suites passed:
- `edp.persistence.memory.test.ts`: 4/4
- `edp.runtime.memory.test.ts`: 4/4
- `simulation-runtime-evidence.memory.test.ts`: 4/4
- `simulation-runtime-evidence.persistence.memory.test.ts`: 3/3

## Full Integration Run
- `npm run test:integration` equivalent in the backend worktree: 131/132 files passed, 884/887 tests passed
- One failing file: `src/tests/integration/edp.runtime.e2e.test.ts`

## Suite Complete
- Root `npm test`: PASS, 26 files / 112 tests
- Backend `npm test`: FAIL, 131 files / 887 tests, 1 failing file
- Root `npm run build`: PASS
- Backend `npm run build`: PASS

## Enterprise Semantics
- Real Prisma client: yes
- Real PostgreSQL: yes
- Real repository execution: yes
- INSERT/SELECT/UPDATE/DELETE: exercised in the passing Prisma suites
- Transaction + rollback: exercised in the EDP persistence/runtime coverage
- FK and unique constraints: exercised by live inserts and catalog checks
- Tenant isolation: exercised in both Prisma suites and the simulation runtime HTTP suite
- Idempotency: exercised in the simulation runtime HTTP suite
- Read-after-write: exercised by repository assertions after persistence

Classification:
- `INTEGRATION_SEMANTICS_PRESERVED` for the passing Prisma-backed suites
- `PARTIAL_DATABASE_COVERAGE` for the overall backend test run because one EDP runtime E2E file still fails

## Migration HML
- Migration: `backend/prisma/migrations/20260710120000_sdc_3_4h_b_simulation_runtime_evidence/migration.sql`
- Classification: `SAFE_ADDITIVE`
- Startup impact: not required before backend process start
- Feature impact: required before the simulation runtime evidence feature is used
- Readiness impact: readiness does not query this table directly
- Compatibility without it: backend can start, but feature usage needs the migration
- Classification choice: `MIGRATION_REQUIRED_BEFORE_FEATURE_USE`

## Rollback
- Source-of-truth HML digest preserved: `sha256:f945b26ed54242be14736dcc10e21a5a59e7984288a9892cbae7d2d0ae81a898`
- No HML tag was created
- No rollback was executed on HML
- Additive migration rollback is non-destructive because it only introduces tables, indexes, and foreign keys

## Cleanup
- The disposable PostgreSQL container was removed after validation
- No official containers were touched
- No volumes were pruned
- No deploy occurred
- No commit or push occurred

## Verdict
- `TEST_PYRAMID_NOT_RESTORED`

## Next Step
- Fix the slow/failing `edp.runtime.e2e.test.ts` startup path or raise its timeout policy so the backend suite can go fully green again.
