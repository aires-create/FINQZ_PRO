# EPC-W5-03B-R5C - Full Linux Test Stack Validation

## Scope
- Validate the backend in a disposable Linux stack with PostgreSQL and Redis isolated from the official/HML stack.
- Re-run the EDP runtime fix under the same containerized Linux conditions that exposed the original timeout.
- Verify Prisma bootstrap, real integration suites, in-memory companions, backend full suite, frontend tests, frontend build, and the backend candidate image.

## Disposable Topology
- Docker network: `finqz-r5c-test-network`
- PostgreSQL container: `finqz-r5c-postgres`
- Redis container: `finqz-r5c-redis`
- Backend validation container: `finqz-r5c-backend-tests`
- Candidate image built locally: `finqz-pro-backend:hml-cce8840-r5c`

## What Was Verified
- PostgreSQL DNS resolution, TCP connectivity, authentication, and `SELECT 1`
- Redis DNS resolution, TCP connectivity, and `PING`
- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate deploy`
- `npx prisma migrate status`
- EDP runtime end-to-end file executed 5 times in the same Linux container
- Real Prisma-backed integration suites
- In-memory companion suites
- Full backend integration suite
- Full backend test suite
- Backend TypeScript build
- Frontend test suite
- Frontend production build
- Backend candidate Docker image build and inspection

## Root Cause Revalidated
- The original EDP timeout was caused by a cold module-graph reload on every test case.
- `vi.resetModules()` combined with a freshly created fake Prisma client forced repeated app bootstrap work and made the first EDP case slow enough to cross the Vitest timeout window.
- The fix keeps one stable hoisted fake Prisma client, resets its state between tests, imports `createApp()` normally, and stops resetting modules.

## Validation Results

### Connectivity
- PostgreSQL DNS: pass
- PostgreSQL TCP 5432: pass
- PostgreSQL auth: pass
- PostgreSQL `SELECT 1`: pass
- Redis DNS: pass
- Redis TCP 6379: pass
- Redis `PING`: pass

### Prisma Bootstrap
- `npm ci`: pass
- `npx prisma validate`: pass
- `npx prisma generate`: pass
- `npx prisma migrate deploy`: pass
- `npx prisma migrate status`: pass
- Prisma client/runtime target observed in Linux container: `debian-openssl-3.0.x`

### EDP Runtime Stability
- `src/tests/integration/edp.runtime.e2e.test.ts` ran 5/5 times successfully
- Each run passed 7/7 tests
- No timeout recurrence

### Real Prisma-Backed Integration Suites
- `src/tests/integration/edp.persistence.prisma.test.ts`: pass
- `src/tests/integration/simulation-runtime-evidence.persistence.prisma.test.ts`: pass
- `src/tests/integration/simulation-runtime-evidence.http.test.ts`: pass

### In-Memory Companion Suites
- `src/tests/integration/edp.persistence.memory.test.ts`: pass
- `src/tests/integration/edp.runtime.memory.test.ts`: pass
- `src/tests/integration/simulation-runtime-evidence.memory.test.ts`: pass
- `src/tests/integration/simulation-runtime-evidence.persistence.memory.test.ts`: pass

### Full Backend Coverage
- `npm run test:integration`: pass
- `npm test`: pass
- `npm run build`: pass

### Frontend Coverage
- `npm test` in the Linux container: pass
- `npm run build` in the Linux container: pass
- The Windows runner in this workspace hit an `esbuild` `spawn EPERM` config-loading issue, so the authoritative frontend validation was completed in Linux instead.

### Candidate Image
- Image tag: `finqz-pro-backend:hml-cce8840-r5c`
- Image ID: `sha256:853ab9caf941dcb535d657d5e573329f97764c95e996842e0d88e2b75003f8a1`
- Repo digest: `finqz-pro-backend@sha256:853ab9caf941dcb535d657d5e573329f97764c95e996842e0d88e2b75003f8a1`
- Platform: `linux/amd64`
- Size: `219789643` bytes
- Created: `2026-07-14T20:11:06.501092619Z`

## Verdict
- The disposable Linux stack validated cleanly.
- The EDP timeout is not reproduced under the stable mock/app bootstrap fix.
- No production, HML, or official stack changes were made.

## Notes
- No deployment was performed.
- No HML migration was performed.
- No commit or push was performed.
- The validation stack was disposable and isolated from the official services.
