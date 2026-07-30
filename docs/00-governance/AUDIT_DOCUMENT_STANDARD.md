# AUDIT Document Standard

## Objective

Define a single documentation standard for the `docs/06-audits` directory, covering naming, categories, lifecycle states, and a safe migration plan from legacy filenames to the new convention.

This document is normative for future audit artifacts and should be used as the reference before any rename, archival decision, or documentation-only transition.

---

## 1. Naming Standard

### 1.1 Structural documents

Use the following prefixes only for structural governance documents:

- `ADR-XXX`
- `ARCH-XXX`
- `RUN-XXX`

These documents define architecture, runtime policy, or decision records.

### 1.2 Audit documents

Use the following filename pattern for audit narratives:

- `AUDIT_YYYY-MM-DD_<SUBJECT>.md`

Rules:

- `YYYY-MM-DD` must be the audit date in ISO format.
- `<SUBJECT>` must use uppercase snake case.
- The file extension for the narrative must be `.md`.
- The filename must not include status words such as `REVIEW_REQUIRED`, `DRAFT`, or `FINAL` unless they are part of the standardized lifecycle metadata inside the document.

### 1.3 Audit artifacts

Use the following filename pattern for raw or generated audit artifacts:

- `AUDIT_YYYY-MM-DD_<SUBJECT>.txt`

Rules:

- These files are reference artifacts, not narrative decisions.
- The `.txt` extension is reserved for diffs, logs, snapshots, staging exports, or other machine-oriented evidence.

---

## 2. Categories

### 2.1 Structural documents

Applies to:

- `ADR-XXX`
- `ARCH-XXX`
- `RUN-XXX`

Purpose:

- Record a stable decision, architecture rule, or runtime policy.

### 2.2 Audits

Applies to:

- `AUDIT_YYYY-MM-DD_<SUBJECT>.md`

Purpose:

- Record findings, status, risk, and recommendations from a review or audit.

### 2.3 Artifacts

Applies to:

- `AUDIT_YYYY-MM-DD_<SUBJECT>.txt`

Purpose:

- Preserve supporting evidence without making it the canonical narrative.

---

## 3. Lifecycle

All audit documents and related artifacts must be classified in one of the following lifecycle states.

### 3.1 ACTIVE

Definition:

- The document is the current canonical version for its subject.

Rules:

- There should be only one ACTIVE narrative per subject/date combination.
- ACTIVE audit documents must use the standardized filename pattern.

### 3.2 REFERENCE

Definition:

- The document is evidence, supporting output, or a non-canonical artifact.

Rules:

- `.txt` audit outputs are typically REFERENCE.
- REFERENCE files should not be treated as policy decisions.

### 3.3 TRANSITIONAL

Definition:

- The document is still valid, but its filename or placement does not yet fully match the standard.

Rules:

- Transitional files may coexist with standardized files during rename planning.
- Transitional files must be explicitly tracked until renamed or archived.

### 3.4 ARCHIVED

Definition:

- The document is retained for history only and should not be used as a current source of truth.

Rules:

- Archived files are frozen and should not be edited as active governance material.
- Archive status should be reserved for superseded or obsolete documents.

---

## 4. Current Inventory in `docs/06-audits`

The table below maps the current files to their recommended lifecycle classification and proposes a safe rename path without executing it.

| Current file | Current type | Proposed state | Safe rename proposal | Notes |
| --- | --- | --- | --- | --- |
| `AUD-002-SEED_SPECIALIZATION_PLAN_REVIEW_REQUIRED.md` | markdown audit/plan hybrid | `TRANSITIONAL` | `AUDIT_2026-06-04_SEED_SPECIALIZATION_PLAN.md` | Legacy prefix and review suffix should be normalized. Use current date for the standardized filename unless a historical audit date is formally recovered. |
| `AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md` | markdown audit | `ACTIVE` | `AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md` | Already a canonical audit narrative in content and now aligned with the standard filename. |
| `AUDIT_2026-06-03_OPORTUNIDADES_DIFF.txt` | text artifact | `REFERENCE` | keep as artifact, or `AUDIT_2026-06-03_OPPORTUNITIES_DIFF.txt` if normalized spelling is required | Artifact is valid as-is. If renamed, spelling should be standardized consistently and only with evidence of no downstream references. |
| `AUDIT_2026-06-03_PHASE_G25.txt` | text artifact | `REFERENCE` | keep as artifact | Stable supporting evidence; no rename required unless a global naming pass is approved. |
| `AUDIT_2026-06-03_PHASE_G26_9.txt` | text artifact | `REFERENCE` | keep as artifact | Stable supporting evidence; no rename required unless a global naming pass is approved. |
| `AUDIT_2026-06-03_STAGED_DOCS.txt` | text artifact | `REFERENCE` | keep as artifact | Stable supporting evidence; no rename required unless a global naming pass is approved. |

---

## 5. Proposed Safe Renaming Plan

This section is a plan only. No rename must be executed without explicit approval.

### Phase 1 - Normalize audit narratives

Targets:

- `AUD-002-SEED_SPECIALIZATION_PLAN_REVIEW_REQUIRED.md`
- `AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md`

Proposed action:

- Rename to the standardized `AUDIT_YYYY-MM-DD_<SUBJECT>.md` pattern.
- Preserve contents.
- Do not merge with unrelated edits.

### Phase 2 - Preserve reference artifacts

Targets:

- `AUDIT_2026-06-03_OPORTUNIDADES_DIFF.txt`
- `AUDIT_2026-06-03_PHASE_G25.txt`
- `AUDIT_2026-06-03_PHASE_G26_9.txt`
- `AUDIT_2026-06-03_STAGED_DOCS.txt`

Proposed action:

- Keep as `REFERENCE` unless a future evidence normalization task requires rename.
- Do not alter content.

### Phase 3 - Optional spelling normalization

Only if a global rename plan is approved:

- Normalize `OPORTUNIDADES` to `OPPORTUNITIES` only if downstream references are updated in the same controlled change.

---

## 6. Conflicts and Risks

### 6.1 Filename collision risk

Risk:

- A standardized filename may already exist in another branch, workspace, or future audit output.

Mitigation:

- Check for exact filename collisions before any rename.

### 6.2 Broken references risk

Risk:

- Other docs may link to legacy filenames.

Mitigation:

- Search and update references in the same controlled change if rename is approved.

### 6.3 Date ambiguity risk

Risk:

- Some existing audit documents do not encode a clear audit date in the filename.

Mitigation:

- Use the document creation or audit date from governance records.
- If the date cannot be recovered, use the current governance date only for planning purposes and mark the rename as provisional.

### 6.4 Meaning drift risk

Risk:

- Removing `REVIEW_REQUIRED` from filenames can hide the fact that a document is transitional.

Mitigation:

- Track lifecycle state inside the governance index or this standard document.

### 6.5 Mixed artifact risk

Risk:

- The folder contains both narrative audits and raw text outputs.

Mitigation:

- Maintain the `md` / `txt` distinction and classify artifacts explicitly as `REFERENCE`.

---

## 7. Operational Rules

- Do not move files as part of documentation standardization unless explicitly approved.
- Do not delete legacy files as part of the standardization effort.
- Do not rename files without first confirming downstream references.
- Do not convert reference artifacts into canonical narratives.
- Do not introduce new audit naming patterns outside the standard defined here.

---

## 8. Approval Criteria for Future Renames

A future rename is acceptable only if all of the following are true:

- The new filename matches `AUDIT_YYYY-MM-DD_<SUBJECT>.md` or `.txt`.
- The subject is uppercase snake case.
- The file has a clear lifecycle state.
- Downstream references have been reviewed.
- The rename is executed in isolation or with a fully documented bulk plan.
- No content changes are mixed into the rename unless explicitly approved.

---

## 9. Summary Decision

Current state:

- `docs/06-audits` is functionally usable, but naming is not yet standardized.
- The folder contains a mix of `TRANSITIONAL` narratives and `REFERENCE` artifacts.
- The safe path is to define the standard now and rename later in a controlled pass.

Recommended immediate action:

- Approve this standard.
- Keep all current files in place.
- Plan renames separately and execute only after reference validation.
