# ARCH-073 - Partner Acquisition HTTP Surface Architecture

Status: APPROVED WITH RESTRICTIONS
Type: HTTP Surface Architecture / Contract Definition
Scope: Partner Acquisition / HTTP Contracts / Validation / RBAC / Swagger Readiness
Date: 2026-06-25

---

## 1. Executive Verdict

**GO WITH RESTRICTIONS**

The Partner Acquisition HTTP surface is now fully defined as a canonical contract layer and is the reference for the implemented Prospect Runtime.

This architecture approves:

- request and response DTO contracts,
- HTTP header contracts,
- validation rules,
- route inventory and RBAC mapping,
- error envelopes and status codes,
- future Swagger exposure metadata.

This architecture does **not** authorize:

- Fastify registration,
- controllers,
- routes,
- plugins,
- server bootstrap hooks,
- direct repository access from HTTP,
- direct Prisma access from HTTP,
- Opportunity coupling,
- Partner runtime coupling,
- Pipeline ownership.

The only allowed flow remains:

`HTTP -> Command Handler -> Application Service -> Repository`

The runtime implementation later aligned to this contract in H18C/H19; this document remains the canonical HTTP/RBAC reference for Prospect Runtime.

---

## 2. HTTP Surface Principles

- Backend First.
- Tenant Scoped.
- RBAC Driven.
- Auditável.
- Contracts Before Runtime.
- Architecture Before Implementation.
- Single Source of Truth.
- No Legacy.
- No Duplicate Sources.
- No Parallel APIs.
- No HTTP-to-Repository shortcut.
- No HTTP-to-Prisma shortcut.

---

## 3. Endpoint Matrix

| Method | Path | Permission | Purpose | Success |
|---|---|---:|---|---:|
| `GET` | `/partner-acquisition/leads` | `partner_acquisition:read` | list leads | `200` |
| `GET` | `/partner-acquisition/leads/:leadId` | `partner_acquisition:read` | get lead by id | `200` |
| `POST` | `/partner-acquisition/leads` | `partner_acquisition:create` | create lead | `201` |
| `GET` | `/partner-acquisition/prospects` | `partner_prospect:read` | list prospects | `200` |
| `GET` | `/partner-acquisition/prospects/:prospectId` | `partner_prospect:read` | get prospect by id | `200` |
| `POST` | `/partner-acquisition/prospects` | `partner_prospect:create` | create prospect | `201` |
| `POST` | `/partner-acquisition/prospects/:id/qualify` | `partner_prospect:transition` | qualify prospect | `200` |
| `POST` | `/partner-acquisition/prospects/:id/disqualify` | `partner_prospect:transition` | disqualify prospect | `200` |
| `POST` | `/partner-acquisition/prospects/:id/negotiation` | `partner_prospect:transition` | move to negotiation | `200` |
| `POST` | `/partner-acquisition/prospects/:id/documentation/request` | `partner_prospect:transition` | request docs | `200` |
| `POST` | `/partner-acquisition/prospects/:id/documentation/received` | `partner_prospect:transition` | mark docs received | `200` |
| `POST` | `/partner-acquisition/prospects/:id/contract/request` | `partner_prospect:transition` | request contract | `200` |
| `POST` | `/partner-acquisition/prospects/:id/contract/signed` | `partner_prospect:transition` | mark contract signed | `200` |
| `POST` | `/partner-acquisition/prospects/:id/conversion/approve` | `partner_acquisition:approve` | approve conversion | `200` |
| `POST` | `/partner-acquisition/prospects/:id/conversion/reject` | `partner_acquisition:approve` | reject conversion | `200` |
| `POST` | `/partner-acquisition/prospects/:id/convert` | `partner_prospect:convert` | convert to Partner | `200` |

### Routing decision

- Lead endpoints are acquisition-owned.
- Prospect endpoints are prospect-owned.
- Conversion approval is a controlled acquisition action.
- Final conversion remains prospect-owned and only creates the downstream Partner through the domain orchestration path.
- No endpoint exposes `Opportunity` as a target entity.

---

## 4. DTO Model

### Lead DTO

Fields:

- `tenantId`
- `leadId`
- `leadCode`
- `fullName`
- `email`
- `phone`
- `companyName`
- `document`
- `source`
- `sourceName`
- `sourceReference`
- `campaignId`
- `hubContextId`
- `ownerUserId`
- `status`
- `score`
- `createdAt`
- `updatedAt`

### Prospect DTO

Fields:

- `tenantId`
- `prospectId`
- `prospectCode`
- `leadId`
- `fullName`
- `email`
- `phone`
- `companyName`
- `document`
- `source`
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
- `createdAt`
- `updatedAt`

### Conversion Decision DTO

Fields:

- `tenantId`
- `prospectId`
- `partnerId`
- `approved`
- `decidedByUserId`
- `decidedAt`
- `reason`

### Conversion Response DTO

Fields:

- `prospect`
- `conversionDecision`

### Pagination Meta

- `page`
- `limit`
- `total`
- `totalPages`
- `sortBy`
- `sortOrder`

---

## 5. Request DTOs

### Shared headers

Required for all requests:

- `tenantId`
- `requestId`
- `correlationId`
- `actorUserId`

Required for mutating requests:

- `idempotencyKey`

### Read queries

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `search`
- lead-specific filters:
  - `status`
  - `source`
  - `ownerUserId`
- prospect-specific filters:
  - `status`
  - `source`
  - `pipelineCode`
  - `stageCode`
  - `assignedUserId`

### Mutating bodies

All mutating bodies are strict, tenant-scoped by header, and carry `expectedVersion` where lifecycle is mutable.

Required versioning on transitions:

- `qualify`
- `disqualify`
- `negotiation`
- `documentation/request`
- `documentation/received`
- `contract/request`
- `contract/signed`
- `conversion/approve`
- `conversion/reject`
- `convert`

Lead/prospect creation bodies carry source attribution, references, and domain metadata.

---

## 6. Status Codes

### Success

- `200` for reads and command transitions.
- `201` for create lead and create prospect.

### Error

- `400` validation or malformed request
- `401` missing or invalid authentication context
- `403` RBAC denial
- `404` entity not found
- `409` duplicate, idempotency conflict, or state conflict
- `422` domain transition rejected by business rules
- `500` unexpected runtime failure

### Optimistic lock

- `409` with `OPTIMISTIC_LOCK_ERROR`

### Idempotency replay

- replay should resolve to the original successful result whenever the command inbox marks the idempotency key as processed.

---

## 7. Error Model

Standard error envelope:

- `success: false`
- `error.code`
- `error.message`
- `error.details?`

Recommended error codes:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `OPTIMISTIC_LOCK_ERROR`
- `IDEMPOTENCY_CONFLICT`
- `DOMAIN_RULE_VIOLATION`
- `INTERNAL_ERROR`

---

## 8. RBAC Matrix

| Endpoint | Permission |
|---|---|
| `GET /partner-acquisition/leads` | `partner_acquisition:read` |
| `GET /partner-acquisition/leads/:leadId` | `partner_acquisition:read` |
| `POST /partner-acquisition/leads` | `partner_acquisition:create` |
| `GET /partner-acquisition/prospects` | `partner_prospect:read` |
| `GET /partner-acquisition/prospects/:prospectId` | `partner_prospect:read` |
| `POST /partner-acquisition/prospects` | `partner_prospect:create` |
| `POST /partner-acquisition/prospects/:id/qualify` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/disqualify` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/negotiation` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/documentation/request` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/documentation/received` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/contract/request` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/contract/signed` | `partner_prospect:transition` |
| `POST /partner-acquisition/prospects/:id/conversion/approve` | `partner_acquisition:approve` |
| `POST /partner-acquisition/prospects/:id/conversion/reject` | `partner_acquisition:approve` |
| `POST /partner-acquisition/prospects/:id/convert` | `partner_prospect:convert` |

### RBAC intent

- `partner_acquisition:read` covers intake visibility.
- `partner_prospect:*` covers lifecycle management.
- `partner_acquisition:approve` covers the approval gate.
- `partner_prospect:convert` covers the final conversion action.

---

## 9. Validation Rules

- UUIDs for tenant, actor, and entity ids.
- non-empty request and correlation ids.
- idempotency key required for all mutating requests.
- strict objects, no open payload shape.
- query pagination capped at 100.
- sort order limited to `asc` and `desc`.
- create lead/prospect must include source attribution and code.
- lifecycle mutation bodies must include `expectedVersion`.
- contract signed requires `signedAt`.
- convert requires `partnerId`, `partnerCode`, `partnerName`, and `partnerType`.

---

## 10. Versioning and Swagger Exposure

### Versioning

- canonical contract is `v1`.
- future controller mounting may add `/api/v1` without changing the contract semantics.

### Swagger

- future Swagger exposure should group these routes under `Partner Acquisition`.
- documentation must not reveal any direct repository or Prisma coupling.
- Swagger is future-only and does not authorize route registration now.

---

## 11. Architecture Boundaries

### Allowed path

`HTTP -> Command Handler -> Application Service -> Repository`

### Forbidden paths

- `HTTP -> Repository`
- `HTTP -> Prisma`
- `HTTP -> Opportunity`
- `HTTP -> Partner runtime`
- `HTTP -> Pipeline ownership`

### Domain separation

- `Opportunity` remains a customer commercial concern.
- `Partner Acquisition` remains acquisition and conversion.
- `Partner` remains the official downstream partner entity.
- `Pipeline` remains substrate/reference only.

---

## 12. Risk Matrix

| Risk | Level | Comment |
|---|---|---|
| Wrong surface translated directly to repository | High | Prevented by contract-only boundary. |
| Idempotency drift between HTTP and handler | Medium | Must reuse command inbox semantics. |
| RBAC mismatch | Medium | Must keep permission matrix aligned with domain contract. |
| Overexposure of legacy semantics | Medium | Avoid legacy field names and fallback APIs. |
| Opportunity coupling | High | Explicitly forbidden. |
| Future Swagger drift | Low | Controlled by this contract. |

---

## 13. Approval Criteria for H16R

H16R may begin only if:

- the contract files exist and typecheck,
- validation schemas parse the intended request shapes,
- endpoint inventory and RBAC matrix are stable,
- no runtime endpoint has been registered,
- no repository/service/Prisma shortcut has been introduced.

---

## 14. Coexistence With Legacy

- Youware remains historical evidence only.
- No legacy route pattern becomes a source of truth.
- No legacy fallback API may be introduced.
- No duplicate HTTP surface may be created for the same intent.

---

## 15. Scope Allowed for H16R

- implementation of HTTP controller contracts,
- route bootstrap planning,
- Fastify adapter design,
- request/response mapping layer,
- authentication/authorization wiring.

## 17. Runtime Alignment Note

The HTTP surface defined here is no longer a future-only design artifact.

It now matches the implemented Partner Acquisition Prospect runtime used by H18C/H19 and remains the canonical source for:

- route inventory,
- DTO shape,
- validation boundaries,
- RBAC mapping.

Any future runtime changes must preserve this contract first.

## 16. Scope Forbidden for H16R

- direct repository access from HTTP,
- direct Prisma access from HTTP,
- controller runtime registration if not contract-backed,
- menu/frontend changes,
- schema changes,
- migrations.
