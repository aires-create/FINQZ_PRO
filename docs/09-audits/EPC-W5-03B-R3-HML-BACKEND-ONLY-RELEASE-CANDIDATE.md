# EPC-W5-03B-R3 - HML Backend-Only Release Candidate

## Verdict

DEFERRED_PENDING_HML_ACCESS

## Decision Summary

- Frontend HML is intended to remain frozen and preserved.
- Local frontend must not be published.
- Backend is the candidate for controlled update only after remote inventory.
- Production must remain unchanged.

## Baseline

- Branch local: `homologation/bootstrap-vps`
- HEAD local: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- Upstream: `origin/homologation/bootstrap-vps`
- `git fetch --all --prune`:
  - origin fetched successfully
  - vps fetch failed with SSH permission denied

## HML Access Status

The HML host is reachable at the network layer, but the session cannot authenticate.

Evidence:

- DNS resolves `hml.finqz.com.br` and `api-hml.finqz.com.br`
- TCP port `22` is open
- TCP port `443` is open
- `ssh.exe` to `deploy@hml.finqz.com.br` returned:

```text
Permission denied (publickey,password).
```

- `git fetch vps` failed with the same SSH credential issue

Conclusion:

- HML state is not safely inventoryable from this session.
- The release candidate cannot be signed or deployed yet.

## Backend Candidate Scope

The backend-only release candidate would target:

- backend
- API
- Master Catalog
- observability
- environment bootstrap
- readiness
- Redis client
- RBAC
- EDP
- simulation runtime
- approved backend contracts and services

It must not target:

- frontend build
- static frontend assets
- SPA routes
- Nginx frontend layout behavior
- production

## Compose Target

The backend service identified in the compose file is:

- `api`

Relevant compose path:

- [backend/docker-compose.yml](../../backend/docker-compose.yml)
- [backend/docker-compose.hml.yml](../../backend/docker-compose.hml.yml)

## Local Validation Snapshot

### Frontend

- `npm run build`: PASS
- `npm run test`: FAIL

### Backend

- `cd backend && npm run build`: PASS
- `cd backend && npm run test`: FAIL

Observed failure families:

- frontend root test failures in admin pipeline stage flows
- backend integration test failures in get-session, memberships, operation, provider runtime inspection, and users reset-password

## Backend Deploy Shape

Candidate commands for a later controlled deploy would be:

```bash
cd backend
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml build api
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --no-deps api
```

These commands are not executed in this phase.

## Frontend Preservation

Because HML access was not granted in this session:

- frontend HML fingerprint could not be captured
- frontend HML restoration mechanism could not be proven
- frontend HML preservation status remains operationally expected, but not verified

Classification:

- `FRONTEND_ORIGIN_UNKNOWN`

## Migration And Database

- local Prisma schema and migrations exist
- HML applied migrations could not be compared
- HML drift could not be confirmed

Classification:

- `UNKNOWN`

## Risks

- SSH access to HML is unavailable from this session.
- HML frontend origin cannot be fingerprinted yet.
- Local root and backend test suites are not green.
- Deploying now would risk overwriting an unverified remote runtime.

## GO / NO-GO

NO_GO

## Next Step

DEFERRED_PENDING_HML_ACCESS

## Required Later Evidence Before Any Deploy

- HML SSH inventory
- frontend fingerprint and restoration path
- backend service identity on HML
- remote SHA
- migration state
- backup and rollback plan
- green local/frontend/backend validation
