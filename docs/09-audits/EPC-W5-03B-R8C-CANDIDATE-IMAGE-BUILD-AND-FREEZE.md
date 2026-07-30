# EPC-W5-03B-R8C - Candidate Image Build and Freeze

## Verdict

CANDIDATE_IMAGE_FROZEN_READY_FOR_TRANSPORT

## Evidence Status

FULL_LOCAL_EVIDENCE_ONLY

## Context

Esta fase consolida o candidato de release do backend FINQZ PRO em um artefato imutavel, validado e congelado para transporte futuro.

O principio adotado e:

`BUILD ONCE -> VALIDATE SAME IMAGE -> FREEZE SAME IMAGE -> TRANSPORT SAME IMAGE -> DEPLOY SAME IMAGE`

Nenhum deploy para VPS foi executado nesta fase.
Nenhum acesso a HML foi feito.

## Baseline

- Repo: `C:\Projects\FINQZ_PRO`
- Branch: `homologation/bootstrap-vps`
- HEAD: `feb93ba696d8362030c7a57b18a0a0ea7a6d997b`
- Upstream: `origin/homologation/bootstrap-vps`
- Last commit: `feat(release): enforce immutable backend deployment`
- Candidate tag: `finqz-pro-backend:hml-feb93ba-r8c`
- Candidate image ID: `sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- Candidate repo digest: `finqz-pro-backend@sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- Freeze artifact directory: `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c`
- Freeze TAR: `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c\finqz-pro-backend-hml-feb93ba-r8c.tar`
- Freeze manifest: `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c\finqz-pro-backend-hml-feb93ba-r8c.manifest.json`

## Problem

The previous release path allowed ambiguity between:

- source commit;
- locally built image;
- image transported to the target host;
- image actually executed by HML.

This phase removes that ambiguity by freezing one validated image and preserving its identity in local evidence.

## Inventory

### Runtime and packaging inputs

- `backend/package.json`
- `backend/package-lock.json`
- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/docker-compose.yml`
- `backend/docker-compose.hml.yml`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260710120000_sdc_3_4h_b_simulation_runtime_evidence/migration.sql`
- `backend/infra/nginx/nginx.conf`

### Freeze outputs

- `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c\finqz-pro-backend-hml-feb93ba-r8c.tar`
- `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c\finqz-pro-backend-hml-feb93ba-r8c.manifest.json`

### Documentation outputs

- `docs/09-audits/EPC-W5-03B-R8C-CANDIDATE-IMAGE-BUILD-AND-FREEZE.md`
- `docs/09-audits/evidence/EPC-W5-03B-R8C-CANDIDATE-IMAGE-BUILD-AND-FREEZE.json`
- `docs/09-audits/evidence/EPC-W5-03B-R8C-BUILD-VALIDATE-FREEZE.mmd`

## Build Contract

The candidate image is treated as immutable after build.

Defined release contract:

- Git SHA identifies the source;
- Dockerfile produces one candidate image;
- image tag is release-scoped;
- digest is the preferred transport identity;
- the same image is used for validation and freezing.

OCI labels used by the image:

- `org.opencontainers.image.revision`
- `org.opencontainers.image.source`
- `org.opencontainers.image.created`
- `org.opencontainers.image.version`
- `org.opencontainers.image.title`
- `org.opencontainers.image.description`

## Candidate Image Evidence

### Build result

- Tag: `finqz-pro-backend:hml-feb93ba-r8c`
- Image ID: `sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- Repo digest: `finqz-pro-backend@sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- Platform: `linux/amd64`
- Created: `2026-07-16T18:53:43.783346655Z`
- Size: `219787773` bytes

### Frozen transport artifact

- TAR SHA-256: `3c563926c9df552c92cc4c973baf8af96d734464ddefb595007b8bcd877521b2`
- TAR size: `219811328` bytes
- Artifact timestamp UTC: `2026-07-16T19:43:46Z`

### Manifest contract

The manifest is authoritative for the frozen local transport bundle.

- `phase`: `EPC-W5-03B-R8C`
- `title`: `Candidate Image Build and Freeze`
- `gitSha`: `feb93ba696d8362030c7a57b18a0a0ea7a6d997b`
- `image.tag`: `finqz-pro-backend:hml-feb93ba-r8c`
- `image.id`: `sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- `image.repoDigest`: `finqz-pro-backend@sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- `artifact.tarSha256`: `3c563926c9df552c92cc4c973baf8af96d734464ddefb595007b8bcd877521b2`
- `artifact.tarSizeBytes`: `219811328`

## Validation

The same candidate image was used for local validation and freeze prep.

### Local runtime validation

- `node --version` inside the image: `v20.20.2`
- `npm --version` inside the image: `10.8.2`
- `openssl version` inside the image: `OpenSSL 3.0.20 7 Apr 2026`
- `npx prisma --version` inside the image: `5.22.0`
- `npm ls --omit=dev --all` inside the image: pass

### Disposable Linux validation

- `npm ci`: pass
- `npm ls yaml --all`: pass
- `npm explain yaml`: pass
- `npx prisma validate`: pass
- `npx prisma generate`: pass
- `npm run build`: pass

### Disposable database validation

- PostgreSQL migration deploy: pass
- PostgreSQL migration status: schema up to date

### Smoke validation

- `GET /health`: pass
- `GET /live`: pass
- `GET /ready`: pass after Redis became ready

### Test validation

- Companion integration suite: pass
- E2E runtime suite: pass
- Full integration suite: pass with Vitest teardown warnings
- Full backend suite: pass with Vitest teardown warnings

## Decision

The selected release posture is:

- build once;
- validate the same image;
- freeze the same image as a TAR;
- preserve the manifest locally;
- defer transport to the next authorized phase;
- do not deploy to VPS in this phase.

## Risks

- Vitest emits teardown warnings in two suites, although all tests pass.
- Transport to VPS has not been executed yet.
- HML deployment was not exercised in this phase.
- Registry strategy remains deferred to the platform phase.

## Approval Criteria

- one immutable backend image was built;
- the same image was validated;
- the same image was frozen to a TAR;
- the TAR SHA-256 was captured;
- the manifest JSON was captured;
- no deploy to VPS occurred;
- no HML access occurred;
- no source code changed for this phase.
