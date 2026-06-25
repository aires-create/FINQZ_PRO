# ARCH-072 - Partner Acquisition Migration Planning & Impact Review

Status: DRAFT
Type: Migration Planning / Impact Review
Scope: Partner Acquisition / Prisma Migration Readiness / HML Rollout
Date: 2026-06-25

---

## 1. Executive Verdict

**GO WITH RESTRICTIONS**

The Prisma foundation for Partner Acquisition is now modeled in `schema.prisma`, but the future migration must still be treated as a controlled enterprise rollout.

This document confirms that the future migration should be limited to:

- creation of the six Partner Acquisition tables,
- creation of their tenant-aware foreign keys and indexes,
- no changes to `Opportunity`,
- no changes to the existing partner, pipeline, or CRM runtime tables,
- no legacy backfill unless separately approved.

This planning document does **not** authorize:

- generating a migration,
- applying a migration,
- runtime implementation,
- menu or route changes,
- schema expansion beyond the Partner Acquisition foundation already modeled.

---

## 2. Migration Scope

### Tables expected in the future migration

| Table | Purpose | Status |
|---|---|---|
| `partner_acquisition_leads` | intake/source capture | new |
| `partner_acquisition_prospects` | lifecycle aggregate | new |
| `partner_acquisition_command_inbox` | command dedupe / idempotency | new |
| `partner_acquisition_events` | append-only event log | new |
| `partner_acquisition_outbox` | reliable side-effect dispatch | new |
| `partner_acquisition_conversion_decisions` | approval / conversion trail | new |

### Explicit non-scope

- `Opportunity` tables
- `Partner` tables
- `Pipeline` tables
- `Stage` tables
- any CRM core table
- any automation runtime table

The future migration should only add the Partner Acquisition persistence foundation.

---

## 3. Table Creation Plan

### Recommended order

1. Create `partner_acquisition_leads`
2. Create `partner_acquisition_prospects`
3. Create `partner_acquisition_command_inbox`
4. Create `partner_acquisition_events`
5. Create `partner_acquisition_outbox`
6. Create `partner_acquisition_conversion_decisions`

### Why this order

- `Lead` must exist before `Prospect` because `Prospect` depends on it.
- `Tenant`, `Partner`, `Pipeline`, and `Stage` already exist in the current schema and are referenced by the new tables.
- command inbox, event log, and outbox do not need runtime dependencies beyond `Tenant`.
- conversion decision depends on `Prospect` and optionally `Partner`.

### Safe creation principle

Create tables first, then constraints and indexes, then deploy runtime later.

This keeps the migration predictable and reduces the risk of lock amplification.

---

## 4. Dependency Matrix

| New table | Depends on | Dependency type | Notes |
|---|---|---|---|
| `partner_acquisition_leads` | `Tenant` | FK | tenant-scoped ownership |
| `partner_acquisition_prospects` | `Tenant`, `PartnerAcquisitionLead`, optional `Partner`, optional `Pipeline`, optional `Stage` | FK / reference | `Opportunity` is not involved |
| `partner_acquisition_command_inbox` | `Tenant` | FK | dedupe and idempotency scope |
| `partner_acquisition_events` | `Tenant` | FK | append-only audit/event trail |
| `partner_acquisition_outbox` | `Tenant` | FK | dispatch queue |
| `partner_acquisition_conversion_decisions` | `Tenant`, `PartnerAcquisitionProspect`, optional `Partner` | FK | conversion approval trail |

### Confirmed isolation

- `Opportunity` is not part of the dependency graph.
- `Lead` from CRM is not a hard dependency.
- `Pipeline` and `Stage` are optional substrate references only.

---

## 5. Index and Constraint Impact Matrix

### Lead

- unique `(tenantId, leadCode)`
- unique `(tenantId, sourceReference)` where populated
- indexes on `(tenantId, channel)`, `(tenantId, status)`, `(tenantId, ownerUserId)`, `(tenantId, deletedAt)`

### Prospect

- unique `(tenantId, prospectCode)`
- unique `(tenantId, leadId)`
- unique `(tenantId, partnerId)` when populated
- unique `(tenantId, sourceReference)` where populated
- indexes on `(tenantId, status)`, `(tenantId, pipelineCode)`, `(tenantId, stageCode)`, `(tenantId, assignedUserId)`, `(tenantId, signedAt)`, `(tenantId, convertedAt)`, `(tenantId, deletedAt)`

### Command inbox

- unique `(tenantId, idempotencyKey)`
- indexes on `(tenantId, commandType)`, `(tenantId, aggregateType)`, `(tenantId, aggregateId)`, `(tenantId, status)`, `(tenantId, receivedAt)`

### Event log

- unique `(tenantId, eventId)`
- indexes on `(tenantId, aggregateId)`, `(tenantId, aggregateType)`, `(tenantId, eventType)`, `(tenantId, occurredAt)`

### Outbox

- unique `(tenantId, eventId)`
- indexes on `(tenantId, status)`, `(tenantId, availableAt)`, `(tenantId, eventType)`

### Conversion decision

- unique `(tenantId, prospectId)`
- unique `(tenantId, partnerId)` when populated
- indexes on `(tenantId, approved)`, `(tenantId, decidedAt)`

### Impact note

The future migration is mostly additive, so constraint risk is low if executed on empty or near-empty new tables.

---

## 6. Lock and Performance Risk Analysis

### Risk level

**Low to moderate**

### Why

- the migration is additive,
- no existing high-volume domain table is being structurally rewritten,
- no `Opportunity` or CRM core table is being altered,
- the new tables should start empty in normal rollout.

### Residual risks

- foreign keys and unique indexes can still take locks during creation,
- concurrent deploys can overlap if migration execution is not serialized,
- large seed/backfill operations would increase lock time, but they are not recommended here,
- if legacy data migration is later approved, the risk profile increases materially.

### Operational guidance

- run during a low-traffic maintenance window in HML first,
- keep the migration isolated and short,
- avoid bundling runtime changes in the same deployment step.

---

## 7. HML Rollout Plan

### Phase 1

- apply the migration in HML only,
- validate Prisma Client generation,
- validate schema shape and indexes,
- keep runtime disabled or behind feature flag.

### Phase 2

- deploy backend build with no business flow activation,
- verify the application still starts,
- verify type generation and test suite stability.

### Phase 3

- exercise only read-only inspection or synthetic test data,
- confirm tenant-scoped writes on new tables,
- confirm no accidental coupling to `Opportunity`.

### Phase 4

- if approved later, move to limited production rollout with explicit monitoring.

---

## 8. Rollback Plan

### Preferred rollback strategy

- revert the migration in HML first,
- remove the generated tables if no data has been committed,
- redeploy the previous stable schema state,
- keep runtime feature flags disabled until the rollback is complete.

### If data is already present

- rollback should be logical, not destructive,
- preserve rows for audit if they were written,
- use a controlled schema/version rollback rather than ad hoc deletion.

### Practical rule

The safest rollback path is to avoid backfill until the domain proves stable.

---

## 9. Seed and Backfill Decision

### Seed

**No mandatory seed** is required for the future migration.

### Backfill

**No legacy backfill now.**

### Reason

- the domain is being introduced as a new bounded context,
- forcing legacy mapping now would increase ambiguity,
- legacy Youware and legacy pipeline surfaces should remain evidence, not source of truth.

### Later possibility

If business later approves a controlled transition, a separate backfill plan can map historical leads/prospects into the new domain.

---

## 10. Legacy Data Decision

### Decision

Do **not** migrate legacy data in the first Partner Acquisition migration.

### Why

- legacy data models are not yet contractually frozen for this domain,
- no duplicate source of truth should be introduced,
- the first migration should establish schema readiness only.

### Classification

- legacy surfaces: `QUARANTINE`
- new tables: `KEEP` / `REUSE`
- legacy-to-new data conversion: `REMOVE LATER` or separate ADR

---

## 11. Prisma Client Impact

### Expected impact

- new Prisma models and types will be generated,
- backend compile-time types will include the new Partner Acquisition models,
- relation metadata for `Tenant`, `Lead`, `Partner`, `Pipeline`, and `Stage` will expand.

### Important note

This is a compile-time / client-generation impact, not a runtime behavior change by itself.

### Risk

Any repository or service code that later references the models must be introduced separately.

---

## 12. Docker and API Build Impact

### Docker

The future migration itself should not require Docker image changes if the backend already includes Prisma tooling.

### API build

The API build may be affected only by:

- Prisma Client regeneration,
- type-checking against the new models,
- future runtime code that consumes them.

### No direct impact expected

- no controller changes,
- no route changes,
- no frontend build changes.

---

## 13. Production Impact

### Direct production impact

None yet, because no migration is being applied.

### Future production considerations

- additive schema rollout only,
- strict tenant scope,
- explicit monitoring of unique constraint violations,
- operational watch on conversion idempotency and outbox processing once runtime exists.

### Critical caution

Do not couple production rollout to menu exposure or UI release. Schema readiness and product exposure are separate steps.

---

## 14. Checklist Before Generating Migration

1. Confirm all model names and fields are frozen.
2. Confirm `Opportunity` is excluded.
3. Confirm `Pipeline` and `Stage` remain reference-only.
4. Confirm `Partner` is downstream only.
5. Confirm tenant scoping on every table and unique key.
6. Confirm idempotency key strategy for inbox.
7. Confirm append-only event-log semantics.
8. Confirm outbox/event split.
9. Confirm conversion decision model is intentional.
10. Confirm no seed/backfill is required for the first rollout.
11. Confirm HML deployment window.
12. Confirm rollback owner and rollback criteria.

---

## 15. Checklist After Generating Migration

1. Review SQL for only additive changes.
2. Verify created tables and constraints match the approved schema.
3. Verify Prisma Client generation succeeds.
4. Verify no unintended changes to `Opportunity`, `Partner`, or `Pipeline`.
5. Verify migration name and checksum are archived.
6. Verify HML smoke tests succeed.
7. Verify rollback path is documented.
8. Verify production approval gates are still unmet until HML is cleared.

---

## 16. H16K Acceptance Criteria

H16K can be approved when all of the following are true:

1. The table creation plan remains additive.
2. The dependency matrix is frozen.
3. The index and constraint plan is frozen.
4. The rollout plan is approved for HML.
5. The rollback plan is explicit.
6. No legacy backfill is required for the first migration.
7. `Opportunity` remains excluded.
8. `Partner`, `Pipeline`, and `Stage` remain non-owning references.
9. Prisma Client impact is understood.
10. Production rollout can be separated from UI/menu work.

---

## 17. H16K Allowed Scope

- migration generation planning,
- SQL review,
- Prisma migration naming,
- HML validation planning,
- rollback rehearsal planning,
- deployment sequencing.

## 18. H16K Forbidden Scope

- generating or applying a migration,
- runtime implementation,
- backend services/repositories/controllers/routes,
- frontend/menu changes,
- `Opportunity`/`Partner`/`Pipeline` runtime coupling,
- seed/backfill execution,
- legacy data conversion without a separate decision.

---

## 19. Final Position

The Partner Acquisition migration is ready to be planned, but not yet generated.

The future migration should be:

- additive,
- tenant-scoped,
- idempotent-friendly,
- audit-ready,
- separate from `Opportunity`,
- separate from official `Partner` ownership,
- separate from pipeline ownership,
- safe to roll out first in HML.

