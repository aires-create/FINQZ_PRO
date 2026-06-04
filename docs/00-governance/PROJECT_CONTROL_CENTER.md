# Document Inventory

## ACTIVE

### Governance

- PROJECT_CONTROL_CENTER.md

### Runtime

- RUN-001-RUNTIME_GOVERNANCE.md

### ADR

- ADR-001-commercial-api-source-of-truth.md
- ADR-002-provider-engine.md
- ADR-003-simulation-engine-source-of-truth.md
- ADR-004-commercial-master-catalog.md
- ADR-005-legacy-youware-backend-classification.md
- ADR-006-products-domain-decommission.md

### Standards

- CODING_STANDARDS.md
- ci-cd.md
- testing-strategy.md

---

## REVIEW_REQUIRED

### Runtime

- RUN-002-MIGRATION_MATRIX_REVIEW_REQUIRED.md

### Product

- EXECUTIVE_SUMMARY.md
- IMPLEMENTATION_ROADMAP.md
- README.md

### Architecture

- ARCHITECTURE_INDEX.md
- DOMAIN_MODEL_ARCHITECTURE.md
- BACKEND_FOLDER_STRUCTURE.md

- 01-dominios.md
- 02-entidades.md
- 03-relacionamentos.md
- 04-regras-operacionais.md
- 05-metricas-oficiais.md
- 06-eventos-operacionais.md
- 07-rbac.md
- 08-padroes-backend.md
- 09-padroes-frontend.md
- 10-roadmap-tecnico.md
- 11-backend-modelagem.md
- 12-integrations-domain.md

- api-migration-plan.md
- backend-modularization-plan.md
- domain-hierarchy.md
- domain-refactoring-plan.md
- domain-specialization-map.md
- frontend-domain-map.md
- runtime-decoupling-plan.md
- seed-specialization-plan.md

### Providers

- handmais-provider-audit.md
- sos-bolso-homologation-checklist.md

---

## DRAFT

### Governance Baseline

- PROJECT_CHARTER
- DOCUMENT_CLASSIFICATION
- SOURCE_OF_TRUTH_MATRIX
- EXECUTION_CHECKLIST
- DECISION_LOG
- ROADMAP_ENTERPRISE

---

## ARCHIVED

- current-state-audit.md

---

## WORKING TREE CLASSIFICATION

### COMMIT-01 — Governance Docs Base
Status: `APPROVED WITH EXCLUSIONS`

Approved files:
- `docs/00-governance/PROJECT_CONTROL_CENTER.md`
- `docs/00-governance/AUDIT_DOCUMENT_STANDARD.md`
- `docs/02-architecture/*` exceto exclusões abaixo
- `docs/03-runtime/RUN-001-RUNTIME_GOVERNANCE.md`
- `docs/05-adr/ADR-001-commercial-api-source-of-truth.md`
- `docs/05-adr/ADR-002-provider-engine.md`
- `docs/05-adr/ADR-003-simulation-engine-source-of-truth.md`
- `docs/05-adr/ADR-004-commercial-master-catalog.md`
- `docs/05-adr/ADR-005-legacy-youware-backend-classification.md`
- `docs/06-audits/AUD-002-SEED_SPECIALIZATION_PLAN_REVIEW_REQUIRED.md`
- `docs/06-audits/AUDIT_2026-06-03_PHASE_G25.txt`
- `docs/06-audits/AUDIT_2026-06-03_PHASE_G26_9.txt`
- `docs/06-audits/AUDIT_2026-06-03_STAGED_DOCS.txt`
- `docs/06-audits/AUDIT_2026-06-03_OPORTUNIDADES_DIFF.txt`
- `docs/08-standards/CODING_STANDARDS.md`
- `docs/08-standards/ci-cd.md`
- `docs/08-standards/testing-strategy.md`
- `docs/99-archive/*`
- `BACKEND_FOLDER_STRUCTURE.md`
- `CODING_STANDARDS.md`
- `EXECUTIVE_SUMMARY.md`
- `IMPLEMENTATION_ROADMAP.md`

Exclusions from COMMIT-01:
- `docs/02-architecture/ARCH-009-RBAC_REVIEW_REQUIRED.md`
- `docs/05-adr/ADR-006-products-domain-decommission.md`
- `docs/06-audits/AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md`
- `backend/src/tests/unit/integrations/provider-runtime-diagnostics.service.test.ts`

Notes:
- `docs/02-architecture/ARCH-009-RBAC_REVIEW_REQUIRED.md` remains `REVIEW_REQUIRED`.
- `backend/src/tests/unit/integrations/provider-runtime-diagnostics.service.test.ts` is classified separately as `REVIEW_REQUIRED` and must not be grouped with documentation.

### COMMIT-02 — Opportunity/Pipeline Foundation
Status: `APPROVED`

Files:
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/pipelines/**`
- `backend/src/modules/opportunities/dto/opportunities.dto.ts`
- `backend/src/tests/integration/opportunities.test.ts`
- `backend/src/tests/unit/opportunities.repository.test.ts`
- `backend/src/tests/unit/opportunities.routes.test.ts`
- `backend/src/tests/unit/opportunities.service.test.ts`
- `backend/src/tests/unit/opportunities.validator.test.ts`

Dependency:
- `Opportunity/Pipeline`

### COMMIT-03 — Scope Compatibility Layer
Status: `APPROVED`

Files:
- `backend/src/core/http/middleware.ts`
- `backend/src/types/index.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/opportunities/services/opportunities.service.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/opportunities/validators/opportunities.validator.ts`
- `backend/src/tests/unit/tenant-context.middleware.test.ts`

Dependency:
- `Scope Layer`

### COMMIT-04 — Products Decommission
Status: `BLOCKED`

Files:
- `docs/05-adr/ADR-006-products-domain-decommission.md`
- `src/api/adapters.ts`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/modules/index.ts`
- `src/api/modules/produtos.api.ts`
- `src/auth/permissions.ts`
- `src/components/layout/PageHeader.tsx`
- `src/components/pipeline/pipelineUtils.ts`
- `src/config/environment.ts`
- `src/layouts/MainLayout.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Relatorios.tsx`
- `src/pages/Produtos.tsx`
- `src/store/index.ts`
- `src/types/index.ts`

Dependency:
- `Products Decommission`

Status notes:
- `src/pages/Oportunidades.tsx` is `MIXED`:
  - `Products Decommission`
  - `Frontend Review`

### COMMIT-05 — Seed Governance
Status: `BLOCKED`

Files:
- `backend/prisma/seed.ts`
- `docs/06-audits/AUDIT_2026-06-04_SEED_GOVERNANCE_AUDIT.md`

Dependency:
- `Seed Governance`

### COMMIT-06 — Frontend Review
Status: `REVIEW_REQUIRED`

Files:
- `src/api/modules/opportunities.api.ts`
- `src/pages/Clientes.tsx`
- `src/pages/Oportunidades.tsx`

Dependency:
- `Frontend Review`

Special note:
- `src/pages/Oportunidades.tsx` is `MIXED`:
  - `Products Decommission`
  - `Frontend Review`

### REVIEW_REQUIRED — Separate Test Artifact
Status: `REVIEW_REQUIRED`

File:
- `backend/src/tests/unit/integrations/provider-runtime-diagnostics.service.test.ts`

Category:
- `TEST`

Dependency:
- `Nenhuma`

Note:
- This file is not documentation and must stay out of COMMIT-01.

## ORDEM SEGURA DE COMMIT

1. `Governance Docs Base`
2. `Opportunity/Pipeline Foundation`
3. `Scope Compatibility Layer`
4. `Products Decommission — BLOCKED`
5. `Seed Governance — BLOCKED`
6. `Frontend Review — REVIEW_REQUIRED`

======================================================
PHASE G26.9 COMPLETED
======================================================

Architecture Consolidation Review completed.

Validated:
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
- ADR-007

Validated Architecture:
- ARCH-001
- ARCH-002
- ARCH-003
- ARCH-004
- ARCH-005
- ARCH-008
- ARCH-009
- ARCH-010
- ARCH-011
- ARCH-014
- ARCH-015

Next Official Phase:
G26.10 — Documentation Promotion Plan

Rule:
No code changes before documentation promotion review.
