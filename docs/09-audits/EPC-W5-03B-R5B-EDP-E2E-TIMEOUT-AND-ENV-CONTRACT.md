# EPC-W5-03B-R5B - EDP E2E Timeout and Env Contract

## Scope
- Diagnose the `edp.runtime.e2e.test.ts` timeout without inflating the timeout or converting the flow to an in-memory test.
- Verify the test environment contract around `NODE_ENV` and `APP_ENV`.
- Keep the real app bootstrap path intact.

## What Changed
- The EDP runtime test now creates one stable fake Prisma client and reuses it across cases.
- The app bootstrap is imported once through the normal `createApp()` path, without `vi.resetModules()`.
- Per-test state is reset by mutating the shared fake Prisma client, not by reloading the module graph.

## Root Cause
- The test was forcing a cold reload of the app module graph on every case.
- `vi.resetModules()` combined with a freshly created fake Prisma client made the app bootstrap expensive enough to hit the 30s Vitest timeout on the first EDP case.
- The test setup contract does not define `APP_ENV=test`; the schema only accepts `local`, `homologation`, and `production`.

## Environment Contract Notes
- `NODE_ENV=test` is supported by the env schema.
- `APP_ENV=test` is not supported by the env schema.
- The test setup only pins `NODE_ENV` and related runtime defaults, so `APP_ENV` falls back to the schema default of `local`.
- See `backend/src/config/env/env.schema.ts` and `backend/src/tests/setup.ts`.

## Validation
- Ran the isolated EDP runtime file 3 times in a clean Linux container with the worktree mounted.
- Each run passed:
  - 7 tests passed
  - no timeout
- The observed runtime was about 51 to 54 seconds per run, but each individual test completed within the Vitest timeout.

## Notes
- The broader integration suite still includes real PostgreSQL-backed files that need a reachable database from the Linux container in this environment.
- That external connectivity issue is separate from the EDP runtime timeout fix.

