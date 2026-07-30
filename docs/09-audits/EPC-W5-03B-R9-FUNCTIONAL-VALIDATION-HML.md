# EPC-W5-03B-R9 - Functional Validation (HML)

## Verdict

DEFERRED_PENDING_EVIDENCE

## Evidence Status

INITIALIZED_WITHOUT_EXECUTION

## Identification

- Code: `EPC-W5-03B-R9`
- Title: `Functional Validation (HML)`
- Wave: `W5-03B`
- Environment: `HML`
- Classification: `Internal Audit / Functional Readiness`
- Responsible: `Codex Senior Engineer`
- Status: `NOT_STARTED`
- Date: `2026-07-20`
- Branch: `homologation/bootstrap-vps`
- Baseline commit: `feb93ba696d8362030c7a57b18a0a0ea7a6d997b`
- Dependencies:
  - `DCA`
  - `PCCD`
  - `ADRs`
  - `Master Catalog`
  - `Runtime`
  - `EPC-W5-03B-R8D`
  - `docs/09-audits/evidence/EPC-W5-03B-R8D-IMAGE-TRANSPORT-AND-HML-AVAILABILITY.json`
  - `docs/09-audits/evidence/EPC-W5-03B-R8D-TRANSFER-HASH-LOAD-VERIFY.mmd`

## Objective

Validate FINQZ PRO functionally in HML without modifying the frozen baseline.

## Scope

1. Login
2. Authentication
3. Session
4. Permissions
5. Users
6. Companies
7. Multi-company
8. Clients
9. Products
10. Subproducts
11. Opportunities
12. Pipeline
13. Kanban
14. Simulators
15. Proposals
16. Documents
17. Dashboard
18. PostgreSQL
19. Redis
20. Observability
21. Security
22. Performance
23. Error handling
24. Functional rollback

## Execution Rules

- Incremental tests only
- Evidence per case
- Failure isolation
- No corrective coding during initial baseline capture
- Defects classified before implementation
- Sanitized evidence only
- Correlated logs preferred
- Personal data protection required

## Allowed States

- `NOT_STARTED`
- `IN_PROGRESS`
- `PASSED`
- `PASSED_WITH_RESTRICTIONS`
- `FAILED`
- `BLOCKED`
- `DEFERRED`
- `NOT_APPLICABLE`

## Allowed Verdicts

- `GO`
- `GO_WITH_RESTRICTIONS`
- `NO_GO`
- `DEFERRED_PENDING_EVIDENCE`

## Severities

- `S0_CRITICAL`
- `S1_HIGH`
- `S2_MEDIUM`
- `S3_LOW`
- `S4_INFORMATIONAL`

## Exit Criteria

- Critical cases executed
- Authentication approved
- Persistence approved
- Redis approved
- Main flows approved
- No open `S0` defects
- `S1` defects formally handled
- Logs and evidence available
- Rollback known
- Formal decision recorded

## Notes

- This artifact initializes the R9 gate only.
- No runtime, database, Redis, container, deploy, or code-funcional change was performed to create it.
- No decision contrary to SSOT was introduced here.

## Next Phase

R10 Business Acceptance Validation (HML)
