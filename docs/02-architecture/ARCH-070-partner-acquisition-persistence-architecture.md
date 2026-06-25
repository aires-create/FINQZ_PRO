# ARCH-070 - Partner Acquisition Persistence Architecture

Status: APPROVED WITH RESTRICTIONS
Type: Persistence Architecture
Scope: Partner Acquisition / Partner Lead / Partner Prospect / Event Log / Outbox / Prisma Readiness
Date: 2026-06-25

---

## 1. Executive Verdict

**GO WITH RESTRICTIONS**

The persistence architecture for `Partner Acquisition` is now sufficiently defined to advance to Prisma readiness work.

This document does **not** authorize:

- schema implementation,
- migrations,
- repository runtime,
- service runtime,
- controller/route/API changes,
- frontend changes,
- menu changes,
- automation runtime,
- any `Opportunity`, `Partner` or `Pipeline` runtime coupling.

It does authorize the future Prisma design to proceed with:

- tenant-scoped persistence,
- optimistic locking,
- idempotency persistence,
- append-only event log,
- outbox pattern,
- explicit separation from `Opportunity`, `Partner` and legacy Youware.

---

## 2. Persistence Model Decision

The domain should be persisted as **two primary persisted entities plus supporting infrastructure**:

1. `PartnerLead`
2. `PartnerProspect`

Supporting infrastructure:

- command inbox / deduplication,
- append-only domain event log,
- outbox,
- audit trail integration,
- optional conversion decision record.

### Decision summary

- `PartnerLead` is the intake record.
- `PartnerProspect` is the canonical lifecycle aggregate for acquisition.
- They are **separate entities and separate tables**.
- They are not phases of the same table.
- They are not `Opportunity`.
- They are not `Partner`.

### Not chosen

- A single monolithic `PartnerAcquisitionCase` table is **not required** at this stage.
- Full event sourcing is **not** required.
- `Opportunity` must not be reused as the acquisition store.

---

## 3. Aggregate Decision

### Aggregate root

**Primary aggregate root: `PartnerProspect`**

### Supporting persisted entity

**`PartnerLead` is a separate intake aggregate/entity**

### Why this decision

- `PartnerProspect` owns the commercial lifecycle, transitions and conversion gate.
- `PartnerLead` is the source intake record and may exist before a prospect is created.
- Separating them avoids mixing source capture with commercial lifecycle.
- It avoids turning `Opportunity` into a proxy acquisition record.
- It preserves clean conversion semantics to official `Partner`.

### Rejected alternative

- `PartnerAcquisitionCase` is not necessary as a first persistence boundary.
- If future runtime needs a larger orchestration envelope, it can be introduced later as a process manager, not as the current source of truth.

---

## 4. Entity and Table Candidates

### Candidate tables

| Candidate | Purpose | Classification |
|---|---|---|
| `partner_acquisition_leads` | intake/source capture | `NEW RUNTIME` |
| `partner_acquisition_prospects` | lifecycle aggregate | `NEW RUNTIME` |
| `partner_acquisition_command_inbox` | idempotency / dedupe | `NEW RUNTIME` |
| `partner_acquisition_events` | append-only domain event log | `NEW RUNTIME` |
| `partner_acquisition_outbox` | reliable async dispatch | `NEW RUNTIME` |
| `partner_acquisition_conversion_decisions` | approval trail | `ADAPT` / optional |

### Candidate fields on `partner_acquisition_leads`

- `id`
- `tenantId`
- `leadCode`
- `fullName`
- `email`
- `phone`
- `companyName`
- `document`
- `channel`
- `sourceName`
- `sourceReference`
- `campaignId`
- `hubContextId`
- `ownerUserId`
- `status`
- `score`
- `version`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Candidate fields on `partner_acquisition_prospects`

- `id`
- `tenantId`
- `leadId`
- `prospectCode`
- `fullName`
- `email`
- `phone`
- `companyName`
- `document`
- `channel`
- `sourceName`
- `sourceReference`
- `campaignId`
- `hubContextId`
- `sdrAgentId`
- `status`
- `pipelineId`
- `stageId`
- `pipelineCode`
- `stageCode`
- `score`
- `qualificationReason`
- `assignedUserId`
- `nextActionAt`
- `signedAt`
- `convertedAt`
- `partnerId`
- `version`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Candidate fields on `partner_acquisition_events`

- `eventId`
- `tenantId`
- `aggregateId`
- `aggregateType`
- `eventType`
- `actorUserId`
- `requestId`
- `correlationId`
- `idempotencyKey`
- `occurredAt`
- `payload`
- `metadata`
- `version`

### Candidate fields on `partner_acquisition_command_inbox`

- `commandId`
- `tenantId`
- `commandType`
- `aggregateId`
- `aggregateType`
- `actorUserId`
- `requestId`
- `correlationId`
- `idempotencyKey`
- `payloadHash`
- `receivedAt`
- `processedAt`
- `status`

### Candidate fields on `partner_acquisition_outbox`

- `messageId`
- `tenantId`
- `eventId`
- `aggregateId`
- `aggregateType`
- `eventType`
- `payload`
- `status`
- `availableAt`
- `publishedAt`
- `attemptCount`

---

## 5. Transaction Boundary

The transaction boundary should be:

- one command,
- one tenant,
- one aggregate mutation path,
- one atomic database transaction.

### Practical rule

Every mutating command must:

1. validate tenant scope,
2. resolve idempotency,
3. lock or version-check the target aggregate,
4. mutate the aggregate,
5. persist the domain event,
6. persist outbox entries,
7. persist audit metadata,
8. commit atomically.

### Conversion transaction

Conversion from `PartnerProspect` to official `Partner` must be handled as a single transaction from the acquisition side.

The transaction must not:

- create duplicate prospects,
- create duplicate partners,
- rely on asynchronous completion to become correct.

Asynchronous work may happen after commit through outbox, but the conversion decision itself must be transactionally final.

---

## 6. Idempotency Strategy

### Decision

Idempotency must be persisted explicitly.

### Recommended storage

Use a dedicated command inbox / deduplication table keyed by:

- `tenantId`
- `idempotencyKey`

### Required behavior

- every mutating command must carry `idempotencyKey`,
- the first successful command write wins,
- replays must return the same logical outcome,
- duplicate submissions must not create a second lead, prospect or conversion.

### Extra safeguard

The aggregate table should also have business uniqueness rules such as:

- unique prospect identity per tenant,
- unique conversion per prospect,
- unique source reference where relevant.

The inbox table protects request replay.
The aggregate constraints protect business duplication.

---

## 7. Optimistic Locking

### Decision

Yes, optimistic locking is required.

### Why

- prospect qualification and conversion may be updated concurrently,
- signature and approval actions can race,
- idempotency alone is not enough to protect state transitions,
- versioning is needed to keep lifecycle transitions deterministic.

### Candidate implementation

- `version` integer column on lead and prospect aggregates,
- update with compare-and-swap semantics,
- version increment on each accepted state mutation,
- event records carry the resulting aggregate version.

---

## 8. Event Log Decision

### Decision

Yes, there should be an append-only domain event log.

### Scope

This event log is for:

- auditability,
- traceability,
- replay support,
- debugging,
- eventual integration publication.

### Not chosen

- full event sourcing as the primary write model is **not required** now.

### Meaning

The system remains state-table driven, but every mutation also writes an immutable domain event.

That gives the domain:

- historical traceability,
- deterministic replay support if needed later,
- alignment with enterprise audit expectations.

---

## 9. Outbox Decision

### Decision

Yes, an outbox pattern should exist.

### Why

- automations and integrations are effects, not source of truth,
- side effects must not be lost if the process crashes after commit,
- future handlers may notify, sync, or fan out events reliably.

### Outbox role

The outbox should publish:

- partner acquisition domain events,
- audit side effects,
- downstream notifications,
- future adapters for hub/automation/integration.

### Important limit

Outbox is a delivery mechanism, not a domain owner.

---

## 10. Conversion Strategy

### Decision

Conversion must be modeled as **command + event + persisted final state**.

### Conversion flow

1. qualification completes,
2. contract/signature condition is satisfied,
3. conversion approval is recorded,
4. `ConvertPartnerProspectToPartnerCommand` executes,
5. prospect is marked converted,
6. official partner is created or linked,
7. conversion event is appended,
8. outbox publishes side effects.

### Synchronous or async?

- The authoritative conversion decision must be synchronous and transactional.
- Post-commit side effects may be asynchronous.
- A future saga/process manager may orchestrate multi-step downstream work, but it is not required to authorize Prisma readiness.

### Double-conversion prevention

- unique conversion state,
- optimistic locking,
- one conversion command per prospect state path,
- idempotency key dedupe,
- optional conversion decision record,
- database constraint preventing duplicate official conversion for the same prospect.

---

## 11. Tenant Strategy

### Decision

Tenant scope must be explicit in every persisted record and every supporting table.

### Rules

- every table carries `tenantId`,
- every query is tenant-filtered,
- every unique rule is tenant-aware unless explicitly global,
- every command and event carries tenant identity,
- no cross-tenant conversion or dedupe is allowed.

### Constraint pattern

Use composite constraints such as:

- `tenantId + leadCode`
- `tenantId + prospectCode`
- `tenantId + idempotencyKey`
- `tenantId + sourceReference`

---

## 12. Audit Strategy

### Decision

Auditability should be preserved at both the domain event layer and the operational metadata layer.

### Audit layers

1. immutable domain event log,
2. command inbox metadata,
3. aggregate timestamps and versioning,
4. future integration into the central audit log system.

### Required metadata

- `tenantId`
- `actorUserId`
- `requestId`
- `correlationId`
- `idempotencyKey`
- `source`
- `pipelineCode`
- `stageCode`
- `campaignId`
- `sdrAgentId`
- `automationCode`

### Result

Every material state transition becomes explainable and tenant-traceable.

---

## 13. Pipeline Reference Strategy

### Decision

Pipeline may be persisted only as a **reference substrate**, never as owner.

### Candidate reference fields

- `pipelineId`
- `stageId`
- `pipelineCode`
- `stageCode`

### Rules

- references are optional,
- they do not define domain identity,
- they do not make pipeline the aggregate owner,
- they may be stored as navigation/history hints,
- they may be validated against tenant-scoped pipeline data if the runtime later chooses to.

### Recommended interpretation

- `pipelineCode` and `stageCode` are the safest canonical reference snapshot fields.
- `pipelineId` and `stageId` may be used if the runtime later needs relational validation.
- none of them may become the source of truth for partner acquisition ownership.

---

## 14. Legacy Separation Strategy

### Opportunity

`Opportunity` must remain completely separate.

Rules:

- no `opportunityId` on acquisition tables,
- no `Opportunity` as aggregate type,
- no conversion path through `Opportunity`,
- no use of `Opportunity` as prospect proxy.

### Partner

Official `Partner` remains separate.

Rules:

- `Partner` appears only as a conversion target/reference,
- `Partner` is not the acquisition aggregate,
- `Partner` is not the intake record.

### Legacy Youware

Legacy Youware is only historical evidence.

Rules:

- no runtime dependency,
- no duplication of truth,
- no schema inheritance from legacy naming,
- no UI or config labels as source of persistence truth.

---

## 15. Origin Modeling

The prospect origin must be persisted explicitly.

### Allowed origin sources

- social
- mailing
- base
- indication
- campaign
- SDR IA
- manual

### Recommended persistence shape

- normalized source enum,
- source label,
- source reference,
- campaign reference,
- hub context reference,
- agent reference where relevant.

### Why

This preserves traceability for:

- acquisition analytics,
- compliance,
- audit,
- funnel attribution,
- future automation.

---

## 16. Automation Strategy

### Decision

Automations must be handled as future effect handlers only.

### Rules

- automations never own the truth,
- automations never create the canonical record by themselves,
- automations consume events or outbox messages,
- automations may enrich, notify or fan out side effects.

### Persistence implication

No automation runtime table should be the primary source of acquisition truth.

---

## 17. FINQZ HUB / SDR IA Strategy

### Decision

`FINQZ HUB / SDR IA` is a feeder/source surface.

### Rules

- it may appear in source/reference metadata,
- it may provide lead enrichment or qualification input,
- it must not own `PartnerLead`,
- it must not own `PartnerProspect`,
- it must not own the conversion to `Partner`.

### Persistence implication

Store SDR/Hub context only as attribution and trace metadata.

---

## 18. Constraints and Index Candidates

### Lead table constraints

- unique `(tenantId, leadCode)`
- unique `(tenantId, sourceReference)` when present and stable
- index `(tenantId, channel)`
- index `(tenantId, status)`
- index `(tenantId, ownerUserId)`
- index `(tenantId, deletedAt)`

### Prospect table constraints

- unique `(tenantId, prospectCode)`
- unique `(tenantId, leadId)` if one lead creates one prospect
- unique `(tenantId, partnerId)` when converted
- unique `(tenantId, sourceReference)` when present and stable
- index `(tenantId, status)`
- index `(tenantId, pipelineCode)`
- index `(tenantId, stageCode)`
- index `(tenantId, assignedUserId)`
- index `(tenantId, signedAt)`
- index `(tenantId, convertedAt)`
- index `(tenantId, deletedAt)`

### Command inbox constraints

- unique `(tenantId, idempotencyKey)`
- index `(tenantId, commandType)`
- index `(tenantId, aggregateId)`

### Event log constraints

- unique `(tenantId, eventId)`
- unique `(tenantId, aggregateId, version)` if versioned event writes are adopted
- index `(tenantId, aggregateType)`
- index `(tenantId, eventType)`
- index `(tenantId, occurredAt)`

### Outbox constraints

- unique `(tenantId, messageId)`
- unique `(tenantId, eventId)` if one outbox entry per event is used
- index `(tenantId, status)`
- index `(tenantId, availableAt)`

---

## 19. Prisma Readiness Checklist

### Ready

- domain boundaries are explicit,
- aggregate decision is explicit,
- event and command contracts exist,
- idempotency requirement is explicit,
- tenant scope requirement is explicit,
- audit requirement is explicit,
- pipeline references are bounded,
- `Opportunity` is excluded,
- official `Partner` remains separate.

### Still required before Prisma

- final naming of tables and columns,
- exact uniqueness model for prospect creation,
- exact conversion row strategy,
- whether conversion decision gets its own table or remains event-only,
- whether `pipelineId`/`stageId` are validated by FK or by snapshot logic,
- whether outbox and event log are one table or two tables.

### Recommendation

The architecture is ready for a Prisma design wave, but not for direct schema edits yet.

---

## 20. Risk Matrix

| Risk | Severity | Comment |
|---|---|---|
| Opportunity becomes a proxy for acquisition | High | Explicitly blocked by architecture. |
| Duplicate prospect conversion | High | Requires versioning + idempotency + unique constraints. |
| Tenant leakage | High | Must be enforced at every table and command. |
| Legacy Youware reintroduced as truth | High | Must remain quarantined. |
| Pipeline becomes owner | High | Not allowed. |
| SDR/Hub becomes owner | Medium-High | Not allowed; feeder only. |
| Missing outbox | Medium | Would weaken reliability, but can be added in Prisma wave. |
| Event log without command inbox | Medium | Idempotency would be weaker. |
| Over-coupled FK to pipeline | Medium | Could turn substrate into ownership if mishandled. |

---

## 21. Answers to the Central Questions

1. **Aggregate Root**  
   `PartnerProspect` is the primary aggregate root. `PartnerLead` is a separate intake aggregate/entity.

2. **Lead and Prospect Shape**  
   They are separate entities and separate tables, not one shared table.

3. **Transaction Boundary**  
   One tenant-scoped command against one aggregate mutation path, committed atomically with event/outbox persistence.

4. **Conversion to Partner**  
   Synchronous and transactional for the authoritative decision, with async side effects via outbox. A future saga is optional, not required.

5. **Double Conversion**  
   Prevent with idempotency, optimistic locking, unique conversion constraints and a persisted conversion decision trail.

6. **Idempotency Persistence**  
   Dedicated command inbox / dedupe table keyed by tenant + idempotencyKey.

7. **Versioning / Optimistic Locking**  
   Yes, required.

8. **Event Log**  
   Yes, append-only domain event log. Not full event sourcing.

9. **Outbox Pattern**  
   Yes.

10. **Future Tables**  
   `partner_acquisition_leads`, `partner_acquisition_prospects`, `partner_acquisition_command_inbox`, `partner_acquisition_events`, `partner_acquisition_outbox`, optional conversion decisions table.

11. **Future Constraints / Indexes**  
   Tenant-aware unique keys, tenant indexes, status indexes, reference indexes, versioning constraints, dedupe constraints.

12. **Tenant Scope**  
   `tenantId` on every table and every write path.

13. **Auditability**  
   Immutable events plus command metadata plus aggregate versioning.

14. **requestId / correlationId / idempotencyKey**  
   Persist in inbox and event records, propagate through outbox.

15. **Definitive Separation**  
   `Opportunity` remains commercial deal, `PartnerProspect` remains acquisition lifecycle, `Partner` remains official partner identity, `Pipeline` remains substrate, legacy Youware remains historical risk.

16. **Origin Sources**  
   Persist source/channel/reference metadata explicitly.

17. **Pipeline References**  
   Use `pipelineId`, `stageId`, `pipelineCode`, `stageCode` only as reference substrate fields.

18. **Automations**  
   Future effect handlers only.

19. **FINQZ HUB / SDR IA**  
   Feeder/source only, never owner.

20. **Blocks for Prisma**  
   Final table naming, FK decisions for pipeline, and whether conversion decision is separate table or event-only.

21. **Authorizes Prisma Readiness**  
   Yes. The model is defined enough to proceed to schema design.

---

## 22. Recommendation for H16G

H16G should be **Prisma readiness and schema design**, not runtime.

### Recommended H16G scope

- finalize table naming,
- finalize unique constraints,
- decide FK vs snapshot references for pipeline,
- decide event log vs outbox table split,
- decide conversion decision storage,
- produce Prisma schema proposal only,
- keep runtime untouched.

### Not allowed in H16G

- runtime handlers,
- repositories,
- services,
- controllers,
- routes,
- frontend,
- menu,
- automations runtime,
- `Opportunity` runtime,
- `Partner` runtime,
- `Pipeline` runtime.

---

## 23. Conclusion

The persistence architecture is now clear enough to proceed to Prisma readiness.

The important boundary is preserved:

- `PartnerLead` and `PartnerProspect` are canonical acquisition data,
- `Opportunity` stays commercial,
- official `Partner` stays downstream,
- `Pipeline` stays substrate,
- legacy Youware stays historical only,
- auditability and idempotency are mandatory from the start.
