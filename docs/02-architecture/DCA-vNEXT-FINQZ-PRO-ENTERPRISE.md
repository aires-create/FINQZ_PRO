# DCA vNext — FINQZ PRO Enterprise

Status: DRAFT
Priority: P0 — Critical Architecture Asset
Document Type: Master Continuity Architecture
Scope: FINQZ PRO Enterprise
Created At: 2026-06-19

---

## 1. Executive Summary

This document is the master continuity reference for FINQZ PRO Enterprise.

It consolidates the current architectural state, official domain ownership, runtime reality, known legacy areas, Go-Live priorities, future tracks, and operational restrictions.

This DCA does not replace ARCH, RFC, or AUD documents. It acts as the executive continuity layer above them.

---

## 2. Mandatory Architectural Principles

- Backend First
- Tenant Scoped
- RBAC Driven
- Auditable
- Provider Driven
- Event Ready
- Single Source of Truth
- Contracts Before Runtime
- Architecture Before Implementation
- No Legacy
- No Duplicate Sources

Mandatory flow:

Analyze → Map → Document → Validate → Implement → Test → Consolidate

---

## 3. Official Domain Ownership Matrix

| Domain | Official Owner | Responsibility |
|---|---|---|
| Customer | CRM | Customer identity, registration data, commercial relationship |
| Partner | Partner Domain | Commercial identity, structure and operational scope |
| Opportunity | CRM / Opportunity Domain | Central business entity connecting customer, product, pipeline, coverage, provider, simulation and operation |
| Pipeline | Pipeline Domain | Operational stage/status flow of an opportunity |
| Product | Master Catalog | Canonical product taxonomy |
| Subproduct | Master Catalog | Canonical subproduct taxonomy |
| Modality | Master Catalog | Canonical modality taxonomy |
| Segment | Master Catalog | Parallel market/commercial dimension |
| Commercial Coverage | Commercial Coverage | Defines whether something can be sold |
| Commercial Tables | Commercial Tables | Defines commercial conditions, coefficients and rates |
| Provider | Provider Engine | External provider integration translated into internal contracts |
| Simulator | Simulator | Calculates offer, feasibility, return and commission projections |
| Commission | Commission Engine | Backend-only commission distribution model |
| Operation | Operation Domain | Operational lifecycle after opportunity materialization |
| Marketplace | Future Marketplace Domain | Future controlled commercial distribution layer |

---

## 4. Runtime Reality Matrix

| Domain | Runtime Reality | Status |
|---|---|---|
| Master Catalog | Modern backend, API, Swagger, HML | GO |
| Commercial Coverage | Canonical implementation, HML | GO |
| Opportunity | Modern backend exists, but EdgeSpark legacy still coexists | GO WITH RESTRICTIONS |
| Pipeline | Backend owner exists, but frontend still governs settings/stages partially | GO WITH RESTRICTIONS |
| Customer | Functional, still evolving | ACTIVE |
| Partner | Audited and frozen | PLANNED / NOT AUTHORIZED FOR IMPLEMENTATION |
| Commercial Tables | Architecture defined, implementation pending/controlled | NEXT GO-LIVE TRACK |
| Simulator | Consumes Coverage, Commercial Tables and Provider | GO-LIVE TRACK |
| Commission Engine | Architecture defined, runtime not started | FUTURE TRACK |
| Provider Engine | Planned controlled integrations | FUTURE TRACK |
| Marketplace | Future | FUTURE TRACK |

---

## 5. Legacy Quarantine Registry

Known legacy or transitional areas:

| Item | Classification | Notes |
|---|---|---|
| Dashboard | QUARANTINE | Youware legacy |
| Relatorios | QUARANTINE | Youware legacy |
| Roteiros Operacionais | QUARANTINE | Youware legacy |
| Estrutura Comercial | QUARANTINE | Legacy transition screen |
| store/index.ts | QUARANTINE | Legacy/global frontend state |
| creditPfCatalog | REMOVE LATER | Legacy catalog source |
| catalogRepository | QUARANTINE / REMOVE LATER | Still affects frontend flows |
| commercialRepository | QUARANTINE / REMOVE LATER | Still affects simulator/tables |
| EdgeSpark remnants | QUARANTINE / REMOVE LATER | Especially /api/oportunidades |
| config/pipelines.ts | MIGRATE | Frontend pipeline settings source |
| localStorage pipeline ownership | MIGRATE | Must move to backend/API ownership |
| Product to Pipeline heuristics | REMOVE LATER | Violates ownership separation |

---

## 6. Current Official Phase

Current completed phase:

AUD-H15-A — Opportunity & Pipeline Runtime Reality Audit

Verdict:

GO WITH RESTRICTIONS

Key findings:

- Opportunity has modern backend runtime.
- Opportunity still coexists with EdgeSpark legacy under /api/oportunidades.
- Pipeline has official backend owner.
- Frontend still governs pipeline settings and stages through catalogRepository and localStorage.
- Oportunidades.tsx remains hybrid.
- useAppStore remains active in frontend opportunity flow.
- config/pipelines.ts still influences behavior.
- Product to Pipeline heuristics still exist.
- No dedicated frontend pipelinesApi exists yet.
- Prisma already contains official Pipeline, Stage and Opportunity models.

---

## 7. Go-Live Track Priorities

Official operational priorities:

1. CRM
2. Pipeline
3. Commercial Coverage
4. Commercial Tables
5. Simulator
6. Permissions / RBAC

Rules:

- Do not invest new functional work into quarantined legacy screens.
- Do not create parallel APIs.
- Do not recreate validated modules.
- Do not let frontend define backend-owned domains.
- Do not let Provider define canonical catalog.
- Do not let Commercial Tables define catalog, coverage or commission.

---

## 8. Future Tracks

Approved future tracks, not authorized for immediate implementation unless explicitly promoted:

- Partner Modernization
- Commission Engine
- Provider Engine Expansion
- Marketplace
- Operation Lifecycle Expansion
- Backoffice Expansion

Partner Modernization current status:

- PLANNED
- APPROVED FOR FUTURE EXECUTION
- NOT AUTHORIZED FOR IMPLEMENTATION YET

Relevant documents:

- AUD-G1-B
- AUD-G1-C
- AUD-G1-D
- AUD-G1-E
- AUD-G2-A
- AUD-G2-B
- AUD-G2-C
- AUD-G2-D
- PARTNER-MODERNIZATION-TRACK-STATUS

---

## 9. Documentation Governance

Official architecture folder:

docs/02-architecture/

Official audit folder:

docs/06-audits/

Current known document layers:

| Layer | Purpose |
|---|---|
| ARCH-* | Architecture decisions and blueprints |
| RFC-* | Architecture proposals |
| AUD-* | Evidence, audits and factual runtime reviews |
| DCA-vNext | Master continuity architecture |

Known governance issue:

There are two ARCH-066 documents:

- ARCH-066-commercial-structure-runtime-readiness-review.md
- ARCH-066-coverage-transition-governance.md

Classification:

LOW RISK — Documentation governance issue.

Future action:

Normalize numbering without changing architectural meaning.

---

## 10. Next Official Phase

After DCA review and approval:

AUD-H15-B — Opportunity Frontend Dependency Audit

Objective:

Map and classify frontend dependencies around Opportunity and Pipeline:

- Oportunidades.tsx
- useAppStore
- catalogRepository
- config/pipelines.ts
- EdgeSpark remnants
- Product to Pipeline heuristics
- localStorage ownership
- absence of pipelinesApi

Expected result:

- KEEP
- MIGRATE
- QUARANTINE
- REMOVE LATER

Possible verdicts:

- GO
- GO WITH RESTRICTIONS
- NO-GO

---

## 11. Executive Verdict

FINQZ PRO Enterprise architecture is consolidated enough to require a master continuity document.

DCA vNext is now the official executive continuity reference for the project.

Current executive status:

- Architecture: CONSOLIDATED
- Master Catalog: GO
- Commercial Coverage: GO
- Partner: AUDITED AND FROZEN
- Customer: ACTIVE / EVOLVING
- Opportunity: GO WITH RESTRICTIONS
- Pipeline: GO WITH RESTRICTIONS
- Go-Live Track: ACTIVE

DCA vNext must be reviewed and kept updated after every major audit, implementation wave or go-live decision.
