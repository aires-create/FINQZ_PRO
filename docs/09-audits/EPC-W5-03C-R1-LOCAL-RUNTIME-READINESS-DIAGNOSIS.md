# EPC-W5-03C-R1 - Local Runtime Readiness Diagnosis

## Baseline

- Branch: `homologation/bootstrap-vps`
- HEAD: `7dce49757a0c2b2dff7dbb229ec0fc43e2052bbe`
- Commit: `docs(audit): add W5-03C observability baseline and release gates`
- Upstream: `origin/homologation/bootstrap-vps`
- Status at capture time:
  - `M .env.example`
  - `?? docs/01-architecture/SDC-FASE-3.4H-F-LOCAL-ACTIVATION-READINESS.md`
  - `?? scripts/sdc-3.4h-f-local-readiness.mjs`

## Versions

- Node.js: `v24.15.0`
- npm: `11.12.1`
- OpenSSL: `3.5.5`
- Prisma CLI: `5.22.0`
  - Note: `npx prisma --version` printed the Prisma version and then failed to spawn `schema-engine-windows.exe` with `EPERM`.

## Environment Files Found

| File | Size | Last write | SHA-256 |
|---|---:|---|---|
| `.env` | 44 | 2026-06-02 09:59:28 | `82233CF489B6F63853F165F5F49C818AC739E534CC032A78D5AB414EDAF0F70C` |
| `.env.example` | 1480 | 2026-07-10 18:18:23 | `33FD8EF65E4B339B3AE7486E2BBC4E6A9C6C12BA13838D648D91E317583DC245` |
| `src/.env` | 34 | 2026-05-05 12:21:54 | `A53E4CC38209A8CECBA6BAE6515CEAC216012A768C902A96FF15FD2A2BFA99FC` |
| `backend/.env` | 1099 | 2026-05-31 16:05:48 | `51ED24A9DAC11CE1AF2C376C8EB6D133723E1CC80CA75F0A55F0B26676E71734` |
| `backend/.env.example` | 2764 | 2026-05-31 16:07:10 | `9D1384BA50390EE1B3AC2CC2AA43E9D658D5063051A702BD74AEF6FD7B4F5967` |

## Runtime vs Tests

### Root cwd

- Command executed from `C:\Projects\FINQZ_PRO`.
- Importing `backend/src/database/prisma.ts` triggered `dotenv.config()` from the repository root.
- Result: environment validation failed before Prisma.

### Backend cwd

- Command executed from `C:\Projects\FINQZ_PRO\backend`.
- Importing `src/database/prisma.ts` triggered `dotenv.config()` from `backend`.
- Result: `backend/.env` was loaded and Prisma connected successfully.
- `SELECT 1` succeeded.

### Runtime loader

- Runtime bootstrap path uses `src/config/env/env.ts` -> `dotenv.config()` -> `parseEnv()` -> `src/database/prisma.ts` -> `PrismaClient`.
- The readiness path `testDatabaseConnection()` succeeded from `backend` cwd.

### Test loader

- Test setup seeds `NODE_ENV=test`, `PORT=4000`, `HOST=127.0.0.1`, Redis, JWT, CORS, and logging values before the app is imported.
- The Prisma env is loaded from `backend/.env` when the module is imported.
- The test-loader reproduction also connected successfully and returned `SELECT 1`.

## Sanitized Connection Metadata

- `hostClass`: `managed_postgresql_pooler`
- `poolerPort`: `6543`
- `directPort`: `5432`
- `databaseClass`: `default_postgres_database`
- `dnsResolution`: `PASS`
- `tcpPoolerConnectivity`: `PASS`
- `queryParamNames`: `pgbouncer`
- `pgbouncer`: `true`
- `sslmode`: absent

## Bootstrap Flow

1. `server.ts` calls `testDatabaseConnection()` before starting Fastify.
2. `testDatabaseConnection()` calls `prisma.$connect()`.
3. `testDatabaseConnection()` issues `SELECT 1`.
4. If either step fails, bootstrap aborts before the HTTP listener is started.

## Readiness Flow

1. `dotenv.config()` loads env from the current working directory.
2. `env.ts` validates required keys and transforms URLs.
3. `database/prisma.ts` builds the Prisma client from the resolved env.
4. `testDatabaseConnection()` validates PostgreSQL connectivity.
5. The server only reaches Fastify startup after readiness passes.

## PostgreSQL-Accessing Tests

- `backend/src/tests/integration/edp.persistence.prisma.test.ts`
- `backend/src/tests/integration/simulation-runtime-evidence.persistence.prisma.test.ts`

The rest of the `backend/src/tests/integration` tree is largely mocked at the Prisma boundary.

## Release Gates

- Gate A: `PASS_BY_TEST_AND_STATIC_EVIDENCE`
- Gate B: `PASS_BY_TEST_NOT_LIVE_VALIDATED`
- Gate C: `FAIL_NO_LIVE_EVIDENCE`
- Gate D: `NOT_APPLICABLE`
- Gate E: `NOT_APPLICABLE`
- Gate F: `FAIL_NO_LIVE_EVIDENCE`
- Gate G: `FAIL_NO_LIVE_EVIDENCE`
- Gate H: `PASS_BY_DOCUMENTATION_AND_TEST`

R1 removes the uncertainty about the local startup cause, but it does not produce a live endpoint baseline.

## Scenario Results

| Scenario | CWD | Loader | Env state | `$connect` | `SELECT 1` | `testDatabaseConnection()` | Attempts | Duration | Result |
|---|---|---|---|---|---|---|---:|---:|---|
| R1 | repo root | `dotenv.config()` from root | required vars absent | not reached | not reached | not reached | 1 | n/a | `Environment validation failed` |
| R2 | `backend` | `dotenv.config()` from `backend` | `DATABASE_URL` and `DIRECT_URL` loaded | success | success | not invoked | 1 | 661 ms | PostgreSQL reachable |
| R3 | `backend` | runtime readiness path | `DATABASE_URL` and `DIRECT_URL` loaded | success | success | `true` | 1 | 542 ms | Runtime readiness path succeeds |
| R4 | `backend` | test loader emulation | test env seeded, then `backend/.env` loaded | success | success | `true` | 1 | 1406 ms | Test loader path succeeds |

### R1 raw failure

```text
Environment validation failed before Prisma because the repo-root cwd did not resolve the required backend env variables.
```

### R2 sanitized Prisma connection result

```json
{
  "hostClass": "managed_postgresql_pooler",
  "poolerPort": 6543,
  "directPort": 5432,
  "databaseClass": "default_postgres_database",
  "dnsResolution": "PASS",
  "tcpPoolerConnectivity": "PASS",
  "queryParamNames": ["pgbouncer"],
  "connect": "ok",
  "select": [{"value": 1}]
}
```

## Hypotheses

| Hypothesis | Classification | Evidence |
|---|---|---|
| H1: Resolved environment changes with cwd and loader | CONFIRMED | The same code path behaves differently between repo root and backend cwd. |
| H2: cwd determines where `dotenv.config()` finds the default env file | CONFIRMED | Repo root fails; backend cwd succeeds. |
| H3: PowerShell environment variables override the local env file | INSUFFICIENT_EVIDENCE | No evidence was collected for a PowerShell override. |
| H4: The test loader is defective | REJECTED | The test loader explains why tests succeed. |
| H5: PostgreSQL DNS resolution is broken | REJECTED | DNS resolution passed. |
| H6: TCP to port `6543` is blocked | REJECTED | TCP pooler connectivity passed. |
| H7: Prisma `$connect` fails from `backend` cwd | REJECTED | `$connect()` succeeded from `backend`. |
| H8: `SELECT 1` fails after connect | REJECTED | `SELECT 1` succeeded from `backend`. |
| H9: Multiple loaders are present and matter to the diagnosis | LIKELY | Root cwd, backend cwd, and test loader emulation differ in env resolution. |
| H10: `dotenv.config()` resolves before validation based on cwd | CONFIRMED | The repo-root failure occurs before Prisma, while backend cwd succeeds. |
| H11: Missing `sslmode` is the blocker | REJECTED | The sanitized connection succeeded without `sslmode`. |
| H12: Direct URL is malformed | REJECTED | The direct URL parsed and connected cleanly. |
| H13: Live PostgreSQL is unreachable from this machine | REJECTED | DNS, TCP, connect, and query all succeeded on the backend path. |
| H14: Failure is transient rather than deterministic | REJECTED | The root-cwd failure reproduced deterministically. |
| H15: The issue is a database outage | REJECTED | The database path is reachable from backend cwd. |
| H16: Connection limits or pooler behavior are the current cause | REJECTED | There is no evidence of pool exhaustion or limit failure. |
| H17: DNS and TCP are the cause of the current failure | REJECTED | DNS and TCP both passed. |
| H18: Structured Logger Sink participates in the pre-listen bootstrap failure | REJECTED | The failure occurs before listen/readiness logging. |

## Diagnosis

### Root cause

`ROOT_CAUSE_STATUS: CONFIRMED`

Primary cause: `cwd-dependent environment resolution during local backend startup`.

The reproducible local failure on this baseline is a cwd/env-resolution mismatch:

- running from the repository root does not resolve the backend env file that contains the required runtime variables;
- environment validation aborts before the backend reaches PostgreSQL readiness;
- when the same code is run from `C:\Projects\FINQZ_PRO\backend`, the backend env file is loaded and PostgreSQL connectivity succeeds;
- the test loader seeds or loads environment values before Prisma import;
- the earlier TLS evidence is `STALE_OR_NOT_REPRODUCED` on baseline `7dce497`.

### Confidence

- Confidence level: **high**

### Contributing causes

- Multiple `.env` files exist in the repository.
- Cwd-dependent `dotenv` resolution can diverge between root launches and backend launches.
- The test setup seeds runtime-only variables before import, so the test environment is not equivalent to a bare shell launch.

### Rejected explanations

- PostgreSQL outage
- DNS failure
- TCP port blockage
- Prisma client misconfiguration
- `pgbouncer=true` as the blocking condition
- missing `sslmode` as the blocking condition

## Next Step

- `W5-03C-R2 - RUNTIME_BOOTSTRAP_ALIGNMENT_PLAN`
- Subtitle: `Official Startup Launch-Path and Environment Resolution Review`
- Objective: define the official startup command, official cwd, and explicit environment-loading strategy while preserving compatibility across local, Docker, homologation, and production.

## Completion Notes

- No code was changed.
- No `.env` file was edited.
- No migration was run.
- No deploy was performed.
- No commit or push was performed.

