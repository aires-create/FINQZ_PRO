# EPC-W5-03B-R5 - Enterprise Test Pyramid Restoration

## Verdict

TEST_PYRAMID_NOT_RESTORED

## Baseline

- Branch: `homologation/bootstrap-vps`
- Candidate head: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- Isolated worktree: `C:\Projects\FINQZ_PRO\_worktrees\w5-03b-r4-cce8840`

## Scope

- Restore the earlier Prisma/PostgreSQL integration suites to real database-backed semantics.
- Add parallel InMemory equivalent suites without changing functional behavior, API contracts, Docker/runtime, migrations, Redis, PostgreSQL, or Nginx behavior.
- Keep the change limited to the test pyramid contract.

## Source Restoration

The four previously unitized integration suites were restored back to their real Prisma/PostgreSQL `HEAD` content:

- `backend/src/tests/integration/edp.persistence.prisma.test.ts`
- `backend/src/tests/integration/edp.runtime.e2e.test.ts`
- `backend/src/tests/integration/simulation-runtime-evidence.http.test.ts`
- `backend/src/tests/integration/simulation-runtime-evidence.persistence.prisma.test.ts`

Parallel InMemory equivalents were added:

- `backend/src/tests/integration/edp.persistence.memory.test.ts`
- `backend/src/tests/integration/edp.runtime.memory.test.ts`
- `backend/src/tests/integration/simulation-runtime-evidence.memory.test.ts`
- `backend/src/tests/integration/simulation-runtime-evidence.persistence.memory.test.ts`

## Validation Summary

### Dependency and build hygiene

- `npm ci`: PASS
- `npm run build`: PASS

### InMemory coverage

- `npm run test -- src/tests/integration/edp.persistence.memory.test.ts src/tests/integration/edp.runtime.memory.test.ts src/tests/integration/simulation-runtime-evidence.memory.test.ts src/tests/integration/simulation-runtime-evidence.persistence.memory.test.ts`
- Result: PASS
- Test files: 4
- Tests: 15

### Real integration coverage

- `npm run test:integration` with explicit `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, and JWT/CORS env vars injected temporarily
- Result: FAIL
- Test files: 17 total
- Passed: 14
- Failed: 3
- Failed tests: 10

Observed failure mode:

- Prisma reported missing tables in the current database, including:
  - `public.edp_simulations`
  - `public.edp_decision_policies`
  - `public.edp_event_store`
  - `public.simulation_runtime_evidence`
- The HTTP integration suite returned `500` where `201` was expected because persistence could not reach the table.

### Disposable Linux container check

- `npm ci`: PASS
- `prisma migrate status`: reported pending migrations in the disposable database
- Migrations were not executed because this phase forbids migration actions

## Diagnosis

The test pyramid is not fully restored operationally because the real Prisma/PostgreSQL path cannot be validated in the current database state without applying migrations.

The source tree now contains the correct split:

- real Prisma/PostgreSQL integration suites
- matching InMemory suites

But the real suites still fail against the current database because the schema is not present.

## Risks

- If the backend is released without a migrated database, the real integration suites will continue to fail at runtime.
- The new InMemory suites protect contract-level behavior, but they do not replace database-backed coverage.

## Next Step

Apply the missing migrations in a controlled environment and rerun `npm run test:integration` before treating the pyramid as restored end-to-end.

## Safety Statement

- No deploy
- No migration
- No restart
- No commit
- No push
