# ARCH-069 - Partner Acquisition Official Contract Closure

Status: APPROVED
Type: Domain Contract
Scope: Partner Acquisition / Partner Prospect / Partner / CRM / Pipeline / FINQZ HUB
Date: 2026-06-25

---

## 1. Executive Verdict

**GO WITH RESTRICTIONS**

This document closes the official domain contract for `Partner Acquisition` and `Partner Prospect`.
It authorizes pure contracts and contract tests only.

For implemented runtime HTTP and RBAC details, ARCH-073 is the canonical surface reference.

It does **not** authorize:

- runtime changes,
- schema changes,
- route changes,
- API changes,
- menu changes,
- automation runtime changes,
- reuse of `Opportunity` as a partner-prospect substitute,
- legacy behavior as source of truth.

The official runtime boundary remains:

- `Pipeline Clientes` produces `Opportunity`.
- `Partner Acquisition` produces `Partner Prospect`.
- `Partner Prospect` converts to official `Partner` only after approved contract/signature conversion.
- `FINQZ HUB / SDR IA` may feed acquisition, but does not own the domain.

---

## 2. Official Contract Summary

This contract defines the canonical enterprise model for the acquisition of future partners.

It introduces two explicit contracts:

1. `Partner Lead`
2. `Partner Prospect`

It also defines:

- lifecycle states,
- transition rules,
- official events,
- conversion invariants,
- RBAC expectations,
- audit expectations,
- idempotency and correlation expectations,
- legacy reuse limits,
- H16D scope boundaries.

---

## 3. Partner Lead Contract

`Partner Lead` is the canonical intake record for a potential partner opportunity source.

It represents the first structured acquisition artifact after ingestion from:

- redes sociais,
- mailing,
- bases,
- indicações,
- campanhas,
- SDR IA,
- landing pages,
- manual intake,
- partner referrals.

`Partner Lead` is **not**:

- an `Opportunity`,
- an official `Partner`,
- a pipeline owner,
- a user identity,
- a contract execution record.

### Responsibilities

- capture source and attribution,
- capture minimal contact identity,
- keep the acquisition channel traceable,
- prepare qualification into `Partner Prospect`.

### Contract classification

| Artifact | Owner | Classification |
|---|---|---|
| Partner Lead | Partner Acquisition | `NEW CONTRACT` |
| Raw acquisition signals | Hub / feeder systems | `ADAPT` |

---

## 4. Partner Prospect Contract

`Partner Prospect` is the pre-official acquisition entity for a future official `Partner`.

It is the stateful record that can move through:

- qualification,
- negotiation,
- documentation,
- contract preparation,
- signature,
- conversion approval,
- official partner creation.

`Partner Prospect` is **not**:

- a `Customer`,
- an `Opportunity`,
- an official `Partner`,
- a pipeline stage,
- a Hub artifact.

### Responsibilities

- preserve commercial history for partner acquisition,
- maintain deterministic lifecycle state,
- bind to a lead and tenant,
- support audit-ready state transitions,
- gate conversion to official `Partner`.

### Contract classification

| Artifact | Owner | Classification |
|---|---|---|
| Partner Prospect | Partner Acquisition | `NEW CONTRACT` |

---

## 5. Lifecycle Definition

The official lifecycle of `Partner Prospect` is:

```text
NEW
→ ENRICHED
→ CONTACTED
→ QUALIFIED
→ NEGOTIATING
→ DOCUMENTATION
→ CONTRACT_PENDING
→ AWAITING_SIGNATURE
→ SIGNED
→ CONVERSION_PENDING
→ CONVERTED
```

### Terminal / exceptional states

- `LOST`
- `ARCHIVED`
- `REJECTED`

### Lifecycle meaning

- `NEW`: lead ingested, not yet qualified.
- `ENRICHED`: data enrichment completed.
- `CONTACTED`: initial contact made.
- `QUALIFIED`: commercial fit confirmed.
- `NEGOTIATING`: commercial negotiation in progress.
- `DOCUMENTATION`: documents requested/reviewed.
- `CONTRACT_PENDING`: contract draft ready or in review.
- `AWAITING_SIGNATURE`: waiting for signature completion.
- `SIGNED`: signed and eligible for conversion review.
- `CONVERSION_PENDING`: conversion queued for approval/creation.
- `CONVERTED`: official partner created.
- `LOST`: acquisition failed or abandoned.
- `ARCHIVED`: closed and retained for audit.
- `REJECTED`: explicit negative outcome due to compliance/commercial rejection.

---

## 6. Allowed States

The approved `Partner Prospect` states are:

- `NEW`
- `ENRICHED`
- `CONTACTED`
- `QUALIFIED`
- `NEGOTIATING`
- `DOCUMENTATION`
- `CONTRACT_PENDING`
- `AWAITING_SIGNATURE`
- `SIGNED`
- `CONVERSION_PENDING`
- `CONVERTED`
- `LOST`
- `ARCHIVED`
- `REJECTED`

No other canonical lifecycle state is allowed without a later ADR.

---

## 7. Official Events

The official domain events are:

- `partner_acquisition.lead_registered`
- `partner_acquisition.lead_enriched`
- `partner_acquisition.prospect_created`
- `partner_acquisition.prospect_contacted`
- `partner_acquisition.prospect_qualified`
- `partner_acquisition.prospect_moved`
- `partner_acquisition.contract_requested`
- `partner_acquisition.contract_generated`
- `partner_acquisition.contract_sent`
- `partner_acquisition.contract_signed`
- `partner_acquisition.conversion_requested`
- `partner_acquisition.conversion_approved`
- `partner_acquisition.partner_created`
- `partner_acquisition.prospect_lost`
- `partner_acquisition.prospect_archived`

### Event rules

- events are append-only,
- every event is tenant-scoped,
- every event must be auditable,
- every event must be idempotent,
- every event must carry correlation metadata.

---

## 8. Transition Rules

The approved transition rules are:

- `NEW` may move to `ENRICHED`, `CONTACTED`, `QUALIFIED`, `LOST`, or `ARCHIVED`.
- `ENRICHED` may move to `CONTACTED`, `QUALIFIED`, `LOST`, or `ARCHIVED`.
- `CONTACTED` may move to `QUALIFIED`, `NEGOTIATING`, `LOST`, or `ARCHIVED`.
- `QUALIFIED` may move to `NEGOTIATING`, `DOCUMENTATION`, `LOST`, or `ARCHIVED`.
- `NEGOTIATING` may move to `DOCUMENTATION`, `CONTRACT_PENDING`, `LOST`, or `ARCHIVED`.
- `DOCUMENTATION` may move to `CONTRACT_PENDING`, `AWAITING_SIGNATURE`, `LOST`, or `ARCHIVED`.
- `CONTRACT_PENDING` may move to `AWAITING_SIGNATURE`, `SIGNED`, `LOST`, or `ARCHIVED`.
- `AWAITING_SIGNATURE` may move to `SIGNED`, `LOST`, or `ARCHIVED`.
- `SIGNED` may move to `CONVERSION_PENDING`, `LOST`, or `ARCHIVED`.
- `CONVERSION_PENDING` may move to `CONVERTED`, `REJECTED`, or `ARCHIVED`.
- `LOST` may only move to `CONTACTED`, `QUALIFIED`, or `ARCHIVED` if explicitly reopened.
- `ARCHIVED` is terminal.
- `REJECTED` is terminal unless a later ADR defines rework.
- `CONVERTED` is terminal.

### Forbidden transitions

- `NEW` directly to `CONVERTED`
- `NEW` directly to official `Partner`
- any `Partner Prospect` transition into `Opportunity`
- any `Opportunity` transition into `Partner Prospect`
- duplicate conversion of the same prospect

---

## 9. Conversion Rule

Conversion from `Partner Prospect` to official `Partner` requires all of the following:

1. tenant consistency,
2. unique prospect identity,
3. a signed or explicitly won contract decision,
4. conversion approval,
5. audit event emission,
6. idempotent conversion key,
7. no existing official `Partner` collision under the same canonical identity rule.

### Conversion invariant

- A prospect cannot become official Partner without contract/signature approval.
- A prospect cannot be converted twice.
- An official Partner must be the single canonical owner of partner identity after conversion.

---

## 10. Boundaries

### Opportunity

`Opportunity` remains the deal/case entity for client commercial flows.

It must not be used as:

- partner lead,
- partner prospect,
- partner acquisition owner,
- partner conversion ledger.

### Pipeline

Pipeline may be reused as technical workflow infrastructure only.

It must not be used as:

- identity owner,
- source of truth,
- canonical partner-acquisition entity store.

### Partner

`Partner` is the official entity of the Partners domain only.

It is created only after successful conversion from `Partner Prospect`.

### FINQZ HUB / SDR IA

`FINQZ HUB / SDR IA` may:

- ingest signals,
- enrich leads,
- prioritize prospects,
- assist qualification.

It may **not**:

- own `Partner`,
- bypass conversion approval,
- replace acquisition contracts.

### Automations

Automations may:

- react to events,
- create side effects,
- notify users,
- update supporting records.

Automations may **not**:

- define truth,
- become the owner of `Partner Prospect`,
- bypass idempotency,
- create duplicate sources.

---

## 11. RBAC Expected

The expected RBAC surface is:

- `partner_acquisition:read`
- `partner_acquisition:create`
- `partner_acquisition:update`
- `partner_acquisition:qualify`
- `partner_acquisition:convert`
- `partner_acquisition:approve`
- `partner_acquisition:audit`
- `partner_prospect:read`
- `partner_prospect:create`
- `partner_prospect:update`
- `partner_prospect:transition`
- `partner_prospect:convert`

### RBAC rules

- pipeline read access does not imply acquisition access,
- SDR IA access does not imply Partner ownership,
- conversion requires an explicit permission,
- audit-only access must be separable from write access.

### Runtime RBAC note

ARCH-069 remains the historical domain closure for acquisition semantics.

When resolving the implemented Prospect Runtime permissions, route inventory, and HTTP surface behavior, defer to ARCH-073 as the canonical source.

---

## 12. Audit Expectations

The domain must emit audit data for:

- lead ingestion,
- prospect creation,
- stage transitions,
- contract generation,
- contract signature,
- conversion approval,
- Partner creation,
- lost/rejected/archived closures.

### Audit payload expectations

- `tenantId`
- `actorUserId`
- `correlationId`
- `requestId`
- `idempotencyKey`
- `eventType`
- `fromState`
- `toState`
- `sourceChannel`
- `sourceRef`
- `metadata`

---

## 13. Idempotency and Correlation

The official contract requires:

- `tenantId` on every command and event,
- `correlationId` on every request path,
- `requestId` when available,
- `idempotencyKey` on conversion and signature operations,
- stable replay handling for duplicate events.

### Invariants

- Same command payload plus same idempotency key must not create duplicate prospects or partners.
- Conversion events must be replay-safe.
- Correlation metadata must survive adapter layers.

---

## 14. Enterprise Invariants

The following invariants are mandatory:

- tenant isolation is absolute,
- `Partner Lead` and `Partner Prospect` are distinct concepts,
- `Partner Prospect` is not `Opportunity`,
- `Opportunity` is not `Partner Prospect`,
- official `Partner` only exists after conversion approval,
- no duplicate canonical source of truth,
- no runtime dependence on legacy UI state,
- no business ownership in automation glue,
- audit trail is mandatory,
- adapter reuse is allowed, duplicate domain ownership is not.

---

## 15. What Can Be Reused From Legacy

### Reuse

- pipeline engine as workflow substrate,
- hub surfaces as feeder surfaces,
- SDR IA as signal source,
- existing partner identity runtime after conversion,
- existing tenant/auth/RBAC foundation,
- audit infrastructure,
- transition-related automation ideas.

### Quarantine

- `parceiros_comerciais`,
- `automacaoPosAssinatura`,
- `configAutomacoes`,
- local storage-driven partner flows,
- legacy UI labels that imply ownership but not contract.

### Remove later

- any legacy surface that remains the implicit owner of partner acquisition,
- any pipeline naming that is treated as canonical acquisition truth,
- any adapter that duplicates canonical domain state.

---

## 16. Future Wave H16D

### Allowed scope

- implement TypeScript-only contracts for `Partner Lead` and `Partner Prospect`,
- add pure contract tests,
- add domain event contracts,
- add lifecycle transition tests,
- add ADR references or architecture notes if needed.

### Forbidden scope

- schema changes,
- runtime backend changes,
- runtime frontend changes,
- routes,
- controllers,
- services,
- repositories,
- automations runtime,
- menu changes,
- store/localStorage usage,
- `Opportunity` runtime changes,
- `Partner` runtime changes,
- `Pipeline` runtime changes.

---

## 17. Acceptance Criteria

This contract is approved when:

- `Partner Acquisition` is explicitly separate from `Opportunity`,
- `Partner Prospect` is explicitly defined,
- lifecycle states and transitions are unambiguous,
- conversion to `Partner` is deterministic and auditable,
- RBAC expectations are clear,
- idempotency requirements are explicit,
- legacy artifacts are classified,
- H16D can proceed without runtime ambiguity.

---

## 18. Classification Matrix

| Artifact | Classification |
|---|---|
| Partner Lead | `NEW CONTRACT` |
| Partner Prospect | `NEW CONTRACT` |
| Partner Acquisition lifecycle | `NEW CONTRACT` |
| Pipeline engine | `REUSE` |
| FINQZ HUB / SDR IA | `KEEP` |
| Automations | `QUARANTINE` |
| Opportunity | `KEEP` |
| Partner | `KEEP` |
| Legacy acquisition naming | `REMOVE LATER` |

---

## 19. Conclusion

The enterprise contract is now closed for the domain boundary.

The next phase is not runtime implementation.

The next phase is:

- contract-only code,
- contract-only tests,
- no schema migration,
- no route exposure,
- no menu exposure,
- no legacy source of truth.
