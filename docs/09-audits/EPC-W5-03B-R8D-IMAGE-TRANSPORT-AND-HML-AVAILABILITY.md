# EPC-W5-03B-R8D - Image Transport and HML Availability

## Verdict

DEFERRED_PENDING_SECURE_TRANSFER

## Evidence Status

PARTIAL_LOCAL_EVIDENCE_ONLY

## Phase

EPC-W5-03B-R8D - Image Transport and HML Availability

## Objective

This phase is the transport-and-availability gate for the frozen backend candidate created in R8C.
The required intent is to preserve the same immutable image identity across local freeze, secure transfer, remote load, and HML availability checks without deploying anything.

## Baseline Local

- Branch: `homologation/bootstrap-vps`
- HEAD: `feb93ba696d8362030c7a57b18a0a0ea7a6d997b`
- Short SHA: `feb93ba`
- Upstream: `origin/homologation/bootstrap-vps`
- Working tree: dirty with preexisting user artifacts, including `.env.example`, `_worktrees/`, and untracked documentation/scripts
- Local baseline status: branch aligned with upstream at the time of this session

## Baseline HML

The HML baseline requested by the phase could not be directly collected from this environment because remote SSH/SCP access is not available in the current session.

The phase brief defines the intended HML assumptions as:

- VPS host: `root@72.60.130.32`
- Project root: `/opt/finqz/FINQZ_PRO`
- Backend root: `/opt/finqz/FINQZ_PRO/backend`
- Existing rollback image: `sha256:f945b26ed54242be14736dcc10e21a5a59e7984288a9892cbae7d2d0ae81a898`

## Local Image Identity

The R8C candidate image identity was already frozen in the previous phase and remains the reference for this transport gate.

- Tag: `finqz-pro-backend:hml-feb93ba-r8c`
- Image ID: `sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- Repo digest reference: `finqz-pro-backend@sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- Platform: `linux/amd64`

## Local TAR

- TAR file: `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c\finqz-pro-backend-hml-feb93ba-r8c.tar`
- SHA-256: `3c563926c9df552c92cc4c973baf8af96d734464ddefb595007b8bcd877521b2`
- Size: `219811328` bytes
- Creation time UTC: `2026-07-16T19:43:35Z`
- Last write time UTC: `2026-07-16T19:43:46Z`

## Local Manifest

The frozen manifest is present and matches the R8C contract values.

- File: `C:\Projects\FINQZ_PRO_RELEASE_ARTIFACTS\feb93ba-r8c\finqz-pro-backend-hml-feb93ba-r8c.manifest.json`
- `phase`: `EPC-W5-03B-R8C`
- `gitSha`: `feb93ba696d8362030c7a57b18a0a0ea7a6d997b`
- `image.tag`: `finqz-pro-backend:hml-feb93ba-r8c`
- `image.id`: `sha256:b887f858a5a9a952754188cca9b3eaa3c1a7807d0e744071d2c8e9c043980060`
- `artifact.tarSha256`: `3c563926c9df552c92cc4c973baf8af96d734464ddefb595007b8bcd877521b2`
- `artifact.tarSizeBytes`: `219811328`

## Transfer

The secure transfer step was not executed in this environment.

Reason:

- the local Docker daemon is unavailable in this session;
- remote SSH/SCP access to the HML VPS cannot be exercised from this environment.

## Remote Hash

Not collected.

## Remote Size

Not collected.

## docker load

Not executed.

## Remote Identity

Not collected.

## Remote Content

Not collected.

## Compose

Not validated in this session.

The phase requires an immutable compose contract with `image` pinned and `build` absent for the backend service, but that remote verification was not executed here.

## Absence of Deploy

No deploy was executed in this session.

No `docker compose up`, no migration, no restart, and no runtime replacement were performed.

## Runtime Current

The live HML runtime was not queried from this environment.

## Rollback

The rollback image identifier is preserved in the phase brief and was not modified by any action in this session.

## Frontend

The frontend fingerprint could not be revalidated remotely from this environment.

## Risks

- Secure transfer to HML is pending because remote transport could not be executed here.
- Remote hash, load, and runtime immutability checks remain pending.
- Docker daemon access was unavailable locally, so no container/image operations could be replayed in this session.

## Gates

- Gate 1: local baseline aligned
- Gate 2: local image reference preserved from R8C
- Gate 3: local TAR hash and size confirmed
- Gate 4: local manifest confirmed
- Gate 5 through Gate 18: not executed in this environment

## Verdict

DEFERRED_PENDING_SECURE_TRANSFER

## Next Step

Resume the phase from the secure transfer gate in an environment with SSH/SCP access to HML and a working Docker daemon on the execution side.
