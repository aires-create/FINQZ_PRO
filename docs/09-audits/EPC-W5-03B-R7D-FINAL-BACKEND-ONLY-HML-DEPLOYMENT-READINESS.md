# EPC-W5-03B-R7D - Final Backend-Only HML Deployment Readiness

## Verdict

DEFERRED_PENDING_COMPOSE_IMAGE_PINNING

## Evidence Status

PARTIAL_LOCAL_EVIDENCE_ONLY

## Phase

EPC-W5-03B-R7D - Final Backend-Only HML Deployment Readiness

## Baseline

- Branch: `homologation/bootstrap-vps`
- HEAD: `874a3a827e061ffad0490c934c418da2afbecb84`
- Upstream: `origin/homologation/bootstrap-vps`
- Git status: dirty because of preexisting local artifacts, including `.env.example`, `_worktrees/`, and untracked docs/scripts
- Upstream divergence: `0 0`
- Last commit: `fix(nginx): route readiness probe to backend`
- Last commit file list: `backend/infra/nginx/nginx.conf`

## Hash Register

- `backend/package.json`
  - `46FFB3793600CA2491776BA717A8568ED02EB3949D4AE55C76C2E907DD994BCE`
- `backend/package-lock.json`
  - `97DC963BBBE7E65FDC2E3BC03496965F60BD7687A80205998A27ED39A4F515E7`
- `backend/Dockerfile`
  - `8A8E44977C64C11932DD514AF23B2E5B0DF2CBFCF3432905C507B778C8C78C5C`
- `backend/.dockerignore`
  - `92AFF5F7B307B217010F19239C3D7BF5E2E2E68E1FB94EBC1C96CA578524544A`
- `backend/docker-compose.yml`
  - `BF500DE49EAFF5E04A3C406ED90DD77371CFF446764EF2577128F0FD65DB742A`
- `backend/docker-compose.hml.yml`
  - `62BC56CA1BC73185E8B57ED21E3BA8C51074288E8AF237D00A08FE6F70C80AEE`
- `backend/infra/nginx/nginx.conf`
  - `5C4EB433F4AA576E886DD68C76CFC6E35278D2935A9BC09735F86CB4787A3DB5`
- `backend/prisma/schema.prisma`
  - `6A9462B36AEEF0DBFB8EF1C522E31D8166E4264638BD554FE37A373705299B89`
- `backend/prisma/migrations/20260710120000_sdc_3_4h_b_simulation_runtime_evidence/migration.sql`
  - `E33323AF5C08600B1663DABC4B37299DF22228135B1C011528B583FD560B64D9`
- `dist/index.html`
  - `D070FA438EFE2A787CFADDE77B52152C6B616F6299339390D0BB39C64CA7DDC2`
- HEAD commit SHA
  - `874a3a827e061ffad0490c934c418da2afbecb84`

## Local Validation

- Node: `v24.15.0`
- npm: `11.12.1`
- OpenSSL: not available in this Windows session
- `npm run build`: PASS
- `npx prisma validate`: BLOCKED, Prisma CLI resolution failed in the local Windows session
- `npx prisma generate`: BLOCKED, same Prisma CLI resolution issue
- `npm test`: FAIL, missing native binding `@rolldown/binding-win32-x64-msvc`
- `npm run test:integration`: not executed after the test runner failure
- `npm run test:unit`: not executed after the test runner failure

## Docker And Image State

- `docker version`: client available, daemon unavailable
- `docker info`: daemon unavailable
- Candidate rebuild of `finqz-pro-backend:hml-874a3a8-r7d`: not completed in this session
- Candidate image ID: not available
- Candidate local digest: not available
- Candidate size: not available
- Candidate metadata: not available

## Compose Delta

- `backend/docker-compose.yml` uses `build:` for `api`
- `backend/docker-compose.yml` does not pin `api` to an immutable image tag
- Services preserved by the future backend-only path: `postgres`, `redis`, `nginx`
- Future deploy command, once image pinning exists:

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --no-deps api
```

- With the current compose file, that command can still attempt an API rebuild because `api` is defined with `build:`

## HML Gates

- SSH inventory on HML: not executed in this session
- HML compose validation: not executed in this session
- HML rollback image capture: not executed in this session
- HML PostgreSQL backup: not executed in this session
- HML frontend fingerprint confirmation: not executed in this session
- HML health/live/ready confirmation: not executed in this session

## Rollback Plan

- Preserved rollback image expected by the phase: `sha256:f945b26ed54242be14736dcc10e21a5a59e7984288a9892cbae7d2d0ae81a898`
- Rollback must remain API-only and must not rebuild dependencies
- Rollback command remains conditional on immutable image pinning
- Application rollback compatibility still needs a Linux/HML replay with the pinned image

## Smoke Plan

- API container running
- `/health` returns 200
- `/live` returns 200
- `/ready` returns 200
- database connected
- Redis connected
- Nginx health endpoints return 200
- authentication works
- tenant context works
- RBAC works
- Master Catalog works
- EDP works
- simulation runtime works
- simulation runtime evidence works
- opportunities work
- logs do not show 5xx spikes
- frontend fingerprint remains unchanged

## Risks

- Compose still uses `build:` for `api`, so the backend-only deploy path is not yet pinned to an immutable image
- Docker daemon was unavailable locally, so the candidate backend image could not be rebuilt or inspected
- Prisma CLI could not be executed through the local Windows session
- Full Linux Node 20 validation was not reproduced in this session
- HML SSH checks and backup were not executed in this session

## Documents

- Created this phase document
- Created evidence JSON
- Created evidence Mermaid flow
- Existing R6D material was left untouched as historical context

## Next Step

Pin the API service to the immutable backend image, then rerun the Linux Node 20, Docker, Prisma, migration, backup, and HML-only checks before any deploy authorization.
