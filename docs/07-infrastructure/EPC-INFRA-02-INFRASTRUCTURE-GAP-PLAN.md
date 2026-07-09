# EPC-INFRA-02 - Infrastructure Gap Plan

## 1. Resumo executivo

This plan lists the gaps identified in `EPC-INFRA-01-INFRASTRUCTURE-READINESS-AUDIT.md` and orders them for controlled closure before production sign-off.

The goal is to reduce production risk without changing application behavior.

## 2. Gap matrix

| ID | Gap | Priority | Effort | Dependencies | Recommended order |
| --- | --- | --- | --- | --- | --- |
| GAP-001 | Verify real VPS inventory (OS, CPU, memory, disk, swap) | P0 | M | Access to the actual host or provider console | 1 |
| GAP-002 | Verify host hardening (SSH, firewall/UFW, fail2ban, timezone, NTP) | P0 | M | GAP-001 | 2 |
| GAP-003 | Materialize production environment handling (`.env.production` process) | P0 | S-M | Secret management decision | 3 |
| GAP-004 | Activate valid HTTPS/TLS with issued certificates | P0 | M | DNS, domain, certificate issuance, Nginx edge access | 4 |
| GAP-005 | Capture backup and restore evidence for PostgreSQL | P0 | M | Database access, backup storage, restore target | 5 |
| GAP-006 | Collect rollback evidence for image/code/database recovery | P0 | M | GAP-005, deployment artifact versioning | 6 |
| GAP-007 | Collect host-side observability evidence (alerts, logs, tracing if applicable) | P1 | M | Monitoring stack access | 7 |
| GAP-008 | Validate production promotion/runbook execution on staging | P1 | M | Operational checklist approval | 8 |
| GAP-009 | Confirm cache/compression/performance tuning at the edge | P2 | S | Nginx edge in production-like mode | 9 |
| GAP-010 | Formalize a final evidence pack for production sign-off | P1 | S | GAP-001 through GAP-008 | 10 |

## 3. Priority details

### P0

- Host inventory and hardening must be proven before any production claim.
- Production environment variables must be materialized safely.
- TLS must be active with valid certificates.
- Backup and rollback evidence must exist.

### P1

- Observability and operational evidence must be collected.
- Staging execution should be reproducible and auditable.

### P2

- Performance tuning and edge optimization can be deferred until the base controls are closed.

## 4. Dependencies

1. VPS access or provider console access.
2. DNS and certificate issuance ownership.
3. Secure secret-handling decision.
4. Backup storage and restore target.
5. Monitoring/alerting endpoint access.
6. Approved staging execution window.

## 5. Execution order

1. Validate the actual host inventory.
2. Validate host hardening.
3. Materialize production environment handling.
4. Activate TLS.
5. Prove backup and restore.
6. Prove rollback.
7. Prove monitoring and operational evidence.
8. Close any edge tuning items.
9. Bundle the evidence pack.

## 6. Risks

- Manual provisioning drift.
- Secret leakage if environment materialization is ad hoc.
- TLS activation without certificate lifecycle proof.
- Restore or rollback untested in a live-like context.
- Insufficient operational evidence for final sign-off.

## 7. Completion criteria

- All P0 gaps are closed with evidence.
- P1 gaps have documented mitigations or proofs.
- P2 items are either completed or explicitly deferred.
- A production sign-off package exists with traceable evidence IDs.

