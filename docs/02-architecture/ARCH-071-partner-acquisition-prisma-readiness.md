# ARCH-071 - Partner Acquisition Prisma Readiness

Status: APPROVED WITH RESTRICTIONS
Type: Prisma Readiness / Schema Design
Scope: Partner Acquisition / Prisma / Persistence Candidates / Readiness for H16H
Date: 2026-06-25

---

## 1. Executive Verdict

**GO WITH RESTRICTIONS**

The Prisma design for `Partner Acquisition` is ready to be specified, but not yet implemented.

This document authorizes:

- future Prisma model design,
- field/relationship/constraint planning,
- migration-readiness analysis.

This document does **not** authorize:

- `schema.prisma` changes,
- migrations,
- repositories,
- services,
- controllers,
- routes,
- APIs,
- frontend,
- menu,
- runtime automation,
- any `Opportunity`, `Partner` or `Pipeline` runtime coupling.

The persistence architecture remains:

- `PartnerProspect` is the primary aggregate root,
- `PartnerLead` is a separate intake entity,
- `Opportunity` stays outside the domain,
- `Partner` stays the downstream official entity,
- `Pipeline` is reference substrate only,
- legacy Youware is historical evidence only.

---

## 2. Prisma Model Candidates

### Candidate models

| Prisma model candidate | Purpose | Status |
|---|---|---|
| `PartnerAcquisitionLead` | intake/source capture | `NEW RUNTIME` |
| `PartnerAcquisitionProspect` | lifecycle aggregate | `NEW RUNTIME` |
| `PartnerAcquisitionCommandInbox` | idempotency / dedupe | `NEW RUNTIME` |
| `PartnerAcquisitionEvent` | append-only domain event log | `NEW RUNTIME` |
| `PartnerAcquisitionOutbox` | reliable async dispatch | `NEW RUNTIME` |
| `PartnerAcquisitionConversionDecision` | approval trail / optional decision record | `ADAPT` / optional |

### Recommended naming rule

Use a domain-prefixed Prisma naming scheme so the new models cannot be confused with:

- `Lead`
- `Opportunity`
- `Partner`
- `Pipeline`
- legacy Youware models

---

## 3. Field Matrix

### 3.1 `PartnerAcquisitionLead`

| Field | Required | Type intent | Notes |
|---|---|---|---|
| `id` | yes | UUID | primary key |
| `tenantId` | yes | UUID | tenant scope |
| `leadCode` | yes | string | tenant-scoped business identifier |
| `fullName` | yes | string | canonical intake name |
| `email` | no | string? | optional contact data |
| `phone` | no | string? | optional contact data |
| `companyName` | no | string? | company/organization name |
| `document` | no | string? | CPF/CNPJ or equivalent |
| `channel` | yes | enum/string | social, mailing, base, etc. |
| `sourceName` | no | string? | human-readable source |
| `sourceReference` | no | string? | external/source correlation |
| `campaignId` | no | string? | optional campaign attribution |
| `hubContextId` | no | string? | SDR/Hub feeder reference |
| `ownerUserId` | no | UUID? | optional assigned user |
| `status` | yes | enum/string | intake lifecycle |
| `score` | no | int? | qualification score |
| `version` | yes | int | optimistic locking |
| `createdAt` | yes | DateTime | audit timestamp |
| `updatedAt` | yes | DateTime | audit timestamp |
| `deletedAt` | no | DateTime? | soft delete |

### 3.2 `PartnerAcquisitionProspect`

| Field | Required | Type intent | Notes |
|---|---|---|---|
| `id` | yes | UUID | primary key |
| `tenantId` | yes | UUID | tenant scope |
| `leadId` | yes | UUID | intake relation |
| `prospectCode` | yes | string | tenant-scoped business identifier |
| `fullName` | yes | string | canonical prospect name |
| `email` | no | string? | optional contact data |
| `phone` | no | string? | optional contact data |
| `companyName` | no | string? | company/organization name |
| `document` | no | string? | CPF/CNPJ or equivalent |
| `channel` | yes | enum/string | origin channel |
| `sourceName` | no | string? | source label |
| `sourceReference` | no | string? | external/source correlation |
| `campaignId` | no | string? | campaign attribution |
| `hubContextId` | no | string? | SDR/Hub reference |
| `sdrAgentId` | no | string? | SDR agent attribution |
| `status` | yes | enum/string | lifecycle state |
| `pipelineId` | no | UUID? | reference only |
| `stageId` | no | UUID? | reference only |
| `pipelineCode` | no | string? | snapshot/reference |
| `stageCode` | no | string? | snapshot/reference |
| `score` | no | int? | qualification score |
| `qualificationReason` | no | string? | justification |
| `assignedUserId` | no | UUID? | workflow owner |
| `nextActionAt` | no | DateTime? | next action time |
| `signedAt` | no | DateTime? | signature timestamp |
| `convertedAt` | no | DateTime? | conversion timestamp |
| `partnerId` | no | UUID? | official partner link after conversion |
| `version` | yes | int | optimistic locking |
| `createdAt` | yes | DateTime | audit timestamp |
| `updatedAt` | yes | DateTime | audit timestamp |
| `deletedAt` | no | DateTime? | soft delete |

### 3.3 `PartnerAcquisitionCommandInbox`

| Field | Required | Type intent | Notes |
|---|---|---|---|
| `id` | yes | UUID | primary key |
| `tenantId` | yes | UUID | tenant scope |
| `commandId` | yes | string | command envelope identifier |
| `commandType` | yes | string | official command type |
| `aggregateId` | yes | UUID/string | target aggregate id |
| `aggregateType` | yes | string | must not be `OPPORTUNITY` |
| `actorUserId` | yes | UUID/string | actor identity |
| `requestId` | yes | string | request correlation |
| `correlationId` | yes | string | trace correlation |
| `idempotencyKey` | yes | string | replay protection |
| `payloadHash` | no | string? | optional dedupe aid |
| `receivedAt` | yes | DateTime | command intake time |
| `processedAt` | no | DateTime? | completion marker |
| `status` | yes | string | received/processed/failed |

### 3.4 `PartnerAcquisitionEvent`

| Field | Required | Type intent | Notes |
|---|---|---|---|
| `id` | yes | UUID | primary key |
| `eventId` | yes | UUID/string | stable event identity |
| `tenantId` | yes | UUID | tenant scope |
| `aggregateId` | yes | UUID/string | lead/prospect aggregate id |
| `aggregateType` | yes | enum/string | `PARTNER_LEAD`, `PARTNER_PROSPECT`, `PARTNER` only when relevant to conversion outcome |
| `eventType` | yes | enum/string | official event name |
| `actorUserId` | yes | UUID/string | actor identity |
| `requestId` | yes | string | trace correlation |
| `correlationId` | yes | string | trace correlation |
| `idempotencyKey` | yes | string | replay key for mutating commands |
| `occurredAt` | yes | DateTime | event time |
| `payload` | yes | Json | immutable event data |
| `metadata` | no | Json? | controlled metadata |
| `version` | yes | int | aggregate version at write time |

### 3.5 `PartnerAcquisitionOutbox`

| Field | Required | Type intent | Notes |
|---|---|---|---|
| `id` | yes | UUID | primary key |
| `tenantId` | yes | UUID | tenant scope |
| `eventId` | yes | UUID/string | source event |
| `aggregateId` | yes | UUID/string | source aggregate |
| `aggregateType` | yes | string | source aggregate type |
| `eventType` | yes | string | source event type |
| `payload` | yes | Json | dispatch payload |
| `status` | yes | string | pending/published/failed |
| `availableAt` | yes | DateTime | dispatch schedule |
| `publishedAt` | no | DateTime? | publish timestamp |
| `attemptCount` | yes | int | retry counter |

### 3.6 `PartnerAcquisitionConversionDecision`

| Field | Required | Type intent | Notes |
|---|---|---|---|
| `id` | yes | UUID | primary key |
| `tenantId` | yes | UUID | tenant scope |
| `prospectId` | yes | UUID | target prospect |
| `partnerId` | no | UUID? | official partner result |
| `approved` | yes | boolean | approval decision |
| `reason` | no | string? | rejection/approval note |
| `decidedByUserId` | yes | UUID/string | human/system actor |
| `decidedAt` | yes | DateTime | decision timestamp |
| `version` | yes | int | optional optimistic lock |

---

## 4. Relation Matrix

| From | To | Relation | Notes |
|---|---|---|---|
| `PartnerAcquisitionLead` | `Tenant` | required | tenant ownership |
| `PartnerAcquisitionLead` | `User` | optional | owner/creator attribution |
| `PartnerAcquisitionProspect` | `Tenant` | required | tenant ownership |
| `PartnerAcquisitionProspect` | `PartnerAcquisitionLead` | required | one prospect must be traceable to one lead |
| `PartnerAcquisitionProspect` | `User` | optional | assigned user |
| `PartnerAcquisitionProspect` | `Partner` | optional / after conversion | downstream official entity |
| `PartnerAcquisitionProspect` | `Pipeline` | optional reference | substrate only |
| `PartnerAcquisitionProspect` | `Stage` | optional reference | substrate only |
| `PartnerAcquisitionEvent` | `Tenant` | required | event is tenant-scoped |
| `PartnerAcquisitionOutbox` | `PartnerAcquisitionEvent` | required | event dispatch source |
| `PartnerAcquisitionCommandInbox` | `Tenant` | required | dedupe scope |
| `PartnerAcquisitionConversionDecision` | `PartnerAcquisitionProspect` | required | approval trail |
| `PartnerAcquisitionConversionDecision` | `Partner` | optional | conversion target |

### Relation rule

No relation should introduce `Opportunity` as a parent, child, or proxy in the Partner Acquisition persistence graph.

---

## 5. Index and Constraint Matrix

### Lead constraints

- unique `(tenantId, leadCode)`
- unique `(tenantId, sourceReference)` when source reference is stable
- index `(tenantId, channel)`
- index `(tenantId, status)`
- index `(tenantId, ownerUserId)`
- index `(tenantId, deletedAt)`

### Prospect constraints

- unique `(tenantId, prospectCode)`
- unique `(tenantId, leadId)` if the design stays one-to-one lead-to-prospect
- unique `(tenantId, partnerId)` for converted partner link
- unique `(tenantId, sourceReference)` when source reference is stable
- index `(tenantId, status)`
- index `(tenantId, pipelineCode)`
- index `(tenantId, stageCode)`
- index `(tenantId, assignedUserId)`
- index `(tenantId, signedAt)`
- index `(tenantId, convertedAt)`
- index `(tenantId, deletedAt)`

### Inbox constraints

- unique `(tenantId, idempotencyKey)`
- unique `(tenantId, commandId)` if commandId is stable and external
- index `(tenantId, commandType)`
- index `(tenantId, aggregateId)`

### Event constraints

- unique `(tenantId, eventId)`
- unique `(tenantId, aggregateId, version)` if versioned write is adopted
- index `(tenantId, aggregateType)`
- index `(tenantId, eventType)`
- index `(tenantId, occurredAt)`

### Outbox constraints

- unique `(tenantId, id)` or `(tenantId, eventId)` depending on outbox topology
- index `(tenantId, status)`
- index `(tenantId, availableAt)`
- index `(tenantId, eventType)`

### Conversion decision constraints

- unique `(tenantId, prospectId)`
- unique `(tenantId, partnerId)` when populated
- index `(tenantId, approved)`
- index `(tenantId, decidedAt)`

---

## 6. Soft Delete Strategy

### Decision

Soft delete should exist on mutable acquisition aggregates only.

### Applies to

- `PartnerAcquisitionLead`
- `PartnerAcquisitionProspect`
- optional `PartnerAcquisitionConversionDecision` if retraction history is needed

### Does not apply to

- immutable event log rows,
- command inbox rows after processing,
- outbox rows after publish, except for status updates.

### Rule

Use `deletedAt` for mutable entities only.

Do not physically delete the canonical acquisition history unless a later compliance decision requires hard purge.

---

## 7. Optimistic Locking Strategy

### Decision

Use `version` on the mutable acquisition aggregates.

### Recommended targets

- `PartnerAcquisitionLead`
- `PartnerAcquisitionProspect`
- optional `PartnerAcquisitionConversionDecision`

### Behavior

- read current version,
- compare-and-swap on update,
- increment version on each successful state mutation,
- write event row with resulting version,
- reject stale writes.

### Why

This prevents duplicate qualification/conversion races and makes the domain safe for future runtime concurrency.

---

## 8. Command Inbox Strategy

### Decision

Persist a dedicated command inbox / dedupe model.

### Purpose

- replay protection,
- idempotency enforcement,
- command traceability,
- command-to-event correlation.

### Keys

- `tenantId`
- `idempotencyKey`
- optionally `commandId`

### Required behavior

- mutating commands are accepted once,
- replayed commands return the same logical result,
- duplicate command writes do not create duplicate lead/prospect/conversion rows.

---

## 9. Event Log Strategy

### Decision

Persist an append-only domain event log.

### Purpose

- auditability,
- replayability,
- historical trace,
- future integration feed.

### Shape

- event identity,
- tenant scope,
- aggregate identity,
- aggregate type,
- event type,
- actor/request correlation,
- idempotency key,
- occurred timestamp,
- immutable payload,
- version.

### Not chosen

- full event sourcing as the primary write model.

The write model remains state-table driven with a durable event trail.

---

## 10. Outbox Strategy

### Decision

Use an outbox table for future reliable side effects.

### Purpose

- publish domain events safely,
- feed automations later,
- trigger notifications later,
- integrate with hub/adapters later.

### Rule

Outbox must never become the source of truth.

It is a delivery mechanism only.

---

## 11. Pipeline Reference Strategy

### Decision

Reference `Pipeline` and `Stage` only as substrate metadata.

### Recommended fields

- `pipelineId`
- `stageId`
- `pipelineCode`
- `stageCode`

### Rule

The presence of these fields must not:

- make `Pipeline` the owner,
- make `Stage` the owner,
- make `Opportunity` a proxy,
- make frontend config canonical.

### Preferred modeling

- `pipelineCode` and `stageCode` preserve historical truth,
- `pipelineId` and `stageId` are optional relational validators,
- `pipelineCode`/`stageCode` remain the safest canonical snapshot for persistence history.

---

## 12. Partner Reference Strategy

### Decision

Store `partnerId` only as a downstream conversion link on `PartnerAcquisitionProspect` and optionally `PartnerAcquisitionConversionDecision`.

### Rule

`partnerId` is allowed only after conversion approval.

### Constraints

- unique when populated,
- tenant-scoped,
- never required before conversion,
- never used to replace prospect identity.

---

## 13. Double Conversion Prevention

The future Prisma design must prevent duplicate conversion by combining:

- `idempotencyKey` uniqueness,
- prospect versioning,
- unique `partnerId` linkage,
- unique `prospectId` conversion decision,
- transactional conversion write,
- append-only event logging,
- optional future process-manager guard.

### Forbidden outcome

- one prospect creating two partners,
- one idempotency key creating two conversions,
- one partner being linked to multiple acquisition prospects.

---

## 14. Tenant Scope Strategy

### Decision

Every future Prisma model in this domain must be tenant-scoped.

### Rule set

- `tenantId` mandatory on every table,
- all unique rules are tenant-aware,
- all queries filter by tenant,
- all relation lookups validate tenant ownership,
- no cross-tenant command replay.

### Non-negotiable

Tenant scope is not inferred from UI, session, or pipeline code.

It is persisted and enforced.

---

## 15. Idempotency Strategy

### Decision

Idempotency is persisted in the command inbox and reinforced by aggregate constraints.

### Model

- one command inbox row per mutating command attempt,
- one normalized `idempotencyKey` per tenant,
- same key must not create duplicate results.

### Result

The domain can safely accept retries, network duplicates and replayed requests.

---

## 16. Opportunity Separation

`Opportunity` must remain completely separate from Partner Acquisition persistence.

### Required separation

- no `opportunityId` field in acquisition tables,
- no `Opportunity` relation in acquisition tables,
- no `Opportunity` aggregate type in acquisition event stream,
- no conversion path through `Opportunity`,
- no reuse of `Opportunity` status or lifecycle names as canonical acquisition truth.

### Persistence consequence

If a future adapter wants to relate the two domains, it must be explicit and one-directional, not conflated.

---

## 17. Migration Blockers

### Still blocking schema migration

- final choice of FK vs snapshot for `pipelineId/stageId`,
- final choice of whether conversion decision is a table or event-only,
- final naming of lead/prospect codes,
- final outbox shape and event-log split,
- final policy for stable `sourceReference` uniqueness,
- final policy for re-opening lost prospects,
- final policy for `partnerId` uniqueness behavior on conversion.

### Not blocking schema migration

- aggregate root decision,
- idempotency requirement,
- tenant requirement,
- optimistic locking requirement,
- event log requirement,
- outbox requirement,
- separation from `Opportunity`,
- separation from legacy Youware,
- `Partner` as downstream official entity.

---

## 18. H16H Authorization

H16H is authorized when the following are frozen:

- Prisma model names,
- field names,
- relation mode,
- constraints,
- indexes,
- event log/outbox split,
- conversion decision representation,
- pipeline reference mode.

### H16H allowed scope

- final Prisma schema proposal,
- migration planning only,
- no runtime implementation.

### H16H forbidden scope

- repositories,
- services,
- controllers,
- routes,
- frontend,
- menu,
- automations runtime,
- `Opportunity`, `Partner` or `Pipeline` runtime.

---

## 19. Risk Matrix

| Risk | Severity | Note |
|---|---|---|
| Using `Opportunity` as acquisition storage | High | Explicitly blocked. |
| Making `Pipeline` the owner | High | Explicitly blocked. |
| Duplicate conversion writes | High | Must be guarded by unique constraints and idempotency. |
| Missing tenant scope on one table | High | Would break enterprise isolation. |
| No optimistic locking | Medium-High | Races in qualification/conversion. |
| No outbox | Medium | Side effects become fragile. |
| Overfitting to legacy naming | Medium | Can leak Youware as source of truth. |

---

## 20. Conclusion

The Prisma readiness picture is clear enough to move to H16H.

The domain should be modeled as:

- one intake entity (`PartnerAcquisitionLead`),
- one lifecycle aggregate (`PartnerAcquisitionProspect`),
- one command inbox,
- one append-only event log,
- one outbox,
- optional conversion decision record.

The design remains:

- tenant-scoped,
- audit-ready,
- idempotent,
- optimistic-lock aware,
- separate from `Opportunity`,
- separate from official `Partner`,
- separate from `Pipeline` ownership,
- separate from legacy Youware.

