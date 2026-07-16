# EPC-W5-03B-R8A - Immutable Release Architecture

## Verdict

IMMUTABLE_RELEASE_ARCHITECTURE_READY_FOR_STAGING

## Evidence Status

PARTIAL_LOCAL_EVIDENCE_ONLY

## Context

Esta fase elimina a ambiguidade entre codigo-fonte, build e artefato executado para o backend do FINQZ PRO.

O principio adotado e:

`BUILD ONCE -> VALIDATE ONCE -> DEPLOY THE SAME IMAGE`

Nenhum deploy foi executado nesta fase.

## Baseline

- Repo: `C:\Projects\FINQZ_PRO`
- Branch: `homologation/bootstrap-vps`
- HEAD: `874a3a827e061ffad0490c934c418da2afbecb84`
- Upstream: `origin/homologation/bootstrap-vps`
- Last commit: `fix(nginx): route readiness probe to backend`
- Rollback image atual em HML: `sha256:f945b26ed54242be14736dcc10e21a5a59e7984288a9892cbae7d2d0ae81a898`
- Frontend fingerprint HML: `eb28ef5941f70b773cebad0e41da50e335e7760e8b930a710963f040417bbbed`

## Problem

O modelo anterior permitia que o deploy HML usasse `build:` no serviço `api`, o que abria a porta para:

- rebuild implicito no deploy;
- dependencia de cache local;
- runtime dependente do filesystem da VPS;
- divergencia entre SHA e artefato executado;
- rollback dependente de rebuild.

## Inventory

### Runtime model in the repo

- `backend/docker-compose.yml`
  - base local com `api` em `build:`
  - preserva DX local
- `backend/docker-compose.hml.yml`
  - override HML com `image:` obrigatoria
  - remove `build` no merge final com `build: !reset null`
  - bloqueia pull implícito com `pull_policy: never`
- `backend/Dockerfile`
  - imagem Node 20 baseada em `node:20-bookworm-slim`
- `backend/.dockerignore`
  - exclui `node_modules`, `dist`, `.env*`, logs e outros artefatos locais

### Release documentation consumers

- `docs/06-release/EPC-GO-LIVE-04-HML-DEPLOY-RUNBOOK.md`
- `docs/06-release/EPC-GO-LIVE-06-HML-ROLLBACK-RUNBOOK.md`
- `docs/06-release/README.md`

### Legacy references identified by grep

- `backend-api`: none found
- `ghcr.io`: none found
- `docker load`: none found
- `docker save`: none found
- `latest` as release identity: not used as release identity in the selected architecture
- `up --build` references: legacy HML docs only, now updated in the release runbook set

## Options

### Option A - HML override with image variable only

Pros:
- minimal change
- keeps local build unchanged

Cons:
- `image:` alone does not remove `build:`

Status:
- rejected

### Option B - HML compose completo sem build

Pros:
- explicit no-build HML contract
- simple validation

Cons:
- more duplication
- more drift risk

Status:
- not chosen because the repo already has a clean split between base compose and HML override

### Option C - Base com image e override local com build

Pros:
- explicit image pinning in base

Cons:
- worsens DX for the current local flow

Status:
- not chosen

### Option D - Arquivos por finalidade

Pros:
- preserves local build
- HML can enforce immutable image
- rollback can use exact image reference

Cons:
- requires a clear override contract

Status:
- chosen as the effective model, implemented with base compose + HML override

## Merge Proof

Docker Compose version used in this session: `v5.1.3`

Observed results:

1. `image:` in an override does not remove `build:`
2. `build: null` was not sufficient in the actual repo merge
3. `build: !reset null` removed `build:` in the actual repo merge
4. `build: !override null` was not selected
5. `FINQZ_BACKEND_IMAGE` missing causes Compose to fail explicitly

## Decision

The selected architecture is:

- keep `backend/docker-compose.yml` as the local-development stack with `build:`
- make `backend/docker-compose.hml.yml` the immutable-release override
- require `FINQZ_BACKEND_IMAGE`
- eliminate `build:` in HML with `build: !reset null`
- prevent implicit pulls with `pull_policy: never`

The transport decision is:

- no registry in this wave
- air-gapped `docker save` / `docker load` approved for the first immutable release
- registry decision deferred to the platform phase

This preserves local development and makes HML release identity explicit.

## Target Architecture

### HML effective contract

```yaml
services:
  api:
    image: ${FINQZ_BACKEND_IMAGE:?FINQZ_BACKEND_IMAGE is required}
    build: !reset null
    pull_policy: never
```

### Local development contract

- `backend/docker-compose.yml` remains the base for local work
- local build remains allowed
- HML immutability does not leak into developer ergonomics

## Compose

### Current HML result after merge

- `api.image` is defined
- `api.build` is absent in the final merged config
- `api.pull_policy` is `never`
- `postgres`, `redis` and `nginx` remain present
- `api` remains the only service targeted by the future deploy command

### Future deploy command

```bash
FINQZ_BACKEND_IMAGE=<IMAGEM_IMUTAVEL> docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --no-deps --no-build api
```

### Future rollback command

```bash
FINQZ_BACKEND_IMAGE=<ROLLBACK_IMAGE_REFERENCE_IMUTAVEL> docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --no-deps --no-build api
```

## Image Variable

- Required variable: `FINQZ_BACKEND_IMAGE`
- Accepts immutable tag or digest reference
- Must never default to `latest`
- Must fail explicitly when absent

## Build

The backend build remains separate from deploy.

Defined release build contract:

- Git SHA identifies the source
- Dockerfile produces the candidate image
- image tag is immutable by release convention
- digest is preferred when transport or registry is available

OCI labels are part of the intended contract:

- `org.opencontainers.image.revision`
- `org.opencontainers.image.source`
- `org.opencontainers.image.created`
- `org.opencontainers.image.version`
- `org.opencontainers.image.title`

## Artifact Manifest

The manifest contract is defined but not populated with fabricated values.

- Git SHA: `874a3a827e061ffad0490c934c418da2afbecb84`
- image tag: `finqz-pro-backend:hml-874a3a8-r8c`
- image ID: `PENDING_EVIDENCE`
- manifest digest local: `PENDING_EVIDENCE`
- Dockerfile SHA-256: `8A8E44977C64C11932DD514AF23B2E5B0DF2CBFCF3432905C507B778C8C78C5C`
- package-lock SHA-256: `97DC963BBBE7E65FDC2E3BC03496965F60BD7687A80205998A27ED39A4F515E7`
- schema SHA-256: `6A9462B36AEEF0DBFB8EF1C522E31D8166E4264638BD554FE37A373705299B89`
- migration SHA-256: `E33323AF5C08600B1663DABC4B37299DF22228135B1C011528B583FD560B64D9`
- TAR SHA-256: `PENDING_EVIDENCE`
- TAR size: `PENDING_EVIDENCE`
- timestamp UTC: `PENDING_EVIDENCE`
- platform: `PENDING_EVIDENCE`
- Node: `v24.15.0`
- npm: `11.12.1`
- OpenSSL: `PENDING_EVIDENCE`
- Prisma: `PENDING_EVIDENCE`

## Registry

Registry decision status: `DEFERRED_TO_PLATFORM_PHASE`

No registry is introduced in this wave.

## Transport

Transport status: `AIR_GAPPED_TRANSFER_APPROVED`

Approved future transport contract:

- `docker save`
- SHA-256 of the TAR locally
- secure transfer
- SHA-256 on the VPS
- `docker load`
- image ID verification

## Deploy

The future HML deploy contract is:

- only `api`
- `--no-deps`
- `--no-build`
- immutable image via `FINQZ_BACKEND_IMAGE`
- no PostgreSQL recreation
- no Redis recreation
- no Nginx recreation
- no frontend recreation

## Rollback

Rollback contract:

- use the exact preserved rollback image
- no rebuild
- no mutable tag
- no `latest`
- keep the rollback path separate from migration analysis

## Local Development

Local development is preserved because:

- the base compose still uses `build:`
- no HML-only restriction was pushed into the developer path
- the new image contract is isolated to HML override behavior

## Security

Confirmed:

- no secret value was written into the new architecture docs
- no production file was modified
- no frontend artifact was changed
- no database migration was executed

## CI/CD Future

Recommended future path:

1. build once from the pinned Git SHA
2. generate the immutable candidate image
3. validate the image once
4. transport or publish the exact same image
5. deploy only the `api` service with `--no-build`

## Validations

Local proofs collected in this phase:

- `docker compose version` returned `v5.1.3`
- `image:` alone did not remove `build:`
- `build: !reset null` removed `build:` in the repo-backed merge
- missing `FINQZ_BACKEND_IMAGE` fails Compose validation
- with `FINQZ_BACKEND_IMAGE`, the final merged config exposes no `api.build`

## Risks

- registry owner and target remain undecided
- no Docker daemon was available for an actual image rebuild in this session
- no HML SSH inventory was executed in this session
- no transport action was executed in this session

## Gates

- Gate 1: baseline confirmed
- Gate 2: inventory confirmed
- Gate 3: merge behavior proven
- Gate 4: architecture decision taken
- Gate 5: HML compose contract validated locally
- Gate 6: local development preserved
- Gate 7: deploy contract defined
- Gate 8: rollback contract defined
- Gate 9: security checked
- Gate 10: documentation created

## Documents

- [Markdown](./EPC-W5-03B-R8A-IMMUTABLE-RELEASE-ARCHITECTURE.md)
- [JSON evidence](./evidence/EPC-W5-03B-R8A-IMMUTABLE-RELEASE-ARCHITECTURE.json)
- [Mermaid flow](./evidence/EPC-W5-03B-R8A-BUILD-VALIDATE-DEPLOY-ROLLBACK.mmd)

## Next Step

Proceed to the implementation commit phase with the immutable release contract preserved and the air-gapped transport path reserved for the next image build.
