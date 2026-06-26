# H19B.1 - Partner Contract Architecture

Status: APPROVED WITH RESTRICTIONS

## Executive Decision

**GO WITH RESTRICTIONS**

The official Prospect -> Partner contract is:

1. `convertProspect` must materialize a persisted, official `Partner` in the canonical Partner domain.
2. `Partner` remains the single source of truth for the official partner runtime.
3. `PartnerAcquisitionProspect` remains the single source of truth for acquisition state and conversion lifecycle.
4. The conversion flow must be atomic, tenant-scoped, idempotent, and replay-safe.
5. The frontend must not create partners directly, must not duplicate business rules, and must only orchestrate the official backend contract.

This decision aligns the acquisition runtime with the Partner domain while preserving the current architecture principles:

- Backend First
- Tenant Scoped
- RBAC Driven
- Auditavel
- Provider Driven
- Event Ready
- Single Source of Truth
- No Legacy
- No Duplicate Sources
- No Parallel APIs
- Contracts Before Runtime
- Architecture Before Implementation

## Official Fluxo Prospect -> Partner

### Canonical flow

1. Prospect is qualified through the Prospect workflow.
2. Prospect reaches the conversion-ready state.
3. `convertProspect` is called with the official conversion command.
4. Backend validates tenant scope, version, RBAC, and idempotency.
5. Backend materializes the official `Partner` record in the Partner domain.
6. Backend links the created or resolved Partner to the Prospect.
7. Backend records the conversion decision and emits audit/outbox events.
8. Frontend refetches `getProspectById()` and, if needed, the partner runtime later refetches `getPartnerById()` or list data.

### Decision rule

- `convertProspect` is not a UI-only transition.
- `convertProspect` is the official materialization command for Partner creation from an approved Prospect.
- If a Partner already exists for the same conversion target, the backend must resolve the existing Partner and link it, instead of creating a duplicate.

## Contract HTTP Final

### Official orchestration endpoint

`POST /api/v1/partner-acquisition/prospects/:prospectId/convert`

### Official partner runtime endpoint surface

`/api/v1/partners`

### Contract ownership

- `POST /api/v1/partner-acquisition/prospects/:prospectId/convert`
  - Orchestrates conversion from Prospect to Partner.
  - Owns conversion validation, idempotency, tenant scope, audit trail, and linkage.
  - Owns Partner materialization decision.

- `/api/v1/partners`
  - Owns official Partner runtime CRUD/read operations.
  - Owns the canonical Partner source of truth after creation.

### Scope decision

The contract is **not** "either /api/v1/partners or convert endpoint".
It is **both**, with distinct responsibilities:

- conversion orchestration via Prospect runtime
- official Partner lifecycle via Partner runtime

## Payloads

### Convert request

The conversion request must remain minimal and official. The authoritative inputs are:

- `expectedVersion`
- idempotency key
- any backend-approved conversion metadata already defined by the contract

The frontend must not invent partner identity, partner code, or partner persistence fields.

### Convert response

The canonical response should expose enough state for deterministic refresh:

- `prospect`
- `partner` when materialized or resolved
- `conversionDecision`
- metadata needed for audit and replay-safe UX

### Partner materialization payload

The backend conversion command may derive partner fields from:

- Prospect identity and commercial profile
- tenant context
- backend-owned partner code generation
- backend-owned lifecycle defaults

The frontend must not send runtime-only partner creation payloads unless the contract explicitly requires them.

## Regras de Negocio

### 1. Single source of truth

- `Partner` is the SSOT for official partner data.
- `PartnerAcquisitionProspect` is the SSOT for acquisition lifecycle.
- `PartnerAcquisitionConversionDecision` is the SSOT for conversion decision history.

### 2. Partner materialization

- Conversion must create or resolve one persisted official Partner.
- The same conversion must never create duplicates.
- If the target partner already exists, the backend must link to the existing Partner and keep the operation idempotent.

### 3. Tenant scope

- Prospect tenant and Partner tenant must match.
- Cross-tenant conversion is forbidden.
- All reads and writes must be scoped by the authenticated tenant context.

### 4. Idempotency

- Convert must accept an idempotency key.
- Replays with the same key must return the same effective outcome.
- The command inbox must prevent duplicate materialization.

### 5. Replay handling

- Replayed requests must not create a second Partner.
- Replayed requests must not overwrite a valid existing Partner link.
- Replayed requests must return the persisted conversion outcome.

### 6. Existing partnerId handling

- If the Prospect already has a valid `partnerId`, conversion must resolve that relationship.
- If the `partnerId` points to a deleted, invalid, or tenant-mismatched record, the backend must reject the request.
- If the `partnerId` already points to the canonical Partner for the conversion, the call should be treated as idempotent.

### 7. Auditability

- Every conversion must be auditable.
- The backend must persist conversion decision state and emit events/outbox entries as defined by the acquisition architecture.

### 8. No duplicate sources

- The frontend must not maintain local partner state as truth.
- The legacy `Parceiros` UI must not become a parallel contract source for conversion.

## RBAC Matrix

### Canonical RBAC source

For Prospect Runtime, the canonical RBAC source is the acquisition HTTP surface architecture and the acquisition permission catalog aligned with it.

### Permission matrix

| Endpoint / Action | Official permission | Notes |
| --- | --- | --- |
| `GET /api/v1/partner-acquisition/prospects` | `partner_prospect:read` | Read-only list |
| `GET /api/v1/partner-acquisition/prospects/:id` | `partner_prospect:read` | Read-only detail |
| `POST /api/v1/partner-acquisition/prospects/:id/transition` | `partner_prospect:transition` | Lifecycle transitions |
| `POST /api/v1/partner-acquisition/prospects/:id/convert` | `partner_prospect:convert` | Partner materialization orchestration |
| `POST /api/v1/partner-acquisition/prospects/:id/approve` | `partner_acquisition:approve` | Final approval path |
| `POST /api/v1/partner-acquisition/prospects/:id/reject` | `partner_acquisition:approve` | Same approval authority family |
| `GET /api/v1/partners` | `partner:read` | Official Partner runtime |
| `GET /api/v1/partners/:id` | `partner:read` | Official Partner runtime |
| `POST /api/v1/partners` | `partner:create` | Direct Partner maintenance only |
| `PATCH /api/v1/partners/:id` | `partner:update` | Direct Partner maintenance only |
| `DELETE /api/v1/partners/:id` | `partner:delete` | Direct Partner maintenance only |

### Roles that should receive permissions

Initial rollout should cover:

- `super-admin`
- `ROLE_ADMIN_SISTEMA`
- `ROLE_CEO`
- commercial or operations roles explicitly approved for acquisition conversion

The exact grant set must be materialized through the official RBAC catalog and not via ad hoc runtime seeding logic.

## Frontend legacy prohibitions

The legacy `Parceiros` frontend is prohibited from acting as:

- a partner creation source of truth
- a conversion orchestration source
- a duplicate API surface for partner materialization
- a place to embed conversion business rules

The legacy screen may remain for read-only or backward-compatible navigation only if required by other flows, but it must not own the official Prospect -> Partner contract.

## H19B.2 Safe Implementation Sequence

1. Align backend convert contract to materialize official Partner records atomically.
2. Ensure the conversion response returns the canonical persisted result.
3. Add or confirm idempotency and replay behavior for convert.
4. Confirm tenant-scope validation and duplicate-prevention logic.
5. Validate RBAC grants for Prospect conversion and Partner runtime access.
6. Add backend tests covering normal conversion, duplicate replay, existing partnerId, and tenant mismatch.
7. Update frontend to call only the official convert endpoint and refetch Prospect state after success.
8. Keep legacy `Parceiros` out of the conversion path.
9. Close documentation drift after runtime and test validation.

## Arquivos permitidos para H19B.2

- `backend/src/modules/partner-acquisition/**`
- `backend/src/modules/partners/**`
- `backend/prisma/schema.prisma` only if a backend-owned persistence adjustment becomes unavoidable and explicitly approved
- `backend/tests/**`
- `src/api/modules/partner-acquisition.api.ts`
- `src/pages/PartnerAcquisitionProspectDetails.tsx`
- `src/pages/PartnerAcquisitionProspects.tsx`
- `src/routes/operacoes.routes.tsx`
- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/02-architecture/ARCH-069-partner-acquisition-official-contract-closure.md`
- `docs/02-architecture/ARCH-073-partner-acquisition-http-surface-architecture.md`

## Arquivos proibidos

- `backend/prisma/migrations/**`
- `backend/prisma/seed.ts`
- `src/pages/Parceiros.tsx`
- `src/api/modules/parceiros.api.ts`
- `src/api/dataService.ts`
- `src/store/**`
- any mock layer
- `MainLayout`
- `PageHeader`

## Plano tecnico incremental de implementacao

### Step 1

Finalize backend conversion contract for Partner materialization and return the canonical persisted result.

### Step 2

Add/verify deterministic idempotency, replay handling, and duplicate prevention for convert.

### Step 3

Confirm RBAC grants for `partner_prospect:convert` and the Partner runtime permissions used after conversion.

### Step 4

Add tests for:

- successful conversion
- replay with same idempotency key
- existing partner link
- tenant mismatch
- duplicate partner prevention

### Step 5

Update the Prospect detail frontend to call only the official convert endpoint and refetch after success.

### Step 6

Keep the legacy Partner UI out of the runtime conversion path and use it only as a separate official Partner runtime surface.

### Step 7

Close documentation drift across DCA, ARCH-069, ARCH-073, and the runtime docs once implementation is validated.

## Final note

This architecture decision intentionally preserves a strict boundary:

- Prospect conversion owns the orchestration
- Partner domain owns the official persisted partner record
- Frontend owns only the interaction, refresh, and feedback loop

