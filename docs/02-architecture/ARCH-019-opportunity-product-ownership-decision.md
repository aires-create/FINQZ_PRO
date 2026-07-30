# ARCH-019 - Opportunity Product Ownership Decision

Status: Proposed / Decision Record
Scope: Opportunity / Master Catalog / Commercial Tables / Negotiation Boundary

## 1. Executive Summary

The FINQZ PRO architecture already establishes that:

- Master Catalog owns the product taxonomy;
- Commercial Tables owns commercial conditions;
- Opportunity is the operational commercial entity that carries the business lifecycle.

However, the current Opportunity contract does not persist `productId`, `subproductId`, or `modalityId`, while the frontend UI already allows the user to select Product, Subproduct and Modality. This creates a gap between UI state, read models, and the backend source of truth.

This document formalizes the ownership decision for the "product of the opportunity" and defines the minimum safe contract extension for the next backend-first phase.

Recommended decision: **Alternative B** as the minimum enterprise-safe choice.

## 2. Context from H17-L, H17-M and H17-N

### H17-L

- Opportunity creation works through `POST /api/v1/opportunities/intake`.
- `amount` is persisted correctly.
- The Kanban advancement rule blocks movement to Negotiation when Product is missing.
- The UI already captures Product, Subproduct and Modality, but the contract does not persist them.

### H17-M

- The current Opportunity model does not contain product ownership fields.
- The schema does not define `productId`, `subproductId` or `modalityId` on `Opportunity`.
- The rule for advancing to Negotiation still requires Product + Value.

### H17-N

- Architectural audit returned: `GO WITH RESTRICTIONS`.
- The audit confirmed that a contract or migration for Opportunity product ownership is not yet authorized in the current runtime state.

## 3. Official Sources Audited

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/02-architecture/ARCH-004-ENTITIES_MODEL_REVIEW_REQUIRED.md`
- `docs/02-architecture/ARCH-005-RELATIONSHIPS_REVIEW_REQUIRED.md`
- `docs/02-architecture/ARCH-016-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`
- `docs/02-architecture/ARCH-017-WORKSPACE-OWNERSHIP-MATRIX.md`
- `docs/02-architecture/ARCH-018-DOMAIN-BOUNDARY-MATRIX.md`
- `docs/02-architecture/H15-B-opportunity-pipeline-contract-ownership-closure.md`
- `backend/prisma/schema.prisma`
- `backend/src/modules/opportunities/**`
- `backend/src/modules/master-catalog/**`
- `src/pages/Oportunidades.tsx`
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/master-catalog.api.ts`

## 4. Current State

### 4.1 Opportunity

- Backend-owned domain.
- Production Ready in the DCA.
- Current schema persists `amount`, `pipelineId`, `stageId`, `customerId`, `partnerId`, `ownerId` and lifecycle fields.
- No product ownership fields exist today.

### 4.2 Master Catalog

- Owns the official product taxonomy.
- Product hierarchy exists as:
  - Product
  - Subproduct
  - Modality
- This is the canonical source of product structure, codes and names.

### 4.3 Commercial Tables

- Owns commercial conditions.
- Uses catalog references such as `productId`, `subproductId` and `modalityId`.
- It is not the Master Catalog.
- It is not the Opportunity.

### 4.4 Frontend Oportunidades

- The UI already exposes Product, Subproduct and Modality selectors.
- The current intake payload does not persist those fields into the official Opportunity contract.
- The Kanban rule checks for Product presence during advancement.

### 4.5 Rule for advancement to Negotiation

- The current business rule requires Product + Value.
- Value is persisted as `amount`.
- Product is not persisted in the Opportunity contract today, which explains the refresh / rehydration gap.

## 5. Analysis of Alternatives

### Alternative A - Opportunity stores only `productId`

Pros:

- Smallest possible contract extension.
- Enough to identify the selected product canonically.

Cons:

- Incomplete for preserving the full hierarchy chosen by the user.
- Leaves Subproduct and Modality unresolved.
- Weakens auditability of the commercial selection.

Verdict:

- Not enough for the current UI and negotiation boundary.

### Alternative B - Opportunity stores `productId`, `subproductId` and `modalityId`

Pros:

- Minimum enterprise-safe model.
- Preserves the full commercial hierarchy selected by the user.
- Supports rehydration of the Kanban and rule validation after refresh.
- Keeps the selection canonical without forcing snapshot duplication.

Cons:

- Requires backend-first schema and contract extension.
- Requires validation to ensure hierarchy consistency.

Verdict:

- **Recommended minimum safe decision.**

### Alternative C - Opportunity stores IDs + snapshot history

Pros:

- Stronger audit trail.
- Better historical resilience against catalog renames.

Cons:

- Higher duplication risk.
- Greater complexity in mappers, validators and read models.
- Increases the chance of divergence if snapshot is treated as truth.

Verdict:

- Viable only if the business explicitly requires a historical snapshot in the Opportunity aggregate.
- Not necessary for the minimum safe decision.

### Alternative D - Opportunity does not store product

Pros:

- Preserves the current model.

Cons:

- Does not solve the negotiation rule.
- Does not solve Kanban rehydration.
- Keeps the UI and backend contract inconsistent.

Verdict:

- Rejected for the current need.

## 6. Recommended Decision

### Decision

Adopt **Alternative B**:

- `productId` nullable
- `subproductId` nullable
- `modalityId` nullable

All three fields should reference Master Catalog records and be owned by Opportunity as part of the commercial selection context.

### Why B is the minimum safe enterprise choice

- It aligns the UI with the backend source of truth.
- It solves the current Product + Value block for Negotiation.
- It preserves the commercial hierarchy chosen by the user.
- It avoids unnecessary duplication of product names and codes as canonical write data.
- It keeps Commercial Tables free to own conditions instead of being overloaded as the product owner.

## 7. Boundary Between Domains

### Master Catalog

Source of truth for:

- taxonomy;
- hierarchy;
- product names;
- product codes;
- subproduct names;
- modality names;
- active/inactive status;
- display order.

### Commercial Tables

Source of truth for:

- commercial conditions;
- rates;
- terms;
- provider association;
- eligibility / pricing rules;
- catalog-conditioned commercial scenarios.

### Opportunity

Source of truth for:

- customer-specific commercial selection;
- pipeline context;
- stage context;
- negotiation lifecycle;
- persistence of the selected commercial hierarchy through IDs.

### Snapshot / Historical Read Model

Source of truth:

- **No** for business ownership.
- **Yes** only as a read model or historical projection when needed.

Rule:

- Snapshot fields must never become the canonical write source.
- If snapshot data is exposed, it must be identifiable as derived or historical.

## 8. Source of Truth Definitions

### Taxonomy

- Master Catalog.

### Commercial conditions

- Commercial Tables.

### Selected commercial context of the opportunity

- Opportunity via `productId`, `subproductId`, `modalityId`.

### Historical snapshot

- Read model only.
- Optional derived fields in response payloads.
- Not canonical source of truth.

## 9. When the Selected Product Becomes "Product of the Opportunity"

The selected product becomes the product of the opportunity when it is persisted on the Opportunity aggregate during create or update/intake flow.

This means:

- the UI selection alone is not enough;
- the persisted Opportunity record must carry the selected Master Catalog IDs;
- rehydration must read those IDs back from the backend.

## 10. When It Becomes "Product Contracted"

The product is not "contracted" at selection time.

It becomes contracted only when the business reaches the appropriate downstream lifecycle stage, such as:

- proposal approval;
- operation creation;
- contract issuance;
- any other formal conversion stage defined by the business.

So:

- **Product of the Opportunity** = selected commercial context persisted on Opportunity.
- **Product Contracted** = later lifecycle event, not the same thing.

## 11. Should Commercial Tables Be Referenced Now?

Commercial Tables should remain a related domain, but not the owner of Opportunity product ownership.

Current recommendation:

- do not make Opportunity depend on Commercial Tables as its product source of truth;
- keep Commercial Tables as the conditions domain;
- allow future flows to consume Commercial Tables for pricing, proposal and eligibility.

This avoids boundary pollution between:

- catalog taxonomy;
- commercial conditions;
- operational opportunity lifecycle.

## 12. Proposed Target Contract for H17-O

### 12.1 Prisma

Suggested nullable fields on `Opportunity`:

- `productId String?`
- `subproductId String?`
- `modalityId String?`

Suggested relations:

- `product` -> `MasterCatalogProduct`
- `subproduct` -> `MasterCatalogSubproduct`
- `modality` -> `MasterCatalogModality`

Suggested ownership rule:

- prefer `Restrict` on delete, or an equivalent catalog soft-delete strategy, so historical opportunities do not lose their reference semantics.

### 12.2 DTOs / Validators

Extend the existing opportunity intake and update contracts to accept:

- `productId`
- `subproductId`
- `modalityId`

Validation rules:

- fields are nullable for backward compatibility;
- `subproductId` must belong to `productId` when both are present;
- `modalityId` must belong to `subproductId` when both are present;
- tenant scope must be enforced;
- active catalog state should be validated when the business requires it.

### 12.3 Services

The create/update/intake service should:

- validate hierarchy consistency;
- persist the selected IDs;
- keep existing `amount` behavior unchanged;
- preserve current pipeline and stage ownership rules.

### 12.4 Read Models / GET /api/v1/opportunities

The read mapper should return:

- persisted IDs;
- optional derived catalog details for UX;
- product labels and hierarchy only as read model data.

### 12.5 Frontend Oportunidades

The frontend should:

- send the selected IDs;
- read them back from the API;
- use them to rehydrate the form and Kanban card;
- stop depending on UI-only product state for business rules.

## 13. Nullability and Compatibility

The product ownership fields must be nullable for compatibility with existing opportunities.

Reason:

- old records do not have product ownership persisted yet;
- the system must remain operable during migration;
- the negotiation rule can still block missing product when required.

Compatibility rule:

- existing opportunities remain valid records;
- only the new contract path will write the product ownership fields;
- backfill can be introduced later if business demands it.

## 14. Risks and Mitigation

### Risk 1 - Frontend-only fix

Impact:

- the UI may look correct, but the backend will still forget the product after refresh.

Mitigation:

- backend-first contract extension.

### Risk 2 - Duplicate product data in Opportunity

Impact:

- divergence between catalog names/codes and Opportunity state.

Mitigation:

- keep IDs canonical;
- treat any snapshot as derived/read model only.

### Risk 3 - Opportunity not persisting product

Impact:

- Negotiation rule remains blocked.
- Kanban rehydration remains inconsistent.

Mitigation:

- add nullable product ownership fields and persist them in intake/update.

### Risk 4 - Boundary pollution with Commercial Tables

Impact:

- conditions and product taxonomy become mixed.

Mitigation:

- maintain strict separation:
  - Master Catalog = taxonomy;
  - Commercial Tables = conditions;
  - Opportunity = selection context.

## 15. Impact Assessment

### Prisma

- new nullable columns and relations on Opportunity;
- migration required.

### DTOs

- intake/update/get contracts need extension.

### Validators

- hierarchy and tenant consistency checks required.

### Services

- persist IDs and validate catalog ownership.

### GET /api/v1/opportunities

- must rehydrate product ownership data for the Kanban and detail views.

### POST /api/v1/opportunities/intake

- must accept the selected commercial hierarchy.

### Frontend Oportunidades

- submit selected IDs;
- render product state from response.

### Kanban

- validation for advancement to Negotiation should read the persisted product ownership.

### Commercial Tables

- remains a separate condition engine.

### Master Catalog

- remains the taxonomy owner.

## 16. Safe Order of Implementation

1. Backend-first contract decision.
2. Prisma migration for nullable product ownership fields.
3. DTO and validator extension.
4. Service persistence and hierarchy validation.
5. Read model / mapper update.
6. Frontend submit update.
7. Frontend rehydration update.
8. Kanban validation alignment.
9. Automated tests.

## 17. Acceptance Criteria for H17-O

- Opportunity can persist selected product ownership fields.
- Old opportunities remain valid.
- Kanban can rehydrate product data after refresh.
- Negotiation rule can detect persisted product ownership.
- Master Catalog remains taxonomy owner.
- Commercial Tables remains conditions owner.
- No duplicated canonical source of truth is introduced.

## 18. Final Recommendation

### Recommended path

- **GO WITH RESTRICTIONS**

Meaning:

- go forward only with a backend-first contract extension;
- use nullable IDs as the minimum safe model;
- keep any snapshot as read model only;
- do not implement product ownership in frontend-only form;
- update the DCA later to reflect the final ownership boundary.

### What is not approved by this decision

- frontend-only workaround;
- product storage in arbitrary existing fields;
- snapshot as canonical source of truth;
- reuse of title, description or status to carry product ownership;
- runtime legacy fallback as truth.
