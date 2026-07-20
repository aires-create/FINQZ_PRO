# EPC-W5-03B-R2 - HML Release Reconciliation and Controlled Deployment

## Verdict

DEFERRED_PENDING_RECONCILIATION

## Local Baseline

- Branch local: `homologation/bootstrap-vps`
- HEAD local: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- Upstream: `origin/homologation/bootstrap-vps`
- Local history head: `cce8840 docs(audit): add W5-03C-R3 live runtime validation`
- Local worktree is dirty before this phase, with pre-existing `.env.example` and audit/runbook artifacts preserved.

## Reconciliation Sources

### Official HML release mechanism

The repository documents the official HML deploy path as:

```bash
cd backend && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.hml.yml up -d --build
```

The HML override is defined in [backend/docker-compose.hml.yml](../../backend/docker-compose.hml.yml) and the base stack in [backend/docker-compose.yml](../../backend/docker-compose.yml).

### HML access evidence

- DNS resolves:
  - `hml.finqz.com.br -> 72.60.130.32`
  - `api-hml.finqz.com.br -> 72.60.130.32`
- TCP reachability:
  - port `22` open
  - port `443` open
- SSH session attempt with `ssh.exe`:
  - `Permission denied (publickey,password)`
- Public HTTPS probe from this session:
  - blocked by the local network/proxy path with `127.0.0.1:9` refusal

Conclusion:

- HML host is reachable at the network level.
- HML runtime state is **not verified** because the session lacks SSH authentication and HTTP probe access is blocked locally.

## Git Reconciliation

- `origin/main...HEAD`: `0 377`
- `remotes/vps/homologation/bootstrap-vps...HEAD`: `1 371`
- merge-base with `remotes/vps/homologation/bootstrap-vps`: `b774d26e2423f3d624a100dc349aafbd49e5a3e6`
- candidate proxy SHA from the VPS-tracking ref: `db97dedadcb3428e2a140bf9f808438e10f5aa06`

Important interpretation:

- local is far ahead of `origin/main`
- local is also far ahead of the `vps/homologation/bootstrap-vps` ref
- the VPS-tracking ref is only a proxy, not direct proof of deployed HML state

## Local Validation Results

- `npm run build` at repository root: PASS
- `cd backend && npm run build`: PASS
- `npm run test` at repository root: FAIL
- `cd backend && npm run test`: FAIL

### Root test failure summary

- `3` test files failed
- `5` tests failed
- `23` test files passed

Observed failing areas:

- admin pipelines stage archive
- admin pipelines stage edit
- admin pipelines stage reorder

### Backend test failure summary

- `5` test files failed
- `5` tests failed
- `123` test files passed

Observed failing areas:

- integration get-session
- memberships
- operation
- provider runtime inspection
- users reset-password flow

These failures are local blockers for a controlled release candidate.

## Git Comparison Summary

### Local exclusive commits

- `cce8840` docs(audit): add W5-03C-R3 live runtime validation
- `f1995f7` docs(runbook): add local Redis startup procedure
- `9904a0f` fix(bootstrap): recognize official dev launch context
- `8bb3582` docs(audit): add Redis readiness policy diagnosis
- `852c10d` fix(bootstrap): make environment loading cwd-independent

### VPS-tracking exclusive commit

- `db97ded` fix(deps): sync backend lockfile for docker build

### Production exclusive commits

- Production SHA could not be verified from this session.

## Matrix Of Differences

| Component | Local | Branch remote | HML implanted | Production | Fonte vencedora | Ação |
| --- | --- | --- | --- | --- | --- | --- |
| Layout principal | Present in local app tree | Present in branch history | Unknown | Unknown | LOCAL | Preserve |
| Navegação | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Dashboard | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Clientes | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Pipeline | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Oportunidades | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Detalhe da oportunidade | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Tarefas | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Anotações | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Simulador | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Anexos | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Histórico | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Tags | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Ações rápidas | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Saúde operacional | Present | Present | Unknown | Unknown | BRANCH_REMOTE | Reconcile with runtime proof |
| Master Catalog | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Autenticação | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Permissões | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Redis | Present | Present | Unknown | Unknown | BRANCH_REMOTE | Validate against HML runtime |
| Readiness | Present | Present | Unknown | Unknown | BRANCH_REMOTE | Verify on HML |
| Telemetry | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Environment bootstrap | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Prisma schema | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Migrations | Present | Present | Unknown | Unknown | UNKNOWN | Verify on HML before deploy |
| Seed | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| API contracts | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Frontend API client | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Feature flags | Present | Present | Unknown | Unknown | LOCAL | Preserve |
| Docker | Present | Present | Unknown | Unknown | BRANCH_REMOTE | Preserve compose base |
| Nginx | Present | Present | Unknown | Unknown | BRANCH_REMOTE | Preserve edge config |
| PM2/systemd | Unknown | Unknown | Unknown | Unknown | UNKNOWN | Verify on host |
| Artefatos estáticos | Local build passes | Present in docs | Unknown | Unknown | LOCAL | Preserve build output policy |

## Migrations And Database

- Local migrations exist and the local backend build succeeds.
- HML applied migrations could not be verified from this session.
- Drift status on HML: `UNKNOWN`
- Migration safety classification: `UNKNOWN`
- Because the remote database state is not verified, deployment remains deferred.

## Functional Surfaces To Preserve

- Dashboard
- Clientes
- Pipeline
- Oportunidades
- Opportunity detail
- Tarefas
- Anotações
- Simulador
- Anexos
- Histórico
- Tags
- Ações rápidas
- Master Catalog
- Auth and permissions
- Redis readiness behavior

## Risks

- HML SSH access is not available from this session.
- Public HTTPS probes are blocked by the local execution path.
- Root and backend test suites currently have failures.
- The VPS-tracking branch exists, but it is not proof of the deployed SHA.
- Deploying without reconciling the remote state would risk overwriting a divergent runtime.

## Backup And Rollback Plan

### Backup

- Capture current HML SHA once SSH access is available.
- Capture current HML container/image metadata.
- Capture current static frontend artifact version.
- Capture Nginx config snapshot.
- Capture database backup only after explicit approval and migration review.

### Rollback

- Roll back to the last verified safe SHA.
- Re-apply the official compose stack.
- Validate `health`, `live`, and internal `ready`.
- Restore the prior frontend artifact if needed.
- Restore database only if a migration is approved and a backup exists.

## GO / NO-GO

NO_GO

## Next Step

DEFERRED_PENDING_RECONCILIATION

## Why This Is Deferred

- The HML host is network-reachable but not SSH-authenticated from this session.
- Public HTTP verification is blocked in this execution environment.
- The local test suites still fail.
- Therefore the deploy candidate is not yet safe to build, sign, or promote.
