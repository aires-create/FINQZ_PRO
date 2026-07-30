# EPC-W5-03B-R4B - Prisma Linux and OpenSSL Alignment

## Context

- Baseline branch: `homologation/bootstrap-vps`
- Worktree: `C:\Projects\FINQZ_PRO\_worktrees\w5-03b-r4-cce8840`
- Head: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- Scope: backend dependency/runtime alignment only
- Out of scope: code behavior changes, deploy, migration, frontend, Docker Compose operational changes, Nginx, `.env`

## Diagnostic Summary

### Repository contract

- `backend/package.json` keeps Prisma pinned at `^5.22.0` in both `dependencies` (`@prisma/client`) and `devDependencies` (`prisma`).
- `backend/package-lock.json` is lockfileVersion `3`.
- `backend/prisma/schema.prisma` uses the default `prisma-client-js` generator and does not declare custom `binaryTargets`.
- `backend/package.json` does not define `postinstall`, `prepare`, or `prebuild` hooks that could silently regenerate Prisma on a different platform.
- `backend/.dockerignore` excludes `node_modules`, so the Docker build does not accidentally copy host modules.
- `backend/Dockerfile` installs `openssl` and `ca-certificates` before `npm ci` in both stages, then runs `npx prisma generate` after dependency installation.

### Dependency origin

`npm explain yaml` in the Linux validation container shows two distinct `yaml` sources:

- `yaml@2.9.0` is a direct dev dependency from the root project.
- `yaml@2.0.0-1` is transitive through `swagger-jsdoc`.

`npm ls prisma @prisma/client --all` confirms the backend resolves:

- `@prisma/client@5.22.0`
- `prisma@5.22.0`

### Linux / OpenSSL validation

In a clean Linux container that matches the Dockerfile flow, with `openssl` installed before `npm ci`:

- `npx prisma version` reports `Computed binaryTarget: debian-openssl-3.0.x`
- Prisma engine resolves to `node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node`
- schema engine resolves to `node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x`

That confirms the repository Docker flow generates the Linux/OpenSSL 3 client correctly when the build environment matches the Dockerfile.

### Candidate image inspection

- Candidate image: `finqz-pro-backend:hml-cce8840`
- Image ID: `sha256:9fd64615f722c576afd50d615a96b2f1eb31bfdb09b68e4766c77849cc45767b`
- Repo tag: `finqz-pro-backend:hml-cce8840`
- Digest: `finqz-pro-backend@sha256:9fd64615f722c576afd50d615a96b2f1eb31bfdb09b68e4766c77849cc45767b`
- Created: `2026-07-14T14:05:57.672097868Z`
- Size: `219787912`
- Entrypoint: `["docker-entrypoint.sh"]`
- Cmd: `["node","dist/server.js"]`
- Healthcheck: `null`

The image contains the Linux Prisma engine:

- `node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node`
- `node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node`
- `node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x`

### Current HML rollback image inspection

- Current local `backend-api:latest` image ID: `sha256:c573f01f3ca9751b1b60ff8af252eab101885e7c9ec7af0d170a2bd7d0768d08`
- Repo tag: `backend-api:latest`
- Digest: `backend-api@sha256:c573f01f3ca9751b1b60ff8af252eab101885e7c9ec7af0d170a2bd7d0768d08`

## Validation

### `npm ci`

PASS in Linux container after installing `openssl` first.

### `npm test`

FAIL in Linux container, but not because of Prisma/OpenSSL.

- The Prisma binary target was correct: `debian-openssl-3.0.x`
- Remaining failures were integration/environment related:
  - missing live PostgreSQL connectivity for Prisma-backed suites
  - health contract expectation mismatch for `access-control-allow-origin`
  - a small set of E2E assertions timing out or expecting persistence side effects

Observed aggregate from the run:

- `128` test files total
- `122` passed
- `6` failed
- `863` tests total
- `857` passed
- `6` failed

### `npm run build`

PASS in Linux container.

## Diff Review

No new tracked changes were introduced in this phase.

The working tree still contains the previous R4A dependency reconciliation only:

- `backend/package.json`: `yaml@^2.9.0`
- `backend/package-lock.json`: lock entry updated for `yaml@2.9.0` plus the nested `swagger-jsdoc`-scoped `yaml@2.0.0-1`

Diff classification for the tracked dependency change:

- `EXPECTED`

## Minimal Fix Decision

No additional repository change was required for Prisma/OpenSSL alignment.

The observed Prisma fallback to `debian-openssl-1.1.x` only happened in a Linux container that did not install `openssl` before `npm ci`. Once the Dockerfile-equivalent flow was followed, Prisma generated the correct `debian-openssl-3.0.x` engine.

## Rollback Strategy

Rollback must remain image-explicit and rebuild-free.

Future deploy flow:

- candidate image: `finqz-pro-backend:hml-cce8840`
- rollback image: `backend-api:rollback-f945b26`

Operational expectation:

- the API service receives the candidate image tag during promotion
- the rollback uses the explicit rollback tag without rebuilding anything
- no frontend, Nginx, PostgreSQL, or Redis changes are required

## Verdict

`NO_GO`

Reason:

- Prisma/OpenSSL alignment is correct in the Dockerfile candidate flow
- `npm ci` and `npm run build` pass
- `npm test` does not fully pass because of non-dependency integration/environment blockers

## Next Step

Unblock the test environment for the integration/E2E suites, then rerun the Linux validation without changing the backend dependency contract.

## Safety Statement

- No deploy
- No migration
- No restart
- No commit
- No push
