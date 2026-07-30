# ARCH-068 - Partner Acquisition Domain Architecture

Status: APPROVED WITH RESTRICTIONS
Type: Domain Architecture
Scope: CRM / Partner Acquisition / Partner / Pipeline / Opportunity / FINQZ HUB
Date: 2026-06-25

---

## 1. Executive Verdict

**GO WITH RESTRICTIONS**

This architecture approves the *domain boundaries* for Partner Acquisition and its relationship with CRM, Pipeline, Opportunity and Partner, but it does **not** authorize runtime changes, menu changes, route changes, schema changes or contract implementation.

The key decision is:

- `Pipeline Clientes` produces `Opportunity`.
- `Partner Acquisition` produces `Partner Prospect`, then converts to official `Partner` only after contract winning/signature.
- `Opportunity` must **not** be reused as a proxy for `Partner Prospect`.
- `FINQZ HUB / SDR IA` may feed acquisition signals, but it is **not** the owner of Partner.

---

## 2. Problem Statement

The current codebase already distinguishes some commercial domains, but it does not yet formalize a dedicated domain for partner acquisition.

What exists today:

- CRM documentation already defines `Customer`, `Partner`, `Opportunity` and `Pipeline` as separate concepts.
- The runtime and menu still use legacy names and legacy routing boundaries.
- The pipeline configuration includes `parceiros_comerciais` as a partner onboarding flow.
- Post-signature automation can create a partner and related records.
- SDR IA and hub flows can generate commercial activity, but they do not own partner identity.

The architectural gap is this:

- There is no canonical `Partner Acquisition` bounded context.
- There is no canonical `Partner Prospect` lifecycle in the official model.
- The current partner onboarding surface still looks like a pipeline flavor instead of a first-class domain.

This creates risk of:

- mixing `Opportunity` with partner acquisition records,
- treating legacy pipeline configuration as domain ownership,
- letting SDR or Hub logic become the de facto owner of partner identity,
- exposing menu items before the domain contract is frozen.

Relevant evidence:

- [CRM canonical ownership audit](/C:/Projects/FINQZ_PRO/docs/06-audits/AUD-G1-C-crm-canonical-ownership.md#L42)
- [Pipeline ownership transition architecture](/C:/Projects/FINQZ_PRO/docs/02-architecture/H15-G-pipeline-ownership-transition-architecture.md#L30)
- [Pipeline contracts architecture](/C:/Projects/FINQZ_PRO/docs/02-architecture/H15-I-pipeline-contracts-architecture.md#L1)
- [Partner migration wave planning](/C:/Projects/FINQZ_PRO/docs/06-audits/AUD-G2-D-partner-migration-wave-planning.md#L5)

---

## 3. Definition of Partner Acquisition

`Partner Acquisition` is the commercial acquisition and onboarding domain for future partners.

It covers:

- inbound and outbound prospecting,
- social networks,
- mailing,
- databases/bases,
- referrals,
- campaigns,
- SDR IA qualification,
- commercial negotiation,
- documentation,
- contract signature,
- conversion to official Partner.

It is a *domain of origin and conversion*, not just a UI label.

It is responsible for the partner lifecycle **before** official partner identity exists.

It may reuse pipeline infrastructure, but it does not become Pipeline itself.

---

## 4. Definition of Partner Prospect

`Partner Prospect` is the pre-official commercial identity for a future partner.

It represents:

- a qualified commercial lead for partner acquisition,
- a record that is not yet an official Partner,
- a negotiation/onboarding object with traceability,
- a stateful entity that can pass through qualification, negotiation, documentation and signature.

`Partner Prospect` is **not**:

- a Customer,
- an Opportunity,
- an official Partner,
- a Pipeline stage,
- a Hub artifact.

It is the missing business abstraction between raw acquisition signals and official Partner identity.

---

## 5. Core Domain Differences

| Domain | Meaning | Owner | Can be reused as another domain? |
|---|---|---|---|
| Customer | Official identity of a client/person/company | CRM | No |
| Opportunity | Commercial unit of work / deal / case | CRM / Commercial Operations | No |
| Partner Prospect | Pre-official partner acquisition entity | Partner Acquisition | No |
| Partner | Official commercial partner identity | Partners | No |

### Customer

Customer is the official identity of the commercial client/base entity.

It is the domain entity for the client relationship, not for partner acquisition.

### Opportunity

Opportunity is the operational commercial unit.

It is the correct output of `Pipeline Clientes`.

It must not be used to represent a partner prospect.

### Partner Prospect

Partner Prospect is the transitional acquisition record for partner onboarding.

It captures qualification, negotiation, documentation and signature readiness.

### Partner

Partner is the official domain identity after a successful partner acquisition conversion.

It is the canonical commercial partner entity of the CRM/Partners boundary.

---

## 6. Canonical Flow

The canonical Partner Acquisition flow is:

```text
Origin
→ Qualification
→ Negotiation
→ Documentation
→ Contract
→ Signature
→ Official Partner
```

Origin may include:

- redes sociais,
- bases,
- mailing,
- indicações,
- campanhas,
- SDR IA,
- inbound manual,
- partner referrals.

Conversion rule:

- before contract/signature, the record is `Partner Prospect`;
- after contract won/signed, the record is converted into official `Partner`.

If the flow is interrupted before signature, the record remains a prospect, not a Partner.

---

## 7. Ownership Matrix

| Domain | Canonical owner | Role in architecture | Classification |
|---|---|---|---|
| CRM | CRM | Owns Customers and the commercial relationship center | `KEEP` |
| Partner Acquisition | New bounded context | Owns Partner Prospect lifecycle and conversion policy | `NEEDS ADR` |
| Partners | CRM / Partners domain | Owns official Partner identity | `KEEP` |
| Pipeline | Pipeline domain | Owns stages, ordering and technical workflow infrastructure | `KEEP` |
| Opportunity | CRM / Commercial Operations | Owns commercial deals and client opportunity flows | `KEEP` |
| FINQZ HUB / SDR IA | Hub / AI support | Feeds acquisition signals and qualification | `KEEP` |
| Automations | Commercial automation support | Can trigger conversion helpers after events | `KEEP` |

### Ownership interpretation

- `CRM` owns the customer relationship.
- `Partner Acquisition` owns the pre-partner lifecycle.
- `Partners` owns the official Partner entity.
- `Pipeline` owns the mechanics, not the business identity of partner acquisition.
- `Opportunity` owns client deals only.
- `FINQZ HUB / SDR IA` is an input surface, not domain owner.
- `Automations` are effectors, not sources of truth.

---

## 8. Entities Produced Matrix

| Flow | Produced entity | Rule |
|---|---|---|
| Pipeline Clientes -> Opportunity | `Opportunity` | `KEEP` |
| Partner Acquisition -> Partner Prospect -> Partner | `Partner Prospect` then `Partner` | `KEEP` |

### Explicit non-goals

- `Pipeline Clientes` must not produce `Partner`.
- `Partner Acquisition` must not produce `Opportunity` as its canonical output.
- `Opportunity` must not stand in for `Partner Prospect`.

---

## 9. Decision on Reusing the Current Pipeline

The current pipeline domain may be reused as **technical infrastructure** for partner acquisition, but only under strict limits.

### Allowed

- using stage ordering,
- using Kanban/reorder mechanics,
- using tenant-scoped pipeline contracts,
- using explicit pipeline identifiers for partner acquisition states,
- using read/write contracts after formal approval.

### Not allowed

- using the current pipeline as owner of Partner Prospect identity,
- deriving partner acquisition truth from product heuristics,
- letting pipeline stage labels become the canonical business entity,
- using `Opportunity` as a stand-in for partner acquisition records,
- letting frontend-local config become the source of truth.

### Architectural limit

If the pipeline is reused, it must be treated as a *workflow substrate* only.

The domain owner remains `Partner Acquisition`.

This aligns with the pipeline domain rules that prohibit implicit derivation and frontend ownership.

Relevant evidence:

- [ARCH-056 pipeline domain architecture](/C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-056-pipeline-domain-architecture.md#L1)
- [H15-I pipeline contracts architecture](/C:/Projects/FINQZ_PRO/docs/02-architecture/H15-I-pipeline-contracts-architecture.md#L1)

---

## 10. Conversion Rules to Official Partner

Conversion from `Partner Prospect` to official `Partner` requires:

1. tenant context is known,
2. prospect is uniquely identified,
3. commercial qualification is complete,
4. negotiation state is compatible,
5. documentation is complete,
6. contract is signed or explicitly marked won,
7. conversion event is auditable,
8. official Partner creation/update is persisted by the Partner domain.

### Conversion invariants

- A prospect cannot become official Partner without a contract/signature decision.
- A prospect cannot be converted twice.
- Conversion must preserve traceability to source, campaign, SDR, and acquisition channel.
- Conversion must be tenant-scoped.
- Conversion must be RBAC-protected.
- Conversion must emit an auditable domain event.

### Result of conversion

- the old state is retained for audit,
- a new official Partner identity exists,
- the acquisition record may remain as historical evidence,
- the official partner becomes the canonical downstream entity.

---

## 11. Expected RBAC

The architecture expects RBAC to be explicit, tenant-scoped and backend-enforced.

### Expected permissions

- `partner_acquisition:read`
- `partner_acquisition:create`
- `partner_acquisition:update`
- `partner_acquisition:convert`
- `partner_acquisition:archive`
- `partner:read`
- `partner:create`
- `partner:update`
- `partner:delete`
- `pipeline:read`
- `pipeline:create`
- `pipeline:update`
- `stage:create`
- `stage:update`
- `stage:delete`
- `sdr_ia:view`
- `sdr_ia:use`
- `campanhas:read`
- `campanhas:write`
- `mailing:read`

### RBAC principles

- Hub access does not imply partner ownership.
- SDR access does not imply conversion authority.
- Pipeline read access does not imply partner acquisition admin access.
- Conversion from prospect to partner should require an explicit permission.

This section defines architectural expectation only.

The exact permission names may require a contract decision later.

---

## 12. Events and Audit Expectations

Partner Acquisition must be audit-ready.

Expected events:

- partner_acquisition.created
- partner_acquisition.qualified
- partner_acquisition.negotiation_started
- partner_acquisition.documented
- partner_acquisition.contract_generated
- partner_acquisition.signed
- partner_acquisition.converted_to_partner
- partner_acquisition.archived

Expected metadata:

- tenantId
- actorUserId
- requestId
- sourceChannel
- campaignId
- sdrDecisionId
- before
- after
- reason

Expected audit traits:

- immutable,
- tenant-scoped,
- replayable,
- traceable to the acquisition source,
- safe for compliance review.

---

## 13. Future Menu Recommendation

Future CRM menu recommendation:

```text
CRM
├── Clientes
├── Pipeline Clientes
├── Parceiros
└── Aquisição de Parceiros
```

### Menu intent

- `Clientes` remains the identity/customer area.
- `Pipeline Clientes` remains the opportunity/deal flow.
- `Parceiros` remains the official partner identity area.
- `Aquisição de Parceiros` becomes the prospect/onboarding acquisition workspace.

### Menu classification

| Menu item | Classification | Note |
|---|---|---|
| Clientes | `KEEP` | Already aligned |
| Pipeline Clientes | `MIGRATE` | Rename and stabilize as explicit Opportunity workspace |
| Parceiros | `MIGRATE` | Move under CRM as official partner identity |
| Aquisição de Parceiros | `NEEDS ADR` | Requires a dedicated domain contract before runtime exposure |

---

## 14. Coexistence with Legacy

Legacy artefacts can coexist only as transitional surfaces.

| Artefact | Role | Classification |
|---|---|---|
| `parceiros_comerciais` | Legacy pipeline/onboarding substrate | `QUARANTINE` |
| `automacaoPosAssinatura` | Post-signature effect pipeline | `QUARANTINE` |
| `configAutomacoes` | Automation configuration layer | `QUARANTINE` |
| `SdrIaHub` | Acquisition signal source and assistant | `KEEP` |
| `src/pages/Parceiros.tsx` | Legacy partner runtime surface | `QUARANTINE` |
| `src/pages/Oportunidades.tsx` | Client opportunity runtime surface | `KEEP` |
| `src/config/pipelines.ts` | Legacy pipeline configuration | `QUARANTINE` |

### Coexistence rules

- Legacy pipeline names must not become canonical partner acquisition names.
- Automations may continue to exist, but they must not own partner identity.
- SDR IA may initiate or prioritize acquisition, but not own the Partner record.
- Legacy runtime must be treated as compatibility-only.

Relevant evidence:

- [Partner acquisition pipeline config](/C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L65)
- [Post-signature automation config](/C:/Projects/FINQZ_PRO/src/config/automacaoPosAssinatura.ts#L84)
- [Automation defaults](/C:/Projects/FINQZ_PRO/src/config/configAutomacoes.ts#L25)
- [SDR IA hub](/C:/Projects/FINQZ_PRO/src/pages/SdrIaHub.tsx#L394)

---

## 15. Classification Matrix

| Item | Classification | Reason |
|---|---|---|
| Customer | `KEEP` | Canonical CRM identity |
| Opportunity | `KEEP` | Canonical deal unit |
| Partner | `KEEP` | Canonical partner identity |
| Partner Prospect | `NEEDS ADR` | Needs a formal domain contract |
| Partner Acquisition | `NEEDS ADR` | New bounded context definition |
| Pipeline Clientes | `MIGRATE` | Needs explicit menu/route naming later |
| Pipeline current substrate | `KEEP` | Allowed as infrastructure only |
| `parceiros_comerciais` | `QUARANTINE` | Legacy substrate, not canonical owner |
| `automacaoPosAssinatura` | `QUARANTINE` | Transitional effect layer |
| `configAutomacoes` | `QUARANTINE` | Transitional effect configuration |
| `SdrIaHub` | `KEEP` | Valid supporting input surface |
| `src/pages/Parceiros.tsx` | `QUARANTINE` | Legacy runtime surface |
| `src/pages/Oportunidades.tsx` | `KEEP` | Client opportunity runtime surface |
| menu exposure of acquisition | `REMOVE LATER` | Wait for domain contract and owner |

---

## 16. Roadmap for Future Waves

### Wave H16B - Domain Contract

Goal:

- formalize the API/domain contract for Partner Acquisition and Partner Prospect.

Expected outputs:

- DTO contract,
- state machine,
- permission matrix,
- audit event taxonomy,
- conversion invariants.

### Wave H16C - Adapter Boundary

Goal:

- define adapter boundaries between SDR/HUB signals, legacy pipeline substrate and the new acquisition domain.

### Wave H16D - Runtime Implementation

Goal:

- implement backend runtime after contracts are approved.

### Wave H16E - Menu and Navigation

Goal:

- expose the new CRM menu only after the acquisition contract is stable.

### Wave H16F - Legacy Quarantine Reduction

Goal:

- progressively reduce `parceiros_comerciais`, `automacaoPosAssinatura` and other transitional surfaces.

---

## 17. H16B Allowed and Prohibited Scope

### Allowed in H16B

- domain contract drafting,
- state machine definition,
- permission matrix definition,
- audit event definition,
- conversion invariant specification,
- route/menu impact analysis,
- legacy dependency classification.

### Prohibited in H16B

- runtime implementation,
- backend code changes,
- frontend code changes,
- schema changes,
- migrations,
- route changes,
- menu changes,
- store/localStorage changes,
- pipeline admin changes,
- opportunity runtime changes,
- partner runtime changes.

---

## 18. Acceptance Criteria

This architecture can be considered approved when all of the following are true:

1. `Partner Acquisition` is explicitly recognized as a domain separate from `Opportunity`.
2. `Partner Prospect` is explicitly defined as the pre-official partner record.
3. `Pipeline Clientes` is reserved for `Opportunity`.
4. `Partner Acquisition` is reserved for partner prospecting and onboarding.
5. `FINQZ HUB / SDR IA` is documented as an input/support surface only.
6. `Partner` remains the canonical official partner identity.
7. The current pipeline substrate is limited to technical workflow support only.
8. Legacy partner acquisition surfaces are classified as transitional, not canonical.
9. Menu exposure is deferred until contract and ownership are approved.
10. The architecture does not introduce duplicate sources of truth.
11. Tenant scoping, RBAC and auditability are mandatory.
12. The document is consistent with the approved CRM, Opportunity and Pipeline architecture.

---

## 19. Final Position

The FINQZ PRO enterprise architecture should treat partner acquisition as its own bounded context, with a dedicated pre-official entity (`Partner Prospect`) and a deterministic conversion path to official `Partner`.

`Opportunity` stays dedicated to commercial opportunities.

`Pipeline` stays the workflow substrate.

`FINQZ HUB / SDR IA` stays a feeder and assistant.

No runtime or menu change is authorized by this document.
