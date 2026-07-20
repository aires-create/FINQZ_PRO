# EPC-W5-03B-R4A - Backend Dependency Lock Reconciliation

## Verdict

DEFERRED_PENDING_RECONCILIATION

## Decision Summary

- Frontend HML remains frozen and preserved.
- Local frontend is not published in this phase.
- Backend dependency reconciliation was isolated to the backend contract.
- Production is not changed.
- No deploy was executed.

## Baseline

- Branch local: `homologation/bootstrap-vps`
- HEAD local: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- Upstream: `origin/homologation/bootstrap-vps`
- HML HEAD: `957e2fc696d9ec067683f26335756ecaf72b0290`
- Isolated worktree: `C:\Projects\FINQZ_PRO\_worktrees\w5-03b-r4-cce8840`

## Diagnosis

The backend lockfile was out of sync with the current resolver expectations for `yaml`.

Findings:

- `backend/package.json` originally did not declare `yaml`
- `backend/package-lock.json` contained `yaml@2.0.0-1` transitively through `swagger-jsdoc`
- `vitest` declares a peer requirement on `yaml ^2.4.2`
- `npm ci` on the isolated worktree initially failed with:
  - `Missing: yaml@2.9.0 from lock file`

Classification:

- `TRANSITIVE_DEPENDENCY_MISSING_FROM_LOCK`

## Minimal Fix

Applied changes:

- `backend/package.json`
- `backend/package-lock.json`

What changed:

- added `yaml@^2.9.0` as a backend devDependency
- regenerated `package-lock.json` only

No functional code was changed.

## Diff Assessment

The resulting diff is expected and narrow:

- `package.json`: one new devDependency entry
- `package-lock.json`: one new root devDependency entry and a resolved `yaml@2.9.0` package record

No unrelated dependency sweep was introduced.

## Reproducible Validation

### Install

- `npm ci`: PASS in Linux Docker container

### Tests

- `npm test`: FAIL in Linux Docker container
- Vitest JSON summary:
  - `268` total suites
  - `262` passed suites
  - `6` failed suites
  - `863` total tests
  - `859` passed tests
  - `4` failed tests

Observed failure:

- `PrismaClientInitializationError`
- `libssl.so.1.1` missing while loading `libquery_engine-debian-openssl-1.1.x.so.node`

### Build

- `npm run build`: PASS locally
- `npm run build`: PASS in Linux Docker container

## Docker Build

Candidate image:

- tag: `finqz-pro-backend:hml-cce8840`
- image ID: `sha256:9fd64615f722c576afd50d615a96b2f1eb31bfdb09b68e4766c77849cc45767b`
- digest: `finqz-pro-backend@sha256:9fd64615f722c576afd50d615a96b2f1eb31bfdb09b68e4766c77849cc45767b`
- size: `219787912`
- created: `2026-07-14T14:05:57.672097868Z`
- entrypoint: `["docker-entrypoint.sh"]`
- cmd: `["node","dist/server.js"]`
- healthcheck: none

The candidate image was verified to be backend-only and to exclude the frontend `dist` path:

```text
frontend-dist-absent
```

## Current Backend Image

- container: `finqz-pro-api`
- tag: `backend-api:latest`
- image ID: `sha256:f945b26ed54242be14736dcc10e21a5a59e7984288a9892cbae7d2d0ae81a898`
- size: `218475096`

## Migration

Status remains:

- `SAFE_ADDITIVE`

Reference file:

- `backend/prisma/migrations/20260710120000_sdc_3_4h_b_simulation_runtime_evidence/migration.sql`

No migration was executed.

## Rollback

Rollback remains explicit and image-based:

- rollback tag: `backend-api:rollback-f945b26`
- rollback must not depend on rebuild
- rollback must recreate only `api`
- frontend, Nginx, PostgreSQL, Redis, and volumes stay untouched

## Risks

- `npm test` still fails because the current Linux container base lacks `libssl.so.1.1` required by the Prisma engine shipped in the installed client.
- Windows Vitest loading showed a separate `spawn EPERM` symptom before the Linux validation path was used.
- Remote HML `/ready` reconciliation still needs confirmation.
- No live deploy was run.

## GO / NO-GO

DEFERRED_PENDING_RECONCILIATION

## Next Step

Resolve the Prisma/OpenSSL runtime mismatch or align the container base with the required engine target, then rerun the test gate.

## Artifacts Created

- `docs/09-audits/EPC-W5-03B-R4A-BACKEND-DEPENDENCY-LOCK-RECONCILIATION.md`
- `docs/09-audits/evidence/EPC-W5-03B-R4A-BACKEND-DEPENDENCY-LOCK-RECONCILIATION.json`
- `docs/09-audits/evidence/EPC-W5-03B-R4A-REPRODUCIBLE-BUILD-FLOW.mmd`

## Git Status

The repository remains dirty because the workspace already contained unrelated changes before this audit.

No deploy, restart, migration, frontend change, production change, commit, or push was executed.
