# H15-G — Pipeline Ownership Transition Architecture

Status: DRAFT  
Type: Architecture Transition Plan  
Scope: Opportunity / Pipeline / Stage  
Date: 2026-06-19  

---

## 1. Executive Summary

Pipeline is architecturally backend-owned, but operationally still hybrid.

The backend already owns read behavior through Prisma, repository, service and route.

However, frontend still owns operational behavior through:

- src/pages/Oportunidades.tsx
- src/pages/admin/Pipelines.tsx
- src/config/pipelines.ts
- src/data/catalogRepository.ts
- src/store/index.ts
- localStorage pipeline settings
- Product to Pipeline heuristics

Therefore, Pipeline cannot yet be declared full backend owner.

Verdict:

GO WITH RESTRICTIONS

---

## 2. Source Audits

This transition plan is based on:

- AUD-H15-A — Opportunity & Pipeline Runtime Reality Audit
- AUD-H15-B — Opportunity Frontend Dependency Audit
- AUD-H15-C — Pipeline Backend Reality Audit
- AUD-H15-D — Pipeline Backend Ownership Gap Closure Plan
- AUD-H15-E — Opportunity & Pipeline Dependency Graph Audit
- AUD-H15-F — Pipeline Migration Readiness Audit

---

## 3. Current Ownership Reality

| Domain | Official Owner | Runtime Reality |
|---|---|---|
| Pipeline | Backend | Hybrid |
| Stage | Backend | Hybrid |
| Opportunity | Backend | Mostly modern |
| Pipeline UI | Frontend | Hybrid consumer + local owner |
| Pipeline Settings | Backend intended | Frontend/localStorage current |

---

## 4. KEEP

- backend/prisma/schema.prisma
- backend/src/modules/pipelines/routes.ts
- backend/src/modules/pipelines/service.ts
- backend/src/modules/pipelines/repository.ts
- backend/src/modules/opportunities/routes.ts
- backend/src/modules/opportunities/services/opportunities.service.ts
- backend/src/modules/opportunities/repositories/opportunities.repository.ts
- src/api/modules/opportunities.api.ts
- src/routes/crm.routes.tsx

---

## 5. MIGRATE

- src/pages/Oportunidades.tsx
- src/api/modules/index.ts
- pipeline read consumption in frontend
- stage read consumption in frontend
- useAppStore operational state to UI-only state

---

## 6. QUARANTINE

- src/pages/admin/Pipelines.tsx
- src/config/pipelines.ts
- src/data/catalogRepository.ts
- src/data/commercialRepository.ts
- src/store/index.ts
- src/types/index.ts
- src/types/api.ts
- localStorage pipeline settings

---

## 7. REMOVE LATER

- src/api/modules/oportunidades.api.ts
- Product to Pipeline heuristics
- LEGACY_PIPELINE_IDS_BY_CATALOG
- mapearProdutoLegadoParaPipeline
- frontend-owned pipeline settings
- frontend-owned stage settings

---

## 8. Transition Waves

### Wave 0 — Freeze Legacy Surface

Goal:

Freeze legacy behavior and prevent new features from being added to local pipeline governance.

Rules:

- Do not add features to admin/Pipelines.tsx.
- Do not expand src/config/pipelines.ts.
- Do not add new localStorage pipeline keys.
- Do not add new Product to Pipeline heuristics.
- Do not add new consumers of oportunidades.api.ts.

Status:

Architecture only.

---

### Wave 1 — API Surface Consolidation

Goal:

Make frontend API surface reflect official ownership.

Expected direction:

- opportunities.api.ts becomes official Opportunity frontend client.
- oportunidades.api.ts remains quarantined until safe removal.
- src/api/modules/index.ts stops promoting legacy API surface.
- Future pipelines.api.ts must be created only after backend contract is approved.

Blocked items:

- Removing oportunidades.api.ts immediately remains blocked until final zero-consumer validation.

---

### Wave 2 — Backend Pipeline Read Consumption

Goal:

Make Oportunidades.tsx consume backend Pipeline/Stage read model as primary source.

Backend already supports:

- GET pipelines
- tenant scoped read
- RBAC pipeline:read
- active pipelines
- active stages ordered by order

Frontend must stop treating config/pipelines.ts as source of truth.

Allowed future direction:

- pipeline selection from backend
- stage list from backend
- no frontend stage ownership

Not allowed:

- frontend creating stages
- frontend reordering stages locally
- frontend creating pipelines locally

---

### Wave 3 — Frontend Source-of-Truth Removal

Goal:

Turn frontend legacy pipeline state into compatibility-only layer.

Targets:

- catalogRepository no longer owns pipeline settings
- config/pipelines.ts no longer owns pipeline definition
- useAppStore no longer owns pipelines/currentPipelineId/oportunidadesKanban as operational truth
- localStorage pipeline settings no longer defines runtime

This wave is blocked until Wave 2 succeeds.

---

### Wave 4 — Backend Write Ownership

Goal:

Backend becomes full operational owner of Pipeline and Stage.

Required backend capabilities:

- create pipeline
- update pipeline
- soft delete pipeline
- create stage
- update stage
- soft delete stage
- reorder stages
- RBAC write permissions
- validators
- service contract
- repository contract
- route tests
- service tests
- repository tests
- Swagger/OpenAPI exposure

This wave must not start before contracts are approved.

---

### Wave 5 — Legacy Decommission

Goal:

Remove or retire legacy artifacts after backend ownership is complete.

Candidates:

- oportunidades.api.ts
- Product to Pipeline heuristics
- catalogRepository pipeline ownership
- config/pipelines.ts pipeline ownership
- admin/Pipelines.tsx local write mode
- localStorage pipeline settings

---

## 9. Explicit NO-GO Actions

Do not:

- Remove catalogRepository first.
- Remove config/pipelines.ts first.
- Remove useAppStore pipeline/currentPipelineId/oportunidadesKanban first.
- Make admin/Pipelines.tsx read-only before backend write ownership exists.
- Remove oportunidades.api.ts before final zero-consumer validation.
- Remove Product to Pipeline heuristics before Oportunidades.tsx no longer depends on them.
- Add new local pipeline behavior to frontend.

---

## 10. Go-Live Risk

| Area | Risk |
|---|---|
| CRM | Critical |
| Pipeline | Critical |
| Coverage | Medium |
| Commercial Tables | Medium |
| Simulator | Medium |
| Permissions | Low |

---

## 11. Final Verdict

Pipeline can be considered backend-owned for read.

Pipeline cannot yet be considered backend-owned for write.

The correct path is controlled transition, not immediate deletion.

Final status:

GO WITH RESTRICTIONS
