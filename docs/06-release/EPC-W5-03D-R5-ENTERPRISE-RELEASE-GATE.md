# EPC-W5-03D-R5 - Enterprise Release Gate

## 1. Summary

This delivery adds a read-only release gate for FINQZ PRO Enterprise. The gate coordinates the existing release verification, deploy dry-run, and runtime validation steps without changing backend, Nginx, database, Redis, API contract, JWT TTL, or any production/HML runtime.

The gate is designed to be deterministic, policy-driven, and fail-closed when evidence is incomplete.

## 2. Scope

Added:

- `scripts/gate/release-gate.sh`
- `scripts/gate/gate-policy.sh`
- `scripts/gate/evidence-aggregator.sh`
- `scripts/gate/gate-report.sh`
- `release/policies/release-gate-policy.json`
- `release/schemas/release-gate-summary.schema.json`
- `release/gate/.gitkeep`
- `docs/06-release/EPC-W5-03D-R5-ENTERPRISE-RELEASE-GATE.md`
- `docs/06-release/EPC-W5-03D-R5-ENTERPRISE-RELEASE-GATE-EVIDENCE.json`

Reused without reimplementation:

- `scripts/release/verify-release.sh`
- `scripts/deploy/deploy-engine.sh`
- `scripts/runtime/runtime-validator.sh`

## 3. Gate Design

The gate follows a fixed sequence:

1. validate inputs and policy;
2. run release verification;
3. run deploy dry-run;
4. run runtime validation;
5. aggregate evidence;
6. evaluate environment policy;
7. render a summary JSON and markdown report.

The gate is read-only. It does not deploy, rollback, or mutate backend state.

## 4. Policy Model

The release gate policy supports:

- `local`
- `hml`
- `production`

Policy decisions control:

- whether warnings are allowed;
- whether HTTP skip is allowed;
- whether a clean Git tree is required;
- which stage statuses are blocking.

The current policy allows warnings and HTTP skip in `local`, allows warnings but not HTTP skip in `hml`, and requires a clean tree with no warnings in `production`.

## 5. Evidence Produced

The gate writes evidence under `release/gate/<correlation-id>/`:

- `stage-results.json`
- `policy-evaluation.json`
- `execution-metadata.json`
- `release-gate-summary.json`
- `release-gate-report.md`
- per-stage log files

The aggregator also captures the outputs produced by the existing lower-level scripts:

- `release-verification.log`
- `deploy-dry-run.log`
- `runtime-validation.log`
- `runtime-check.json`
- `artifact-validation.json`
- `dry-run.json`
- `deploy-engine-report.md`
- `runtime-summary.json`
- `runtime-report.md`
- `frontend-validation.json`
- `bundle-validation.json`
- `http-validation.json`
- `security-validation.json`
- `compatibility-validation.json`

## 6. Validation Results

### Positive path

Executed on a local temporary fixture artifact:

- `scripts/release/verify-release.sh` passed.
- `scripts/deploy/deploy-engine.sh --dry-run` passed.
- `scripts/runtime/runtime-validator.sh --skip-http` passed with warnings.
- `scripts/gate/release-gate.sh --environment local --dry-run --skip-http` returned `PASS_WITH_WARNINGS`.

Observed warnings:

- HTTP validation skipped by request.
- Nginx unavailable in the local environment.

### Negative paths

Executed and confirmed:

- `--strict` in `local` returns `FAIL` because warnings become blocking.
- `hml --skip-http` returns `FAIL` because HTTP skip is not allowed by policy.

## 7. Root Cause Addressed

The gate now has a single local cleanup and aggregation path. The release gate does not depend on the backend logout issue, and it does not attempt any mutating action beyond producing local evidence files.

The important technical correction in this delivery is the orchestration layer itself:

- stage execution is sequential and logged;
- evidence is collected from existing scripts;
- policy evaluation is centralized;
- the summary schema is validated before the final report is emitted.

## 8. Residual Risks

- The runtime validation still reports a warning when Nginx is unavailable in the local host.
- A dirty Git tree is acceptable in `local` but remains observable in the summary.
- Exit codes above `1` may be normalized by the Windows Bash wrapper used in this sandbox, so the JSON `exitCode` is the authoritative value for review.

## 9. HML Revalidation Plan

Before promoting this gate in HML:

1. run the gate with `--environment hml`;
2. confirm the policy blocks `--skip-http`;
3. confirm the tree cleanliness rule remains enforced as intended;
4. confirm the summary schema still validates;
5. rerun the lower-level release, deploy, and runtime scripts on a controlled artifact fixture.

## 10. Final Decision

Current verdict for this delivery: `PASS_WITH_WARNINGS`.
